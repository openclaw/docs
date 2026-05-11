---
read_when:
    - Suche nach Definitionen öffentlicher Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Betreiber-Checkliste, Validierungsboxen, Versionsbenennung und Veröffentlichungsrhythmus
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-11T20:36:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der fortlaufende Stand von `main`

## Versionsbenennung

- Version eines Stable-Release: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines Stable-Korrektur-Release: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version eines Beta-Prerelease: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit Nullen auffüllen
- `latest` bezeichnet das aktuell hochgestufte stabile npm-Release
- `beta` bezeichnet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können ausdrücklich `latest` ansteuern oder einen geprüften Beta-Build später hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Package und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Package-Pfad, während
  Build, Signierung und Notarisierung der Mac-App für Stable vorbehalten sind, sofern nicht ausdrücklich angefordert

## Release-Takt

- Releases laufen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise aus einem Branch `release/YYYY.M.D`, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, schneiden Maintainer
  den nächsten `-beta.N`-Tag, statt den alten Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Prozedur, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt den öffentlichen Ablauf des Release-Flows. Private Zugangsdaten,
Signierung, Notarisierung, Wiederherstellung von Dist-Tags und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neuesten Stand pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle CI von `main` grün genug ist, um daraus zu branchen.
2. Den obersten Abschnitt von `CHANGELOG.md` anhand der echten Commit-Historie mit
   `/changelog` neu schreiben, Einträge nutzerorientiert halten, committen, pushen und vor dem Branching
   noch einmal rebasen/pullen.
3. Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren, warum sie
   bewusst beibehalten wird.
4. `release/YYYY.M.D` aus dem aktuellen `main` erstellen; normale Release-Arbeit nicht
   direkt auf `main` durchführen.
5. Alle erforderlichen Versionsstellen für den vorgesehenen Tag anheben, dann
   `pnpm release:prep` ausführen. Es aktualisiert Plugin-Versionen, Plugin-Inventar, Konfigurationsschema,
   Metadaten der gebündelten Kanal-Konfiguration, Baseline der Konfigurationsdokumentation, Plugin-SDK-
   Exporte und Plugin-SDK-API-Baseline in der richtigen Reihenfolge. Generierten
   Drift vor dem Tagging committen. Anschließend den lokalen deterministischen Preflight ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-stelliger Release-Branch-SHA für reine Validierungs-
   Preflights zulässig. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, Tag oder vollständigen Commit-SHA starten. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA-Lab und Paket.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch fixen und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Package-Profil, Provider- oder Modell-Allowlist erneut ausführen, die
   den Fix belegt. Den vollständigen Umbrella nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Beta `vYYYY.M.D-beta.N` taggen, dann `OpenClaw Release Publish` aus
   dem passenden Branch `release/YYYY.M.D` ausführen. Es verifiziert `pnpm plugins:sync:check`,
   dispatcht alle veröffentlichbaren Plugin-Packages parallel an npm und denselben Satz an
   ClawHub und stuft anschließend das vorbereitete OpenClaw-npm-Preflight-
   Artefakt mit dem passenden Dist-Tag hoch, sobald die npm-Veröffentlichung der Plugins erfolgreich ist.
   Nachdem der untergeordnete OpenClaw-npm-Publish erfolgreich ist, erstellt oder aktualisiert es die
   passende GitHub-Release-/Prerelease-Seite aus dem vollständigen passenden
   Abschnitt von `CHANGELOG.md`. Stable-Releases, die auf npm `latest` veröffentlicht werden, werden zum
   neuesten GitHub-Release; Stable-Wartungsreleases, die auf npm `beta` bleiben, werden
   mit GitHub `latest=false` erstellt.
   Die ClawHub-Veröffentlichung kann noch laufen, während OpenClaw npm veröffentlicht, aber der
   Release-Publish-Workflow gibt die IDs der untergeordneten Läufe sofort aus. Standardmäßig
   wartet er nach dem Dispatch nicht auf ClawHub, sodass die npm-Verfügbarkeit von OpenClaw
   nicht durch langsamere ClawHub-Freigaben oder Registry-Arbeit blockiert wird; setzen Sie
   `wait_for_clawhub=true`, wenn ClawHub den Abschluss des Workflows blockieren muss. Der
   ClawHub-Pfad wiederholt transiente Installationsfehler von CLI-Abhängigkeiten, veröffentlicht
   Plugins mit bestandener Vorschau auch dann, wenn eine Vorschauzelle flaket, und endet mit
   Registry-Verifizierung für jede erwartete Plugin-Version, sodass Teilveröffentlichungen
   sichtbar und wiederholbar bleiben. Führen Sie nach der Veröffentlichung
   die Post-Publish-Package-
   Acceptance gegen das veröffentlichte Package `openclaw@YYYY.M.D-beta.N` oder
   `openclaw@beta` aus. Wenn ein gepushter oder veröffentlichter Prerelease einen Fix benötigt,
   schneiden Sie die nächste passende Prerelease-Nummer; löschen oder überschreiben Sie den alten
   Prerelease nicht.
