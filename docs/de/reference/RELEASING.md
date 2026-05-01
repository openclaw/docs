---
read_when:
    - Suche nach Definitionen für öffentliche Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Kadenz
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-01T06:44:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen, oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Vorabversions-Tags, die auf npm `beta` veröffentlichen
- dev: der fortlaufende HEAD von `main`

## Versionsbenennung

- Version eines Stable-Release: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines Stable-Korrektur-Release: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version einer Beta-Vorabversion: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit Nullen auffüllen
- `latest` bezeichnet das aktuell hochgestufte stabile npm-Release
- `beta` bezeichnet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Verantwortliche können explizit `latest` als Ziel wählen oder später einen geprüften Beta-Build hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App zusammen aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paket-Pfad, wobei
  Build, Signierung und Notarisierung der Mac-App für Stable reserviert bleiben, sofern sie nicht ausdrücklich angefordert werden

## Release-Rhythmus

- Releases laufen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise aus einem `release/YYYY.M.D`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Korrekturen neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und eine Korrektur benötigt, erstellen Maintainer
  den nächsten `-beta.N`-Tag, statt den alten Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Verantwortliche

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, Wiederherstellung von Dist-Tags und Details zu Notfall-Rollbacks verbleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neueste Änderungen pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle `main`-CI ausreichend grün ist, um davon zu branchen.
2. Den obersten Abschnitt in `CHANGELOG.md` anhand der echten Commit-Historie mit
   `/changelog` neu schreiben, Einträge nutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätseinträge in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren, warum sie
   absichtlich beibehalten wird.
4. `release/YYYY.M.D` aus dem aktuellen `main` erstellen; normale Release-Arbeiten nicht
   direkt auf `main` durchführen.
5. Jede erforderliche Versionsstelle für den vorgesehenen Tag anheben, dann den
   lokalen deterministischen Preflight ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-stelliger SHA des Release-Branches für reine
   Preflight-Validierung zulässig. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, Tag oder vollständigen Commit-SHA starten. Dies ist der einzige manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch korrigieren und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, das Paketprofil, den Provider oder die Modell-Allowlist erneut ausführen, die
   die Korrektur belegt. Den vollständigen Umbrella nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Beta `vYYYY.M.D-beta.N` taggen, mit npm-Dist-Tag `beta` veröffentlichen und anschließend
   die Paketakzeptanz nach der Veröffentlichung gegen das veröffentlichte Paket `openclaw@YYYY.M.D-beta.N`
   oder `openclaw@beta` ausführen. Wenn eine gepushte oder veröffentlichte Beta eine Korrektur benötigt, erstellen Sie
   das nächste `-beta.N`; den alten Beta-Tag nicht löschen oder überschreiben.
