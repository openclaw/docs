---
read_when:
    - Sie erstellen ein OpenClaw Plugin
    - Sie müssen ein Plugin-Konfigurationsschema bereitstellen oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-26T11:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

Diese Seite gilt nur für das **native OpenClaw Plugin-Manifest**.

Informationen zu kompatiblen Bundle-Layouts finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das Standard-Layout für Claude-Komponenten ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht anhand des hier beschriebenen Schemas `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte Skill-Roots, Claude-Befehls-Roots, Standardwerte aus `settings.json` für Claude-Bundles, LSP-Standardwerte für Claude-Bundles und unterstützte Hook-Pakete, wenn das Layout den Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw Plugin **muss** eine Datei `openclaw.plugin.json` im **Plugin-Root** bereitstellen. OpenClaw verwendet dieses Manifest, um die Konfiguration zu validieren, **ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und den aktuellen Hinweisen zur externen Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, **bevor Ihr Plugin-Code geladen wird**. Alles unten muss so leichtgewichtig sein, dass es geprüft werden kann, ohne die Plugin-Laufzeit zu starten.

**Verwenden Sie sie für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurationsoberfläche
- Authentifizierungs-, Onboarding- und Setup-Metadaten (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Control-Plane-Oberflächen
- Kurzzuordnung für Model-Familien
- statische Snapshots zur Fähigkeitszuordnung (`contracts`)
- QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie sie nicht für:** das Registrieren von Laufzeitverhalten, das Deklarieren von Code-Einstiegspunkten oder npm-Installationsmetadaten. Diese gehören in Ihren Plugin-Code und in `package.json`.

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
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
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

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                         |
| ------------------------------------ | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                             |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                          |
| `enabledByDefault`                   | Nein         | `true`                           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie das Feld weg oder setzen Sie einen anderen Wert als `true`, damit das Plugin standardmäßig deaktiviert bleibt.                                      |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                          |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                   |
| `channels`                           | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Werden für Discovery und Konfigurationsvalidierung verwendet.                                                                                                                               |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                           |
| `providerDiscoveryEntry`             | Nein         | `string`                         | Leichtgewichtiger Modulpfad für Provider-Discovery relativ zum Plugin-Root für manifestgebundene Metadaten des Provider-Katalogs, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.               |
| `modelSupport`                       | Nein         | `object`                         | Manifestgebundene Kurzmetadaten zu Model-Familien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                                                    |
| `modelCatalog`                       | Nein         | `object`                         | Deklarative Metadaten des Modellkatalogs für Provider, die diesem Plugin gehören. Dies ist der Control-Plane-Vertrag für künftige schreibgeschützte Auflistung, Onboarding, Model-Picker, Aliasse und Unterdrückung ohne Laden der Plugin-Laufzeit. |
| `providerEndpoints`                  | Nein         | `object[]`                       | Manifestgebundene Metadaten zu Endpunkt-Hosts bzw. `baseUrl` für Provider-Routen, die der Kern klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                    |
| `cliBackends`                        | Nein         | `string[]`                       | IDs von CLI-Inferenz-Backends, die diesem Plugin gehören. Werden für die automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen verwendet.                                                                   |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren plugin-eigener synthetischer Authentifizierungs-Hook während der kalten Modell-Discovery geprüft werden soll, bevor die Laufzeit geladen wird.                                      |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalterwerte für API-Schlüssel, die einem gebündelten Plugin gehören und einen nicht geheimen lokalen Zustand, OAuth oder vorhandene Anmeldedaten repräsentieren.                                                             |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit Plugin-bewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                                        |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Veraltete Kompatibilitätsmetadaten für Umgebungsvariablen zum Lookup von Provider-Authentifizierung/-Status. Verwenden Sie für neue Plugins bevorzugt `setup.providers[].envVars`; OpenClaw liest dies während des Deprecation-Fensters weiterhin. |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die für das Authentifizierungs-Lookup eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Authentifizierungsprofile wie der Basis-Provider verwendet. |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Leichtgewichtige Kanal-Metadaten zu Umgebungsvariablen, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für umgebungsvariablengesteuertes Kanal-Setup oder Authentifizierungsoberflächen, die generische Start-/Konfigurationshilfen sehen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                       | Leichtgewichtige Metadaten zu Authentifizierungsoptionen für Onboarding-Picker, Auflösung des bevorzugten Providers und einfache CLI-Flag-Verdrahtung.                                                                            |
| `activation`                         | Nein         | `object`                         | Leichtgewichtige Metadaten des Aktivierungsplaners für provider-, befehls-, kanal-, routen- und fähigkeitsausgelöstes Laden. Nur Metadaten; die tatsächliche Funktionalität bleibt Eigentum der Plugin-Laufzeit.               |
| `setup`                              | Nein         | `object`                         | Leichtgewichtige Setup-/Onboarding-Beschreibungen, die Discovery- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                        |
| `qaRunners`                          | Nein         | `object[]`                       | Leichtgewichtige Beschreibungen von QA-Runnern, die vom gemeinsamen Host `openclaw qa` verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                  |
| `contracts`                          | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeitszuordnungen für externe Authentifizierungs-Hooks, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Abruf, Web-Suche und Tool-Zuordnung. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Leichtgewichtige Standardwerte für Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                            |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Manifestgebundene Metadaten zur Kanalkonfiguration, die vor dem Laden der Laufzeit in Discovery- und Validierungsoberflächen zusammengeführt werden.                                                                               |
| `skills`                             | Nein         | `string[]`                       | Zu ladende Skills-Verzeichnisse relativ zum Plugin-Root.                                                                                                                                                                          |
| `name`                               | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                                     |
| `description`                        | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                  |
| `version`                            | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                       |
| `uiHints`                            | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                                                |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Authentifizierungsoption.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.
Listen zur Provider-Einrichtung verwenden diese Manifestoptionen, aus Deskriptoren abgeleitete Einrichtungsoptionen
und Metadaten des Installationskatalogs, ohne die Provider-Laufzeit zu laden.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                  |
| --------------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Option gehört.                                                                   |
| `method`              | Ja           | `string`                                        | ID der Authentifizierungsmethode, an die weitergeleitet wird.                                              |
| `choiceId`            | Ja           | `string`                                        | Stabile ID der Authentifizierungsoption, die von Onboarding- und CLI-Abläufen verwendet wird.             |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Beschriftung. Wenn sie weggelassen wird, verwendet OpenClaw stattdessen `choiceId`.      |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für den Picker.                                                                           |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Pickern früher sortiert.                   |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Option in Assistenten-Pickern aus, erlaubt aber weiterhin eine manuelle Auswahl per CLI.      |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Veraltete Options-IDs, die Benutzer auf diese ersetzende Option umleiten sollen.                          |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Optionen.                                                   |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Beschriftung für diese Gruppe.                                                             |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                           |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Authentifizierungsabläufe mit einem einzelnen Flag.                |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, zum Beispiel `--openrouter-api-key`.                                                   |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, zum Beispiel `--openrouter-api-key <key>`.                              |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                         |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Option erscheinen soll. Wenn weggelassen, ist der Standardwert `["text-inference"]`. |

## Referenz für `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer möglicherweise versehentlich in `plugins.allow` eintragen oder als Root-CLI-Befehl auszuführen versuchen. OpenClaw verwendet diese Metadaten für Diagnosen, ohne Plugin-Laufzeitcode zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                    |
| ------------ | ------------ | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                    |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.      |
| `cliCommand` | Nein         | `string`          | Verwandter Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## Referenz für `activation`

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Control-Plane-Ereignisse es in einen Aktivierungs-/Ladeplan aufnehmen sollen.

