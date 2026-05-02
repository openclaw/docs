---
read_when:
    - Suche nach Definitionen für öffentliche Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suchen nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-02T06:44:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce380a8277e7c8764359e4ded86d1042dcb250691ac62fbee28651f20aa0580
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Lanes:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen, oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: die sich bewegende Spitze von `main`

## Versionsbenennung

- Stable-Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stable-Korrekturrelease-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bezeichnet das aktuell promotete stabile npm-Release
- `beta` bezeichnet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrekturreleases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können explizit `latest` als Ziel festlegen oder später einen geprüften Beta-Build promoten
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  macOS-App-Build, Signierung und Notarisierung für Stable vorbehalten bleiben, sofern sie nicht ausdrücklich angefordert werden

## Release-Rhythmus

- Releases erfolgen Beta zuerst
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise von einem `release/YYYY.M.D`-Branch,
  der aus dem aktuellen `main` erstellt wurde, sodass Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, schneiden Maintainer
  den nächsten `-beta.N`-Tag, statt den alten Beta-Tag zu löschen oder neu zu erstellen
- Detailliertes Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, Dist-Tag-Wiederherstellung und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neueste Änderungen pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle `main`-CI grün genug ist, um davon zu branchen.
2. Den obersten Abschnitt in `CHANGELOG.md` mit
   `/changelog` aus der tatsächlichen Commit-Historie neu schreiben, Einträge nutzerorientiert halten, committen, pushen und vor dem Branching
   noch einmal rebasen/pullen.
3. Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren, warum sie
   absichtlich beibehalten wird.
4. `release/YYYY.M.D` aus dem aktuellen `main` erstellen; normale Release-Arbeit nicht
   direkt auf `main` durchführen.
5. Jede erforderliche Versionsstelle für den vorgesehenen Tag anheben, anschließend den
   lokalen deterministischen Preflight ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branches für einen reinen Validierungs-
   Preflight zulässig. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, Tag oder vollständigen Commit-SHA starten. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch fixen und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, Provider- oder Modell-Allowlist erneut ausführen, die
   den Fix nachweist. Den vollständigen Umbrella nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veraltet macht.
9. Für Beta `vYYYY.M.D-beta.N` taggen, mit npm-Dist-Tag `beta` veröffentlichen und anschließend
   die Package Acceptance nach der Veröffentlichung gegen das veröffentlichte Paket `openclaw@YYYY.M.D-beta.N`
   oder `openclaw@beta` ausführen. Wenn eine gepushte oder veröffentlichte Beta einen Fix benötigt, schneiden Sie
   das nächste `-beta.N`; löschen oder überschreiben Sie die alte Beta nicht.
10. Für Stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate über die
    erforderlichen Validierungsnachweise verfügt. Die stabile npm-Veröffentlichung verwendet das erfolgreiche
    Preflight-Artefakt über `preflight_run_id` wieder; die Bereitschaft des stabilen macOS-Releases
    erfordert außerdem die paketierten Dateien `.zip`, `.dmg`, `.dSYM.zip` sowie die aktualisierte
    `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifier ausführen, optional das eigenständige
    veröffentlichte-npm Telegram E2E, wenn Sie einen Kanalnachweis nach der Veröffentlichung benötigen,
    Dist-Tag-Promotion bei Bedarf, GitHub-Release-/Prerelease-Notizen aus dem
    vollständigen passenden Abschnitt in `CHANGELOG.md` und die Schritte zur Release-Ankündigung.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript auch außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren Prüfungen auf Importzyklen und Architekturgrenzen auch außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-Validierungsschritt vorhanden sind
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um alle Pre-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, dispatcht manuell `CI` und dispatcht `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Docker-Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes. Mit `release_profile=full` und `rerun_group=all` führt er außerdem Package Telegram E2E gegen das Artefakt `release-package-under-test` aus den Release Checks aus. Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dieselbe Telegram E2E auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die Validierung zu einem veröffentlichten npm-Paket passt, ohne Telegram E2E zu erzwingen. Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweise für einen Paketkandidaten möchten, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`, um einen vertrauenswürdigen `package_ref`-Branch/Tag/SHA mit dem aktuellen `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen Tarball wieder und kann Telegram QA gegen denselben Tarball mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Installations-/Channel-/Agent-, Gateway-Netzwerk- und Config-Reload-Lanes
  - `package`: paket-/update-/pluginbezogene Artefakt-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Channels, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten Wiederholungslauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen geänderte Scopes und erzwingen die Linux-Node-Shards, gebündelten Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es führt QA-Lab über einen lokalen OTLP/HTTP-Receiver aus und überprüft die exportierten Trace-Span-Namen, begrenzten Attribute sowie die Schwärzung von Inhalt/Bezeichnern, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe außerdem das QA-Lab-Mock-Paritäts-Gate sowie das schnelle Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie das vollständige Matrix-Transport-, Medien- und E2EE-Inventar parallel wünschen.
