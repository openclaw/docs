---
read_when:
    - Suche nach Definitionen öffentlicher Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Betreiber-Checkliste, Validierungsboxen, Versionsbenennung und Taktung
title: Veröffentlichungsrichtlinie
x-i18n:
    generated_at: "2026-04-30T07:13:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Veröffentlichungskanäle:

- stable: getaggte Veröffentlichungen, die standardmäßig unter npm `beta` veröffentlicht werden, oder unter npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Prerelease-Tags, die unter npm `beta` veröffentlicht werden
- dev: der sich bewegende Head von `main`

## Versionsbenennung

- Version einer stabilen Veröffentlichung: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version einer stabilen Korrekturveröffentlichung: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version einer Beta-Vorabveröffentlichung: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet die aktuell promotete stabile npm-Veröffentlichung
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrekturveröffentlichungen werden standardmäßig unter npm `beta` veröffentlicht; Release-Operatoren können ausdrücklich `latest` als Ziel wählen oder später einen geprüften Beta-Build promoten
- Jede stabile OpenClaw-Veröffentlichung liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Veröffentlichungen validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, wobei
  das Bauen/Signieren/Notarisieren der Mac-App für stabile Veröffentlichungen reserviert ist, sofern es nicht ausdrücklich angefordert wird

## Veröffentlichungsrhythmus

- Veröffentlichungen gehen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Veröffentlichungen normalerweise aus einem `release/YYYY.M.D`-Branch, der
  vom aktuellen `main` erstellt wurde, damit Release-Validierung und Korrekturen neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und eine Korrektur benötigt, erstellen Maintainer
  den nächsten `-beta.N`-Tag, statt den alten Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Verfahren, Freigaben, Anmeldedaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt die öffentliche Form des Veröffentlichungsablaufs. Private Anmeldedaten,
Signierung, Notarisierung, Wiederherstellung von Dist-Tags und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neueste Änderungen pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle CI von `main` gut genug ist, um davon zu branchen.
2. Den obersten Abschnitt in `CHANGELOG.md` anhand der echten Commit-Historie mit
   `/changelog` neu schreiben, Einträge nutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätseinträge in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren, warum sie
   absichtlich weitergeführt wird.
4. `release/YYYY.M.D` vom aktuellen `main` erstellen; normale Release-Arbeit nicht
   direkt auf `main` durchführen.
5. Alle erforderlichen Versionsstellen für den vorgesehenen Tag erhöhen, dann die
   lokale deterministische Vorprüfung ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branches für eine reine Validierungs-
   Vorprüfung erlaubt. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Vorabtests mit `Full Release Validation` für den
   Release-Branch, Tag oder vollständigen Commit-SHA starten. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch korrigieren und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, das Paketprofil, den Provider oder die Modell-Allowlist erneut ausführen, die
   die Korrektur belegt. Den vollständigen Umbrella nur erneut ausführen, wenn die geänderte Fläche
   frühere Nachweise veralten lässt.
9. Für Beta `vYYYY.M.D-beta.N` taggen, mit dem npm-Dist-Tag `beta` veröffentlichen und dann
   die Paketakzeptanz nach der Veröffentlichung gegen das veröffentlichte Paket `openclaw@YYYY.M.D-beta.N`
   oder `openclaw@beta` ausführen. Wenn eine gepushte oder veröffentlichte Beta eine Korrektur benötigt,
   den nächsten `-beta.N` erstellen; die alte Beta nicht löschen oder umschreiben.
10. Für Stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate über die
    erforderlichen Validierungsnachweise verfügt. Die stabile npm-Veröffentlichung verwendet das erfolgreiche
    Vorprüfungsartefakt über `preflight_run_id` erneut; die Bereitschaft für eine stabile macOS-Veröffentlichung
    erfordert außerdem die paketierten `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte
    `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Prüfer nach der Veröffentlichung ausführen, optional das eigenständige
    veröffentlichte-npm-Telegram-E2E, wenn Sie Kanalnachweis nach der Veröffentlichung benötigen,
    Dist-Tag-Promotion bei Bedarf, GitHub-Release-/Prerelease-Notizen aus dem
    vollständigen passenden `CHANGELOG.md`-Abschnitt und die Schritte zur Release-Ankündigung.