Dieser Block ist Planer-Metadaten, keine Lifecycle-API. Er registriert kein Laufzeitverhalten, ersetzt `register(...)` nicht und verspricht nicht, dass Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um Kandidaten-Plugins einzugrenzen, bevor er auf bestehende manifestgebundene Zuordnungsmetadaten wie `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks zurückfällt.

Bevorzugen Sie die engsten Metadaten, die die Zuordnung bereits beschreiben. Verwenden Sie `providers`, `channels`, `commandAliases`, Setup-Deskriptoren oder `contracts`, wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planer-Hinweise, die durch diese Zuordnungsfelder nicht dargestellt werden können.
Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Laufzeit-Aliasse wie `claude-cli`, `codex-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist nur für eingebettete Agent-Harness-IDs gedacht, die noch kein eigenes Zuordnungsfeld haben.

Dieser Block enthält nur Metadaten. Er registriert kein Laufzeitverhalten und ersetzt weder `register(...)` noch `setupEntry` oder andere Laufzeit-/Plugin-Einstiegspunkte.
Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor einem breiteren Laden von Plugins, daher kosten fehlende Aktivierungsmetadaten in der Regel nur Performance; sie sollten die Korrektheit nicht ändern, solange ältere Fallbacks für Manifest-Zuordnungen noch existieren.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Feld               | Erforderlich | Typ                                                  | Bedeutung                                                                                                                                             |
| ------------------ | ------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                          |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Laufzeit-IDs eingebetteter Agent-Harnesses, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliasse. |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                           |
| `onChannels`       | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                             |
| `onRoutes`         | Nein         | `string[]`                                           | Routenarten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                           |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Fähigkeitshinweise, die von der Aktivierungsplanung der Control Plane verwendet werden. Bevorzugen Sie nach Möglichkeit engere Felder.    |