- Plattformübergreifende Installations- und Upgrade-Laufzeitvalidierung ist Teil der öffentlichen `OpenClaw Release Checks` und `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Trennung ist beabsichtigt: Der echte npm-Release-Pfad bleibt kurz, deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release Validation` oder vom `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der validation-only Preflight von `OpenClaw NPM Release` akzeptiert außerdem den aktuellen vollständigen 40-stelligen Commit-SHA des Workflow-Branch, ohne einen gepushten Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die Prüfung der Paketmetadaten; die echte Veröffentlichung erfordert weiterhin einen echten Release-Tag
- Beide Workflows behalten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten Runnern, während der nicht mutierende Validierungspfad die größeren Blacksmith-Linux-Runner nutzen kann
- Dieser Workflow führt `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` aus und verwendet dabei sowohl die Workflow-Secrets `OPENAI_API_KEY` als auch `ANTHROPIC_API_KEY`
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Checks-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (oder den passenden Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (oder die passende Beta-/Korrekturversion) aus, um den Installationspfad aus der veröffentlichten Registry in einem frischen temporären Präfix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um das Onboarding des installierten Pakets, die Telegram-Einrichtung und echte Telegram E2E gegen das veröffentlichte npm-Paket mithilfe des gemeinsam geleasten Telegram-Credential-Pools zu verifizieren. Lokale Maintainer-Einmalläufe können die Convex-Variablen auslassen und die drei `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Maintainer können dieselbe Post-Publish-Prüfung über den manuellen Workflow `NPM Telegram Beta E2E` von GitHub Actions ausführen. Er ist bewusst ausschließlich manuell und läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss vom selben `main`- oder `release/YYYY.M.D`-Branch wie der erfolgreiche Preflight-Lauf dispatcht werden
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Eingabe explizit auf `latest` zielen
  - tokenbasierte npm-dist-tag-Mutation befindet sich jetzt aus Sicherheitsgründen in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das öffentliche Repo nur OIDC-Publishing verwendet
  - öffentliches `macOS Release` dient nur der Validierung; wenn ein Tag nur auf einem Release-Branch liegt, der Workflow aber von `main` dispatcht wird, setzen Sie `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-`preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Bei stabilen Korrekturreleases wie `YYYY.M.D-N` prüft der Post-Publish-Verifizierer auch denselben Upgrade-Pfad im temporären Präfix von `YYYY.M.D` auf `YYYY.M.D-N`, damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem stabilen Basis-Payload belassen