10. Für Stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die stabile npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` wieder; die Bereitschaft für das stabile macOS-Release erfordert außerdem die
    paketierten Dateien `.zip`, `.dmg`, `.dSYM.zip` und eine aktualisierte `appcast.xml` auf `main`.
    Der private macOS-Publish-Workflow veröffentlicht den signierten Appcast automatisch auf dem öffentlichen
    `main`, nachdem die Release-Artefakte verifiziert wurden; wenn Branch-Protection den direkten Push blockiert,
    öffnet oder aktualisiert er einen Appcast-PR.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifizierer ausführen, optional eigenständiges
    Telegram-E2E gegen veröffentlichtes npm, wenn Sie Kanalnachweis nach der Veröffentlichung benötigen,
    Dist-Tag-Hochstufung bei Bedarf durchführen, die generierte GitHub-Release-Seite verifizieren
    und die Schritte für die Release-Ankündigung ausführen.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor der Release-Preflight aus, damit Test-TypeScript
  außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor der Release-Preflight aus, damit die breiteren
  Importzyklus- und Architekturgrenzen-Prüfungen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:prep` nach dem Versions-Bump im Root und vor dem Tagging aus. Es
  führt jeden deterministischen Release-Generator aus, der nach einer
  Versions-/Config-/API-Änderung häufig driftet: Plugin-Versionen, Plugin-Inventar, Basis-Config-
  Schema, gebündelte Channel-Config-Metadaten, Config-Dokumentations-Baseline, Plugin-SDK-
  Exporte und Plugin-SDK-API-Baseline. `pnpm release:check` führt diese
  Guards im Prüfmodus erneut aus und meldet jeden gefundenen generierten Drift-Fehler in einem
  Durchlauf, bevor die Paket-Release-Prüfungen ausgeführt werden.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um
  alle Vorab-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, startet manuell `CI` und startet
  `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-
  Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stabile/standardmäßige Läufe
  behalten umfassende Live-/E2E- und Docker-Release-Pfad-Soaks hinter
  `run_release_soak=true`; `release_profile=full` erzwingt den Soak. Mit
  `release_profile=full` und `rerun_group=all` wird außerdem Paket-Telegram-
  E2E gegen das Artefakt `release-package-under-test` aus den Release Checks ausgeführt.
  Geben Sie `release_package_spec` nach der Veröffentlichung einer Beta an, um das ausgelieferte
  npm-Paket über Release Checks, Package Acceptance und Paket-Telegram-
  E2E hinweg wiederzuverwenden, ohne den Release-Tarball neu zu bauen. Geben Sie
  `npm_telegram_package_spec` nur an, wenn Telegram ein anderes
  veröffentlichtes Paket als der Rest der Release-Validierung verwenden soll. Geben Sie
  `package_acceptance_package_spec` an, wenn Package Acceptance ein
  anderes veröffentlichtes Paket als die Release-Paketspezifikation verwenden soll. Geben Sie
  `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die
  Validierung einem veröffentlichten npm-Paket entspricht, ohne Telegram E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweise
  für einen Paketkandidaten wünschen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen `package_ref`-Branch/-Tag/-SHA mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem
  SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-
  Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die
  ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paket-
  Artefakt der Kandidat und `published_upgrade_survivor_baseline` wählt
  die veröffentlichte Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket als
  sowohl die installierte CLI als auch das Package-under-Test, sodass der
  Managed-Restart-Pfad des Update-Befehls des Kandidaten geprüft wird.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Übliche Profile:
  - `smoke`: Install-/Channel-/Agent-, Gateway-Netzwerk- und Config-Reload-Lanes
  - `package`: artefaktnahe Paket-/Update-/Restart-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Channels, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten erneuten Lauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-
  Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen die Changed-
  Eingrenzung und erzwingen die Linux-Node-Shards, gebündelte Plugin-Shards, Channel-
  Contracts, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke,
  Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-
  Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es führt
  QA-Lab über einen lokalen OTLP/HTTP-Receiver aus und verifiziert die exportierten Trace-
  Span-Namen, begrenzten Attribute und Inhalts-/Identifier-Redaktion, ohne
  Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die mutierende Veröffentlichungssequenz aus, nachdem der
  Tag existiert. Starten Sie ihn von `release/YYYY.M.D` aus (oder von `main`, wenn ein
  von main erreichbarer Tag veröffentlicht wird), übergeben Sie den Release-Tag und die erfolgreiche OpenClaw-npm-
  `preflight_run_id`, und behalten Sie den standardmäßigen Plugin-Veröffentlichungsumfang
  `all-publishable` bei, sofern Sie nicht bewusst eine fokussierte Reparatur ausführen. Der
  Workflow serialisiert Plugin-npm-Veröffentlichung, Plugin-ClawHub-Veröffentlichung und OpenClaw-
  npm-Veröffentlichung, damit das Core-Paket nicht vor seinen externalisierten
  Plugins veröffentlicht wird.