Aktuelle Live-Verbraucher:

- befehlsausgelöste CLI-Planung greift als Fallback auf ältere
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Agent-Laufzeit-Startplanung verwendet `activation.onAgentHarnesses` für
  eingebettete Harnesses und `cliBackends[]` auf oberster Ebene für CLI-Laufzeit-Aliasse
- setup-/kanalausgelöste Kanalplanung greift als Fallback auf die ältere Zuordnung
  `channels[]` zurück, wenn explizite Kanal-Aktivierungsmetadaten fehlen
- setup-/laufzeitausgelöste Provider-Planung greift als Fallback auf ältere
  `providers[]`- und `cliBackends[]`-Zuordnung auf oberster Ebene zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

Planerdiagnosen können explizite Aktivierungshinweise von Fallbacks auf Manifest-Zuordnung unterscheiden. Zum Beispiel bedeutet `activation-command-hint`, dass `activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der Planer stattdessen die Zuordnung aus `commandAliases` verwendet hat. Diese Bezeichner für Gründe sind für Host-Diagnosen und Tests gedacht; Plugin-Autoren sollten weiterhin die Metadaten deklarieren, die die Zuordnung am besten beschreiben.

## Referenz für `qaRunners`

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unter dem gemeinsamen Root `openclaw qa` beiträgt. Halten Sie diese Metadaten leichtgewichtig und statisch; die tatsächliche CLI-Registrierung bleibt Eigentum der Plugin-Laufzeit über eine leichtgewichtige Oberfläche `runtime-api.ts`, die `qaRunnerCliRegistrations` exportiert.

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

| Feld          | Erforderlich | Typ      | Bedeutung                                                             |
| ------------- | ------------ | -------- | --------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl, der unter `openclaw qa` eingehängt wird, zum Beispiel `matrix`. |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

## Referenz für `setup`

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen günstige plugin-eigene Metadaten benötigen, bevor die Laufzeit geladen wird.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-Backends. `setup.cliBackends` ist die setupspezifische Deskriptoroberfläche für Control-Plane-/Setup-Abläufe, die reine Metadaten bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte Deskriptor-First-Lookup-Oberfläche für Setup-Discovery. Wenn der Deskriptor das Kandidaten-Plugin nur eingrenzt und Setup dennoch umfangreichere laufzeitbezogene Hooks zur Setup-Zeit benötigt, setzen Sie `requiresRuntime: true` und lassen Sie `setup-api` als Fallback-Ausführungspfad bestehen.

OpenClaw bezieht außerdem `setup.providers[].envVars` in generische Lookups für Provider-Authentifizierung und Umgebungsvariablen ein. `providerAuthEnvVars` wird über einen Kompatibilitätsadapter während des Deprecation-Fensters weiterhin unterstützt, aber nicht gebündelte Plugins, die es noch verwenden, erhalten eine Manifest-Diagnose. Neue Plugins sollten Setup-/Status-Metadaten für Umgebungsvariablen unter `setup.providers[].envVars` ablegen.

OpenClaw kann auch einfache Setup-Optionen aus `setup.providers[].authMethods` ableiten, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false` angibt, dass keine Setup-Laufzeit erforderlich ist. Explizite Einträge in `providerAuthChoices` bleiben für benutzerdefinierte Beschriftungen, CLI-Flags, Onboarding-Bereich und Assistenten-Metadaten weiterhin bevorzugt.

Setzen Sie `requiresRuntime: false` nur dann, wenn diese Deskriptoren für die Setup-Oberfläche ausreichen. OpenClaw behandelt ein explizites `false` als Vertrag nur für Deskriptoren und führt für das Setup-Lookup weder `setup-api` noch `openclaw.setupEntry` aus. Wenn ein Plugin, das nur Deskriptoren verwendet, dennoch einen dieser Setup-Laufzeiteinträge bereitstellt, meldet OpenClaw eine additive Diagnose und ignoriert ihn weiterhin. Wenn `requiresRuntime` weggelassen wird, bleibt das ältere Fallback-Verhalten erhalten, damit bestehende Plugins, die Deskriptoren ohne dieses Flag hinzugefügt haben, nicht beschädigt werden.

Da das Setup-Lookup plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte Werte in `setup.providers[].id` und `setup.cliBackends[]` über alle erkannten Plugins hinweg eindeutig bleiben. Mehrdeutige Zuständigkeit schlägt kontrolliert fehl, statt anhand der Discovery-Reihenfolge einen Gewinner auszuwählen.