- Der npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält, damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Einstiegspunkte und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, dem Plugin-Runtime-Payloads fehlen, schlägt im Postpublish-Verifizierer fehl und kann nicht zu `latest` hochgestuft werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliche Paketaufblähung abfängt, bevor der Release-Veröffentlichungspfad erreicht wird
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder Extension-Testmatrizen berührt hat, regenerieren und prüfen Sie vor der Freigabe die plannerverwalteten `plugin-prerelease-extension-shard`-Matrixausgaben aus `.github/workflows/plugin-prerelease.yml`, damit Release Notes kein veraltetes CI-Layout beschreiben
- Zur Bereitschaft stabiler macOS-Releases gehören außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile Zip-Datei zeigen
  - die paketierte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-URL und eine `CFBundleVersion` auf oder oberhalb der kanonischen Sparkle-Build-Untergrenze für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist die Methode, mit der Operatoren alle Pre-Release-Tests über einen Einstiegspunkt starten. Für einen fest gepinnten Commit-Nachweis auf einem schnell bewegten Branch verwenden Sie den Helper, damit jeder Child-Workflow von einem temporären Branch läuft, der auf den Ziel-SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation` von diesem Branch mit `ref=<sha>`, verifiziert, dass jeder Child-Workflow-`headSha` dem Ziel entspricht, und löscht anschließend den temporären Branch. So wird vermieden, versehentlich einen neueren `main`-Child-Lauf nachzuweisen.

Für die Validierung eines Release-Branch oder Tags führen Sie ihn vom vertrauenswürdigen `main`-Workflow-Ref aus und übergeben den Release-Branch oder Tag als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Der Workflow löst die Ziel-Ref auf, dispatcht manuell `CI` mit
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks` und dispatcht
standalone Package Telegram E2E, wenn `release_profile=full` mit
`rerun_group=all` gesetzt ist oder wenn `npm_telegram_package_spec` gesetzt ist. `OpenClaw Release
Checks` fächert dann Install-Smoke, Cross-OS-Release-Checks, Live/E2E-Docker-
Release-Pfad-Abdeckung, Package Acceptance mit Telegram-Package-QA, QA-Lab-
Parität, Live-Matrix und Live-Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die
Zusammenfassung von `Full Release Validation`
`normal_ci` und `release_checks` als erfolgreich anzeigt. Im Modus full/all
muss das Child `npm_telegram` ebenfalls erfolgreich sein; außerhalb von full/all wird es übersprungen,
außer es wurde ein veröffentlichtes `npm_telegram_package_spec` bereitgestellt. Die abschließende
Verifizierungszusammenfassung enthält Tabellen der langsamsten Jobs für jeden Child-Lauf, sodass der Release-
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Stufenmatrix, exakte Workflow-Jobnamen, Unterschiede zwischen stabilem und vollständigem Profil,
Artefakte und fokussierte Handles für erneute Läufe.
Child-Workflows werden von der vertrauenswürdigen Ref dispatcht, die `Full Release
Validation` ausführt, normalerweise `--ref main`, auch wenn die Ziel-`ref` auf einen
älteren Release-Branch oder Tag zeigt. Es gibt keine separate Full-Release-Validation-
Workflow-Ref-Eingabe; wählen Sie den vertrauenswürdigen Harness, indem Sie die Workflow-Lauf-Ref wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für exakten Commit-Nachweis auf sich bewegendem `main`;
raw Commit-SHAs können keine Workflow-Dispatch-Refs sein, verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den gepinnten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Breite von Live/Provider auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider-/Backend-Abdeckung für Release-Freigabe
- `full`: Stable plus breite beratende Provider-/Medienabdeckung

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die Ziel-
Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt sowohl in
Release-Pfad-Docker-Checks als auch in Package Acceptance wieder. Dadurch bleiben alle
package-seitigen Boxes auf denselben Bytes und wiederholte Package-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.5`, weil diese Lane
Package-Installation, Onboarding, Gateway-Start und eine Live-Agent-Runde nachweist
statt das langsamste Standardmodell zu benchmarken. Die breitere Live-Provider-
Matrix bleibt der Ort für modellspezifische Abdeckung.

Verwenden Sie diese Varianten je nach Release-Stufe:

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

Verwenden Sie den vollständigen Umbrella nicht als ersten erneuten Lauf nach einem fokussierten Fix. Wenn eine Box
fehlschlägt, verwenden Sie den fehlgeschlagenen Child-Workflow, Job, die Docker-Lane, das Package-Profil, den Modell-
Provider oder die QA-Lane für den nächsten Nachweis. Führen Sie den vollständigen Umbrella nur dann erneut aus, wenn
der Fix die gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise
veraltet gemacht hat. Die abschließende Verifizierung des Umbrella prüft die aufgezeichneten Child-Workflow-Lauf-
IDs erneut. Nachdem ein Child-Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
Parent-Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur das normale CI-Child aus, `plugin-prerelease`
führt nur das release-spezifische Plugin-Child aus, `release-checks` führt jede Release-
Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Fokussierte `npm-telegram`-Wiederholungen erfordern `npm_telegram_package_spec`; full/all-Läufe
mit `release_profile=full` verwenden das Release-Checks-Package-Artefakt.

### Vitest

Die Vitest-Box ist der manuelle `CI`-Child-Workflow. Manuelles CI umgeht absichtlich
Changed-Scoping und erzwingt den normalen Testgraphen für den Release-
Candidate: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Contracts, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Checks, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Source-Tree die vollständige normale Testsuite bestanden?“
Sie ist nicht dasselbe wie Release-Pfad-Produktvalidierung. Aufzubewahrender Nachweis:

- `Full Release Validation`-Zusammenfassung mit der URL des dispatchten `CI`-Laufs
- grüner `CI`-Lauf auf dem exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Lauf Leistungsanalyse benötigt

Führen Sie manuelles CI nur direkt aus, wenn das Release deterministisches normales CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Package-Boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` plus den Release-Modus-
`install-smoke`-Workflow. Sie validiert den Release Candidate durch paketierte
Docker-Umgebungen statt nur durch Tests auf Source-Ebene.

Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamen Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-,
  Root/Gateway- und Installer/Bun-Smoke-Jobs als separate install-smoke-
  Shards laufen
