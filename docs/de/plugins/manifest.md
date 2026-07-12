---
read_when:
    - Sie entwickeln ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Validierungsfehler eines Plugins debuggen
summary: Anforderungen an Plugin-Manifest und JSON-Schema (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-07-12T15:33:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Diese Seite behandelt das **native OpenClaw-Plugin-Manifest** `openclaw.plugin.json`. Informationen zu kompatiblen Bundle-Layouts (Codex, Claude, Cursor) finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden stattdessen eigene Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Layouts automatisch, validiert sie jedoch nicht anhand des unten beschriebenen Schemas von `openclaw.plugin.json`. Bei einem kompatiblen Bundle liest OpenClaw die Bundle-Metadaten, deklarierten Skill-Stammverzeichnisse, Claude-Befehlsstammverzeichnisse, Claude-Standardwerte aus `settings.json`, Claude-LSP-Standardwerte und unterstützten Hook-Pakete, sofern das Layout den Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** `openclaw.plugin.json` im **Plugin-Stammverzeichnis** enthalten. OpenClaw liest die Datei, um die Konfiguration zu validieren, **ohne Plugin-Code auszuführen**. Ein fehlendes oder ungültiges Manifest verhindert die Konfigurationsvalidierung und wird als Plugin-Fehler behandelt.

Eine vollständige Anleitung zum Plugin-System finden Sie unter [Plugins](/de/tools/plugin). Informationen zum nativen Funktionsmodell und aktuelle Hinweise zur externen Kompatibilität finden Sie unter [Funktionsmodell](/de/plugins/architecture#public-capability-model).

## Zweck dieser Datei

`openclaw.plugin.json` enthält Metadaten, die OpenClaw **vor dem Laden Ihres Plugin-Codes** liest. Alle darin enthaltenen Angaben müssen sich ohne Starten der Plugin-Laufzeit mit geringem Aufwand prüfen lassen.

**Verwenden Sie die Datei für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurationsoberfläche
- Metadaten für Authentifizierung, Onboarding und Einrichtung (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Steuerungsebenen
- abgekürzte Zuständigkeit für Modellfamilien
- statische Momentaufnahmen der Funktionszuständigkeit (`contracts`)
- Metadaten für den QA-Runner, die der gemeinsame `openclaw qa`-Host prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie die Datei nicht für:** die Registrierung von Laufzeitverhalten, die Deklaration von Code-Einstiegspunkten oder npm-Installationsmetadaten. Diese gehören in Ihren Plugin-Code und in `package.json`.

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

| Feld                                 | Erforderlich | Typ                          | Bedeutung                                                                                                                                                                                                                                                                  |
| ------------------------------------ | ------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                     | Kanonische Plugin-ID. Diese ID wird in `plugins.entries.<id>` verwendet.                                                                                                                                                                                                    |
| `configSchema`                       | Ja           | `object`                     | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                                                                    |
| `requiresPlugins`                    | Nein         | `string[]`                   | Plugin-IDs, die ebenfalls installiert sein müssen, damit dieses Plugin wirksam wird. Bei der Erkennung bleibt das Plugin ladbar, es wird jedoch gewarnt, wenn ein erforderliches Plugin fehlt.                                                                               |
| `enabledByDefault`                   | Nein         | `true`                       | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie den Eintrag weg oder legen Sie einen anderen Wert als `true` fest, damit das Plugin standardmäßig deaktiviert bleibt.                                                                           |
| `enabledByDefaultOnPlatforms`        | Nein         | `string[]`                   | Kennzeichnet ein gebündeltes Plugin nur auf den aufgeführten Node.js-Plattformen als standardmäßig aktiviert, beispielsweise `["darwin"]`. Eine explizite Konfiguration hat weiterhin Vorrang.                                                                              |
| `legacyPluginIds`                    | Nein         | `string[]`                   | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                   | Provider-IDs, bei deren Erwähnung in Authentifizierung, Konfiguration oder Modellreferenzen dieses Plugin automatisch aktiviert werden soll.                                                                                                                               |
| `kind`                               | Nein         | `PluginKind \| PluginKind[]` | Deklariert eine oder mehrere exklusive Plugin-Arten (`"memory"`, `"context-engine"`), die von `plugins.slots.*` verwendet werden. Ein Plugin, dem beide Slots gehören, deklariert beide Arten in einem Array.                                                                |
| `channels`                           | Nein         | `string[]`                   | Kanal-IDs, die diesem Plugin gehören. Wird für die Erkennung und Konfigurationsvalidierung verwendet.                                                                                                                                                                       |
| `providers`                          | Nein         | `string[]`                   | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                                                                    |
| `providerCatalogEntry`               | Nein         | `string`                     | Pfad zum schlanken Provider-Katalogmodul relativ zum Plugin-Stammverzeichnis für manifestbezogene Provider-Katalogmetadaten, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.                                                                 |
| `modelSupport`                       | Nein         | `object`                     | Manifesteigene Kurzform-Metadaten zur Modellfamilie, mit denen das Plugin vor der Laufzeit automatisch geladen wird.                                                                                                                                                        |
| `modelCatalog`                       | Nein         | `object`                     | Deklarative Modellkatalogmetadaten für Provider, die diesem Plugin gehören. Dies ist der Steuerungsebenenvertrag für zukünftige schreibgeschützte Auflistungen, das Onboarding, die Modellauswahl, Aliasse und die Unterdrückung, ohne die Plugin-Laufzeit zu laden.            |
| `modelPricing`                       | Nein         | `object`                     | Providereigene Richtlinie zur externen Preisabfrage. Verwenden Sie sie, um lokale oder selbst gehostete Provider von Remote-Preiskatalogen auszunehmen oder Provider-Referenzen OpenRouter-/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Kern fest zu codieren.        |
| `modelIdNormalization`               | Nein         | `object`                     | Providereigene Bereinigung von Modell-ID-Aliassen und -Präfixen, die ausgeführt werden muss, bevor die Provider-Laufzeit geladen wird.                                                                                                                                      |
| `providerEndpoints`                  | Nein         | `object[]`                   | Manifesteigene Host-/baseUrl-Metadaten für Endpunkte von Provider-Routen, die der Kern klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                                                                       |
| `providerRequest`                    | Nein         | `object`                     | Kostengünstige Metadaten zur Provider-Familie und Anfragekompatibilität, die von der generischen Anfragerichtlinie verwendet werden, bevor die Provider-Laufzeit geladen wird.                                                                                              |
| `secretProviderIntegrations`         | Nein         | `Record<string, object>`     | Deklarative Voreinstellungen für SecretRef-Ausführungs-Provider, die Einrichtungs- oder Installationsoberflächen anbieten können, ohne providerspezifische Integrationen im Kern fest zu codieren.                                                                          |
| `cliBackends`                        | Nein         | `string[]`                   | IDs der CLI-Inferenz-Backends, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start anhand expliziter Konfigurationsreferenzen verwendet.                                                                                                            |
| `syntheticAuthRefs`                  | Nein         | `string[]`                   | Provider- oder CLI-Backend-Referenzen, deren plugineigener Hook für synthetische Authentifizierung während der anfänglichen Modellerkennung geprüft werden soll, bevor die Laufzeit geladen wird.                                                                           |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                   | Platzhalterwerte für API-Schlüssel im Besitz gebündelter Plugins, die einen nicht geheimen lokalen, OAuth- oder umgebungsbezogenen Anmeldedatenstatus darstellen.                                                                                                            |
| `commandAliases`                     | Nein         | `object[]`                   | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit pluginbezogene Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                                                                                    |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`   | Veraltete Kompatibilitätsmetadaten zu Umgebungsvariablen für die Abfrage von Provider-Authentifizierung und -Status. Bevorzugen Sie für neue Plugins `setup.providers[].envVars`; OpenClaw liest dies während des Übergangszeitraums der Veraltung weiterhin.                  |
| `providerUsageAuthEnvVars`           | Nein         | `Record<string, string[]>`   | Provider-Anmeldedaten, die ausschließlich für Nutzung und Abrechnung bestimmt sind. OpenClaw verwendet diese Namen zur Nutzungserkennung und Bereinigung geheimer Daten, jedoch niemals für die Inferenz-Authentifizierung.                                                  |
| `providerAuthAliases`                | Nein         | `Record<string, string>`     | Provider-IDs, die zur Authentifizierungsabfrage eine andere Provider-ID wiederverwenden sollen, beispielsweise ein Coding-Provider, der den API-Schlüssel und die Authentifizierungsprofile des Basis-Providers gemeinsam nutzt.                                            |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`   | Schlanke Kanalmetadaten zu Umgebungsvariablen, die OpenClaw untersuchen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für umgebungsvariablengesteuerte Kanaleinrichtungs- oder Authentifizierungsoberflächen, die generische Start-/Konfigurationshelfer erkennen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                   | Schlanke Metadaten zu Authentifizierungsoptionen für Onboarding-Auswahlfelder, die Auflösung bevorzugter Provider und die einfache Anbindung von CLI-Flags.                                                                                                                 |
| `activation`                         | Nein         | `object`                     | Schlanke Metadaten für die Aktivierungsplanung beim durch Start, Provider, Befehl, Kanal, Route oder Fähigkeit ausgelösten Laden. Ausschließlich Metadaten; für das tatsächliche Verhalten bleibt die Plugin-Laufzeit verantwortlich.                                      |
| `setup`                              | Nein         | `object`                     | Schlanke Einrichtungs-/Onboarding-Beschreibungen, die Erkennungs- und Einrichtungsoberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                                                             |
| `qaRunners`                          | Nein         | `object[]`                   | Schlanke Beschreibungen für QA-Runner, die vom gemeinsamen `openclaw qa`-Host verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                                                                    |
| `contracts`                          | Nein         | `object`                     | Statische Momentaufnahme der Zuständigkeit für externe Authentifizierungs-Hooks, Embeddings, Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bild-/Video-/Musikerzeugung, Webabruf, Websuche, Worker-Provider, Dokument-/Webinhaltsextraktion und Tools.    |
| `configContracts`                    | Nein         | `object`                     | Manifesteigenes Konfigurationsverhalten, das von generischen Kernhelfern genutzt wird: Erkennung gefährlicher Flags, SecretRef-Migrationsziele und Eingrenzung veralteter Konfigurationspfade. Siehe [configContracts-Referenz](#configcontracts-reference).                    |
| `mediaUnderstandingProviderMetadata` | Nein     | `Record<string, object>`     | Ressourcenarme Standardeinstellungen für das Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                                            |
| `imageGenerationProviderMetadata`    | Nein     | `Record<string, object>`     | Ressourcenarme Authentifizierungsmetadaten für die Bildgenerierung für Provider-IDs, die in `contracts.imageGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliasnamen und Prüfungen für Basis-URLs.                                  |
| `videoGenerationProviderMetadata`    | Nein     | `Record<string, object>`     | Ressourcenarme Authentifizierungsmetadaten für die Videogenerierung für Provider-IDs, die in `contracts.videoGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliasnamen und Prüfungen für Basis-URLs.                                 |
| `musicGenerationProviderMetadata`    | Nein     | `Record<string, object>`     | Ressourcenarme Authentifizierungsmetadaten für die Musikgenerierung für Provider-IDs, die in `contracts.musicGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliasnamen und Prüfungen für Basis-URLs.                                 |
| `toolMetadata`                       | Nein     | `Record<string, object>`     | Ressourcenarme Verfügbarkeitsmetadaten für Plugin-eigene Tools, die in `contracts.tools` deklariert sind. Verwenden Sie sie, wenn ein Tool die Laufzeit erst laden soll, sobald Nachweise durch Konfiguration, Umgebungsvariablen oder Authentifizierung vorliegen.            |
| `channelConfigs`                     | Nein     | `Record<string, object>`     | Manifest-eigene Metadaten zur Kanalkonfiguration, die vor dem Laden der Laufzeit in die Erkennungs- und Validierungsoberflächen zusammengeführt werden.                                                                                                                      |
| `skills`                             | Nein     | `string[]`                   | Zu ladende Skill-Verzeichnisse relativ zum Plugin-Stammverzeichnis.                                                                                                                                                                                                         |
| `name`                               | Nein     | `string`                     | Menschenlesbarer Plugin-Name.                                                                                                                                                                                                                                               |
| `description`                        | Nein     | `string`                     | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                                                            |
| `catalog`                            | Nein     | `object`                     | Optionale Darstellungshinweise für Plugin-Katalogoberflächen. Diese Metadaten installieren oder aktivieren kein Plugin und gewähren ihm kein Vertrauen.                                                                                                                     |
| `icon`                               | Nein     | `string`                     | HTTPS-Bild-URL für Marketplace-/Katalogkarten. ClawHub akzeptiert jede gültige `https://`-URL und verwendet das standardmäßige Plugin-Symbol, wenn diese Angabe fehlt oder ungültig ist.                                                                                       |
| `version`                            | Nein     | `string`                     | Informative Plugin-Version.                                                                                                                                                                                                                                                 |
| `uiHints`                            | Nein     | `Record<string, object>`     | UI-Beschriftungen, Platzhalter und Hinweise zur Vertraulichkeit von Konfigurationsfeldern.                                                                                                                                                                                   |

## Katalogreferenz

`catalog` stellt Plugin-Browsern optionale Anzeigehinweise bereit. Hosts können diese Hinweise ignorieren. Sie installieren oder aktivieren das Plugin niemals und ändern weder sein Laufzeitverhalten noch seine Vertrauensstufe.

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
| `featured` | `boolean` | Gibt an, ob Katalogoberflächen dieses Plugin hervorheben sollen.                                   |
| `order`    | `number`  | Aufsteigender Anzeigehinweis innerhalb kuratierter Plugins; niedrigere Werte werden früher angezeigt. |

## Referenz der Metadaten für Generierungs-Provider

Die Metadatenfelder für Generierungs-Provider beschreiben statische Authentifizierungssignale für Provider, die in der entsprechenden Liste `contracts.*GenerationProviders` deklariert sind. OpenClaw liest diese Felder, bevor die Laufzeit des Providers geladen wird, sodass Kernwerkzeuge entscheiden können, ob ein Generierungs-Provider verfügbar ist, ohne jedes Provider-Plugin zu importieren.

Verwenden Sie diese Felder nur für kostengünstig ermittelbare, deklarative Fakten. Transport, Anfragetransformationen, Token-Aktualisierung, Anmeldedatenvalidierung und das tatsächliche Generierungsverhalten verbleiben in der Plugin-Laufzeit.

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

| Feld                   | Erforderlich | Typ        | Bedeutung                                                                                                                                                             |
| ---------------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Nein         | `string[]` | Zusätzliche Provider-IDs, die als statische Authentifizierungsaliase für den Generierungs-Provider gelten sollen.                                                      |
| `authProviders`        | Nein         | `string[]` | Provider-IDs, deren konfigurierte Authentifizierungsprofile als Authentifizierung für diesen Generierungs-Provider gelten sollen.                                      |
| `configSignals`        | Nein         | `object[]` | Kostengünstig ermittelbare, ausschließlich konfigurationsbasierte Verfügbarkeitssignale für lokale oder selbst gehostete Provider, die ohne Authentifizierungsprofile oder Umgebungsvariablen konfiguriert werden können. |
| `authSignals`          | Nein         | `object[]` | Explizite Authentifizierungssignale. Wenn vorhanden, ersetzen diese den Standardsignalsatz aus der Provider-ID, `aliases` und `authProviders`.                         |
| `referenceAudioInputs` | Nein         | `boolean`  | Nur für Videogenerierung. Auf `true` setzen, wenn der Provider Referenzaudio-Assets akzeptiert; andernfalls blendet `video_generate` Audioreferenzparameter aus.       |

Jeder `configSignals`-Eintrag unterstützt:

| Feld             | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                                                        |
| ---------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`       | Ja           | `string`   | Punktpfad zum vom Plugin verwalteten Konfigurationsobjekt, das geprüft werden soll, beispielsweise `plugins.entries.example.config`.                                                                                                              |
| `overlayPath`    | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objekt die Stammkonfiguration vor der Auswertung des Signals überlagern soll. Verwenden Sie dies für funktionsspezifische Konfigurationen wie `image`, `video` oder `music`.                     |
| `overlayMapPath` | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objektwerte jeweils die Stammkonfiguration überlagern sollen. Verwenden Sie dies für benannte Kontenzuordnungen wie `accounts`, bei denen jedes konfigurierte Konto die Bedingung erfüllen soll. |
| `required`       | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, die konfigurierte Werte enthalten müssen. Zeichenfolgen dürfen nicht leer sein; Objekte und Arrays dürfen nicht leer sein.                                                                    |
| `requiredAny`    | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, von denen mindestens einer einen konfigurierten Wert enthalten muss.                                                                                                                           |
| `mode`           | Nein         | `object`   | Optionale Zeichenfolgen-Modusbedingung innerhalb der effektiven Konfiguration. Verwenden Sie diese, wenn die ausschließlich konfigurationsbasierte Verfügbarkeit nur für einen Modus gilt.                                                        |

Jede `mode`-Bedingung unterstützt:

| Feld         | Erforderlich | Typ        | Bedeutung                                                                                                                     |
| ------------ | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `path`       | Nein         | `string`   | Punktpfad innerhalb der effektiven Konfiguration. Der Standardwert ist `mode`.                                                 |
| `default`    | Nein         | `string`   | Zu verwendender Moduswert, wenn der Pfad in der Konfiguration fehlt.                                                          |
| `allowed`    | Nein         | `string[]` | Wenn vorhanden, ist das Signal nur gültig, wenn der effektive Modus einem dieser Werte entspricht.                             |
| `disallowed` | Nein         | `string[]` | Wenn vorhanden, ist das Signal ungültig, wenn der effektive Modus einem dieser Werte entspricht.                              |

Jeder `authSignals`-Eintrag unterstützt:

| Feld              | Erforderlich | Typ      | Bedeutung                                                                                                                                                                                              |
| ----------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ja           | `string` | Provider-ID, die in den konfigurierten Authentifizierungsprofilen geprüft werden soll.                                                                                                                  |
| `providerBaseUrl` | Nein         | `object` | Optionale Bedingung, durch die das Signal nur gilt, wenn der referenzierte konfigurierte Provider eine zulässige Basis-URL verwendet. Verwenden Sie dies, wenn ein Authentifizierungsalias nur für bestimmte APIs gültig ist. |

Jede `providerBaseUrl`-Bedingung unterstützt:

| Feld              | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                       |
| ----------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string`   | ID der Provider-Konfiguration, deren `baseUrl` geprüft werden soll.                                                                                                                              |
| `defaultBaseUrl`  | Nein         | `string`   | Anzunehmende Basis-URL, wenn `baseUrl` in der Provider-Konfiguration fehlt.                                                                                                                      |
| `allowedBaseUrls` | Ja           | `string[]` | Zulässige Basis-URLs für dieses Authentifizierungssignal. Das Signal wird ignoriert, wenn die konfigurierte oder standardmäßige Basis-URL keinem dieser normalisierten Werte entspricht.          |

## Referenz der Werkzeugmetadaten

`toolMetadata` verwendet dieselben Formen für `configSignals` und `authSignals` wie die Metadaten für Generierungs-Provider, wobei der Werkzeugname als Schlüssel dient. `contracts.tools` deklariert die Eigentümerschaft. `toolMetadata` deklariert kostengünstig ermittelbare Verfügbarkeitsnachweise, sodass OpenClaw vermeiden kann, eine Plugin-Laufzeit zu importieren, nur damit deren Werkzeug-Factory `null` zurückgibt.

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

`toolMetadata`-Einträge akzeptieren zusätzlich zu den oben genannten gemeinsamen Feldern `configSignals`/`authSignals` auch `optional` (kennzeichnet das Werkzeug als für die Plugin-Aktivierung nicht erforderlich) und `replaySafe` (kennzeichnet die Werkzeugausführung als sicher wiederholbar nach einer unvollständigen Modellrunde).

Wenn ein Werkzeug keine `toolMetadata` besitzt, behält OpenClaw das bestehende Verhalten bei und lädt das zuständige Plugin, wenn der Werkzeugvertrag den Richtlinien entspricht. Für Werkzeuge in häufig ausgeführten Pfaden, deren Factory von Authentifizierung oder Konfiguration abhängt, sollten Plugin-Autoren `toolMetadata` deklarieren, anstatt den Kern die Laufzeit importieren zu lassen, um nachzufragen.

## Referenz zu providerAuthChoices

Jeder `providerAuthChoices`-Eintrag beschreibt eine Auswahlmöglichkeit für das Onboarding oder die Authentifizierung. OpenClaw liest diese, bevor die Laufzeit des Providers geladen wird. Provider-Einrichtungslisten verwenden diese Manifest-Auswahlmöglichkeiten, aus Deskriptoren abgeleitete Einrichtungsoptionen und Metadaten des Installationskatalogs, ohne die Provider-Laufzeit zu laden.

| Feld                  | Erforderlich | Typ                                                                   | Bedeutung                                                                                                                     |
| --------------------- | ------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                                              | Provider-ID, zu der diese Auswahl gehört.                                                                                     |
| `method`              | Ja           | `string`                                                              | ID der Authentifizierungsmethode, an die weitergeleitet werden soll.                                                          |
| `choiceId`            | Ja           | `string`                                                              | Stabile ID der Authentifizierungsauswahl, die beim Onboarding und in CLI-Abläufen verwendet wird.                             |
| `choiceLabel`         | Nein         | `string`                                                              | Für Benutzer sichtbare Bezeichnung. Wenn sie weggelassen wird, verwendet OpenClaw ersatzweise `choiceId`.                     |
| `choiceHint`          | Nein         | `string`                                                              | Kurzer Hilfetext für die Auswahl.                                                                                             |
| `assistantPriority`   | Nein         | `number`                                                              | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahllisten weiter vorne einsortiert.                        |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                                        | Blendet die Auswahl in Assistenten-Auswahllisten aus, erlaubt jedoch weiterhin die manuelle Auswahl über die CLI.             |
| `deprecatedChoiceIds` | Nein         | `string[]`                                                            | Veraltete Auswahl-IDs, die Benutzer zu dieser Ersatzauswahl weiterleiten sollen.                                              |
| `groupId`             | Nein         | `string`                                                              | Optionale Gruppen-ID zum Gruppieren zusammengehöriger Auswahlmöglichkeiten.                                                   |
| `groupLabel`          | Nein         | `string`                                                              | Für Benutzer sichtbare Bezeichnung dieser Gruppe.                                                                             |
| `groupHint`           | Nein         | `string`                                                              | Kurzer Hilfetext für die Gruppe.                                                                                              |
| `onboardingFeatured`  | Nein         | `boolean`                                                             | Zeigt diese Gruppe in der hervorgehobenen Ebene der interaktiven Onboarding-Auswahl vor dem Eintrag "More..." an.              |
| `optionKey`           | Nein         | `string`                                                              | Interner Optionsschlüssel für einfache Authentifizierungsabläufe mit einem einzigen Flag.                                     |
| `cliFlag`             | Nein         | `string`                                                              | Name des CLI-Flags, beispielsweise `--openrouter-api-key`.                                                                    |
| `cliOption`           | Nein         | `string`                                                              | Vollständige Form der CLI-Option, beispielsweise `--openrouter-api-key <key>`.                                                |
| `cliDescription`      | Nein         | `string`                                                              | In der CLI-Hilfe verwendete Beschreibung.                                                                                     |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Onboarding-Oberflächen, auf denen diese Auswahl angezeigt werden soll. Wenn weggelassen, wird standardmäßig `["text-inference"]` verwendet. |

## Referenz zu commandAliases

Verwenden Sie `commandAliases`, wenn ein Plugin einen Namen für einen Laufzeitbefehl besitzt, den Benutzer möglicherweise fälschlicherweise in `plugins.allow` eintragen oder als CLI-Stammbefehl ausführen möchten. OpenClaw verwendet diese Metadaten für die Diagnose, ohne den Laufzeitcode des Plugins zu importieren.

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
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl statt als CLI-Stammbefehl. |
| `cliCommand` | Nein         | `string`          | Zugehöriger CLI-Stammbefehl, der für CLI-Vorgänge vorgeschlagen werden soll, sofern vorhanden. |

## Aktivierungsreferenz

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, bei welchen Control-Plane-Ereignissen es in einen Aktivierungs-/Ladeplan aufgenommen werden soll.

Dieser Block enthält Planer-Metadaten und ist keine Lebenszyklus-API. Er registriert kein Laufzeitverhalten, ersetzt `register(...)` nicht und garantiert nicht, dass der Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um die infrage kommenden Plugins einzugrenzen, bevor er auf vorhandene Manifest-Eigentumsmetadaten wie `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks zurückgreift.

Bevorzugen Sie die spezifischsten Metadaten, die die Eigentümerschaft bereits beschreiben. Verwenden Sie `providers`, `channels`, `commandAliases`, Setup-Deskriptoren oder `contracts`, wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planerhinweise, die nicht durch diese Eigentumsfelder dargestellt werden können. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Laufzeit-Aliasse wie `claude-cli`, `my-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist ausschließlich für IDs eingebetteter Agent-Harnesses vorgesehen, für die noch kein Eigentumsfeld vorhanden ist.

Jedes Plugin sollte `activation.onStartup` bewusst festlegen. Setzen Sie es nur dann auf `true`, wenn das Plugin während des Gateway-Starts ausgeführt werden muss. Setzen Sie es auf `false`, wenn das Plugin beim Start inaktiv ist und nur durch spezifischere Auslöser geladen werden soll. Wird `onStartup` weggelassen, wird das Plugin beim Start nicht mehr implizit geladen; verwenden Sie explizite Aktivierungsmetadaten für Start-, Kanal-, Konfigurations-, Agent-Harness-, Speicher- oder andere spezifischere Aktivierungsauslöser.

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

| Feld               | Erforderlich | Typ                                                  | Bedeutung                                                                                                                                                                                                   |
| ------------------ | ------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nein         | `boolean`                                            | Explizite Aktivierung beim Gateway-Start. Jedes Plugin sollte dies festlegen. `true` importiert das Plugin beim Start; `false` hält es beim Start verzögert, sofern kein anderer passender Auslöser das Laden erfordert. |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, bei denen dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                   |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Laufzeit-IDs eingebetteter Agent-Harnesses, bei denen dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliasse.                |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, bei denen dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                     |
| `onChannels`       | Nein         | `string[]`                                           | Kanal-IDs, bei denen dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                       |
| `onRoutes`         | Nein         | `string[]`                                           | Routentypen, bei denen dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                     |
| `onConfigPaths`    | Nein         | `string[]`                                           | Stammrelative Konfigurationspfade, bei deren Vorhandensein und sofern sie nicht explizit deaktiviert sind dieses Plugin in Start-/Ladepläne aufgenommen werden soll.                                        |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Fähigkeitshinweise für die Aktivierungsplanung der Steuerungsebene. Bevorzugen Sie nach Möglichkeit spezifischere Felder.                                                                         |

Aktuelle aktive Verbraucher:

- Die Planung des Gateway-Starts verwendet `activation.onStartup` für den expliziten Import beim Start.
- Die befehlsausgelöste CLI-Planung greift ersatzweise auf das veraltete `commandAliases[].cliCommand` oder `commandAliases[].name` zurück.
- Die Planung des Agent-Laufzeitstarts verwendet `activation.onAgentHarnesses` für eingebettete Harnesses und `cliBackends[]` auf oberster Ebene für CLI-Laufzeit-Aliasse.
- Die kanalbezogene Einrichtungs-/Kanalplanung greift ersatzweise auf die veraltete Zuständigkeit über `channels[]` zurück, wenn explizite Metadaten zur Kanalaktivierung fehlen.
- Die Plugin-Planung beim Start verwendet `activation.onConfigPaths` für kanalunabhängige Stammkonfigurationsbereiche wie den `browser`-Block des gebündelten Browser-Plugins.
- Die providerbezogene Einrichtungs-/Laufzeitplanung greift ersatzweise auf die veraltete Zuständigkeit über `providers[]` und `cliBackends[]` auf oberster Ebene zurück, wenn explizite Metadaten zur Provider-Aktivierung fehlen.

Die Planerdiagnose kann explizite Aktivierungshinweise von Rückgriffen auf die Manifestzuständigkeit unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass `activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der Planer stattdessen die Zuständigkeit über `commandAliases` verwendete. Diese Bezeichner für Gründe dienen der Hostdiagnose und Tests; Plugin-Autoren sollten weiterhin die Metadaten deklarieren, welche die Zuständigkeit am besten beschreiben.

## Referenz zu qaRunners

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb
des gemeinsamen Stammbefehls `openclaw qa` bereitstellt. Halten Sie diese Metadaten schlank und statisch; die Plugin-
Laufzeit bleibt weiterhin für die eigentliche CLI-Registrierung über eine schlanke
`runtime-api.ts`-Schnittstelle zuständig, die passende `qaRunnerCliRegistrations` exportiert. Eine
optionale `adapterFactory` stellt den Transport für gemeinsame QA-Szenarien bereit, ohne
den Runner des registrierten Befehls zu ändern.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Die Docker-gestützte Live-QA-Strecke für Matrix gegen einen temporären Homeserver ausführen"
    }
  ]
}
```

| Feld          | Erforderlich | Typ      | Bedeutung                                                                                      |
| ------------- | ------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl unterhalb von `openclaw qa`, beispielsweise `matrix`.                              |
| `description` | Nein         | `string` | Ersatzhilfetext, der verwendet wird, wenn der gemeinsame Host einen Platzhalterbefehl benötigt. |

Die `adapterFactory`-ID muss mit `commandName` übereinstimmen. Exportieren Sie keine Registrierungen
für Befehle, die nicht im Manifest enthalten sind.

## setup-Referenz

Verwenden Sie `setup`, wenn Einrichtungs- und Onboarding-Oberflächen kostengünstige Plugin-eigene Metadaten benötigen, bevor die Laufzeit geladen wird.

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

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-Backends. `setup.cliBackends` ist die einrichtungsspezifische Deskriptoroberfläche für Steuerungsebenen-/Einrichtungsabläufe, die ausschließlich auf Metadaten basieren sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte Deskriptor-zuerst-Nachschlageoberfläche für die Einrichtungserkennung. Wenn der Deskriptor lediglich das infrage kommende Plugin eingrenzt und die Einrichtung weiterhin umfangreichere Laufzeit-Hooks zur Einrichtungszeit benötigt, legen Sie `requiresRuntime: true` fest und behalten Sie `setup-api` als Ausweich-Ausführungspfad bei.

OpenClaw bezieht `setup.providers[].envVars` außerdem in generische Nachschlagevorgänge für Provider-Authentifizierung und Umgebungsvariablen ein. `providerAuthEnvVars` wird während des Übergangszeitraums weiterhin über einen Kompatibilitätsadapter unterstützt, aber nicht gebündelte Plugins, die es noch verwenden, erhalten eine Manifestdiagnose. Neue Plugins sollten Umgebungsmetadaten für Einrichtung und Status unter `setup.providers[].envVars` ablegen.

Verwenden Sie `providerUsageAuthEnvVars`, wenn ein Abrechnungs- oder organisationsbezogener Berechtigungsnachweis `resolveUsageAuth` aktivieren muss, ohne zu einem Inferenz-Berechtigungsnachweis zu werden. Diese Namen werden in die Blockierung von Workspace-Dotenv-Dateien, die Entfernung aus ACP-Unterprozessen, die Filterung von Geheimnissen in der Sandbox und die umfassende Bereinigung von Geheimnissen einbezogen. Die Provider-Laufzeit liest und klassifiziert den Wert weiterhin innerhalb von `resolveUsageAuth`.

OpenClaw kann außerdem einfache Einrichtungsoptionen aus `setup.providers[].authMethods` ableiten, wenn kein Einrichtungseintrag verfügbar ist oder wenn `setup.requiresRuntime: false` erklärt, dass keine Einrichtungslaufzeit erforderlich ist. Explizite `providerAuthChoices`-Einträge bleiben für benutzerdefinierte Beschriftungen, CLI-Flags, den Onboarding-Geltungsbereich und Assistentenmetadaten bevorzugt.

Legen Sie `requiresRuntime: false` nur fest, wenn diese Deskriptoren für die Einrichtungsoberfläche ausreichen. OpenClaw behandelt ein explizites `false` als reinen Deskriptorvertrag und führt für die Einrichtungssuche weder `setup-api` noch `openclaw.setupEntry` aus. Wenn ein reines Deskriptor-Plugin dennoch einen dieser Einrichtungslaufzeiteinträge bereitstellt, meldet OpenClaw eine additive Diagnose und ignoriert ihn weiterhin. Wird `requiresRuntime` weggelassen, bleibt das bisherige Ausweichverhalten erhalten, damit vorhandene Plugins, die Deskriptoren ohne dieses Flag hinzugefügt haben, nicht beschädigt werden.

Da die Einrichtungssuche Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte Werte von `setup.providers[].id` und `setup.cliBackends[]` unter allen erkannten Plugins eindeutig bleiben. Bei mehrdeutiger Eigentümerschaft wird der Vorgang sicher abgebrochen, statt anhand der Erkennungsreihenfolge einen Gewinner auszuwählen.

Wenn die Einrichtungslaufzeit ausgeführt wird, melden die Diagnosen der Einrichtungsregistrierung eine Deskriptorabweichung, falls `setup-api` einen Provider oder ein CLI-Backend registriert, den beziehungsweise das die Manifestdeskriptoren nicht deklarieren, oder falls für einen Deskriptor keine passende Laufzeitregistrierung vorhanden ist. Diese Diagnosen sind additiv und weisen ältere Plugins nicht zurück.

### setup.providers-Referenz

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                                        |
| -------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `id`           | Ja           | `string`   | Während der Einrichtung oder des Onboardings bereitgestellte Provider-ID. Normalisierte IDs müssen global eindeutig sein. |
| `authMethods`  | Nein         | `string[]` | IDs der Einrichtungs-/Authentifizierungsmethoden, die dieser Provider ohne Laden der vollständigen Laufzeit unterstützt. |
| `envVars`      | Nein         | `string[]` | Umgebungsvariablen, die generische Einrichtungs-/Statusoberflächen vor dem Laden der Plugin-Laufzeit prüfen können. |
| `authEvidence` | Nein         | `object[]` | Kostengünstige lokale Prüfungen auf Authentifizierungsnachweise für Provider, die sich über nicht geheime Marker authentifizieren können. |

`authEvidence` ist für Provider-eigene lokale Marker für Berechtigungsnachweise vorgesehen, die ohne Laden von Laufzeitcode überprüft werden können. Diese Prüfungen müssen kostengünstig und lokal bleiben: keine Netzwerkaufrufe, keine Zugriffe auf Schlüsselbund oder Geheimnisverwaltung, keine Shell-Befehle und keine Abfragen der Provider-API.

Unterstützte Nachweiseinträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                              |
| ------------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                                         |
| `fileEnvVar`       | Nein         | `string`   | Umgebungsvariable, die einen expliziten Pfad zu einer Berechtigungsnachweisdatei enthält.                               |
| `fallbackPaths`    | Nein         | `string[]` | Lokale Pfade zu Berechtigungsnachweisdateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine aufgeführte Umgebungsvariable muss nicht leer sein, damit der Nachweis gültig ist.                      |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Umgebungsvariable muss nicht leer sein, damit der Nachweis gültig ist.                                 |
| `credentialMarker` | Ja           | `string`   | Nicht geheimer Marker, der zurückgegeben wird, wenn der Nachweis vorhanden ist.                                        |
| `source`           | Nein         | `string`   | Benutzerseitig sichtbare Quellenbezeichnung für die Authentifizierungs-/Statusausgabe.                                 |

### setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                         |
| ------------------ | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Während der Einrichtung und des Onboardings bereitgestellte Deskriptoren für die Provider-Einrichtung.            |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Einrichtungszeit für die Deskriptor-zuerst-Einrichtungssuche. Normalisierte IDs müssen global eindeutig sein. |
| `configMigrations` | Nein         | `string[]` | IDs der Konfigurationsmigrationen, die der Einrichtungsoberfläche dieses Plugins gehören.                         |
| `requiresRuntime`  | Nein         | `boolean`  | Ob die Einrichtung nach der Deskriptorsuche weiterhin die Ausführung von `setup-api` benötigt.                    |

## uiHints-Referenz

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen zu kleinen Darstellungshinweisen. Schlüssel können Punkte für verschachtelte Konfigurationsfelder verwenden, aber kein Pfadsegment darf `__proto__`, `constructor` oder `prototype` sein; die Einrichtung weist solche Namen zurück.

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

| Feld          | Typ        | Bedeutung                                    |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Benutzerseitig sichtbare Feldbezeichnung.    |
| `help`        | `string`   | Kurzer Hilfetext.                            |
| `tags`        | `string[]` | Optionale UI-Tags.                           |
| `advanced`    | `boolean`  | Kennzeichnet das Feld als erweitert.         |
| `sensitive`   | `boolean`  | Kennzeichnet das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.        |

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

| Feld                             | Typ        | Bedeutung                                                                                                                                    |
| -------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Factory-IDs für Codex-App-Server-Erweiterungen, derzeit `codex-app-server`.                                                                   |
| `agentToolResultMiddleware`      | `string[]` | Runtime-IDs, für die dieses Plugin Middleware für Tool-Ergebnisse registrieren darf.                                                         |
| `trustedToolPolicies`            | `string[]` | Plugin-lokale IDs vertrauenswürdiger Pre-Tool-Richtlinien, die ein installiertes Plugin registrieren darf. Gebündelte Plugins dürfen Richtlinien ohne dieses Feld registrieren. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Authentifizierungsprofile diesem Plugin zugeordnet ist.                                                 |
| `embeddingProviders`             | `string[]` | IDs allgemeiner Embedding-Provider, die diesem Plugin zur wiederverwendbaren Erzeugung von Vektor-Embeddings einschließlich Memory zugeordnet sind. |
| `speechProviders`                | `string[]` | IDs von Sprach-Providern, die diesem Plugin zugeordnet sind.                                                                                 |
| `realtimeTranscriptionProviders` | `string[]` | IDs von Providern für Echtzeittranskription, die diesem Plugin zugeordnet sind.                                                              |
| `realtimeVoiceProviders`         | `string[]` | IDs von Providern für Echtzeitsprache, die diesem Plugin zugeordnet sind.                                                                    |
| `memoryEmbeddingProviders`       | `string[]` | Veraltete IDs Memory-spezifischer Embedding-Provider, die diesem Plugin zugeordnet sind.                                                     |
| `mediaUnderstandingProviders`    | `string[]` | IDs von Providern für Medienverständnis, die diesem Plugin zugeordnet sind.                                                                  |
| `transcriptSourceProviders`      | `string[]` | IDs von Providern für Transkriptquellen, die diesem Plugin zugeordnet sind.                                                                  |
| `documentExtractors`             | `string[]` | IDs von Provider-Extraktoren für Dokumente (beispielsweise PDF), die diesem Plugin zugeordnet sind.                                          |
| `imageGenerationProviders`       | `string[]` | IDs von Providern für die Bilderzeugung, die diesem Plugin zugeordnet sind.                                                                  |
| `videoGenerationProviders`       | `string[]` | IDs von Providern für die Videoerzeugung, die diesem Plugin zugeordnet sind.                                                                 |
| `musicGenerationProviders`       | `string[]` | IDs von Providern für die Musikerzeugung, die diesem Plugin zugeordnet sind.                                                                 |
| `webContentExtractors`           | `string[]` | IDs von Providern für die Inhaltsextraktion aus Webseiten, die diesem Plugin zugeordnet sind.                                                |
| `webFetchProviders`              | `string[]` | IDs von Providern für Webabrufe, die diesem Plugin zugeordnet sind.                                                                          |
| `webSearchProviders`             | `string[]` | IDs von Providern für die Websuche, die diesem Plugin zugeordnet sind.                                                                       |
| `workerProviders`                | `string[]` | IDs von Cloud-Worker-Providern, die diesem Plugin für die Bereitstellung und den profilgestützten Lease-Lebenszyklus zugeordnet sind.         |
| `usageProviders`                 | `string[]` | Provider-IDs, deren Hooks für Nutzungsauthentifizierung und Nutzungs-Snapshots diesem Plugin zugeordnet sind.                                 |
| `migrationProviders`             | `string[]` | IDs von Import-Providern, die diesem Plugin für `openclaw migrate` zugeordnet sind.                                                           |
| `gatewayMethodDispatch`          | `string[]` | Reservierte Berechtigung für authentifizierte Plugin-HTTP-Routen, die Gateway-Methoden prozessintern weiterleiten.                            |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin zugeordnet sind.                                                                                    |

`contracts.embeddedExtensionFactories` bleibt für gebündelte Erweiterungs-Factorys erhalten, die ausschließlich für den Codex-App-Server bestimmt sind. Gebündelte Transformationen von Tool-Ergebnissen sollten stattdessen `contracts.agentToolResultMiddleware` deklarieren und sich mit `api.registerAgentToolResultMiddleware(...)` registrieren. Installierte Plugins dürfen dieselbe Middleware-Schnittstelle nur verwenden, wenn sie ausdrücklich aktiviert ist, und ausschließlich für Runtimes, die sie in `contracts.agentToolResultMiddleware` deklarieren.

Installierte Plugins, die die vom Host als vertrauenswürdig eingestufte Pre-Tool-Richtlinienstufe benötigen, müssen jede registrierte lokale ID in `contracts.trustedToolPolicies` deklarieren und ausdrücklich aktiviert werden. Für gebündelte Plugins bleibt der vorhandene Pfad für vertrauenswürdige Richtlinien bestehen; installierte Plugins mit nicht deklarierten Richtlinien-IDs werden jedoch vor der Registrierung abgelehnt. Richtlinien-IDs sind auf das registrierende Plugin beschränkt, sodass zwei Plugins jeweils `workflow-budget` deklarieren und registrieren dürfen; ein einzelnes Plugin darf dieselbe lokale ID nicht zweimal registrieren.

Runtime-Registrierungen mit `api.registerTool(...)` müssen `contracts.tools` entsprechen. Die Tool-Ermittlung verwendet diese Liste, um nur die Plugin-Runtimes zu laden, denen die angeforderten Tools zugeordnet sein können.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten `contracts.externalAuthProviders` deklarieren; nicht deklarierte Hooks für externe Authentifizierung werden ignoriert.

Provider-Plugins, die sowohl `resolveUsageAuth` als auch `fetchUsageSnapshot` implementieren, sollten jede automatisch ermittelte Provider-ID in `contracts.usageProviders` deklarieren. Die Nutzungsermittlung liest diesen Vertrag vor dem Laden des Runtime-Codes und überprüft anschließend beide Hooks, nachdem ausschließlich die deklarierten zuständigen Plugins geladen wurden.

Allgemeine Embedding-Provider sollten für jeden mit `api.registerEmbeddingProvider(...)` registrierten Adapter `contracts.embeddingProviders` deklarieren. Verwenden Sie den allgemeinen Vertrag für die wiederverwendbare Vektorerzeugung, einschließlich Providern, die von der Memory-Suche genutzt werden. `contracts.memoryEmbeddingProviders` ist eine veraltete Memory-spezifische Kompatibilitätsschnittstelle und bleibt nur bestehen, während vorhandene Provider zur generischen Embedding-Provider-Schnittstelle migriert werden.

Worker-Provider müssen jede mit `api.registerWorkerProvider(...)` registrierte ID in `contracts.workerProviders` deklarieren. Der Core speichert die dauerhafte Absicht, bevor `provision` aufgerufen wird; Provider validieren ihre Einstellungen vor der externen Zuweisung, und wiederholte Aufrufe mit derselben Vorgangs-ID müssen denselben Lease übernehmen. Der Core speichert außerdem diesen Snapshot der validierten Einstellungen und übergibt ihn zusammen mit `leaseId` an `inspect({ leaseId, profile })` und `destroy({ leaseId, profile })`, auch nachdem das benannte Profil geändert oder entfernt wurde. Die Löschung ist idempotent, die Inspektion gibt die abgeschlossene Status-Union `active` / `destroyed` / `unknown` zurück, und auf privates SSH-Schlüsselmaterial wird ausschließlich über `SecretRef` verwiesen. Bereitgestellte SSH-Endpunkte müssen außerdem einen öffentlichen `hostKey` aus einer vertrauenswürdigen Bereitstellungsausgabe exakt im Format `algorithm base64` enthalten, ohne Hostnamen oder Kommentar, damit der Core den Host vor dem Verbindungsaufbau fest zuordnen kann. Provider, die dynamische Identitätsreferenzen erzeugen, können das maßgebliche `resolveSshIdentity({ leaseId, profile, keyRef })` implementieren; Provider ohne diese Implementierung verwenden den generischen Secret-Resolver des Cores. Ein maßgebliches `unknown` kennzeichnet einen aktiven lokalen Datensatz als verwaist; nach einer dauerhaft gespeicherten Löschanforderung bestätigt es den Abbau.

`contracts.gatewayMethodDispatch` akzeptiert derzeit `"authenticated-request"`. Dies ist eine API-Hygieneprüfung für native Plugin-HTTP-Routen, die absichtlich Gateway-Control-Plane-Methoden prozessintern aufrufen, und keine Sandbox zum Schutz vor bösartigen nativen Plugins. Verwenden Sie sie nur für streng geprüfte gebündelte bzw. Betreiberoberflächen, die bereits eine Gateway-HTTP-Authentifizierung erfordern. Eine berechtigte Route bleibt bei geschlossener Zulassung von Gateway-Stammaufgaben nur erreichbar, wenn sie zusätzlich `auth: "gateway"` und die routenspezifische Einstellung `gatewayRuntimeScopeSurface: "trusted-operator"` deklariert; gewöhnliche verwandte Routen desselben Plugins bleiben hinter der Zulassungsgrenze. Dadurch bleiben der Status der Aussetzung und das Fortsetzen erreichbar, ohne dem gesamten Plugin eine Umgehung der Zulassung zu gewähren. Halten Sie Parsing und Antwortaufbereitung außerhalb des Dispatch-Vorgangs in engen Grenzen; wesentliche oder verändernde Arbeiten müssen über den Gateway-Methoden-Dispatch erfolgen, der für die Durchsetzung von Zulassung und Geltungsbereich zuständig ist.

## Referenz zu configContracts

Verwenden Sie `configContracts` für manifestgesteuertes Konfigurationsverhalten, das generische Kernhilfsfunktionen benötigen, ohne die Plugin-Laufzeit zu importieren: Erkennung gefährlicher Flags, SecretRef-Migrationsziele und Eingrenzung veralteter Konfigurationspfade.

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

| Feld                          | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                                                                            |
| ----------------------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Nein         | `string[]` | Konfigurationspfade relativ zur Wurzel, die darauf hinweisen, dass die Kompatibilitätsmigrationen dieses Plugins während der Einrichtung anwendbar sein könnten. Dadurch können generische Laufzeit-Konfigurationslesevorgänge alle Einrichtungsoberflächen von Plugins überspringen, wenn die Konfiguration nie auf das Plugin verweist. |
| `compatibilityRuntimePaths`   | Nein         | `string[]` | Kompatibilitätspfade relativ zur Wurzel, die dieses Plugin während der Laufzeit bedienen kann, bevor der Plugin-Code vollständig aktiviert ist. Verwenden Sie dies für veraltete Oberflächen, welche die Menge gebündelter Kandidaten eingrenzen sollen, ohne die Laufzeit jedes kompatiblen Plugins zu importieren.                     |
| `dangerousFlags`              | Nein         | `object[]` | Konfigurationsliterale, die `openclaw doctor` im aktivierten Zustand als unsicher oder gefährlich kennzeichnen soll. Siehe unten.                                                                                                                                      |
| `secretInputs`                | Nein         | `object`   | Konfigurationspfade unter `plugins.entries.<id>.config`, die von der SecretRef-Migrations-/Prüfzielregistrierung als geheimnisförmige Zeichenfolgen behandelt werden sollen. Siehe unten.                                                                               |

Jeder Eintrag in `dangerousFlags` unterstützt:

| Feld     | Erforderlich | Typ                                   | Bedeutung                                                                                                                      |
| -------- | ------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `path`   | Ja           | `string`                              | Durch Punkte getrennter Konfigurationspfad relativ zu `plugins.entries.<id>.config`. Unterstützt `*`-Platzhalter für Zuordnungs-/Array-Segmente. |
| `equals` | Ja           | `string \| number \| boolean \| null` | Exaktes Literal, das diesen Konfigurationswert als gefährlich kennzeichnet.                                                     |

`secretInputs` unterstützt:

| Feld                    | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                                           |
| ----------------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Nein         | `boolean`  | Überschreibt die standardmäßige Aktivierung des gebündelten Plugins bei der Entscheidung, ob diese SecretRef-Oberfläche aktiv ist. Verwenden Sie dies, wenn das Plugin gebündelt ist, die Oberfläche jedoch inaktiv bleiben soll, bis sie ausdrücklich in der Konfiguration aktiviert wird. |
| `paths`                 | Ja           | `object[]` | Konfigurationspfade in Secret-Form, jeweils mit `path` (durch Punkte getrennt, relativ zu `plugins.entries.<id>.config`, unterstützt `*`-Platzhalter) und optional `expected` (derzeit nur `"string"`).                                 |

## Referenz zu mediaUnderstandingProviderMetadata

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Provider für Medienverständnis Standardmodelle, eine Fallback-Priorität für automatische Authentifizierung oder native Dokumentunterstützung besitzt, die generische Core-Hilfsfunktionen vor dem Laden der Runtime benötigen. Schlüssel müssen außerdem in `contracts.mediaUnderstandingProviders` deklariert sein.

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

| Feld                   | Typ                                                              | Bedeutung                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Von diesem Provider bereitgestellte Medienfunktionen.                                                                                 |
| `defaultModels`        | `Record<string, string>`                                         | Standardzuordnungen von Funktionen zu Modellen, die verwendet werden, wenn die Konfiguration kein Modell angibt.                      |
| `autoPriority`         | `Record<string, number>`                                         | Niedrigere Zahlen werden beim automatischen, auf Anmeldedaten basierenden Provider-Fallback früher einsortiert.                       |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Vom Provider unterstützte native Dokumenteingaben.                                                                                    |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Modellspezifische Überschreibungen je Dokumenttyp. Setzen Sie `image: false`, um die bildbasierte Extraktion für diesen Dokumenttyp zu deaktivieren. |

## Referenz zu channelConfigs

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin vor dem Laden der Runtime kostengünstige Konfigurationsmetadaten benötigt. Die schreibgeschützte Ermittlung von Kanaleinrichtung und -status kann diese Metadaten für konfigurierte externe Kanäle direkt verwenden, wenn kein Einrichtungseintrag verfügbar ist oder wenn `setup.requiresRuntime: false` deklariert, dass keine Einrichtungs-Runtime erforderlich ist.

`channelConfigs` sind Metadaten des Plugin-Manifests und kein neuer Konfigurationsabschnitt auf oberster Ebene für Benutzer. Benutzer konfigurieren Kanalinstanzen weiterhin unter `channels.<channel-id>`. OpenClaw liest Manifestmetadaten, um zu entscheiden, welches Plugin für den konfigurierten Kanal zuständig ist, bevor der Plugin-Runtime-Code ausgeführt wird.

Bei einem Kanal-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten auch entsprechende `channelConfigs`-Einträge deklarieren. Ohne diese kann OpenClaw das Plugin weiterhin laden, aber Konfigurationsschema-, Einrichtungs- und Control-UI-Oberflächen im Cold Path können die Form der kanaleigenen Optionen erst erkennen, nachdem die Plugin-Runtime ausgeführt wurde.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und `nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Prüfungen der Befehlskonfiguration deklarieren, die vor dem Laden der Kanal-Runtime ausgeführt werden. Gebündelte Kanäle können dieselben Standardwerte zusammen mit ihren weiteren paketbezogenen Kanal-Katalogmetadaten auch über `package.json#openclaw.channel.commands` veröffentlichen.

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

| Feld          | Typ                      | Bedeutung                                                                                                                     |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanalkonfigurationseintrag erforderlich.                              |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen, Platzhalter und Hinweise auf sensible Daten für diesen Kanalkonfigurationsabschnitt.              |
| `label`       | `string`                 | Kanalbeschriftung, die in Auswahl- und Inspektionsoberflächen eingefügt wird, wenn die Runtime-Metadaten noch nicht vorliegen. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                                                              |
| `commands`    | `object`                 | Statische automatische Standardwerte für native Befehle und native Skills bei Konfigurationsprüfungen vor der Runtime.        |
| `preferOver`  | `string[]`               | IDs veralteter oder niedriger priorisierter Plugins, die dieser Kanal in Auswahloberflächen übertreffen soll.                  |

### Ersetzen eines anderen Kanal-Plugins

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Besitzer einer Kanal-ID ist, die auch von einem anderen Plugin bereitgestellt werden kann. Häufige Fälle sind eine umbenannte Plugin-ID, ein eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der zur Konfigurationskompatibilität dieselbe Kanal-ID beibehält.

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

Wenn `channels.chat` konfiguriert ist, berücksichtigt OpenClaw sowohl die Kanal-ID als auch die bevorzugte Plugin-ID. Wenn das Plugin mit niedrigerer Priorität nur ausgewählt wurde, weil es gebündelt oder standardmäßig aktiviert ist, deaktiviert OpenClaw es in der effektiven Runtime-Konfiguration, sodass ein Plugin für den Kanal und seine Tools zuständig ist. Eine ausdrückliche Benutzerauswahl hat weiterhin Vorrang: Wenn der Benutzer beide Plugins ausdrücklich aktiviert (über `plugins.allow` oder eine materielle `plugins.entries`-Konfiguration), behält OpenClaw diese Auswahl bei und meldet Diagnosen zu doppelten Kanälen oder Tools, anstatt die angeforderte Plugin-Auswahl stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die tatsächlich denselben Kanal bereitstellen können. Es ist kein allgemeines Prioritätsfeld und benennt keine Benutzerkonfigurationsschlüssel um.

## Referenz zu modelSupport

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin anhand verkürzter Modell-IDs wie `gpt-5.6-sol` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Runtime geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet folgende Rangfolge an:

- Explizite `provider/model`-Referenzen verwenden die zugehörigen `providers`-Manifestmetadaten
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- Wenn sowohl ein nicht gebündeltes Plugin als auch ein gebündeltes Plugin übereinstimmen, hat das nicht gebündelte Plugin Vorrang
- Verbleibende Mehrdeutigkeiten werden ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                                                 |
| --------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mithilfe von `startsWith` mit verkürzten Modell-IDs abgeglichen werden.                       |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen des Profilsuffixes mit verkürzten Modell-IDs abgeglichen werden.     |

`modelPatterns`-Einträge werden über `compileSafeRegex` kompiliert, das Muster mit verschachtelten Wiederholungen ablehnt (zum Beispiel `(a+)+$`). Muster, die die Sicherheitsprüfung nicht bestehen, werden ebenso wie syntaktisch ungültige reguläre Ausdrücke stillschweigend übersprungen. Halten Sie Muster einfach und vermeiden Sie verschachtelte Quantifizierer.

## Referenz zu modelCatalog

Verwenden Sie `modelCatalog`, wenn OpenClaw Provider-Modellmetadaten kennen soll, bevor die Plugin-Runtime geladen wird. Dies ist die manifesteigene Quelle für feste Katalogzeilen, Provider-Aliasse, Unterdrückungsregeln und den Erkennungsmodus. Die Aktualisierung zur Runtime bleibt weiterhin Aufgabe des Provider-Runtime-Codes, das Manifest teilt dem Core jedoch mit, wann die Runtime erforderlich ist.

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

| Feld             | Typ                                                      | Bedeutung                                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Schlüssel sollten auch in `providers` auf oberster Ebene erscheinen. |
| `aliases`        | `Record<string, object>`                                 | Provider-Aliasse, die für die Katalog- oder Unterdrückungsplanung in einen zugehörigen Provider aufgelöst werden sollen. |
| `suppressions`   | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus einem providerspezifischen Grund unterdrückt.              |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Gibt an, ob der Provider-Katalog aus Manifest-Metadaten gelesen, im Cache aktualisiert werden kann oder die Runtime erfordert. |
| `runtimeAugment` | `boolean`                                                | Nur auf `true` setzen, wenn die Provider-Runtime nach der Manifest-/Konfigurationsplanung Katalogzeilen ergänzen muss.   |

`aliases` wird bei der Ermittlung der Provider-Zuständigkeit für die Modellkatalogplanung berücksichtigt. Aliasziele müssen Provider auf oberster Ebene sein, die demselben Plugin gehören. Wenn eine nach Provider gefilterte Liste einen Alias verwendet, kann OpenClaw das zuständige Manifest lesen und API-/Basis-URL-Überschreibungen des Alias anwenden, ohne die Provider-Runtime zu laden. Aliasse erweitern ungefilterte Katalogauflistungen nicht; umfassende Listen geben nur die kanonischen Zeilen des zuständigen Providers aus.

`suppressions` ersetzt den alten Provider-Runtime-Hook `suppressBuiltInModel`. Unterdrückungseinträge werden nur berücksichtigt, wenn der Provider dem Plugin gehört oder als Schlüssel von `modelCatalog.aliases` deklariert ist, der auf einen zugehörigen Provider verweist. Runtime-Unterdrückungs-Hooks werden während der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld                  | Typ                      | Bedeutung                                                                                                                                                                                                                           |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Optionale standardmäßige Basis-URL für Modelle in diesem Provider-Katalog.                                                                                                                                                           |
| `api`                 | `ModelApi`               | Optionaler standardmäßiger API-Adapter für Modelle in diesem Provider-Katalog.                                                                                                                                                       |
| `headers`             | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.                                                                                                                                                                  |
| `defaultUtilityModel` | `string`                 | Optionale, vom Provider empfohlene ID eines kleinen Modells für kurze interne Hilfsaufgaben (Titel, Fortschrittsbeschreibung). Wird verwendet, wenn `agents.defaults.utilityModel` nicht gesetzt ist und dieser Provider das primäre Modell des Agenten bereitstellt. |
| `models`              | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.                                                                                                                                                                      |

Modellfelder:

| Feld               | Typ                                                            | Bedeutung                                                                                       |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                                          |
| `name`             | `string`                                                       | Optionaler Anzeigename.                                                                         |
| `api`              | `ModelApi`                                                     | Optionale API-Überschreibung pro Modell.                                                        |
| `baseUrl`          | `string`                                                       | Optionale Überschreibung der Basis-URL pro Modell.                                              |
| `headers`          | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalitäten, die das Modell akzeptiert. Andere Werte werden stillschweigend verworfen.          |
| `reasoning`        | `boolean`                                                      | Gibt an, ob das Modell Reasoning-Verhalten bereitstellt.                                        |
| `contextWindow`    | `number`                                                       | Natives Kontextfenster des Providers.                                                           |
| `contextTokens`    | `number`                                                       | Optionale effektive Kontextobergrenze der Runtime, wenn sie von `contextWindow` abweicht.        |
| `maxTokens`        | `number`                                                       | Maximale Anzahl von Ausgabe-Token, sofern bekannt.                                              |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Optionale Modell-ID- oder Parameterüberschreibungen pro Denkstufe.                              |
| `cost`             | `object`                                                       | Optionale Preise in USD pro Million Token, einschließlich optionalem `tieredPricing`.            |
| `compat`           | `object`                                                       | Optionale Kompatibilitätsmerkmale entsprechend der Modellkonfigurationskompatibilität von OpenClaw. |
| `mediaInput`       | `object`                                                       | Optionale Eingabekonfiguration pro Modalität, derzeit nur für Bilder.                            |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Auflistungsstatus. Nur unterdrücken, wenn die Zeile überhaupt nicht erscheinen darf.            |
| `statusReason`     | `string`                                                       | Optionaler Grund, der bei einem nicht verfügbaren Status angezeigt wird.                        |
| `replaces`         | `string[]`                                                     | Ältere Provider-lokale Modell-IDs, die dieses Modell ersetzt.                                   |
| `replacedBy`       | `string`                                                       | Provider-lokale ID des Ersatzmodells für veraltete Zeilen.                                      |
| `tags`             | `string[]`                                                     | Stabile Tags, die von Auswahlfeldern und Filtern verwendet werden.                              |

Unterdrückungsfelder:

| Feld                       | Typ        | Bedeutung                                                                                                                    |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-ID der zu unterdrückenden vorgelagerten Zeile. Muss diesem Plugin gehören oder als zugehöriger Alias deklariert sein. |
| `model`                    | `string`   | Provider-lokale ID des zu unterdrückenden Modells.                                                                           |
| `reason`                   | `string`   | Optionale Meldung, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.                                   |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste effektiver Hosts der Provider-Basis-URL, die erforderlich sind, bevor die Unterdrückung angewendet wird.      |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter `api`-Werte der Provider-Konfiguration, die erforderlich sind, bevor die Unterdrückung angewendet wird. |

Speichern Sie keine Daten, die nur zur Runtime verfügbar sind, in `modelCatalog`. Verwenden Sie `static` nur, wenn die Manifestzeilen vollständig genug sind, damit nach Provider gefilterte Listen und Auswahloberflächen die Registry-/Runtime-Ermittlung überspringen können. Verwenden Sie `refreshable`, wenn Manifestzeilen nützliche auflistbare Ausgangswerte oder Ergänzungen sind, eine Aktualisierung bzw. ein Cache aber später weitere Zeilen hinzufügen kann; aktualisierbare Zeilen sind für sich genommen nicht maßgeblich. Verwenden Sie `runtime`, wenn OpenClaw die Provider-Runtime laden muss, um die Liste zu ermitteln.

## Referenz zu modelIdNormalization

Verwenden Sie `modelIdNormalization` für kostengünstige, providereigene Bereinigungen von Modell-IDs, die vor dem Laden der Provider-Runtime erfolgen müssen. Dadurch verbleiben Aliasse wie kurze Modellnamen, ältere Provider-lokale IDs und Proxy-Präfixregeln im Manifest des zuständigen Plugins statt in den zentralen Modellauswahltabellen.

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

| Feld                                 | Typ                     | Bedeutung                                                                                              |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Exakte Modell-ID-Aliasse ohne Berücksichtigung der Groß-/Kleinschreibung. Werte werden unverändert zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Vor der Aliassuche zu entfernende Präfixe; nützlich bei älterer Duplizierung von Provider und Modell.  |
| `prefixWhenBare`                     | `string`                | Präfix, das hinzugefügt wird, wenn die normalisierte Modell-ID noch kein `/` enthält.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für einfache IDs nach der Aliassuche, geschlüsselt nach `modelPrefix` und `prefix`. |

## Referenz zu providerEndpoints

Verwenden Sie `providerEndpoints` für die Endpunktklassifizierung, die generische Anfragerichtlinien vor dem Laden der Provider-Runtime kennen müssen. Der Core legt weiterhin die Bedeutung jeder `endpointClass` fest; Plugin-Manifeste verwalten die Host- und Basis-URL-Metadaten.

Offiziell externalisierte Provider-Plugins sind von der Core-Distribution ausgeschlossen, daher
sind ihre Manifeste bis zur Installation nicht sichtbar. Ihre `providerEndpoints` müssen
außerdem in `scripts/lib/official-external-provider-catalog.json` gespiegelt werden, damit
die Endpunktklassifizierung ohne das Plugin weiterhin funktioniert; ein Vertragstest
erzwingt diese Spiegelung.

Endpunktfelder:

| Feld                           | Typ        | Bedeutung                                                                                           |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekannte zentrale Endpunktklasse, beispielsweise `openrouter`, `moonshot-native` oder `google-vertex`. |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpunktklasse zugeordnet sind.                                           |
| `hostSuffixes`                 | `string[]` | Hostsuffixe, die der Endpunktklasse zugeordnet sind. Stellen Sie `.` voran, um ausschließlich Domain-Suffixe abzugleichen. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpunktklasse zugeordnet sind.                     |
| `googleVertexRegion`           | `string`   | Statische Google-Vertex-Region für exakte globale Hosts.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Suffix, das von übereinstimmenden Hosts entfernt wird, um das Präfix der Google-Vertex-Region offenzulegen. |

## Referenz zu providerRequest

Verwenden Sie `providerRequest` für kostengünstige Metadaten zur Anfragekompatibilität, die generische Anfragerichtlinien benötigen, ohne die Provider-Laufzeit zu laden. Behalten Sie die verhaltensspezifische Umschreibung von Nutzdaten in Hooks der Provider-Laufzeit oder gemeinsam genutzten Hilfsfunktionen für Provider-Familien bei.

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

| Feld                  | Typ          | Bedeutung                                                                                             |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Bezeichnung der Provider-Familie, die für generische Entscheidungen zur Anfragekompatibilität und für Diagnosen verwendet wird. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Kompatibilitätsbereich der Provider-Familie für gemeinsam genutzte Anfragehilfsfunktionen. |
| `openAICompletions`   | `object`     | Flags für OpenAI-kompatible Completions-Anfragen, derzeit `supportsStreamingUsage`.                   |

## Referenz zu secretProviderIntegrations

Verwenden Sie `secretProviderIntegrations`, wenn ein Plugin eine wiederverwendbare Voreinstellung für einen SecretRef-Exec-Provider veröffentlichen kann. OpenClaw liest diese Metadaten, bevor die Plugin-Laufzeit geladen wird, speichert die Plugin-Zuständigkeit in `secrets.providers.<alias>.pluginIntegration` und überlässt die tatsächliche Auflösung von Secrets der SecretRef-Laufzeit. Voreinstellungen werden nur für gebündelte Plugins und installierte Plugins bereitgestellt, die in den verwalteten Installationsstammverzeichnissen für Plugins erkannt werden, beispielsweise Installationen über Git und ClawHub.

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

Der Map-Schlüssel ist die Integrations-ID. Wenn `providerAlias` weggelassen wird, verwendet OpenClaw die Integrations-ID als SecretRef-Provider-Alias. Provider-Aliase müssen dem normalen Muster für SecretRef-Provider-Aliase entsprechen, beispielsweise `team-secrets` oder `onepassword-work`.

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

Beim Start/Neuladen löst OpenClaw diesen Provider auf, indem es die aktuellen Metadaten des Plugin-Manifests lädt, prüft, ob das zuständige Plugin installiert und aktiv ist, und den exec-Befehl aus dem Manifest materialisiert. Durch Deaktivieren oder Entfernen des Plugins wird der Provider für aktive SecretRefs widerrufen. Operatoren, die eine eigenständige exec-Konfiguration wünschen, können weiterhin manuelle `command`/`args`-Provider direkt eintragen.

Derzeit werden nur Voreinstellungen mit `source: "exec"` unterstützt. `command` muss `${node}` sein und `args[0]` muss ein relativ zum Plugin-Stammverzeichnis angegebenes Resolver-Skript mit `./` sein. OpenClaw materialisiert dies beim Start/Neuladen zum aktuellen ausführbaren Node-Programm und zum absoluten Skriptpfad innerhalb des Plugins. Node-Optionen wie `--require`, `--import`, `--loader`, `--env-file`, `--eval` und `--print` sind nicht Teil des Vertrags für Manifest-Voreinstellungen. Operatoren, die Befehle außerhalb von Node benötigen, können eigenständige manuelle exec-Provider direkt konfigurieren.

OpenClaw leitet `trustedDirs` für Manifest-Voreinstellungen aus dem Plugin-Stammverzeichnis und bei `${node}`-Voreinstellungen aus dem Verzeichnis des aktuellen ausführbaren Node-Programms ab. Im Manifest definierte `trustedDirs` werden ignoriert. Andere Optionen für exec-Provider wie `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` und `allowInsecurePath` werden an die normale exec-Provider-Konfiguration von SecretRef weitergereicht.

## Referenz zu modelPricing

Verwenden Sie `modelPricing`, wenn ein Provider Preissteuerungsverhalten benötigt, bevor die Laufzeit geladen wird. Der Preis-Cache des Gateways liest diese Metadaten, ohne den Laufzeitcode des Providers zu importieren.

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

| Feld         | Typ               | Bedeutung                                                                                                           |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Legen Sie `false` für lokale/selbst gehostete Provider fest, die niemals OpenRouter- oder LiteLLM-Preise abrufen sollen. |
| `openRouter` | `false \| object` | Zuordnung für die OpenRouter-Preisabfrage. `false` deaktiviert die OpenRouter-Abfrage für diesen Provider.          |
| `liteLLM`    | `false \| object` | Zuordnung für die LiteLLM-Preisabfrage. `false` deaktiviert die LiteLLM-Abfrage für diesen Provider.                |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                                     |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Provider-ID des externen Katalogs, wenn sie von der OpenClaw-Provider-ID abweicht, beispielsweise `z-ai` für einen `zai`-Provider. |
| `passthroughProviderModel` | `boolean`          | Behandelt Modell-IDs mit Schrägstrichen als verschachtelte Provider-/Modellreferenzen, was für Proxy-Provider wie OpenRouter nützlich ist. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche Modell-ID-Varianten des externen Katalogs. `version-dots` versucht punktierte Versions-IDs wie `claude-opus-4.6`. |

### OpenClaw-Provider-Index

Der OpenClaw-Provider-Index enthält OpenClaw-eigene Vorschau-Metadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist nicht Teil eines Plugin-Manifests. Plugin-Manifeste bleiben die maßgebliche Quelle für installierte Plugins. Der Provider-Index ist der interne Fallback-Vertrag, den zukünftige Oberflächen für installierbare Provider und die Modellauswahl vor der Installation verwenden, wenn ein Provider-Plugin nicht installiert ist.

Rangfolge der Katalogquellen:

1. Benutzerkonfiguration.
2. `modelCatalog` des installierten Plugin-Manifests.
3. Modellkatalog-Cache aus einer expliziten Aktualisierung.
4. Vorschauzeilen des OpenClaw-Provider-Index.

Der Provider-Index darf keine Geheimnisse, keinen Aktivierungsstatus, keine Runtime-Hooks und keine kontospezifischen Live-Modelldaten enthalten. Seine Vorschaukataloge verwenden dieselbe Provider-Zeilenstruktur von `modelCatalog` wie Plugin-Manifeste, sollten jedoch auf stabile Anzeigemetadaten beschränkt bleiben, sofern Runtime-Adapter-Felder wie `api`, `baseUrl`, Preise oder Kompatibilitäts-Flags nicht bewusst mit dem installierten Plugin-Manifest synchron gehalten werden. Provider mit Live-Erkennung über `/models` sollten aktualisierte Zeilen über den expliziten Modellkatalog-Cache-Pfad schreiben, anstatt bei der normalen Auflistung oder beim Onboarding Provider-APIs aufzurufen.

Provider-Index-Einträge können auch Metadaten zu installierbaren Plugins für Provider enthalten, deren Plugin aus dem Core verschoben wurde oder anderweitig noch nicht installiert ist. Diese Metadaten entsprechen dem Muster des Kanalkatalogs: Paketname, npm-Installationsspezifikation, erwartete Integrität und einfache Bezeichnungen für Authentifizierungsoptionen reichen aus, um eine installierbare Einrichtungsoption anzuzeigen. Sobald das Plugin installiert ist, hat dessen Manifest Vorrang, und der Provider-Index-Eintrag wird für diesen Provider ignoriert.

`openclaw doctor --fix` migriert eine kleine, abgeschlossene Gruppe veralteter Manifest-Fähigkeitsschlüssel der obersten Ebene nach `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` und `tools`. Keiner davon – ebenso wenig wie andere Fähigkeitslisten – wird weiterhin als Manifest-Feld der obersten Ebene gelesen; beim normalen Laden von Manifesten werden sie nur unter `contracts` erkannt.

## Manifest im Vergleich zu package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwendung                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Erkennung, Konfigurationsvalidierung, Metadaten zu Authentifizierungsoptionen und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und der `openclaw`-Block für Einstiegspunkte, Installationsbedingungen, Einrichtung oder Katalogmetadaten |

Wenn Sie unsicher sind, wohin bestimmte Metadaten gehören, verwenden Sie diese Regel:

- Wenn OpenClaw sie vor dem Laden des Plugin-Codes kennen muss, fügen Sie sie in `openclaw.plugin.json` ein.
- Wenn sie die Paketierung, Einstiegsdateien oder das Installationsverhalten von npm betreffen, fügen Sie sie in `package.json` ein.

### package.json-Felder, die die Erkennung beeinflussen

Einige Plugin-Metadaten für die Phase vor der Runtime befinden sich absichtlich im `openclaw`-Block von `package.json` statt in `openclaw.plugin.json`. `openclaw.bundle` und `openclaw.bundle.json` sind keine OpenClaw-Plugin-Verträge; native Plugins müssen `openclaw.plugin.json` zusammen mit den unten aufgeführten unterstützten `package.json#openclaw`-Feldern verwenden.

Wichtige Beispiele:

| Feld                                                                                       | Bedeutung                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklariert native Plugin-Einstiegspunkte. Müssen innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                                        |
| `openclaw.runtimeExtensions`                                                               | Deklariert kompilierte JavaScript-Laufzeit-Einstiegspunkte für installierte Pakete. Müssen innerhalb des Plugin-Paketverzeichnisses bleiben.                                                              |
| `openclaw.setupEntry`                                                                      | Leichtgewichtiger, ausschließlich für die Einrichtung vorgesehener Einstiegspunkt, der beim Onboarding, beim verzögerten Kanalstart sowie bei der schreibgeschützten Ermittlung des Kanalstatus und von SecretRefs verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                                               | Deklariert den kompilierten JavaScript-Einrichtungs-Einstiegspunkt für installierte Pakete. Erfordert `setupEntry`, muss vorhanden sein und innerhalb des Plugin-Paketverzeichnisses bleiben.              |
| `openclaw.channel`                                                                         | Kostengünstige Metadaten für den Kanalkatalog, etwa Bezeichnungen, Dokumentationspfade, Aliasse und Auswahltexte.                                                                                          |
| `openclaw.channel.commands`                                                                | Statische Metadaten für native Befehle und automatische Standardwerte nativer Skills, die von Konfiguration, Audit und Befehlslisten-Oberflächen verwendet werden, bevor die Kanallaufzeit geladen wird.   |
| `openclaw.channel.configuredState`                                                         | Leichtgewichtige Metadaten für die Prüfung des Konfigurationsstatus, die ohne Laden der vollständigen Kanallaufzeit beantworten können: „Ist bereits eine ausschließlich umgebungsbasierte Einrichtung vorhanden?“ |
| `openclaw.channel.persistedAuthState`                                                      | Leichtgewichtige Metadaten für die Prüfung des persistenten Authentifizierungsstatus, die ohne Laden der vollständigen Kanallaufzeit beantworten können: „Ist bereits irgendwo eine Anmeldung vorhanden?“ |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installations-/Aktualisierungshinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                                  |
| `openclaw.install.defaultChoice`                                                           | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                                           |
| `openclaw.install.minHostVersion`                                                          | Niedrigste unterstützte OpenClaw-Hostversion unter Verwendung einer Semver-Untergrenze wie `>=2026.3.22` oder `>=2026.5.1-beta.1`.                                                                        |
| `openclaw.compat.pluginApi`                                                                | Mindestbereich der von diesem Paket benötigten OpenClaw-Plugin-API unter Verwendung einer Semver-Untergrenze wie `>=2026.5.27`.                                                                          |
| `openclaw.install.expectedIntegrity`                                                       | Erwartete npm-dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Aktualisierungsabläufe prüfen das abgerufene Artefakt dagegen.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Erlaubt einen eng begrenzten Wiederherstellungspfad durch Neuinstallation eines gebündelten Plugins, wenn die Konfiguration ungültig ist.                                                                 |
| `openclaw.install.requiredPlatformPackages`                                                | npm-Paketaliasse, die vorhanden sein müssen, wenn ihre Plattformbedingungen in der Sperrdatei zum aktuellen Host passen.                                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Ermöglicht das Laden von Kanaloberflächen der Einrichtungslaufzeit vor dem Lauschen und verzögert anschließend das vollständige konfigurierte Kanal-Plugin bis zur Aktivierung nach Beginn des Lauschens. |

Manifest-Metadaten bestimmen, welche Provider-/Kanal-/Einrichtungsoptionen im Onboarding erscheinen, bevor die Laufzeit geladen wird. `package.json#openclaw.install` teilt dem Onboarding mit, wie dieses Plugin abgerufen oder aktiviert werden soll, wenn der Benutzer eine dieser Optionen auswählt. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-Registry für nicht gebündelte Plugin-Quellen erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte führen dazu, dass externe Plugins auf älteren Hosts übersprungen werden. Bei gebündelten Quell-Plugins wird davon ausgegangen, dass sie gemeinsam mit dem Host-Checkout versioniert sind.

`openclaw.install.requiredPlatformPackages` ist für npm-Pakete vorgesehen, die erforderliche native Binärdateien über optionale, plattformspezifische Aliasse bereitstellen. Führen Sie für jeden unterstützten Plattformalias den bloßen npm-Paketnamen auf. Während der npm-Installation überprüft OpenClaw nur den deklarierten Alias, dessen Plattformbedingungen in der Sperrdatei zum aktuellen Host passen. Wenn npm Erfolg meldet, diesen Alias jedoch auslässt, versucht OpenClaw es einmal mit einem neuen Cache erneut und setzt die Installation zurück, falls der Alias weiterhin fehlt.

`openclaw.compat.pluginApi` wird während der Paketinstallation für nicht gebündelte Plugin-Quellen erzwungen. Verwenden Sie es für die Untergrenze der OpenClaw-Plugin-SDK-/Laufzeit-API, gegen die das Paket erstellt wurde. Sie kann strenger als `minHostVersion` sein, wenn ein Plugin-Paket eine neuere API benötigt, für andere Abläufe aber weiterhin einen niedrigeren Installationshinweis beibehält. Die offizielle OpenClaw-Release-Synchronisierung hebt vorhandene API-Untergrenzen offizieller Plugins standardmäßig auf die OpenClaw-Release-Version an; reine Plugin-Releases können jedoch eine niedrigere Untergrenze beibehalten, wenn das Paket bewusst ältere Hosts unterstützt. Verwenden Sie nicht allein die Paketversion als Kompatibilitätsvertrag. `peerDependencies.openclaw` bleibt npm-Paketmetadatum; OpenClaw verwendet den Vertrag `openclaw.compat.pluginApi` für Entscheidungen zur Installationskompatibilität.

Offizielle Metadaten für die bedarfsgesteuerte Installation sollten `clawhubSpec` verwenden, wenn das Plugin auf ClawHub veröffentlicht ist; das Onboarding behandelt dies als bevorzugte Remote-Quelle und zeichnet nach der Installation Fakten zum ClawHub-Artefakt auf. `npmSpec` bleibt der Kompatibilitäts-Fallback für Pakete, die noch nicht zu ClawHub migriert wurden.

Die exakte Fixierung der npm-Version befindet sich bereits in `npmSpec`, beispielsweise `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalogeinträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Aktualisierungsabläufe sicher fehlschlagen, wenn das abgerufene npm-Artefakt nicht mehr mit dem fixierten Release übereinstimmt. Das interaktive Onboarding bietet aus Kompatibilitätsgründen weiterhin npm-Spezifikationen aus vertrauenswürdigen Registrys an, einschließlich bloßer Paketnamen und dist-tags. Die Katalogdiagnose kann zwischen exakten, variablen, integritätsfixierten, ohne Integritätsangabe versehenen, hinsichtlich des Paketnamens nicht übereinstimmenden und ungültigen Standardauswahlquellen unterscheiden. Sie warnt außerdem, wenn `expectedIntegrity` vorhanden ist, es aber keine gültige npm-Quelle gibt, an die es gebunden werden kann. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Aktualisierungsabläufe diesen Wert; wenn er fehlt, wird die Registry-Auflösung ohne Integritätsfixierung aufgezeichnet.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status-, Kanallisten- oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige Laufzeit zu laden. Der Einrichtungseinstiegspunkt sollte Kanalmetadaten sowie für die Einrichtung sichere Adapter für Konfiguration, Status und Geheimnisse bereitstellen; Netzwerkclients, Gateway-Listener und Transportlaufzeiten müssen im Haupteinstiegspunkt der Erweiterung verbleiben.

Felder für Laufzeit-Einstiegspunkte setzen die Paketgrenzenprüfungen für Quell-Einstiegspunktfelder nicht außer Kraft. Beispielsweise kann `openclaw.runtimeExtensions` einen aus dem Paket herausführenden `openclaw.extensions`-Pfad nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist bewusst eng begrenzt. Es macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit erlaubt es Installationsabläufen nur die Wiederherstellung nach bestimmten veralteten Upgrade-Fehlern gebündelter Plugins, etwa einem fehlenden Pfad eines gebündelten Plugins oder einem veralteten `channels.<id>`-Eintrag für dasselbe gebündelte Plugin. Nicht damit zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und verweisen Betreiber auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist ein Paketmetadatum für ein kleines Prüfmodul:

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

Verwenden Sie es, wenn Einrichtung, Doctor, Status oder schreibgeschützte Anwesenheitsabläufe eine kostengünstige Ja/Nein-Authentifizierungsprüfung benötigen, bevor das vollständige Kanal-Plugin geladen wird. Der persistente Authentifizierungsstatus ist nicht der konfigurierte Kanalstatus: Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren, Laufzeitabhängigkeiten zu reparieren oder zu entscheiden, ob eine Kanallaufzeit geladen werden soll. Der Zielexport sollte eine kleine Funktion sein, die ausschließlich den persistenten Zustand liest; leiten Sie ihn nicht durch das vollständige Exportmodul der Kanallaufzeit.

`openclaw.channel.configuredState` folgt derselben Struktur für kostengünstige, ausschließlich umgebungsbasierte Prüfungen des Konfigurationsstatus:

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

Verwenden Sie es, wenn ein Kanal den Konfigurationsstatus anhand der Umgebung oder anderer kleiner Eingaben außerhalb der Laufzeit ermitteln kann. Wenn die Prüfung eine vollständige Konfigurationsauflösung oder die tatsächliche Kanallaufzeit benötigt, belassen Sie diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## Ermittlungspriorität (doppelte Plugin-IDs)

OpenClaw ermittelt Plugins aus drei Stammverzeichnissen, die in dieser Reihenfolge geprüft werden: mit OpenClaw ausgelieferte gebündelte Plugins, das globale Installationsstammverzeichnis (`~/.openclaw/extensions`) und das aktuelle Arbeitsbereichsstammverzeichnis (`<workspace>/.openclaw/extensions`) sowie alle expliziten Einträge in `plugins.load.paths`.

Wenn zwei ermittelte Plugins dieselbe `id` aufweisen, wird nur das Manifest mit der **höchsten Priorität** beibehalten; Duplikate mit niedrigerer Priorität werden verworfen, statt daneben geladen zu werden. Priorität von hoch nach niedrig:

1. **Durch Konfiguration ausgewählt** — ein explizit in `plugins.entries.<id>` fixierter Pfad
2. **Globale Installation, die einem erfassten Installationsdatensatz entspricht** — ein über `openclaw plugin install`/`openclaw plugin update` installiertes Plugin, das die Installationsverfolgung von OpenClaw für dieselbe ID erkennt, selbst wenn die ID auch zu einem gebündelten Plugin gehört
3. **Gebündelt** — mit OpenClaw ausgelieferte Plugins
4. **Arbeitsbereich** — relativ zum aktuellen Arbeitsbereich ermittelte Plugins
5. Jeder andere ermittelte Kandidat

Auswirkungen:

- Eine abgezweigte oder veraltete Kopie eines gebündelten Plugins, die sich ohne Erfassung im Arbeitsbereich oder globalen Stammverzeichnis befindet, überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin zu überschreiben, führen Sie entweder `openclaw plugin install` für diese ID aus, damit die erfasste globale Installation eine höhere Priorität als die gebündelte Kopie erhält, oder fixieren Sie über `plugins.entries.<id>` einen bestimmten Pfad, damit dieser aufgrund der konfigurationsausgewählten Priorität gewinnt.
- Verworfene Duplikate werden protokolliert, sodass Doctor und Startdiagnosen auf die verworfene Kopie verweisen können.
- Durch Konfiguration ausgewählte Überschreibungen von Duplikaten werden in Diagnosen als explizite Überschreibungen bezeichnet, erzeugen jedoch weiterhin eine Warnung, damit veraltete Forks und versehentliche Überschattungen sichtbar bleiben.

## Anforderungen an das JSON-Schema

- **Jedes Plugin muss ein JSON-Schema mitliefern**, selbst wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen und Schreiben der Konfiguration validiert, nicht zur Laufzeit.
- Wenn Sie ein gebündeltes Plugin um neue Konfigurationsschlüssel erweitern oder davon einen Fork erstellen, aktualisieren Sie gleichzeitig dessen `configSchema` in `openclaw.plugin.json`. Schemas gebündelter Plugins sind strikt. Wenn Sie daher `plugins.entries.<id>.config.myNewKey` zur Benutzerkonfiguration hinzufügen, ohne `myNewKey` zu `configSchema.properties` hinzuzufügen, wird die Konfiguration abgelehnt, bevor die Plugin-Laufzeit geladen wird.

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

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, sofern die Kanal-ID nicht durch ein Plugin-Manifest deklariert ist. Wenn dieselbe ID auch in `plugins.allow`, `plugins.entries` oder `plugins.installs` vorkommt (ein Plugin, auf das verwiesen wird, das derzeit jedoch nicht auffindbar ist), stuft OpenClaw dies stattdessen zu einer **Warnung** herab.
- Verweise auf unbekannte Plugin-IDs in `plugins.entries.<id>`, `plugins.allow` und `plugins.deny` sind **Warnungen** („veralteter Konfigurationseintrag ignoriert“), keine Fehler. Dadurch blockieren Upgrades sowie entfernte oder umbenannte Plugins den Start des Gateways nicht.
- Wenn `plugins.slots.memory` auf eine unbekannte Plugin-ID verweist, ist dies ein **Fehler**. Eine Ausnahme bildet das bekannte offizielle externe Plugin `memory-lancedb`, für das stattdessen eine Warnung ausgegeben wird.
- Wenn ein Plugin installiert ist, aber ein fehlerhaftes oder fehlendes Manifest oder Schema besitzt, schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration vorhanden, das Plugin jedoch **deaktiviert** ist, bleibt die Konfiguration erhalten und in Doctor sowie den Protokollen wird eine **Warnung** angezeigt.

Das vollständige `plugins.*`-Schema finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich solcher, die aus dem lokalen Dateisystem geladen werden. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient ausschließlich der Erkennung und Validierung.
- Native Manifeste werden mit JSON5 geparst. Daher sind Kommentare, nachgestellte Kommas und Schlüssel ohne Anführungszeichen zulässig, solange der resultierende Wert weiterhin ein Objekt ist.
- Der Manifest-Loader liest ausschließlich dokumentierte Manifestfelder. Vermeiden Sie benutzerdefinierte Schlüssel auf oberster Ebene.
- `channels`, `providers`, `cliBackends` und `skills` können vollständig weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerCatalogEntry` muss schlank bleiben und sollte keinen umfangreichen Laufzeitcode importieren. Verwenden Sie es für statische Metadaten des Provider-Katalogs oder eng begrenzte Erkennungsdeskriptoren, nicht für die Ausführung zum Anfragezeitpunkt.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory` (Standardwert `memory-core`), `kind: "context-engine"` über `plugins.slots.contextEngine` (Standardwert `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. `OpenClawPluginDefinition.kind` im Laufzeiteinstieg ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins erhalten.
- Metadaten für Umgebungsvariablen (`setup.providers[].envVars`, das veraltete `providerAuthEnvVars` und `channelEnvVars`) sind ausschließlich deklarativ. Status-, Audit-, Cron-Zustellungsvalidierungs- und andere schreibgeschützte Oberflächen wenden weiterhin die Plugin-Vertrauens- und effektive Aktivierungsrichtlinie an, bevor sie eine Umgebungsvariable als konfiguriert behandeln.
- Laufzeit-Metadaten für Assistenten, die Provider-Code benötigen, finden Sie unter [Provider-Laufzeit-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Anforderungen an Positivlisten des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