Wenn die Setup-Laufzeit tatsächlich ausgeführt wird, melden Diagnosen der Setup-Registry Deskriptor-Drift, wenn `setup-api` einen Provider oder ein CLI-Backend registriert, das in den Manifest-Deskriptoren nicht deklariert ist, oder wenn ein Deskriptor keine passende Laufzeitregistrierung hat. Diese Diagnosen sind additiv und lehnen ältere Plugins nicht ab.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                  |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | Setup-/Authentifizierungsmethoden-IDs, die dieser Provider unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`     | Nein         | `string[]` | Umgebungsvariablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                              |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.                   |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für Deskriptor-First-Setup-Lookups verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die zur Setup-Oberfläche dieses Plugins gehören.                    |
| `requiresRuntime`  | Nein         | `boolean`  | Gibt an, ob Setup nach dem Deskriptor-Lookup weiterhin die Ausführung von `setup-api` benötigt.       |

## Referenz für `uiHints`

`uiHints` ist eine Zuordnung von Namen von Konfigurationsfeldern zu kleinen Rendering-Hinweisen.

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

| Feld          | Typ        | Bedeutung                                 |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Benutzerseitige Feldbeschriftung.         |
| `help`        | `string`   | Kurzer Hilfetext.                         |
| `tags`        | `string[]` | Optionale UI-Tags.                        |
| `advanced`    | `boolean`  | Kennzeichnet das Feld als erweitert.      |
| `sensitive`   | `boolean`  | Kennzeichnet das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.     |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Zuständigkeit von Fähigkeiten, die OpenClaw lesen kann, ohne die Plugin-Laufzeit zu importieren.

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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Jede Liste ist optional:

| Feld                             | Typ        | Bedeutung                                                                    |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs von Erweiterungsfabriken für Codex-App-Server, derzeit `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Laufzeit-IDs, für die ein gebündeltes Plugin Tool-Result-Middleware registrieren kann. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Authentifizierungsprofile diesem Plugin gehört. |
| `speechProviders`                | `string[]` | Sprach-Provider-IDs, die diesem Plugin gehören.                              |
| `realtimeTranscriptionProviders` | `string[]` | IDs von Providern für Echtzeit-Transkription, die diesem Plugin gehören.     |
| `realtimeVoiceProviders`         | `string[]` | IDs von Providern für Echtzeit-Stimme, die diesem Plugin gehören.            |
| `memoryEmbeddingProviders`       | `string[]` | IDs von Memory-Embedding-Providern, die diesem Plugin gehören.               |
| `mediaUnderstandingProviders`    | `string[]` | IDs von Providern für Medienverständnis, die diesem Plugin gehören.          |
| `imageGenerationProviders`       | `string[]` | IDs von Providern für Bildgenerierung, die diesem Plugin gehören.            |
| `videoGenerationProviders`       | `string[]` | IDs von Providern für Videogenerierung, die diesem Plugin gehören.           |
| `webFetchProviders`              | `string[]` | IDs von Providern für Web-Abruf, die diesem Plugin gehören.                  |
| `webSearchProviders`             | `string[]` | IDs von Providern für Web-Suche, die diesem Plugin gehören.                  |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

`contracts.embeddedExtensionFactories` bleibt für gebündelte Erweiterungsfabriken nur für Codex-App-Server erhalten. Gebündelte Tool-Ergebnis-Transformationen sollten stattdessen `contracts.agentToolResultMiddleware` deklarieren und sich mit `api.registerAgentToolResultMiddleware(...)` registrieren. Externe Plugins können keine Tool-Result-Middleware registrieren, da diese Schnittstelle Tool-Ausgaben mit hohem Vertrauen umschreiben kann, bevor das Modell sie sieht.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten `contracts.externalAuthProviders` deklarieren. Plugins ohne diese Deklaration laufen weiterhin über ein veraltetes Kompatibilitäts-Fallback, aber dieses Fallback ist langsamer und wird nach dem Migrationsfenster entfernt.

Gebündelte Memory-Embedding-Provider sollten `contracts.memoryEmbeddingProviders` für jede Adapter-ID deklarieren, die sie bereitstellen, einschließlich integrierter Adapter wie `local`. Eigenständige CLI-Pfade verwenden diesen Manifest-Vertrag, um nur das zuständige Plugin zu laden, bevor die vollständige Gateway-Laufzeit Provider registriert hat.

## Referenz für `mediaUnderstandingProviderMetadata`

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Provider für Medienverständnis Standardmodelle, Auto-Auth-Fallback-Priorität oder native Dokumentunterstützung hat, die generische Kern-Helfer benötigen, bevor die Laufzeit geladen wird. Schlüssel müssen außerdem in `contracts.mediaUnderstandingProviders` deklariert sein.

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

