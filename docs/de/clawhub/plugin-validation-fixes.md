---
read_when:
    - Sie haben `clawhub package validate` ausgeführt und müssen Plugin-Befunde beheben
    - ClawHub hat die Veröffentlichung eines Plugin-Pakets abgelehnt oder eine Warnung ausgegeben
    - Sie aktualisieren Plugin-Paketmetadaten vor der Veröffentlichung
summary: Validierungsbefunde für ClawHub-Plugin-Pakete vor der Veröffentlichung beheben
title: Plugin-Validierungskorrekturen
x-i18n:
    generated_at: "2026-07-03T02:46:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Fehlerbehebungen bei der Plugin-Validierung

ClawHub validiert Plugin-Pakete vor der Veröffentlichung und kann außerdem Befunde aus
automatisierten Paket-Scans anzeigen. Diese Seite behandelt Befunde für Autorinnen und Autoren, also
Befunde, die Plugin-Autorinnen und -Autoren in ihren Paketmetadaten, ihrem Manifest, ihren SDK-
Importen oder ihrem veröffentlichten Artefakt beheben können.

Sie behandelt keine internen Abdeckungsbefunde des Plugin Inspector. Wenn ein vollständiger Bericht
Scanner-Wartungscodes ohne Hinweise zur Behebung durch Autorinnen und Autoren enthält, sind diese
für OpenClaw-Maintainer und nicht für Plugin-Autorinnen und -Autoren bestimmt.

Führen Sie nach jeder Fehlerbehebung erneut aus:

```bash
clawhub package validate <path-to-plugin>
```

## Befunde für Autorinnen und Autoren