- Release Checks laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem die QA-Lab-Mock-Paritäts-Lane sowie das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane vor der Release-Freigabe aus. Die Live-
  Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-
  Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständiges Matrix-
  Transport-, Medien- und E2EE-Inventar parallel wünschen.
- Cross-OS-Installations- und Upgrade-Laufzeitvalidierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz,
  deterministisch und artefaktorientiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release Checks mit Secrets sollten über `Full Release
Validation` oder vom `main`-/Release-Workflow-Ref gestartet werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Die nur validierende Preflight von `OpenClaw NPM Release` akzeptiert außerdem den aktuellen
  vollständigen 40-stelligen Workflow-Branch-Commit-SHA, ohne einen gepushten Tag zu verlangen
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung
  überführt werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; echte Veröffentlichung erfordert weiterhin einen echten Release-Tag
- Beide Workflows halten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den beiden Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Die npm-Release-Preflight wartet nicht mehr auf die separate Release-Checks-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder den passenden Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den Installationspfad der veröffentlichten Registry
  in einem frischen temporären Prefix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Installed-Package-Onboarding, Telegram-Einrichtung und echtes Telegram E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Credential-
  Pool zu verifizieren. Lokale Maintainer-Einmalläufe können die Convex-Variablen weglassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einer Maintainer-Maschine auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, startet `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über GitHub Actions mit dem
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist bewusst nur manuell
  und läuft nicht bei jedem Merge.
- Die Maintainer-Release-Automatisierung verwendet jetzt Preflight-then-Promote:
  - echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestanden haben
  - die echte npm-Veröffentlichung muss von demselben `main`- oder
    `release/YYYY.M.D`-Branch wie der erfolgreiche Preflight-Lauf gestartet werden
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann explizit über Workflow-Eingabe `latest` ansteuern
  - tokenbasierte npm-Dist-Tag-Mutation lebt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo OIDC-only-Veröffentlichung beibehält
  - öffentliches `macOS Release` ist nur Validierung; wenn ein Tag nur auf einem
    Release-Branch existiert, der Workflow aber von `main` gestartet wird, setzen Sie
    `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestanden haben
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie
    erneut neu zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier
  außerdem denselben temporären Prefix-Upgrade-Pfad von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen ältere globale Installationen nicht stillschweigend auf dem
  Basis-Stable-Payload belassen können