| Feld                   | Typ                                 | Bedeutung                                                                     |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medienfähigkeiten, die von diesem Provider bereitgestellt werden.             |
| `defaultModels`        | `Record<string, string>`            | Standardwerte von Fähigkeit zu Modell, die verwendet werden, wenn die Konfiguration kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden bei automatischem credential-basiertem Provider-Fallback früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.                 |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin günstige Konfigurationsmetadaten benötigt, bevor die Laufzeit geladen wird. Discovery von schreibgeschütztem Kanal-Setup/-Status kann diese Metadaten direkt für konfigurierte externe Kanäle verwenden, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false` angibt, dass keine Setup-Laufzeit erforderlich ist.

`channelConfigs` sind Metadaten des Plugin-Manifests, kein neuer Konfigurationsabschnitt auf oberster Ebene für Benutzer. Benutzer konfigurieren Kanalinstanzen weiterhin unter `channels.<channel-id>`. OpenClaw liest Manifest-Metadaten, um zu entscheiden, welches Plugin diesen konfigurierten Kanal besitzt, bevor Plugin-Laufzeitcode ausgeführt wird.

Für ein Kanal-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten auch passende Einträge in `channelConfigs` deklarieren. Ohne diese kann OpenClaw das Plugin zwar weiterhin laden, aber Cold-Path-Konfigurationsschema-, Setup- und Control-UI-Oberflächen können die Form kanalbezogener Optionen nicht kennen, bis die Plugin-Laufzeit ausgeführt wird.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und `nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Prüfungen der Befehlskonfiguration deklarieren, die ausgeführt werden, bevor die Kanal-Laufzeit geladen wird. Gebündelte Kanäle können dieselben Standardwerte außerdem über `package.json#openclaw.channel.commands` zusammen mit ihren übrigen paketgebundenen Metadaten des Kanalkatalogs veröffentlichen.

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

Jeder Kanal-Eintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Erforderlich für jeden deklarierten Kanal-Konfigurationseintrag. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Sensitivitätshinweise für diesen Abschnitt der Kanalkonfiguration. |
| `label`       | `string`                 | Kanalbeschriftung, die in Picker- und Inspektionsoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                          |
| `commands`    | `object`                 | Statische Auto-Standardwerte für native Befehle und native Skills für Konfigurationsprüfungen vor der Laufzeit. |
| `preferOver`  | `string[]`               | Veraltete oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

### Ersetzen eines anderen Kanal-Plugins

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Besitzer für eine Kanal-ID ist, die auch von einem anderen Plugin bereitgestellt werden kann. Häufige Fälle sind eine umbenannte Plugin-ID, ein eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der aus Gründen der Konfigurationskompatibilität dieselbe Kanal-ID beibehält.

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

Wenn `channels.chat` konfiguriert ist, berücksichtigt OpenClaw sowohl die Kanal-ID als auch die bevorzugte Plugin-ID. Wenn das niedriger priorisierte Plugin nur deshalb ausgewählt wurde, weil es gebündelt ist oder standardmäßig aktiviert wird, deaktiviert OpenClaw es in der effektiven Laufzeitkonfiguration, sodass ein Plugin den Kanal und seine Tools besitzt. Eine explizite Benutzerwahl hat jedoch weiterhin Vorrang: Wenn der Benutzer beide Plugins ausdrücklich aktiviert, behält OpenClaw diese Wahl bei und meldet Diagnosehinweise zu doppelten Kanälen/Tools, statt die angeforderte Plugin-Menge stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die denselben Kanal tatsächlich bereitstellen können. Es ist kein allgemeines Prioritätsfeld und benennt keine Schlüssel der Benutzerkonfiguration um.

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus Kurzformen von Modell-IDs wie `gpt-5.5` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw verwendet dabei folgende Reihenfolge:

