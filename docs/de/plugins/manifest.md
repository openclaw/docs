---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Fehler bei der Plugin-Validierung debuggen
summary: Plugin-Manifest + Anforderungen an das JSON-Schema (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-25T13:52:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das Standard-Layout von Claude-Komponenten
  ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, aber sie werden nicht
gegen das hier beschriebene Schema von `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Command-Roots, Claude-Bundle-Standardeinstellungen aus `settings.json`,
Claude-Bundle-LSP-Standards und unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** im **Plugin-Root** eine Datei `openclaw.plugin.json`
mitliefern. OpenClaw verwendet dieses Manifest, um die Konfiguration zu validieren,
**ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe den vollständigen Leitfaden zum Plugin-System: [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und aktuellen Richtlinien zur externen Kompatibilität:
[Capability model](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw **vor dem Laden Ihres
Plugin-Codes** liest. Alles unten muss so günstig sein, dass es geprüft werden kann, ohne
die Plugin-Laufzeit zu starten.

**Verwenden Sie sie für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurations-UI
- Auth-, Onboarding- und Setup-Metadaten (Alias, automatisches Aktivieren, Provider-Env-Variablen, Auth-Auswahlmöglichkeiten)
- Aktivierungshinweise für Oberflächen der Steuerungsebene
- Kurzform-Besitz von Modellfamilien
- statische Schnappschüsse der Zuständigkeit für Fähigkeiten (`contracts`)
- QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie sie nicht für:** Registrierung von Laufzeitverhalten, Deklaration von Code-Einstiegspunkten
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

## Umfangreicheres Beispiel

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

## Referenz der Felder auf oberster Ebene

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                         |
| ------------------------------------ | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                             |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                          |
| `enabledByDefault`                   | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.                                       |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modell-Refs sie erwähnen.                                                                                                           |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                  |
| `channels`                           | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Werden für Discovery und Konfigurationsvalidierung verwendet.                                                                                                                               |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | Nein         | `string`                         | Leichtgewichtiger Modulpfad für Provider-Discovery relativ zum Plugin-Root für manifestbezogene Provider-Katalogmetadaten, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.                    |
| `modelSupport`                       | Nein         | `object`                         | Dem Manifest gehörende Kurzform-Metadaten zu Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                                          |
| `modelCatalog`                       | Nein         | `object`                         | Deklarative Modellkatalog-Metadaten für Provider, die diesem Plugin gehören. Dies ist der Vertrag der Steuerungsebene für zukünftiges schreibgeschütztes Listing, Onboarding, Modellpicker, Aliase und Unterdrückung ohne Laden der Plugin-Laufzeit. |
| `providerEndpoints`                  | Nein         | `object[]`                       | Dem Manifest gehörende Host-/`baseUrl`-Metadaten für Provider-Routen, die vom Core klassifiziert werden müssen, bevor die Provider-Laufzeit geladen wird.                                                                        |
| `cliBackends`                        | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Werden für die automatische Aktivierung beim Start aus expliziten Konfigurations-Refs verwendet.                                                                             |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Refs, deren pluginspezifischer Hook für synthetische Authentifizierung bei der kalten Model-Discovery geprüft werden soll, bevor die Laufzeit geladen wird.                                          |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalterwerte für API-Schlüssel, die zu gebündelten Plugins gehören und einen nicht geheimen lokalen, OAuth- oder Umgebungs-Credential-Zustand repräsentieren.                                                               |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                                         |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Veraltete kompatible Env-Metadaten für Provider-Authentifizierung/-Status-Lookup. Bevorzugen Sie für neue Plugins `setup.providers[].envVars`; OpenClaw liest dies während des Deprecation-Zeitraums weiterhin.               |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die für den Auth-Lookup eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider teilt.                  |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Günstige Kanal-Env-Metadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Kanal-Setups oder Auth-Oberflächen, die generische Start-/Konfigurationshelfer sehen sollen.        |
| `providerAuthChoices`                | Nein         | `object[]`                       | Günstige Metadaten zu Auth-Auswahlmöglichkeiten für Onboarding-Picker, Auflösung bevorzugter Provider und einfache CLI-Flag-Verdrahtung.                                                                                         |
| `activation`                         | Nein         | `object`                         | Günstige Metadaten des Aktivierungsplaners für provider-, befehls-, kanal-, routen- und fähigkeitsgetriggertes Laden. Nur Metadaten; die tatsächliche Logik gehört weiterhin der Plugin-Laufzeit.                             |
| `setup`                              | Nein         | `object`                         | Günstige Setup-/Onboarding-Beschreibungen, die Discovery- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                               |
| `qaRunners`                          | Nein         | `object[]`                       | Günstige QA-Runner-Beschreibungen, die vom gemeinsamen Host `openclaw qa` verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                              |
| `contracts`                          | Nein         | `object`                         | Statischer gebündelter Capability-Snapshot für externe Auth-Hooks, Speech, Realtime-Transkription, Realtime-Voice, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Besitz. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Günstige Standardwerte für Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                   |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Dem Manifest gehörende Kanal-Konfigurationsmetadaten, die in Discovery- und Validierungsoberflächen zusammengeführt werden, bevor die Laufzeit geladen wird.                                                                      |
| `skills`                             | Nein         | `string[]`                       | Skill-Verzeichnisse, relativ zum Plugin-Root, die geladen werden sollen.                                                                                                                                                          |
| `name`                               | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                                     |
| `description`                        | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                  |
| `version`                            | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                       |
| `uiHints`                            | Nein         | `Record<string, object>`         | UI-Labels, Platzhalter und Hinweise zur Sensibilität für Konfigurationsfelder.                                                                                                                                                    |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahlmöglichkeit.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.
Der Provider-Setup-Ablauf bevorzugt diese Manifest-Auswahlmöglichkeiten und greift dann zur Kompatibilität auf Laufzeit-
Assistentenmetadaten und Installationskatalog-Auswahlmöglichkeiten zurück.

| Feld                  | Erforderlich | Typ                                              | Bedeutung                                                                                                 |
| --------------------- | ------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                         | Provider-ID, zu der diese Auswahlmöglichkeit gehört.                                                      |
| `method`              | Ja           | `string`                                         | ID der Authentifizierungsmethode, an die weitergeleitet wird.                                             |
| `choiceId`            | Ja           | `string`                                         | Stabile Auth-Choice-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                              |
| `choiceLabel`         | Nein         | `string`                                         | Benutzerseitiges Label. Wenn weggelassen, greift OpenClaw auf `choiceId` zurück.                         |
| `choiceHint`          | Nein         | `string`                                         | Kurzer Hilfstext für den Picker.                                                                          |
| `assistantPriority`   | Nein         | `number`                                         | Niedrigere Werte werden in assistentengesteuerten interaktiven Pickern früher sortiert.                  |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                   | Versteckt die Auswahl in Assistenten-Pickern, erlaubt aber weiterhin manuelle CLI-Auswahl.               |
| `deprecatedChoiceIds` | Nein         | `string[]`                                       | Veraltete Choice-IDs, die Benutzer zu dieser Ersatzwahl weiterleiten sollen.                             |
| `groupId`             | Nein         | `string`                                         | Optionale Gruppen-ID zum Gruppieren zusammengehöriger Auswahlmöglichkeiten.                               |
| `groupLabel`          | Nein         | `string`                                         | Benutzerseitiges Label für diese Gruppe.                                                                  |
| `groupHint`           | Nein         | `string`                                         | Kurzer Hilfstext für die Gruppe.                                                                          |
| `optionKey`           | Nein         | `string`                                         | Interner Optionsschlüssel für einfache Auth-Flows mit nur einem Flag.                                     |
| `cliFlag`             | Nein         | `string`                                         | Name des CLI-Flags, z. B. `--openrouter-api-key`.                                                         |
| `cliOption`           | Nein         | `string`                                         | Vollständige Form der CLI-Option, z. B. `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Nein         | `string`                                         | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                        |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">`  | Auf welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn weggelassen, ist der Standard `["text-inference"]`. |

## Referenz für `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer
versehentlich in `plugins.allow` eintragen oder als CLI-Befehl auf Root-Ebene ausführen wollen. OpenClaw
verwendet diese Metadaten für Diagnosen, ohne Plugin-Laufzeitcode zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                        |
| ------------ | ------------ | ----------------- | -------------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der diesem Plugin gehört.                                           |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.             |
| `cliCommand` | Nein         | `string`          | Verwandter Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen werden kann, falls vorhanden. |

## Referenz für `activation`

Verwenden Sie `activation`, wenn das Plugin günstig deklarieren kann, welche Ereignisse der Steuerungsebene
es in einen Aktivierungs-/Ladeplan aufnehmen sollen.

Dieser Block enthält Planer-Metadaten, keine Lifecycle-API. Er registriert kein
Laufzeitverhalten, ersetzt `register(...)` nicht und verspricht nicht, dass
Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um Kandidaten-Plugins einzugrenzen, bevor er auf bestehende Metadaten zur Zuständigkeit aus dem Manifest
wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks zurückfällt.

Bevorzugen Sie die engsten Metadaten, die die Zuständigkeit bereits beschreiben. Verwenden Sie
`providers`, `channels`, `commandAliases`, Setup-Beschreibungen oder `contracts`,
wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Hinweise an den Planer, die durch diese Zuständigkeitsfelder nicht dargestellt werden können.

Dieser Block besteht nur aus Metadaten. Er registriert kein Laufzeitverhalten und ersetzt
nicht `register(...)`, `setupEntry` oder andere Laufzeit-/Plugin-Einstiegspunkte.
Aktuelle Consumer verwenden ihn als Eingrenzungshinweis vor breiterem Plugin-Laden; fehlende Aktivierungsmetadaten kosten daher normalerweise nur Performance und sollten die Korrektheit nicht verändern, solange Legacy-Fallbacks für Manifest-Zuständigkeiten noch existieren.

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

| Feld             | Erforderlich | Typ                                                  | Bedeutung                                                                                                  |
| ---------------- | ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                               |
| `onCommands`     | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                |
| `onChannels`     | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                  |
| `onRoutes`       | Nein         | `string[]`                                           | Routenarten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Fähigkeits-Hinweise, die von der Aktivierungsplanung der Steuerungsebene verwendet werden. Bevorzugen Sie nach Möglichkeit engere Felder. |

Aktuelle Live-Consumer:

- Befehlsgetriggerte CLI-Planung fällt auf Legacy-
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Kanalgetriggerte Setup-/Kanalplanung fällt auf Legacy-Ownership über `channels[]`
  zurück, wenn explizite Aktivierungsmetadaten für Kanäle fehlen
- Provider-getriggerte Setup-/Laufzeitplanung fällt auf Legacy-
  `providers[]` und Top-Level-Ownership über `cliBackends[]` zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

Diagnosen des Planers können explizite Aktivierungshinweise von Fallbacks auf Manifest-
Ownership unterscheiden. Zum Beispiel bedeutet `activation-command-hint`, dass
`activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der
Planer stattdessen Ownership über `commandAliases` verwendet hat. Diese Reason-Labels sind für
Host-Diagnosen und Tests gedacht; Plugin-Autoren sollten weiterhin die Metadaten deklarieren,
die Ownership am besten beschreiben.

## Referenz für `qaRunners`

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb der
gemeinsamen Wurzel `openclaw qa` beisteuert. Halten Sie diese Metadaten günstig und statisch; die Plugin-
Laufzeit bleibt weiterhin für die eigentliche CLI-Registrierung über eine leichtgewichtige
Oberfläche `runtime-api.ts` zuständig, die `qaRunnerCliRegistrations` exportiert.

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
| `commandName` | Ja           | `string` | Unterbefehl unter `openclaw qa`, zum Beispiel `matrix`.                     |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

## Referenz für `setup`

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen günstige plugin-eigene Metadaten
benötigen, bevor die Laufzeit geladen wird.

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

Top-Level-`cliBackends` bleibt gültig und beschreibt weiterhin CLI-Inferenz-
Backends. `setup.cliBackends` ist die setupspezifische Beschreibungsoberfläche für
Abläufe der Steuerungsebene/des Setups, die nur aus Metadaten bestehen sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
oberfläche „descriptor first“ für die Setup-Discovery. Wenn der Descriptor den
Kandidaten-Plugin nur eingrenzt und das Setup weiterhin reichhaltigere Setup-Laufzeit-Hooks benötigt, setzen Sie `requiresRuntime: true` und behalten `setup-api` als
Fallback-Ausführungspfad bei.

OpenClaw berücksichtigt außerdem `setup.providers[].envVars` in generischen Lookups für Provider-Authentifizierung und Env-Variablen. `providerAuthEnvVars` bleibt über einen Kompatibilitätsadapter während des Deprecation-Zeitraums unterstützt, aber nicht gebündelte Plugins, die es noch verwenden, erhalten eine Manifest-Diagnose. Neue Plugins sollten Setup-/Status-Env-Metadaten auf `setup.providers[].envVars` legen.

OpenClaw kann einfache Setup-Auswahlmöglichkeiten auch aus `setup.providers[].authMethods` ableiten, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false`
deklariert, dass keine Setup-Laufzeit erforderlich ist. Explizite Einträge in `providerAuthChoices` bleiben für benutzerdefinierte Labels, CLI-Flags, Onboarding-Scopes und Assistenten-Metadaten bevorzugt.

Setzen Sie `requiresRuntime: false` nur dann, wenn diese Descriptoren für die
Setup-Oberfläche ausreichen. OpenClaw behandelt explizites `false` als Vertrag „nur Deskriptoren“
und führt für den Setup-Lookup weder `setup-api` noch `openclaw.setupEntry` aus. Wenn
ein Plugin, das nur Descriptoren verwendet, dennoch einen dieser Setup-Laufzeiteinträge mitliefert,
meldet OpenClaw eine additive Diagnose und ignoriert ihn weiterhin. Ein weggelassenes
`requiresRuntime` behält das Legacy-Fallback-Verhalten bei, sodass bestehende Plugins, die
Descriptoren ohne dieses Flag hinzugefügt haben, nicht kaputtgehen.

Da der Setup-Lookup plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte Werte
in `setup.providers[].id` und `setup.cliBackends[]` über alle entdeckten Plugins hinweg eindeutig bleiben. Mehrdeutige Ownership schlägt fail-closed fehl, statt einen Gewinner anhand der Discovery-Reihenfolge auszuwählen.

Wenn die Setup-Laufzeit tatsächlich ausgeführt wird, melden Diagnosen der Setup-Registry Descriptor-Drift, wenn `setup-api` einen Provider oder ein CLI-Backend registriert, das die Manifest-Descriptoren nicht deklarieren, oder wenn ein Descriptor keine passende Laufzeit-Registrierung hat. Diese Diagnosen sind additiv und lehnen Legacy-Plugins nicht ab.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                         |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding verfügbar gemacht wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | IDs der Setup-/Authentifizierungsmethoden, die dieser Provider unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`     | Nein         | `string[]` | Env-Variablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                         |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding verfügbar gemacht werden.           |
| `cliBackends`      | Nein         | `string[]` | Setup-Backend-IDs, die für descriptor-first-Setup-Lookup verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.              |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach dem Descriptor-Lookup weiterhin die Ausführung von `setup-api` benötigt.       |

## Referenz für `uiHints`

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen auf kleine Rendering-Hinweise.

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
| `label`       | `string`   | Benutzerseitiges Feldlabel.               |
| `help`        | `string`   | Kurzer Hilfetext.                         |
| `tags`        | `string[]` | Optionale UI-Tags.                        |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.          |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.     |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Zuständigkeit von Fähigkeiten, die OpenClaw
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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Jede Liste ist optional:

| Feld                             | Typ        | Bedeutung                                                                    |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs von Extension-Factories für den Codex-App-Server, derzeit `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Laufzeit-IDs, für die ein gebündeltes Plugin Tool-Result-Middleware registrieren darf. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Auth-Profile diesem Plugin gehört.      |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                              |
| `realtimeTranscriptionProviders` | `string[]` | Provider-IDs für Realtime-Transkription, die diesem Plugin gehören.          |
| `realtimeVoiceProviders`         | `string[]` | Provider-IDs für Realtime-Voice, die diesem Plugin gehören.                  |
| `memoryEmbeddingProviders`       | `string[]` | Provider-IDs für Memory-Embeddings, die diesem Plugin gehören.               |
| `mediaUnderstandingProviders`    | `string[]` | Provider-IDs für Medienverständnis, die diesem Plugin gehören.               |
| `imageGenerationProviders`       | `string[]` | Provider-IDs für Bildgenerierung, die diesem Plugin gehören.                 |
| `videoGenerationProviders`       | `string[]` | Provider-IDs für Videogenerierung, die diesem Plugin gehören.                |
| `webFetchProviders`              | `string[]` | Provider-IDs für Web-Fetch, die diesem Plugin gehören.                       |
| `webSearchProviders`             | `string[]` | Provider-IDs für Websuche, die diesem Plugin gehören.                        |
| `tools`                          | `string[]` | Namen von Agenten-Tools, die diesem Plugin für Prüfungen gebündelter Verträge gehören. |

`contracts.embeddedExtensionFactories` bleibt für gebündelte
Extension-Factories nur für den Codex-App-Server erhalten. Gebündelte Transformationen von Tool-Ergebnissen sollten stattdessen
`contracts.agentToolResultMiddleware` deklarieren und sich mit
`api.registerAgentToolResultMiddleware(...)` registrieren. Externe Plugins können
keine Tool-Result-Middleware registrieren, weil diese Seam hochvertrauenswürdige Tool-
Ausgaben umschreiben kann, bevor das Modell sie sieht.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten
`contracts.externalAuthProviders` deklarieren. Plugins ohne diese Deklaration laufen
weiterhin über einen veralteten Kompatibilitäts-Fallback, aber dieser Fallback ist langsamer und
wird nach dem Migrationszeitfenster entfernt.

Gebündelte Memory-Embedding-Provider sollten
`contracts.memoryEmbeddingProviders` für jede Adapter-ID deklarieren, die sie bereitstellen, einschließlich
eingebauter Adapter wie `local`. Eigenständige CLI-Pfade verwenden diesen Manifest-
Vertrag, um nur das zuständige Plugin zu laden, bevor die vollständige Gateway-Laufzeit
Provider registriert hat.

## Referenz für `mediaUnderstandingProviderMetadata`

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Provider für Medienverständnis
Standardmodelle, Auto-Auth-Fallback-Priorität oder native Dokumentunterstützung hat, die
generische Core-Helfer benötigen, bevor die Laufzeit geladen wird. Schlüssel müssen außerdem in
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

Jeder Providereintrag kann Folgendes enthalten:

| Feld                   | Typ                                 | Bedeutung                                                                    |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medienfähigkeiten, die dieser Provider bereitstellt.                         |
| `defaultModels`        | `Record<string, string>`            | Standardwerte von Fähigkeit zu Modell, die verwendet werden, wenn die Konfiguration kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden beim automatischen, Credential-basierten Provider-Fallback früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die der Provider unterstützt.                       |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin günstige Konfigurationsmetadaten benötigt, bevor
die Laufzeit geladen wird. Read-only-Discovery von Kanal-Setup/-Status kann diese Metadaten
direkt für konfigurierte externe Kanäle verwenden, wenn kein Setup-Eintrag verfügbar ist oder
wenn `setup.requiresRuntime: false` erklärt, dass keine Setup-Laufzeit erforderlich ist.

Für ein Kanal-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche
Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten auch passende
Einträge in `channelConfigs` deklarieren. Ohne sie kann OpenClaw das Plugin zwar weiterhin laden, aber Cold-Path-Konfigurationsschema, Setup und Control-UI-Oberflächen können die kanalbezogene Form der Optionen nicht kennen, bis die Plugin-Laufzeit ausgeführt wird.

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
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Jeder Kanaleintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                     |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanalkonfigurations-Eintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Hinweise auf sensible Felder für diesen Abschnitt der Kanalkonfiguration. |
| `label`       | `string`                 | Kanal-Label, das in Picker- und Prüfoberflächen zusammengeführt wird, wenn Laufzeitmetadaten nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Prüf- und Katalogoberflächen.                                    |
| `preferOver`  | `string[]`               | Legacy- oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
Kurzform-Modell-IDs wie `gpt-5.5` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit
geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw verwendet diese Priorität:

- explizite Refs `provider/model` verwenden die zugehörigen Manifest-Metadaten aus `providers`
- `modelPatterns` schlagen `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis Benutzer oder Konfiguration einen Provider angeben

Felder:

| Feld            | Typ        | Bedeutung                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die per `startsWith` gegen Kurzform-Modell-IDs geprüft werden.   |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernen des Profilsuffixes gegen Kurzform-Modell-IDs geprüft werden. |

## Referenz für `modelCatalog`

Verwenden Sie `modelCatalog`, wenn OpenClaw Metadaten zu Providermodellen kennen soll, bevor
die Plugin-Laufzeit geladen wird. Dies ist die dem Manifest gehörende Quelle für feste Katalog-
Zeilen, Provider-Aliase, Unterdrückungsregeln und den Discovery-Modus. Laufzeit-Refresh
gehört weiterhin in den Provider-Laufzeitcode, aber das Manifest sagt dem Core, wann Laufzeit
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

| Feld           | Typ                                                      | Bedeutung                                                                                                     |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Schlüssel sollten auch in Top-Level-`providers` erscheinen. |
| `aliases`      | `Record<string, object>`                                 | Provider-Aliase, die für Katalog- oder Suppressions-Planung auf einen besessenen Provider aufgelöst werden sollen. |
| `suppressions` | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus einem providerspezifischen Grund unterdrückt.   |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Ob der Provider-Katalog aus Manifest-Metadaten gelesen, in den Cache aktualisiert oder nur zur Laufzeit bestimmt werden kann. |

Provider-Felder:

| Feld      | Typ                      | Bedeutung                                                                 |
| --------- | ------------------------ | ------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionale Standard-`baseUrl` für Modelle in diesem Provider-Katalog.      |
| `api`     | `ModelApi`               | Optionaler Standard-API-Adapter für Modelle in diesem Provider-Katalog.   |
| `headers` | `Record<string, string>` | Optionale statische Header, die auf diesen Provider-Katalog angewendet werden. |
| `models`  | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.            |

Modell-Felder:

| Feld            | Typ                                                            | Bedeutung                                                                  |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokale Modell-ID ohne Präfix `provider/`.                         |
| `name`          | `string`                                                       | Optionaler Anzeigename.                                                    |
| `api`           | `ModelApi`                                                     | Optionales API-Override pro Modell.                                        |
| `baseUrl`       | `string`                                                       | Optionales `baseUrl`-Override pro Modell.                                  |
| `headers`       | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                     |
| `input`         | `Array<"text" \| "image" \| "document">`                       | Modalitäten, die das Modell akzeptiert.                                    |
| `reasoning`     | `boolean`                                                      | Ob das Modell Reasoning-Verhalten bereitstellt.                            |
| `contextWindow` | `number`                                                       | Natives Kontextfenster des Providers.                                      |
| `contextTokens` | `number`                                                       | Optionale effektive Laufzeitgrenze für Kontext, wenn sie sich von `contextWindow` unterscheidet. |
| `maxTokens`     | `number`                                                       | Maximale Anzahl von Ausgabetokens, wenn bekannt.                           |
| `cost`          | `object`                                                       | Optionale Preise in USD pro Million Tokens, einschließlich optionalem `tieredPricing`. |
| `compat`        | `object`                                                       | Optionale Kompatibilitäts-Flags passend zur OpenClaw-Modellkonfigurations-Kompatibilität. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listing-Status. Unterdrücken Sie nur, wenn die Zeile überhaupt nicht erscheinen darf. |
| `statusReason`  | `string`                                                       | Optionaler Grund, der bei nicht verfügbarem Status angezeigt wird.         |
| `replaces`      | `string[]`                                                     | Ältere provider-lokale Modell-IDs, die dieses Modell ersetzt.              |
| `replacedBy`    | `string`                                                       | Ersatz-provider-lokale Modell-ID für veraltete Zeilen.                     |
| `tags`          | `string[]`                                                     | Stabile Tags, die von Pickern und Filtern verwendet werden.                |

Legen Sie keine rein laufzeitbezogenen Daten in `modelCatalog` ab. Wenn ein Provider Kontostatus,
eine API-Anfrage oder lokale Prozesserkennung braucht, um die vollständige Modellmenge zu kennen,
deklarieren Sie diesen Provider in `discovery` als `refreshable` oder `runtime`.

Veraltete Top-Level-Capability-Schlüssel sind deprecated. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; normales
Manifest-Laden behandelt diese Top-Level-Felder nicht mehr als
Ownership von Fähigkeiten.

## Manifest versus package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Metadaten zu Auth-Auswahlmöglichkeiten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installieren von Abhängigkeiten und den `openclaw`-Block für Einstiegspunkte, Installations-Gating, Setup oder Katalog-Metadaten |

Wenn Sie unsicher sind, wohin ein Metadatum gehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Einstiegsdateien oder npm-Installationsverhalten geht, gehört es in `package.json`

### package.json-Felder, die Discovery beeinflussen

Einige Metadaten für Plugins vor der Laufzeit liegen absichtlich in `package.json` unter dem
Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Einstiegspunkte. Müssen innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                    |
| `openclaw.runtimeExtensions`                                      | Deklariert gebaute JavaScript-Laufzeit-Einstiegspunkte für installierte Pakete. Müssen innerhalb des Plugin-Paketverzeichnisses bleiben.                                            |
| `openclaw.setupEntry`                                             | Leichtgewichtiger Einstiegspunkt nur für Setup, verwendet während Onboarding, verzögertem Kanalstart und Read-only-Discovery von Kanalstatus/SecretRef. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                      | Deklariert den gebauten JavaScript-Setup-Einstiegspunkt für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                              |
| `openclaw.channel`                                                | Günstige Kanal-Katalog-Metadaten wie Labels, Doku-Pfade, Aliase und Auswahltexte.                                                                                                     |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten zur Prüfung des konfigurierten Zustands, die „existiert env-only-Setup bereits?“ beantworten können, ohne die vollständige Kanallaufzeit zu laden.       |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten zur Prüfung des persistierten Auth-Zustands, die „ist bereits irgendwo ein Sign-in vorhanden?“ beantworten können, ohne die vollständige Kanallaufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hinweise für Installation/Update von gebündelten und extern veröffentlichten Plugins.                                                                                                 |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                      |
| `openclaw.install.minHostVersion`                                 | Minimale unterstützte OpenClaw-Host-Version, mit einer Semver-Untergrenze wie `>=2026.3.22`.                                                                                         |
| `openclaw.install.expectedIntegrity`                              | Erwarteter npm-Dist-Integrity-String wie `sha512-...`; Installations- und Update-Abläufe verifizieren das geladene Artefakt dagegen.                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins bei ungültiger Konfiguration.                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Ermöglicht das Laden von Kanaloberflächen nur für Setup vor dem vollständigen Kanal-Plugin während des Starts.                                                                       |

Manifest-Metadaten entscheiden, welche Provider-/Kanal-/Setup-Auswahlmöglichkeiten im
Onboarding erscheinen, bevor die Laufzeit geladen wird. `package.json#openclaw.install` sagt dem
Onboarding, wie dieses Plugin geladen oder aktiviert werden soll, wenn der Benutzer eine dieser
Auswahlmöglichkeiten trifft. Verschieben Sie keine Installationshinweise in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden des
Manifest-Registers erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

Exaktes Pinning von npm-Versionen liegt bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalog-
Einträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Update-Abläufe fail-closed fehlschlagen, wenn das geladene npm-Artefakt nicht mehr zum gepinnten Release passt.
Interaktives Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige npm-Spezifikationen aus der Registry an, einschließlich bloßer Paketnamen und Dist-Tags. Katalogdiagnosen können exakte, gleitende, integritätsgepinne, fehlende Integrität, Paketnamen-Mismatch und ungültige Default-Choice-Quellen unterscheiden. Sie warnen auch, wenn
`expectedIntegrity` vorhanden ist, es aber keine gültige npm-Quelle gibt, auf die es pinnen kann.
Wenn `expectedIntegrity` vorhanden ist,
erzwingen Installations-/Update-Abläufe es; wenn es fehlt, wird die Registry-Auflösung
ohne Integritäts-Pin protokolliert.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Kanalliste
oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige
Laufzeit zu laden. Der Setup-Eintrag sollte Kanal-Metadaten sowie für das Setup sichere Adapter für Konfiguration,
Status und Secrets bereitstellen; Netzwerk-Clients, Gateway-Listener und
Transport-Laufzeiten gehören in den Haupterweiterungs-Einstiegspunkt.

Felder für Laufzeit-Einstiegspunkte überschreiben keine Paketgrenzen-Prüfungen für Quell-
Einstiegspunktfelder. Zum Beispiel kann `openclaw.runtimeExtensions` einen ausbrechenden Pfad in `openclaw.extensions` nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es
macht nicht beliebige kaputte Konfigurationen installierbar. Heute erlaubt es Installationsabläufen nur die Wiederherstellung von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins, wie einem fehlenden gebündelten Plugin-Pfad oder einem veralteten Eintrag `channels.<id>` für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und verweisen Operatoren auf `openclaw doctor --fix`.

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

Verwenden Sie dies, wenn Setup-, Doctor- oder Configured-State-Abläufe vor dem Laden des vollständigen Kanal-Plugins eine günstige Ja/Nein-Prüfung der Authentifizierung benötigen. Das Ziel-Export sollte eine kleine Funktion sein, die nur persistierten Zustand liest; leiten Sie dies nicht über den vollständigen Barrel der Kanal-Laufzeit.

`openclaw.channel.configuredState` verwendet dieselbe Form für günstige, nur auf Env basierende Configured-State-Prüfungen:

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

Verwenden Sie dies, wenn ein Kanal den konfigurierten Zustand aus Env oder anderen kleinen
Nicht-Laufzeit-Eingaben beantworten kann. Wenn die Prüfung volle Konfigurationsauflösung oder die echte
Kanal-Laufzeit benötigt, behalten Sie diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## Vorrang bei Discovery (doppelte Plugin-IDs)

OpenClaw entdeckt Plugins aus mehreren Wurzeln (gebündelt, globale Installation, Workspace, explizit per Konfiguration ausgewählte Pfade). Wenn zwei Discoveries dieselbe `id` teilen, wird nur das Manifest mit dem **höchsten Vorrang** behalten; Duplikate mit niedrigerem Vorrang werden verworfen, statt daneben geladen zu werden.

Vorrang, von hoch nach niedrig:

1. **Per Konfiguration ausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` gepinnt ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Globale Installation** — Plugins, die in die globale OpenClaw-Plugin-Wurzel installiert wurden
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace entdeckt werden

Folgen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich mit einem lokalen zu überschreiben, pinnen Sie es über `plugins.entries.<id>`, damit es per Vorrang gewinnt, statt sich auf Workspace-Discovery zu verlassen.
- Verworfenene Duplikate werden protokolliert, sodass Doctor- und Startdiagnosen auf die verworfene Kopie hinweisen können.

## Anforderungen an das JSON-Schema

- **Jedes Plugin muss ein JSON-Schema mitliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte Schlüssel in `channels.*` sind **Fehler**, es sei denn, die Kanal-ID wird
  von einem Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **entdeckbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein kaputtes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  in Doctor + Logs wird eine **Warnung** angezeigt.

Die vollständige `plugins.*`-Schema-Referenz finden Sie unter [Configuration reference](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest ist nur für Discovery + Validierung da.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommas und nicht in Anführungszeichen gesetzte Schlüssel erlaubt, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifest-Felder werden vom Manifest-Loader gelesen. Vermeiden Sie benutzerdefinierte Top-Level-Schlüssel.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerDiscoveryEntry` muss leichtgewichtig bleiben und sollte keinen breiten Laufzeitcode importieren; verwenden Sie es für statische Provider-Katalogmetadaten oder enge Discovery-Deskriptoren, nicht für Ausführung zur Anfragezeit.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Env-Variablen-Metadaten (`setup.providers[].envVars`, veraltetes `providerAuthEnvVars` und `channelEnvVars`) sind nur deklarativ. Status-, Audit-, Cron-Zustellungsvalidierung und andere Read-only-Oberflächen wenden weiterhin Plugin-Vertrauen und effektive Aktivierungsrichtlinien an, bevor eine Env-Variable als konfiguriert behandelt wird.
- Für Wizard-Metadaten zur Laufzeit, die Provider-Code benötigen, siehe [Provider runtime hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Anforderungen an Allowlist des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Verwandt

<CardGroup cols={3}>
  <Card title="Plugins erstellen" href="/de/plugins/building-plugins" icon="rocket">
    Einstieg in Plugins.
  </Card>
  <Card title="Plugin-Architektur" href="/de/plugins/architecture" icon="diagram-project">
    Interne Architektur und Fähigkeitsmodell.
  </Card>
  <Card title="SDK-Überblick" href="/de/plugins/sdk-overview" icon="book">
    Referenz für das Plugin SDK und Subpath-Importe.
  </Card>
</CardGroup>
