---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Validierungsfehler eines Plugins beheben.
summary: Anforderungen an Plugin-Manifest und JSON-Schema (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-07-16T13:06:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

Diese Seite behandelt das **native OpenClaw-Plugin-Manifest**, `openclaw.plugin.json`. Informationen zu kompatiblen Bundle-Layouts (Codex, Claude, Cursor) finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden stattdessen ihre eigenen Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Layouts automatisch, validiert sie jedoch nicht anhand des unten beschriebenen Schemas `openclaw.plugin.json`. Bei einem kompatiblen Bundle liest OpenClaw die Bundle-Metadaten, die deklarierten Skill-Stammverzeichnisse, die Claude-Befehlsstammverzeichnisse, die Claude-Standardwerte für `settings.json`, die Claude-LSP-Standardwerte und die unterstützten Hook-Pakete, sofern das Layout den Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** `openclaw.plugin.json` im **Plugin-Stammverzeichnis** bereitstellen. OpenClaw liest diese Datei, um die Konfiguration **ohne Ausführung des Plugin-Codes** zu validieren. Ein fehlendes oder ungültiges Manifest verhindert die Konfigurationsvalidierung und wird als Plugin-Fehler behandelt.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter [Plugins](/de/tools/plugin), Informationen zum nativen Capability-Modell und aktuelle Hinweise zur externen Kompatibilität unter [Capability-Modell](/de/plugins/architecture#public-capability-model).

## Zweck dieser Datei

`openclaw.plugin.json` enthält Metadaten, die OpenClaw **vor dem Laden Ihres Plugin-Codes** liest. Sämtliche darin enthaltenen Daten müssen sich mit ausreichend geringem Aufwand prüfen lassen, ohne die Plugin-Laufzeit zu starten.

**Verwenden Sie sie für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurationsoberfläche
- Metadaten für Authentifizierung, Onboarding und Einrichtung (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Steuerungsebenen
- Zuständigkeit für Modellfamilien-Kurzformen
- statische Momentaufnahmen der Capability-Zuständigkeit (`contracts`)
- Metadaten für QA-Runner, die der gemeinsame Host `openclaw qa` prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie sie nicht für:** die Registrierung von Laufzeitverhalten, die Deklaration von Code-Einstiegspunkten oder npm-Installationsmetadaten. Diese gehören in Ihren Plugin-Code und in `package.json`.

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
| `id`                  | Ja           | `string`           | Kanonische Plugin-ID. Diese ID wird in `plugins.entries.<id>` verwendet.                                                                                                                                                                                                      |
| `configSchema`                  | Ja           | `object`           | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                                                                   |
| `requiresPlugins`                  | Nein         | `string[]`           | Plugin-IDs, die ebenfalls installiert sein müssen, damit dieses Plugin wirksam wird. Bei der Erkennung bleibt das Plugin ladbar, es wird jedoch gewarnt, wenn ein erforderliches Plugin fehlt.                                                                              |
| `enabledByDefault`                  | Nein         | `true`           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie den Wert weg oder legen Sie einen anderen Wert als `true` fest, damit das Plugin standardmäßig deaktiviert bleibt.                                                                  |
| `enabledByDefaultOnPlatforms`                  | Nein         | `string[]`           | Kennzeichnet ein gebündeltes Plugin nur auf den aufgeführten Node.js-Plattformen als standardmäßig aktiviert, beispielsweise `["darwin"]`. Eine explizite Konfiguration hat weiterhin Vorrang.                                                                       |
| `legacyPluginIds`                  | Nein         | `string[]`           | Veraltete IDs, die zu dieser kanonischen Plugin-ID normalisiert werden.                                                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`                  | Nein         | `string[]`           | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                                                                   |
| `kind`                  | Nein         | `PluginKind \| PluginKind[]`           | Deklariert eine oder mehrere exklusive Plugin-Arten (`"memory"`, `"context-engine"`), die von `plugins.slots.*` verwendet werden. Ein Plugin, dem beide Plätze gehören, deklariert beide Arten in einem Array.                                                       |
| `channels`                  | Nein         | `string[]`           | Kanal-IDs, die diesem Plugin gehören. Wird für die Erkennung und Konfigurationsvalidierung verwendet.                                                                                                                                                                      |
| `providers`                  | Nein         | `string[]`           | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                                                                   |
| `providerCatalogEntry`                  | Nein         | `string`           | Pfad des schlanken Provider-Katalogmoduls relativ zum Plugin-Stammverzeichnis für manifestbezogene Provider-Katalogmetadaten, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.                                                              |
| `modelSupport`                  | Nein         | `object`           | Manifestverwaltete Kurzform-Metadaten für Modellfamilien, mit denen das Plugin vor der Laufzeit automatisch geladen wird.                                                                                                                                                  |
| `modelCatalog`                  | Nein         | `object`           | Deklarative Modellkatalog-Metadaten für Provider, die diesem Plugin gehören. Dies ist der Steuerungsebenenvertrag für zukünftige schreibgeschützte Auflistungen, Onboarding, Modellauswahl, Aliase und Unterdrückung, ohne die Plugin-Laufzeit zu laden.                      |
| `modelPricing`                  | Nein         | `object`           | Providerverwaltete Richtlinie zur externen Preisabfrage. Verwenden Sie sie, um lokale oder selbst gehostete Provider von externen Preiskatalogen auszunehmen oder Provider-Referenzen OpenRouter-/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Kern fest zu codieren. |
| `modelIdNormalization`                  | Nein         | `object`           | Providerverwaltete Bereinigung von Modell-ID-Aliasen und -Präfixen, die ausgeführt werden muss, bevor die Provider-Laufzeit geladen wird.                                                                                                                                  |
| `providerEndpoints`                  | Nein         | `object[]`           | Manifestverwaltete Endpunkt-Host-/baseUrl-Metadaten für Provider-Routen, die der Kern klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                                                                       |
| `providerRequest`                  | Nein         | `object`           | Einfache Metadaten zu Provider-Familie und Anfragekompatibilität, die von der generischen Anfragerichtlinie verwendet werden, bevor die Provider-Laufzeit geladen wird.                                                                                                   |
| `secretProviderIntegrations`                  | Nein         | `Record<string, object>`           | Deklarative Voreinstellungen für SecretRef-Ausführungs-Provider, die Einrichtungs- oder Installationsoberflächen anbieten können, ohne providerspezifische Integrationen im Kern fest zu codieren.                                                                        |
| `cliBackends`                  | Nein         | `string[]`           | IDs von CLI-Inferenz-Backends, die diesem Plugin gehören. Wird zur automatischen Aktivierung beim Start anhand expliziter Konfigurationsreferenzen verwendet.                                                                                                             |
| `syntheticAuthRefs`                  | Nein         | `string[]`           | Provider- oder CLI-Backend-Referenzen, deren pluginverwalteter Hook für synthetische Authentifizierung bei der initialen Modellerkennung geprüft werden soll, bevor die Laufzeit geladen wird.                                                                             |
| `nonSecretAuthMarkers`                  | Nein         | `string[]`           | Platzhalterwerte für API-Schlüssel, die einem gebündelten Plugin gehören und nicht geheime lokale, OAuth- oder umgebungsbezogene Anmeldedatenzustände darstellen.                                                                                                         |
| `commandAliases`                  | Nein         | `object[]`           | Befehlsnamen, die diesem Plugin gehören und pluginbezogene Konfigurations- und CLI-Diagnosen erzeugen sollen, bevor die Laufzeit geladen wird.                                                                                                                             |
| `providerAuthEnvVars`                  | Nein         | `Record<string, string[]>`           | Veraltete Kompatibilitätsmetadaten für Umgebungsvariablen zur Abfrage von Provider-Authentifizierung und -Status. Bevorzugen Sie `setup.providers[].envVars` für neue Plugins; OpenClaw liest diese während des Übergangszeitraums weiterhin.                                        |
| `providerUsageAuthEnvVars`                  | Nein         | `Record<string, string[]>`           | Provider-Anmeldedaten ausschließlich für Nutzung und Abrechnung. OpenClaw verwendet diese Namen zur Nutzungserkennung und Bereinigung von Geheimnissen, jedoch niemals für die Inferenz-Authentifizierung.                                                               |
| `providerAuthAliases`                  | Nein         | `Record<string, string>`           | Provider-IDs, die für die Authentifizierungsabfrage eine andere Provider-ID wiederverwenden sollen, beispielsweise ein Coding-Provider, der den API-Schlüssel und die Authentifizierungsprofile des Basis-Providers gemeinsam nutzt.                                      |
| `channelEnvVars`                  | Nein         | `Record<string, string[]>`           | Einfache Kanal-Umgebungsmetadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie diese für umgebungsbasierte Kanaleinrichtungs- oder Authentifizierungsoberflächen, die generische Start- oder Konfigurationshilfen erkennen sollen.                    |
| `providerAuthChoices`                  | Nein         | `object[]`           | Einfache Metadaten zu Authentifizierungsoptionen für Onboarding-Auswahlfelder, die Auflösung bevorzugter Provider und die unkomplizierte Verdrahtung von CLI-Flags.                                                                                                       |
| `activation`                  | Nein         | `object`           | Einfache Metadaten für die Aktivierungsplanung zum Laden bei Start-, Provider-, Befehls-, Kanal-, Routen- und Funktionsauslösern. Nur Metadaten; das tatsächliche Verhalten verbleibt weiterhin bei der Plugin-Laufzeit.                                                   |
| `setup`                  | Nein         | `object`           | Einfache Einrichtungs-/Onboarding-Deskriptoren, die Erkennungs- und Einrichtungsoberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                                                              |
| `qaRunners`                  | Nein         | `object[]`           | Einfache Deskriptoren für QA-Runner, die vom gemeinsamen `openclaw qa`-Host verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                                                                |
| `contracts`                  | Nein         | `object`           | Statische Momentaufnahme der Funktionszuständigkeit für externe Authentifizierungs-Hooks, Einbettungen, Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bild-/Video-/Musikerzeugung, Webabruf, Websuche, Worker-Provider, Dokument-/Webinhaltsextraktion und Tool-Zuständigkeit. |
| `configContracts`                    | Nein     | `object`                     | Manifest-gesteuertes Konfigurationsverhalten, das von generischen Core-Hilfsfunktionen verwendet wird: Erkennung gefährlicher Flags, SecretRef-Migrationsziele und Eingrenzung veralteter Konfigurationspfade. Siehe [configContracts-Referenz](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | Nein     | `Record<string, object>`     | Kostengünstige Standardwerte für das Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Nein     | `Record<string, object>`     | Kostengünstige Authentifizierungsmetadaten für die Bilderzeugung für Provider-IDs, die in `contracts.imageGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Schutzprüfungen für Basis-URLs.                                                                                                         |
| `videoGenerationProviderMetadata`    | Nein     | `Record<string, object>`     | Kostengünstige Authentifizierungsmetadaten für die Videoerzeugung für Provider-IDs, die in `contracts.videoGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Schutzprüfungen für Basis-URLs.                                                                                                         |
| `musicGenerationProviderMetadata`    | Nein     | `Record<string, object>`     | Kostengünstige Authentifizierungsmetadaten für die Musikerzeugung für Provider-IDs, die in `contracts.musicGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Schutzprüfungen für Basis-URLs.                                                                                                         |
| `toolMetadata`                       | Nein     | `Record<string, object>`     | Kostengünstige Verfügbarkeitsmetadaten für Plugin-eigene Tools, die in `contracts.tools` deklariert sind. Verwenden Sie sie, wenn ein Tool die Laufzeit nicht laden soll, sofern keine Hinweise aus Konfiguration, Umgebungsvariablen oder Authentifizierung vorliegen.                                                                                                  |
| `channelConfigs`                     | Nein     | `Record<string, object>`     | Manifest-gesteuerte Metadaten zur Kanalkonfiguration, die vor dem Laden der Laufzeit in die Erkennungs- und Validierungsoberflächen integriert werden.                                                                                                                                                                 |
| `skills`                             | Nein     | `string[]`                   | Zu ladende Skill-Verzeichnisse, relativ zum Plugin-Stammverzeichnis.                                                                                                                                                                                                                    |
| `name`                               | Nein     | `string`                     | Für Menschen lesbarer Plugin-Name.                                                                                                                                                                                                                                                |
| `description`                        | Nein     | `string`                     | Kurze Zusammenfassung, die auf Plugin-Oberflächen angezeigt wird.                                                                                                                                                                                                                                    |
| `catalog`                            | Nein     | `object`                     | Optionale Darstellungshinweise für Plugin-Katalogoberflächen. Diese Metadaten installieren oder aktivieren kein Plugin und verleihen ihm kein Vertrauen.                                                                                                                                               |
| `icon`                               | Nein     | `string`                     | HTTPS-Bild-URL für Marketplace-/Katalogkarten. ClawHub akzeptiert jede gültige `https://`-URL und verwendet das standardmäßige Plugin-Symbol, wenn diese Angabe fehlt oder ungültig ist.                                                                                                         |
| `version`                            | Nein     | `string`                     | Informative Plugin-Version.                                                                                                                                                                                                                                              |
| `uiHints`                            | Nein     | `Record<string, object>`     | UI-Beschriftungen, Platzhalter und Vertraulichkeitshinweise für Konfigurationsfelder.                                                                                                                                                                                                          |

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

| Feld       | Typ       | Bedeutung                                                                  |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Ob dieses Plugin in Katalogoberflächen hervorgehoben werden soll.          |
| `order`    | `number`  | Aufsteigender Anzeigehinweis für kuratierte Plugins; niedrigere Werte erscheinen früher. |

## Referenz für Metadaten von Generierungs-Providern

Die Metadatenfelder für Generierungs-Provider beschreiben statische Authentifizierungssignale für Provider, die in der entsprechenden Liste `contracts.*GenerationProviders` deklariert sind. OpenClaw liest diese Felder, bevor die Provider-Laufzeit geladen wird, damit zentrale Tools feststellen können, ob ein Generierungs-Provider verfügbar ist, ohne jedes Provider-Plugin zu importieren.

Verwenden Sie diese Felder nur für kostengünstig ermittelbare, deklarative Fakten. Transport, Anfragetransformationen, Token-Aktualisierung, Validierung von Anmeldedaten und das eigentliche Generierungsverhalten verbleiben in der Plugin-Laufzeit.

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

| Feld                   | Erforderlich | Typ        | Bedeutung                                                                                                                                           |
| ---------------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Nein         | `string[]` | Zusätzliche Provider-IDs, die als statische Authentifizierungsaliase für den Generierungs-Provider gelten sollen.                                    |
| `authProviders`        | Nein         | `string[]` | Provider-IDs, deren konfigurierte Authentifizierungsprofile als Authentifizierung für diesen Generierungs-Provider gelten sollen.                    |
| `configSignals`        | Nein         | `object[]` | Kostengünstig ermittelbare, rein konfigurationsbasierte Verfügbarkeitssignale für lokale oder selbst gehostete Provider, die ohne Authentifizierungsprofile oder Umgebungsvariablen konfiguriert werden können. |
| `authSignals`          | Nein         | `object[]` | Explizite Authentifizierungssignale. Wenn vorhanden, ersetzen diese den Standardsignalsatz aus der Provider-ID, `aliases` und `authProviders`. |
| `referenceAudioInputs` | Nein         | `boolean`  | Nur für Videogenerierung. Auf `true` setzen, wenn der Provider Referenz-Audioassets akzeptiert; andernfalls blendet `video_generate` Audioreferenzparameter aus. |

Jeder Eintrag `configSignals` unterstützt:

| Feld             | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                 |
| ---------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Ja           | `string`   | Punktpfad zum Plugin-eigenen Konfigurationsobjekt, das geprüft werden soll, beispielsweise `plugins.entries.example.config`.                                                            |
| `overlayPath`    | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objekt vor der Auswertung des Signals über das Stammobjekt gelegt werden soll. Verwenden Sie dies für funktionsspezifische Konfigurationen wie `image`, `video` oder `music`. |
| `overlayMapPath` | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objektwerte jeweils über das Stammobjekt gelegt werden sollen. Verwenden Sie dies für benannte Kontenzuordnungen wie `accounts`, bei denen jedes konfigurierte Konto die Bedingung erfüllen soll. |
| `required`       | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, die konfigurierte Werte enthalten müssen. Zeichenfolgen dürfen nicht leer sein; Objekte und Arrays dürfen nicht leer sein.             |
| `requiredAny`    | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, von denen mindestens einer einen konfigurierten Wert enthalten muss.                                                                  |
| `mode`           | Nein         | `object`   | Optionale Schutzbedingung für den Zeichenfolgenmodus innerhalb der effektiven Konfiguration. Verwenden Sie diese, wenn die rein konfigurationsbasierte Verfügbarkeit nur für einen Modus gilt. |

Jede Schutzbedingung `mode` unterstützt:

| Feld         | Erforderlich | Typ        | Bedeutung                                                                          |
| ------------ | ------------ | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Nein         | `string`   | Punktpfad innerhalb der effektiven Konfiguration. Standardmäßig `mode`.            |
| `default`    | Nein         | `string`   | Zu verwendender Moduswert, wenn der Pfad in der Konfiguration fehlt.                |
| `allowed`    | Nein         | `string[]` | Wenn vorhanden, trifft das Signal nur zu, wenn der effektive Modus einer dieser Werte ist. |
| `disallowed` | Nein         | `string[]` | Wenn vorhanden, trifft das Signal nicht zu, wenn der effektive Modus einer dieser Werte ist. |

Jeder Eintrag `authSignals` unterstützt:

| Feld              | Erforderlich | Typ      | Bedeutung                                                                                                                                                                     |
| ----------------- | ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string` | Provider-ID, die in konfigurierten Authentifizierungsprofilen geprüft werden soll.                                                                                            |
| `providerBaseUrl` | Nein         | `object` | Optionale Schutzbedingung, durch die das Signal nur gilt, wenn der referenzierte konfigurierte Provider eine zulässige Basis-URL verwendet. Verwenden Sie dies, wenn ein Authentifizierungsalias nur für bestimmte APIs gültig ist. |

Jede Schutzbedingung `providerBaseUrl` unterstützt:

| Feld              | Erforderlich | Typ        | Bedeutung                                                                                                                                            |
| ----------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string`   | Konfigurations-ID des Providers, dessen `baseUrl` geprüft werden soll.                                                                              |
| `defaultBaseUrl`  | Nein         | `string`   | Anzunehmende Basis-URL, wenn `baseUrl` in der Provider-Konfiguration fehlt.                                                                        |
| `allowedBaseUrls` | Ja           | `string[]` | Zulässige Basis-URLs für dieses Authentifizierungssignal. Das Signal wird ignoriert, wenn die konfigurierte oder standardmäßige Basis-URL keinem dieser normalisierten Werte entspricht. |

## Referenz für Tool-Metadaten

`toolMetadata` verwendet dieselben Formen `configSignals` und `authSignals` wie die Metadaten von Generierungs-Providern, wobei der Tool-Name als Schlüssel dient. `contracts.tools` deklariert die Zuständigkeit. `toolMetadata` deklariert kostengünstig ermittelbare Verfügbarkeitsnachweise, damit OpenClaw vermeiden kann, eine Plugin-Laufzeit nur deshalb zu importieren, damit deren Tool-Factory `null` zurückgibt.

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

Einträge vom Typ `toolMetadata` akzeptieren zusätzlich zu den oben beschriebenen gemeinsamen Feldern `configSignals`/`authSignals` auch `optional` (kennzeichnet das Tool als nicht erforderlich für die Plugin-Aktivierung) und `replaySafe` (kennzeichnet die Tool-Ausführung als sicher wiederholbar nach einem unvollständigen Modelldurchlauf).

Wenn ein Tool kein `toolMetadata` besitzt, behält OpenClaw das bestehende Verhalten bei und lädt das zuständige Plugin, wenn der Tool-Vertrag mit der Richtlinie übereinstimmt. Bei Tools in häufig ausgeführten Pfaden, deren Factory von Authentifizierung oder Konfiguration abhängt, sollten Plugin-Autoren `toolMetadata` deklarieren, anstatt die zentrale Laufzeit zu importieren, um dies abzufragen.

## Referenz für providerAuthChoices

Jeder Eintrag `providerAuthChoices` beschreibt eine Onboarding- oder Authentifizierungsoption. OpenClaw liest diese, bevor die Provider-Laufzeit geladen wird. Provider-Einrichtungslisten verwenden diese Manifestoptionen, aus Deskriptoren abgeleitete Einrichtungsoptionen und Metadaten aus dem Installationskatalog, ohne die Provider-Laufzeit zu laden.

| Feld                  | Erforderlich | Typ                                                                   | Bedeutung                                                                                                                       |
| --------------------- | ------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                                              | Provider-ID, zu der diese Auswahl gehört.                                                                                        |
| `method`              | Ja           | `string`                                                              | ID der Authentifizierungsmethode, an die weitergeleitet werden soll.                                                            |
| `choiceId`            | Ja           | `string`                                                              | Stabile ID der Authentifizierungsauswahl, die von Onboarding- und CLI-Abläufen verwendet wird.                                  |
| `choiceLabel`         | Nein         | `string`                                                              | Benutzerseitig sichtbare Bezeichnung. Falls weggelassen, greift OpenClaw auf `choiceId` zurück.                         |
| `choiceHint`          | Nein         | `string`                                                              | Kurzer Hilfetext für die Auswahl.                                                                                                |
| `assistantPriority`   | Nein         | `number`                                                              | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahllisten weiter vorne einsortiert.                          |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                                        | Blendet die Auswahl in Assistentenauswahllisten aus, erlaubt aber weiterhin die manuelle Auswahl über die CLI.                  |
| `deprecatedChoiceIds` | Nein         | `string[]`                                                            | Veraltete Auswahl-IDs, über die Benutzer zu dieser Ersatzauswahl weitergeleitet werden sollen.                                  |
| `groupId`             | Nein         | `string`                                                              | Optionale Gruppen-ID zum Gruppieren zusammengehöriger Auswahlmöglichkeiten.                                                    |
| `groupLabel`          | Nein         | `string`                                                              | Benutzerseitig sichtbare Bezeichnung für diese Gruppe.                                                                          |
| `groupHint`           | Nein         | `string`                                                              | Kurzer Hilfetext für die Gruppe.                                                                                                 |
| `onboardingFeatured`  | Nein         | `boolean`                                                             | Zeigt diese Gruppe in der hervorgehobenen Ebene der interaktiven Onboarding-Auswahl vor dem Eintrag „Mehr ...“ an.              |
| `optionKey`           | Nein         | `string`                                                              | Interner Optionsschlüssel für einfache Authentifizierungsabläufe mit einem einzelnen Flag.                                     |
| `cliFlag`             | Nein         | `string`                                                              | Name des CLI-Flags, beispielsweise `--openrouter-api-key`.                                                                          |
| `cliOption`           | Nein         | `string`                                                              | Vollständige Form der CLI-Option, beispielsweise `--openrouter-api-key <key>`.                                                            |
| `cliDescription`      | Nein         | `string`                                                              | In der CLI-Hilfe verwendete Beschreibung.                                                                                        |
| `appGuidedSecret`     | Nein         | `boolean`                                                             | Ein eingefügtes Secret zusammen mit den Provider-Standardwerten reicht für die appgestützte Einrichtung aus.                   |
| `appGuidedDiscovery`  | Nein         | `boolean`                                                             | Die zugehörige Laufzeit-Authentifizierungsmethode ist für die schreibgeschützte lokale Erkennung über `appGuidedSetup` zuständig. |
| `appGuidedAuth`       | Nein         | `"oauth"` \| `"device-code"`                                          | Providergesteuerte interaktive Anmeldung, die native Einrichtungsclients generisch darstellen können.                          |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Gibt an, auf welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Falls weggelassen, lautet der Standardwert `["text-inference"]`. |

Wenn `appGuidedDiscovery` auf „true“ gesetzt ist, muss die zugehörige Provider-Authentifizierungsmethode
`appGuidedSetup.detect` und `appGuidedSetup.prepare` bereitstellen. Die Erkennung muss
schreibgeschützt sein: keine Anmeldung, kein Modellabruf, kein Download und kein Schreiben der Konfiguration. Die Vorbereitung prüft
das exakt ausgewählte Modell erneut und gibt einen Konfigurationsvorschlag zurück; OpenClaw testet diesen
Vorschlag isoliert im Livebetrieb und übernimmt ihn erst nach erfolgreichem Abschluss.

## Referenz zu commandAliases

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeitbefehlsnamen besitzt, den Benutzer versehentlich in `plugins.allow` eintragen oder als CLI-Stammbefehl auszuführen versuchen könnten. OpenClaw verwendet diese Metadaten für Diagnosen, ohne den Laufzeitcode des Plugins zu importieren.

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
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl und nicht als CLI-Stammbefehl.                     |
| `cliCommand` | Nein         | `string`          | Zugehöriger CLI-Stammbefehl, der für CLI-Vorgänge vorgeschlagen werden soll, sofern vorhanden.  |

## Referenz zur Aktivierung

Verwenden Sie `activation`, wenn das Plugin kostengünstig angeben kann, bei welchen Control-Plane-Ereignissen es in einen Aktivierungs-/Ladeplan aufgenommen werden soll.

Dieser Block enthält Planer-Metadaten und ist keine Lebenszyklus-API. Er registriert kein Laufzeitverhalten, ersetzt `register(...)` nicht und verspricht nicht, dass der Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um die infrage kommenden Plugins einzugrenzen, bevor er auf vorhandene Manifest-Eigentümermetadaten wie `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks zurückgreift.

Bevorzugen Sie die engsten Metadaten, die die Zuständigkeit bereits beschreiben. Verwenden Sie `providers`, `channels`, `commandAliases`, Einrichtungsdeskriptoren oder `contracts`, wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planerhinweise, die sich nicht durch diese Zuständigkeitsfelder darstellen lassen. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Laufzeit-Aliasse wie `claude-cli`, `my-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist ausschließlich für eingebettete Agent-Harness-IDs vorgesehen, für die noch kein Zuständigkeitsfeld vorhanden ist.

Jedes Plugin sollte `activation.onStartup` bewusst festlegen. Setzen Sie es nur dann auf `true`, wenn das Plugin während des Gateway-Starts ausgeführt werden muss. Setzen Sie es auf `false`, wenn das Plugin beim Start inaktiv ist und nur aufgrund enger gefasster Auslöser geladen werden soll. Das Weglassen von `onStartup` führt nicht mehr implizit dazu, dass das Plugin beim Start geladen wird; verwenden Sie explizite Aktivierungsmetadaten für Start-, Kanal-, Konfigurations-, Agent-Harness-, Speicher- oder andere enger gefasste Aktivierungsauslöser.

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

| Feld               | Erforderlich | Typ                                                  | Bedeutung                                                                                                                                                                                                      |
| ------------------ | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nein         | `boolean`                                            | Explizite Aktivierung beim Gateway-Start. Jedes Plugin sollte dies festlegen. `true` importiert das Plugin beim Start; `false` hält es beim Start verzögert, sofern kein anderer passender Auslöser das Laden erfordert. |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, aufgrund derer dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                  |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Laufzeit-IDs eingebetteter Agent-Harnesses, aufgrund derer dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliasse.          |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, aufgrund derer dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                   |
| `onChannels`       | Nein         | `string[]`                                           | Kanal-IDs, aufgrund derer dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                     |
| `onRoutes`         | Nein         | `string[]`                                           | Routentypen, aufgrund derer dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                   |
| `onConfigPaths`    | Nein         | `string[]`                                           | Stammrelative Konfigurationspfade, aufgrund derer dieses Plugin in Start-/Ladepläne aufgenommen werden soll, wenn der Pfad vorhanden und nicht ausdrücklich deaktiviert ist.                                   |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Fähigkeitshinweise, die von der Control-Plane-Aktivierungsplanung verwendet werden. Bevorzugen Sie nach Möglichkeit engere Felder.                                                                  |

Aktuelle Live-Verbraucher:

- Die Planung des Gateway-Starts verwendet `activation.onStartup` für den expliziten Startimport.
- Die durch Befehle ausgelöste CLI-Planung greift auf das veraltete `commandAliases[].cliCommand` oder `commandAliases[].name` zurück.
- Die Planung des Agent-Runtime-Starts verwendet `activation.onAgentHarnesses` für eingebettete Test-Harnesses und das übergeordnete `cliBackends[]` für CLI-Runtime-Aliasse.
- Die durch Kanäle ausgelöste Setup-/Kanalplanung greift auf die veraltete Zuständigkeit von `channels[]` zurück, wenn explizite Metadaten zur Kanalaktivierung fehlen.
- Die Planung von Plugins beim Start verwendet `activation.onConfigPaths` für kanalunabhängige Root-Konfigurationsoberflächen wie den `browser`-Block des gebündelten Browser-Plugins.
- Die durch Provider ausgelöste Setup-/Runtime-Planung greift auf die veraltete Zuständigkeit von `providers[]` und des übergeordneten `cliBackends[]` zurück, wenn explizite Metadaten zur Provider-Aktivierung fehlen.

Planner-Diagnosen können explizite Aktivierungshinweise vom Rückgriff auf die Manifestzuständigkeit unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass `activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der Planner stattdessen die Zuständigkeit von `commandAliases` verwendete. Diese Begründungsbezeichnungen sind für Host-Diagnosen und Tests vorgesehen; Plugin-Autoren sollten weiterhin die Metadaten deklarieren, die die Zuständigkeit am besten beschreiben.

## Referenz zu qaRunners

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb
des gemeinsamen `openclaw qa`-Roots bereitstellt. Halten Sie diese Metadaten schlank und statisch; die Plugin-
Runtime bleibt über eine schlanke `runtime-api.ts`-Oberfläche, die passende
`qaRunnerCliRegistrations` exportiert, für die eigentliche CLI-Registrierung zuständig. Ein
optionales `adapterFactory` stellt den Transport für gemeinsame QA-Szenarien bereit, ohne
den Runner des registrierten Befehls zu ändern.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Die Docker-gestützte Matrix-Live-QA-Strecke gegen einen temporären Homeserver ausführen"
    }
  ]
}
```

| Feld          | Erforderlich | Typ      | Bedeutung                                                          |
| ------------- | ------------ | -------- | ------------------------------------------------------------------ |
| `commandName` | Ja           | `string` | Unterbefehl unterhalb von `openclaw qa`, zum Beispiel `matrix`.    |
| `description` | Nein         | `string` | Ersatz-Hilfetext, wenn der gemeinsame Host einen Platzhalterbefehl benötigt. |

Die ID `adapterFactory` muss mit `commandName` übereinstimmen. Exportieren Sie keine Registrierungen
für Befehle, die nicht im Manifest enthalten sind.

## Setup-Referenz

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen schlanke, Plugin-eigene Metadaten benötigen, bevor die Runtime geladen wird.

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
            "source": "lokale OpenAI-Anmeldedaten"
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

Das übergeordnete `cliBackends` bleibt gültig und beschreibt weiterhin CLI-Inferenz-Backends. `setup.cliBackends` ist die Setup-spezifische Deskriptoroberfläche für Steuerungsebenen-/Setup-Abläufe, die ausschließlich auf Metadaten basieren sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte, Deskriptor-zuerst verwendende Suchoberfläche für die Setup-Erkennung. Wenn der Deskriptor lediglich das infrage kommende Plugin eingrenzt und das Setup weiterhin umfangreichere Runtime-Hooks für die Setup-Phase benötigt, legen Sie `requiresRuntime: true` fest und behalten Sie `setup-api` als Ersatz-Ausführungspfad bei.

OpenClaw bezieht außerdem `setup.providers[].envVars` in generische Suchen nach Provider-Authentifizierung und Umgebungsvariablen ein. `providerAuthEnvVars` wird während des Einstellungszeitraums weiterhin über einen Kompatibilitätsadapter unterstützt, nicht gebündelte Plugins, die es noch verwenden, erhalten jedoch eine Manifestdiagnose. Neue Plugins sollten Setup-/Status-Metadaten zu Umgebungsvariablen in `setup.providers[].envVars` ablegen.

Verwenden Sie `providerUsageAuthEnvVars`, wenn Anmeldedaten auf Abrechnungs- oder Organisationsebene `resolveUsageAuth` aktivieren müssen, ohne zu Inferenz-Anmeldedaten zu werden. Diese Namen werden in die Blockierung von Workspace-dotenv-Dateien, die Entfernung aus ACP-Kindprozessen, die Filterung von Geheimnissen in der Sandbox und die umfassende Bereinigung von Geheimnissen einbezogen. Die Provider-Runtime liest und klassifiziert den Wert weiterhin innerhalb von `resolveUsageAuth`.

OpenClaw kann außerdem einfache Setup-Auswahlmöglichkeiten aus `setup.providers[].authMethods` ableiten, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false` deklariert, dass keine Setup-Runtime erforderlich ist. Explizite `providerAuthChoices`-Einträge werden für benutzerdefinierte Bezeichnungen, CLI-Flags, den Onboarding-Umfang und Assistentenmetadaten weiterhin bevorzugt.

Legen Sie `requiresRuntime: false` nur fest, wenn diese Deskriptoren für die Setup-Oberfläche ausreichen. OpenClaw behandelt ein explizites `false` als ausschließlich auf Deskriptoren basierenden Vertrag und führt `setup-api` oder `openclaw.setupEntry` für die Setup-Suche nicht aus. Wenn ein ausschließlich auf Deskriptoren basierendes Plugin dennoch einen dieser Setup-Runtime-Einträge ausliefert, meldet OpenClaw eine zusätzliche Diagnose und ignoriert ihn weiterhin. Ein ausgelassenes `requiresRuntime` behält das veraltete Rückgriffverhalten bei, damit vorhandene Plugins, die Deskriptoren ohne das Flag hinzugefügt haben, nicht beschädigt werden.

Da die Setup-Suche Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte `setup.providers[].id`- und `setup.cliBackends[]`-Werte über alle erkannten Plugins hinweg eindeutig bleiben. Bei uneindeutiger Zuständigkeit schlägt der Vorgang sicher geschlossen fehl, anstatt anhand der Erkennungsreihenfolge einen Gewinner auszuwählen.

Wenn die Setup-Runtime ausgeführt wird, melden die Setup-Registry-Diagnosen eine Abweichung von den Deskriptoren, falls `setup-api` einen Provider oder ein CLI-Backend registriert, das in den Manifestdeskriptoren nicht deklariert ist, oder falls für einen Deskriptor keine passende Runtime-Registrierung vorhanden ist. Diese Diagnosen sind zusätzlich und führen nicht zur Ablehnung veralteter Plugins.

### Referenz zu setup.providers

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                        |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Ja           | `string`   | Während des Setups oder Onboardings bereitgestellte Provider-ID. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods`  | Nein         | `string[]` | IDs der Setup-/Authentifizierungsmethoden, die dieser Provider ohne Laden der vollständigen Runtime unterstützt. |
| `envVars`      | Nein         | `string[]` | Umgebungsvariablen, die generische Setup-/Statusoberflächen vor dem Laden der Plugin-Runtime prüfen können. |
| `authEvidence` | Nein         | `object[]` | Schlanke lokale Prüfungen auf Authentifizierungsnachweise für Provider, die sich über nicht geheime Marker authentifizieren können. |

`authEvidence` ist für Provider-eigene lokale Anmeldedatenmarker vorgesehen, die ohne Laden von Runtime-Code überprüft werden können. Diese Prüfungen müssen schlank und lokal bleiben: keine Netzwerkaufrufe, keine Zugriffe auf Schlüsselbund oder Geheimnisverwaltung, keine Shell-Befehle und keine Abfragen der Provider-API.

Unterstützte Nachweiseinträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                     |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Nein         | `string`   | Umgebungsvariable, die einen expliziten Pfad zu einer Anmeldedatendatei enthält.                              |
| `fallbackPaths`    | Nein         | `string[]` | Lokale Pfade zu Anmeldedatendateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine aufgeführte Umgebungsvariable muss nicht leer sein, damit der Nachweis gültig ist.            |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Umgebungsvariable muss nicht leer sein, damit der Nachweis gültig ist.                       |
| `credentialMarker` | Ja           | `string`   | Nicht geheimer Marker, der zurückgegeben wird, wenn der Nachweis vorhanden ist.                               |
| `source`           | Nein         | `string`   | Benutzerseitig sichtbare Quellenbezeichnung für Authentifizierungs-/Statusausgaben.                           |

### Setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                         |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Während Setup und Onboarding bereitgestellte Deskriptoren für das Provider-Setup.                  |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs für die Setup-Phase, die für die Deskriptor-zuerst verwendende Setup-Suche genutzt werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs der Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins zugeordnet sind.        |
| `requiresRuntime`  | Nein         | `boolean`  | Gibt an, ob das Setup nach der Deskriptorsuche weiterhin die Ausführung von `setup-api` benötigt. |

## Referenz zu uiHints

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen zu kleinen Darstellungshinweisen. Schlüssel können Punkte für verschachtelte Konfigurationsfelder verwenden, aber kein Pfadsegment darf `__proto__`, `constructor` oder `prototype` sein; das Setup lehnt diese Namen ab.

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

| Feld          | Typ        | Bedeutung                              |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Benutzerseitig sichtbare Feldbezeichnung. |
| `help`        | `string`   | Kurzer Hilfetext.                      |
| `tags`        | `string[]` | Optionale UI-Tags.                     |
| `advanced`    | `boolean`  | Kennzeichnet das Feld als erweitert.  |
| `sensitive`   | `boolean`  | Kennzeichnet das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.  |

## Referenz zu Verträgen

Verwenden Sie `contracts` nur für statische Metadaten zur Zuständigkeit für Fähigkeiten, die OpenClaw lesen kann, ohne die Plugin-Runtime zu importieren.

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

| Feld                             | Typ        | Bedeutung                                                                                                                            |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Factory-IDs für Codex-App-Server-Erweiterungen, derzeit `codex-app-server`.                                                           |
| `agentToolResultMiddleware`      | `string[]` | Runtime-IDs, für die dieses Plugin Middleware für Tool-Ergebnisse registrieren darf.                                                  |
| `trustedToolPolicies`            | `string[]` | Plugin-lokale IDs vertrauenswürdiger Richtlinien vor der Tool-Ausführung, die ein installiertes Plugin registrieren darf. Mitgelieferte Plugins dürfen Richtlinien ohne dieses Feld registrieren. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Authentifizierungsprofile diesem Plugin gehört.                                                  |
| `embeddingProviders`             | `string[]` | IDs allgemeiner Embedding-Provider, die diesem Plugin für die wiederverwendbare Nutzung von Vektor-Embeddings einschließlich Speicher gehören. |
| `speechProviders`                | `string[]` | IDs von Sprach-Providern, die diesem Plugin gehören.                                                                                  |
| `realtimeTranscriptionProviders` | `string[]` | IDs von Providern für Echtzeittranskription, die diesem Plugin gehören.                                                              |
| `realtimeVoiceProviders`         | `string[]` | IDs von Providern für Echtzeitsprache, die diesem Plugin gehören.                                                                    |
| `memoryEmbeddingProviders`       | `string[]` | Veraltete IDs speicherspezifischer Embedding-Provider, die diesem Plugin gehören.                                                     |
| `mediaUnderstandingProviders`    | `string[]` | IDs von Providern für Medienverständnis, die diesem Plugin gehören.                                                                  |
| `transcriptSourceProviders`      | `string[]` | IDs von Providern für Transkriptquellen, die diesem Plugin gehören.                                                                  |
| `documentExtractors`             | `string[]` | IDs von Providern für die Dokumentextraktion (beispielsweise PDF), die diesem Plugin gehören.                                        |
| `imageGenerationProviders`       | `string[]` | IDs von Providern für die Bilderzeugung, die diesem Plugin gehören.                                                                  |
| `videoGenerationProviders`       | `string[]` | IDs von Providern für die Videoerzeugung, die diesem Plugin gehören.                                                                 |
| `musicGenerationProviders`       | `string[]` | IDs von Providern für die Musikerzeugung, die diesem Plugin gehören.                                                                 |
| `webContentExtractors`           | `string[]` | IDs von Providern für die Inhaltsextraktion aus Webseiten, die diesem Plugin gehören.                                                 |
| `webFetchProviders`              | `string[]` | IDs von Web-Abruf-Providern, die diesem Plugin gehören.                                                                               |
| `webSearchProviders`             | `string[]` | IDs von Websuch-Providern, die diesem Plugin gehören.                                                                                 |
| `workerProviders`                | `string[]` | IDs von Cloud-Worker-Providern, die diesem Plugin für die Bereitstellung und den profilgestützten Lease-Lebenszyklus gehören.         |
| `usageProviders`                 | `string[]` | Provider-IDs, deren Hooks für Nutzungsauthentifizierung und Nutzungssnapshots diesem Plugin gehören.                                  |
| `migrationProviders`             | `string[]` | IDs von Import-Providern, die diesem Plugin für `openclaw migrate` gehören.                                                           |
| `gatewayMethodDispatch`          | `string[]` | Reservierte Berechtigung für authentifizierte Plugin-HTTP-Routen, die Gateway-Methoden prozessintern aufrufen.                        |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin gehören.                                                                                     |

`contracts.embeddedExtensionFactories` bleibt für mitgelieferte Erweiterungs-Factorys erhalten, die ausschließlich für den Codex-App-Server bestimmt sind. Mitgelieferte Transformationen von Tool-Ergebnissen sollten stattdessen `contracts.agentToolResultMiddleware` deklarieren und sich mit `api.registerAgentToolResultMiddleware(...)` registrieren. Installierte Plugins dürfen dieselbe Middleware-Schnittstelle nur verwenden, wenn sie ausdrücklich aktiviert ist, und nur für Runtimes, die sie in `contracts.agentToolResultMiddleware` deklarieren.

Installierte Plugins, die die vom Host als vertrauenswürdig eingestufte Richtlinienebene vor der Tool-Ausführung benötigen, müssen jede registrierte lokale ID in `contracts.trustedToolPolicies` deklarieren und ausdrücklich aktiviert sein. Mitgelieferte Plugins behalten den bestehenden Pfad für vertrauenswürdige Richtlinien bei, installierte Plugins mit nicht deklarierten Richtlinien-IDs werden jedoch vor der Registrierung abgewiesen. Richtlinien-IDs sind auf das registrierende Plugin beschränkt, sodass zwei Plugins jeweils `workflow-budget` deklarieren und registrieren dürfen; ein einzelnes Plugin darf dieselbe lokale ID nicht zweimal registrieren.

Runtime-Registrierungen für `api.registerTool(...)` müssen mit `contracts.tools` übereinstimmen. Die Tool-Erkennung verwendet diese Liste, um nur die Plugin-Runtimes zu laden, denen die angeforderten Tools gehören können.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten `contracts.externalAuthProviders` deklarieren; nicht deklarierte Hooks für externe Authentifizierung werden ignoriert.

Provider-Plugins, die sowohl `resolveUsageAuth` als auch `fetchUsageSnapshot` implementieren, sollten jede automatisch erkannte Provider-ID in `contracts.usageProviders` deklarieren. Die Nutzungserkennung liest diesen Vertrag vor dem Laden des Runtime-Codes und überprüft anschließend beide Hooks, nachdem ausschließlich die deklarierten Eigentümer geladen wurden.

Allgemeine Embedding-Provider sollten `contracts.embeddingProviders` für jeden mit `api.registerEmbeddingProvider(...)` registrierten Adapter deklarieren. Verwenden Sie den allgemeinen Vertrag für die wiederverwendbare Vektorerzeugung, einschließlich Providern, die von der Speichersuche genutzt werden. `contracts.memoryEmbeddingProviders` ist eine veraltete speicherspezifische Kompatibilität und bleibt nur erhalten, während bestehende Provider zur generischen Schnittstelle für Embedding-Provider migriert werden.

Worker-Provider müssen jede `api.registerWorkerProvider(...)`-ID in `contracts.workerProviders` deklarieren. Der Kern speichert die dauerhafte Absicht, bevor `provision` aufgerufen wird; Provider validieren ihre Einstellungen vor der externen Zuweisung, und wiederholte Aufrufe mit derselben Vorgangs-ID müssen denselben Lease übernehmen. Der Kern speichert außerdem diesen Snapshot der validierten Einstellungen und übergibt ihn zusammen mit `leaseId` an `inspect({ leaseId, profile })` und `destroy({ leaseId, profile })`, auch nachdem das benannte Profil geändert oder entfernt wurde. Die Zerstörung ist idempotent, die Inspektion gibt die geschlossene Status-Union `active` / `destroyed` / `unknown` zurück, und auf Material privater SSH-Schlüssel wird ausschließlich über `SecretRef` verwiesen. Bereitgestellte SSH-Endpunkte müssen außerdem einen öffentlichen `hostKey` aus einer vertrauenswürdigen Bereitstellungsausgabe exakt als `algorithm base64` enthalten, ohne Hostnamen oder Kommentar, damit der Kern den Host vor dem Verbindungsaufbau fest zuordnen kann. Provider, die dynamische Identitätsreferenzen erzeugen, können das maßgebliche `resolveSshIdentity({ leaseId, profile, keyRef })` implementieren; Provider ohne diese Implementierung verwenden den generischen Geheimnisauflöser des Kerns. Ein maßgebliches `unknown` lässt einen aktiven lokalen Datensatz verwaisen; nach einer gespeicherten Zerstörungsanforderung bestätigt es den Abbau.

`contracts.gatewayMethodDispatch` akzeptiert derzeit `"authenticated-request"`. Dies ist eine API-Hygienesperre für native Plugin-HTTP-Routen, die absichtlich Gateway-Control-Plane-Methoden prozessintern aufrufen, und keine Sandbox gegen bösartige native Plugins. Verwenden Sie sie nur für sorgfältig geprüfte mitgelieferte oder operatorseitige Oberflächen, die bereits eine Gateway-HTTP-Authentifizierung erfordern. Eine berechtigte Route bleibt bei geschlossener Gateway-Zulassung für Root-Arbeiten nur dann erreichbar, wenn sie zusätzlich `auth: "gateway"` und das routenspezifische `gatewayRuntimeScopeSurface: "trusted-operator"` deklariert; gewöhnliche benachbarte Routen desselben Plugins bleiben hinter der Zulassungsgrenze. Dadurch bleiben der Sperrstatus und die Wiederaufnahme erreichbar, ohne dem gesamten Plugin eine Umgehung der Zulassung zu gewähren. Halten Sie Parsing und Antwortgestaltung außerhalb des Dispatchs begrenzt; wesentliche oder verändernde Arbeiten müssen über den Dispatch von Gateway-Methoden erfolgen, der die Zulassungs- und Bereichsdurchsetzung verantwortet.

## Referenz zu configContracts

Verwenden Sie `configContracts` für manifestgesteuertes Konfigurationsverhalten, das generische Kern-Hilfsfunktionen benötigen, ohne die Plugin-Runtime zu importieren: Erkennung gefährlicher Flags, SecretRef-Migrationsziele und Eingrenzung veralteter Konfigurationspfade.

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

| Feld                          | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                                              |
| ----------------------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Nein         | `string[]` | Konfigurationspfade relativ zum Stammverzeichnis, die darauf hinweisen, dass die Kompatibilitätsmigrationen dieses Plugins während der Einrichtung möglicherweise anwendbar sind. Dadurch können generische Runtime-Konfigurationslesevorgänge sämtliche Einrichtungsoberflächen von Plugins überspringen, wenn die Konfiguration nie auf das Plugin verweist. |
| `compatibilityRuntimePaths`   | Nein         | `string[]` | Kompatibilitätspfade relativ zum Stammverzeichnis, die dieses Plugin während der Runtime bedienen kann, bevor der Plugin-Code vollständig aktiviert wird. Verwenden Sie dies für veraltete Oberflächen, die die Menge mitgelieferter Kandidaten eingrenzen sollen, ohne jede kompatible Plugin-Runtime zu importieren. |
| `dangerousFlags`              | Nein         | `object[]` | Konfigurationsliterale, die `openclaw doctor` bei Aktivierung als unsicher oder gefährlich kennzeichnen sollte. Siehe unten.                                                                                                            |
| `secretInputs`                | Nein         | `object`   | Konfigurationspfade unter `plugins.entries.<id>.config`, die die Zielregistrierung für die SecretRef-Migration/-Prüfung als geheimnisförmige Zeichenfolgen behandeln sollte. Siehe unten.                                               |

Jeder `dangerousFlags`-Eintrag unterstützt:

| Feld     | Erforderlich | Typ                                   | Bedeutung                                                                                                            |
| -------- | ------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `path`   | Ja           | `string`                              | Durch Punkte getrennter Konfigurationspfad relativ zu `plugins.entries.<id>.config`. Unterstützt `*`-Platzhalter für Map-/Array-Segmente. |
| `equals` | Ja           | `string \| number \| boolean \| null` | Exaktes Literal, das diesen Konfigurationswert als gefährlich kennzeichnet.                                          |

`secretInputs` unterstützt:

| Feld                    | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                      |
| ----------------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Nein       | `boolean`  | Überschreibt die standardmäßige Aktivierung des gebündelten Plugins, wenn entschieden wird, ob diese SecretRef-Oberfläche aktiv ist. Verwenden Sie dies, wenn das Plugin gebündelt ist, die Oberfläche jedoch inaktiv bleiben soll, bis sie explizit in der Konfiguration aktiviert wird. |
| `paths`                 | Ja      | `object[]` | Konfigurationspfade für Geheimnisse, jeweils mit `path` (durch Punkte getrennt, relativ zu `plugins.entries.<id>.config`, unterstützt `*`-Platzhalter) und optional `expected` (derzeit nur `"string"`).                            |

## Referenz zu mediaUnderstandingProviderMetadata

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Provider für Medienverständnis Standardmodelle, eine Priorität für den automatischen Authentifizierungs-Fallback oder native Dokumentunterstützung besitzt, die generische Core-Hilfsfunktionen vor dem Laden der Runtime benötigen. Schlüssel müssen außerdem in `contracts.mediaUnderstandingProviders` deklariert werden.

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

| Feld                   | Typ                                                              | Bedeutung                                                                                                       |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Von diesem Provider bereitgestellte Medienfunktionen.                                                           |
| `defaultModels`        | `Record<string, string>`                                         | Zuordnungen von Funktionen zu Standardmodellen, die verwendet werden, wenn in der Konfiguration kein Modell angegeben ist. |
| `autoPriority`         | `Record<string, number>`                                         | Niedrigere Zahlen werden beim automatischen, auf Anmeldedaten basierenden Provider-Fallback früher einsortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Vom Provider unterstützte native Dokumenteingaben.                                                              |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Modellspezifische Überschreibungen je Dokumenttyp. Setzen Sie `image: false`, um die bildbasierte Extraktion für diesen Dokumenttyp zu deaktivieren. |

## Referenz zu channelConfigs

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin vor dem Laden der Runtime kostengünstig verfügbare Konfigurationsmetadaten benötigt. Die schreibgeschützte Ermittlung von Kanaleinrichtung und -status kann diese Metadaten für konfigurierte externe Kanäle direkt verwenden, wenn kein Einrichtungseintrag verfügbar ist oder wenn `setup.requiresRuntime: false` angibt, dass keine Einrichtungs-Runtime erforderlich ist.

`channelConfigs` sind Metadaten des Plugin-Manifests und kein neuer Konfigurationsabschnitt auf oberster Ebene für Benutzer. Benutzer konfigurieren Kanalinstanzen weiterhin unter `channels.<channel-id>`. OpenClaw liest die Manifestmetadaten, um vor der Ausführung des Plugin-Runtime-Codes zu bestimmen, welchem Plugin der konfigurierte Kanal gehört.

Bei einem Kanal-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten auch passende `channelConfigs`-Einträge deklarieren. Ohne diese kann OpenClaw das Plugin weiterhin laden, aber Konfigurationsschema-, Einrichtungs- und Control-UI-Oberflächen im Kaltpfad können die Form der kanaleigenen Optionen erst erkennen, nachdem die Plugin-Runtime ausgeführt wurde.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und `nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Prüfungen der Befehlskonfiguration deklarieren, die vor dem Laden der Kanal-Runtime ausgeführt werden. Gebündelte Kanäle können dieselben Standardwerte außerdem über `package.json#openclaw.channel.commands` zusammen mit ihren übrigen paketeigenen Kanal-Katalogmetadaten veröffentlichen.

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

| Feld          | Typ                      | Bedeutung                                                                                |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanalkonfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen, Platzhalter und Hinweise auf sensible Werte für diesen Kanalkonfigurationsabschnitt. |
| `label`       | `string`                 | Kanalbezeichnung, die in Auswahl- und Inspektionsoberflächen übernommen wird, wenn Runtime-Metadaten noch nicht verfügbar sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                          |
| `commands`    | `object`                 | Statische automatische Standardwerte für native Befehle und native Skills bei Konfigurationsprüfungen vor der Runtime. |
| `preferOver`  | `string[]`               | Veraltete oder nachrangige Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

### Ersetzen eines anderen Kanal-Plugins

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Eigentümer einer Kanal-ID ist, die auch von einem anderen Plugin bereitgestellt werden kann. Typische Fälle sind eine umbenannte Plugin-ID, ein eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der aus Gründen der Konfigurationskompatibilität dieselbe Kanal-ID beibehält.

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

Wenn `channels.chat` konfiguriert ist, berücksichtigt OpenClaw sowohl die Kanal-ID als auch die bevorzugte Plugin-ID. Wenn das nachrangige Plugin nur ausgewählt wurde, weil es gebündelt oder standardmäßig aktiviert ist, deaktiviert OpenClaw es in der effektiven Runtime-Konfiguration, sodass genau ein Plugin Eigentümer des Kanals und seiner Tools ist. Eine explizite Benutzerauswahl hat weiterhin Vorrang: Wenn der Benutzer beide Plugins explizit aktiviert (über `plugins.allow` oder eine substanzielle `plugins.entries`-Konfiguration), behält OpenClaw diese Auswahl bei und meldet Diagnosen zu doppelten Kanälen und Tools, statt die angeforderte Plugin-Menge stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die tatsächlich denselben Kanal bereitstellen können. Es ist kein allgemeines Prioritätsfeld und benennt keine Benutzerkonfigurationsschlüssel um.

## Referenz zu modelSupport

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin vor dem Laden der Plugin-Runtime anhand verkürzter Modell-IDs wie `gpt-5.6-sol` oder `claude-sonnet-4.6` ableiten soll.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet folgende Rangfolge an:

- Explizite `provider/model`-Referenzen verwenden die Manifestmetadaten des zugehörigen `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- Wenn ein nicht gebündeltes und ein gebündeltes Plugin beide übereinstimmen, hat das nicht gebündelte Plugin Vorrang
- Verbleibende Mehrdeutigkeiten werden ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen verkürzte Modell-IDs abgeglichen werden.    |
| `modelPatterns` | `string[]` | Quellen regulärer Ausdrücke, die nach dem Entfernen des Profilsuffixes gegen verkürzte Modell-IDs abgeglichen werden. |

`modelPatterns`-Einträge werden über `compileSafeRegex` kompiliert; dabei werden Muster mit verschachtelten Wiederholungen abgelehnt (beispielsweise `(a+)+$`). Muster, die die Sicherheitsprüfung nicht bestehen, werden ebenso wie syntaktisch ungültige reguläre Ausdrücke stillschweigend übersprungen. Halten Sie Muster einfach und vermeiden Sie verschachtelte Quantifizierer.

## Referenz zu modelCatalog

Verwenden Sie `modelCatalog`, wenn OpenClaw die Modellmetadaten eines Providers vor dem Laden der Plugin-Runtime kennen soll. Dies ist die dem Manifest zugehörige Quelle für feste Katalogzeilen, Provider-Aliasse, Unterdrückungsregeln und den Ermittlungsmodus. Die Aktualisierung zur Laufzeit gehört weiterhin in den Runtime-Code des Providers, das Manifest teilt dem Core jedoch mit, wann die Runtime erforderlich ist.

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

| Feld             | Typ                                                      | Bedeutung                                                                                                   |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Die Schlüssel sollten auch im übergeordneten `providers` vorkommen. |
| `aliases`        | `Record<string, object>`                                 | Provider-Aliasse, die für die Katalog- oder Unterdrückungsplanung in einen zugehörigen Provider aufgelöst werden sollen. |
| `suppressions`   | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus einem providerspezifischen Grund unterdrückt. |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Gibt an, ob der Provider-Katalog aus Manifestmetadaten gelesen und in den Cache aktualisiert werden kann oder die Runtime benötigt. |
| `runtimeAugment` | `boolean`                                                | Nur auf `true` setzen, wenn die Provider-Runtime nach der Manifest-/Konfigurationsplanung Katalogzeilen anhängen muss. |

`aliases` ist an der Suche nach der Provider-Zuständigkeit für die Modellkatalogplanung beteiligt. Aliasziele müssen Provider der obersten Ebene sein, die demselben Plugin gehören. Wenn eine nach Provider gefilterte Liste einen Alias verwendet, kann OpenClaw das zuständige Manifest lesen und API-/Basis-URL-Überschreibungen des Alias anwenden, ohne die Provider-Runtime zu laden. Aliasse erweitern ungefilterte Katalogauflistungen nicht; umfassende Listen geben nur die kanonischen Providerzeilen des zuständigen Providers aus.

`suppressions` ersetzt den alten Provider-Runtime-Hook `suppressBuiltInModel`. Unterdrückungseinträge werden nur berücksichtigt, wenn der Provider dem Plugin gehört oder als `modelCatalog.aliases`-Schlüssel deklariert ist, der auf einen zugehörigen Provider verweist. Runtime-Unterdrückungs-Hooks werden während der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld                  | Typ                      | Bedeutung                                                                                                                                                                                                        |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Optionale standardmäßige Basis-URL für Modelle in diesem Provider-Katalog.                                                                                                                                        |
| `api`                 | `ModelApi`               | Optionaler standardmäßiger API-Adapter für Modelle in diesem Provider-Katalog.                                                                                                                                    |
| `headers`             | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.                                                                                                                                               |
| `defaultUtilityModel` | `string`                 | Optionale, vom Provider empfohlene ID eines kleinen Modells für kurze interne Hilfsaufgaben (Titel, Fortschrittsbeschreibung). Wird verwendet, wenn `agents.defaults.utilityModel` nicht gesetzt ist und dieser Provider das primäre Modell des Agenten bereitstellt. |
| `models`              | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.                                                                                                                                      |

Modellfelder:

| Feld               | Typ                                                            | Bedeutung                                                                    |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                       |
| `name`             | `string`                                                       | Optionaler Anzeigename.                                                      |
| `api`              | `ModelApi`                                                     | Optionale API-Überschreibung pro Modell.                                     |
| `baseUrl`          | `string`                                                       | Optionale Basis-URL-Überschreibung pro Modell.                               |
| `headers`          | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                       |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalitäten, die das Modell akzeptiert. Andere Werte werden stillschweigend verworfen. |
| `reasoning`        | `boolean`                                                      | Gibt an, ob das Modell Reasoning-Verhalten bereitstellt.                      |
| `contextWindow`    | `number`                                                       | Natives Kontextfenster des Providers.                                        |
| `contextTokens`    | `number`                                                       | Optionale effektive Kontextobergrenze der Runtime, falls sie von `contextWindow` abweicht. |
| `maxTokens`        | `number`                                                       | Maximale Anzahl von Ausgabetokens, sofern bekannt.                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Optionale Überschreibungen der Modell-ID oder Parameter pro Denkstufe.       |
| `cost`             | `object`                                                       | Optionale Preise in USD pro Million Tokens, einschließlich optionalem `tieredPricing`. |
| `compat`           | `object`                                                       | Optionale Kompatibilitäts-Flags entsprechend der Kompatibilität der OpenClaw-Modellkonfiguration. |
| `mediaInput`       | `object`                                                       | Optionale Eingabekonfiguration pro Modalität, derzeit nur für Bilder.        |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Auflistungsstatus. Nur unterdrücken, wenn die Zeile überhaupt nicht erscheinen darf. |
| `statusReason`     | `string`                                                       | Optionaler Grund, der bei einem Nicht-verfügbar-Status angezeigt wird.       |
| `replaces`         | `string[]`                                                     | Ältere Provider-lokale Modell-IDs, die dieses Modell ersetzt.                |
| `replacedBy`       | `string`                                                       | Provider-lokale ID des Ersatzmodells für veraltete Zeilen.                   |
| `tags`             | `string[]`                                                     | Stabile Tags, die von Auswahlfeldern und Filtern verwendet werden.           |

Unterdrückungsfelder:

| Feld                       | Typ        | Bedeutung                                                                                                |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-ID der zu unterdrückenden Upstream-Zeile. Muss diesem Plugin gehören oder als zugehöriger Alias deklariert sein. |
| `model`                    | `string`   | Zu unterdrückende Provider-lokale Modell-ID.                                                             |
| `reason`                   | `string`   | Optionale Meldung, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.              |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste der Hosts effektiver Provider-Basis-URLs, die erforderlich sind, bevor die Unterdrückung angewendet wird. |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter `api`-Werte der Provider-Konfiguration, die erforderlich sind, bevor die Unterdrückung angewendet wird. |

Legen Sie keine Daten, die nur zur Runtime verfügbar sind, in `modelCatalog` ab. Verwenden Sie `static` nur, wenn die Manifestzeilen vollständig genug sind, damit nach Provider gefilterte Listen und Auswahloberflächen die Registry-/Runtime-Ermittlung überspringen können. Verwenden Sie `refreshable`, wenn Manifestzeilen nützliche auflistbare Ausgangsdaten oder Ergänzungen sind, aber eine Aktualisierung oder ein Cache später weitere Zeilen hinzufügen kann; aktualisierbare Zeilen sind für sich genommen nicht maßgeblich. Verwenden Sie `runtime`, wenn OpenClaw die Provider-Runtime laden muss, um die Liste zu ermitteln.

## Referenz zu modelIdNormalization

Verwenden Sie `modelIdNormalization` für kostengünstige, providereigene Bereinigungen von Modell-IDs, die vor dem Laden der Provider-Runtime erfolgen müssen. Dadurch verbleiben Aliasse wie kurze Modellnamen, ältere Provider-lokale IDs und Regeln für Proxy-Präfixe im Manifest des zuständigen Plugins statt in den zentralen Tabellen zur Modellauswahl.

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

| Feld                                 | Typ                     | Bedeutung                                                                                |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exakte Modell-ID-Aliasse ohne Beachtung der Groß-/Kleinschreibung. Werte werden wie angegeben zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Vor der Aliassuche zu entfernende Präfixe; nützlich für ältere Duplizierungen von Provider und Modell. |
| `prefixWhenBare`                     | `string`                | Hinzuzufügendes Präfix, wenn die normalisierte Modell-ID nicht bereits `/` enthält. |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für IDs ohne Präfix nach der Aliassuche, nach `modelPrefix` und `prefix` verschlüsselt. |

## Referenz zu providerEndpoints

Verwenden Sie `providerEndpoints` für die Endpunktklassifizierung, die generische Anfragerichtlinien kennen müssen, bevor die Provider-Runtime geladen wird. Der Kern definiert weiterhin die Bedeutung jedes `endpointClass`; Plugin-Manifeste enthalten die Host- und Basis-URL-Metadaten.

Offiziell externalisierte Provider-Plugins sind von der Kerndistribution ausgeschlossen, sodass
ihre Manifeste erst nach der Installation sichtbar sind. Ihre `providerEndpoints` müssen
daher auch in `scripts/lib/official-external-provider-catalog.json` gespiegelt werden, damit
die Endpunktklassifizierung ohne das Plugin weiterhin funktioniert; ein Vertragstest
erzwingt diese Spiegelung.

Endpunktfelder:

| Feld                           | Typ        | Bedeutung                                                                                     |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekannte Klasse von Core-Endpunkten, etwa `openrouter`, `moonshot-native` oder `google-vertex`.        |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpunktklasse zugeordnet werden.                                   |
| `hostSuffixes`                 | `string[]` | Hostsuffixe, die der Endpunktklasse zugeordnet werden. Stellen Sie `.` für einen Abgleich ausschließlich anhand des Domainsuffixes voran. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpunktklasse zugeordnet werden.             |
| `googleVertexRegion`           | `string`   | Statische Google-Vertex-Region für exakte globale Hosts.                                      |
| `googleVertexRegionHostSuffix` | `string`   | Suffix, das von übereinstimmenden Hosts entfernt wird, um das Präfix der Google-Vertex-Region offenzulegen. |

## Referenz zu providerRequest

Verwenden Sie `providerRequest` für leichtgewichtige Metadaten zur Anfragekompatibilität, die generische Anfragerichtlinien benötigen, ohne die Provider-Laufzeit zu laden. Lassen Sie verhaltensspezifische Umschreibungen von Nutzdaten in den Laufzeit-Hooks des Providers oder in gemeinsamen Hilfsfunktionen der Provider-Familie.

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

| Feld                  | Typ          | Bedeutung                                                                            |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`              | `string`     | Bezeichnung der Provider-Familie, die für generische Entscheidungen zur Anfragekompatibilität und für Diagnosen verwendet wird. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Kompatibilitätsbereich der Provider-Familie für gemeinsame Anfrage-Hilfsfunktionen. |
| `openAICompletions`   | `object`     | Anfrage-Flags für OpenAI-kompatible Vervollständigungen, derzeit `supportsStreamingUsage`.       |

## Referenz zu secretProviderIntegrations

Verwenden Sie `secretProviderIntegrations`, wenn ein Plugin eine wiederverwendbare Voreinstellung für einen SecretRef-Ausführungs-Provider veröffentlichen kann. OpenClaw liest diese Metadaten, bevor die Plugin-Laufzeit geladen wird, speichert die Plugin-Zuständigkeit in `secrets.providers.<alias>.pluginIntegration` und überlässt die tatsächliche Auflösung von Geheimnissen der SecretRef-Laufzeit. Voreinstellungen werden nur für gebündelte Plugins und installierte Plugins bereitgestellt, die in den verwalteten Installationsstammverzeichnissen für Plugins gefunden wurden, beispielsweise Installationen über Git und ClawHub.

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

Der Map-Schlüssel ist die Integrations-ID. Wenn `providerAlias` ausgelassen wird, verwendet OpenClaw die Integrations-ID als Alias des SecretRef-Providers. Provider-Aliasse müssen dem normalen Muster für Aliasse von SecretRef-Providern entsprechen, beispielsweise `team-secrets` oder `onepassword-work`.

Wenn ein Betreiber die Voreinstellung auswählt, schreibt OpenClaw eine Provider-Referenz wie diese:

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

Beim Start oder erneuten Laden löst OpenClaw diesen Provider auf, indem es die aktuellen Manifest-Metadaten des Plugins lädt, prüft, ob das zuständige Plugin installiert und aktiv ist, und den Ausführungsbefehl aus dem Manifest erzeugt. Durch das Deaktivieren oder Entfernen des Plugins wird der Provider für aktive SecretRefs widerrufen. Betreiber, die eine eigenständige Ausführungskonfiguration wünschen, können weiterhin manuelle `command`-/`args`-Provider direkt angeben.

Derzeit werden nur `source: "exec"`-Voreinstellungen unterstützt. `command` muss `${node}` sein und `args[0]` muss ein `./`-Resolverskript relativ zum Plugin-Stammverzeichnis sein. OpenClaw erzeugt daraus beim Start oder erneuten Laden den aktuellen ausführbaren Node-Pfad und den absoluten Skriptpfad innerhalb des Plugins. Node-Optionen wie `--require`, `--import`, `--loader`, `--env-file`, `--eval` und `--print` sind nicht Bestandteil des Vertrags für Manifest-Voreinstellungen. Betreiber, die Nicht-Node-Befehle benötigen, können eigenständige manuelle Ausführungs-Provider direkt konfigurieren.

OpenClaw leitet `trustedDirs` für Manifest-Voreinstellungen aus dem Plugin-Stammverzeichnis und bei `${node}`-Voreinstellungen aus dem Verzeichnis der aktuellen ausführbaren Node-Datei ab. Im Manifest angegebene `trustedDirs` werden ignoriert. Andere Optionen für Ausführungs-Provider wie `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` und `allowInsecurePath` werden an die normale Konfiguration des SecretRef-Ausführungs-Providers weitergereicht.

## Referenz zu modelPricing

Verwenden Sie `modelPricing`, wenn ein Provider das Preisverhalten der Steuerungsebene kontrollieren muss, bevor die Laufzeit geladen wird. Der Preis-Cache des Gateways liest diese Metadaten, ohne den Laufzeitcode des Providers zu importieren.

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

| Feld         | Typ               | Bedeutung                                                                                         |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Setzen Sie `false` für lokale oder selbst gehostete Provider, die niemals Preisdaten von OpenRouter oder LiteLLM abrufen sollen. |
| `openRouter` | `false \| object` | Zuordnung für die Preissuche bei OpenRouter. `false` deaktiviert die OpenRouter-Suche für diesen Provider. |
| `liteLLM`    | `false \| object` | Zuordnung für die Preissuche bei LiteLLM. `false` deaktiviert die LiteLLM-Suche für diesen Provider. |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                           |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Provider-ID des externen Katalogs, wenn sie von der OpenClaw-Provider-ID abweicht, beispielsweise `z-ai` für einen `zai`-Provider. |
| `passthroughProviderModel` | `boolean`          | Modell-IDs mit Schrägstrichen als verschachtelte Provider-/Modellreferenzen behandeln; nützlich für Proxy-Provider wie OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche Modell-ID-Varianten des externen Katalogs. `version-dots` versucht gepunktete Versions-IDs wie `claude-opus-4.6`. |

### OpenClaw-Provider-Index

Der OpenClaw-Provider-Index besteht aus OpenClaw-eigenen Vorschaumetadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist nicht Bestandteil eines Plugin-Manifests. Plugin-Manifeste bleiben die maßgebliche Quelle für installierte Plugins. Der Provider-Index ist der interne Fallback-Vertrag, den künftige Oberflächen für installierbare Provider und die Modellauswahl vor der Installation verwenden werden, wenn ein Provider-Plugin nicht installiert ist.

Rangfolge der Katalogautorität:

1. Benutzerkonfiguration.
2. Manifest des installierten Plugins `modelCatalog`.
3. Modellkatalog-Cache aus einer expliziten Aktualisierung.
4. Vorschauzeilen des OpenClaw-Provider-Index.

Der Provider-Index darf keine Geheimnisse, keinen Aktivierungsstatus, keine Laufzeit-Hooks und keine kontospezifischen Live-Modelldaten enthalten. Seine Vorschaukataloge verwenden dieselbe `modelCatalog`-Provider-Zeilenstruktur wie Plugin-Manifeste, sollten jedoch auf stabile Anzeigemetadaten beschränkt bleiben, sofern Laufzeitadapterfelder wie `api`, `baseUrl`, Preise oder Kompatibilitäts-Flags nicht absichtlich mit dem Manifest des installierten Plugins synchron gehalten werden. Provider mit einer Live-Ermittlung über `/models` sollten aktualisierte Zeilen über den expliziten Pfad des Modellkatalog-Caches schreiben, statt bei normalen Auflistungs- oder Einrichtungsprozessen Provider-APIs aufzurufen.

Einträge im Provider-Index können außerdem Metadaten zu installierbaren Plugins für Provider enthalten, deren Plugin aus dem Core ausgelagert wurde oder anderweitig noch nicht installiert ist. Diese Metadaten entsprechen dem Muster des Kanalkatalogs: Paketname, npm-Installationsangabe, erwartete Integrität und leichtgewichtige Bezeichnungen für Authentifizierungsoptionen reichen aus, um eine installierbare Einrichtungsoption anzuzeigen. Sobald das Plugin installiert ist, hat sein Manifest Vorrang und der Eintrag im Provider-Index wird für diesen Provider ignoriert.

`openclaw doctor --fix` migriert eine kleine, abgeschlossene Gruppe älterer Manifest-Fähigkeitsschlüssel auf oberster Ebene nach `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` und `tools`. Keiner dieser Schlüssel oder andere Fähigkeitslisten werden noch als Manifest-Felder auf oberster Ebene gelesen; das normale Laden des Manifests erkennt sie nur unter `contracts`.

## Manifest im Vergleich zu package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwendungszweck                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Erkennung, Konfigurationsvalidierung, Metadaten zu Authentifizierungsoptionen und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und der `openclaw`-Block für Einstiegspunkte, Installationsbeschränkungen, Einrichtung oder Katalogmetadaten |

Wenn Sie nicht sicher sind, wohin bestimmte Metadaten gehören, verwenden Sie diese Regel:

- Wenn OpenClaw sie kennen muss, bevor Plugin-Code geladen wird, legen Sie sie in `openclaw.plugin.json` ab.
- Wenn sie die Paketierung, Einstiegsdateien oder das npm-Installationsverhalten betreffen, legen Sie sie in `package.json` ab.

### package.json-Felder, die die Erkennung beeinflussen

Einige Metadaten für Plugins vor dem Laufzeitstart befinden sich absichtlich in `package.json` unter dem `openclaw`-Block statt in `openclaw.plugin.json`. `openclaw.bundle` und `openclaw.bundle.json` sind keine OpenClaw-Plugin-Verträge; native Plugins müssen `openclaw.plugin.json` zusammen mit den nachfolgend unterstützten `package.json#openclaw`-Feldern verwenden.

Wichtige Beispiele:

| Feld                                                                                       | Bedeutung                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                         | Deklariert native Plugin-Einstiegspunkte. Sie müssen innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                          |
| `openclaw.runtimeExtensions`                                                                         | Deklariert erstellte JavaScript-Laufzeit-Einstiegspunkte für installierte Pakete. Sie müssen innerhalb des Plugin-Paketverzeichnisses bleiben.                                                   |
| `openclaw.setupEntry`                                                                         | Leichtgewichtiger, ausschließlich für die Einrichtung bestimmter Einstiegspunkt, der beim Onboarding, beim verzögerten Kanalstart und bei schreibgeschützten Kanalstatus-/SecretRef-Ermittlungen verwendet wird. Er muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                                                         | Deklariert den erstellten JavaScript-Einrichtungs-Einstiegspunkt für installierte Pakete. Erfordert `setupEntry`, muss vorhanden sein und innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.channel`                                                                         | Ressourcenschonende Kanalkatalog-Metadaten wie Bezeichnungen, Dokumentationspfade, Aliasse und Auswahltexte.                                                                                     |
| `openclaw.channel.commands`                                                                         | Statische Metadaten für automatische Standardwerte nativer Befehle und nativer Skills, die von Konfigurations-, Audit- und Befehlslistenoberflächen verwendet werden, bevor die Kanallaufzeit geladen wird. |
| `openclaw.channel.configuredState`                                                                         | Metadaten für eine leichtgewichtige Prüfung des Konfigurationsstatus, die ohne Laden der vollständigen Kanallaufzeit beantworten kann: „Ist bereits eine ausschließlich umgebungsbasierte Einrichtung vorhanden?“ |
| `openclaw.channel.persistedAuthState`                                                                         | Metadaten für eine leichtgewichtige Prüfung persistierter Authentifizierung, die ohne Laden der vollständigen Kanallaufzeit beantworten kann: „Ist bereits irgendwo eine Anmeldung vorhanden?“ |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath`                               | Installations-/Aktualisierungshinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                       |
| `openclaw.install.defaultChoice`                                                                         | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                                |
| `openclaw.install.minHostVersion`                                                                         | Unterstützte Mindestversion des OpenClaw-Hosts unter Verwendung einer SemVer-Untergrenze wie `>=2026.3.22` oder `>=2026.5.1-beta.1`.                                                        |
| `openclaw.compat.pluginApi`                                                                         | Von diesem Paket benötigter Mindestbereich der OpenClaw-Plugin-API unter Verwendung einer SemVer-Untergrenze wie `>=2026.5.27`.                                                            |
| `openclaw.install.expectedIntegrity`                                                                         | Erwartete npm-Dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Aktualisierungsabläufe prüfen das abgerufene Artefakt dagegen.                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                                                         | Ermöglicht einen eng begrenzten Wiederherstellungspfad zur Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                                           |
| `openclaw.install.requiredPlatformPackages`                                                                         | npm-Paketaliasse, die materialisiert werden müssen, wenn ihre Lockfile-Plattformbeschränkungen mit dem aktuellen Host übereinstimmen.                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                                                                         | Ermöglicht das Laden von Kanaloberflächen der Einrichtungslaufzeit vor dem Lauschen und verschiebt anschließend das vollständige konfigurierte Kanal-Plugin bis zur Aktivierung nach Beginn des Lauschens. |

Manifest-Metadaten bestimmen, welche Provider-, Kanal- und Einrichtungsoptionen beim Onboarding angezeigt werden, bevor die Laufzeit geladen wird. `package.json#openclaw.install` teilt dem Onboarding mit, wie dieses Plugin abgerufen oder aktiviert werden soll, wenn eine dieser Optionen ausgewählt wird. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-Registry für nicht gebündelte Plugin-Quellen durchgesetzt. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte führen dazu, dass externe Plugins auf älteren Hosts übersprungen werden. Bei gebündelten Quell-Plugins wird angenommen, dass sie gemeinsam mit dem Host-Checkout versioniert sind.

`openclaw.install.requiredPlatformPackages` ist für npm-Pakete vorgesehen, die erforderliche native Binärdateien über optionale, plattformspezifische Aliasse bereitstellen. Führen Sie für jeden unterstützten Plattformalias den reinen npm-Paketnamen auf. Während der npm-Installation überprüft OpenClaw nur den deklarierten Alias, dessen Lockfile-Beschränkungen mit dem aktuellen Host übereinstimmen. Wenn npm Erfolg meldet, diesen Alias jedoch auslässt, versucht OpenClaw es einmal mit einem frischen Cache erneut und setzt die Installation zurück, falls der Alias weiterhin fehlt.

`openclaw.compat.pluginApi` wird während der Paketinstallation für nicht gebündelte Plugin-Quellen durchgesetzt. Verwenden Sie dies für die Untergrenze der OpenClaw-Plugin-SDK-/Laufzeit-API, gegen die das Paket erstellt wurde. Sie kann strenger als `minHostVersion` sein, wenn ein Plugin-Paket eine neuere API benötigt, aber für andere Abläufe weiterhin einen niedrigeren Installationshinweis beibehält. Die offizielle OpenClaw-Versionssynchronisierung erhöht bestehende API-Untergrenzen offizieller Plugins standardmäßig auf die OpenClaw-Release-Version; reine Plugin-Releases können jedoch eine niedrigere Untergrenze beibehalten, wenn das Paket absichtlich ältere Hosts unterstützt. Verwenden Sie nicht allein die Paketversion als Kompatibilitätsvertrag. `peerDependencies.openclaw` bleibt npm-Paketmetadaten vorbehalten; OpenClaw verwendet den Vertrag `openclaw.compat.pluginApi` für Entscheidungen zur Installationskompatibilität.

Offizielle Metadaten für die Installation bei Bedarf sollten `clawhubSpec` verwenden, wenn das Plugin auf ClawHub veröffentlicht ist; das Onboarding behandelt dies als bevorzugte Remote-Quelle und zeichnet nach der Installation Fakten zum ClawHub-Artefakt auf. `npmSpec` bleibt der Kompatibilitäts-Fallback für Pakete, die noch nicht zu ClawHub migriert wurden.

Die exakte Fixierung der npm-Version befindet sich bereits in `npmSpec`, beispielsweise `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalogeinträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Aktualisierungsabläufe geschlossen fehlschlagen, wenn das abgerufene npm-Artefakt nicht mehr mit dem fixierten Release übereinstimmt. Das interaktive Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige npm-Spezifikationen aus der Registry an, einschließlich reiner Paketnamen und Dist-Tags. Katalogdiagnosen können zwischen exakten, variablen, integritätsfixierten, ohne Integritätsangabe versehenen, hinsichtlich des Paketnamens nicht übereinstimmenden und ungültigen Quellen für die Standardauswahl unterscheiden. Sie warnen außerdem, wenn `expectedIntegrity` vorhanden ist, aber keine gültige npm-Quelle existiert, die damit fixiert werden kann. Wenn `expectedIntegrity` vorhanden ist, setzen Installations-/Aktualisierungsabläufe diesen Wert durch; wird er weggelassen, wird die Registry-Auflösung ohne Integritätsfixierung aufgezeichnet.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status-, Kanallisten- oder SecretRef-Prüfungen konfigurierte Konten identifizieren müssen, ohne die vollständige Laufzeit zu laden. Der Einrichtungs-Einstiegspunkt sollte Kanalmetadaten sowie einrichtungssichere Adapter für Konfiguration, Status und Secrets bereitstellen; Netzwerkclients, Gateway-Listener und Transportlaufzeiten gehören in den Haupteinstiegspunkt der Erweiterung.

Felder für Laufzeit-Einstiegspunkte setzen Paketgrenzenprüfungen für Quell-Einstiegspunktfelder nicht außer Kraft. Beispielsweise kann `openclaw.runtimeExtensions` einen aus dem Paket ausbrechenden Pfad `openclaw.extensions` nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit ermöglicht es Installationsabläufen nur die Wiederherstellung bei bestimmten veralteten Upgrade-Fehlern gebündelter Plugins, etwa einem fehlenden Pfad eines gebündelten Plugins oder einem veralteten Eintrag `channels.<id>` für dasselbe gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und verweisen Betreiber auf `openclaw doctor --fix`.

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

Verwenden Sie dies, wenn Einrichtung, Doctor, Status oder schreibgeschützte Anwesenheitsabläufe eine kostengünstige Ja/Nein-Prüfung der Authentifizierung benötigen, bevor das vollständige Kanal-Plugin geladen wird. Persistierter Authentifizierungsstatus ist kein konfigurierter Kanalstatus: Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren, Laufzeitabhängigkeiten zu reparieren oder zu entscheiden, ob eine Kanallaufzeit geladen werden soll. Der Zielexport sollte eine kleine Funktion sein, die ausschließlich den persistierten Status liest; leiten Sie ihn nicht durch das vollständige Kanallaufzeit-Barrel.

`openclaw.channel.configuredState` unterstützt kostengünstige Konfigurationsprüfungen. Bevorzugen Sie deklarative Umgebungsmetadaten, wenn Umgebungsvariablen ausreichen:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Verwenden Sie `env.allOf`, wenn jede aufgeführte Variable erforderlich ist, und `env.anyOf`, wenn eine beliebige nicht leere Variable ausreicht. Wenn eine kleine, laufzeitunabhängige Prüfung mehr als Umgebungsmetadaten benötigt, verwenden Sie `specifier` zusammen mit `exportName`, wie für `persistedAuthState` gezeigt; wenn `env` vorhanden ist, verwendet OpenClaw diesen Wert, ohne das Modul zu laden. Wenn die Prüfung eine vollständige Konfigurationsauflösung oder die tatsächliche Kanallaufzeit benötigt, belassen Sie diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## Ermittlungsrangfolge (doppelte Plugin-IDs)

OpenClaw ermittelt Plugins aus drei Stammverzeichnissen, die in dieser Reihenfolge geprüft werden: mit OpenClaw ausgelieferte gebündelte Plugins, das globale Installations-Stammverzeichnis (`~/.openclaw/extensions`) und das aktuelle Workspace-Stammverzeichnis (`<workspace>/.openclaw/extensions`) sowie alle expliziten Einträge in `plugins.load.paths`.

Wenn zwei Ermittlungen dieselbe `id` aufweisen, wird nur das Manifest mit der **höchsten Rangfolge** beibehalten; Duplikate mit niedrigerer Rangfolge werden verworfen, statt parallel dazu geladen zu werden. Rangfolge, von der höchsten zur niedrigsten:

1. **Durch Konfiguration ausgewählt** — ein explizit in `plugins.entries.<id>` fixierter Pfad
2. **Globale Installation mit passendem nachverfolgtem Installationsdatensatz** — ein über `openclaw plugin install`/`openclaw plugin update` installiertes Plugin, das OpenClaws Installationsverfolgung für dieselbe ID erkennt, selbst wenn die ID auch zu einem gebündelten Plugin gehört
3. **Gebündelt** — mit OpenClaw ausgelieferte Plugins
4. **Workspace** — relativ zum aktuellen Workspace ermittelte Plugins
5. Jeder andere ermittelte Kandidat

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins, die sich nicht nachverfolgt im Workspace oder globalen Stammverzeichnis befindet, überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin außer Kraft zu setzen, führen Sie entweder `openclaw plugin install` für diese ID aus, damit die nachverfolgte globale Installation Vorrang vor der gebündelten Kopie erhält, oder fixieren Sie über `plugins.entries.<id>` einen bestimmten Pfad, damit dieser aufgrund der durch Konfiguration ausgewählten Rangfolge gewinnt.
- Das Verwerfen von Duplikaten wird protokolliert, damit Doctor und Startdiagnosen auf die verworfene Kopie hinweisen können.
- Durch Konfiguration ausgewählte Duplikatüberschreibungen werden in Diagnosen als explizite Überschreibungen bezeichnet, lösen jedoch weiterhin eine Warnung aus, damit veraltete Forks und unbeabsichtigte Überschattungen sichtbar bleiben.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema mitliefern**, selbst wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.
- Wenn ein gebündeltes Plugin um neue Konfigurationsschlüssel erweitert oder geforkt wird, aktualisieren Sie gleichzeitig dessen `openclaw.plugin.json` `configSchema`. Schemas gebündelter Plugins sind strikt. Wenn daher `plugins.entries.<id>.config.myNewKey` zur Benutzerkonfiguration hinzugefügt wird, ohne `myNewKey` zu `configSchema.properties` hinzuzufügen, wird die Konfiguration abgelehnt, bevor die Plugin-Laufzeit geladen wird.

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

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, sofern die Kanal-ID nicht durch ein Plugin-Manifest deklariert ist. Wenn dieselbe ID auch in `plugins.allow`, `plugins.entries` oder `plugins.installs` vorkommt (ein referenziertes, aber derzeit nicht auffindbares Plugin), stuft OpenClaw dies stattdessen zu einer **Warnung** herab.
- `plugins.entries.<id>`, `plugins.allow` und `plugins.deny`, die auf unbekannte Plugin-IDs verweisen, sind **Warnungen** („veralteter Konfigurationseintrag ignoriert“) und keine Fehler, damit Upgrades und entfernte/umbenannte Plugins den Start des Gateways nicht blockieren.
- `plugins.slots.memory`, das auf eine unbekannte Plugin-ID verweist, ist ein **Fehler**. Eine Ausnahme bildet das bekannte offizielle externe Plugin `memory-lancedb`, für das stattdessen eine Warnung ausgegeben wird.
- Wenn ein Plugin installiert ist, aber ein fehlerhaftes oder fehlendes Manifest oder Schema aufweist, schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration vorhanden, das Plugin jedoch **deaktiviert** ist, bleibt die Konfiguration erhalten und in Doctor sowie den Protokollen wird eine **Warnung** angezeigt.

Das vollständige `plugins.*`-Schema finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokal aus dem Dateisystem geladener Plugins. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient ausschließlich der Erkennung und Validierung.
- Native Manifeste werden mit JSON5 geparst. Daher sind Kommentare, nachgestellte Kommas und Schlüssel ohne Anführungszeichen zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Der Manifest-Loader liest nur dokumentierte Manifestfelder. Vermeiden Sie benutzerdefinierte Schlüssel auf oberster Ebene.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerCatalogEntry` muss schlank bleiben und sollte keinen umfangreichen Laufzeitcode importieren. Verwenden Sie es für statische Metadaten des Provider-Katalogs oder eng umrissene Erkennungsdeskriptoren, nicht für die Ausführung zum Anfragezeitpunkt.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory` (Standardwert `memory-core`), `kind: "context-engine"` über `plugins.slots.contextEngine` (Standardwert `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. Der Laufzeit-Einstiegspunkt `OpenClawPluginDefinition.kind` ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins erhalten.
- Metadaten für Umgebungsvariablen (`setup.providers[].envVars`, das veraltete `providerAuthEnvVars` und `channelEnvVars`) sind rein deklarativ. Status, Auditierung, Validierung der Cron-Zustellung und andere schreibgeschützte Oberflächen wenden weiterhin die Plugin-Vertrauens- und effektive Aktivierungsrichtlinie an, bevor eine Umgebungsvariable als konfiguriert behandelt wird.
- Laufzeitmetadaten für Assistenten, die Provider-Code erfordern, finden Sie unter [Provider-Laufzeit-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und sämtliche Anforderungen an die Positivliste des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Verwandte Themen

<CardGroup cols={3}>
  <Card title="Plugins erstellen" href="/de/plugins/building-plugins" icon="rocket">
    Erste Schritte mit Plugins.
  </Card>
  <Card title="Plugin-Architektur" href="/de/plugins/architecture" icon="diagram-project">
    Interne Architektur und Fähigkeitsmodell.
  </Card>
  <Card title="SDK-Übersicht" href="/de/plugins/sdk-overview" icon="book">
    Plugin-SDK-Referenz und Subpfadimporte.
  </Card>
</CardGroup>