- Die npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Einstiegspunkte und
  Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das
  fehlende Plugin-Laufzeit-Payloads ausliefert, schlägt im Postpublish-Verifier fehl und
  kann nicht auf `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliches Pack-Bloat
  vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit CI-Planung, Timing-Manifeste von Plugins oder
  Plugin-Testmatrizen berührt hat, regenerieren und prüfen Sie die planner-eigenen
  `plugin-prerelease-extension-shard`-Matrixausgaben aus
  `.github/workflows/plugin-prerelease.yml` vor der Freigabe, damit Release Notes kein
  veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die gepackten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf das neue stabile Zip zeigen; der
    private macOS-Veröffentlichungsworkflow committet dies automatisch oder öffnet einen Appcast-
    PR, wenn direktes Pushen blockiert ist
  - die gepackte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist der Weg, wie Operatoren alle Vorab-Release-Tests über
einen Einstiegspunkt starten. Für einen gepinnten Commit-Nachweis auf einem schnelllebigen Branch verwenden Sie den
Helper, damit jeder Child-Workflow von einem temporären Branch läuft, der auf den Ziel-
SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, startet `Full Release Validation`
von diesem Branch mit `ref=<sha>`, verifiziert, dass jeder Child-Workflow-`headSha`
dem Ziel entspricht, und löscht dann den temporären Branch. Dadurch wird vermieden, versehentlich einen
neueren `main`-Child-Run zu belegen.

Für die Validierung eines Release-Branch oder Tags führen Sie ihn vom vertrauenswürdigen `main`-Workflow-
Ref aus und übergeben den Release-Branch oder Tag als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Der Workflow löst den Ziel-Ref auf, startet manuell `CI` mit
`target_ref=<release-ref>`, startet `OpenClaw Release Checks`, bereitet ein
übergeordnetes `release-package-under-test`-Artefakt für paketbezogene Checks vor und
startet eigenständiges Paket-Telegram-E2E, wenn `release_profile=full` mit
`rerun_group=all` oder wenn `release_package_spec` oder
`npm_telegram_package_spec` gesetzt ist. `OpenClaw Release
Checks` fächert dann in Install-Smoke, Cross-OS-Release-Checks, Live/E2E-Docker-
Release-Path-Abdeckung bei aktiviertem Soak, Package Acceptance mit Telegram-
Paket-QA, QA-Lab-Parität, Live Matrix und Live Telegram auf. Ein vollständiger Run ist nur akzeptabel, wenn die
`Full Release Validation`-
Zusammenfassung `normal_ci` und `release_checks` als erfolgreich ausweist. Im Full/all-Modus
muss auch das `npm_telegram`-Child erfolgreich sein; außerhalb von Full/all wird es übersprungen,
sofern kein veröffentlichtes `release_package_spec` oder `npm_telegram_package_spec`
bereitgestellt wurde. Die abschließende
Verifier-Zusammenfassung enthält Tabellen der langsamsten Jobs für jeden Child-Run, sodass der Release
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Stage-Matrix, exakte Workflow-Jobnamen, Unterschiede zwischen stabilem und vollständigem Profil,
Artefakte und gezielte Rerun-Handles.
Child-Workflows werden von dem vertrauenswürdigen Ref gestartet, der `Full Release
Validation` ausführt, normalerweise `--ref main`, auch wenn der Ziel-`ref` auf einen
älteren Release-Branch oder Tag zeigt. Es gibt keine separate Full-Release-Validation-
Workflow-Ref-Eingabe; wählen Sie das vertrauenswürdige Harness, indem Sie den Workflow-Run-Ref wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für den exakten Commit-Nachweis auf einem beweglichen `main`;
rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein, verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den gepinnten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster releasekritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite Advisory-Provider-/Media-Abdeckung

Verwenden Sie `run_release_soak=true` mit `stable`, wenn die releaseblockierenden Lanes
grün sind und Sie vor der Promotion den erschöpfenden Live/E2E-, Docker-Release-Path- und
begrenzten Published-Upgrade-Survivor-Sweep wünschen. Dieser Sweep deckt
die neuesten vier stabilen Pakete plus gepinnte `2026.4.23`- und `2026.5.2`-
Baselines plus ältere `2026.4.15`-Abdeckung ab, wobei doppelte Baselines entfernt und
jede Baseline in einen eigenen Docker-Runner-Job aufgeteilt wird. `full` impliziert
`run_release_soak=true`.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den Ziel-
Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt in Cross-OS,
Package Acceptance und Release-Path-Docker-Checks wieder, wenn Soak läuft. Dadurch bleiben
alle paketbezogenen Boxen auf denselben Bytes und wiederholte Paket-Builds werden vermieden.
Nachdem eine Beta bereits auf npm ist, setzen Sie `release_package_spec=openclaw@YYYY.M.D-beta.N`,
damit Release-Checks das ausgelieferte Paket einmal herunterladen, dessen Build-Source-
SHA aus `dist/build-info.json` extrahieren und dieses Artefakt für Cross-OS,
Package Acceptance, Release-Path-Docker und Paket-Telegram-Lanes wiederverwenden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane
Paketinstallation, Onboarding, Gateway-Start und einen Live-Agent-Turn belegt,
statt das langsamste Standardmodell zu benchmarken. Die breitere Live-Provider-
Matrix bleibt der Ort für modellspezifische Abdeckung.

Verwenden Sie diese Varianten abhängig von der Release-Phase:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Verwenden Sie den vollständigen Umbrella nicht als ersten Rerun nach einem gezielten Fix. Wenn eine Box
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen Child-Workflow, Job, die Docker-Lane, das Paketprofil, den Modell-
Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella erst dann erneut aus,
wenn der Fix gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise
veraltet gemacht hat. Der abschließende Verifier des Umbrella prüft die aufgezeichneten Child-Workflow-Run-
IDs erneut, daher führen Sie nach erfolgreichem Rerun eines Child-Workflows nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte
Release-Candidate-Run, `ci` führt nur das normale CI-Child aus, `plugin-prerelease`
führt nur das releasebezogene Plugin-Child aus, `release-checks` führt jede Release-
Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Gezielte `npm-telegram`-Reruns erfordern `release_package_spec` oder
`npm_telegram_package_spec`; Full/all-Runs mit `release_profile=full` verwenden das
Release-Checks-Paketartefakt. Gezielte
Cross-OS-Reruns können `cross_os_suite_filter=windows/packaged-upgrade` oder
einen anderen OS-/Suite-Filter hinzufügen. QA-Release-Check-Fehler sind advisory; ein reiner QA-
Fehler blockiert die Release-Validierung nicht.

### Vitest

Die Vitest-Box ist der manuelle `CI`-Child-Workflow. Manuelle CI umgeht absichtlich
Changed-Scoping und erzwingt den normalen Testgraphen für den Release
Candidate: Linux-Node-Shards, Bundled-Plugin-Shards, Channel-Verträge, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Checks, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Source Tree die vollständige normale Test-Suite bestanden?“
Sie ist nicht dasselbe wie Release-Path-Produktvalidierung. Aufzubewahrende Nachweise:

- `Full Release Validation`-Zusammenfassung mit der URL des gestarteten `CI`-Runs
- grüner `CI`-Run auf dem exakten Ziel-SHA
- fehlgeschlagene oder langsame Shard-Namen aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Run Performance-Analyse benötigt

Führen Sie manuelle CI direkt nur aus, wenn das Release deterministische normale CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-
`install-smoke`-Workflow. Sie validiert den Release Candidate durch paketierte
Docker-Umgebungen, statt nur Source-Level-Tests zu verwenden.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamem Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, mit QR-,
  Root/Gateway- und Installer/Bun-Smoke-Jobs als separate Install-Smoke-
  Shards
- Repository-E2E-Lanes
- Release-Path-Docker-Chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` und `plugins-runtime-install-h`
- OpenWebUI-Abdeckung innerhalb des `plugins-runtime-services`-Chunks, wenn angefordert
- aufgeteilte Bundled-Plugin-Install-/Uninstall-Lanes
  `bundled-plugin-install-uninstall-0` bis
  `bundled-plugin-install-uninstall-23`