10. Für Stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die stabile npm-Veröffentlichung verwendet das erfolgreiche
    Preflight-Artefakt über `preflight_run_id` erneut; die Release-Bereitschaft der stabilen macOS-Version
    erfordert außerdem die paketierten `.zip`, `.dmg`, `.dSYM.zip` und eine aktualisierte
    `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifier ausführen, optional das eigenständige
    veröffentlichte-npm-Telegram-E2E, wenn Sie einen Kanalnachweis nach der Veröffentlichung benötigen,
    Dist-Tag-Hochstufung bei Bedarf, GitHub-Release-/Prerelease-Notizen aus dem
    vollständigen passenden Abschnitt in `CHANGELOG.md` und die Schritte für die Release-Ankündigung.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren
  Prüfungen für Importzyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  Release-Artefakte unter `dist/*` und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie vor der Release-Freigabe den manuellen Workflow `Full Release Validation` aus, um
  alle Vorab-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, löst manuell `CI` aus und löst
  `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Docker-
  Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-
  Lanes aus. Geben Sie `npm_telegram_package_spec` nur an, nachdem ein Paket
  veröffentlicht wurde und der Telegram-E2E nach der Veröffentlichung ebenfalls laufen soll. Geben Sie
  `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die
  Validierung einem veröffentlichten npm-Paket entspricht, ohne Telegram-E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweis
  für einen Paketkandidaten wünschen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen `package_ref`-Branch/Tag/SHA mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem
  SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-
  Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram-QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die
  ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paket-
  Artefakt der Kandidat und `published_upgrade_survivor_baseline` wählt die
  veröffentlichte Baseline aus.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Installations-/Channel-/Agent-, Gateway-Netzwerk- und Konfigurations-Reload-Lanes
  - `package`: artefakt-native Paket-/Update-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Channels, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten Wiederholungslauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-
  Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Auslösungen umgehen das Changed-
  Scoping und erzwingen die Linux-Node-Shards, gebündelte Plugin-Shards, Channel-
  Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke,
  Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-
  Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt
  QA-Lab über einen lokalen OTLP/HTTP-Receiver aus und verifiziert die exportierten Trace-
  Span-Namen, begrenzten Attribute und Inhalts-/Kennungs-Redaktion, ohne
  Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe außerdem das QA-Lab-Mock-Paritäts-Gate plus das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-
  Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet zusätzlich Convex-CI-
  Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständigen Matrix-
  Transport, Medien und E2EE-Inventar parallel wünschen.
- Cross-OS-Installations- und Upgrade-Laufzeitvalidierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den realen npm-Release-Pfad kurz,
  deterministisch und artefaktorientiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release
Validation` oder vom `main`-/Release-Workflow-Ref ausgelöst werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der reine Validierungs-Preflight von `OpenClaw NPM Release` akzeptiert außerdem den aktuellen
  vollständigen 40-Zeichen-Commit-SHA des Workflow-Branches, ohne einen gepushten Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht zu einer echten Veröffentlichung
  hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; eine echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows halten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten
  Runnern, während der nicht-mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  unter Verwendung der Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Prüfungs-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrektur-Version) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Installed-Package-Onboarding, Telegram-Einrichtung und reales Telegram-E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Credential-
  Pool zu verifizieren. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Maintainer können dieselbe Post-Publish-Prüfung aus GitHub Actions über den
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist absichtlich nur manuell
  und läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss vom selben `main`- oder
    `release/YYYY.M.D`-Branch ausgelöst werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Eingabe explizit `latest` anvisieren
  - tokenbasierte npm-dist-tag-Mutation befindet sich jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo OIDC-only-Veröffentlichung beibehält
  - öffentliches `macOS Release` ist nur Validierung; wenn ein Tag nur auf einem
    Release-Branch existiert, der Workflow aber von `main` ausgelöst wird, setzen Sie
    `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, anstatt sie
    erneut zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier
  auch denselben Temp-Präfix-Upgrade-Pfad von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen ältere globale Installationen nicht stillschweigend auf der
  stabilen Basis-Payload belassen können
- Der npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass die veröffentlichte Registry-Installation
  nicht leere Runtime-Abhängigkeiten gebündelter Plugins im Root-`dist/*`-
  Layout enthält. Ein Release, das mit fehlenden oder leeren gebündelten Plugin-
  Abhängigkeits-Payloads ausgeliefert wird, schlägt im Postpublish-Verifier fehl und kann nicht
  auf `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, damit Installer-E2E versehentliche Pack-Aufblähung
  vor dem Release-Veröffentlichungspfad abfängt
- Wenn die Release-Arbeit CI-Planung, Erweiterungs-Timing-Manifeste oder
  Erweiterungstest-Matrizen berührt hat, generieren und prüfen Sie die vom Planner verwalteten
  `plugin-prerelease-extension-shard`-Matrixausgaben aus
  `.github/workflows/plugin-prerelease.yml` vor der Freigabe neu, damit Release Notes kein
  veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst außerdem die Updater-Oberflächen:
  - Das GitHub-Release muss am Ende die gepackten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile ZIP-Datei zeigen
  - die gepackte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version beibehalten

## Release-Testboxen

`Full Release Validation` ist der Weg, wie Operatoren alle Vorab-Release-Tests von
einem Einstiegspunkt aus starten. Führen Sie es vom vertrauenswürdigen `main`-Workflow-Ref aus und übergeben Sie den Release-
Branch, das Tag oder den vollständigen Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Der Workflow löst den Ziel-Ref auf, löst manuell `CI` mit
`target_ref=<release-ref>` aus, löst `OpenClaw Release Checks` aus und
löst optional eigenständiges Post-Publish-Telegram-E2E aus, wenn
`npm_telegram_package_spec` gesetzt ist. `OpenClaw Release Checks` fächert dann
Install-Smoke, Cross-OS-Release-Prüfungen, Live/E2E-Docker-Release-Pfad-Abdeckung,
Package Acceptance mit Telegram-Paket-QA, QA-Lab-Parität, Live-Matrix und
Live-Telegram aus. Ein vollständiger Lauf ist nur akzeptabel, wenn die Zusammenfassung von `Full Release Validation`
`normal_ci` und `release_checks` als erfolgreich ausweist und jedes optionale
`npm_telegram`-Child entweder erfolgreich ist oder absichtlich übersprungen wurde. Die abschließende
Verifier-Zusammenfassung enthält Tabellen der langsamsten Jobs für jeden Child-Lauf, damit der Release-
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Stage-Matrix, exakte Workflow-Jobnamen, Unterschiede zwischen Stable- und Full-Profil,
Artefakte und Handles für fokussierte Wiederholungsläufe.
Child-Workflows werden vom vertrauenswürdigen Ref ausgelöst, der `Full Release
Validation` ausführt, normalerweise `--ref main`, selbst wenn der Ziel-`ref` auf einen
älteren Release-Branch oder ein älteres Tag zeigt. Es gibt keinen separaten Full-Release-Validation-
Workflow-Ref-Input; wählen Sie den vertrauenswürdigen Harness, indem Sie den Workflow-Run-Ref wählen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster releasekritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider-/Backend-Abdeckung für Release-Freigabe
- `full`: Stable plus breite Advisory-Provider-/Medienabdeckung

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die Ziel-Ref einmal als `release-package-under-test` aufzulösen, und nutzt dieses Artefakt sowohl in den release-pfadbezogenen Docker-Prüfungen als auch in Package Acceptance wieder. Dadurch bleiben alle paketbezogenen Boxen auf denselben Bytes, und wiederholte Paket-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4-mini`, weil diese Lane die Paketinstallation, das Onboarding, den Gateway-Start und eine Live-Agent-Runde nachweist, statt das langsamste Standardmodell zu benchmarken. Die breitere Live-Provider-Matrix bleibt der Ort für modellspezifische Abdeckung.

Verwenden Sie je nach Release-Phase diese Varianten:

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

Verwenden Sie den vollständigen Umbrella nicht als erste Wiederholung nach einem fokussierten Fix. Wenn eine Box fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen Child-Workflow, Job, die Docker-Lane, das Package-Profil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella nur erneut aus, wenn der Fix die gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise veraltet gemacht hat. Der finale Verifier des Umbrellas prüft die aufgezeichneten Child-Workflow-Run-IDs erneut. Nachdem ein Child-Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen Parent-Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte Release-Candidate-Run, `ci` führt nur das normale CI-Child aus, `plugin-prerelease` führt nur das release-exklusive Plugin-Child aus, `release-checks` führt jede Release-Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`, wenn die eigenständige Package-Telegram-Lane angegeben ist.

### Vitest

Die Vitest-Box ist der manuelle Child-Workflow `CI`. Manuelles CI umgeht bewusst das Changed-Scoping und erzwingt den normalen Testgraphen für den Release Candidate: Linux-Node-Shards, Shards für gebündelte Plugins, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um die Frage zu beantworten: „Hat der Quellbaum die vollständige normale Testsuite bestanden?“ Sie ist nicht dasselbe wie die Produktvalidierung des Release-Pfads. Aufzubewahrende Nachweise:

- Zusammenfassung von `Full Release Validation`, die die URL des ausgelösten `CI`-Runs zeigt
- grüner `CI`-Run auf dem exakten Ziel-SHA
- fehlgeschlagene oder langsame Shard-Namen aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn ein Run Performance-Analyse benötigt

Führen Sie manuelles CI nur dann direkt aus, wenn das Release deterministisches normales CI benötigt, aber nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Package-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über `openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-Workflow `install-smoke`. Sie validiert den Release Candidate über paketierte Docker-Umgebungen statt nur über Source-Level-Tests.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamen Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-, Root/Gateway- und Installer/Bun-Smoke-Jobs als separate Install-Smoke-Shards laufen
- Repository-E2E-Lanes
- Release-Pfad-Docker-Chunks: `core`, `package-update-openai`,
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
- aufgeteilte Lanes für gebündelte Channel-Abhängigkeiten über Channel-Smoke-, Update-Target- und Setup/Runtime-Contract-Chunks statt eines großen gebündelten Channel-Jobs
- aufgeteilte Install-/Uninstall-Lanes für gebündelte Plugins
  `bundled-plugin-install-uninstall-0` bis
  `bundled-plugin-install-uninstall-23`
- Live-/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Prüfungen Live-Suites einschließen

Verwenden Sie Docker-Artefakte vor einer erneuten Ausführung. Der Release-Pfad-Scheduler lädt `.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`, Phase-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Verwenden Sie für fokussierte Wiederherstellung `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow, statt alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten vorherige `package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, sofern verfügbar, sodass eine fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest und Docker-Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Parity-Gate, das die OpenAI-Candidate-Lane mit der Opus-4.6-Baseline unter Verwendung des agentischen Parity-Packs vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um die Frage zu beantworten: „Verhält sich das Release in QA-Szenarien und Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Parity-, Matrix- und Telegram-Lanes auf, wenn Sie das Release freigeben. Die vollständige Matrix-Abdeckung bleibt als manueller geshardeter QA-Lab-Run verfügbar und ist nicht die standardmäßige releasekritische Lane.

### Package

Die Package-Box ist das Gate für das installierbare Produkt. Sie wird durch `Package Acceptance` und den Resolver `scripts/resolve-openclaw-package-candidate.mjs` unterstützt. Der Resolver normalisiert einen Candidate in den Tarball `package-under-test`, der von Docker-E2E konsumiert wird, validiert das Paketinventar, zeichnet die Paketversion und SHA-256 auf und hält die Workflow-Harness-Ref getrennt von der Paket-Source-Ref.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version
- `source=ref`: eine vertrauenswürdige `package_ref`-Branch, ein Tag oder ein vollständiges Commit-SHA mit dem ausgewählten `workflow_ref`-Harness packen
- `source=url`: eine HTTPS-`.tgz` mit erforderlichem `package_sha256` herunterladen
- `source=artifact`: eine von einem anderen GitHub-Actions-Run hochgeladene `.tgz` wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` und `telegram_mode=mock-openai` aus. Die Release-Pfad-Docker-Chunks decken die überlappenden Install-, Update- und Plugin-Update-Lanes ab; Package Acceptance behält artefaktnative Kompatibilität gebündelter Channels, Offline-Plugin-Fixtures und Telegram-Package-QA gegen denselben aufgelösten Tarball bei. Es ist der GitHub-native Ersatz für den Großteil der Package-/Update-Abdeckung, die zuvor Parallels erforderte. Cross-OS-Release-Prüfungen bleiben für OS-spezifisches Onboarding, Installer- und Plattformverhalten relevant, aber Package-/Update-Produktvalidierung sollte Package Acceptance bevorzugen.

Die Legacy-Nachsicht bei Package Acceptance ist bewusst zeitlich begrenzt. Pakete bis einschließlich `2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits auf npm veröffentlicht wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, alte Speicherorte für Plugin-Install-Records, fehlende Persistenz von Marketplace-Install-Records und Konfigurationsmetadatenmigration während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf Warnungen für lokale Build-Metadaten-Stamp-Dateien ausgeben, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Package-Verträge erfüllen; dieselben Lücken führen dann zum Fehlschlagen der Release-Validierung.

Verwenden Sie breitere Package-Acceptance-Profile, wenn die Release-Frage ein tatsächlich installierbares Paket betrifft:

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

- `smoke`: schnelle Lanes für Paketinstallation/Channel/Agent, Gateway-Netzwerk und Konfigurations-Reload
- `package`: Install-/Update-/Plugin-Package-Verträge ohne Live-ClawHub; dies ist der Standard für Release-Prüfungen
- `product`: `package` plus MCP-Channels, Cron/Subagent-Cleanup, OpenAI-Websuche und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Reruns

Aktivieren Sie für Package-Candidate-Telegram-Nachweis `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den aufgelösten Tarball `package-under-test` an die Telegram-Lane; der eigenständige Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Post-Publish-Prüfungen.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder `v2026.4.2-beta.1`; wenn `preflight_only=true`, kann es für reine Validierungs-Preflights auch das aktuelle vollständige 40-Zeichen-Commit-SHA der Workflow-Branch sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow den vorbereiteten Tarball aus dem erfolgreichen Preflight-Run wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständiges Commit-SHA zur Validierung. Prüfungen mit Secrets erfordern, dass das aufgelöste Commit von einer OpenClaw-Branch oder einem Release-Tag erreichbar ist.

Regeln:

- Stable- und Korrektur-Tags dürfen entweder nach `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist eine vollständige Commit-SHA-Eingabe nur erlaubt, wenn `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer nur der Validierung
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflights verwendet wurde; der Workflow verifiziert diese Metadaten vor der Fortsetzung der Veröffentlichung

## Stabile npm-Release-Sequenz

Beim Erstellen eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag vorhanden ist, können Sie den aktuellen vollständigen Commit-
     SHA des Workflow-Branch für einen reinen Validierungs-Probelauf des Preflight-
     Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest`
   nur, wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder
   vollständigen Commit-SHA aus, wenn Sie normale CI sowie Live-Prompt-Cache-,
   Docker-, QA-Lab-, Matrix- und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen
   Sie stattdessen den manuellen `CI`-Workflow auf dem Release-Ref aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   Workflow, um diese stabile Version von `beta` zu `latest` hochzustufen
8. Wenn das Release bewusst direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide dist-tags auf die stabile Version zu setzen, oder lassen Sie
   die geplante selbstheilende Synchronisierung `beta` später verschieben

Die dist-tag-Mutation liegt aus Sicherheitsgründen im privaten Repo, weil sie
weiterhin `NPM_TOKEN` erfordert, während das öffentliche Repo eine reine OIDC-
Veröffentlichung beibehält.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-
Hochstufungspfad dokumentiert und für Operator sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen Sie
alle 1Password-CLI-(`op`)-Befehle nur innerhalb einer dedizierten tmux-Sitzung aus.
Rufen Sie `op` nicht direkt aus der Haupt-Agent-Shell auf; wenn es innerhalb von
tmux bleibt, sind Prompts, Warnungen und OTP-Verarbeitung beobachtbar und wiederholte
Host-Warnungen werden verhindert.

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
für das eigentliche Runbook.

## Verwandt

- [Release-Kanäle](/de/install/development-channels)
