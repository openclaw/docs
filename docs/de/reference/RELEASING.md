---
read_when:
    - Suche nach Definitionen für öffentliche Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suchen Sie nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Kanäle, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Taktung
title: Veröffentlichungsrichtlinie
x-i18n:
    generated_at: "2026-05-07T15:08:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: Releases mit Tags, die standardmäßig auf npm `beta` veröffentlichen oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Vorabversion-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Head von `main`

## Versionsbenennung

- Version eines stabilen Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines stabilen Korrektur-Releases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version einer Beta-Vorabversion: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen schreiben
- `latest` bedeutet das aktuell hochgestufte stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Verantwortliche können ausdrücklich `latest` als Ziel wählen oder einen geprüften Beta-Build später hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  Build/Signierung/Notarisierung der Mac-App stabilen Releases vorbehalten bleibt, sofern nicht ausdrücklich angefordert

## Release-Takt

- Releases laufen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise von einem `release/YYYY.M.D`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Korrekturen neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und eine Korrektur benötigt, erstellen Maintainer
  das nächste `-beta.N`-Tag, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Verantwortliche

Diese Checkliste ist die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, dist-tag-Wiederherstellung und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neueste Änderungen pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle `main`-CI ausreichend grün ist, um davon zu branchen.
2. Den obersten Abschnitt von `CHANGELOG.md` aus der echten Commit-Historie mit
   `/changelog` neu schreiben, Einträge nutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätseinträge in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren, warum sie
   absichtlich beibehalten wird.
4. `release/YYYY.M.D` aus dem aktuellen `main` erstellen; normale Release-Arbeiten nicht
   direkt auf `main` durchführen.
5. Alle erforderlichen Versionsstellen für das vorgesehene Tag erhöhen, dann
   `pnpm release:prep` ausführen. Es aktualisiert Plugin-Versionen, Plugin-Inventar, Konfigurationsschema,
   Metadaten der gebündelten Channel-Konfiguration, Baseline der Konfigurationsdokumentation, Plugin-SDK-
   Exporte und Plugin-SDK-API-Baseline in der richtigen Reihenfolge. Jede generierte
   Abweichung vor dem Taggen committen. Anschließend die lokale deterministische Vorabprüfung ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-stelliger SHA des Release-Branches für eine reine Validierungs-
   Vorabprüfung erlaubt. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Vorab-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA starten. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch korrigieren und die kleinste fehlgeschlagene
   Datei, Lane, den Workflow-Job, das Paketprofil, den Provider oder die Modell-Allowlist erneut ausführen, die
   die Korrektur nachweist. Den vollständigen Umbrella-Lauf nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Beta `vYYYY.M.D-beta.N` taggen, dann `OpenClaw Release Publish` vom
   passenden `release/YYYY.M.D`-Branch ausführen. Es prüft `pnpm plugins:sync:check`,
   dispatcht alle veröffentlichbaren Plugin-Pakete parallel an npm und dieselbe Menge an
   ClawHub und stuft anschließend das vorbereitete OpenClaw-npm-Vorabprüfungsartefakt
   mit dem passenden dist-tag hoch, sobald die Plugin-Veröffentlichung auf npm erfolgreich ist.
   Die Veröffentlichung auf ClawHub kann noch laufen, während OpenClaw auf npm veröffentlicht, aber der
   Release-Publish-Workflow gibt die IDs der Child-Runs sofort aus. Standardmäßig
   wartet er nach dem Dispatch nicht auf ClawHub, sodass die Verfügbarkeit von OpenClaw auf npm
   nicht durch langsamere ClawHub-Freigaben oder Registry-Arbeiten blockiert wird; setzen Sie
   `wait_for_clawhub=true`, wenn ClawHub den Workflow-Abschluss blockieren muss. Der
   ClawHub-Pfad wiederholt vorübergehende Installationsfehler von CLI-Abhängigkeiten, veröffentlicht
   Plugins mit bestandener Vorschau auch dann, wenn eine Vorschau-Zelle instabil ist, und endet mit
   Registry-Verifizierung für jede erwartete Plugin-Version, sodass Teilveröffentlichungen
   sichtbar und wiederholbar bleiben. Nach der Veröffentlichung die Post-Publish-Paket-
   Abnahme gegen das veröffentlichte Paket `openclaw@YYYY.M.D-beta.N` oder
   `openclaw@beta` ausführen. Wenn eine gepushte oder veröffentlichte Vorabversion eine Korrektur benötigt,
   die nächste passende Vorabversionsnummer erstellen; die alte
   Vorabversion nicht löschen oder umschreiben.