- explizite Referenzen im Format `provider/model` verwenden die manifestgebundenen Metadaten des besitzenden `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                           |
| --------------- | ---------- | ----------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzformen von Modell-IDs abgeglichen werden.  |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen von Profilsuffixen gegen Kurzformen von Modell-IDs abgeglichen werden. |

## Referenz für `modelCatalog`

Verwenden Sie `modelCatalog`, wenn OpenClaw Modellmetadaten für Provider kennen soll, bevor die Plugin-Laufzeit geladen wird. Dies ist die manifestgebundene Quelle für feste Katalogzeilen, Provider-Aliasse, Unterdrückungsregeln und den Discovery-Modus. Die Laufzeitaktualisierung bleibt weiterhin Aufgabe des Provider-Laufzeitcodes, aber das Manifest teilt dem Kern mit, wann Laufzeit erforderlich ist.

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
| `suppressions` | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus einem providerspezifischen Grund unterdrückt. |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Gibt an, ob der Provider-Katalog aus Manifest-Metadaten gelesen, in den Cache aktualisiert oder nur zur Laufzeit bereitgestellt werden kann. |

Provider-Felder:

| Feld      | Typ                      | Bedeutung                                                                |
| --------- | ------------------------ | ------------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Optionale Standard-`baseUrl` für Modelle in diesem Provider-Katalog.     |
| `api`     | `ModelApi`               | Optionaler Standard-API-Adapter für Modelle in diesem Provider-Katalog.  |
| `headers` | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.      |
| `models`  | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.           |

Modell-Felder:

| Feld            | Typ                                                            | Bedeutung                                                                   |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                      |
| `name`          | `string`                                                       | Optionaler Anzeigename.                                                     |
| `api`           | `ModelApi`                                                     | Optionales API-Override pro Modell.                                         |
| `baseUrl`       | `string`                                                       | Optionales `baseUrl`-Override pro Modell.                                   |
| `headers`       | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                      |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitäten, die das Modell akzeptiert.                                     |
| `reasoning`     | `boolean`                                                      | Gibt an, ob das Modell Reasoning-Verhalten bereitstellt.                    |
| `contextWindow` | `number`                                                       | Natives Kontextfenster des Providers.                                       |
| `contextTokens` | `number`                                                       | Optionale effektive Laufzeitgrenze für Kontext, wenn sie sich von `contextWindow` unterscheidet. |
| `maxTokens`     | `number`                                                       | Maximale Ausgabetoken, sofern bekannt.                                      |
| `cost`          | `object`                                                       | Optionale Preisangabe in USD pro eine Million Token, einschließlich optionaler `tieredPricing`. |
| `compat`        | `object`                                                       | Optionale Kompatibilitäts-Flags passend zur Modellkonfigurationskompatibilität von OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listing-Status. Nur unterdrücken, wenn die Zeile überhaupt nicht erscheinen darf. |
| `statusReason`  | `string`                                                       | Optionaler Grund, der zusammen mit einem nicht verfügbaren Status angezeigt wird. |
| `replaces`      | `string[]`                                                     | Ältere provider-lokale Modell-IDs, die dieses Modell ersetzt.               |
| `replacedBy`    | `string`                                                       | Provider-lokale Ersatzmodell-ID für veraltete Zeilen.                       |
| `tags`          | `string[]`                                                     | Stabile Tags, die von Pickern und Filtern verwendet werden.                 |

Legen Sie keine Daten, die nur zur Laufzeit existieren, in `modelCatalog` ab. Wenn ein Provider Kontostatus, eine API-Anfrage oder die Erkennung lokaler Prozesse benötigt, um die vollständige Modellmenge zu kennen, deklarieren Sie diesen Provider in `discovery` als `refreshable` oder `runtime`.

### OpenClaw Provider Index

Der OpenClaw Provider Index ist OpenClaw-eigene Preview-Metadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist kein Teil eines Plugin-Manifests.
Plugin-Manifeste bleiben die maßgebliche Quelle für installierte Plugins. Der Provider Index ist der interne Fallback-Vertrag, den zukünftige Oberflächen für installierbare Provider und Model-Picker vor der Installation verwenden werden, wenn ein Provider-Plugin nicht installiert ist.

Reihenfolge der Katalog-Autorität:

1. Benutzerkonfiguration.
2. `modelCatalog` des installierten Plugin-Manifests.
3. Modellkatalog-Cache aus expliziter Aktualisierung.
4. Preview-Zeilen aus dem OpenClaw Provider Index.

Der Provider Index darf keine Geheimnisse, keinen Aktivierungsstatus, keine Laufzeit-Hooks und keine kontospezifischen Live-Modelldaten enthalten. Seine Preview-Kataloge verwenden dieselbe Form für Provider-Zeilen aus `modelCatalog` wie Plugin-Manifeste, sollten aber auf stabile Anzeigemetadaten beschränkt bleiben, es sei denn, Laufzeitadapterfelder wie `api`, `baseUrl`, Preisangaben oder Kompatibilitäts-Flags werden absichtlich mit dem Manifest des installierten Plugins synchron gehalten. Provider mit Live-Discovery über `/models` sollten aktualisierte Zeilen über den expliziten Cache-Pfad des Modellkatalogs schreiben, statt bei normalen Listings oder beim Onboarding Provider-APIs aufzurufen.

Einträge im Provider Index können außerdem Metadaten für installierbare Plugins für Provider enthalten, deren Plugin aus dem Kern verschoben wurde oder anderweitig noch nicht installiert ist. Diese Metadaten spiegeln das Muster des Kanalkatalogs wider: Paketname, npm-Installationsspezifikation, erwartete Integrität und leichtgewichtige Labels für Authentifizierungsoptionen reichen aus, um eine installierbare Setup-Option anzuzeigen. Sobald das Plugin installiert ist, hat sein Manifest Vorrang und der Eintrag im Provider Index wird für diesen Provider ignoriert.

Veraltete Fähigkeitsschlüssel auf oberster Ebene sind deprecated. Verwenden Sie `openclaw doctor --fix`, um `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; das normale Laden von Manifesten behandelt diese Felder auf oberster Ebene nicht mehr als Zuständigkeit für Fähigkeiten.