- Repository-E2E-Lanes
- Release-Pfad-Docker-Chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` und `plugins-runtime-install-h`
- OpenWebUI-Abdeckung innerhalb des Chunks `plugins-runtime-services`, wenn angefordert
- aufgeteilte Install-/Uninstall-Lanes für gebündelte Plugins
  `bundled-plugin-install-uninstall-0` bis
  `bundled-plugin-install-uninstall-23`
- Live/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Checks
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte vor erneuten Läufen. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Befehlen für erneute Läufe hoch. Für fokussierte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow statt
alle Release-Chunks erneut auszuführen. Generierte Befehle für erneute Läufe enthalten frühere
`package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, wenn verfügbar, sodass eine
fehlgeschlagene Lane dasselbe Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest und Docker-
Package-Mechanik.

Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Gate, das die OpenAI-Candidate-Lane anhand des agentischen Parity-Packs mit der Opus-4.6-
  Baseline vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Paritäts-, Matrix- und Telegram-
Lanes auf, wenn Sie das Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller geshardeter QA-Lab-Lauf verfügbar und ist nicht die standardmäßige release-kritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird von
`Package Acceptance` und dem Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen
Candidate in das `package-under-test`-Tarball, das von Docker E2E konsumiert wird, validiert
das Package-Inventar, zeichnet Package-Version und SHA-256 auf und hält die
Workflow-Harness-Ref von der Package-Source-Ref getrennt.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: Packen eines vertrauenswürdigen `package_ref`-Branches, Tags oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness
- `source=url`: Herunterladen eines HTTPS-`.tgz` mit erforderlichem `package_sha256`
- `source=artifact`: Wiederverwendung eines von einem anderen GitHub-Actions-Lauf hochgeladenen `.tgz`

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Package-Artefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` und
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update, Bereinigung veralteter
Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Update und Telegram-
Package-QA gegen dasselbe aufgelöste Tarball. Es ist der GitHub-native
Ersatz für den Großteil der Package-/Update-Abdeckung, die zuvor
Parallels erforderte. Cross-OS-Release-Checks bleiben für OS-spezifisches Onboarding,
Installer- und Plattformverhalten wichtig, aber Package-/Update-Produktvalidierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn Sie
entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine
Plugin-Installation/-Aktualisierung, Doctor-Bereinigung oder Änderung an einer Migration für veröffentlichte Packages nachweist.
Eine erschöpfende veröffentlichte Update-Migration von jedem stabilen `2026.4.23+`-Package ist
ein separater manueller `Update Migration`-Workflow und nicht Teil von Full Release CI.

Legacy-Nachsicht bei Package Acceptance ist absichtlich zeitlich begrenzt. Packages bis
`2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits
auf npm veröffentlicht wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-
Fixture, fehlendes persistiertes `update.channel`, Legacy-Plugin-Install-Record-
Speicherorte, fehlende Persistenz von Marketplace-Install-Records und Config-Metadaten-
Migration während `plugins update`. Das veröffentlichte Package `2026.4.26` darf für
lokale Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Packages
müssen die modernen Package-Contracts erfüllen; dieselben Lücken lassen die Release-
Validierung fehlschlagen.