10. Für Stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die stabile npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish`, wobei das erfolgreiche Vorabprüfungsartefakt über
    `preflight_run_id` wiederverwendet wird; die Bereitschaft des stabilen macOS-Releases erfordert außerdem die
    paketierten Dateien `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifizierer ausführen, optional den eigenständigen
    veröffentlichtes-npm-Telegram-E2E, wenn Sie Channel-Nachweise nach der Veröffentlichung benötigen,
    dist-tag-Hochstufung bei Bedarf, GitHub-Release-/Vorabversionshinweise aus dem
    vollständigen passenden Abschnitt von `CHANGELOG.md` und die Release-Ankündigungs-
    Schritte.

## Release-Vorabprüfung

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Importzyklus- und Architekturgrenzen-Prüfungen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Paketvalidierungsschritt vorhanden sind
- Führen Sie `pnpm release:prep` nach dem Versionsbump im Root und vor dem Tagging aus. Es führt jeden deterministischen Release-Generator aus, der nach einer Versions-/Konfigurations-/API-Änderung häufig driftet: Plugin-Versionen, Plugin-Inventar, Basiskonfigurationsschema, gebündelte Kanal-Konfigurationsmetadaten, Konfigurationsdokumentations-Baseline, Plugin-SDK-Exports und Plugin-SDK-API-Baseline. `pnpm release:check` führt diese Guards im Prüfmodus erneut aus und meldet jeden gefundenen Fehler durch generierten Drift in einem Durchlauf, bevor Paket-Release-Prüfungen ausgeführt werden.
- Führen Sie den manuellen `Full Release Validation`-Workflow vor der Release-Freigabe aus, um alle Pre-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, startet manuelles `CI` und startet `OpenClaw Release Checks` für Installations-Smoke-Test, Paketakzeptanz, Cross-OS-Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stabile/standardmäßige Läufe halten exhaustive Live/E2E- und Docker-Release-Pfad-Soak hinter `run_release_soak=true`; `release_profile=full` erzwingt Soak. Mit `release_profile=full` und `rerun_group=all` wird außerdem Paket-Telegram-E2E gegen das `release-package-under-test`-Artefakt aus den Release-Prüfungen ausgeführt. Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dasselbe Telegram-E2E auch das veröffentlichte npm-Paket prüfen soll. Geben Sie `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance seine Paket-/Update-Matrix gegen das ausgelieferte npm-Paket statt gegen das aus dem SHA gebaute Artefakt ausführen soll. Geben Sie `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die Validierung einem veröffentlichten npm-Paket entspricht, ohne Telegram-E2E zu erzwingen. Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen `Package Acceptance`-Workflow aus, wenn Sie Side-Channel-Nachweis für einen Paketkandidaten wünschen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`, um einen vertrauenswürdigen `package_ref`-Branch/Tag/SHA mit dem aktuellen `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen Tarball erneut und kann Telegram-QA gegen denselben Tarball mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket sowohl als installierte CLI als auch als package-under-test, damit der verwaltete Neustartpfad des Update-Befehls des Kandidaten getestet wird.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Installations-/Kanal-/Agent-, Gateway-Netzwerk- und Konfigurations-Neulade-Lanes
  - `package`: artefakt-native Paket-/Update-/Neustart-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten erneuten Lauf
