---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Validierungsfehler bei Plugins debuggen
summary: Anforderungen an Plugin-Manifest und JSON-Schema (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-07-24T03:58:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ddbd7e69e8988c8833b3f3c37b3c23683cccb03549b0175a55a1a27bc6787a5
    source_path: plugins/manifest.md
    workflow: 16
---

Diese Seite behandelt das **native OpenClaw-Plugin-Manifest**, `openclaw.plugin.json`. Informationen zu kompatiblen Bundle-Layouts (Codex, Claude, Cursor) finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden stattdessen ihre eigenen Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Layouts automatisch, validiert sie jedoch nicht anhand des nachstehenden Schemas `openclaw.plugin.json`. Bei einem kompatiblen Bundle liest OpenClaw die Bundle-Metadaten, die deklarierten Skill-Stammverzeichnisse, die Claude-Befehlsstammverzeichnisse, die Claude-Standardwerte für `settings.json`, die Claude-LSP-Standardwerte und die unterstützten Hook-Pakete, sofern das Layout den Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** `openclaw.plugin.json` im **Plugin-Stammverzeichnis** bereitstellen. OpenClaw liest diese Datei, um die Konfiguration **ohne Ausführung des Plugin-Codes** zu validieren. Ein fehlendes oder ungültiges Manifest verhindert die Konfigurationsvalidierung und wird als Plugin-Fehler behandelt.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter [Plugins](/de/tools/plugin), Informationen zum nativen Fähigkeitsmodell und aktuelle Hinweise zur externen Kompatibilität unter [Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Zweck dieser Datei

`openclaw.plugin.json` enthält Metadaten, die OpenClaw **vor dem Laden Ihres Plugin-Codes** liest. Sämtliche enthaltenen Daten müssen sich mit geringem Aufwand prüfen lassen, ohne die Plugin-Laufzeit zu starten.

**Verwenden Sie die Datei für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurationsoberfläche
- Metadaten für Authentifizierung, Onboarding und Einrichtung (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Steuerungsebenen-Oberflächen
- Zuständigkeit für Modellfamilien-Kurzformen
- statische Momentaufnahmen der Fähigkeitszuständigkeit (`contracts`)
- Datenbindungen und Aktionsverben für Dashboard-Widgets
- QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` prüfen kann
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
| `id`                   | Ja           | `string`           | Kanonische Plugin-ID. Dies ist die in `plugins.entries.<id>` verwendete ID.                                                                                                                                                                                                     |
| `configSchema`                   | Ja           | `object`           | Eingebettetes JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                                                             |
| `requiresPlugins`                   | Nein         | `string[]`           | Plugin-IDs, die ebenfalls installiert sein müssen, damit dieses Plugin wirksam wird. Die Erkennung hält das Plugin ladbar, warnt jedoch, wenn ein erforderliches Plugin fehlt.                                                                                               |
| `enabledByDefault`                   | Nein         | `true`           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie den Wert weg oder legen Sie einen beliebigen Wert ungleich `true` fest, damit das Plugin standardmäßig deaktiviert bleibt.                                                           |
| `enabledByDefaultOnPlatforms`                   | Nein         | `string[]`           | Kennzeichnet ein gebündeltes Plugin nur auf den aufgeführten Node.js-Plattformen als standardmäßig aktiviert, beispielsweise `["darwin"]`. Eine explizite Konfiguration hat weiterhin Vorrang.                                                                        |
| `legacyPluginIds`                   | Nein         | `string[]`           | Veraltete IDs, die zu dieser kanonischen Plugin-ID normalisiert werden.                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`                   | Nein         | `string[]`           | Provider-IDs, bei deren Erwähnung in Authentifizierung, Konfiguration oder Modellreferenzen dieses Plugin automatisch aktiviert werden soll.                                                                                                                                |
| `kind`                   | Nein         | `PluginKind \| PluginKind[]`           | Deklariert eine oder mehrere exklusive Plugin-Arten (`"memory"`, `"context-engine"`), die von `plugins.slots.*` verwendet werden. Ein Plugin, das beide Plätze belegt, deklariert beide Arten in einem Array.                                                         |
| `channels`                   | Nein         | `string[]`           | Kanal-IDs, die diesem Plugin gehören. Werden für die Erkennung und Konfigurationsvalidierung verwendet.                                                                                                                                                                     |
| `providers`                   | Nein         | `string[]`           | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                                                                    |
| `providerCatalogEntry`                   | Nein         | `string`           | Pfad zum schlanken Provider-Katalogmodul relativ zum Plugin-Stammverzeichnis für manifestbezogene Provider-Katalogmetadaten, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.                                                                 |
| `modelSupport`                   | Nein         | `object`           | Manifestverwaltete Kurzmetadaten zur Modellfamilie, die zum automatischen Laden des Plugins vor der Laufzeit verwendet werden.                                                                                                                                              |
| `modelCatalog`                   | Nein         | `object`           | Deklarative Modellkatalogmetadaten für Provider, die diesem Plugin gehören. Dies ist der Steuerungsebenenvertrag für künftige schreibgeschützte Auflistungen, Onboarding, Modellauswahl, Aliasse und Unterdrückung, ohne die Plugin-Laufzeit zu laden.                           |
| `modelPricing`                   | Nein         | `object`           | Providereigene Richtlinie für die externe Preisabfrage. Verwenden Sie sie, um lokale oder selbst gehostete Provider von externen Preiskatalogen auszunehmen oder Provider-Referenzen OpenRouter-/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Kern fest zu codieren.     |
| `modelIdNormalization`                   | Nein         | `object`           | Providereigene Bereinigung von Modell-ID-Aliassen und -Präfixen, die ausgeführt werden muss, bevor die Provider-Laufzeit geladen wird.                                                                                                                                       |
| `providerEndpoints`                   | Nein         | `object[]`           | Manifestverwaltete Endpunkt-Host-/baseUrl-Metadaten für Provider-Routen, die der Kern klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                                                                        |
| `providerRequest`                   | Nein         | `object`           | Kostengünstige Metadaten zur Provider-Familie und Anfragekompatibilität, die von generischen Anfragerichtlinien verwendet werden, bevor die Provider-Laufzeit geladen wird.                                                                                                  |
| `secretProviderIntegrations`                   | Nein         | `Record<string, object>`           | Deklarative Voreinstellungen für SecretRef-Ausführungsprovider, die Einrichtungs- oder Installationsoberflächen anbieten können, ohne providerspezifische Integrationen im Kern fest zu codieren.                                                                            |
| `cliBackends`                   | Nein         | `string[]`           | IDs der CLI-Inferenz-Backends, die diesem Plugin gehören. Werden für die automatische Aktivierung beim Start anhand expliziter Konfigurationsreferenzen verwendet.                                                                                                          |
| `syntheticAuthRefs`                   | Nein         | `string[]`           | Provider- oder CLI-Backend-Referenzen, deren plugineigener Hook für synthetische Authentifizierung bei der initialen Modellerkennung geprüft werden soll, bevor die Laufzeit geladen wird.                                                                                   |
| `nonSecretAuthMarkers`                   | Nein         | `string[]`           | Platzhalterwerte für API-Schlüssel im Besitz gebündelter Plugins, die einen nicht geheimen lokalen, OAuth-basierten oder umgebungsbezogenen Anmeldedatenstatus darstellen.                                                                                                   |
| `commandAliases`                   | Nein         | `object[]`           | Befehlsnamen, die diesem Plugin gehören und pluginbezogene Konfigurations- und CLI-Diagnosen erzeugen sollen, bevor die Laufzeit geladen wird.                                                                                                                               |
| `providerUsageAuthEnvVars`                   | Nein         | `Record<string, string[]>`           | Provider-Anmeldedaten ausschließlich für Nutzung und Abrechnung. OpenClaw verwendet diese Namen zur Nutzungserkennung und Bereinigung geheimer Daten, jedoch niemals für die Inferenzauthentifizierung.                                                                     |
| `providerAuthAliases`                   | Nein         | `Record<string, string>`           | Provider-IDs, die für die Authentifizierungssuche eine andere Provider-ID wiederverwenden sollen, beispielsweise ein Coding-Provider, der den API-Schlüssel und die Authentifizierungsprofile des Basisproviders gemeinsam nutzt.                                           |
| `providerAuthChoices`                   | Nein         | `object[]`           | Kostengünstige Metadaten zur Authentifizierungsauswahl für Onboarding-Auswahlfelder, die Auflösung bevorzugter Provider und die einfache Anbindung von CLI-Flags.                                                                                                            |
| `activation`                   | Nein         | `object`           | Kostengünstige Metadaten für die Aktivierungsplanung zum Laden aufgrund von Start-, Provider-, Befehls-, Kanal-, Routen- und Funktionsauslösern. Nur Metadaten; die Plugin-Laufzeit ist weiterhin für das tatsächliche Verhalten verantwortlich.                              |
| `setup`                   | Nein         | `object`           | Kostengünstige Einrichtungs-/Onboarding-Beschreibungen, die Erkennungs- und Einrichtungsoberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                                                        |
| `qaRunners`                   | Nein         | `object[]`           | Kostengünstige Beschreibungen für QA-Runner, die vom gemeinsamen `openclaw qa`-Host verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                                                          |
| `dashboard`                   | Nein         | `object`           | Datenbindungen und Aktionsverben für Dashboard-Widgets. Jeder Eintrag wird anhand einer von diesem Plugin registrierten Gateway-Methode mit dem erforderlichen Lese- oder Schreibbereich validiert. Siehe [Dashboard-Referenz](#dashboard-reference).                         |
| `contracts`                   | Nein         | `object`           | Statische Momentaufnahme der Funktionszuordnung für externe Authentifizierungs-Hooks, Embeddings, Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bild-/Video-/Musikerzeugung, Webabruf, Websuche, Worker-Provider, Dokument-/Webinhaltextraktion und Tool-Zuordnung. |
| `configContracts`                   | Nein         | `object`           | Manifestverwaltetes Konfigurationsverhalten, das von generischen Kernhilfen genutzt wird: Erkennung gefährlicher Flags, SecretRef-Migrationsziele und Eingrenzung veralteter Konfigurationspfade. Siehe [configContracts-Referenz](#configcontracts-reference).                  |
| `mediaUnderstandingProviderMetadata` | Nein       | `Record<string, object>`     | Kostengünstige Standardeinstellungen für das Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Nein       | `Record<string, object>`     | Kostengünstige Authentifizierungsmetadaten für die Bilderzeugung für Provider-IDs, die in `contracts.imageGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Schutzprüfungen für Basis-URLs.                                                                                                         |
| `videoGenerationProviderMetadata`    | Nein       | `Record<string, object>`     | Kostengünstige Authentifizierungsmetadaten für die Videoerzeugung für Provider-IDs, die in `contracts.videoGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Schutzprüfungen für Basis-URLs.                                                                                                         |
| `musicGenerationProviderMetadata`    | Nein       | `Record<string, object>`     | Kostengünstige Authentifizierungsmetadaten für die Musikerzeugung für Provider-IDs, die in `contracts.musicGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Schutzprüfungen für Basis-URLs.                                                                                                         |
| `toolMetadata`                       | Nein       | `Record<string, object>`     | Kostengünstige Verfügbarkeitsmetadaten für Plugin-eigene Tools, die in `contracts.tools` deklariert sind. Verwenden Sie diese, wenn ein Tool die Laufzeit nicht laden soll, sofern keine Konfigurations-, Umgebungs- oder Authentifizierungsnachweise vorhanden sind.                                                                                                  |
| `channelConfigs`                     | Nein       | `Record<string, object>`     | Manifest-eigene Metadaten zur Kanalkonfiguration, die vor dem Laden der Laufzeit in die Erkennungs- und Validierungsoberflächen eingebunden werden.                                                                                                                                                                 |
| `skills`                             | Nein       | `string[]`                   | Zu ladende Skill-Verzeichnisse, relativ zum Plugin-Stammverzeichnis.                                                                                                                                                                                                                    |
| `name`                               | Nein       | `string`                     | Für Menschen lesbarer Plugin-Name.                                                                                                                                                                                                                                                |
| `description`                        | Nein       | `string`                     | Kurze Zusammenfassung, die auf Plugin-Oberflächen angezeigt wird.                                                                                                                                                                                                                                    |
| `catalog`                            | Nein       | `object`                     | Optionale Darstellungshinweise für Oberflächen des Plugin-Katalogs. Diese Metadaten installieren oder aktivieren kein Plugin und gewähren ihm kein Vertrauen.                                                                                                                                               |
| `icon`                               | Nein       | `string`                     | HTTPS-Bild-URL für Marketplace-/Katalogkarten. ClawHub akzeptiert jede gültige `https://`-URL und verwendet das standardmäßige Plugin-Symbol, wenn diese Angabe fehlt oder ungültig ist.                                                                                                         |
| `version`                            | Nein       | `string`                     | Informative Plugin-Version.                                                                                                                                                                                                                                              |
| `uiHints`                            | Nein       | `Record<string, object>`     | UI-Beschriftungen, Platzhalter und Hinweise zur Vertraulichkeit von Konfigurationsfeldern.                                                                                                                                                                                                          |

## Dashboard-Referenz

`dashboard` ermöglicht es einem aktivierten Plugin, vorhandene Gateway-RPCs für berechtigte Dashboard-Widgets bereitzustellen, ohne Plugin-Richtlinien zum Core hinzuzufügen. Datenbindungen müssen eine Methode benennen, die dasselbe Plugin mit `operator.read` registriert; Aktionsverben müssen eine Methode benennen, die es mit `operator.write` registriert. Bei einer Abweichung wird das Plugin während der Registrierung abgelehnt.

```json
{
  "dashboard": {
    "dataBindings": [
      {
        "id": "items.list",
        "method": "example.items.list",
        "description": "Beispielelemente auflisten."
      }
    ],
    "actionVerbs": [
      {
        "id": "refresh",
        "method": "example.items.refresh",
        "description": "Beispielelemente aktualisieren.",
        "paramShape": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "force": { "type": "boolean" }
          }
        }
      }
    ]
  }
}
```

Die Manifest-IDs sind Plugin-lokal. Widget-Berechtigungen verwenden `<plugin-id>.<id>`, beispielsweise `example.items.list` und `example.refresh`. Damit der persistierte Berechtigungs-Namensraum eindeutig bleibt, maskiert OpenClaw `%` und `.` im Plugin-ID-Segment als `%25` und `%2E`; gewöhnliche Plugin-IDs behalten die natürliche Form. `paramShape` ist ein optionales JSON-Schema, das auf das Aktionsparameterobjekt angewendet wird, bevor OpenClaw den Plugin-RPC aufruft.

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

| Feld       | Typ       | Bedeutung                                                                  |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Ob Katalogoberflächen dieses Plugin hervorheben sollen.                    |
| `order`    | `number`  | Aufsteigender Anzeigehinweis für kuratierte Plugins; niedrigere Werte erscheinen früher. |

## Metadatenreferenz für Generierungs-Provider

Die Metadatenfelder für Generierungs-Provider beschreiben statische Authentifizierungssignale für Provider, die in der entsprechenden Liste `contracts.*GenerationProviders` deklariert sind. OpenClaw liest diese Felder, bevor die Provider-Laufzeit geladen wird, damit Core-Werkzeuge entscheiden können, ob ein Generierungs-Provider verfügbar ist, ohne jedes Provider-Plugin zu importieren.

Verwenden Sie diese Felder nur für kostengünstig ermittelbare, deklarative Fakten. Transport, Anfragetransformationen, Token-Aktualisierung, Validierung von Anmeldedaten und das tatsächliche Generierungsverhalten verbleiben in der Plugin-Laufzeit.

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
| `configSignals`        | Nein         | `object[]` | Kostengünstige, ausschließlich konfigurationsbasierte Verfügbarkeitssignale für lokale oder selbst gehostete Provider, die ohne Authentifizierungsprofile oder Umgebungsvariablen konfiguriert werden können. |
| `authSignals`          | Nein         | `object[]` | Explizite Authentifizierungssignale. Wenn vorhanden, ersetzen sie den standardmäßigen Signalsatz aus der Provider-ID, `aliases` und `authProviders`. |
| `referenceAudioInputs` | Nein         | `boolean`  | Nur für Videogenerierung. Auf `true` setzen, wenn der Provider Referenzaudio-Assets akzeptiert; andernfalls blendet `video_generate` Audioreferenzparameter aus. |

Jeder `configSignals`-Eintrag unterstützt:

| Feld             | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                |
| ---------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Ja           | `string`   | Punktpfad zum Plugin-eigenen Konfigurationsobjekt, das geprüft werden soll, beispielsweise `plugins.entries.example.config`.                                                             |
| `overlayPath`    | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objekt das Stammobjekt überlagern soll, bevor das Signal ausgewertet wird. Verwenden Sie dies für funktionsspezifische Konfigurationen wie `image`, `video` oder `music`. |
| `overlayMapPath` | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objektwerte jeweils das Stammobjekt überlagern sollen. Verwenden Sie dies für benannte Kontenzuordnungen wie `accounts`, bei denen jedes konfigurierte Konto die Bedingung erfüllen soll. |
| `required`       | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, die konfigurierte Werte enthalten müssen. Zeichenfolgen dürfen nicht leer sein; Objekte und Arrays dürfen nicht leer sein.             |
| `requiredAny`    | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, von denen mindestens einer einen konfigurierten Wert enthalten muss.                                                                  |
| `mode`           | Nein         | `object`   | Optionale Modusbedingung in Form einer Zeichenfolge innerhalb der effektiven Konfiguration. Verwenden Sie diese, wenn die rein konfigurationsbasierte Verfügbarkeit nur für einen Modus gilt. |

Jede `mode`-Bedingung unterstützt:

| Feld         | Erforderlich | Typ        | Bedeutung                                                                          |
| ------------ | ------------ | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Nein         | `string`   | Punktpfad innerhalb der effektiven Konfiguration. Standardwert ist `mode`.         |
| `default`    | Nein         | `string`   | Zu verwendender Moduswert, wenn der Pfad in der Konfiguration fehlt.                |
| `allowed`    | Nein         | `string[]` | Falls vorhanden, ist das Signal nur erfolgreich, wenn der effektive Modus einer dieser Werte ist. |
| `disallowed` | Nein         | `string[]` | Falls vorhanden, schlägt das Signal fehl, wenn der effektive Modus einer dieser Werte ist. |

Jeder `authSignals`-Eintrag unterstützt:

| Feld              | Erforderlich | Typ      | Bedeutung                                                                                                                                                                   |
| ----------------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string` | Provider-ID, die in konfigurierten Authentifizierungsprofilen geprüft werden soll.                                                                                          |
| `providerBaseUrl` | Nein         | `object` | Optionale Bedingung, durch die das Signal nur zählt, wenn der referenzierte konfigurierte Provider eine zulässige Basis-URL verwendet. Verwenden Sie dies, wenn ein Authentifizierungsalias nur für bestimmte APIs gültig ist. |

Jede `providerBaseUrl`-Bedingung unterstützt:

| Feld              | Erforderlich | Typ        | Bedeutung                                                                                                                                           |
| ----------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string`   | Provider-Konfigurations-ID, deren `baseUrl` geprüft werden soll.                                                                                   |
| `defaultBaseUrl`  | Nein         | `string`   | Anzunehmende Basis-URL, wenn `baseUrl` in der Provider-Konfiguration fehlt.                                                                       |
| `allowedBaseUrls` | Ja           | `string[]` | Zulässige Basis-URLs für dieses Authentifizierungssignal. Das Signal wird ignoriert, wenn die konfigurierte oder standardmäßige Basis-URL mit keinem dieser normalisierten Werte übereinstimmt. |

## Werkzeugmetadaten-Referenz

`toolMetadata` verwendet dieselben Formen `configSignals` und `authSignals` wie die Metadaten für Generierungs-Provider, nach Werkzeugname indiziert. `contracts.tools` deklariert die Zuständigkeit. `toolMetadata` deklariert kostengünstig ermittelbare Verfügbarkeitsnachweise, damit OpenClaw nicht allein deshalb eine Plugin-Laufzeit importieren muss, um von deren Werkzeug-Factory `null` zurückzuerhalten.

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

`toolMetadata`-Einträge akzeptieren zusätzlich zu den oben genannten gemeinsamen Feldern `configSignals`/`authSignals` auch `optional` (kennzeichnet das Werkzeug als nicht erforderlich für die Plugin-Aktivierung) und `replaySafe` (kennzeichnet die Werkzeugausführung als sicher wiederholbar nach einem unvollständigen Modelldurchlauf).

Wenn ein Werkzeug kein `toolMetadata` besitzt, behält OpenClaw das bestehende Verhalten bei und lädt das zuständige Plugin, wenn der Werkzeugvertrag mit der Richtlinie übereinstimmt. Für Werkzeuge im Hot Path, deren Factory von Authentifizierung oder Konfiguration abhängt, sollten Plugin-Autoren `toolMetadata` deklarieren, anstatt den Core die Laufzeit importieren zu lassen, um nachzufragen.

## providerAuthChoices-Referenz

Jeder `providerAuthChoices`-Eintrag beschreibt eine Onboarding- oder Authentifizierungsoption. OpenClaw liest diese, bevor die Provider-Laufzeit geladen wird. Provider-Einrichtungslisten verwenden diese Manifestoptionen, aus Deskriptoren abgeleitete Einrichtungsoptionen und Installationskatalog-Metadaten, ohne die Provider-Laufzeit zu laden.

| Feld                  | Erforderlich | Typ                                                                   | Bedeutung                                                                                                               |
| --------------------- | ------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                                              | Provider-ID, zu der diese Auswahl gehört.                                                                                |
| `method`              | Ja           | `string`                                                              | ID der Authentifizierungsmethode, an die weitergeleitet werden soll.                                                     |
| `choiceId`            | Ja           | `string`                                                              | Stabile ID der Authentifizierungsauswahl, die von Onboarding- und CLI-Abläufen verwendet wird.                           |
| `choiceLabel`         | Nein         | `string`                                                              | Benutzerseitig sichtbare Bezeichnung. Falls nicht angegeben, verwendet OpenClaw ersatzweise `choiceId`.          |
| `choiceHint`          | Nein         | `string`                                                              | Kurzer Hilfetext für die Auswahl.                                                                                        |
| `icon`                | Nein         | HTTPS-URL                                                             | Grafik, die in unterstützten Onboarding-Clients neben dieser Auswahl angezeigt wird.                                     |
| `website`             | Nein         | HTTPS-URL                                                             | Produkt-, Anmelde- oder Installationsseite, die von unterstützten Onboarding-Clients angezeigt wird.                     |
| `assistantPriority`   | Nein         | `number`                                                              | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlmenüs weiter vorne einsortiert.                    |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                                        | Blendet die Auswahl in Assistenten-Auswahlmenüs aus, ermöglicht jedoch weiterhin die manuelle Auswahl über die CLI.      |
| `deprecatedChoiceIds` | Nein         | `string[]`                                                            | Veraltete Auswahl-IDs, über die Benutzer zu dieser Ersatzauswahl weitergeleitet werden sollen.                            |
| `groupId`             | Nein         | `string`                                                              | Optionale Gruppen-ID zur Gruppierung zusammengehöriger Auswahlmöglichkeiten.                                             |
| `groupLabel`          | Nein         | `string`                                                              | Benutzerseitig sichtbare Bezeichnung für diese Gruppe.                                                                  |
| `groupHint`           | Nein         | `string`                                                              | Kurzer Hilfetext für die Gruppe.                                                                                         |
| `onboardingFeatured`  | Nein         | `boolean`                                                             | Zeigt diese Gruppe in der hervorgehobenen Ebene der interaktiven Onboarding-Auswahl vor dem Eintrag „More...“ an.        |
| `optionKey`           | Nein         | `string`                                                              | Interner Optionsschlüssel für einfache Authentifizierungsabläufe mit einem einzigen Flag.                                |
| `cliFlag`             | Nein         | `string`                                                              | Name des CLI-Flags, beispielsweise `--openrouter-api-key`.                                                                  |
| `cliOption`           | Nein         | `string`                                                              | Vollständige Form der CLI-Option, beispielsweise `--openrouter-api-key <key>`.                                                     |
| `cliDescription`      | Nein         | `string`                                                              | In der CLI-Hilfe verwendete Beschreibung.                                                                                |
| `appGuidedSecret`     | Nein         | `boolean`                                                             | Ein eingefügtes Secret zusammen mit den Provider-Standardeinstellungen genügt für die appgestützte Einrichtung.         |
| `appGuidedDiscovery`  | Nein         | `boolean`                                                             | Die entsprechende Laufzeit-Authentifizierungsmethode ist für die schreibgeschützte lokale Erkennung über `appGuidedSetup` zuständig. |
| `appGuidedAuth`       | Nein         | `"oauth"` \| `"device-code"`                                          | Providereigene interaktive Anmeldung, die native Einrichtungsclients generisch darstellen können.                        |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Gibt an, auf welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Falls nicht angegeben, wird standardmäßig `["text-inference"]` verwendet. |

Wenn `appGuidedDiscovery` auf „true“ gesetzt ist, muss die entsprechende Provider-Authentifizierungsmethode
`appGuidedSetup.detect` und `appGuidedSetup.prepare` bereitstellen. Die Erkennung muss
schreibgeschützt sein: keine Anmeldung, kein Abrufen oder Herunterladen eines Modells und kein Schreiben der Konfiguration. Bei der Vorbereitung wird
das exakt ausgewählte Modell erneut geprüft und ein Konfigurationsvorschlag zurückgegeben; OpenClaw testet diesen
Vorschlag isoliert im Live-Betrieb und übernimmt ihn erst nach erfolgreichem Abschluss.

## Referenz für commandAliases

Verwenden Sie `commandAliases`, wenn ein Plugin für einen Laufzeitbefehlsnamen zuständig ist, den Benutzer irrtümlich in `plugins.allow` eintragen oder als CLI-Stammbefehl ausführen könnten. OpenClaw verwendet diese Metadaten für die Diagnose, ohne den Laufzeitcode des Plugins zu importieren.

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
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                          |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl und nicht als CLI-Stammbefehl.        |
| `cliCommand` | Nein         | `string`          | Zugehöriger CLI-Stammbefehl, der für CLI-Vorgänge vorgeschlagen werden soll, sofern vorhanden. |

## Referenz für activation

Verwenden Sie `activation`, wenn das Plugin mit geringem Aufwand angeben kann, bei welchen Control-Plane-Ereignissen es in einen Aktivierungs-/Ladeplan aufgenommen werden soll.

Dieser Block enthält Planer-Metadaten und ist keine Lebenszyklus-API. Er registriert kein Laufzeitverhalten, ersetzt `register(...)` nicht und garantiert nicht, dass Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um die infrage kommenden Plugins einzugrenzen, bevor er auf vorhandene Eigentümerschaftsmetadaten des Manifests wie `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks zurückgreift.

Bevorzugen Sie die eng gefassten Metadaten, die die Eigentümerschaft bereits beschreiben. Verwenden Sie `providers`, `channels`, `commandAliases`, Einrichtungsdeskriptoren oder `contracts`, wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planerhinweise, die sich durch diese Eigentümerschaftsfelder nicht abbilden lassen. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Laufzeit-Aliasse wie `claude-cli`, `my-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist ausschließlich für eingebettete Agent-Harness-IDs vorgesehen, für die noch kein Eigentümerschaftsfeld vorhanden ist.

Jedes Plugin sollte `activation.onStartup` bewusst festlegen. Setzen Sie es nur dann auf `true`, wenn das Plugin beim Start des Gateways ausgeführt werden muss. Setzen Sie es auf `false`, wenn das Plugin beim Start inaktiv ist und nur durch engere Auslöser geladen werden soll. Wird `onStartup` weggelassen, wird das Plugin beim Start nicht mehr implizit geladen; verwenden Sie explizite Aktivierungsmetadaten für Start-, Kanal-, Konfigurations-, Agent-Harness-, Speicher- oder andere enger gefasste Aktivierungsauslöser.

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
| `onStartup`        | Nein         | `boolean`                                            | Explizite Aktivierung beim Start des Gateways. Jedes Plugin sollte dies festlegen. `true` importiert das Plugin beim Start; `false` belässt es beim Start im verzögerten Ladezustand, sofern kein anderer passender Auslöser das Laden erfordert. |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, durch die dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                     |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Laufzeit-IDs eingebetteter Agent-Harnesses, durch die dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliasse.             |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, durch die dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                      |
| `onChannels`       | Nein         | `string[]`                                           | Kanal-IDs, durch die dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                       |
| `onRoutes`         | Nein         | `string[]`                                           | Routentypen, durch die dieses Plugin in Aktivierungs-/Ladepläne aufgenommen werden soll.                                                                                                                     |
| `onConfigPaths`    | Nein         | `string[]`                                           | Stammrelative Konfigurationspfade, durch die dieses Plugin in Start-/Ladepläne aufgenommen werden soll, wenn der Pfad vorhanden und nicht ausdrücklich deaktiviert ist.                                      |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Fähigkeitshinweise, die für die Aktivierungsplanung der Control Plane verwendet werden. Bevorzugen Sie nach Möglichkeit enger gefasste Felder.                                                     |

Aktuelle Live-Nutzer:

- Die Gateway-Startplanung verwendet `activation.onStartup` für den expliziten Startimport.
- Die befehlsinitiierte CLI-Planung greift auf das veraltete `commandAliases[].cliCommand` oder `commandAliases[].name` zurück.
- Die Startplanung der Agent-Runtime verwendet `activation.onAgentHarnesses` für eingebettete Testrahmen und das übergeordnete `cliBackends[]` für CLI-Runtime-Aliasse.
- Die durch einen Kanal initiierte Einrichtungs-/Kanalplanung greift auf die veraltete Zuständigkeit von `channels[]` zurück, wenn explizite Metadaten zur Kanalaktivierung fehlen.
- Die Plugin-Planung beim Start verwendet `activation.onConfigPaths` für Root-Konfigurationsoberflächen außerhalb von Kanälen, etwa den `browser`-Block des mitgelieferten Browser-Plugins.
- Die durch einen Provider initiierte Einrichtungs-/Runtime-Planung greift auf die veraltete Zuständigkeit von `providers[]` und des übergeordneten `cliBackends[]` zurück, wenn explizite Metadaten zur Provider-Aktivierung fehlen.

Die Planerdiagnose kann explizite Aktivierungshinweise von einem Rückgriff auf die Manifestzuständigkeit unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass `activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der Planer stattdessen die Zuständigkeit von `commandAliases` verwendete. Diese Begründungsbezeichnungen sind für Hostdiagnosen und Tests bestimmt; Plugin-Autoren sollten weiterhin die Metadaten deklarieren, welche die Zuständigkeit am besten beschreiben.

## qaRunners-Referenz

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb
des gemeinsamen `openclaw qa`-Stamms bereitstellt. Halten Sie diese Metadaten schlank und statisch; die Plugin-
Runtime bleibt über eine schlanke `runtime-api.ts`-Oberfläche, die passende
`qaRunnerCliRegistrations` exportiert, für die tatsächliche CLI-Registrierung zuständig. Ein
optionales `adapterFactory` stellt den Transport für gemeinsame QA-Szenarien bereit, ohne
den Runner des registrierten Befehls zu ändern.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Die Docker-gestützte Matrix-Live-QA-Lane gegen einen temporären Homeserver ausführen"
    }
  ]
}
```

| Feld          | Erforderlich | Typ      | Bedeutung                                                          |
| ------------- | ------------ | -------- | ------------------------------------------------------------------ |
| `commandName` | Ja           | `string` | Unter `openclaw qa` eingebundener Unterbefehl, zum Beispiel `matrix`. |
| `description` | Nein         | `string` | Ersatz-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Platzhalterbefehl benötigt. |

Die ID `adapterFactory` muss mit `commandName` übereinstimmen. Exportieren Sie keine Registrierungen
für Befehle, die nicht im Manifest vorhanden sind.

## setup-Referenz

Verwenden Sie `setup`, wenn Einrichtungs- und Onboarding-Oberflächen schlanke, Plugin-eigene Metadaten benötigen, bevor die Runtime geladen wird.

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

Das übergeordnete `cliBackends` bleibt gültig und beschreibt weiterhin Backends für die CLI-Inferenz. `setup.cliBackends` ist die einrichtungsspezifische Deskriptoroberfläche für Steuerungs- und Einrichtungsabläufe, die ausschließlich auf Metadaten basieren sollten.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte, auf Deskriptoren basierende Suchoberfläche für die Einrichtungserkennung. Wenn der Deskriptor nur die Plugin-Kandidaten eingrenzt und die Einrichtung weiterhin umfangreichere Runtime-Hooks zur Einrichtungszeit benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als ersatzweisen Ausführungspfad bei.

OpenClaw berücksichtigt `setup.providers[].envVars` bei generischen Suchen nach Provider-Authentifizierung und Umgebungsvariablen. Hinterlegen Sie dort Umgebungsmetadaten für Einrichtung und Status.

Verwenden Sie `providerUsageAuthEnvVars`, wenn Anmeldedaten auf Abrechnungs- oder Organisationsebene `resolveUsageAuth` aktivieren müssen, ohne zu Inferenzanmeldedaten zu werden. Diese Namen werden in die Blockierung von dotenv-Werten im Arbeitsbereich, die Entfernung aus ACP-Kindprozessen, die Filterung von Geheimnissen in der Sandbox und die umfassende Bereinigung von Geheimnissen einbezogen. Die Provider-Runtime liest und klassifiziert den Wert weiterhin innerhalb von `resolveUsageAuth`.

OpenClaw kann einfache Einrichtungsoptionen auch aus `setup.providers[].authMethods` ableiten, wenn kein Einrichtungseintrag verfügbar ist oder wenn `setup.requiresRuntime: false` deklariert, dass keine Einrichtungs-Runtime erforderlich ist. Explizite `providerAuthChoices`-Einträge bleiben für benutzerdefinierte Bezeichnungen, CLI-Flags, den Onboarding-Umfang und Assistentenmetadaten bevorzugt.

Setzen Sie `requiresRuntime: false` nur, wenn diese Deskriptoren für die Einrichtungsoberfläche ausreichen. OpenClaw behandelt ein explizites `false` als ausschließlich auf Deskriptoren basierenden Vertrag und führt `setup-api` oder `openclaw.setupEntry` für die Einrichtungssuche nicht aus. Wenn ein ausschließlich auf Deskriptoren basierendes Plugin dennoch einen dieser Einrichtungs-Runtime-Einträge bereitstellt, meldet OpenClaw eine ergänzende Diagnose und ignoriert ihn weiterhin. Ein nicht angegebenes `requiresRuntime` behält das veraltete Rückgriffverhalten bei, damit vorhandene Plugins, die Deskriptoren ohne das Flag hinzugefügt haben, nicht beeinträchtigt werden.

Da die Einrichtungssuche Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte `setup.providers[].id`- und `setup.cliBackends[]`-Werte über alle erkannten Plugins hinweg eindeutig bleiben. Bei mehrdeutiger Zuständigkeit wird die Ausführung sicher abgebrochen, anstatt anhand der Erkennungsreihenfolge einen Eintrag auszuwählen.

Wenn die Einrichtungs-Runtime ausgeführt wird, melden die Diagnosen der Einrichtungsregistrierung Deskriptorabweichungen, falls `setup-api` einen Provider oder ein CLI-Backend registriert, der beziehungsweise das nicht durch die Manifestdeskriptoren deklariert ist, oder falls für einen Deskriptor keine passende Runtime-Registrierung vorhanden ist. Diese Diagnosen sind ergänzend und lehnen veraltete Plugins nicht ab.

### setup.providers-Referenz

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                         |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Ja           | `string`   | Während der Einrichtung oder des Onboardings bereitgestellte Provider-ID. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods`  | Nein         | `string[]` | Von diesem Provider unterstützte Einrichtungs-/Authentifizierungsmethoden-IDs, ohne die vollständige Runtime zu laden. |
| `envVars`      | Nein         | `string[]` | Umgebungsvariablen, die generische Einrichtungs-/Statusoberflächen prüfen können, bevor die Plugin-Runtime geladen wird. |
| `authEvidence` | Nein         | `object[]` | Schlanke Prüfungen lokaler Authentifizierungsnachweise für Provider, die sich über nicht geheime Markierungen authentifizieren können. |

`authEvidence` ist für Provider-eigene Markierungen lokaler Anmeldedaten vorgesehen, die ohne das Laden von Runtime-Code überprüft werden können. Diese Prüfungen müssen schlank und lokal bleiben: keine Netzwerkaufrufe, keine Zugriffe auf Schlüsselbünde oder Geheimnisverwaltungen, keine Shell-Befehle und keine Abfragen von Provider-APIs.

Unterstützte Nachweiseinträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                      |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                                    |
| `fileEnvVar`       | Nein         | `string`   | Umgebungsvariable, die einen expliziten Pfad zu einer Anmeldedatendatei enthält.                               |
| `fallbackPaths`    | Nein         | `string[]` | Pfade zu lokalen Anmeldedatendateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine aufgeführte Umgebungsvariable muss einen nicht leeren Wert haben, damit der Nachweis gültig ist. |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Umgebungsvariable muss einen nicht leeren Wert haben, damit der Nachweis gültig ist.          |
| `credentialMarker` | Ja           | `string`   | Nicht geheime Markierung, die zurückgegeben wird, wenn der Nachweis vorhanden ist.                             |
| `source`           | Nein         | `string`   | Benutzerseitig sichtbare Quellenbezeichnung für die Authentifizierungs-/Statusausgabe.                         |

### setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                           |
| ------------------ | ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Einrichtungsdeskriptoren, die während Einrichtung und Onboarding bereitgestellt werden.    |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Einrichtungszeit, die für die auf Deskriptoren basierende Einrichtungssuche verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs der Konfigurationsmigrationen, die der Einrichtungsoberfläche dieses Plugins zugeordnet sind.   |
| `requiresRuntime`  | Nein         | `boolean`  | Gibt an, ob die Einrichtung nach der Deskriptorsuche weiterhin die Ausführung von `setup-api` benötigt. |

## uiHints-Referenz

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen zu kleinen Darstellungshinweisen. Schlüssel können Punkte für verschachtelte Konfigurationsfelder verwenden, aber kein Pfadsegment darf `__proto__`, `constructor` oder `prototype` sein; die Einrichtung lehnt solche Namen ab.

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

| Feld           | Typ              | Bedeutung                                                                                                         |
| -------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `label`        | `string`         | Benutzerseitig sichtbare Feldbezeichnung.                                                                         |
| `help`         | `string`         | Kurzer Hilfetext.                                                                                                 |
| `tags`         | `string[]`       | Optionale UI-Tags.                                                                                                |
| `advanced`     | `boolean`        | Kennzeichnet das Feld als erweitert.                                                                              |
| `sensitive`    | `boolean`        | Kennzeichnet das Feld als geheim oder sensibel.                                                                   |
| `placeholder`  | `string`         | Platzhaltertext für Formulareingaben.                                                                             |
| `presentation` | `"phone-number"` | Ausschließlich zur Anzeige dienende lokalisierte Telefonnummernformatierung für analysierbare internationale (`+...`-)Werte; Rohwerte bleiben unverändert. |

## contracts-Referenz

Verwenden Sie `contracts` nur für statische Metadaten zur Funktionszuständigkeit, die OpenClaw lesen kann, ohne die Plugin-Runtime zu importieren.

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
| `trustedToolPolicies`            | `string[]` | Plugin-lokale IDs vertrauenswürdiger Richtlinien vor der Tool-Ausführung, die ein installiertes Plugin registrieren darf. Gebündelte Plugins dürfen Richtlinien ohne dieses Feld registrieren. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Authentifizierungsprofile dieses Plugin besitzt.                                                        |
| `embeddingProviders`             | `string[]` | IDs allgemeiner Embedding-Provider, die dieses Plugin für wiederverwendbare Vektor-Embeddings einschließlich Memory besitzt.                  |
| `speechProviders`                | `string[]` | IDs von Sprach-Providern, die dieses Plugin besitzt.                                                                                          |
| `realtimeTranscriptionProviders` | `string[]` | IDs von Echtzeit-Transkriptions-Providern, die dieses Plugin besitzt.                                                                        |
| `realtimeVoiceProviders`         | `string[]` | IDs von Echtzeit-Sprach-Providern, die dieses Plugin besitzt.                                                                                 |
| `memoryEmbeddingProviders`       | `string[]` | Veraltete IDs Memory-spezifischer Embedding-Provider, die dieses Plugin besitzt.                                                              |
| `mediaUnderstandingProviders`    | `string[]` | IDs von Providern für das Medienverständnis, die dieses Plugin besitzt.                                                                      |
| `transcriptSourceProviders`      | `string[]` | IDs von Providern für Transkriptquellen, die dieses Plugin besitzt.                                                                          |
| `documentExtractors`             | `string[]` | IDs von Providern für Dokumentextraktoren (zum Beispiel PDF), die dieses Plugin besitzt.                                                      |
| `imageGenerationProviders`       | `string[]` | IDs von Providern für die Bilderzeugung, die dieses Plugin besitzt.                                                                          |
| `videoGenerationProviders`       | `string[]` | IDs von Providern für die Videoerzeugung, die dieses Plugin besitzt.                                                                         |
| `musicGenerationProviders`       | `string[]` | IDs von Providern für die Musikerzeugung, die dieses Plugin besitzt.                                                                         |
| `webContentExtractors`           | `string[]` | IDs von Providern für die Inhaltsextraktion aus Webseiten, die dieses Plugin besitzt.                                                        |
| `webFetchProviders`              | `string[]` | IDs von Web-Abruf-Providern, die dieses Plugin besitzt.                                                                                       |
| `webSearchProviders`             | `string[]` | IDs von Websuch-Providern, die dieses Plugin besitzt.                                                                                         |
| `workerProviders`                | `string[]` | IDs von Cloud-Worker-Providern, die dieses Plugin für die Bereitstellung und den profilgestützten Lease-Lebenszyklus besitzt.                  |
| `usageProviders`                 | `string[]` | Provider-IDs, deren Hooks für Nutzungsauthentifizierung und Nutzungssnapshots dieses Plugin besitzt.                                         |
| `migrationProviders`             | `string[]` | IDs von Import-Providern, die dieses Plugin für `openclaw migrate` besitzt.                                                                   |
| `gatewayMethodDispatch`          | `string[]` | Reservierte Berechtigung für authentifizierte Plugin-HTTP-Routen, die Gateway-Methoden innerhalb des Prozesses weiterleiten.                  |
| `tools`                          | `string[]` | Namen von Agent-Tools, die dieses Plugin besitzt.                                                                                             |

`contracts.embeddedExtensionFactories` bleibt für gebündelte Erweiterungs-Factories erhalten, die ausschließlich für den Codex-App-Server bestimmt sind. Gebündelte Transformationen von Tool-Ergebnissen sollten stattdessen `contracts.agentToolResultMiddleware` deklarieren und sich mit `api.registerAgentToolResultMiddleware(...)` registrieren. Installierte Plugins dürfen dieselbe Middleware-Schnittstelle nur verwenden, wenn sie ausdrücklich aktiviert ist, und nur für Runtimes, die sie in `contracts.agentToolResultMiddleware` deklarieren.

Installierte Plugins, die die vom Host als vertrauenswürdig eingestufte Richtlinienebene vor der Tool-Ausführung benötigen, müssen jede registrierte lokale ID in `contracts.trustedToolPolicies` deklarieren und ausdrücklich aktiviert werden. Gebündelte Plugins behalten den bestehenden Pfad für vertrauenswürdige Richtlinien bei, installierte Plugins mit nicht deklarierten Richtlinien-IDs werden jedoch vor der Registrierung abgewiesen. Richtlinien-IDs sind auf das registrierende Plugin beschränkt, sodass zwei Plugins jeweils `workflow-budget` deklarieren und registrieren dürfen; ein einzelnes Plugin darf dieselbe lokale ID nicht zweimal registrieren.

Runtime-Registrierungen für `api.registerTool(...)` müssen mit `contracts.tools` übereinstimmen. Die Tool-Erkennung verwendet diese Liste, um nur die Plugin-Runtimes zu laden, denen die angeforderten Tools gehören können.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten `contracts.externalAuthProviders` deklarieren; nicht deklarierte Hooks für externe Authentifizierung werden ignoriert.

Provider-Plugins, die sowohl `resolveUsageAuth` als auch `fetchUsageSnapshot` implementieren, sollten jede automatisch erkannte Provider-ID in `contracts.usageProviders` deklarieren. Die Nutzungserkennung liest diesen Vertrag vor dem Laden des Runtime-Codes und überprüft anschließend beide Hooks, nachdem nur die deklarierten Besitzer geladen wurden.

Allgemeine Embedding-Provider sollten `contracts.embeddingProviders` für jeden mit `api.registerEmbeddingProvider(...)` registrierten Adapter deklarieren. Verwenden Sie den allgemeinen Vertrag für die wiederverwendbare Vektorerzeugung, einschließlich Providern, die von der Memory-Suche verwendet werden. `contracts.memoryEmbeddingProviders` ist eine veraltete Memory-spezifische Kompatibilität und bleibt nur bestehen, während vorhandene Provider zur generischen Schnittstelle für Embedding-Provider migrieren.

Worker-Provider müssen jede `api.registerWorkerProvider(...)`-ID in `contracts.workerProviders` deklarieren. Der Kern speichert die dauerhafte Absicht, bevor `provision` aufgerufen wird; Provider validieren ihre Einstellungen vor der externen Zuweisung, und wiederholte Aufrufe mit derselben Vorgangs-ID müssen dasselbe Lease übernehmen. Der Kern speichert außerdem diesen validierten Einstellungssnapshot und übergibt ihn zusammen mit `leaseId` an `inspect({ leaseId, profile })` und `destroy({ leaseId, profile })`, auch nachdem das benannte Profil geändert oder entfernt wurde. Die Zerstörung ist idempotent, die Inspektion gibt die geschlossene Status-Union aus `active` / `destroyed` / `unknown` zurück, und privates SSH-Schlüsselmaterial wird ausschließlich über `SecretRef` referenziert. Bereitgestellte SSH-Endpunkte müssen außerdem einen öffentlichen `hostKey` aus einer vertrauenswürdigen Bereitstellungsausgabe enthalten, und zwar exakt als `algorithm base64`, ohne Hostnamen oder Kommentar, damit der Kern den Host vor dem Verbindungsaufbau anheften kann. Provider, die dynamische Identitätsreferenzen erzeugen, können das maßgebliche `resolveSshIdentity({ leaseId, profile, keyRef })` implementieren; Provider ohne diese Implementierung verwenden den generischen Secret-Resolver des Kerns. Ein maßgebliches `unknown` macht einen aktiven lokalen Datensatz verwaist; nach einer gespeicherten Zerstörungsanforderung bestätigt es den Abbau.

`contracts.gatewayMethodDispatch` akzeptiert derzeit `"authenticated-request"`. Es ist eine API-Hygiene-Schranke für native Plugin-HTTP-Routen, die absichtlich Gateway-Control-Plane-Methoden innerhalb des Prozesses weiterleiten, und keine Sandbox gegen bösartige native Plugins. Verwenden Sie sie nur für sorgfältig geprüfte gebündelte bzw. Operator-Oberflächen, die bereits eine Gateway-HTTP-Authentifizierung erfordern. Eine berechtigte Route bleibt bei geschlossener Zulassung von Gateway-Root-Aufgaben nur erreichbar, wenn sie zusätzlich `auth: "gateway"` und das routenspezifische `gatewayRuntimeScopeSurface: "trusted-operator"` deklariert; gewöhnliche benachbarte Routen desselben Plugins bleiben hinter der Zulassungsgrenze. Dadurch bleiben der Sperrstatus und die Wiederaufnahme erreichbar, ohne dem gesamten Plugin eine Umgehung der Zulassung zu gewähren. Halten Sie Parsing und Antwortgestaltung außerhalb der Weiterleitung begrenzt; substanzielle oder verändernde Arbeit muss über die Gateway-Methodenweiterleitung erfolgen, der die Durchsetzung von Zulassung und Geltungsbereich obliegt.

## Referenz zu configContracts

Verwenden Sie `configContracts` für manifestgesteuertes Konfigurationsverhalten, das generische Kernhelfer benötigen, ohne die Plugin-Runtime zu importieren: Erkennung gefährlicher Flags, SecretRef-Migrationsziele und Eingrenzung veralteter Konfigurationspfade.

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
          "path": "routes.*.secret",
          "expected": "string",
          "ownerKind": "route"
        }
      ]
    }
  }
}
```

| Feld                          | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                                                              |
| ----------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `compatibilityMigrationPaths` | Nein         | `string[]` | Stammrelative Konfigurationspfade, die darauf hinweisen, dass die Kompatibilitätsmigrationen dieses Plugins während der Einrichtung zutreffen könnten. Dadurch können generische Runtime-Konfigurationslesevorgänge sämtliche Einrichtungsoberflächen des Plugins überspringen, wenn die Konfiguration niemals auf das Plugin verweist. |
| `compatibilityRuntimePaths`   | Nein         | `string[]` | Stammrelative Kompatibilitätspfade, die dieses Plugin während der Runtime bedienen kann, bevor der Plugin-Code vollständig aktiviert wird. Verwenden Sie dies für veraltete Oberflächen, die gebündelte Kandidatenmengen eingrenzen sollen, ohne jede kompatible Plugin-Runtime zu importieren. |
| `dangerousFlags`              | Nein         | `object[]` | Konfigurationsliterale, die `openclaw doctor` bei Aktivierung als unsicher oder gefährlich kennzeichnen sollte. Siehe unten.                                                                                                                            |
| `secretInputs`                | Nein         | `object`   | Konfigurationspfade unter `plugins.entries.<id>.config` für SecretRef-Migration, Prüfung, Materialisierung beim Start und optionale Isolation des Runtime-Besitzers. Siehe unten.                                                                                 |

Jeder `dangerousFlags`-Eintrag unterstützt:

| Feld    | Erforderlich | Typ                                  | Bedeutung                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Ja      | `string`                              | Durch Punkte getrennter Konfigurationspfad relativ zu `plugins.entries.<id>.config`. Unterstützt `*`-Platzhalter für Karten-/Array-Segmente. |
| `equals` | Ja      | `string \| number \| boolean \| null` | Exaktes Literal, das diesen Konfigurationswert als gefährlich kennzeichnet.                                                            |

`secretInputs` unterstützt:

| Feld                   | Erforderlich | Typ       | Bedeutung                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Nein       | `boolean`  | Überschreibt die standardmäßige Aktivierung des gebündelten Plugins bei der Entscheidung, ob diese SecretRef-Oberfläche aktiv ist. Verwenden Sie dies, wenn das Plugin gebündelt ist, die Oberfläche jedoch inaktiv bleiben soll, bis sie explizit in der Konfiguration aktiviert wird.                                                                                                                                            |
| `paths`                 | Ja      | `object[]` | Konfigurationspfade für Geheimnisse, jeweils mit `path` (durch Punkte getrennt, relativ zu `plugins.entries.<id>.config`, unterstützt `*`-Platzhalter), optionalem `expected` (derzeit nur `"string"`) und optionalem `ownerKind` (derzeit nur `"route"`). Ein deklarierter Besitzer isoliert bei fehlgeschlagener Auflösung nur den exakt übereinstimmenden Pfad; seine Besitzer-ID ist der vollständige Konfigurationspfad. |

## Referenz zu mediaUnderstandingProviderMetadata

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Provider für das Medienverständnis Standardmodelle, eine Fallback-Priorität für die automatische Authentifizierung oder native Dokumentunterstützung bietet, die generische Core-Hilfsfunktionen vor dem Laden der Laufzeit benötigen. Schlüssel müssen außerdem in `contracts.mediaUnderstandingProviders` deklariert sein.

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

| Feld                  | Typ                                                             | Bedeutung                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Von diesem Provider bereitgestellte Medienfunktionen.                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | Standardzuordnungen von Funktionen zu Modellen, die verwendet werden, wenn die Konfiguration kein Modell angibt.                                         |
| `autoPriority`         | `Record<string, number>`                                         | Niedrigere Zahlen werden beim automatischen, zugangsdatenbasierten Provider-Fallback früher einsortiert.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Vom Provider unterstützte native Dokumenteingaben.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Modellspezifische Überschreibungen pro Dokumenttyp. Setzen Sie `image: false`, um die bildbasierte Extraktion für diesen Dokumenttyp zu deaktivieren. |

## Referenz zu channelConfigs

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin leichtgewichtige Konfigurationsmetadaten benötigt, bevor die Laufzeit geladen wird. Die schreibgeschützte Ermittlung von Kanaleinrichtung und -status kann diese Metadaten direkt für konfigurierte externe Kanäle verwenden, wenn kein Einrichtungseintrag verfügbar ist oder wenn `setup.requiresRuntime: false` deklariert, dass keine Einrichtungslaufzeit erforderlich ist.

`channelConfigs` sind Metadaten des Plugin-Manifests und kein neuer Konfigurationsabschnitt auf oberster Ebene für Benutzer. Benutzer konfigurieren Kanalinstanzen weiterhin unter `channels.<channel-id>`. OpenClaw liest die Manifest-Metadaten, um zu bestimmen, welches Plugin den konfigurierten Kanal besitzt, bevor der Plugin-Laufzeitcode ausgeführt wird.

Bei einem Kanal-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten außerdem entsprechende `channelConfigs`-Einträge deklarieren. Ohne diese kann OpenClaw das Plugin weiterhin laden, doch Konfigurationsschema-, Einrichtungs- und Control-UI-Oberflächen im Kaltpfad können die Form der kanaleigenen Optionen oder rein darstellungsbezogene UI-Hinweise erst erkennen, wenn die Plugin-Laufzeit ausgeführt wird.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und `nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Prüfungen der Befehlskonfiguration deklarieren, die ausgeführt werden, bevor die Kanallaufzeit geladen wird. Gebündelte Kanäle können dieselben Standardwerte außerdem über `package.json#openclaw.channel.commands` zusammen mit ihren anderen paketeigenen Kanalkatalog-Metadaten veröffentlichen.

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

| Feld         | Typ                     | Bedeutung                                                                                                    |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanalkonfigurationseintrag erforderlich.                                |
| `uiHints`     | `Record<string, object>` | Optionale Bezeichnungen, Platzhalter, Angaben zur Vertraulichkeit und rein darstellungsbezogene Hinweise für diesen Kanalkonfigurationsabschnitt. |
| `label`       | `string`                 | Kanalbezeichnung, die in Auswahl- und Inspektionsoberflächen eingefügt wird, wenn die Laufzeitmetadaten noch nicht verfügbar sind.                        |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                                                      |
| `commands`    | `object`                 | Statische automatische Standardwerte für native Befehle und native Skills bei Konfigurationsprüfungen vor der Laufzeit.                              |
| `preferOver`  | `string[]`               | Veraltete oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll.                           |

### Ersetzen eines anderen Kanal-Plugins

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Besitzer einer Kanal-ID ist, die auch ein anderes Plugin bereitstellen kann. Häufige Fälle sind eine umbenannte Plugin-ID, ein eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der zur Konfigurationskompatibilität dieselbe Kanal-ID beibehält.

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

Wenn `channels.chat` konfiguriert ist, berücksichtigt OpenClaw sowohl die Kanal-ID als auch die bevorzugte Plugin-ID. Wenn das niedriger priorisierte Plugin nur ausgewählt wurde, weil es gebündelt oder standardmäßig aktiviert ist, deaktiviert OpenClaw es in der effektiven Laufzeitkonfiguration, sodass ein einziges Plugin den Kanal und seine Tools besitzt. Eine explizite Benutzerauswahl hat weiterhin Vorrang: Wenn der Benutzer beide Plugins explizit aktiviert (über `plugins.allow` oder eine wesentliche `plugins.entries`-Konfiguration), behält OpenClaw diese Auswahl bei und meldet Diagnosen zu doppelten Kanälen/Tools, anstatt die angeforderte Plugin-Auswahl stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die tatsächlich denselben Kanal bereitstellen können. Es handelt sich weder um ein allgemeines Prioritätsfeld noch werden dadurch Schlüssel der Benutzerkonfiguration umbenannt.

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

- Explizite `provider/model`-Referenzen verwenden die Manifest-Metadaten des besitzenden `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- Wenn sowohl ein nicht gebündeltes als auch ein gebündeltes Plugin übereinstimmen, hat das nicht gebündelte Plugin Vorrang
- Eine verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld           | Typ       | Bedeutung                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen verkürzte Modell-IDs abgeglichen werden.                 |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen des Profilsuffixes gegen verkürzte Modell-IDs abgeglichen werden. |

`modelPatterns`-Einträge werden über `compileSafeRegex` kompiliert, das Muster mit verschachtelten Wiederholungen ablehnt (zum Beispiel `(a+)+$`). Muster, die die Sicherheitsprüfung nicht bestehen, werden ebenso wie syntaktisch ungültige reguläre Ausdrücke stillschweigend übersprungen. Halten Sie Muster einfach und vermeiden Sie verschachtelte Quantifizierer.

## Referenz zu modelCatalog

Verwenden Sie `modelCatalog`, wenn OpenClaw die Modellmetadaten eines Providers kennen soll, bevor die Plugin-Laufzeit geladen wird. Dies ist die vom Manifest verwaltete Quelle für feste Katalogzeilen, Provider-Aliasse, Unterdrückungsregeln und den Ermittlungsmodus. Die Laufzeitaktualisierung verbleibt weiterhin im Provider-Laufzeitcode, das Manifest teilt dem Core jedoch mit, wann die Laufzeit erforderlich ist.

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

| Feld            | Typ                                                     | Bedeutung                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Die Schlüssel sollten auch in `providers` auf der obersten Ebene vorkommen.       |
| `aliases`        | `Record<string, object>`                                 | Provider-Aliasse, die für die Katalog- oder Unterdrückungsplanung zu einem eigenen Provider aufgelöst werden sollen.              |
| `suppressions`   | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus einem Provider-spezifischen Grund unterdrückt.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Ob der Provider-Katalog aus Manifest-Metadaten gelesen, im Cache aktualisiert werden kann oder die Laufzeit benötigt. |
| `runtimeAugment` | `boolean`                                                | Nur auf `true` setzen, wenn die Provider-Laufzeit nach der Manifest-/Konfigurationsplanung Katalogzeilen anhängen muss.       |

`aliases` nimmt an der Suche nach der Provider-Zuständigkeit für die Modellkatalogplanung teil. Aliasziele müssen Provider der obersten Ebene sein, die demselben Plugin gehören. Wenn eine nach Provider gefilterte Liste einen Alias verwendet, kann OpenClaw das zuständige Manifest lesen und Aliasüberschreibungen für API und Basis-URL anwenden, ohne die Provider-Laufzeit zu laden. Aliasse erweitern ungefilterte Katalogauflistungen nicht; umfassende Listen geben nur die Zeilen des zuständigen kanonischen Providers aus.

`suppressions` ersetzt den alten Provider-Laufzeit-Hook `suppressBuiltInModel`. Unterdrückungseinträge werden nur berücksichtigt, wenn der Provider dem Plugin gehört oder als `modelCatalog.aliases`-Schlüssel deklariert ist, der auf einen eigenen Provider verweist. Laufzeit-Hooks zur Unterdrückung werden während der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld                 | Typ                     | Bedeutung                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Optionale standardmäßige Basis-URL für Modelle in diesem Provider-Katalog.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Optionaler standardmäßiger API-Adapter für Modelle in diesem Provider-Katalog.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Optionale, vom Provider empfohlene ID eines kleinen Modells für kurze interne Hilfsaufgaben (Titel, Fortschrittsbeschreibung). Wird verwendet, wenn `agents.defaults.utilityModel` nicht gesetzt ist und dieser Provider das primäre Modell des Agenten bereitstellt. |
| `models`              | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.                                                                                                                                                            |

Modellfelder:

| Feld              | Typ                                                           | Bedeutung                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                    |
| `name`             | `string`                                                       | Optionaler Anzeigename.                                                      |
| `api`              | `ModelApi`                                                     | Optionale API-Überschreibung pro Modell.                                            |
| `baseUrl`          | `string`                                                       | Optionale Überschreibung der Basis-URL pro Modell.                                       |
| `headers`          | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalitäten, die das Modell akzeptiert. Andere Werte werden stillschweigend verworfen.            |
| `reasoning`        | `boolean`                                                      | Ob das Modell Reasoning-Verhalten bereitstellt.                               |
| `contextWindow`    | `number`                                                       | Natives Kontextfenster des Providers.                                             |
| `contextTokens`    | `number`                                                       | Optionale effektive Kontextobergrenze der Laufzeit, wenn sie von `contextWindow` abweicht. |
| `maxTokens`        | `number`                                                       | Maximale Anzahl an Ausgabetokens, sofern bekannt.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Optionale Überschreibungen der Modell-ID oder von Parametern pro Denkstufe.                    |
| `cost`             | `object`                                                       | Optionale Preise in USD pro Million Tokens, einschließlich des optionalen `tieredPricing`. |
| `compat`           | `object`                                                       | Optionale Kompatibilitäts-Flags, die der Kompatibilität der OpenClaw-Modellkonfiguration entsprechen.  |
| `mediaInput`       | `object`                                                       | Optionale Eingabekonfiguration pro Modalität, derzeit nur für Bilder.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Auflistungsstatus. Nur unterdrücken, wenn die Zeile überhaupt nicht erscheinen darf.          |
| `statusReason`     | `string`                                                       | Optionaler Grund, der bei einem Status „nicht verfügbar“ angezeigt wird.                            |
| `replaces`         | `string[]`                                                     | Ältere Provider-lokale Modell-IDs, die durch dieses Modell ersetzt werden.                       |
| `replacedBy`       | `string`                                                       | Provider-lokale ID des Ersatzmodells für veraltete Zeilen.                    |
| `tags`             | `string[]`                                                     | Stabile Tags, die von Auswahlfeldern und Filtern verwendet werden.                                    |

Unterdrückungsfelder:

| Feld                      | Typ       | Bedeutung                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-ID der vorgelagerten Zeile, die unterdrückt werden soll. Muss diesem Plugin gehören oder als eigener Alias deklariert sein. |
| `model`                    | `string`   | Provider-lokale Modell-ID, die unterdrückt werden soll.                                                                      |
| `reason`                   | `string`   | Optionale Meldung, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.                                     |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste der Hosts effektiver Provider-Basis-URLs, die erforderlich sind, bevor die Unterdrückung angewendet wird.               |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter `api`-Werte der Provider-Konfiguration, die erforderlich sind, bevor die Unterdrückung angewendet wird.              |

Legen Sie keine Daten, die nur zur Laufzeit verfügbar sind, in `modelCatalog` ab. Verwenden Sie `static` nur, wenn die Manifestzeilen vollständig genug sind, damit nach Provider gefilterte Listen und Auswahloberflächen die Registry-/Laufzeiterkennung überspringen können. Verwenden Sie `refreshable`, wenn Manifestzeilen nützliche auflistbare Ausgangswerte oder Ergänzungen sind, eine Aktualisierung bzw. ein Cache jedoch später weitere Zeilen hinzufügen kann; aktualisierbare Zeilen sind für sich genommen nicht maßgeblich. Verwenden Sie `runtime`, wenn OpenClaw die Provider-Laufzeit laden muss, um die Liste zu ermitteln.

## Referenz zu modelIdNormalization

Verwenden Sie `modelIdNormalization` für eine kostengünstige, Provider-eigene Bereinigung von Modell-IDs, die vor dem Laden der Provider-Laufzeit erfolgen muss. Dadurch bleiben Aliasse wie kurze Modellnamen, ältere Provider-lokale IDs und Regeln für Proxy-Präfixe im Manifest des zuständigen Plugins statt in den zentralen Tabellen zur Modellauswahl.

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

| Feld                                 | Typ                     | Bedeutung                                                                                 |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exakte Modell-ID-Aliasse ohne Berücksichtigung der Groß-/Kleinschreibung. Werte werden wie geschrieben zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Präfixe, die vor der Alias-Suche entfernt werden, nützlich bei veralteter Duplizierung von Provider und Modell. |
| `prefixWhenBare`                     | `string`                | Hinzuzufügendes Präfix, wenn die normalisierte Modell-ID `/` noch nicht enthält. |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für reine IDs nach der Alias-Suche, nach `modelPrefix` und `prefix` indiziert. |

## Referenz zu providerEndpoints

Verwenden Sie `providerEndpoints` für die Endpunktklassifizierung, die generische Anfragerichtlinien kennen müssen, bevor die Provider-Laufzeit geladen wird. Der Core definiert weiterhin die Bedeutung jeder `endpointClass`; Plugin-Manifeste definieren die Host- und Basis-URL-Metadaten.

Offiziell externalisierte Provider-Plugins sind von der Core-Distribution ausgeschlossen, daher
sind ihre Manifeste bis zur Installation nicht sichtbar. Ihre `providerEndpoints` müssen
auch in `scripts/lib/official-external-provider-catalog.json` gespiegelt werden, damit
die Endpunktklassifizierung ohne das Plugin weiterhin funktioniert; ein Vertragstest
erzwingt diese Spiegelung.

Endpunktfelder:

| Feld                           | Typ        | Bedeutung                                                                                      |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekannte Core-Endpunktklasse, etwa `openrouter`, `moonshot-native` oder `google-vertex`. |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpunktklasse zugeordnet werden.                                    |
| `hostSuffixes`                 | `string[]` | Host-Suffixe, die der Endpunktklasse zugeordnet werden. Stellen Sie `.` für einen Abgleich ausschließlich mit Domain-Suffixen voran. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpunktklasse zugeordnet werden.              |
| `googleVertexRegion`           | `string`   | Statische Google-Vertex-Region für exakte globale Hosts.                                       |
| `googleVertexRegionHostSuffix` | `string`   | Von übereinstimmenden Hosts zu entfernendes Suffix, um das Präfix der Google-Vertex-Region offenzulegen. |

## Referenz zu providerRequest

Verwenden Sie `providerRequest` für kostengünstige Metadaten zur Anfragekompatibilität, die generische Anfragerichtlinien benötigen, ohne die Provider-Laufzeit zu laden. Verhalten-spezifische Umschreibungen der Nutzlast verbleiben in Hooks der Provider-Laufzeit oder in gemeinsam genutzten Hilfsfunktionen der Provider-Familie.

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
| `family`              | `string`     | Bezeichnung der Provider-Familie für generische Entscheidungen zur Anfragekompatibilität und Diagnosen. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Kompatibilitätsbereich der Provider-Familie für gemeinsam genutzte Anfragehilfen. |
| `openAICompletions`   | `object`     | Anfrage-Flags für OpenAI-kompatible Vervollständigungen, derzeit `supportsStreamingUsage`. |

## Referenz zu secretProviderIntegrations

Verwenden Sie `secretProviderIntegrations`, wenn ein Plugin eine wiederverwendbare Voreinstellung für einen SecretRef-Exec-Provider veröffentlichen kann. OpenClaw liest diese Metadaten, bevor die Plugin-Laufzeit geladen wird, speichert die Plugin-Zuständigkeit in `secrets.providers.<alias>.pluginIntegration` und überlässt die eigentliche Geheimnisauflösung der SecretRef-Laufzeit. Voreinstellungen werden nur für gebündelte Plugins und installierte Plugins bereitgestellt, die in den verwalteten Plugin-Installationsstammverzeichnissen gefunden werden, etwa bei Installationen über Git und ClawHub.

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

Der Zuordnungsschlüssel ist die Integrations-ID. Wenn `providerAlias` ausgelassen wird, verwendet OpenClaw die Integrations-ID als SecretRef-Provider-Alias. Provider-Aliasse müssen dem normalen Muster für SecretRef-Provider-Aliasse entsprechen, beispielsweise `team-secrets` oder `onepassword-work`.

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

Beim Start oder Neuladen löst OpenClaw diesen Provider auf, indem es die aktuellen Metadaten des Plugin-Manifests lädt, prüft, ob das zuständige Plugin installiert und aktiv ist, und den Exec-Befehl aus dem Manifest materialisiert. Durch Deaktivieren oder Entfernen des Plugins wird der Provider für aktive SecretRefs widerrufen. Betreiber, die eine eigenständige Exec-Konfiguration wünschen, können weiterhin manuelle `command`- bzw. `args`-Provider direkt eintragen.

Derzeit werden nur `source: "exec"`-Voreinstellungen unterstützt. `command` muss `${node}` sein, und `args[0]` muss ein relativ zum Plugin-Stammverzeichnis angegebenes `./`-Resolver-Skript sein. OpenClaw materialisiert es beim Start oder Neuladen zum aktuellen ausführbaren Node-Programm und zum absoluten Skriptpfad innerhalb des Plugins. Node-Optionen wie `--require`, `--import`, `--loader`, `--env-file`, `--eval` und `--print` sind nicht Bestandteil des Vertrags für Manifest-Voreinstellungen. Betreiber, die andere Befehle als Node benötigen, können eigenständige manuelle Exec-Provider direkt konfigurieren.

OpenClaw leitet `trustedDirs` für Manifest-Voreinstellungen aus dem Plugin-Stammverzeichnis und bei `${node}`-Voreinstellungen aus dem Verzeichnis des aktuellen ausführbaren Node-Programms ab. Im Manifest angegebene `trustedDirs` werden ignoriert. Andere Optionen des Exec-Providers wie `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` und `allowInsecurePath` werden an die normale Konfiguration des SecretRef-Exec-Providers weitergereicht.

## Referenz zu modelPricing

Verwenden Sie `modelPricing`, wenn ein Provider Preisverhalten auf Steuerungsebene benötigt, bevor die Laufzeit geladen wird. Der Preis-Cache des Gateways liest diese Metadaten, ohne Provider-Laufzeitcode zu importieren.

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

| Feld         | Typ               | Bedeutung                                                                                          |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Setzen Sie `false` für lokale oder selbst gehostete Provider, die niemals Preisdaten von OpenRouter oder LiteLLM abrufen sollen. |
| `openRouter` | `false \| object` | Zuordnung für die Preisabfrage bei OpenRouter. `false` deaktiviert die OpenRouter-Abfrage für diesen Provider. |
| `liteLLM`    | `false \| object` | Zuordnung für die Preisabfrage bei LiteLLM. `false` deaktiviert die LiteLLM-Abfrage für diesen Provider. |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                            |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Provider-ID des externen Katalogs, wenn sie von der OpenClaw-Provider-ID abweicht, beispielsweise `z-ai` für einen `zai`-Provider. |
| `passthroughProviderModel` | `boolean`          | Modell-IDs mit Schrägstrichen als verschachtelte Provider-/Modellreferenzen behandeln, nützlich für Proxy-Provider wie OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche Modell-ID-Varianten des externen Katalogs. `version-dots` versucht punktierte Versions-IDs wie `claude-opus-4.6`. |

### OpenClaw-Provider-Index

Der OpenClaw-Provider-Index besteht aus OpenClaw-eigenen Vorschaumetadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist nicht Bestandteil eines Plugin-Manifests. Plugin-Manifeste bleiben die maßgebliche Instanz für installierte Plugins. Der Provider-Index ist der interne Rückfallvertrag, den künftige Oberflächen für installierbare Provider und die Modellauswahl vor der Installation nutzen, wenn ein Provider-Plugin nicht installiert ist.

Rangfolge der Katalogautorität:

1. Benutzerkonfiguration.
2. Installiertes Plugin-Manifest `modelCatalog`.
3. Modellkatalog-Cache aus einer expliziten Aktualisierung.
4. Vorschauzeilen des OpenClaw-Provider-Index.

Der Provider-Index darf keine Geheimnisse, keinen Aktivierungsstatus, keine Laufzeit-Hooks und keine kontospezifischen Live-Modelldaten enthalten. Seine Vorschaukataloge verwenden dieselbe `modelCatalog`-Provider-Zeilenstruktur wie Plugin-Manifeste, sollten jedoch auf stabile Anzeigemetadaten beschränkt bleiben, sofern Laufzeitadapterfelder wie `api`, `baseUrl`, Preise oder Kompatibilitäts-Flags nicht bewusst mit dem installierten Plugin-Manifest synchron gehalten werden. Provider mit einer Live-Ermittlung über `/models` sollten aktualisierte Zeilen über den expliziten Modellkatalog-Cache-Pfad schreiben, statt bei normalen Auflistungen oder beim Onboarding Provider-APIs aufzurufen.

Einträge im Provider-Index können auch Metadaten installierbarer Plugins für Provider enthalten, deren Plugin aus dem Core ausgelagert wurde oder aus anderen Gründen noch nicht installiert ist. Diese Metadaten spiegeln das Muster des Kanalkatalogs wider: Paketname, npm-Installationsspezifikation, erwartete Integrität und einfache Bezeichnungen für Authentifizierungsoptionen genügen, um eine installierbare Einrichtungsoption anzuzeigen. Sobald das Plugin installiert ist, hat sein Manifest Vorrang und der Eintrag im Provider-Index wird für diesen Provider ignoriert.

`openclaw doctor --fix` migriert eine kleine, abgeschlossene Gruppe veralteter Manifest-Fähigkeitsschlüssel der obersten Ebene nach `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` und `tools`. Keiner davon – und auch keine andere Fähigkeitsliste – wird noch als Manifestfeld der obersten Ebene gelesen; beim normalen Laden von Manifesten werden sie nur unter `contracts` erkannt.

## Manifest im Vergleich zu package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwendungszweck                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Erkennung, Konfigurationsvalidierung, Metadaten für Authentifizierungsoptionen und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und der `openclaw`-Block für Einstiegspunkte, Installationsvoraussetzungen, Einrichtung oder Katalogmetadaten |

Wenn Sie nicht sicher sind, wohin bestimmte Metadaten gehören, verwenden Sie diese Regel:

- wenn OpenClaw dies vor dem Laden des Plugin-Codes kennen muss, legen Sie es in `openclaw.plugin.json` ab
- wenn es um Paketierung, Einstiegspunktdateien oder das Verhalten von npm install geht, legen Sie es in `package.json` ab

### package.json-Felder, die die Erkennung beeinflussen

Einige Plugin-Metadaten für die Phase vor der Laufzeit befinden sich bewusst in `package.json` unter dem Block `openclaw` statt in `openclaw.plugin.json`. `openclaw.bundle` und `openclaw.bundle.json` sind keine OpenClaw-Plugin-Verträge; native Plugins müssen `openclaw.plugin.json` sowie die unten aufgeführten unterstützten `package.json#openclaw`-Felder verwenden.

Wichtige Beispiele:

| Feld                                                                                       | Bedeutung                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                           |
| `openclaw.runtimeExtensions`                                                               | Deklariert erstellte JavaScript-Laufzeit-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                    |
| `openclaw.setupEntry`                                                                      | Leichtgewichtiger, ausschließlich für die Einrichtung bestimmter Einstiegspunkt, der beim Onboarding, beim verzögerten Kanalstart und bei der schreibgeschützten Erkennung von Kanalstatus/SecretRef verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                                               | Deklariert den erstellten JavaScript-Einrichtungseinstiegspunkt für installierte Pakete. Erfordert `setupEntry`, muss vorhanden sein und innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.channel`                                                                         | Kostengünstige Kanalkatalog-Metadaten wie Bezeichnungen, Dokumentationspfade, Aliasse und Auswahltexte.                                                                                    |
| `openclaw.channel.approvalFlags`                                                           | Abgeschlossene Flags für das Genehmigungsverhalten, die vor dem Laden der Laufzeit verfügbar sind. `native` bedeutet, dass der Kanal eine native Genehmigungsoberfläche und die Auflösung im selben Durchlauf verwaltet. |
| `openclaw.channel.commands`                                                                | Statische Metadaten zu nativen Befehlen und automatischen Standardwerten nativer Skills, die von Konfigurations-, Prüfungs- und Befehlslistenoberflächen verwendet werden, bevor die Kanallaufzeit geladen wird. |
| `openclaw.channel.cliAddOptions`                                                           | Plugin-eigene `openclaw channels add`-Optionen. Jeder Eintrag deklariert `flags`, `description`, optional `defaultValue` und optional `valueType` (`int` oder `list`) für die generische Eingabekonvertierung. |
| `openclaw.channel.configuredState`                                                         | Leichtgewichtige Metadaten für eine Prüfung des konfigurierten Zustands, die ohne Laden der vollständigen Kanallaufzeit beantworten kann: „Ist bereits eine ausschließlich umgebungsbasierte Einrichtung vorhanden?“ |
| `openclaw.channel.persistedAuthState`                                                      | Leichtgewichtige Metadaten für eine Prüfung persistierter Authentifizierung, die ohne Laden der vollständigen Kanallaufzeit beantworten kann: „Ist bereits irgendwo eine Anmeldung vorhanden?“ |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installations-/Aktualisierungshinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                  |
| `openclaw.install.defaultChoice`                                                           | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                           |
| `openclaw.install.minHostVersion`                                                          | Unterstützte Mindestversion des OpenClaw-Hosts unter Verwendung einer SemVer-Untergrenze wie `>=2026.3.22` oder `>=2026.5.1-beta.1`.                                                   |
| `openclaw.compat.pluginApi`                                                                | Von diesem Paket benötigter Mindestbereich der OpenClaw-Plugin-API unter Verwendung einer SemVer-Untergrenze wie `>=2026.5.27`.                                                       |
| `openclaw.install.expectedIntegrity`                                                       | Erwartete npm-dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Aktualisierungsabläufe prüfen das abgerufene Artefakt dagegen.                                         |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Ermöglicht einen eng begrenzten Wiederherstellungspfad zur Neuinstallation eines gebündelten Plugins, wenn die Konfiguration ungültig ist.                                                 |
| `openclaw.install.requiredPlatformPackages`                                                | npm-Paketaliasse, die bereitgestellt werden müssen, wenn ihre Lockfile-Plattformbeschränkungen zum aktuellen Host passen.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Ermöglicht das Laden von Kanaloberflächen der Einrichtungslaufzeit vor dem Lauschen und verzögert anschließend das vollständig konfigurierte Kanal-Plugin bis zur Aktivierung nach dem Lauschen. |

Manifest-Metadaten bestimmen, welche Provider-, Kanal- und Einrichtungsoptionen beim Onboarding angezeigt werden, bevor die Laufzeit geladen wird. `package.json#openclaw.install` teilt dem Onboarding mit, wie dieses Plugin abgerufen oder aktiviert werden soll, wenn eine dieser Optionen ausgewählt wird. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

Verwenden Sie für `openclaw.channel.cliAddOptions` die Langoptionssyntax von Commander, beispielsweise `--initial-sync-limit <n>`. Legen Sie `valueType: "int"` fest, um eine nicht negative Ganzzahl zu parsen, oder `valueType: "list"`, um durch Kommas, Semikolons oder Zeilenumbrüche getrennte Eingaben in Zeichenfolgen aufzuteilen, bevor der Plugin-Einrichtungsadapter sie empfängt. Lassen Sie `valueType` weg, um den geparsten Commander-Wert unverändert durchzureichen.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-Registry für nicht gebündelte Plugin-Quellen durchgesetzt. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte führen dazu, dass externe Plugins auf älteren Hosts übersprungen werden. Bei gebündelten Quell-Plugins wird davon ausgegangen, dass sie dieselbe Version wie der Host-Checkout verwenden.

`openclaw.install.requiredPlatformPackages` ist für npm-Pakete vorgesehen, die erforderliche native Binärdateien über optionale, plattformspezifische Aliasse bereitstellen. Listen Sie für jeden unterstützten Plattformalias den reinen npm-Paketnamen auf. Während npm install prüft OpenClaw nur den deklarierten Alias, dessen Lockfile-Beschränkungen zum aktuellen Host passen. Wenn npm einen Erfolg meldet, diesen Alias jedoch auslässt, versucht OpenClaw es einmal mit einem frischen Cache erneut und setzt die Installation zurück, falls der Alias weiterhin fehlt.

`openclaw.compat.pluginApi` wird während der Paketinstallation für nicht gebündelte Plugin-Quellen durchgesetzt. Verwenden Sie dieses Feld für die Untergrenze der OpenClaw-Plugin-SDK-/Laufzeit-API, gegen die das Paket erstellt wurde. Sie kann strenger als `minHostVersion` sein, wenn ein Plugin-Paket eine neuere API benötigt, für andere Abläufe jedoch weiterhin einen niedrigeren Installationshinweis beibehält. Die offizielle OpenClaw-Release-Synchronisierung erhöht vorhandene API-Untergrenzen offizieller Plugins standardmäßig auf die OpenClaw-Release-Version; reine Plugin-Releases können jedoch eine niedrigere Untergrenze beibehalten, wenn das Paket absichtlich ältere Hosts unterstützt. Verwenden Sie nicht allein die Paketversion als Kompatibilitätsvertrag. `peerDependencies.openclaw` bleibt npm-Paketmetadatum; OpenClaw verwendet den `openclaw.compat.pluginApi`-Vertrag für Entscheidungen zur Installationskompatibilität.

Offizielle Metadaten für die bedarfsgesteuerte Installation sollten `clawhubSpec` verwenden, wenn das Plugin auf ClawHub veröffentlicht ist; das Onboarding behandelt dies als bevorzugte Remote-Quelle und zeichnet nach der Installation Fakten zum ClawHub-Artefakt auf. `npmSpec` bleibt der Kompatibilitäts-Fallback für Pakete, die noch nicht zu ClawHub migriert wurden.

Die exakte Fixierung der npm-Version befindet sich bereits in `npmSpec`, beispielsweise `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalogeinträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Aktualisierungsabläufe sicher fehlschlagen, wenn das abgerufene npm-Artefakt nicht mehr dem fixierten Release entspricht. Das interaktive Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige npm-Spezifikationen aus der Registry an, einschließlich reiner Paketnamen und dist-tags. Katalogdiagnosen können zwischen exakten, gleitenden, integritätsfixierten, ohne Integritätsangabe versehenen, durch abweichende Paketnamen gekennzeichneten und ungültigen Standardauswahlquellen unterscheiden. Sie warnen außerdem, wenn `expectedIntegrity` vorhanden ist, jedoch keine gültige npm-Quelle existiert, die dadurch fixiert werden kann. Wenn `expectedIntegrity` vorhanden ist, setzen Installations-/Aktualisierungsabläufe den Wert durch; wenn er fehlt, wird die Registry-Auflösung ohne Integritätsfixierung aufgezeichnet.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status-, Kanallisten- oder SecretRef-Prüfungen konfigurierte Konten identifizieren müssen, ohne die vollständige Laufzeit zu laden. Der Einrichtungseinstiegspunkt sollte Kanalmetadaten sowie einrichtungssichere Adapter für Konfiguration, Status und Secrets bereitstellen; Netzwerkclients, Gateway-Listener und Transportlaufzeiten gehören in den Haupteinstiegspunkt der Erweiterung.

Felder für Laufzeit-Einstiegspunkte setzen Paketgrenzenprüfungen für Quell-Einstiegspunktfelder nicht außer Kraft. Beispielsweise kann `openclaw.runtimeExtensions` einen ausbrechenden `openclaw.extensions`-Pfad nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit ermöglicht es Installationsabläufen lediglich, bestimmte veraltete Fehler bei der Aktualisierung gebündelter Plugins zu beheben, beispielsweise einen fehlenden Pfad eines gebündelten Plugins oder einen veralteten `channels.<id>`-Eintrag für dasselbe gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und verweisen Betreiber auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` sind Paketmetadaten für ein winziges Prüfmodul:

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

Verwenden Sie diese Metadaten, wenn Einrichtung, Doctor, Status oder schreibgeschützte Anwesenheitsabläufe eine kostengünstige Ja/Nein-Authentifizierungsprüfung benötigen, bevor das vollständige Kanal-Plugin geladen wird. Persistierter Authentifizierungszustand ist kein konfigurierter Kanalzustand: Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren, Laufzeitabhängigkeiten zu reparieren oder zu entscheiden, ob eine Kanallaufzeit geladen werden soll. Der Zielexport sollte eine kleine Funktion sein, die ausschließlich den persistierten Zustand liest; leiten Sie ihn nicht durch das vollständige Kanallaufzeit-Barrel.

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

Verwenden Sie `env.allOf`, wenn jede aufgeführte Variable erforderlich ist, und `env.anyOf`, wenn eine beliebige nicht leere Variable ausreicht. Wenn eine kleine, laufzeitunabhängige Prüfung mehr als Umgebungsmetadaten benötigt, verwenden Sie `specifier` zusammen mit `exportName`, wie für `persistedAuthState` gezeigt; wenn `env` vorhanden ist, verwendet OpenClaw es, ohne dieses Modul zu laden. Wenn die Prüfung eine vollständige Konfigurationsauflösung oder die tatsächliche Kanallaufzeit benötigt, belassen Sie diese Logik stattdessen im `config.hasConfiguredState`-Hook des Plugins.

## Erkennungsrangfolge (doppelte Plugin-IDs)

OpenClaw erkennt Plugins aus drei Stammverzeichnissen, die in dieser Reihenfolge geprüft werden: mit OpenClaw ausgelieferte gebündelte Plugins, das globale Installationsstammverzeichnis (`~/.openclaw/extensions`) und das aktuelle Arbeitsbereichsstammverzeichnis (`<workspace>/.openclaw/extensions`) sowie alle expliziten `plugins.load.paths`-Einträge.

Wenn zwei erkannte Plugins dieselbe `id` aufweisen, wird nur das Manifest mit der **höchsten Priorität** beibehalten; Duplikate mit niedrigerer Priorität werden verworfen, statt parallel geladen zu werden. Priorität, von der höchsten zur niedrigsten:

1. **Durch Konfiguration ausgewählt** — ein explizit in `plugins.entries.<id>` festgelegter Pfad
2. **Globale Installation, die einem erfassten Installationsdatensatz entspricht** — ein über `openclaw plugin install`/`openclaw plugin update` installiertes Plugin, das von der Installationsverfolgung von OpenClaw für dieselbe ID erkannt wird, selbst wenn die ID auch zu einem gebündelten Plugin gehört
3. **Gebündelt** — mit OpenClaw ausgelieferte Plugins
4. **Arbeitsbereich** — relativ zum aktuellen Arbeitsbereich erkannte Plugins
5. Jeder andere erkannte Kandidat

Auswirkungen:

- Eine abgezweigte oder veraltete Kopie eines gebündelten Plugins, die nicht erfasst im Arbeitsbereich oder globalen Stammverzeichnis liegt, überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin zu überschreiben, führen Sie entweder `openclaw plugin install` für diese ID aus, sodass die erfasste globale Installation eine höhere Priorität als die gebündelte Kopie erhält, oder legen Sie über `plugins.entries.<id>` einen bestimmten Pfad fest, sodass dieser aufgrund der durch Konfiguration ausgewählten Priorität gewinnt.
- Das Verwerfen von Duplikaten wird protokolliert, damit Doctor und die Startdiagnose auf die verworfene Kopie hinweisen können.
- Durch Konfiguration ausgewählte Duplikatüberschreibungen werden in der Diagnose als explizite Überschreibungen bezeichnet, lösen aber weiterhin eine Warnung aus, damit veraltete Forks und versehentliche Überschattungen sichtbar bleiben.

## Anforderungen an das JSON-Schema

- **Jedes Plugin muss ein JSON-Schema ausliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen und Schreiben der Konfiguration validiert, nicht zur Laufzeit.
- Wenn Sie ein gebündeltes Plugin um neue Konfigurationsschlüssel erweitern oder davon einen Fork erstellen, aktualisieren Sie gleichzeitig dessen `openclaw.plugin.json` `configSchema`. Die Schemas gebündelter Plugins sind strikt. Daher wird das Hinzufügen von `plugins.entries.<id>.config.myNewKey` zur Benutzerkonfiguration ohne das Hinzufügen von `myNewKey` zu `configSchema.properties` abgelehnt, bevor die Plugin-Laufzeit geladen wird.

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

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, sofern die Kanal-ID nicht durch ein Plugin-Manifest deklariert ist. Wenn dieselbe ID auch in `plugins.allow`, `plugins.entries` oder `plugins.installs` erscheint (ein referenziertes, aber derzeit nicht auffindbares Plugin), stuft OpenClaw dies stattdessen zu einer **Warnung** herab.
- Verweise von `plugins.entries.<id>`, `plugins.allow` und `plugins.deny` auf unbekannte Plugin-IDs sind **Warnungen** („veralteter Konfigurationseintrag ignoriert“), keine Fehler, sodass Upgrades sowie entfernte oder umbenannte Plugins den Start des Gateways nicht blockieren.
- Ein Verweis von `plugins.slots.memory` auf eine unbekannte Plugin-ID ist ein **Fehler**, mit Ausnahme des bekannten offiziellen externen Plugins `memory-lancedb`, bei dem stattdessen eine Warnung ausgegeben wird.
- Wenn ein Plugin installiert ist, aber ein fehlerhaftes oder fehlendes Manifest oder Schema aufweist, schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration vorhanden, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und Doctor sowie die Protokolle geben eine **Warnung** aus.

Das vollständige `plugins.*`-Schema finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich solcher, die aus dem lokalen Dateisystem geladen werden. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient ausschließlich der Erkennung und Validierung.
- Native Manifeste werden mit JSON5 geparst. Daher sind Kommentare, nachgestellte Kommas und Schlüssel ohne Anführungszeichen zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Der Manifest-Loader liest nur dokumentierte Manifestfelder. Vermeiden Sie benutzerdefinierte Schlüssel auf oberster Ebene.
- `channels`, `providers`, `cliBackends` und `skills` können jeweils weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerCatalogEntry` muss schlank bleiben und sollte keinen umfangreichen Laufzeitcode importieren. Verwenden Sie es für statische Metadaten des Provider-Katalogs oder eng gefasste Erkennungsdeskriptoren, nicht für die Ausführung zur Anfragezeit.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory` (Standard `memory-core`), `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. Der Laufzeit-Einstieg `OpenClawPluginDefinition.kind` ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins erhalten.
- Metadaten zu Umgebungsvariablen in `setup.providers[].envVars` sind rein deklarativ. Status, Audit, Validierung der Cron-Zustellung und andere schreibgeschützte Oberflächen wenden weiterhin die Vertrauens- und effektiven Aktivierungsrichtlinien für Plugins an, bevor sie eine Umgebungsvariable als konfiguriert behandeln.
- Laufzeit-Metadaten für Assistenten, die Provider-Code erfordern, finden Sie unter [Provider-Laufzeit-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Allowlist-Anforderungen des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