- Live/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Checks
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Release-Path-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für gezielte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow, statt
alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten frühere
`package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, wenn verfügbar, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest- und Docker-
Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane mithilfe des agentischen Parity Pack mit der Opus-4.6-
  Baseline vergleicht
- schnelles Live-Matrix-QA-Profil mit der `qa-live-shared`-Umgebung
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Paritäts-, Matrix- und Telegram-
Lanes auf, wenn Sie das Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller sharded QA-Lab-Run verfügbar, nicht als standardmäßige releasekritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird von
`Package Acceptance` und dem Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen
Candidate in den `package-under-test`-Tarball, der von Docker-E2E verbraucht wird, validiert
das Paketinventar, zeichnet die Paketversion und SHA-256 auf und hält den
Workflow-Harness-Ref getrennt vom Package-Source-Ref.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: packt einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness
- `source=url`: lädt eine HTTPS-`.tgz` mit erforderlichem `package_sha256` herunter
- `source=artifact`: verwendet eine von einem anderen GitHub-Actions-Run hochgeladene `.tgz` wieder

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paketartefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update,
Configured-Auth-Update-Neustart, Live-ClawHub-Skill-Installation, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-
Fixtures, Plugin-Update und Telegram-Paket-QA gegen denselben aufgelösten
Tarball. Blockierende Release-Checks verwenden die standardmäßige neueste veröffentlichte Paket-
Baseline; `run_release_soak=true` oder
`release_profile=full` erweitert auf jede stabile auf npm veröffentlichte Baseline von
`2026.4.23` bis `latest` plus gemeldete Issue-Fixtures. Verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Candidate oder
`source=ref`/`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der
Veröffentlichung. Es ist der GitHub-native
Ersatz für den Großteil der Paket-/Update-Abdeckung, die zuvor Parallels erforderte.
Cross-OS-Release-Checks bleiben für OS-spezifisches Onboarding,
Installer- und Plattformverhalten wichtig, aber Paket-/Update-Produktvalidierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie,
wenn Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder
Release-Check-Lane eine Plugin-Installation bzw. ein Plugin-Update, eine
doctor-Bereinigung oder eine Änderung an der Migration veröffentlichter Pakete
belegt. Die vollständige veröffentlichte Update-Migration von jedem stabilen
Paket ab `2026.4.23` ist ein separater manueller `Update Migration`-Workflow,
nicht Teil der Full Release CI.