## Manifest versus package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Metadaten zu Authentifizierungsoptionen und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und den Block `openclaw`, der für Einstiegspunkte, Installations-Gating, Setup oder Katalog-Metadaten verwendet wird |

Wenn Sie unsicher sind, wo ein Metadatum hingehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, legen Sie es in `openclaw.plugin.json` ab
- wenn es um Packaging, Einstiegsdateien oder npm-Installationsverhalten geht, legen Sie es in `package.json` ab

### `package.json`-Felder, die Discovery beeinflussen

Einige Plugin-Metadaten vor der Laufzeit liegen absichtlich in `package.json` unter dem Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                     |
| `openclaw.runtimeExtensions`                                      | Deklariert gebaute JavaScript-Laufzeit-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                              |
| `openclaw.setupEntry`                                             | Leichtgewichtiger Einstiegspunkt nur für Setup, der während Onboarding, verzögertem Kanalstart und schreibgeschützter Discovery von Kanalstatus/SecretRef verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                      | Deklariert den gebauten JavaScript-Setup-Einstiegspunkt für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                             |
| `openclaw.channel`                                                | Leichtgewichtige Metadaten des Kanalkatalogs wie Beschriftungen, Dokumentationspfade, Aliasse und Beschreibungstexte für die Auswahl.                                               |
| `openclaw.channel.commands`                                       | Statische Auto-Standardmetadaten für native Befehle und native Skills, die von Konfigurations-, Audit- und Befehlslisten-Oberflächen verwendet werden, bevor die Kanal-Laufzeit geladen wird. |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für den Prüfmechanismus des konfigurierten Zustands, die beantworten können: „Existiert bereits ein Setup nur über Umgebungsvariablen?“, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für den Prüfmechanismus des persistierten Authentifizierungszustands, die beantworten können: „Ist bereits irgendwo eine Anmeldung vorhanden?“, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hinweise für Installation/Aktualisierung gebündelter und extern veröffentlichter Plugins.                                                                                            |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                      |
| `openclaw.install.minHostVersion`                                 | Minimale unterstützte Version des OpenClaw-Hosts unter Verwendung einer Semver-Untergrenze wie `>=2026.3.22`.                                                                       |
| `openclaw.install.expectedIntegrity`                              | Erwartete npm-Dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Aktualisierungsabläufe prüfen das geladene Artefakt dagegen.                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen eng begrenzten Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Ermöglicht, dass Kanaloberflächen nur für Setup vor dem vollständigen Kanal-Plugin während des Starts geladen werden.                                                                |

Manifest-Metadaten entscheiden, welche Provider-/Kanal-/Setup-Optionen beim Onboarding erscheinen, bevor die Laufzeit geladen wird. `package.json#openclaw.install` teilt dem Onboarding mit, wie dieses Plugin geladen oder aktiviert werden soll, wenn der Benutzer eine dieser Optionen auswählt. Verschieben Sie keine Installationshinweise nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das Plugin auf älteren Hosts.

Exakte npm-Versions-Pins befinden sich bereits in `npmSpec`, zum Beispiel `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalogeinträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Aktualisierungsabläufe kontrolliert fehlschlagen, wenn das geladene npm-Artefakt nicht mehr mit der gepinnten Version übereinstimmt. Interaktives Onboarding bietet aus Kompatibilitätsgründen weiterhin npm-Spezifikationen vertrauenswürdiger Registries an, einschließlich bloßer Paketnamen und Dist-Tags. Katalogdiagnosen können exakte, gleitende, integritätsgepinnte, Integrität-fehlend-, Paketnamen-nicht-passend- und ungültige Default-Choice-Quellen unterscheiden. Sie warnen außerdem, wenn `expectedIntegrity` vorhanden ist, es aber keine gültige npm-Quelle gibt, an die es gebunden werden kann. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Aktualisierungsabläufe es; wenn es weggelassen wird, wird die Registry-Auflösung ohne Integritäts-Pin protokolliert.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Kanalliste oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige Laufzeit zu laden. Der Setup-Eintrag sollte Kanal-Metadaten sowie Setup-sichere Adapter für Konfiguration, Status und Secrets bereitstellen; halten Sie Netzwerk-Clients, Gateway-Listener und Transport-Laufzeiten im Haupteinstiegspunkt der Erweiterung.

Felder für Laufzeit-Einstiegspunkte setzen die Prüfungen von Paketgrenzen für Felder von Quell-Einstiegspunkten nicht außer Kraft. Zum Beispiel kann `openclaw.runtimeExtensions` einen ausbrechenden Pfad in `openclaw.extensions` nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit erlaubt es Installationsabläufen nur die Wiederherstellung aus bestimmten veralteten Upgrade-Fehlern gebündelter Plugins, etwa einem fehlenden gebündelten Plugin-Pfad oder einem veralteten Eintrag `channels.<id>` für dasselbe gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und verweisen Operatoren an `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein kleines Prüfmodul:

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