## Release-Vorprüfung

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren
  Importzyklus- und Architekturgrenzen-Prüfungen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um
  alle Pre-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, startet manuell `CI` und startet
  `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Docker-
  Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix und Telegram-
  Lanes. Geben Sie `npm_telegram_package_spec` nur an, nachdem ein Paket
  veröffentlicht wurde und die Telegram-E2E nach der Veröffentlichung ebenfalls laufen soll. Geben Sie
  `evidence_package_spec` an, wenn der private Nachweisbericht belegen soll, dass die
  Validierung zu einem veröffentlichten npm-Paket passt, ohne Telegram-E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweise
  für einen Paketkandidaten wünschen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen `package_ref`-Branch/Tag/SHA mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem
  SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-
  Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram-QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Installations-/Channel-/Agent-, Gateway-Netzwerk- und Config-Reload-Lanes
  - `package`: artefaktnative Paket-/Update-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Channels, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Abschnitte mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten erneuten Lauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-
  Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Starts umgehen das Changed-
  Scoping und erzwingen die Linux-Node-Shards, gebündelte Plugin-Shards, Channel-
  Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke,
  Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-
  Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt
  QA-Lab über einen lokalen OTLP/HTTP-Empfänger aus und verifiziert die exportierten Trace-
  Span-Namen, begrenzten Attribute und die Schwärzung von Inhalten/Bezeichnern, ohne
  Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem das QA-Lab-Mock-Paritäts-Gate sowie das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane vor der Release-Freigabe aus. Die Live-
  Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-
  Zugangsdaten-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständigen Matrix-
  Transport, Medien und E2EE-Inventar parallel wünschen.
- Laufzeitvalidierung für Cross-OS-Installation und -Upgrade ist Teil der öffentlichen
  `OpenClaw Release Checks` und der `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release