Die Legacy-Nachsicht bei Package Acceptance ist absichtlich zeitlich befristet.
Pakete bis einschließlich `2026.4.25` dürfen den Kompatibilitätspfad für
Metadatenlücken nutzen, die bereits auf npm veröffentlicht wurden: private
QA-Inventareinträge, die im Tarball fehlen, fehlendes `gateway install --wrapper`,
fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes
persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze,
fehlende Persistierung von Marketplace-Installationsdatensätzen und
Konfigurationsmetadatenmigration während `plugins update`. Das veröffentlichte
Paket `2026.4.26` darf für lokale Build-Metadaten-Stempeldateien warnen, die
bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Paketverträge
erfüllen; dieselben Lücken lassen die Release-Validierung fehlschlagen.

Verwenden Sie breitere Package-Acceptance-Profile, wenn es bei der Release-Frage
um ein tatsächlich installierbares Paket geht:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Gängige Paketprofile:

- `smoke`: schnelle Lanes für Paketinstallation, Kanal, Agent, Gateway-Netzwerk
  und Konfigurationsneuladen
- `package`: Verträge für Installation, Update, Neustart und Plugin-Pakete plus
  Live-Nachweis für Skill-Installation aus ClawHub; dies ist der Standard für
  Release-Checks
- `product`: `package` plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Blöcke mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Wiederholungen

Aktivieren Sie für Telegram-Nachweise von Paketkandidaten
`telegram_mode=mock-openai` oder `telegram_mode=live-frontier` in Package Acceptance.
Der Workflow übergibt den aufgelösten `package-under-test`-Tarball an die
Telegram-Lane; der eigenständige Telegram-Workflow akzeptiert weiterhin eine
veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Release-Veröffentlichungsautomatisierung

`OpenClaw Release Publish` ist der normale mutierende Einstiegspunkt für
Veröffentlichungen. Er orchestriert die Trusted-Publisher-Workflows in der für
das Release benötigten Reihenfolge:

1. Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Prüfen, ob das Tag von `main` oder `release/*` aus erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und derselben SHA auslösen.
6. `OpenClaw NPM Release` mit Release-Tag, npm-Dist-Tag und gespeichertem
   `preflight_run_id` auslösen.

Beispiel für Beta-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Veröffentlichung mit dem standardmäßigen Beta-Dist-Tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Die stabile Promotion direkt nach `latest` ist explizit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Verwenden Sie die Low-Level-Workflows `Plugin NPM Release` und
`Plugin ClawHub Release` nur für fokussierte Reparatur- oder
Neu-Veröffentlichungsarbeiten. Übergeben Sie für eine ausgewählte
Plugin-Reparatur `plugin_publish_scope=selected` und `plugins=@openclaw/name`
an `OpenClaw Release Publish`, oder lösen Sie den Child-Workflow direkt aus,
wenn das OpenClaw-Paket nicht veröffentlicht werden darf.

