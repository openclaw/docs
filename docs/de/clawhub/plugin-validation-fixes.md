---
read_when:
    - Sie haben clawhub package validate ausgeführt und müssen Plugin-Befunde beheben
    - ClawHub hat das Veröffentlichen eines Plugin-Pakets abgelehnt oder davor gewarnt
    - Sie aktualisieren die Plugin-Paketmetadaten vor dem Release
summary: Validierungsbefunde für ClawHub-Plugin-Pakete vor der Veröffentlichung beheben
title: Plugin-Validierungskorrekturen
x-i18n:
    generated_at: "2026-06-28T05:30:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Fehlerbehebungen bei der Plugin-Validierung

ClawHub validiert Plugin-Pakete vor der Veröffentlichung und kann außerdem Befunde aus
automatisierten Paketscans anzeigen. Diese Seite behandelt Befunde für Autoren, also
Befunde, die der Plugin-Autor in den Paketmetadaten, im Manifest, in SDK-Importen
oder im veröffentlichten Artefakt beheben kann.

Sie behandelt keine internen Abdeckungsbefunde des Plugin Inspector. Wenn ein vollständiger Bericht
Scanner-Wartungscodes ohne Anleitung zur Behebung durch Autoren enthält, sind diese
für OpenClaw-Maintainer statt für Plugin-Autoren bestimmt.

Führen Sie nach jeder Korrektur erneut aus:

```bash
clawhub package validate <path-to-plugin>
```

## Befunde für Autoren

