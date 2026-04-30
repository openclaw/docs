---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-30T07:05:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
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
Skill-Wurzeln, Claude-Befehlswurzeln, Standardwerte aus `settings.json` von
Claude-Bundles, LSP-Standardwerte von Claude-Bundles und unterstützte Hook-Pakete, wenn das Layout
den Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Stammverzeichnis** enthalten. OpenClaw verwendet dieses Manifest, um die Konfiguration zu validieren,
**ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe die vollständige Anleitung zum Plugin-System: [Plugins](/de/tools/plugin).
Für das native Capability-Modell und die aktuelle Anleitung zur externen Kompatibilität:
[Capability-Modell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, **bevor es Ihren
Plugin-Code lädt**. Alles unten muss günstig genug sein, um es zu prüfen, ohne
die Plugin-Laufzeit zu starten.

**Verwenden Sie es für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurationsoberfläche
- Authentifizierungs-, Onboarding- und Einrichtungsmetadaten (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Control-Plane-Oberflächen
- Kurzschreibungs-Zuständigkeit für Modellfamilien
- statische Momentaufnahmen der Capability-Zuständigkeit (`contracts`)
- QA-Runner-Metadaten, die der gemeinsame `openclaw qa`-Host prüfen kann
- channelspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

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

## Referenz der Felder der obersten Ebene

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                           |
| ------------------------------------ | ------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                                |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                            |
| `enabledByDefault`                   | Nein         | `true`                           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen beliebigen Nicht-`true`-Wert, damit das Plugin standardmäßig deaktiviert bleibt.                                            |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                             |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                      |
| `channels`                           | Nein         | `string[]`                       | Channel-IDs, die diesem Plugin gehören. Wird für Discovery und Konfigurationsvalidierung verwendet.                                                                                                                                  |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                            |
| `providerDiscoveryEntry`             | Nein         | `string`                         | Leichtgewichtiger Modulpfad für die Provider-Discovery, relativ zum Plugin-Stammverzeichnis, für manifestbezogene Provider-Katalogmetadaten, die ohne Aktivierung der vollständigen Plugin-Runtime geladen werden können.            |
| `modelSupport`                       | Nein         | `object`                         | Manifest-eigene Kurzform-Metadaten zur Modellfamilie, mit denen das Plugin vor der Runtime automatisch geladen wird.                                                                                                                |
| `modelCatalog`                       | Nein         | `object`                         | Deklarative Modellkatalog-Metadaten für Provider, die diesem Plugin gehören. Dies ist der Control-Plane-Vertrag für künftige schreibgeschützte Auflistung, Onboarding, Modellauswahl, Aliasse und Unterdrückung ohne Laden der Plugin-Runtime. |
| `modelPricing`                       | Nein         | `object`                         | Provider-eigene Richtlinie für externe Preisauskünfte. Verwenden Sie sie, um lokale/selbst gehostete Provider von Remote-Preiskatalogen auszunehmen oder Provider-Referenzen OpenRouter/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Core fest zu codieren. |
| `modelIdNormalization`               | Nein         | `object`                         | Provider-eigene Bereinigung von Modell-ID-Aliassen/-Präfixen, die vor dem Laden der Provider-Runtime ausgeführt werden muss.                                                                                                       |
| `providerEndpoints`                  | Nein         | `object[]`                       | Manifest-eigene Host-/baseUrl-Metadaten für Provider-Routen, die der Core klassifizieren muss, bevor die Provider-Runtime geladen wird.                                                                                             |
| `providerRequest`                    | Nein         | `object`                         | Günstige Provider-Familien- und Request-Kompatibilitätsmetadaten, die von der generischen Request-Richtlinie verwendet werden, bevor die Provider-Runtime geladen wird.                                                              |
| `cliBackends`                        | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen verwendet.                                                                             |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren Plugin-eigener synthetischer Authentifizierungs-Hook während der kalten Modell-Discovery geprüft werden soll, bevor die Runtime geladen wird.                                          |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalter-API-Schlüsselwerte, die einem gebündelten Plugin gehören und nicht geheime lokale, OAuth- oder umgebungsbezogene Anmeldeinformationen darstellen.                                                                        |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und pluginbewusste Konfigurations- und CLI-Diagnosen ausgeben sollen, bevor die Runtime geladen wird.                                                                                        |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Veraltete Kompatibilitäts-Umgebungsmetadaten für die Suche nach Provider-Authentifizierung/-Status. Bevorzugen Sie `setup.providers[].envVars` für neue Plugins; OpenClaw liest dies während des Veraltungsfensters weiterhin.       |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die eine andere Provider-ID für die Authentifizierungssuche wiederverwenden sollen, zum Beispiel ein Coding-Provider, der den API-Schlüssel und die Authentifizierungsprofile des Basis-Providers gemeinsam nutzt.      |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Günstige Channel-Umgebungsmetadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für umgebungsgesteuerte Channel-Einrichtung oder Authentifizierungsflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                       | Günstige Authentifizierungsauswahl-Metadaten für Onboarding-Auswahllisten, Auflösung bevorzugter Provider und einfache CLI-Flag-Verdrahtung.                                                                                        |
| `activation`                         | Nein         | `object`                         | Günstige Metadaten für den Aktivierungsplaner für Start-, Provider-, Befehls-, Channel-, Routen- und fähigkeitsgesteuertes Laden. Nur Metadaten; die tatsächliche Logik gehört weiterhin der Plugin-Runtime.                       |
| `setup`                              | Nein         | `object`                         | Günstige Setup-/Onboarding-Deskriptoren, die Discovery- und Setup-Flächen prüfen können, ohne die Plugin-Runtime zu laden.                                                                                                          |
| `qaRunners`                          | Nein         | `object[]`                       | Günstige QA-Runner-Deskriptoren, die vom gemeinsam genutzten `openclaw qa`-Host verwendet werden, bevor die Plugin-Runtime geladen wird.                                                                                            |
| `contracts`                          | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für externe Authentifizierungs-Hooks, Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medienverständnis, Bilderzeugung, Musikerzeugung, Videoerzeugung, Webabruf, Websuche und Tool-Eigentümerschaft. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Günstige Standardwerte für Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                     |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Manifest-eigene Channel-Konfigurationsmetadaten, die vor dem Laden der Runtime in Discovery- und Validierungsflächen zusammengeführt werden.                                                                                        |
| `skills`                             | Nein         | `string[]`                       | Skills-Verzeichnisse, die relativ zum Plugin-Stammverzeichnis geladen werden sollen.                                                                                                                                                 |
| `name`                               | Nein         | `string`                         | Für Menschen lesbarer Plugin-Name.                                                                                                                                                                                                 |
| `description`                        | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Flächen angezeigt wird.                                                                                                                                                                        |
| `version`                            | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                        |
| `uiHints`                            | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Vertraulichkeitshinweise für Konfigurationsfelder.                                                                                                                                               |

## providerAuthChoices-Referenz

Jeder `providerAuthChoices`-Eintrag beschreibt eine Onboarding- oder Authentifizierungsauswahl.
OpenClaw liest dies, bevor die Provider-Runtime geladen wird.
Provider-Setup-Listen verwenden diese Manifest-Auswahlmöglichkeiten, aus Deskriptoren abgeleitete Setup-Auswahlmöglichkeiten
und Installationskatalog-Metadaten, ohne die Provider-Runtime zu laden.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                                |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                                |
| `method`              | Ja           | `string`                                        | Authentifizierungsmethoden-ID, an die weitergeleitet werden soll.                                                        |
| `choiceId`            | Ja           | `string`                                        | Stabile Authentifizierungsauswahl-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                               |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Beschriftung. Wenn ausgelassen, greift OpenClaw auf `choiceId` zurück.                                   |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                                        |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                                |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistentenauswahlen aus, erlaubt aber weiterhin die manuelle CLI-Auswahl.                        |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Veraltete Auswahl-IDs, die Benutzer zu dieser Ersatzauswahl weiterleiten sollen.                                         |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren zusammengehöriger Auswahlen.                                                         |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Beschriftung für diese Gruppe.                                                                           |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                                         |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Authentifizierungsabläufe mit einem einzelnen Flag.                               |
| `cliFlag`             | Nein         | `string`                                        | CLI-Flag-Name, zum Beispiel `--openrouter-api-key`.                                                                      |
| `cliOption`           | Nein         | `string`                                        | Vollständige CLI-Optionsform, zum Beispiel `--openrouter-api-key <key>`.                                                 |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                                       |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | Onboarding-Oberflächen, in denen diese Auswahl erscheinen soll. Wenn ausgelassen, ist der Standard `["text-inference"]`. |

## `commandAliases`-Referenz

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeitbefehlsnamen besitzt, den Benutzer fälschlicherweise in `plugins.allow` eintragen oder als Root-CLI-Befehl ausführen könnten. OpenClaw verwendet diese Metadaten für Diagnosen, ohne Plugin-Laufzeitcode zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                                      |
| ------------ | ------------ | ----------------- | ---------------------------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                                       |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.                            |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## `activation`-Referenz

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Ereignisse der Steuerungsebene es in einen Aktivierungs-/Ladeplan aufnehmen sollen.

Dieser Block ist Planer-Metadaten, keine Lebenszyklus-API. Er registriert kein Laufzeitverhalten, ersetzt nicht `register(...)` und verspricht nicht, dass Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um Kandidaten-Plugins einzugrenzen, bevor er auf vorhandene Manifest-Besitzmetadaten wie `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks zurückfällt.

Bevorzugen Sie die engsten Metadaten, die Besitz bereits beschreiben. Verwenden Sie `providers`, `channels`, `commandAliases`, Setup-Deskriptoren oder `contracts`, wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planerhinweise, die nicht durch diese Besitzfelder dargestellt werden können.
Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Laufzeitaliasse wie `claude-cli`, `codex-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist nur für eingebettete Agent-Harness-IDs gedacht, die noch kein Besitzfeld haben.

Dieser Block enthält ausschließlich Metadaten. Er registriert kein Laufzeitverhalten und ersetzt nicht `register(...)`, `setupEntry` oder andere Laufzeit-/Plugin-Einstiegspunkte. Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor breiterem Plugin-Laden. Fehlende Aktivierungsmetadaten kosten daher normalerweise nur Leistung; sie sollten die Korrektheit nicht ändern, solange die alten Manifest-Besitz-Fallbacks noch existieren.

Jedes Plugin sollte `activation.onStartup` bewusst setzen, während OpenClaw sich von impliziten Startimporten entfernt. Setzen Sie es nur dann auf `true`, wenn das Plugin beim Gateway-Start ausgeführt werden muss. Setzen Sie es auf `false`, wenn das Plugin beim Start inaktiv ist und nur über engere Auslöser geladen werden soll. Wenn `onStartup` ausgelassen wird, bleibt der veraltete alte implizite Start-Sidecar-Fallback für Plugins ohne statische Fähigkeitsmetadaten erhalten; zukünftige Versionen laden diese Plugins beim Start möglicherweise nicht mehr, sofern sie nicht `activation.onStartup: true` deklarieren. Plugin-Status- und Kompatibilitätsberichte warnen mit `legacy-implicit-startup-sidecar`, wenn ein Plugin noch auf diesen Fallback angewiesen ist.

Setzen Sie für Migrationstests `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`, um nur diesen veralteten Fallback zu deaktivieren. Dieser Opt-in-Modus blockiert keine expliziten Plugins mit `activation.onStartup: true` und keine Plugins, die durch Kanal, Konfiguration, Agent-Harness, Speicher oder andere engere Aktivierungsauslöser geladen werden.

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

| Feld               | Erforderlich | Typ                                                  | Bedeutung                                                                                                                                                                                                                                           |
| ------------------ | ------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nein         | `boolean`                                            | Explizite Gateway-Startaktivierung. Jedes Plugin sollte dies setzen. `true` importiert das Plugin beim Start; `false` deaktiviert den veralteten impliziten Sidecar-Start-Fallback, sofern kein anderer passender Auslöser das Laden erfordert. |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                                                                       |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Eingebettete Agent-Harness-Laufzeit-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliasse.                                                                   |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                                                                       |
| `onChannels`       | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                                                                         |
| `onRoutes`         | Nein         | `string[]`                                           | Routenarten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                                                                       |
| `onConfigPaths`    | Nein         | `string[]`                                           | Root-relative Konfigurationspfade, die dieses Plugin in Start-/Ladepläne aufnehmen sollen, wenn der Pfad vorhanden und nicht explizit deaktiviert ist.                                                                                            |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Fähigkeitshinweise, die von der Aktivierungsplanung der Steuerungsebene verwendet werden. Bevorzugen Sie engere Felder, wenn möglich.                                                                                                      |

Aktuelle Live-Verbraucher:

- Die Gateway-Startplanung verwendet `activation.onStartup` für den expliziten Startimport und das Deaktivieren des veralteten impliziten Sidecar-Start-Fallbacks
- Die befehlsausgelöste CLI-Planung fällt auf das alte `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Die Startplanung der Agent-Laufzeit verwendet `activation.onAgentHarnesses` für eingebettete Harnesses und `cliBackends[]` auf oberster Ebene für CLI-Laufzeitaliasse
- Die kanalgetriggerte Setup-/Kanalplanung fällt auf den alten Besitz über `channels[]` zurück, wenn explizite Kanalaktivierungsmetadaten fehlen
- Die Start-Plugin-Planung verwendet `activation.onConfigPaths` für Nicht-Kanal-Root-Konfigurationsoberflächen wie den `browser`-Block des gebündelten Browser-Plugins
- Die providergetriggerte Setup-/Laufzeitplanung fällt auf den alten Besitz über `providers[]` und `cliBackends[]` auf oberster Ebene zurück, wenn explizite Provider-Aktivierungsmetadaten fehlen

Planerdiagnosen können explizite Aktivierungshinweise von Manifest-Besitz-Fallbacks unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass `activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der Planer stattdessen `commandAliases`-Besitz verwendet hat. Diese Begründungslabels sind für Host-Diagnosen und Tests gedacht; Plugin-Autoren sollten weiterhin die Metadaten deklarieren, die den Besitz am besten beschreiben.

## `qaRunners`-Referenz

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb des gemeinsamen `openclaw qa`-Roots beiträgt. Halten Sie diese Metadaten kostengünstig und statisch; die Plugin-Laufzeit besitzt weiterhin die tatsächliche CLI-Registrierung über eine leichtgewichtige `runtime-api.ts`-Oberfläche, die `qaRunnerCliRegistrations` exportiert.

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
| `commandName` | Ja           | `string` | Unterbefehl unterhalb von `openclaw qa`, zum Beispiel `matrix`.      |
| `description` | Nein         | `string` | Fallback-Hilfetext, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

## setup-Referenz

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen kostengünstige Plugin-eigene Metadaten benötigen, bevor Runtime geladen wird.

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

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-Backends. `setup.cliBackends` ist die setup-spezifische Descriptor-Oberfläche für Control-Plane-/Setup-Flows, die rein metadatenbasiert bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte Descriptor-first-Nachschlageoberfläche für die Setup-Erkennung. Wenn der Descriptor nur das Kandidaten-Plugin eingrenzt und Setup weiterhin umfangreichere Runtime-Hooks zur Setup-Zeit benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als Fallback-Ausführungspfad bei.

OpenClaw berücksichtigt außerdem `setup.providers[].envVars` in generischer Provider-Authentifizierung und in Env-Var-Nachschlagen. `providerAuthEnvVars` bleibt während des Deprecation-Fensters über einen Kompatibilitätsadapter unterstützt, aber nicht gebündelte Plugins, die es weiterhin verwenden, erhalten eine Manifest-Diagnose. Neue Plugins sollten Setup-/Status-Env-Metadaten in `setup.providers[].envVars` ablegen.

OpenClaw kann auch einfache Setup-Auswahlen aus `setup.providers[].authMethods` ableiten, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false` erklärt, dass keine Setup-Runtime erforderlich ist. Explizite `providerAuthChoices`-Einträge bleiben für benutzerdefinierte Labels, CLI-Flags, Onboarding-Umfang und Assistentenmetadaten bevorzugt.

Setzen Sie `requiresRuntime: false` nur, wenn diese Descriptoren für die Setup-Oberfläche ausreichen. OpenClaw behandelt explizites `false` als reinen Descriptor-Vertrag und führt `setup-api` oder `openclaw.setupEntry` für die Setup-Suche nicht aus. Wenn ein reines Descriptor-Plugin dennoch einen dieser Setup-Runtime-Einträge ausliefert, meldet OpenClaw eine additive Diagnose und ignoriert ihn weiterhin. Ein ausgelassenes `requiresRuntime` behält das alte Fallback-Verhalten bei, damit vorhandene Plugins, die Descriptoren ohne das Flag hinzugefügt haben, nicht brechen.

Da die Setup-Suche Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte Werte von `setup.providers[].id` und `setup.cliBackends[]` über alle erkannten Plugins hinweg eindeutig bleiben. Mehrdeutige Eigentümerschaft schlägt geschlossen fehl, statt anhand der Erkennungsreihenfolge einen Gewinner auszuwählen.

Wenn Setup-Runtime ausgeführt wird, melden Setup-Registry-Diagnosen Descriptor-Abweichungen, wenn `setup-api` einen Provider oder ein CLI-Backend registriert, den bzw. das die Manifest-Descriptoren nicht deklarieren, oder wenn ein Descriptor keine passende Runtime-Registrierung hat. Diese Diagnosen sind additiv und lehnen Legacy-Plugins nicht ab.

### setup.providers-Referenz

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                         |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding verfügbar gemacht wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods`  | Nein         | `string[]` | Setup-/Authentifizierungsmethoden-IDs, die dieser Provider unterstützt, ohne die vollständige Runtime zu laden. |
| `envVars`      | Nein         | `string[]` | Env vars, die generische Setup-/Status-Oberflächen prüfen können, bevor Plugin-Runtime geladen wird. |
| `authEvidence` | Nein         | `object[]` | Kostengünstige lokale Authentifizierungsnachweise für Provider, die sich über nicht geheime Marker authentifizieren können. |

`authEvidence` ist für Provider-eigene lokale Anmeldedaten-Marker vorgesehen, die ohne Laden von Runtime-Code verifiziert werden können. Diese Prüfungen müssen kostengünstig und lokal bleiben: keine Netzwerkaufrufe, keine Keychain- oder Secret-Manager-Lesezugriffe, keine Shell-Befehle und keine Provider-API-Probes.

Unterstützte Nachweiseinträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                         |
| ------------------ | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                                    |
| `fileEnvVar`       | Nein         | `string`   | Env var, die einen expliziten Pfad zu einer Anmeldedaten-Datei enthält.                                           |
| `fallbackPaths`    | Nein         | `string[]` | Lokale Pfade zu Anmeldedaten-Dateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine aufgeführte Env var muss nicht leer sein, bevor der Nachweis gültig ist.                          |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Env var muss nicht leer sein, bevor der Nachweis gültig ist.                                     |
| `credentialMarker` | Ja           | `string`   | Nicht geheimer Marker, der zurückgegeben wird, wenn der Nachweis vorhanden ist.                                   |
| `source`           | Nein         | `string`   | Benutzerseitiges Quellenlabel für Auth-/Statusausgabe.                                                           |

### setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                         |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Descriptoren, die während Setup und Onboarding verfügbar gemacht werden.            |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für Descriptor-first-Setup-Suche verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Config-Migrationen, die zur Setup-Oberfläche dieses Plugins gehören.                       |
| `requiresRuntime`  | Nein         | `boolean`  | Ob Setup nach der Descriptor-Suche weiterhin `setup-api`-Ausführung benötigt.                      |

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
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.               |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder vertraulich. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.          |

## contracts-Referenz

Verwenden Sie `contracts` nur für statische Metadaten zur Capability-Eigentümerschaft, die OpenClaw lesen kann, ohne die Plugin-Runtime zu importieren.

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

| Feld                             | Typ        | Bedeutung                                                             |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Factory-IDs für Codex-App-Server-Extensions, derzeit `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-IDs, für die ein gebündeltes Plugin Tool-Result-Middleware registrieren darf. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Auth-Profile dieses Plugin besitzt. |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die dieses Plugin besitzt.                       |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-Transcription-Provider-IDs, die dieses Plugin besitzt.        |
| `realtimeVoiceProviders`         | `string[]` | Realtime-Voice-Provider-IDs, die dieses Plugin besitzt.                |
| `memoryEmbeddingProviders`       | `string[]` | Memory-Embedding-Provider-IDs, die dieses Plugin besitzt.              |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Provider-IDs, die dieses Plugin besitzt.           |
| `imageGenerationProviders`       | `string[]` | Image-Generation-Provider-IDs, die dieses Plugin besitzt.              |
| `videoGenerationProviders`       | `string[]` | Video-Generation-Provider-IDs, die dieses Plugin besitzt.              |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die dieses Plugin besitzt.                     |
| `webSearchProviders`             | `string[]` | Web-Search-Provider-IDs, die dieses Plugin besitzt.                    |
| `migrationProviders`             | `string[]` | Import-Provider-IDs, die dieses Plugin für `openclaw migrate` besitzt. |
| `tools`                          | `string[]` | Agent-Tool-Namen, die dieses Plugin für gebündelte Vertragsprüfungen besitzt. |

`contracts.embeddedExtensionFactories` bleibt für gebündelte Codex-App-Server-only-Extension-Factories erhalten. Gebündelte Tool-Result-Transformationen sollten stattdessen `contracts.agentToolResultMiddleware` deklarieren und sich mit `api.registerAgentToolResultMiddleware(...)` registrieren. Externe Plugins können keine Tool-Result-Middleware registrieren, weil diese Schnittstelle hochvertrauenswürdige Tool-Ausgaben umschreiben kann, bevor das Modell sie sieht.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten `contracts.externalAuthProviders` deklarieren. Plugins ohne die Deklaration laufen weiterhin über einen veralteten Kompatibilitäts-Fallback, aber dieser Fallback ist langsamer und wird nach dem Migrationsfenster entfernt.

Gebündelte Memory-Embedding-Provider sollten `contracts.memoryEmbeddingProviders` für jede Adapter-ID deklarieren, die sie bereitstellen, einschließlich integrierter Adapter wie `local`. Eigenständige CLI-Pfade verwenden diesen Manifest-Vertrag, um nur das besitzende Plugin zu laden, bevor die vollständige Gateway-Runtime Provider registriert hat.

## mediaUnderstandingProviderMetadata-Referenz

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Medienverständnis-Provider Standardmodelle, eine Fallback-Priorität für automatische Authentifizierung oder native Dokumentunterstützung hat, die generische Core-Hilfsfunktionen benötigen, bevor die Runtime geladen wird. Schlüssel müssen außerdem in `contracts.mediaUnderstandingProviders` deklariert werden.

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

| Feld                   | Typ                                 | Bedeutung                                                                                   |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medienfunktionen, die von diesem Provider bereitgestellt werden.                            |
| `defaultModels`        | `Record<string, string>`            | Standardwerte für die Zuordnung von Funktion zu Modell, wenn die Konfiguration kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden beim automatischen, anmeldeinformationsbasierten Provider-Fallback früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.                               |

## `channelConfigs`-Referenz

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin günstige Konfigurationsmetadaten benötigt, bevor die Runtime geladen wird. Die schreibgeschützte Erkennung von Kanal-Setup und -Status kann diese Metadaten direkt für konfigurierte externe Kanäle verwenden, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false` deklariert, dass keine Setup-Runtime erforderlich ist.

`channelConfigs` sind Plugin-Manifestmetadaten, kein neuer Top-Level-Abschnitt der Benutzerkonfiguration. Benutzer konfigurieren Kanalinstanzen weiterhin unter `channels.<channel-id>`. OpenClaw liest Manifestmetadaten, um zu entscheiden, welches Plugin diesen konfigurierten Kanal besitzt, bevor Plugin-Runtime-Code ausgeführt wird.

Für ein Kanal-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten auch passende `channelConfigs`-Einträge deklarieren. Ohne diese kann OpenClaw das Plugin weiterhin laden, aber Cold-Path-Konfigurationsschema, Setup und Control-UI-Oberflächen können die kanalbezogene Optionsstruktur erst kennen, wenn die Plugin-Runtime ausgeführt wird.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und `nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Befehlskonfigurationsprüfungen deklarieren, die ausgeführt werden, bevor die Kanal-Runtime geladen wird. Gebündelte Kanäle können dieselben Standardwerte auch über `package.json#openclaw.channel.commands` zusammen mit ihren übrigen paketbezogenen Kanalkatalogmetadaten veröffentlichen.

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

| Feld          | Typ                      | Bedeutung                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanalkonfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen, Platzhalter und Hinweise auf vertrauliche Werte für diesen Kanalkonfigurationsabschnitt. |
| `label`       | `string`                 | Kanalbeschriftung, die in Auswahl- und Inspektionsoberflächen übernommen wird, wenn Runtime-Metadaten noch nicht bereitstehen. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                           |
| `commands`    | `object`                 | Statische automatische Standardwerte für native Befehle und native Skills für Konfigurationsprüfungen vor der Runtime. |
| `preferOver`  | `string[]`               | Alte oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

### Ein anderes Kanal-Plugin ersetzen

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Besitzer für eine Kanal-ID ist, die auch ein anderes Plugin bereitstellen kann. Häufige Fälle sind eine umbenannte Plugin-ID, ein eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der dieselbe Kanal-ID aus Gründen der Konfigurationskompatibilität beibehält.

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

Wenn `channels.chat` konfiguriert ist, berücksichtigt OpenClaw sowohl die Kanal-ID als auch die bevorzugte Plugin-ID. Wenn das niedriger priorisierte Plugin nur ausgewählt wurde, weil es gebündelt oder standardmäßig aktiviert ist, deaktiviert OpenClaw es in der effektiven Runtime-Konfiguration, sodass ein Plugin den Kanal und seine Tools besitzt. Eine explizite Benutzerauswahl hat weiterhin Vorrang: Wenn der Benutzer beide Plugins explizit aktiviert, bewahrt OpenClaw diese Auswahl und meldet stattdessen Diagnosen zu doppelten Kanälen oder Tools, statt den angeforderten Plugin-Satz stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die wirklich denselben Kanal bereitstellen können. Es ist kein allgemeines Prioritätsfeld und benennt keine Benutzerkonfigurationsschlüssel um.

## `modelSupport`-Referenz

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus Kurzform-Modell-IDs wie `gpt-5.5` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Runtime geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet diese Vorrangregeln an:

- explizite `provider/model`-Referenzen verwenden die besitzenden `providers`-Manifestmetadaten
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                             |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden.           |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernung des Profil-Suffixes gegen Kurzform-Modell-IDs abgeglichen werden. |

## `modelCatalog`-Referenz

Verwenden Sie `modelCatalog`, wenn OpenClaw Provider-Modellmetadaten kennen soll, bevor die Plugin-Runtime geladen wird. Dies ist die vom Manifest besessene Quelle für feste Katalogzeilen, Provider-Aliasse, Unterdrückungsregeln und Discovery-Modus. Runtime-Aktualisierung gehört weiterhin in Provider-Runtime-Code, aber das Manifest teilt dem Core mit, wann Runtime erforderlich ist.

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

Top-Level-Felder:

| Feld           | Typ                                                      | Bedeutung                                                                                                  |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Schlüssel sollten auch in den Top-Level-`providers` erscheinen. |
| `aliases`      | `Record<string, object>`                                 | Provider-Aliasse, die für die Katalog- oder Unterdrückungsplanung zu einem besessenen Provider aufgelöst werden sollen. |
| `suppressions` | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus einem providerspezifischen Grund unterdrückt.  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Ob der Provider-Katalog aus Manifestmetadaten gelesen, in den Cache aktualisiert werden kann oder Runtime erfordert. |

`aliases` beteiligt sich an der Provider-Besitzerermittlung für die Modellkatalogplanung. Alias-Ziele müssen Top-Level-Provider sein, die demselben Plugin gehören. Wenn eine nach Provider gefilterte Liste einen Alias verwendet, kann OpenClaw das besitzende Manifest lesen und Alias-API-/Basis-URL-Überschreibungen anwenden, ohne die Provider-Runtime zu laden.
Aliasse erweitern ungefilterte Kataloglisten nicht; breite Listen geben nur die kanonischen Provider-Zeilen des Besitzers aus.

`suppressions` ersetzt den alten Provider-Runtime-Hook `suppressBuiltInModel`. Unterdrückungseinträge werden nur berücksichtigt, wenn der Provider dem Plugin gehört oder als `modelCatalog.aliases`-Schlüssel deklariert ist, der auf einen besessenen Provider verweist. Runtime-Unterdrückungs-Hooks werden bei der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld      | Typ                      | Bedeutung                                                                  |
| --------- | ------------------------ | -------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionale Standard-Basis-URL für Modelle in diesem Provider-Katalog.       |
| `api`     | `ModelApi`               | Optionaler Standard-API-Adapter für Modelle in diesem Provider-Katalog.    |
| `headers` | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.        |
| `models`  | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.             |

Modellfelder:

| Feld            | Typ                                                            | Bedeutung                                                                              |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                                 |
| `name`          | `string`                                                       | Optionaler Anzeigename.                                                                |
| `api`           | `ModelApi`                                                     | Optionale API-Überschreibung pro Modell.                                               |
| `baseUrl`       | `string`                                                       | Optionale Basis-URL-Überschreibung pro Modell.                                         |
| `headers`       | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                                 |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitäten, die das Modell akzeptiert.                                                |
| `reasoning`     | `boolean`                                                      | Ob das Modell Reasoning-Verhalten bereitstellt.                                        |
| `contextWindow` | `number`                                                       | Natives Kontextfenster des Providers.                                                  |
| `contextTokens` | `number`                                                       | Optionale effektive Laufzeit-Kontextgrenze, wenn sie von `contextWindow` abweicht.     |
| `maxTokens`     | `number`                                                       | Maximale Ausgabe-Token, sofern bekannt.                                                |
| `cost`          | `object`                                                       | Optionale USD-Preise pro Million Token, einschließlich optionalem `tieredPricing`.     |
| `compat`        | `object`                                                       | Optionale Kompatibilitäts-Flags passend zur OpenClaw-Modellkonfigurationskompatibilität. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listungsstatus. Nur unterdrücken, wenn die Zeile gar nicht erscheinen darf.            |
| `statusReason`  | `string`                                                       | Optionaler Grund, der bei nicht verfügbarem Status angezeigt wird.                     |
| `replaces`      | `string[]`                                                     | Ältere Provider-lokale Modell-IDs, die dieses Modell ersetzt.                          |
| `replacedBy`    | `string`                                                       | Ersatz-Provider-lokale Modell-ID für veraltete Zeilen.                                 |
| `tags`          | `string[]`                                                     | Stabile Tags, die von Auswahlen und Filtern verwendet werden.                          |

Unterdrückungsfelder:

| Feld                       | Typ        | Bedeutung                                                                                                      |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-ID für die zu unterdrückende Upstream-Zeile. Muss diesem Plugin gehören oder als eigener Alias deklariert sein. |
| `model`                    | `string`   | Zu unterdrückende Provider-lokale Modell-ID.                                                                   |
| `reason`                   | `string`   | Optionale Nachricht, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.                  |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste effektiver Provider-Basis-URL-Hosts, die erforderlich sind, bevor die Unterdrückung gilt.      |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter Provider-Konfigurationswerte für `api`, die erforderlich sind, bevor die Unterdrückung gilt. |

Legen Sie keine rein laufzeitbezogenen Daten in `modelCatalog` ab. Verwenden Sie `static` nur, wenn Manifestzeilen vollständig genug sind, damit nach Provider gefilterte Listen- und Auswahloberflächen die Registry-/Runtime-Erkennung überspringen können. Verwenden Sie `refreshable`, wenn Manifestzeilen als auflistbare Startwerte oder Ergänzungen nützlich sind, aber eine Aktualisierung/ein Cache später weitere Zeilen hinzufügen kann; aktualisierbare Zeilen sind für sich genommen nicht autoritativ. Verwenden Sie `runtime`, wenn OpenClaw die Provider-Runtime laden muss, um die Liste zu kennen.

## Referenz zu modelIdNormalization

Verwenden Sie `modelIdNormalization` für einfache, Provider-eigene Modell-ID-Bereinigung, die vor dem Laden der Provider-Runtime erfolgen muss. Dadurch bleiben Aliasse wie kurze Modellnamen, Provider-lokale Legacy-IDs und Proxy-Präfixregeln im Manifest des zuständigen Plugins statt in zentralen Modell-Auswahltabellen.

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

| Feld                                 | Typ                     | Bedeutung                                                                               |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exakte Modell-ID-Aliasse ohne Beachtung der Groß-/Kleinschreibung. Werte werden wie geschrieben zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Vor der Alias-Suche zu entfernende Präfixe, nützlich bei Legacy-Duplizierung von Provider/Modell. |
| `prefixWhenBare`                     | `string`                | Präfix, das hinzugefügt wird, wenn die normalisierte Modell-ID noch kein `/` enthält.    |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für nackte IDs nach der Alias-Suche, indiziert nach `modelPrefix` und `prefix`. |

## Referenz zu providerEndpoints

Verwenden Sie `providerEndpoints` für die Endpunktklassifizierung, die generische Request-Policy kennen muss, bevor die Provider-Runtime geladen wird. Core besitzt weiterhin die Bedeutung jeder `endpointClass`; Plugin-Manifeste besitzen die Host- und Basis-URL-Metadaten.

Endpunktfelder:

| Feld                           | Typ        | Bedeutung                                                                                 |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekannte Core-Endpunktklasse, zum Beispiel `openrouter`, `moonshot-native` oder `google-vertex`. |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpunktklasse zugeordnet werden.                               |
| `hostSuffixes`                 | `string[]` | Host-Suffixe, die der Endpunktklasse zugeordnet werden. Mit `.` voranstellen, um nur Domain-Suffixe abzugleichen. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpunktklasse zugeordnet werden.        |
| `googleVertexRegion`           | `string`   | Statische Google-Vertex-Region für exakte globale Hosts.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Suffix, das von passenden Hosts entfernt wird, um das Google-Vertex-Regionspräfix offenzulegen. |

## Referenz zu providerRequest

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

| Feld                  | Typ          | Bedeutung                                                                            |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`              | `string`     | Provider-Familienlabel für generische Request-Kompatibilitätsentscheidungen und Diagnosen. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Provider-Familien-Kompatibilitätsbereich für gemeinsame Request-Hilfsfunktionen. |
| `openAICompletions`   | `object`     | OpenAI-kompatible Completions-Request-Flags, derzeit `supportsStreamingUsage`.       |

## Referenz zu modelPricing

Verwenden Sie `modelPricing`, wenn ein Provider Control-Plane-Preisverhalten benötigt, bevor die Runtime geladen wird. Der Gateway-Preis-Cache liest diese Metadaten, ohne Provider-Runtime-Code zu importieren.

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

| Feld         | Typ               | Bedeutung                                                                                      |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Auf `false` setzen für lokale/selbst gehostete Provider, die niemals OpenRouter- oder LiteLLM-Preise abrufen sollen. |
| `openRouter` | `false \| object` | OpenRouter-Preisabfragezuordnung. `false` deaktiviert die OpenRouter-Abfrage für diesen Provider. |
| `liteLLM`    | `false \| object` | LiteLLM-Preisabfragezuordnung. `false` deaktiviert die LiteLLM-Abfrage für diesen Provider.       |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                      |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe Katalog-Provider-ID, wenn sie von der OpenClaw-Provider-ID abweicht, zum Beispiel `z-ai` für einen `zai`-Provider. |
| `passthroughProviderModel` | `boolean`          | Modell-IDs mit Schrägstrich als verschachtelte Provider/Modell-Referenzen behandeln, nützlich für Proxy-Provider wie OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche externe Katalogvarianten der Modell-ID. `version-dots` versucht gepunktete Versions-IDs wie `claude-opus-4.6`. |

### OpenClaw Provider Index

Der OpenClaw Provider Index ist OpenClaw-eigene Vorschaumetadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist nicht Teil eines Plugin-Manifests. Plugin-Manifeste bleiben die Autorität für installierte Plugins. Der Provider Index ist der interne Fallback-Vertrag, den zukünftige Oberflächen für installierbare Provider und Modell-Auswahlen vor der Installation verwenden werden, wenn ein Provider-Plugin nicht installiert ist.

Reihenfolge der Katalogautorität:

1. Benutzerkonfiguration.
2. Manifest `modelCatalog` des installierten Plugins.
3. Modellkatalog-Cache aus expliziter Aktualisierung.
4. Vorschauzeilen des OpenClaw Provider Index.

Der Provider Index darf keine Secrets, aktivierten Zustände, Runtime-Hooks oder
Live-kontospezifische Modelldaten enthalten. Seine Vorschaukataloge verwenden dieselbe
`modelCatalog`-Provider-Zeilenform wie Plugin-Manifeste, sollten aber auf
stabile Anzeige-Metadaten beschränkt bleiben, es sei denn, Runtime-Adapter-Felder wie `api`,
`baseUrl`, Preise oder Kompatibilitäts-Flags werden absichtlich mit
dem installierten Plugin-Manifest abgeglichen. Provider mit Live-`/models`-Erkennung sollten
aktualisierte Zeilen über den expliziten Model Catalog-Cache-Pfad schreiben, statt
bei normalen Auflistungs- oder Onboarding-Aufrufen Provider-APIs aufzurufen.

Provider Index-Einträge können auch installierbare Plugin-Metadaten für Provider
enthalten, deren Plugin aus dem Core verschoben wurde oder anderweitig noch nicht installiert ist. Diese
Metadaten spiegeln das Channel-Katalogmuster wider: Paketname, npm-Installationsspezifikation,
erwartete Integrität und einfache Auth-Auswahlbezeichnungen reichen aus, um eine
installierbare Setup-Option anzuzeigen. Sobald das Plugin installiert ist, gewinnt sein Manifest und
der Provider Index-Eintrag wird für diesen Provider ignoriert.

Alte Capability-Schlüssel auf oberster Ebene sind veraltet. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu
verschieben; normales Manifest-Laden behandelt diese Felder auf oberster Ebene
nicht mehr als Capability-Ownership.

## Manifest im Vergleich zu package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Dafür verwenden                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Erkennung, Config-Validierung, Auth-Auswahl-Metadaten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Abhängigkeitsinstallation und der `openclaw`-Block, der für Einstiegspunkte, Installationsfreigabe, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatenstück gehört, verwenden Sie diese Regel:

- Wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, legen Sie es in `openclaw.plugin.json` ab
- Wenn es um Packaging, Einstiegsdateien oder npm-Installationsverhalten geht, legen Sie es in `package.json` ab

### package.json-Felder, die die Erkennung beeinflussen

Einige Pre-Runtime-Plugin-Metadaten liegen absichtlich in `package.json` unter dem
`openclaw`-Block statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                     |
| `openclaw.runtimeExtensions`                                      | Deklariert gebaute JavaScript-Runtime-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                |
| `openclaw.setupEntry`                                             | Leichtgewichtiger reiner Setup-Einstiegspunkt, der während Onboarding, verzögertem Channel-Start und schreibgeschützter Channel-Status-/SecretRef-Erkennung verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                      | Deklariert den gebauten JavaScript-Setup-Einstiegspunkt für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                              |
| `openclaw.channel`                                                | Einfache Channel-Katalogmetadaten wie Bezeichnungen, Docs-Pfade, Aliasse und Auswahltext.                                                                                            |
| `openclaw.channel.commands`                                       | Statische native Befehls- und native Skill-Auto-Default-Metadaten, die von Config-, Audit- und Befehlslisten-Oberflächen verwendet werden, bevor die Channel-Runtime geladen wird.   |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für Configured-State-Prüfer, die „existiert ein reines Env-Setup bereits?“ beantworten können, ohne die vollständige Channel-Runtime zu laden.            |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für Persisted-Auth-Prüfer, die „ist bereits etwas angemeldet?“ beantworten können, ohne die vollständige Channel-Runtime zu laden.                        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installations-/Aktualisierungshinweise für gebündelte und extern veröffentlichte Plugins.                                                                                            |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                     |
| `openclaw.install.minHostVersion`                                 | Minimal unterstützte OpenClaw-Hostversion, mit einer semver-Untergrenze wie `>=2026.3.22`.                                                                                          |
| `openclaw.install.expectedIntegrity`                              | Erwarteter npm-Dist-Integritätsstring wie `sha512-...`; Installations- und Aktualisierungsabläufe prüfen das abgerufene Artefakt dagegen.                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen engen Recovery-Pfad zur Neuinstallation gebündelter Plugins, wenn die Config ungültig ist.                                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Ermöglicht das Laden reiner Setup-Channel-Oberflächen vor dem vollständigen Channel-Plugin während des Starts.                                                                       |

Manifest-Metadaten entscheiden, welche Provider-/Channel-/Setup-Auswahlmöglichkeiten im
Onboarding erscheinen, bevor Runtimes geladen werden. `package.json#openclaw.install` teilt dem
Onboarding mit, wie dieses Plugin abgerufen oder aktiviert wird, wenn der Benutzer eine dieser
Auswahlmöglichkeiten wählt. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während Installation und Manifest-
Registry-Laden durchgesetzt. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

Exakte npm-Versions-Pins stehen bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalog-
Einträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Aktualisierungsabläufe
geschlossen fehlschlagen, wenn das abgerufene npm-Artefakt nicht mehr der gepinnten Veröffentlichung entspricht.
Interaktives Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige Registry-npm-Spezifikationen an,
einschließlich bloßer Paketnamen und Dist-Tags. Katalogdiagnosen können
exakte, flexible, integritätsgepinnte, fehlende-Integrität-, Paketnamen-
Mismatch- und ungültige Default-Choice-Quellen unterscheiden. Sie warnen außerdem, wenn
`expectedIntegrity` vorhanden ist, es aber keine gültige npm-Quelle gibt, die damit gepinnt werden kann.
Wenn `expectedIntegrity` vorhanden ist,
erzwingen Installations-/Aktualisierungsabläufe sie; wenn sie fehlt, wird die Registry-Auflösung
ohne Integritätspin aufgezeichnet.

Channel-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Channel-Liste
oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige
Runtime zu laden. Der Setup-Eintrag sollte Channel-Metadaten sowie setup-sichere Config-,
Status- und Secrets-Adapter bereitstellen; Netzwerk-Clients, Gateway-Listener und
Transport-Runtimes gehören in den Haupteinstiegspunkt der Erweiterung.

Runtime-Einstiegspunktfelder überschreiben keine Paketgrenzenprüfungen für Quell-
Einstiegspunktfelder. Beispielsweise kann `openclaw.runtimeExtensions` keinen
ausbrechenden `openclaw.extensions`-Pfad ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es macht
keine beliebig defekten Configs installierbar. Heute erlaubt es Installationsabläufen nur,
sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa einem
fehlenden gebündelten Plugin-Pfad oder einem veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Config-Fehler blockieren weiterhin die Installation und verweisen Operatoren
auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paket-Metadaten für ein winziges Prüfer-
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

Verwenden Sie dies, wenn Setup-, Doctor-, Status- oder schreibgeschützte Presence-Abläufe eine einfache
Ja/Nein-Auth-Prüfung benötigen, bevor das vollständige Channel-Plugin geladen wird. Persisted Auth State ist
kein konfigurierter Channel-State: Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren,
Runtime-Abhängigkeiten zu reparieren oder zu entscheiden, ob eine Channel-Runtime geladen werden soll.
Der Zieleexport sollte eine kleine Funktion sein, die nur persistierten Zustand liest; leiten Sie
ihn nicht durch das vollständige Channel-Runtime-Barrel.

`openclaw.channel.configuredState` folgt derselben Form für einfache reine Env-
Configured-Prüfungen:

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

Verwenden Sie dies, wenn ein Channel den Configured-State aus Env oder anderen kleinen
Nicht-Runtime-Eingaben beantworten kann. Wenn die Prüfung vollständige Config-Auflösung oder die echte
Channel-Runtime benötigt, belassen Sie diese Logik stattdessen im Plugin-`config.hasConfiguredState`-
Hook.

## Erkennungspriorität (doppelte Plugin-IDs)

OpenClaw erkennt Plugins aus mehreren Wurzeln (gebündelt, globale Installation, Workspace, explizit über Config ausgewählte Pfade). Wenn zwei Erkennungen dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** behalten; Duplikate mit niedrigerer Priorität werden verworfen, statt daneben geladen zu werden.

Priorität, von höchster zu niedrigster:

1. **Config-ausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` gepinnt ist
2. **Gebündelt** — mit OpenClaw ausgelieferte Plugins
3. **Globale Installation** — Plugins, die in der globalen OpenClaw-Plugin-Wurzel installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace erkannt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich mit einem lokalen zu überschreiben, pinnen Sie es über `plugins.entries.<id>`, damit es aufgrund der Priorität gewinnt, statt sich auf Workspace-Erkennung zu verlassen.
- Verworfene Duplikate werden protokolliert, damit Doctor- und Startdiagnosen auf die verworfene Kopie verweisen können.

## JSON Schema-Anforderungen

- **Jedes Plugin muss ein JSON Schema ausliefern**, auch wenn es keine Config akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Config validiert, nicht zur Runtime.

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, sofern die Channel-ID nicht durch
  ein Plugin-Manifest deklariert ist.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **auffindbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration vorhanden ist, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  in Doctor + Logs wird eine **Warnung** ausgegeben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration) für das vollständige `plugins.*`-Schema.

## Hinweise

- Das Manifest ist für **native OpenClaw-Plugins** **erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge. Runtime lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der Auffindbarkeit + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher werden Kommentare, nachgestellte Kommas und Schlüssel ohne Anführungszeichen akzeptiert, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie benutzerdefinierte Schlüssel auf oberster Ebene.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerDiscoveryEntry` muss leichtgewichtig bleiben und sollte keinen umfangreichen Runtime-Code importieren; verwenden Sie es für statische Provider-Katalogmetadaten oder enge Discovery-Deskriptoren, nicht für Ausführung zur Anfragezeit.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. Runtime-Entry `OpenClawPluginDefinition.kind` ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins erhalten.
- Env-Var-Metadaten (`setup.providers[].envVars`, das veraltete `providerAuthEnvVars` und `channelEnvVars`) sind nur deklarativ. Status, Audit, Cron-Auslieferungsvalidierung und andere schreibgeschützte Oberflächen wenden weiterhin die Plugin-Vertrauens- und effektive Aktivierungsrichtlinie an, bevor sie eine Env-Var als konfiguriert behandeln.
- Runtime-Assistent-Metadaten, die Provider-Code erfordern, finden Sie unter [Provider-Runtime-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Allowlist-Anforderungen des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Verwandt

<CardGroup cols={3}>
  <Card title="Building plugins" href="/de/plugins/building-plugins" icon="rocket">
    Erste Schritte mit Plugins.
  </Card>
  <Card title="Plugin architecture" href="/de/plugins/architecture" icon="diagram-project">
    Interne Architektur und Capability-Modell.
  </Card>
  <Card title="SDK overview" href="/de/plugins/sdk-overview" icon="book">
    Plugin-SDK-Referenz und Subpath-Importe.
  </Card>
</CardGroup>