- Führen Sie den manuellen `CI`-Workflow direkt aus, wenn Sie nur vollständige normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen geändertenbasiertes Scoping und erzwingen die Linux-Node-Shards, gebündelten Plugin-Shards, Kanalverträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke-Test, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es testet QA-lab über einen lokalen OTLP/HTTP-Receiver und verifiziert die exportierten Trace-Span-Namen, begrenzten Attribute und die Schwärzung von Inhalten/Identifikatoren, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die mutierende Veröffentlichungssequenz aus, nachdem der Tag existiert. Starten Sie ihn von `release/YYYY.M.D` (oder `main`, wenn ein von main erreichbarer Tag veröffentlicht wird), übergeben Sie den Release-Tag und die erfolgreiche OpenClaw-npm-`preflight_run_id`, und behalten Sie den standardmäßigen Plugin-Veröffentlichungsumfang `all-publishable` bei, außer Sie führen absichtlich eine fokussierte Reparatur aus. Der Workflow serialisiert Plugin-npm-Veröffentlichung, Plugin-ClawHub-Veröffentlichung und OpenClaw-npm-Veröffentlichung, damit das Core-Paket nicht vor seinen externalisierten Plugins veröffentlicht wird.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe auch die QA-Lab-Mock-Paritäts-Lane sowie das schnelle Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-Lanes verwenden die `qa-live-shared`-Umgebung; Telegram verwendet außerdem Convex-CI-Anmeldedaten-Leases. Führen Sie den manuellen `QA-Lab - All Lanes`-Workflow mit `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständiges Matrix-Transport-, Medien- und E2EE-Inventar parallel wünschen.
- Cross-OS-Installations- und Upgrade-Laufzeitvalidierung ist Teil der öffentlichen `OpenClaw Release Checks` und `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad bleibt kurz, deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer eigenen Lane bleiben, damit sie die Veröffentlichung nicht aufhalten oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release Validation` oder vom `main`-/Release-Workflow-Ref gestartet werden, damit Workflow-Logik und Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Die validierungsreine Preflight-Prüfung von `OpenClaw NPM Release` akzeptiert außerdem den aktuellen vollständigen 40-Zeichen-Commit-SHA des Workflow-Branches, ohne einen gepushten Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung befördert werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die Paketmetadatenprüfung; die echte Veröffentlichung erfordert weiterhin einen echten Release-Tag
- Beide Workflows halten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten Runnern, während der nicht mutierende Validierungspfad die größeren Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Prüfungs-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (oder den passenden Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (oder die passende Beta-/Korrektur-Version) aus, um den veröffentlichten Registry-Installationspfad in einem frischen temporären Prefix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um Onboarding mit installiertem Paket, Telegram-Einrichtung und echtes Telegram-E2E gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Anmeldedaten-Pool zu verifizieren. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen und die drei `OPENCLAW_QA_TELEGRAM_*`-Env-Anmeldedaten direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke-Test von einer Maintainer-Maschine auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, startet `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über GitHub Actions mit dem manuellen `NPM Telegram Beta E2E`-Workflow ausführen. Er ist absichtlich nur manuell und läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss vom selben `main`- oder `release/YYYY.M.D`-Branch gestartet werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Eingabe explizit `latest` ansteuern
  - tokenbasierte npm-dist-tag-Mutation liegt jetzt aus Sicherheitsgründen in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das öffentliche Repository OIDC-only-Veröffentlichung beibehält
  - öffentliches `macOS Release` ist nur Validierung; wenn ein Tag nur auf einem Release-Branch existiert, der Workflow aber von `main` gestartet wird, setzen Sie `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-`preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier auch denselben temporären Prefix-Upgrade-Pfad von `YYYY.M.D` auf `YYYY.M.D-N`, damit Release-Korrekturen ältere globale Installationen nicht stillschweigend auf dem stabilen Basis-Payload belassen können
- npm-Release-Preflight schlägt sicher fehl, außer der Tarball enthält sowohl `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload, damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Einstiegspunkte und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das fehlende Plugin-Laufzeit-Payloads ausliefert, schlägt im Postpublish-Verifier fehl und kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-pack-`unpackedSize`-Budget für den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliches Pack-Bloat vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder Extension-Testmatrizen berührt hat, generieren und prüfen Sie vor der Freigabe die planner-eigenen `plugin-prerelease-extension-shard`-Matrixausgaben aus `.github/workflows/plugin-prerelease.yml`, damit Release Notes kein veraltetes CI-Layout beschreiben
- Bereitschaft für stabile macOS-Releases umfasst außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierte `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf das neue stabile Zip zeigen
  - die paketierte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Mindestwert für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist der Weg, wie Operatoren alle Pre-Release-Tests über einen Einstiegspunkt starten. Für einen Nachweis mit gepinntem Commit auf einem sich schnell bewegenden Branch verwenden Sie den Helper, damit jeder Child-Workflow von einem temporären Branch ausgeführt wird, der auf den Ziel-SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, startet `Full Release Validation` von diesem Branch mit `ref=<sha>`, verifiziert, dass jeder Child-Workflow-`headSha` dem Ziel entspricht, und löscht anschließend den temporären Branch. Dadurch wird vermieden, versehentlich einen neueren `main`-Child-Lauf nachzuweisen.