## Eingaben für den NPM-Workflow

`OpenClaw NPM Release` akzeptiert diese durch Operatoren gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf es auch die aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches für einen reinen
  Validierungs-Preflight sein
- `preflight_only`: `true` nur für Validierung, Build und Paketierung, `false`
  für den echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der
  Workflow den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf
  wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Publish` akzeptiert diese durch Operatoren gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche Preflight-Run-ID von `OpenClaw NPM Release`;
  erforderlich, wenn `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: Standard ist `all-publishable`; verwenden Sie
  `selected` nur für fokussierte Reparaturarbeiten
- `plugins`: durch Kommas getrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: Standard ist `true`; setzen Sie dies nur dann auf
  `false`, wenn Sie den Workflow als reinen Plugin-Reparatur-Orchestrator
  verwenden

`OpenClaw Release Checks` akzeptiert diese durch Operatoren gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA zur Validierung. Prüfungen
  mit Secrets erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch
  oder Release-Tag aus erreichbar ist.
- `run_release_soak`: Opt-in für vollständige Live-/E2E-, Docker-Release-Pfad-
  und All-since-Upgrade-Survivor-Soak-Prüfungen bei stabilen bzw. Standard-
  Release-Checks. Dies wird durch `release_profile=full` erzwungen.

Regeln:

- Stabile und Korrektur-Tags dürfen entweder nach `beta` oder `latest`
  veröffentlicht werden
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlicht werden
- Für `OpenClaw NPM Release` ist eine vollständige Commit-SHA als Eingabe nur
  erlaubt, wenn `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer nur der
  Validierung
- Der echte Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden, das
  während des Preflights verwendet wurde; der Workflow prüft diese Metadaten vor
  dem Fortsetzen der Veröffentlichung

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release erstellen:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, dürfen Sie die aktuelle vollständige Commit-SHA
     des Workflow-Branches für einen reinen Validierungs-Testlauf des
     Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-first-Ablauf oder
   `latest` nur, wenn Sie absichtlich eine direkte stabile Veröffentlichung
   wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag
   oder der vollständigen Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-
   Cache-, Docker-, QA-Lab-, Matrix- und Telegram-Abdeckung aus einem manuellen
   Workflow wünschen
4. Wenn Sie absichtlich nur den deterministischen normalen Testgraphen benötigen,
   führen Sie stattdessen den manuellen `CI`-Workflow auf der Release-Referenz aus
5. Speichern Sie den erfolgreichen `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben
   `npm_dist_tag` und dem gespeicherten `preflight_run_id` aus; dies
   veröffentlicht externalisierte Plugins vor der Promotion des OpenClaw-npm-
   Pakets auf npm und ClawHub
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten Workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` nach `latest` zu promoten
8. Wenn das Release absichtlich direkt nach `latest` veröffentlicht wurde und
   `beta` sofort demselben stabilen Build folgen soll, verwenden Sie denselben
   privaten Workflow, um beide Dist-Tags auf die stabile Version zeigen zu lassen,
   oder lassen Sie dessen geplante selbstheilende Synchronisierung `beta` später
   verschieben

Die Dist-Tag-Mutation liegt aus Sicherheitsgründen im privaten Repository, weil
sie weiterhin `NPM_TOKEN` benötigt, während das öffentliche Repository nur
OIDC-Veröffentlichung beibehält.

So bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-first-
Promotion-Pfad dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückfallen muss, führen
Sie alle 1Password-CLI-(`op`-)Befehle nur innerhalb einer dedizierten
tmux-Sitzung aus. Rufen Sie `op` nicht direkt aus der Haupt-Agent-Shell auf; wenn
es in tmux bleibt, sind Prompts, Warnungen und OTP-Behandlung beobachtbar und
wiederholte Host-Warnungen werden verhindert.

## Öffentliche Referenzen

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer verwenden die privaten Release-Dokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
für das tatsächliche Runbook.

## Verwandt

- [Release-Kanäle](/de/install/development-channels)