Verwenden Sie breitere Package-Acceptance-Profile, wenn es bei der Release-Frage um ein
tatsächlich installierbares Package geht:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Gängige Package-Profile:

- `smoke`: schnelle Package-Install-/Channel-/Agent-, Gateway-Netzwerk- und Config-
  Reload-Lanes
- `package`: Install-/Update-/Plugin-Package-Contracts ohne Live-ClawHub; dies ist der Release-Check-
  Standard
- `product`: `package` plus MCP-Channels, Cron-/Subagent-Bereinigung, OpenAI-Web-
  Suche und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte erneute Läufe

Für den Telegram-Nachweis eines Paketkandidaten aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den
aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Betreiber gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true` ist, darf dies für einen nur
  validierenden Preflight auch die aktuelle vollständige 40-stellige Commit-SHA des Workflow-Branches sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: auf dem echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standardwert ist `beta`

`OpenClaw Release Checks` akzeptiert diese vom Betreiber gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA zur Validierung. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag aus erreichbar ist.

Regeln:

- Stabile und Korrektur-Tags dürfen entweder nach `beta` oder `latest` veröffentlicht werden
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlicht werden
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur zulässig, wenn
  `preflight_only=true` ist
- `OpenClaw Release Checks` und `Full Release Validation` sind immer
  reine Validierungen
- Der echte Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden, das im Preflight verwendet wurde;
  der Workflow überprüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Stabile npm-Release-Sequenz

Beim Erstellen eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie die aktuelle vollständige Commit-SHA des Workflow-Branches
     für einen nur validierenden Probelauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur,
   wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix- und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Referenz aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   Workflow, um diese stabile Version von `beta` nach `latest` hochzustufen
8. Wenn das Release bewusst direkt nach `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zeigen zu lassen, oder lassen Sie die geplante
   selbstheilende Synchronisierung `beta` später verschieben

Die Dist-Tag-Änderung liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repo die Veröffentlichung ausschließlich per OIDC beibehält.

Damit bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Hochstufungspfad
dokumentiert und für Betreiber sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen Sie alle 1Password-
CLI-Befehle (`op`) nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Shell des Agenten auf; wenn es in tmux bleibt, sind Prompts,
Warnungen und OTP-Verarbeitung beobachtbar, und wiederholte Host-Warnungen werden verhindert.

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

Maintainer verwenden die privaten Release-Dokumente unter
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
als das tatsächliche Runbook.

## Verwandt

- [Release-Kanäle](/de/install/development-channels)