Für die Validierung von Release-Branches oder Tags führen Sie sie aus der vertrauenswürdigen `main`-Workflow-Ref aus und übergeben den Release-Branch oder das Tag als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Der Workflow löst die Ziel-Ref auf, startet manuelles `CI` mit `target_ref=<release-ref>`, startet `OpenClaw Release Checks`, bereitet ein übergeordnetes `release-package-under-test`-Artefakt für paketbezogene Prüfungen vor und startet eigenständiges Paket-Telegram-E2E, wenn `release_profile=full` mit `rerun_group=all` oder wenn `npm_telegram_package_spec` gesetzt ist. `OpenClaw Release Checks` fächert anschließend in Install-Smoke, Cross-OS-Release-Prüfungen, Live/E2E-Docker-Abdeckung für Release-Pfade bei aktiviertem Soak, Package Acceptance mit Telegram-Paket-QA, QA-Lab-Parität, Live-Matrix und Live-Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die Zusammenfassung von `Full Release Validation` `normal_ci` und `release_checks` als erfolgreich anzeigt. Im Full/All-Modus muss auch das `npm_telegram`-Child erfolgreich sein; außerhalb von Full/All wird es übersprungen, sofern kein veröffentlichtes `npm_telegram_package_spec` angegeben wurde. Die finale Verifier-Zusammenfassung enthält Tabellen mit den langsamsten Jobs für jeden Child-Lauf, damit der Release-Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die vollständige Stufenmatrix, exakte Workflow-Job-Namen, Unterschiede zwischen Stable- und Full-Profil, Artefakte und gezielte Rerun-Handles.
Child-Workflows werden aus der vertrauenswürdigen Ref gestartet, die `Full Release Validation` ausführt, normalerweise `--ref main`, selbst wenn die Ziel-`ref` auf einen älteren Release-Branch oder ein Tag zeigt. Es gibt keine separate Workflow-Ref-Eingabe für Full Release Validation; wählen Sie den vertrauenswürdigen Harness, indem Sie die Ref des Workflow-Laufs wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für exakte Commit-Nachweise auf dem beweglichen `main`; rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein. Verwenden Sie daher `pnpm ci:full-release --sha <sha>`, um den gepinnten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite advisory Provider/Media-Abdeckung

Verwenden Sie `run_release_soak=true` mit `stable`, wenn die release-blockierenden Lanes grün sind und Sie vor der Promotion den umfassenden Live/E2E-, Docker-Release-Pfad- und begrenzten veröffentlichten Upgrade-Survivor-Sweep möchten. Dieser Sweep deckt die neuesten vier stabilen Pakete plus gepinnte `2026.4.23`- und `2026.5.2`-Baselines sowie ältere `2026.4.15`-Abdeckung ab, wobei doppelte Baselines entfernt und jede Baseline in einen eigenen Docker-Runner-Job geshardet wird. `full` impliziert `run_release_soak=true`.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die Ziel-Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt in Cross-OS-, Package-Acceptance- und Release-Pfad-Docker-Prüfungen wieder, wenn Soak läuft. Dadurch bleiben alle paketbezogenen Boxes auf denselben Bytes und wiederholte Paket-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die Repo/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane Paketinstallation, Onboarding, Gateway-Start und eine Live-Agent-Turn nachweist, statt das langsamste Standardmodell zu benchmarken. Die breitere Live-Provider-Matrix bleibt der Ort für modellspezifische Abdeckung.

Verwenden Sie diese Varianten je nach Release-Phase:

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Verwenden Sie den vollständigen Umbrella nicht als ersten Rerun nach einem fokussierten Fix. Wenn eine Box fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen Child-Workflow, Job, die Docker-Lane, das Paketprofil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella erst dann erneut aus, wenn der Fix die gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise veraltet gemacht hat. Der finale Verifier des Umbrellas prüft die aufgezeichneten Child-Workflow-Run-IDs erneut. Nachdem ein Child-Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte Release-Candidate-Lauf, `ci` führt nur das normale CI-Child aus, `plugin-prerelease` führt nur das release-spezifische Plugin-Child aus, `release-checks` führt jede Release-Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Fokussierte `npm-telegram`-Reruns erfordern `npm_telegram_package_spec`; Full/All-Läufe mit `release_profile=full` verwenden das Paketartefakt aus den Release-Checks. Fokussierte Cross-OS-Reruns können `cross_os_suite_filter=windows/packaged-upgrade` oder einen anderen OS/Suite-Filter hinzufügen. QA-Release-Check-Fehler sind advisory; ein reiner QA-Fehler blockiert die Release-Validierung nicht.

