---
read_when:
    - Sie haben `clawhub package validate` ausgeführt und müssen die Plugin-Befunde beheben.
    - ClawHub hat die Veröffentlichung eines Plugin-Pakets abgelehnt oder eine Warnung ausgegeben
    - Sie aktualisieren vor der Veröffentlichung die Metadaten des Plugin-Pakets
summary: Beheben Sie vor der Veröffentlichung die Beanstandungen bei der Validierung von ClawHub-Plugin-Paketen
title: Korrekturen bei der Plugin-Validierung
x-i18n:
    generated_at: "2026-07-12T01:29:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Fehlerbehebung bei der Plugin-Validierung

ClawHub validiert Plugin-Pakete vor der Veröffentlichung und kann außerdem Befunde aus automatisierten Paketscans anzeigen. Diese Seite behandelt Befunde für Autoren, also Befunde, die der Plugin-Autor in den Paketmetadaten, im Manifest, in SDK-Importen oder im veröffentlichten Artefakt beheben kann.

Interne Befunde zur Abdeckung durch den Plugin Inspector werden hier nicht behandelt. Wenn ein vollständiger Bericht Codes zur Scanner-Wartung ohne Hinweise zur Behebung durch Autoren enthält, richten sich diese an OpenClaw-Maintainer und nicht an Plugin-Autoren.

Führen Sie nach jeder Fehlerbehebung erneut Folgendes aus:

```bash
clawhub package validate <path-to-plugin>
```

## Befunde für Autoren