| Code                                    | Beginnen Sie hier                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Paketmetadaten hinzufügen](/de/clawhub/plugin-validation-fixes#package-json-missing)                                        |
| `package-openclaw-metadata-missing`     | [Den openclaw-Block des Pakets hinzufügen](/de/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)            |
| `package-openclaw-entry-missing`        | [OpenClaw-Paket-Entrypoints deklarieren](/de/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                 |
| `package-entrypoint-missing`            | [Den deklarierten Entrypoint veröffentlichen](/de/clawhub/plugin-validation-fixes#package-entrypoint-missing)                |
| `package-install-metadata-incomplete`   | [Installationsmetadaten vervollständigen](/de/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)           |
| `package-plugin-api-compat-missing`     | [Plugin-API-Kompatibilität deklarieren](/de/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)               |
| `package-min-host-version-drift`        | [Minimale Hostversion abgleichen](/de/clawhub/plugin-validation-fixes#package-min-host-version-drift)                        |
| `package-manifest-version-drift`        | [Paket- und Manifestversionen abgleichen](/de/clawhub/plugin-validation-fixes#package-manifest-version-drift)                |
| `package-openclaw-unsupported-metadata` | [Nicht unterstützte OpenClaw-Paketmetadaten entfernen](/de/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Das npm-Artefakt packbar machen](/de/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                          |
| `package-npm-pack-entrypoint-missing`   | [Entrypoints in die npm-Pack-Ausgabe aufnehmen](/de/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)     |
| `package-npm-pack-metadata-missing`     | [Metadaten in die npm-Pack-Ausgabe aufnehmen](/de/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)         |
| `manifest-name-missing`                 | [Einen Anzeigenamen im Manifest hinzufügen](/de/clawhub/plugin-validation-fixes#manifest-name-missing)                       |
| `manifest-unknown-fields`               | [Nicht unterstützte Manifestfelder entfernen](/de/clawhub/plugin-validation-fixes#manifest-unknown-fields)                   |
| `manifest-unknown-contracts`            | [Nicht unterstützte Vertragsschlüssel entfernen](/de/clawhub/plugin-validation-fixes#manifest-unknown-contracts)             |
| `legacy-root-sdk-import`                | [Root-SDK-Importe ersetzen](/de/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                      |
| `reserved-sdk-import`                   | [Reservierte SDK-Importe entfernen](/de/clawhub/plugin-validation-fixes#reserved-sdk-import)                                 |
| `sdk-load-session-store`                | [Zugriff auf den gesamten Session Store ersetzen](/de/clawhub/plugin-validation-fixes#sdk-load-session-store)                |
| `legacy-before-agent-start`             | [before_agent_start ersetzen](/de/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                 |
| `provider-auth-env-vars`                | [Provider-Umgebungsvariablen in Setup-Metadaten verschieben](/de/clawhub/plugin-validation-fixes#provider-auth-env-vars)     |
| `channel-env-vars`                      | [Kanal-Umgebungsvariablen in aktuellen Metadaten spiegeln](/de/clawhub/plugin-validation-fixes#channel-env-vars)             |
| `security-manifest-schema-unavailable`  | [Nicht verfügbare Sicherheitsmanifest-Schema-Referenzen entfernen](/de/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Nicht unterstützte Sicherheitsmanifestdateien entfernen](/de/clawhub/plugin-validation-fixes#unrecognized-security-manifest) |

## Paketmetadaten

### package-json-missing

Der Paket-Root enthält keine `package.json`, daher kann ClawHub das
npm-Paket, die Version, Entrypoints oder OpenClaw-Metadaten nicht identifizieren.

- Fügen Sie eine `package.json` mit `name`, `version` und `type` hinzu.
- Fügen Sie einen `openclaw`-Block hinzu, wenn das Paket ein OpenClaw-Plugin ausliefert.
- Verwenden Sie [Plugins erstellen](/de/plugins/building-plugins) für ein minimales Paketbeispiel
  und [Plugin-Manifest](/de/plugins/manifest#manifest-versus-packagejson)
  für die Trennung zwischen Paket und Manifest.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-openclaw-metadata-missing

Das Paket hat eine `package.json`, deklariert aber keine OpenClaw-Paketmetadaten.

- Fügen Sie `package.json#openclaw` hinzu.
- Nehmen Sie Entrypoint-Metadaten wie `openclaw.extensions` oder
  `openclaw.runtimeExtensions` auf.
- Fügen Sie Kompatibilitäts- und Installationsmetadaten hinzu, wenn das Paket über ClawHub
  veröffentlicht oder installiert werden soll.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-openclaw-entry-missing

Die Paketmetadaten sind vorhanden, deklarieren aber keinen OpenClaw-Runtime-Entrypoint.

- Fügen Sie `openclaw.extensions` für native Plugin-Entrypoints hinzu.
- Fügen Sie `openclaw.runtimeExtensions` hinzu, wenn das veröffentlichte Paket gebautes
  JavaScript laden soll.
- Belassen Sie alle Entrypoint-Pfade innerhalb des Paketverzeichnisses.
- Siehe [Plugin-Entrypoints](/de/plugins/sdk-entrypoints) und
  [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-entrypoint-missing

Das Paket deklariert einen OpenClaw-Entrypoint, aber die referenzierte Datei fehlt
im validierten Paket.

- Prüfen Sie jeden Pfad in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` und `openclaw.runtimeSetupEntry`.
- Bauen Sie das Paket, wenn der Entrypoint nach `dist` generiert wird.
- Aktualisieren Sie die Metadaten, wenn der Entrypoint verschoben wurde.
- Siehe [Plugin-Entrypoints](/de/plugins/sdk-entrypoints).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-install-metadata-incomplete

ClawHub kann nicht erkennen, wie das Paket installiert oder aktualisiert werden soll.

- Füllen Sie `openclaw.install` mit der unterstützten Installationsquelle aus, etwa
  `clawhubSpec`, `npmSpec` oder `localPath`.
- Setzen Sie `openclaw.install.defaultChoice`, wenn mehr als eine Installationsquelle
  verfügbar ist.
- Verwenden Sie `openclaw.install.minHostVersion` für die minimale OpenClaw-Hostversion.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-plugin-api-compat-missing

Das Paket deklariert nicht, welchen OpenClaw-Plugin-API-Bereich es unterstützt.

- Fügen Sie `openclaw.compat.pluginApi` zur `package.json` hinzu.
- Verwenden Sie die OpenClaw-Plugin-API-Version oder die SemVer-Untergrenze, gegen die Sie gebaut
  und getestet haben.
- Halten Sie dies von der Paketversion getrennt. Die Paketversion beschreibt das
  Plugin-Release; `openclaw.compat.pluginApi` beschreibt den Host-API-Vertrag.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-min-host-version-drift

Die minimale Hostversion des Pakets stimmt nicht mit den OpenClaw-Versionsmetadaten überein,
gegen die das Paket gebaut wurde.

- Prüfen Sie `openclaw.install.minHostVersion`.
- Prüfen Sie alle OpenClaw-Build-Metadaten im Paket, etwa die OpenClaw-Version,
  die während des Releases verwendet wurde.
- Gleichen Sie die minimale Hostversion an den Hostversionsbereich an, den das Paket
  tatsächlich unterstützt.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-manifest-version-drift

Die Paketversion und die Plugin-Manifestversion stimmen nicht überein.

- Bevorzugen Sie `package.json#version` als Paket-Release-Version.
- Wenn `openclaw.plugin.json` ebenfalls `version` enthält, aktualisieren Sie sie, damit sie übereinstimmt,
  oder entfernen Sie veraltete Manifestversionsmetadaten, wenn Paketmetadaten maßgeblich sind.
- Veröffentlichen Sie nach dem Ändern veröffentlichter Metadaten eine neue Paketversion.
- Siehe [Plugin-Manifest](/de/plugins/manifest).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-openclaw-unsupported-metadata

Der Block `package.json#openclaw` enthält Felder, die nicht als
OpenClaw-Paketmetadaten unterstützt werden.

- Entfernen Sie nicht unterstützte Felder wie `openclaw.bundle`.
- Behalten Sie native Plugin-Metadaten in `openclaw.plugin.json`.
- Behalten Sie Paket-Entrypoints, Kompatibilitäts-, Installations-, Setup- und Katalogmetadaten
  in unterstützten `package.json#openclaw`-Feldern.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Veröffentlichtes Artefakt

### package-npm-pack-unavailable

Das Paket kann nicht in das Artefakt gepackt werden, das ClawHub prüfen oder
veröffentlichen würde.

- Führen Sie `npm pack --dry-run` aus dem Paket-Root aus.
- Beheben Sie ungültige Paketmetadaten, defekte Lifecycle-Skripte oder Dateieinträge, die
  das Packen fehlschlagen lassen.
- Entfernen Sie `private: true`, wenn dieses Paket für die öffentliche Veröffentlichung vorgesehen ist.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-npm-pack-entrypoint-missing

Das Paket kann gepackt werden, aber das gepackte Artefakt enthält nicht die
Entrypoint-Dateien, die in `package.json#openclaw` deklariert sind.

- Führen Sie `npm pack --dry-run` aus und prüfen Sie die Dateien, die aufgenommen würden.
- Bauen Sie generierte Entrypoints vor dem Packen.
- Aktualisieren Sie `files`, `.npmignore` oder die Build-Ausgabe, damit deklarierte Entrypoints
  aufgenommen werden.
- Siehe [Plugin-Entrypoints](/de/plugins/sdk-entrypoints).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-npm-pack-metadata-missing

Dem gepackten Artefakt fehlen OpenClaw-Metadaten, die in Ihrem Quellpaket
vorhanden sind.

- Führen Sie `npm pack --dry-run` aus und prüfen Sie die enthaltenen Metadatendateien.
- Stellen Sie sicher, dass `package.json` den `openclaw`-Block im gepackten Artefakt enthält.
- Stellen Sie sicher, dass `openclaw.plugin.json` enthalten ist, wenn das Paket ein natives
  OpenClaw-Plugin ist.
- Aktualisieren Sie `files` oder `.npmignore`, damit Paketmetadaten nicht ausgeschlossen werden.
- Siehe [Plugins erstellen](/de/plugins/building-plugins).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Manifestmetadaten

### manifest-name-missing

Das native Plugin-Manifest enthält keinen Anzeigenamen.

- Fügen Sie ein nicht leeres `name`-Feld zu `openclaw.plugin.json` hinzu.
- Halten Sie `name` menschenlesbar und behalten Sie `id` als stabile Maschinen-ID bei.
- Siehe [Plugin-Manifest](/de/plugins/manifest).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### manifest-unknown-fields

Das Plugin-Manifest enthält Top-Level-Felder, die OpenClaw nicht unterstützt.

- Vergleichen Sie jedes Feld der obersten Ebene mit der
  [Manifest-Feldreferenz](/de/plugins/manifest#top-level-field-reference).
- Entfernen Sie benutzerdefinierte Felder aus `openclaw.plugin.json`.
- Verschieben Sie Paket- oder Installationsmetadaten stattdessen in unterstützte `package.json#openclaw`-Felder
  anstelle des Manifests.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### manifest-unknown-contracts

Das Manifest deklariert nicht unterstützte Schlüssel innerhalb von `contracts`.

- Vergleichen Sie jeden Schlüssel unter `contracts` mit der
  [Contracts-Referenz](/de/plugins/manifest#contracts-reference).
- Entfernen Sie nicht unterstützte Contract-Schlüssel.
- Verschieben Sie Laufzeitverhalten in den Plugin-Registrierungscode und beschränken Sie `contracts`
  auf statische Metadaten zum Capability-Besitz.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## SDK- und Kompatibilitätsmigration

### legacy-root-sdk-import

Das Plugin importiert aus dem veralteten Root-SDK-Barrel:
`openclaw/plugin-sdk`.

- Ersetzen Sie Root-Barrel-Importe durch gezielte öffentliche Subpath-Importe.
- Verwenden Sie `openclaw/plugin-sdk/plugin-entry` für `definePluginEntry`.
- Verwenden Sie `openclaw/plugin-sdk/channel-core` für Channel-Entry-Helfer.
- Verwenden Sie [Importkonventionen](/de/plugins/building-plugins#import-conventions) und
  [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths), um den schmalen Import zu finden.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### reserved-sdk-import

Das Plugin importiert einen SDK-Pfad, der gebündelten Plugins oder interner
Kompatibilität vorbehalten ist.

- Ersetzen Sie reservierte interne OpenClaw-SDK-Importe durch dokumentierte öffentliche
  `openclaw/plugin-sdk/*`-Subpaths.
- Wenn das Verhalten kein öffentliches SDK hat, behalten Sie den Helfer in Ihrem Paket oder
  fordern Sie eine öffentliche OpenClaw-API an.
- Verwenden Sie [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths) und
  [SDK-Migration](/de/plugins/sdk-migration), um einen unterstützten Import auszuwählen.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-load-session-store

Das Plugin verwendet noch den veralteten Helfer für den gesamten Session Store
`loadSessionStore`.

- Verwenden Sie `getSessionEntry(...)` oder `listSessionEntries(...)`, wenn Sie Sitzungsstatus
  lesen.
- Verwenden Sie `patchSessionEntry(...)` oder `upsertSessionEntry(...)`, wenn Sie Sitzungsstatus
  schreiben.
- Vermeiden Sie es, das gesamte Session-Store-Objekt zu laden, zu verändern und zu speichern.
- Behalten Sie `loadSessionStore(...)` nur bei, solange Ihr deklarierter Kompatibilitätsbereich
  noch ältere OpenClaw-Versionen unterstützt, die es benötigen.
- Siehe [Runtime-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### legacy-before-agent-start

Das Plugin verwendet noch den Legacy-Hook `before_agent_start`.

- Verschieben Sie Arbeit an Modell- oder Provider-Overrides nach `before_model_resolve`.
- Verschieben Sie Arbeit an Prompt- oder Kontextänderungen nach `before_prompt_build`.
- Behalten Sie `before_agent_start` nur bei, solange Ihr deklarierter Kompatibilitätsbereich noch
  ältere OpenClaw-Versionen unterstützt, die es benötigen.
- Siehe [Hooks](/de/plugins/hooks) und
  [Plugin-Kompatibilität](/de/plugins/compatibility).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### provider-auth-env-vars

Das Manifest verwendet noch Legacy-Provider-Auth-Metadaten `providerAuthEnvVars`.

- Spiegeln Sie Provider-Env-Var-Metadaten in `setup.providers[].envVars`.
- Behalten Sie `providerAuthEnvVars` nur als Kompatibilitätsmetadaten bei, solange Ihr unterstützter
  OpenClaw-Bereich sie noch benötigt.
- Siehe [Setup-Referenz](/de/plugins/manifest#setup-reference) und
  [SDK-Migration](/de/plugins/sdk-migration).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### channel-env-vars

Das Manifest verwendet Legacy- oder ältere Channel-Env-Var-Metadaten ohne die aktuellen
Setup- oder Konfigurationsmetadaten, die ClawHub erwartet.

- Halten Sie Channel-Env-Var-Metadaten deklarativ, damit OpenClaw den Setup-Status prüfen kann,
  ohne die Channel-Laufzeit zu laden.
- Spiegeln Sie Env-gesteuertes Channel-Setup in die aktuelle Setup-, Channel-Konfiguration oder
  Paket-Channel-Metadaten, die Ihre Plugin-Struktur verwendet.
- Behalten Sie `channelEnvVars` nur als Kompatibilitätsmetadaten bei, solange ältere unterstützte
  OpenClaw-Versionen sie noch benötigen.
- Siehe [Plugin-Manifest](/de/plugins/manifest) und
  [Channel-Plugins](/de/plugins/sdk-channel-plugins).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Sicherheitsmanifest

### security-manifest-schema-unavailable

Das Paket liefert `openclaw.security.json` mit einer Schema-Referenz aus, die ClawHub
nicht als verfügbar erkennt.

- Entfernen Sie die Schema-URL, wenn sie nur hinweisenden Charakter hat.
- Verwenden Sie ein dokumentiertes versioniertes Schema erst, nachdem OpenClaw eines veröffentlicht hat.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### unrecognized-security-manifest

Das Paket liefert eine nicht unterstützte Sicherheitsmanifestdatei aus.

- Entfernen Sie `openclaw.security.json`, bis OpenClaw ein versioniertes Sicherheitsmanifest-Schema
  und das ClawHub-Verhalten dokumentiert.
- Halten Sie sicherheitsrelevantes Verhalten in Ihrer öffentlichen Paketdokumentation oder
  README dokumentiert, bis der Manifest-Contract existiert.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Verwandt

- [ClawHub CLI](/de/clawhub/cli)
- [ClawHub-Veröffentlichung](/de/clawhub/publishing)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Plugin-Kompatibilität](/de/plugins/compatibility)