### Vitest

Die Vitest-Box ist der manuelle `CI`-Child-Workflow. Manuelles CI umgeht absichtlich Changed-Scoping und erzwingt den normalen Testgraphen für den Release Candidate: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Contracts, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Source Tree die vollständige normale Testsuite bestanden?“ Sie ist nicht dasselbe wie Release-Pfad-Produktvalidierung. Belege, die aufbewahrt werden sollten:

- `Full Release Validation`-Zusammenfassung mit der URL des gestarteten `CI`-Laufs
- grüner `CI`-Lauf auf dem exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn ein Lauf Performance-Analyse benötigt

Führen Sie manuelles CI nur dann direkt aus, wenn das Release deterministisches normales CI benötigt, aber nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Paket-Boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über `openclaw-live-and-e2e-checks-reusable.yml` sowie im `install-smoke`-Workflow im Release-Modus. Sie validiert den Release Candidate über paketierte Docker-Umgebungen, statt nur Tests auf Source-Ebene auszuführen.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamem Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-, Root/Gateway- und Installer/Bun-Smoke-Jobs als separate Install-Smoke-Shards laufen
- Repository-E2E-Lanes
- Docker-Chunks für Release-Pfade: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` und `plugins-runtime-install-h`
- OpenWebUI-Abdeckung innerhalb des Chunks `plugins-runtime-services`, wenn angefordert
- aufgeteilte Install/Uninstall-Lanes für gebündelte Plugins `bundled-plugin-install-uninstall-0` bis `bundled-plugin-install-uninstall-23`
- Live/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Checks Live-Suites einschließen

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Release-Pfad-Scheduler lädt `.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`, Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für fokussierte Wiederherstellung verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow, statt alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten frühere `package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, wenn verfügbar, sodass eine fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest und Docker-Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane mit der Opus-4.6-Baseline unter Verwendung des agentischen Parity Packs vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in QA-Szenarien und Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Parity-, Matrix- und Telegram-Lanes bei der Release-Freigabe auf. Vollständige Matrix-Abdeckung bleibt als manueller geshardeter QA-Lab-Lauf verfügbar, statt die standardmäßige release-kritische Lane zu sein.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird von `Package Acceptance` und dem Resolver `scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen Candidate in den `package-under-test`-Tarball, der von Docker-E2E verwendet wird, validiert das Paketinventar, zeichnet Paketversion und SHA-256 auf und hält die Workflow-Harness-Ref getrennt von der Paket-Source-Ref.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version
- `source=ref`: packt einen vertrauenswürdigen `package_ref`-Branch, ein Tag oder einen vollständigen Commit-SHA mit dem ausgewählten `workflow_ref`-Harness
- `source=url`: lädt ein HTTPS-`.tgz` mit erforderlichem `package_sha256` herunter
- `source=artifact`: verwendet ein von einem anderen GitHub-Actions-Lauf hochgeladenes `.tgz` wieder

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update, Neustart bei konfigurierter Auth nach Update, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Update und Telegram-Paket-QA gegen denselben aufgelösten Tarball. Blockierende Release-Checks verwenden die standardmäßige neueste veröffentlichte Paket-Baseline; `run_release_soak=true` oder `release_profile=full` erweitert dies auf jede stabile npm-veröffentlichte Baseline von `2026.4.23` bis `latest` plus Fixtures für gemeldete Issues. Verwenden Sie Package Acceptance mit `source=npm` für einen bereits ausgelieferten Candidate oder `source=ref`/`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der Veröffentlichung. Es ist der GitHub-native Ersatz für den Großteil der Paket/Update-Abdeckung, die zuvor Parallels erforderte. Cross-OS-Release-Checks bleiben für OS-spezifisches Onboarding, Installer- und Plattformverhalten wichtig, aber Produktvalidierung für Paket/Update sollte Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist [Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine Plugin-Installation, ein Plugin-Update, eine Doctor-Bereinigung oder eine Migration eines veröffentlichten Pakets nachweist.
Umfassende veröffentlichte Update-Migration von jedem stabilen `2026.4.23+`-Paket ist ein separater manueller `Update Migration`-Workflow, nicht Teil von Full Release CI.

Legacy-Nachsicht bei der Package Acceptance ist absichtlich zeitlich begrenzt. Pakete bis einschließlich
`2026.4.25` dürfen den Kompatibilitätspfad für bereits auf npm veröffentlichte Metadatenlücken nutzen:
private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture,
fehlender persistierter `update.channel`, alte Speicherorte für Plugin-Installationsdatensätze,
fehlende Persistenz von Marketplace-Installationsdatensätzen und die Migration von Konfigurationsmetadaten
während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf Warnungen
für lokale Build-Metadaten-Stempeldateien ausgeben, die bereits ausgeliefert wurden. Spätere Pakete
müssen die modernen Paketverträge erfüllen; dieselben Lücken lassen dann die
Release-Validierung fehlschlagen.

Verwenden Sie breitere Package-Acceptance-Profile, wenn es bei der Release-Frage um ein
tatsächlich installierbares Paket geht:

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

- `smoke`: schnelle Paketinstallations-, Channel-/Agent-, Gateway-Netzwerk- und Konfigurations-
  Reload-Lanes
- `package`: Installations-/Update-/Neustart-/Plugin-Paketverträge ohne Live-
  ClawHub; dies ist der Standard für Release-Prüfungen
- `product`: `package` plus MCP-Channels, Cron-/Subagent-Bereinigung, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Wiederholungsläufe

Für Telegram-Nachweise von Paketkandidaten aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den
aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Automatisierung der Release-Veröffentlichung

`OpenClaw Release Publish` ist der normale mutierende Einstiegspunkt für Veröffentlichungen. Er
orchestriert die Trusted-Publisher-Workflows in der Reihenfolge, die das Release benötigt:

1. Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Prüfen, ob der Tag von `main` oder `release/*` erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und derselben SHA auslösen.
6. `OpenClaw NPM Release` mit Release-Tag, npm-Dist-Tag und
   gespeichertem `preflight_run_id` auslösen.

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

Stabile Promotion direkt auf `latest` ist explizit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Verwenden Sie die Low-Level-Workflows `Plugin NPM Release` und `Plugin ClawHub Release`
nur für fokussierte Reparatur- oder Neuveröffentlichungsarbeiten. Für eine ausgewählte Plugin-Reparatur übergeben Sie
`plugin_publish_scope=selected` und `plugins=@openclaw/name` an
`OpenClaw Release Publish`, oder lösen Sie den untergeordneten Workflow direkt aus, wenn das
OpenClaw-Paket nicht veröffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf dies auch die aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches für einen reinen Validierungs-Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: auf dem echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Publish` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Run-ID;
  erforderlich, wenn `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: Standard ist `all-publishable`; verwenden Sie `selected` nur
  für fokussierte Reparaturarbeiten
- `plugins`: kommagetrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: Standard ist `true`; setzen Sie dies nur dann auf `false`, wenn Sie den
  Workflow als reinen Plugin-Reparatur-Orchestrator verwenden

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA, die validiert werden soll. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.
- `run_release_soak`: aktiviert den umfassenden Live-/E2E-, Docker-Release-Pfad- und
  All-since-Upgrade-Survivor-Soak bei stabilen/standardmäßigen Release-Prüfungen. Er wird
  durch `release_profile=full` erzwungen.

Regeln:

- Stable- und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlicht werden
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlicht werden
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` sind immer
  ausschließlich validierend
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflights verwendet wurde;
  der Workflow prüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release erstellen:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie die aktuelle vollständige Commit-SHA des Workflow-Branches
     für einen validierungsreinen Trockenlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-first-Ablauf oder `latest` nur,
   wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf dem Release-Ref aus
5. Speichern Sie das erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`
   und dem gespeicherten `preflight_run_id` aus; es veröffentlicht externalisierte Plugins auf npm
   und ClawHub, bevor das OpenClaw-npm-Paket promoted wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   Workflow, um diese stabile Version von `beta` auf `latest` zu promoten
8. Wenn das Release bewusst direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zeigen zu lassen, oder lassen Sie dessen geplante
   Self-Healing-Synchronisierung `beta` später verschieben

Die Dist-Tag-Mutation befindet sich aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repo OIDC-only-Publishing beibehält.

Damit bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-first-Promotion-Pfad
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückfallen muss, führen Sie alle 1Password-
CLI-(`op`)-Befehle nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op`
nicht direkt aus der Haupt-Agent-Shell auf; die Ausführung innerhalb von tmux macht Prompts,
Warnungen und OTP-Handling beobachtbar und verhindert wiederholte Host-Warnungen.

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