Verwenden Sie es, wenn Setup-, Doctor- oder Configured-State-Abläufe vor dem Laden des vollständigen Kanal-Plugins eine kostengünstige Ja/Nein-Prüfung für Authentifizierung benötigen. Das Zielexport sollte eine kleine Funktion sein, die nur den persistierten Zustand liest; leiten Sie es nicht über das vollständige Laufzeit-Barrel des Kanal-Plugins.

`openclaw.channel.configuredState` folgt derselben Form für kostengünstige Prüfungen des konfigurierten Zustands nur über Umgebungsvariablen:

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

Verwenden Sie es, wenn ein Kanal den konfigurierten Zustand aus Umgebungsvariablen oder anderen kleinen Eingaben außerhalb der Laufzeit bestimmen kann. Wenn die Prüfung eine vollständige Konfigurationsauflösung oder die echte Kanal-Laufzeit benötigt, belassen Sie diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## Discovery-Reihenfolge (doppelte Plugin-IDs)

OpenClaw entdeckt Plugins aus mehreren Roots (gebündelt, globale Installation, Workspace, explizit über die Konfiguration ausgewählte Pfade). Wenn zwei Entdeckungen dieselbe `id` haben, wird nur das Manifest mit der **höchsten Priorität** beibehalten; Duplikate mit niedrigerer Priorität werden verworfen, statt parallel geladen zu werden.

Priorität, von hoch nach niedrig:

1. **Über Konfiguration ausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` festgelegt ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Globale Installation** — Plugins, die in den globalen Plugin-Root von OpenClaw installiert wurden
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace erkannt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschreibt den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich durch ein lokales zu ersetzen, pinnen Sie es über `plugins.entries.<id>`, damit es aufgrund der Priorität gewinnt, statt sich auf Workspace-Discovery zu verlassen.
- Verworfene Duplikate werden protokolliert, damit Doctor und Startdiagnosen auf die verworfene Kopie hinweisen können.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, selbst wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig, zum Beispiel `{ "type": "object", "additionalProperties": false }`.
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte Schlüssel in `channels.*` sind **Fehler**, es sei denn, die Kanal-ID wird durch ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*` müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein fehlerhaftes oder fehlendes Manifest oder Schema hat, schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und es wird eine **Warnung** in Doctor und in den Logs ausgegeben.

Die vollständige `plugins.*`-Schema-Definition finden Sie unter [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw Plugins erforderlich**, einschließlich Ladevorgängen aus dem lokalen Dateisystem. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur Discovery und Validierung.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommas und nicht in Anführungszeichen gesetzte Schlüssel zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie benutzerdefinierte Schlüssel auf oberster Ebene.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerDiscoveryEntry` muss leichtgewichtig bleiben und sollte keinen breiten Laufzeitcode importieren; verwenden Sie es für statische Metadaten des Provider-Katalogs oder enge Discovery-Deskriptoren, nicht für die Ausführung zur Anfragezeit.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Metadaten zu Umgebungsvariablen (`setup.providers[].envVars`, veraltetes `providerAuthEnvVars` und `channelEnvVars`) sind nur deklarativ. Status-, Audit-, Cron-Zustellungsvalidierung und andere schreibgeschützte Oberflächen wenden weiterhin Plugin-Vertrauen und Richtlinien zur effektiven Aktivierung an, bevor eine Umgebungsvariable als konfiguriert behandelt wird.
- Informationen zu Metadaten des Laufzeit-Wizards, die Provider-Code erfordern, finden Sie unter [Provider-Laufzeit-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Anforderungen an Allowlists des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Verwandt

<CardGroup cols={3}>
  <Card title="Plugins erstellen" href="/de/plugins/building-plugins" icon="rocket">
    Erste Schritte mit Plugins.
  </Card>
  <Card title="Plugin-Architektur" href="/de/plugins/architecture" icon="diagram-project">
    Interne Architektur und Fähigkeitsmodell.
  </Card>
  <Card title="SDK-Übersicht" href="/de/plugins/sdk-overview" icon="book">
    Referenz zum Plugin-SDK und Subpath-Importe.
  </Card>
</CardGroup>