| Code                                    | Beginnen Sie hier                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Paketmetadaten hinzufügen](/de/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [OpenClaw-Block zum Paket hinzufügen](/de/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw-Paketeinstiegspunkte deklarieren](/de/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Deklarierten Einstiegspunkt veröffentlichen](/de/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Installationsmetadaten vervollständigen](/de/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Kompatibilität mit der Plugin-API deklarieren](/de/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Mindestversion des Hosts abgleichen](/de/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Paket- und Manifestversionen abgleichen](/de/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Nicht unterstützte OpenClaw-Paketmetadaten entfernen](/de/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm-Artefakt paketierbar machen](/de/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Einstiegspunkte in die npm-Packausgabe aufnehmen](/de/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Metadaten in die npm-Packausgabe aufnehmen](/de/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Anzeigenamen zum Manifest hinzufügen](/de/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Nicht unterstützte Manifestfelder entfernen](/de/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Nicht unterstützte Vertragsschlüssel entfernen](/de/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [SDK-Importe aus dem Stamm ersetzen](/de/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Reservierte SDK-Importe entfernen](/de/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Zugriff auf den gesamten Sitzungsspeicher ersetzen](/de/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Schreibzugriffe auf den gesamten Sitzungsspeicher ersetzen](/de/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Hilfsfunktionen für Sitzungspfade ersetzen](/de/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Veraltete Transkriptdateiziele ersetzen](/de/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Low-Level-Hilfsfunktionen für Transkripte ersetzen](/de/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [`before_agent_start` ersetzen](/de/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Umgebungsvariablen des Providers in Setup-Metadaten verschieben](/de/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Umgebungsvariablen des Kanals in aktuellen Metadaten spiegeln](/de/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Nicht verfügbare Verweise auf Sicherheitsmanifestschemas entfernen](/de/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Nicht unterstützte Sicherheitsmanifestdateien entfernen](/de/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Paketmetadaten

### package-json-missing

Das Stammverzeichnis des Pakets enthält keine `package.json`, sodass ClawHub das npm-Paket, die Version, die Einstiegspunkte oder die OpenClaw-Metadaten nicht identifizieren kann.

- Fügen Sie eine `package.json` mit `name`, `version` und `type` hinzu.
- Fügen Sie einen `openclaw`-Block hinzu, wenn das Paket ein OpenClaw-Plugin ausliefert.
- Verwenden Sie [Plugins erstellen](/de/plugins/building-plugins) für ein minimales Paketbeispiel und [Plugin-Manifest](/de/plugins/manifest#manifest-versus-packagejson) für die Trennung zwischen Paket und Manifest.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-openclaw-metadata-missing

Das Paket enthält eine `package.json`, deklariert jedoch keine OpenClaw-Paketmetadaten.

- Fügen Sie `package.json#openclaw` hinzu.
- Fügen Sie Metadaten zu Einstiegspunkten wie `openclaw.extensions` oder `openclaw.runtimeExtensions` hinzu.
- Fügen Sie Kompatibilitäts- und Installationsmetadaten hinzu, wenn das Paket über ClawHub veröffentlicht oder installiert werden soll.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-openclaw-entry-missing

Die Paketmetadaten sind vorhanden, deklarieren jedoch keinen OpenClaw-Laufzeiteinstiegspunkt.

- Fügen Sie `openclaw.extensions` für native Plugin-Einstiegspunkte hinzu.
- Fügen Sie `openclaw.runtimeExtensions` hinzu, wenn das veröffentlichte Paket erstelltes JavaScript laden soll.
- Belassen Sie alle Einstiegspunktpfade innerhalb des Paketverzeichnisses.
- Siehe [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints) und [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-entrypoint-missing

Das Paket deklariert einen OpenClaw-Einstiegspunkt, aber die referenzierte Datei fehlt im zu validierenden Paket.

- Prüfen Sie jeden Pfad in `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` und `openclaw.runtimeSetupEntry`.
- Erstellen Sie das Paket, wenn der Einstiegspunkt in `dist` generiert wird.
- Aktualisieren Sie die Metadaten, wenn der Einstiegspunkt verschoben wurde.
- Siehe [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-install-metadata-incomplete

ClawHub kann nicht ermitteln, wie das Paket installiert oder aktualisiert werden soll.

- Füllen Sie `openclaw.install` mit der unterstützten Installationsquelle aus, beispielsweise `clawhubSpec`, `npmSpec` oder `localPath`.
- Legen Sie `openclaw.install.defaultChoice` fest, wenn mehr als eine Installationsquelle verfügbar ist.
- Verwenden Sie `openclaw.install.minHostVersion` für die mindestens erforderliche OpenClaw-Hostversion.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-plugin-api-compat-missing

Das Paket deklariert nicht den unterstützten Versionsbereich der OpenClaw-Plugin-API.

- Fügen Sie `openclaw.compat.pluginApi` zur `package.json` hinzu.
- Verwenden Sie die OpenClaw-Plugin-API-Version oder die minimale SemVer-Version, gegen die Sie entwickelt und getestet haben.
- Halten Sie diese Angabe von der Paketversion getrennt. Die Paketversion beschreibt die Plugin-Veröffentlichung; `openclaw.compat.pluginApi` beschreibt den API-Vertrag des Hosts.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-min-host-version-drift

Die minimale Hostversion des Pakets stimmt nicht mit den OpenClaw-Versionsmetadaten überein, gegen die das Paket erstellt wurde.

- Prüfen Sie `openclaw.install.minHostVersion`.
- Prüfen Sie alle OpenClaw-Build-Metadaten im Paket, beispielsweise die bei der Veröffentlichung verwendete OpenClaw-Version.
- Gleichen Sie die minimale Hostversion mit dem tatsächlich vom Paket unterstützten Hostversionsbereich ab.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-manifest-version-drift

Die Paketversion und die Version des Plugin-Manifests stimmen nicht überein.

- Verwenden Sie vorzugsweise `package.json#version` als Veröffentlichungsversion des Pakets.
- Wenn `openclaw.plugin.json` ebenfalls `version` enthält, aktualisieren Sie sie entsprechend oder entfernen Sie veraltete Versionsmetadaten aus dem Manifest, wenn die Paketmetadaten maßgeblich sind.
- Veröffentlichen Sie nach der Änderung veröffentlichter Metadaten eine neue Paketversion.
- Siehe [Plugin-Manifest](/de/plugins/manifest).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-openclaw-unsupported-metadata

Der Block `package.json#openclaw` enthält Felder, die nicht als OpenClaw-Paketmetadaten unterstützt werden.

- Entfernen Sie nicht unterstützte Felder wie `openclaw.bundle`.
- Bewahren Sie Metadaten nativer Plugins in `openclaw.plugin.json` auf.
- Bewahren Sie Paket-Einstiegspunkte sowie Kompatibilitäts-, Installations-, Setup- und Katalogmetadaten in unterstützten `package.json#openclaw`-Feldern auf.
- Siehe [package.json-Felder, die die Erkennung beeinflussen](/de/plugins/manifest#packagejson-fields-that-affect-discovery).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Veröffentlichtes Artefakt

### package-npm-pack-unavailable

Das Paket kann nicht in das Artefakt gepackt werden, das ClawHub prüfen oder veröffentlichen würde.

- Führen Sie `npm pack --dry-run` im Stammverzeichnis des Pakets aus.
- Beheben Sie ungültige Paketmetadaten, fehlerhafte Lebenszyklusskripte oder `files`-Einträge, die das Packen verhindern.
- Entfernen Sie `private: true`, wenn dieses Paket öffentlich veröffentlicht werden soll.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-npm-pack-entrypoint-missing

Das Paket kann gepackt werden, aber das gepackte Artefakt enthält nicht die in `package.json#openclaw` deklarierten Einstiegspunktdateien.

- Führen Sie `npm pack --dry-run` aus und prüfen Sie die Dateien, die enthalten wären.
- Erstellen Sie generierte Einstiegspunkte vor dem Packen.
- Aktualisieren Sie `files`, `.npmignore` oder die Build-Ausgabe, sodass die deklarierten Einstiegspunkte enthalten sind.
- Siehe [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### package-npm-pack-metadata-missing

Im gepackten Artefakt fehlen OpenClaw-Metadaten, die in Ihrem Quellpaket vorhanden sind.

- Führen Sie `npm pack --dry-run` aus und prüfen Sie die enthaltenen Metadatendateien.
- Stellen Sie sicher, dass `package.json` im gepackten Artefakt den `openclaw`-Block enthält.
- Stellen Sie sicher, dass `openclaw.plugin.json` enthalten ist, wenn es sich bei dem Paket um ein natives OpenClaw-Plugin handelt.
- Aktualisieren Sie `files` oder `.npmignore`, sodass Paketmetadaten nicht ausgeschlossen werden.
- Siehe [Plugins erstellen](/de/plugins/building-plugins).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Manifestmetadaten

### manifest-name-missing

Das native Plugin-Manifest enthält keinen Anzeigenamen.

- Fügen Sie `openclaw.plugin.json` ein nicht leeres Feld `name` hinzu.
- Verwenden Sie für `name` eine menschenlesbare Bezeichnung und für `id` die stabile Maschinen-ID.
- Siehe [Plugin-Manifest](/de/plugins/manifest).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### manifest-unknown-fields

Das Plugin-Manifest enthält Felder auf oberster Ebene, die OpenClaw nicht unterstützt.

- Vergleichen Sie jedes Feld auf oberster Ebene mit der
  [Referenz der Manifest-Felder](/de/plugins/manifest#top-level-field-reference).
- Entfernen Sie benutzerdefinierte Felder aus `openclaw.plugin.json`.
- Verschieben Sie Paket- oder Installationsmetadaten in unterstützte Felder unter `package.json#openclaw`
  statt in das Manifest.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### manifest-unknown-contracts

Das Manifest deklariert nicht unterstützte Schlüssel innerhalb von `contracts`.

- Vergleichen Sie jeden Schlüssel unter `contracts` mit der
  [Referenz für Verträge](/de/plugins/manifest#contracts-reference).
- Entfernen Sie nicht unterstützte Vertragsschlüssel.
- Verschieben Sie das Laufzeitverhalten in den Registrierungscode des Plugins und beschränken Sie `contracts`
  auf statische Metadaten zur Zuständigkeit für Fähigkeiten.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## SDK- und Kompatibilitätsmigration

### legacy-root-sdk-import

Das Plugin importiert aus dem veralteten zentralen SDK-Barrel:
`openclaw/plugin-sdk`.

- Ersetzen Sie Importe aus dem zentralen Barrel durch gezielte Importe aus öffentlichen Unterpfaden.
- Verwenden Sie `openclaw/plugin-sdk/plugin-entry` für `definePluginEntry`.
- Verwenden Sie `openclaw/plugin-sdk/channel-core` für Hilfsfunktionen von Kanal-Einstiegspunkten.
- Verwenden Sie [Importkonventionen](/de/plugins/building-plugins#import-conventions) und
  [Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths), um den passenden spezifischen Import zu finden.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### reserved-sdk-import

Das Plugin importiert einen SDK-Pfad, der gebündelten Plugins oder der internen
Kompatibilität vorbehalten ist.

- Ersetzen Sie reservierte interne SDK-Importe von OpenClaw durch dokumentierte öffentliche
  Unterpfade unter `openclaw/plugin-sdk/*`.
- Wenn für das Verhalten kein öffentliches SDK verfügbar ist, belassen Sie die Hilfsfunktion in Ihrem Paket oder
  beantragen Sie eine öffentliche OpenClaw-API.
- Verwenden Sie [Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths) und
  [SDK-Migration](/de/plugins/sdk-migration), um einen unterstützten Import auszuwählen.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-load-session-store

Das Plugin verwendet weiterhin die veraltete Hilfsfunktion für den gesamten Sitzungsspeicher
`loadSessionStore`.

- Verwenden Sie beim Lesen des Sitzungsstatus `getSessionEntry(...)` oder `listSessionEntries(...)`.
- Verwenden Sie beim Schreiben des Sitzungsstatus `patchSessionEntry(...)` oder `upsertSessionEntry(...)`.
- Vermeiden Sie es, das gesamte Sitzungsspeicherobjekt zu laden, zu ändern und zu speichern.
- Behalten Sie `loadSessionStore(...)` nur bei, solange Ihr deklarierter Kompatibilitätsbereich
  ältere OpenClaw-Versionen unterstützt, die diese Funktion benötigen.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-session-store-write

Das Plugin verwendet weiterhin eine veraltete Schreibhilfsfunktion für den gesamten Sitzungsspeicher, beispielsweise
`saveSessionStore` oder `updateSessionStore`.

- Verwenden Sie `patchSessionEntry(...)`, wenn Sie Felder eines vorhandenen Sitzungseintrags aktualisieren.
- Verwenden Sie `upsertSessionEntry(...)`, wenn Sie einen Sitzungseintrag ersetzen oder erstellen.
- Vermeiden Sie es, das gesamte Sitzungsspeicherobjekt zu laden, zu ändern und zu speichern.
- Behalten Sie Schreibhilfsfunktionen für den gesamten Speicher nur bei, solange Ihr deklarierter Kompatibilitätsbereich
  ältere OpenClaw-Versionen unterstützt, die diese Funktionen benötigen.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-session-file-helper

Das Plugin verwendet weiterhin veraltete Hilfsfunktionen für Sitzungspfade, beispielsweise
`resolveSessionFilePath` oder `resolveAndPersistSessionFile`.

- Verwenden Sie `getSessionEntry(...)`, um Sitzungsmetadaten anhand der Agenten- und Sitzungsidentität
  zu lesen.
- Verwenden Sie `patchSessionEntry(...)` oder `upsertSessionEntry(...)`, um Sitzungsmetadaten
  dauerhaft zu speichern.
- Verwenden Sie Hilfsfunktionen für die Transkriptidentität oder das Transkriptziel, wenn der Code einen
  Transkriptvorgang vorbereitet.
- Speichern Sie keine veralteten Transkriptdateipfade und machen Sie sich nicht von ihnen abhängig.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-session-transcript-file-target

Das Plugin verwendet weiterhin die veraltete Hilfsfunktion für Transkriptdateiziele
`resolveSessionTranscriptLegacyFileTarget`.

- Verwenden Sie `resolveSessionTranscriptIdentity(...)`, wenn der Code lediglich die öffentliche
  Sitzungsidentität benötigt.
- Verwenden Sie `resolveSessionTranscriptTarget(...)`, wenn der Code ein strukturiertes
  Ziel für einen Transkriptvorgang benötigt.
- Vermeiden Sie es, veraltete Transkriptdateiziele direkt zu lesen oder zu erstellen.
- Behalten Sie die veraltete Hilfsfunktion nur bei, solange Ihr deklarierter Kompatibilitätsbereich
  ältere OpenClaw-Versionen unterstützt, die sie benötigen.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### sdk-session-transcript-low-level

Das Plugin verwendet weiterhin veraltete Low-Level-Hilfsfunktionen für Transkripte, beispielsweise
`appendSessionTranscriptMessage` oder `emitSessionTranscriptUpdate`.

- Verwenden Sie `appendSessionTranscriptMessageByIdentity(...)`, um Einträge an Transkripte anzuhängen.
- Verwenden Sie `publishSessionTranscriptUpdateByIdentity(...)` für Benachrichtigungen über
  Transkriptaktualisierungen.
- Bevorzugen Sie die strukturierte Transkript-Laufzeitschnittstelle, damit OpenClaw die
  korrekten Transaktionsgrenzen und die richtige Identitätsverarbeitung anwenden kann.
- Behalten Sie Low-Level-Hilfsfunktionen für Transkripte nur bei, solange Ihr deklarierter Kompatibilitätsbereich
  ältere OpenClaw-Versionen unterstützt, die sie benötigen.
- Siehe [Laufzeit-API](/de/plugins/sdk-runtime#agent-session-state) und
  [Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### legacy-before-agent-start

Das Plugin verwendet weiterhin den veralteten Hook `before_agent_start`.

- Verschieben Sie Überschreibungen des Modells oder Providers nach `before_model_resolve`.
- Verschieben Sie Änderungen am Prompt oder Kontext nach `before_prompt_build`.
- Behalten Sie `before_agent_start` nur bei, solange Ihr deklarierter Kompatibilitätsbereich
  ältere OpenClaw-Versionen unterstützt, die diesen Hook benötigen.
- Siehe [Hooks](/de/plugins/hooks) und
  [Plugin-Kompatibilität](/de/plugins/compatibility).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### provider-auth-env-vars

Das Manifest verwendet weiterhin die veralteten Provider-Authentifizierungsmetadaten `providerAuthEnvVars`.

- Übernehmen Sie die Metadaten zu Provider-Umgebungsvariablen in `setup.providers[].envVars`.
- Behalten Sie `providerAuthEnvVars` nur als Kompatibilitätsmetadaten bei, solange Ihr unterstützter
  OpenClaw-Versionsbereich sie noch benötigt.
- Siehe [Setup-Referenz](/de/plugins/manifest#setup-reference) und
  [SDK-Migration](/de/plugins/sdk-migration).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### channel-env-vars

Das Manifest verwendet veraltete oder ältere Metadaten zu Kanal-Umgebungsvariablen ohne die aktuellen
Setup- oder Konfigurationsmetadaten, die ClawHub erwartet.

- Halten Sie Metadaten zu Kanal-Umgebungsvariablen deklarativ, damit OpenClaw den Setup-Status prüfen kann,
  ohne die Kanallaufzeit zu laden.
- Übernehmen Sie die umgebungsvariablengesteuerte Kanaleinrichtung in die aktuellen Setup-, Kanalkonfigurations- oder
  Paket-Kanalmetadaten, die von Ihrer Plugin-Struktur verwendet werden.
- Behalten Sie `channelEnvVars` nur als Kompatibilitätsmetadaten bei, solange ältere unterstützte
  OpenClaw-Versionen sie noch benötigen.
- Siehe [Plugin-Manifest](/de/plugins/manifest) und
  [Kanal-Plugins](/de/plugins/sdk-channel-plugins).
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Sicherheitsmanifest

### security-manifest-schema-unavailable

Das Paket enthält `openclaw.security.json` mit einem Schemaverweis, den ClawHub
nicht als verfügbar erkennt.

- Entfernen Sie die Schema-URL, wenn sie nur als Hinweis dient.
- Verwenden Sie ein dokumentiertes versioniertes Schema erst, nachdem OpenClaw eines veröffentlicht hat.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

### unrecognized-security-manifest

Das Paket enthält eine nicht unterstützte Sicherheitsmanifestdatei.

- Entfernen Sie `openclaw.security.json`, bis OpenClaw ein versioniertes Schema für Sicherheitsmanifeste
  und das zugehörige ClawHub-Verhalten dokumentiert.
- Dokumentieren Sie sicherheitsrelevantes Verhalten bis zur Verfügbarkeit des Manifestvertrags in Ihrer öffentlichen Paketdokumentation oder
  README.
- Führen Sie `clawhub package validate <path-to-plugin>` erneut aus.

## Verwandte Themen

- [ClawHub-CLI](/de/clawhub/cli)
- [Veröffentlichen auf ClawHub](/de/clawhub/publishing)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Plugin-Kompatibilität](/de/plugins/compatibility)