| Code                                    | Hier beginnen                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Paketmetadaten hinzufügen](/de/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Den package-openclaw-Block hinzufügen](/de/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                          |
| `package-openclaw-entry-missing`        | [OpenClaw-Paket-Entrypoints deklarieren](/de/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                           |
| `package-entrypoint-missing`            | [Den deklarierten Entrypoint veröffentlichen](/de/clawhub/plugin-validation-fixes#package-entrypoint-missing)                          |
| `package-install-metadata-incomplete`   | [Installationsmetadaten vervollständigen](/de/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                     |
| `package-plugin-api-compat-missing`     | [Plugin-API-Kompatibilität deklarieren](/de/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                         |
| `package-min-host-version-drift`        | [Minimale Host-Version angleichen](/de/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                 |
| `package-manifest-version-drift`        | [Paket- und Manifest-Versionen angleichen](/de/clawhub/plugin-validation-fixes#package-manifest-version-drift)                         |
| `package-openclaw-unsupported-metadata` | [Nicht unterstützte OpenClaw-Paketmetadaten entfernen](/de/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)      |
| `package-npm-pack-unavailable`          | [Das npm-Artefakt paketierbar machen](/de/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                |
| `package-npm-pack-entrypoint-missing`   | [Entrypoints in die npm-pack-Ausgabe aufnehmen](/de/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)               |
| `package-npm-pack-metadata-missing`     | [Metadaten in die npm-pack-Ausgabe aufnehmen](/de/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                   |
| `manifest-name-missing`                 | [Anzeigenamen im Manifest hinzufügen](/de/clawhub/plugin-validation-fixes#manifest-name-missing)                                       |
| `manifest-unknown-fields`               | [Nicht unterstützte Manifest-Felder entfernen](/de/clawhub/plugin-validation-fixes#manifest-unknown-fields)                           |
| `manifest-unknown-contracts`            | [Nicht unterstützte Vertragsschlüssel entfernen](/de/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                       |
| `legacy-root-sdk-import`                | [Root-SDK-Importe ersetzen](/de/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                                |
| `reserved-sdk-import`                   | [Reservierte SDK-Importe entfernen](/de/clawhub/plugin-validation-fixes#reserved-sdk-import)                                           |
| `sdk-load-session-store`                | [Zugriff auf den gesamten Sitzungsspeicher ersetzen](/de/clawhub/plugin-validation-fixes#sdk-load-session-store)                      |
| `sdk-session-store-write`               | [Schreibvorgänge auf den gesamten Sitzungsspeicher ersetzen](/de/clawhub/plugin-validation-fixes#sdk-session-store-write)             |
| `sdk-session-file-helper`               | [Hilfsfunktionen für Sitzungsdateipfade ersetzen](/de/clawhub/plugin-validation-fixes#sdk-session-file-helper)                        |
| `sdk-session-transcript-file-target`    | [Legacy-Transkriptdateiziele ersetzen](/de/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                        |
| `sdk-session-transcript-low-level`      | [Low-Level-Transkript-Hilfsfunktionen ersetzen](/de/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                 |
| `legacy-before-agent-start`             | [before_agent_start ersetzen](/de/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                          |
| `provider-auth-env-vars`                | [Provider-Env-Vars in Setup-Metadaten verschieben](/de/clawhub/plugin-validation-fixes#provider-auth-env-vars)                        |
| `channel-env-vars`                      | [Channel-Env-Vars in aktuellen Metadaten spiegeln](/de/clawhub/plugin-validation-fixes#channel-env-vars)                              |
| `security-manifest-schema-unavailable`  | [Nicht verfügbare Sicherheitsmanifest-Schema-Referenzen entfernen](/de/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Nicht unterstützte Sicherheitsmanifest-Dateien entfernen](/de/clawhub/plugin-validation-fixes#unrecognized-security-manifest)         |

## Paketmetadaten

### package-json-missing

Der Paket-Root enthält keine `package.json`, daher kann ClawHub das
npm-Paket, die Version, Entrypoints oder OpenClaw-Metadaten nicht identifizieren.

- Fügen Sie `package.json` mit `name`, `version` und `type` hinzu.
- Fügen Sie einen `openclaw`-Block hinzu, wenn das Paket ein OpenClaw-Plugin ausliefert.
- Verwenden Sie [Plugins erstellen](/de/plugins/building-plugins) für ein minimales Paketbeispiel
  und [Plugin-Manifest](/de/plugins/manifest#manifest-versus-packagejson)
  für die Trennung zwischen Paket und Manifest.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-openclaw-metadata-missing

Das Paket enthält `package.json`, deklariert aber keine OpenClaw-Paketmetadaten.

- Fügen Sie `package.json#openclaw` hinzu.
- Nehmen Sie Entrypoint-Metadaten wie `openclaw.extensions` oder
  `openclaw.runtimeExtensions` auf.
- Fügen Sie Kompatibilitäts- und Installationsmetadaten hinzu, wenn das Paket über ClawHub veröffentlicht oder
  installiert wird.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-openclaw-entry-missing

Die Paketmetadaten sind vorhanden, deklarieren aber keinen OpenClaw-Runtime-
Entrypoint.

- Fügen Sie `openclaw.extensions` für native Plugin-Entrypoints hinzu.
- Fügen Sie `openclaw.runtimeExtensions` hinzu, wenn das veröffentlichte Paket gebautes
  JavaScript laden soll.
- Belassen Sie alle Entrypoint-Pfade innerhalb des Paketverzeichnisses.
- Siehe [Plugin-Entrypoints](/de/plugins/sdk-entrypoints) und
  [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-entrypoint-missing

Das Paket deklariert einen OpenClaw-Entrypoint, aber die referenzierte Datei fehlt
in dem validierten Paket.

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
- Verwenden Sie `openclaw.install.minHostVersion` für die minimale OpenClaw-Host-Version.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-plugin-api-compat-missing

Das Paket deklariert nicht den unterstützten OpenClaw-Plugin-API-Bereich.

- Fügen Sie `openclaw.compat.pluginApi` zu `package.json` hinzu.
- Verwenden Sie die OpenClaw-Plugin-API-Version oder Semver-Untergrenze, gegen die Sie gebaut und getestet
  haben.
- Halten Sie dies getrennt von der Paketversion. Die Paketversion beschreibt das
  Plugin-Release; `openclaw.compat.pluginApi` beschreibt den Host-API-Vertrag.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-min-host-version-drift

Die minimale Host-Version des Pakets stimmt nicht mit den OpenClaw-Versionsmetadaten überein,
gegen die das Paket gebaut wurde.

- Prüfen Sie `openclaw.install.minHostVersion`.
- Prüfen Sie alle OpenClaw-Build-Metadaten im Paket, etwa die während des Release
  verwendete OpenClaw-Version.
- Gleichen Sie die minimale Host-Version an den Host-Versionsbereich an, den das Paket
  tatsächlich unterstützt.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-manifest-version-drift

Die Paketversion und die Plugin-Manifest-Version stimmen nicht überein.

- Bevorzugen Sie `package.json#version` als Paket-Release-Version.
- Wenn `openclaw.plugin.json` ebenfalls `version` enthält, aktualisieren Sie sie entsprechend oder entfernen Sie
  veraltete Manifest-Versionsmetadaten, wenn Paketmetadaten maßgeblich sind.
- Veröffentlichen Sie nach der Änderung veröffentlichter Metadaten eine neue Paketversion.
- Siehe [Plugin-Manifest](/de/plugins/manifest).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-openclaw-unsupported-metadata

Der Block `package.json#openclaw` enthält Felder, die nicht als
OpenClaw-Paketmetadaten unterstützt werden.

- Entfernen Sie nicht unterstützte Felder wie `openclaw.bundle`.
- Belassen Sie native Plugin-Metadaten in `openclaw.plugin.json`.
- Belassen Sie Paket-Entrypoints, Kompatibilitäts-, Installations-, Setup- und Katalogmetadaten
  in unterstützten `package.json#openclaw`-Feldern.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Veröffentlichtes Artefakt

### package-npm-pack-unavailable

Das Paket kann nicht zu dem Artefakt gepackt werden, das ClawHub prüfen oder
veröffentlichen würde.

- Führen Sie `npm pack --dry-run` aus dem Paket-Root aus.
- Beheben Sie ungültige Paketmetadaten, defekte Lifecycle-Skripte oder files-Einträge, die
  das Packen fehlschlagen lassen.
- Entfernen Sie `private: true`, wenn dieses Paket öffentlich veröffentlicht werden soll.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-npm-pack-entrypoint-missing

Das Paket kann gepackt werden, aber das gepackte Artefakt enthält nicht die
Entrypoint-Dateien, die in `package.json#openclaw` deklariert sind.

- Führen Sie `npm pack --dry-run` aus und prüfen Sie die Dateien, die enthalten wären.
- Bauen Sie generierte Entrypoints vor dem Packen.
- Aktualisieren Sie `files`, `.npmignore` oder die Build-Ausgabe, sodass deklarierte Entrypoints
  enthalten sind.
- Siehe [Plugin-Entrypoints](/de/plugins/sdk-entrypoints).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-npm-pack-metadata-missing

Dem gepackten Artefakt fehlen OpenClaw-Metadaten, die in Ihrem Quellpaket
vorhanden sind.

- Führen Sie `npm pack --dry-run` aus und prüfen Sie die enthaltenen Metadatendateien.
- Stellen Sie sicher, dass `package.json` den Block `openclaw` im gepackten Artefakt enthält.
- Stellen Sie sicher, dass `openclaw.plugin.json` enthalten ist, wenn das Paket ein natives
  OpenClaw-Plugin ist.
- Aktualisieren Sie `files` oder `.npmignore`, damit Paketmetadaten nicht ausgeschlossen werden.
- Siehe [Plugins erstellen](/de/plugins/building-plugins).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Manifest-Metadaten

### manifest-name-missing

Das native Plugin-Manifest enthält keinen Anzeigenamen.

- Fügen Sie `openclaw.plugin.json` ein nicht leeres Feld `name` hinzu.
- Halten Sie `name` menschenlesbar und behalten Sie `id` als stabile Maschinen-ID bei.
- Siehe [Plugin-Manifest](/de/plugins/manifest).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### manifest-unknown-fields

Das Plugin-Manifest enthält Felder auf oberster Ebene, die OpenClaw nicht unterstützt.

- Vergleichen Sie jedes Feld auf oberster Ebene mit der
  [Manifest-Feldreferenz](/de/plugins/manifest#top-level-field-reference).
- Entfernen Sie benutzerdefinierte Felder aus `openclaw.plugin.json`.
- Verschieben Sie Paket- oder Installationsmetadaten in unterstützte `package.json#openclaw`-Felder
  statt in das Manifest.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### manifest-unknown-contracts

Das Manifest deklariert nicht unterstützte Schlüssel innerhalb von `contracts`.

- Vergleichen Sie jeden Schlüssel unter `contracts` mit der
  [contracts-Referenz](/de/plugins/manifest#contracts-reference).
- Entfernen Sie nicht unterstützte Vertragsschlüssel.
- Verschieben Sie Laufzeitverhalten in den Plugin-Registrierungscode und beschränken Sie `contracts`
  auf statische Metadaten zum Besitz von Funktionen.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## SDK- und Kompatibilitätsmigration

### legacy-root-sdk-import

Das Plugin importiert aus dem veralteten Root-SDK-Barrel:
`openclaw/plugin-sdk`.

- Ersetzen Sie Root-Barrel-Importe durch gezielte öffentliche Subpath-Importe.
- Verwenden Sie `openclaw/plugin-sdk/plugin-entry` für `definePluginEntry`.
- Verwenden Sie `openclaw/plugin-sdk/channel-core` für Channel-Entry-Helfer.
- Verwenden Sie [Importkonventionen](/de/plugins/building-plugins#import-conventions) und
  [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths), um den engen Import zu finden.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### reserved-sdk-import

Das Plugin importiert einen SDK-Pfad, der für gebündelte Plugins oder interne
Kompatibilität reserviert ist.

- Ersetzen Sie reservierte interne OpenClaw-SDK-Importe durch dokumentierte öffentliche
  `openclaw/plugin-sdk/*`-Subpaths.
- Wenn das Verhalten kein öffentliches SDK hat, behalten Sie den Helfer in Ihrem Paket oder
  fordern Sie eine öffentliche OpenClaw-API an.
- Verwenden Sie [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths) und
  [SDK-Migration](/de/plugins/sdk-migration), um einen unterstützten Import auszuwählen.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-load-session-store

Das Plugin verwendet weiterhin den veralteten Helfer für den gesamten Sitzungsspeicher
`loadSessionStore`.

- Verwenden Sie `getSessionEntry(...)` oder `listSessionEntries(...)`, wenn Sie Sitzungsstatus
  lesen.
- Verwenden Sie `patchSessionEntry(...)` oder `upsertSessionEntry(...)`, wenn Sie Sitzungsstatus
  schreiben.
- Vermeiden Sie es, das gesamte Sitzungsspeicherobjekt zu laden, zu verändern und zu speichern.
- Behalten Sie `loadSessionStore(...)` nur bei, solange Ihr deklarierter Kompatibilitätsbereich
  noch ältere OpenClaw-Versionen unterstützt, die dies erfordern.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-session-store-write

Das Plugin verwendet weiterhin einen veralteten Schreibhelfer für den gesamten Sitzungsspeicher, etwa
`saveSessionStore` oder `updateSessionStore`.

- Verwenden Sie `patchSessionEntry(...)`, wenn Sie Felder eines vorhandenen Sitzungseintrags
  aktualisieren.
- Verwenden Sie `upsertSessionEntry(...)`, wenn Sie einen Sitzungseintrag ersetzen oder erstellen.
- Vermeiden Sie es, das gesamte Sitzungsspeicherobjekt zu laden, zu verändern und zu speichern.
- Behalten Sie Schreibhelfer für den gesamten Speicher nur bei, solange Ihr deklarierter Kompatibilitätsbereich
  noch ältere OpenClaw-Versionen unterstützt, die diese erfordern.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-session-file-helper

Das Plugin verwendet weiterhin veraltete Helfer für Sitzungsdateipfade, etwa
`resolveSessionFilePath` oder `resolveAndPersistSessionFile`.

- Verwenden Sie `getSessionEntry(...)`, um Sitzungsmetadaten nach Agent- und Sitzungsidentität
  zu lesen.
- Verwenden Sie `patchSessionEntry(...)` oder `upsertSessionEntry(...)`, um Sitzungsmetadaten
  dauerhaft zu speichern.
- Verwenden Sie Transkriptidentitäts- oder Zielhelfer, wenn der Code eine
  Transkriptoperation vorbereitet.
- Speichern Sie keine veralteten Transkriptdateipfade dauerhaft und machen Sie sich nicht von ihnen abhängig.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-session-transcript-file-target

Das Plugin verwendet weiterhin den veralteten Transkriptdateiziel-Helfer
`resolveSessionTranscriptLegacyFileTarget`.

- Verwenden Sie `resolveSessionTranscriptIdentity(...)`, wenn der Code nur die öffentliche
  Sitzungsidentität benötigt.
- Verwenden Sie `resolveSessionTranscriptTarget(...)`, wenn der Code ein strukturiertes
  Ziel für eine Transkriptoperation benötigt.
- Vermeiden Sie es, veraltete Transkriptdateiziele direkt zu lesen oder zu konstruieren.
- Behalten Sie den veralteten Helfer nur bei, solange Ihr deklarierter Kompatibilitätsbereich noch
  ältere OpenClaw-Versionen unterstützt, die ihn erfordern.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-session-transcript-low-level

Das Plugin verwendet weiterhin veraltete Low-Level-Transkripthelfer, etwa
`appendSessionTranscriptMessage` oder `emitSessionTranscriptUpdate`.

- Verwenden Sie `appendSessionTranscriptMessageByIdentity(...)` für Transkript-Anfügungen.
- Verwenden Sie `publishSessionTranscriptUpdateByIdentity(...)` für Benachrichtigungen zu
  Transkriptaktualisierungen.
- Bevorzugen Sie die strukturierte Transkript-Laufzeitoberfläche, damit OpenClaw die
  korrekten Transaktionsgrenzen und die korrekte Identitätsbehandlung anwenden kann.
- Behalten Sie Low-Level-Transkripthelfer nur bei, solange Ihr deklarierter Kompatibilitätsbereich
  noch ältere OpenClaw-Versionen unterstützt, die diese erfordern.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### legacy-before-agent-start

Das Plugin verwendet weiterhin den veralteten Hook `before_agent_start`.

- Verschieben Sie Arbeiten zum Überschreiben von Modell oder Provider nach `before_model_resolve`.
- Verschieben Sie Arbeiten an Prompt- oder Kontextänderungen nach `before_prompt_build`.
- Behalten Sie `before_agent_start` nur bei, solange Ihr deklarierter Kompatibilitätsbereich noch
  ältere OpenClaw-Versionen unterstützt, die ihn erfordern.
- Siehe [Hooks](/de/plugins/hooks) und
  [Plugin-Kompatibilität](/de/plugins/compatibility).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### provider-auth-env-vars

Das Manifest verwendet weiterhin veraltete `providerAuthEnvVars`-Provider-Authentifizierungsmetadaten.

- Spiegeln Sie Provider-Env-Var-Metadaten nach `setup.providers[].envVars`.
- Behalten Sie `providerAuthEnvVars` nur als Kompatibilitätsmetadaten bei, solange Ihr unterstützter
  OpenClaw-Bereich sie noch benötigt.
- Siehe [Setup-Referenz](/de/plugins/manifest#setup-reference) und
  [SDK-Migration](/de/plugins/sdk-migration).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### channel-env-vars

Das Manifest verwendet veraltete oder ältere Channel-Env-Var-Metadaten ohne die aktuellen
Setup- oder Konfigurationsmetadaten, die ClawHub erwartet.

- Halten Sie Channel-Env-Var-Metadaten deklarativ, damit OpenClaw den Setup-Status prüfen kann,
  ohne die Channel-Laufzeit zu laden.
- Spiegeln Sie Env-gesteuertes Channel-Setup in das aktuelle Setup, die Channel-Konfiguration oder
  die Paket-Channel-Metadaten, die von Ihrer Plugin-Struktur verwendet werden.
- Behalten Sie `channelEnvVars` nur als Kompatibilitätsmetadaten bei, solange ältere unterstützte
  OpenClaw-Versionen sie noch erfordern.
- Siehe [Plugin-Manifest](/de/plugins/manifest) und
  [Channel-Plugins](/de/plugins/sdk-channel-plugins).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Sicherheitsmanifest

### security-manifest-schema-unavailable

Das Paket liefert `openclaw.security.json` mit einer Schemareferenz aus, die ClawHub
nicht als verfügbar erkennt.

- Entfernen Sie die Schema-URL, wenn sie nur Hinweischarakter hat.
- Verwenden Sie ein dokumentiertes versioniertes Schema erst, nachdem OpenClaw eines veröffentlicht hat.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### unrecognized-security-manifest

Das Paket liefert eine nicht unterstützte Sicherheitsmanifestdatei aus.

- Entfernen Sie `openclaw.security.json`, bis OpenClaw ein versioniertes Sicherheitsmanifest-Schema
  und das ClawHub-Verhalten dokumentiert.
- Dokumentieren Sie sicherheitssensibles Verhalten in Ihrer öffentlichen Paketdokumentation oder
  README, bis der Manifestvertrag existiert.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Verwandt

- [ClawHub-CLI](/de/clawhub/cli)
- [ClawHub-Veröffentlichung](/de/clawhub/publishing)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Plugin-Kompatibilität](/de/plugins/compatibility)