Validation` oder vom `main`-/Release-Workflow-Ref gestartet werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der Validierungs-Preflight von `OpenClaw NPM Release` akzeptiert auch den aktuellen
  vollständigen 40-stelligen Workflow-Branch-Commit-SHA, ohne einen gepushten Tag zu verlangen
- Dieser SHA-Pfad ist nur für die Validierung und kann nicht zu einer echten Veröffentlichung
  befördert werden
- Im SHA-Modus erzeugt der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; eine echte Veröffentlichung erfordert weiterhin einen echten Release-Tag
- Beide Workflows behalten die echte Veröffentlichungs- und Promotion-Strecke auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  unter Verwendung der Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Prüfungs-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder den passenden Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Prefix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Onboarding des installierten Pakets, Telegram-Einrichtung und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Zugangsdaten-
  Pool zu verifizieren. Lokale Maintainer-Einmalläufe können die Convex-Variablen weglassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Zugangsdaten direkt übergeben.
- Maintainer können dieselbe Post-Publish-Prüfung aus GitHub Actions über den
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist absichtlich nur manuell
  und läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss vom selben `main`- oder
    `release/YYYY.M.D`-Branch wie der erfolgreiche Preflight-Lauf gestartet werden
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann explizit über Workflow-Eingabe `latest` anvisieren
  - tokenbasierte npm-dist-tag-Mutation lebt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo nur OIDC-Veröffentlichung behält
  - öffentliche `macOS Release` ist nur Validierung
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier
  auch denselben temporären Prefix-Upgrade-Pfad von `YYYY.M.D` zu `YYYY.M.D-N`,
  damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem
  stabilen Basis-Payload belassen
- Der npm-Release-Preflight schlägt geschlossen fehl, wenn der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass die veröffentlichte Registry-Installation
  nicht leere Laufzeitabhängigkeiten gebündelter Plugins unter dem Root-`dist/*`-
  Layout enthält. Ein Release, dem fehlende oder leere Abhängigkeits-Payloads
  gebündelter Plugins fehlen, lässt den Postpublish-Verifier fehlschlagen und kann nicht
  zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, sodass Installer-E2E versehentlichen Pack-Bloat
  vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit CI-Planung, Plugin-Timing-Manifeste oder
  Plugin-Testmatrizen berührt hat, generieren und prüfen Sie die vom Planner besessenen
  `plugin-prerelease-extension-shard`-Matrix-Ausgaben aus
  `.github/workflows/plugin-prerelease.yml` vor der Freigabe neu, damit Release Notes kein
  veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf das neue stabile Zip zeigen
  - die paketierte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist die Methode, mit der Operator alle Pre-Release-Tests über
einen Einstiegspunkt starten. Führen Sie sie vom vertrauenswürdigen `main`-Workflow-Ref aus und übergeben Sie den Release-
Branch, Tag oder vollständigen Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Der Workflow löst den Ziel-Ref auf, startet manuell `CI` mit
`target_ref=<release-ref>`, startet `OpenClaw Release Checks` und
startet optional eigenständiges Post-Publish-Telegram-E2E, wenn
`npm_telegram_package_spec` gesetzt ist. `OpenClaw Release Checks` fächert dann
Install-Smoke, Cross-OS-Release-Prüfungen, Live/E2E-Docker-Release-Pfad-Abdeckung,
Package Acceptance mit Telegram-Paket-QA, QA-Lab-Parität, Live-Matrix und
Live-Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die Zusammenfassung von `Full Release Validation`
`normal_ci` und `release_checks` als erfolgreich zeigt und jedes optionale
`npm_telegram`-Kind entweder erfolgreich ist oder absichtlich übersprungen wurde. Die abschließende
Verifier-Zusammenfassung enthält Tabellen der langsamsten Jobs für jeden Kindlauf, damit der Release-
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Kind-Workflows werden vom vertrauenswürdigen Ref gestartet, der `Full Release
Validation` ausführt, normalerweise `--ref main`, selbst wenn der Ziel-`ref` auf einen
älteren Release-Branch oder Tag zeigt. Es gibt keinen separaten Full-Release-Validation-
Workflow-Ref-Input; wählen Sie das vertrauenswürdige Harness, indem Sie den Workflow-Lauf-Ref wählen.

Verwenden Sie `release_profile`, um Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster releasekritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider-/Backend-Abdeckung für Release-Freigabe
- `full`: Stable plus breite Advisory-Provider-/Medienabdeckung

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den Ziel-
Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt sowohl in
Release-Pfad-Docker-Prüfungen als auch in Package Acceptance wieder. So bleiben alle
paketbezogenen Boxen auf denselben Bytes und wiederholte Paket-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4-mini`, weil diese Lane
Paketinstallation, Onboarding, Gateway-Start und einen Live-Agent-Turn nachweist,
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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Verwenden Sie den vollständigen Sammel-Workflow nicht als ersten erneuten Lauf nach einer fokussierten Korrektur. Wenn eine Box
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job, die Docker-Lane, das Paketprofil, den Modell-
Provider oder die QA-Lane. Führen Sie den vollständigen Sammel-Workflow erst dann erneut aus, wenn
die Korrektur die gemeinsame Release-Orchestrierung geändert oder frühere Nachweise aus allen Boxen
veraltet gemacht hat. Der abschließende Prüfer des Sammel-Workflows prüft die aufgezeichneten Run-IDs der untergeordneten Workflows
erneut. Nachdem ein untergeordneter Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Für eine begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Sammel-Workflow. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur den normalen CI-Child aus, `plugin-prerelease`
führt nur den release-spezifischen Plugin-Child aus, `release-checks` führt jede Release-
Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`, wenn die
eigenständige Paket-Telegram-Lane angegeben wird.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete Workflow `CI`. Die manuelle CI umgeht absichtlich
das Scoping auf geänderte Dateien und erzwingt den normalen Testgraphen für den Release-
Candidate: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Contracts, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um die Frage zu beantworten: „Hat der Quellbaum die vollständige normale Testsuite bestanden?“
Sie ist nicht dasselbe wie Produktvalidierung entlang des Release-Pfads. Aufzubewahrende Nachweise:

- Zusammenfassung von `Full Release Validation` mit der ausgelösten `CI`-Run-URL
- grüner `CI`-Run auf dem exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Run eine Performance-Analyse benötigt

Führen Sie die manuelle CI nur dann direkt aus, wenn das Release deterministische normale CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-
Workflow `install-smoke`. Sie validiert den Release-Candidate über paketierte
Docker-Umgebungen statt nur über Tests auf Quellcodeebene.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Installations-Smoke-Test mit aktiviertem langsamem globalem Bun-Installations-Smoke-Test
- Vorbereitung/Wiederverwendung des Smoke-Images aus dem Root-Dockerfile nach Ziel-SHA, wobei QR-,
  Root/Gateway- und Installer/Bun-Smoke-Jobs als separate install-smoke-
  Shards laufen
- Repository-E2E-Lanes
- Docker-Chunks im Release-Pfad: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` und
  `bundled-channels-contracts`
- OpenWebUI-Abdeckung innerhalb des Chunks `plugins-runtime-services`, wenn angefordert
- aufgeteilte Dependency-Lanes für gebündelte Channels über channel-smoke-, update-target-
  und setup/runtime-Contract-Chunks statt eines großen gebündelten Channel-Jobs
- aufgeteilte Installations-/Deinstallations-Lanes für gebündelte Plugins
  `bundled-plugin-install-uninstall-0` bis
  `bundled-plugin-install-uninstall-23`
- Live/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Prüfungen
  Live-Suites einschließen

Verwenden Sie Docker-Artefakte vor erneuten Läufen. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Befehlen für erneute Läufe hoch. Für eine fokussierte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow, statt
alle Release-Chunks erneut auszuführen. Generierte Befehle für erneute Läufe enthalten, wenn verfügbar, die vorherige
`package_artifact_run_id` und vorbereitete Docker-Image-Eingaben, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest- und Docker-
Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Gate, das die OpenAI-Candidate-Lane mithilfe des agentischen Paritäts-Pakets mit der Opus-4.6-
  Baseline vergleicht
- schnelles Live-Matrix-QA-Profil unter Verwendung der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um die Frage zu beantworten: „Verhält sich das Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie beim Freigeben des Releases die Artefakt-URLs für Paritäts-,
Matrix- und Telegram-Lanes auf. Die vollständige Matrix-Abdeckung bleibt als
manueller geshardeter QA-Lab-Lauf verfügbar, nicht als standardmäßige release-kritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird durch
`Package Acceptance` und den Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen
Candidate in den Tarball `package-under-test`, der von Docker-E2E verwendet wird, validiert
das Paketinventar, zeichnet Paketversion und SHA-256 auf und hält die
Workflow-Harness-Referenz getrennt von der Paketquell-Referenz.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: Packt einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness
- `source=url`: Lädt eine HTTPS-`.tgz` mit erforderlichem `package_sha256` herunter
- `source=artifact`: Verwendet eine von einem anderen GitHub-Actions-Run hochgeladene `.tgz` wieder

`OpenClaw Release Checks` führt Package Acceptance mit `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` und
`telegram_mode=mock-openai` aus. Die Docker-Chunks im Release-Pfad decken die
überlappenden Installations-, Update- und Plugin-Update-Lanes ab; Package Acceptance behält
artefakt-native Kompatibilität für gebündelte Channels, Offline-Plugin-Fixtures und Telegram-
Paket-QA gegen denselben aufgelösten Tarball bei. Es ist der GitHub-native
Ersatz für den Großteil der Paket-/Update-Abdeckung, die zuvor
Parallels erforderte. Cross-OS-Release-Prüfungen bleiben für OS-spezifisches Onboarding,
Installer- und Plattformverhalten wichtig, aber Produktvalidierung für Paket/Update sollte
Package Acceptance bevorzugen.

Die Legacy-Nachsicht der Package Acceptance ist absichtlich zeitlich begrenzt. Pakete bis einschließlich
`2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits auf npm veröffentlicht
wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-
Fixture, fehlendes persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze,
fehlende Persistenz von Marketplace-Installationsdatensätzen und Config-Metadaten-
Migration während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf
für bereits ausgelieferte lokale Build-Metadaten-Stempeldateien warnen. Spätere Pakete
müssen die modernen Paketverträge erfüllen; dieselben Lücken lassen dann die Release-
Validierung fehlschlagen.

Verwenden Sie umfassendere Package-Acceptance-Profile, wenn die Release-Frage ein
tatsächlich installierbares Paket betrifft:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Gängige Paketprofile:

- `smoke`: schnelle Paketinstallations-/Channel-/Agent-, Gateway-Netzwerk- und Config-
  Reload-Lanes
- `package`: Installations-/Update-/Plugin-Paketverträge ohne Live-ClawHub; dies ist der Standard für Release-Prüfungen
- `product`: `package` plus MCP-Channels, Cron/Subagent-Cleanup, OpenAI-Web-
  Suche und OpenWebUI
- `full`: Docker-Chunks im Release-Pfad mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte erneute Läufe

Für den Telegram-Nachweis eines Paket-Candidates aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den
aufgelösten Tarball `package-under-test` an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Post-Publish-Prüfungen.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, kann dies auch der aktuelle
  vollständige 40-Zeichen-Commit-SHA des Workflow-Branches für einen nur validierenden Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Run wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständiger Commit-SHA zur Validierung. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag aus erreichbar ist.

Regeln:

- Stabile und Korrektur-Tags dürfen entweder nach `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer nur der
  Validierung
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflights verwendet wurde;
  der Workflow prüft, dass die Metadaten vor der Veröffentlichung weiterhin übereinstimmen

## Ablauf für ein stabiles npm-Release

Wenn Sie ein stabiles npm-Release erstellen:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit-
     SHA des Workflow-Branches für einen nur validierenden Trockenlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder nur dann `latest`,
   wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Referenz aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   Workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` nach `latest` zu befördern
8. Wenn das Release bewusst direkt nach `latest` veröffentlicht wurde und `beta`
   sofort denselben stabilen Build erhalten soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zeigen zu lassen, oder lassen Sie die geplante
   Selbstheilungs-Synchronisierung `beta` später verschieben

Die Dist-Tag-Änderung liegt aus Sicherheitsgründen im privaten Repo, da sie weiterhin
`NPM_TOKEN` benötigt, während das öffentliche Repo OIDC-only Publish beibehält.

Damit bleiben der direkte Veröffentlichungspfad und der Beta-zuerst-Promotion-Pfad beide
dokumentiert und für Operatoren sichtbar.

Wenn Wartungsverantwortliche auf lokale npm-Authentifizierung zurückgreifen müssen, führen Sie alle 1Password
CLI-Befehle (`op`) nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Shell des Agents auf; die Ausführung in tmux macht Eingabeaufforderungen,
Warnmeldungen und OTP-Verarbeitung beobachtbar und verhindert wiederholte Host-Warnmeldungen.

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

Wartungsverantwortliche verwenden die privaten Veröffentlichungsdokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
für die eigentliche Ablaufanleitung.

## Verwandte Themen

- [Release-Kanäle](/de/install/development-channels)
