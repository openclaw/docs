---
read_when:
    - Suche nach Definitionen für öffentliche Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-02T23:39:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Lanes:

- stable: getaggte Releases, die standardmäßig nach npm `beta` veröffentlicht werden oder nach npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Vorabversions-Tags, die nach npm `beta` veröffentlicht werden
- dev: die fortlaufende Spitze von `main`

## Versionsbenennung

- Version eines stabilen Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines stabilen Korrektur-Releases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version einer Beta-Vorabversion: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat und Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell hochgestufte stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile Releases und stabile Korrektur-Releases werden standardmäßig nach npm `beta` veröffentlicht; Release-Operatoren können ausdrücklich `latest` als Ziel wählen oder später einen geprüften Beta-Build hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App zusammen aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  Build, Signierung und Notarisierung der Mac-App für stabile Releases reserviert sind, sofern nicht ausdrücklich angefordert

## Release-Takt

- Releases laufen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise aus einem `release/YYYY.M.D`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Korrekturen neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und eine Korrektur benötigt, erstellen Maintainer
  stattdessen den nächsten `-beta.N`-Tag, anstatt den alten Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste ist die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, Wiederherstellung von dist-tags und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neuesten Stand pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle `main`-CI grün genug ist, um davon zu branchen.
2. Den obersten Abschnitt in `CHANGELOG.md` aus der echten Commit-Historie mit
   `/changelog` neu schreiben, Einträge nutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätseinträge in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren, warum sie
   absichtlich beibehalten wird.
4. `release/YYYY.M.D` aus dem aktuellen `main` erstellen; normale Release-Arbeit nicht
   direkt auf `main` durchführen.
5. Jede erforderliche Versionsstelle für den vorgesehenen Tag erhöhen, dann
   `pnpm plugins:sync` ausführen, damit veröffentlichbare Plugin-Pakete die Release-
   Version und Kompatibilitätsmetadaten teilen, anschließend den lokalen deterministischen Preflight ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` und
   `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist für einen reinen Validierungs-Preflight ein vollständiger Release-Branch-SHA mit 40 Zeichen erlaubt.
   Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, Tag oder vollständigen Commit-SHA anstoßen. Dies ist der einzige manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch korrigieren und die kleinste fehlgeschlagene
   Datei, Lane, den Workflow-Job, das Paketprofil, den Provider oder die Modell-Allowlist erneut ausführen, die
   die Korrektur belegt. Das vollständige Umbrella nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Beta `vYYYY.M.D-beta.N` taggen, dann `OpenClaw Release Publish` aus
   dem passenden `release/YYYY.M.D`-Branch ausführen. Es prüft `pnpm plugins:sync:check`,
   veröffentlicht zuerst alle veröffentlichbaren Plugin-Pakete nach npm, veröffentlicht denselben
   Satz danach nach ClawHub und stuft anschließend das vorbereitete OpenClaw-npm-Preflight-
   Artefakt mit dem passenden dist-tag hoch. Nach der Veröffentlichung die Paketakzeptanz nach der Veröffentlichung
   gegen das veröffentlichte Paket `openclaw@YYYY.M.D-beta.N` oder
   `openclaw@beta` ausführen. Wenn eine gepushte oder veröffentlichte Vorabversion eine Korrektur benötigt,
   die nächste passende Vorabversionsnummer erstellen; die alte
   Vorabversion nicht löschen oder umschreiben.
10. Für Stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die stabile npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` wieder; die Bereitschaft des stabilen macOS-Releases erfordert außerdem die
    paketierte `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Verifizierer nach der Veröffentlichung ausführen, optional das eigenständige
    Telegram-E2E mit veröffentlichtem npm, wenn Sie einen Kanalnachweis nach der Veröffentlichung benötigen,
    dist-tag-Hochstufung bei Bedarf, GitHub-Release-/Vorabversionshinweise aus dem
    vollständigen passenden Abschnitt von `CHANGELOG.md` und die Schritte zur Release-Ankündigung.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript außerhalb des schnelleren lokalen Gates `pnpm check` abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Prüfungen auf Importzyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten Release-Artefakte `dist/*` und das Control-UI-Bundle für den Paketvalidierungsschritt vorhanden sind
- Führen Sie `pnpm plugins:sync` nach dem Versions-Bump im Root und vor dem Tagging aus. Es aktualisiert die Versionen veröffentlichbarer Plugin-Pakete, OpenClaw-Peer-/API-Kompatibilitätsmetadaten, Build-Metadaten und Plugin-Changelog-Stubs passend zur Core-Release-Version. `pnpm plugins:sync:check` ist der nicht mutierende Release-Guard; der Publish-Workflow schlägt vor jeder Registry-Mutation fehl, wenn dieser Schritt vergessen wurde.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um alle Pre-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, startet manuell `CI` und startet `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Docker-Release-Pfad-Suiten, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes. Mit `release_profile=full` und `rerun_group=all` führt er außerdem Paket-Telegram-E2E gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen aus. Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dasselbe Telegram-E2E auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance seine Paket-/Update-Matrix gegen das ausgelieferte npm-Paket statt gegen das aus der SHA gebaute Artefakt ausführen soll. Geben Sie `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die Validierung einem veröffentlichten npm-Paket entspricht, ohne Telegram-E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie einen Nebenkanal-Nachweis für einen Paketkandidaten möchten, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`, um einen vertrauenswürdigen `package_ref`-Branch/-Tag/-SHA mit dem aktuellen `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlicher SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen Tarball erneut und kann Telegram-QA gegen denselben Tarball mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Install-/Channel-/Agent-, Gateway-Netzwerk- und Config-Reload-Lanes
  - `package`: artefaktnative Paket-/Update-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Channels, Cron-/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte Auswahl von `docker_lanes` für einen fokussierten erneuten Lauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Starts umgehen das Changed-Scoping und erzwingen die Linux-Node-Shards, Bundled-Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es führt QA-Lab über einen lokalen OTLP/HTTP-Empfänger aus und prüft die exportierten Trace-Span-Namen, begrenzte Attribute sowie Inhalts-/Kennungsredaktion, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die mutierende Publish-Sequenz aus, nachdem das Tag existiert. Starten Sie es von `release/YYYY.M.D` aus (oder von `main`, wenn ein von `main` erreichbares Tag veröffentlicht wird), übergeben Sie das Release-Tag und die erfolgreiche OpenClaw-npm-`preflight_run_id`, und behalten Sie den standardmäßigen Plugin-Publish-Scope `all-publishable` bei, sofern Sie nicht bewusst eine fokussierte Reparatur ausführen. Der Workflow serialisiert den Plugin-npm-Publish, den Plugin-ClawHub-Publish und den OpenClaw-npm-Publish, damit das Core-Paket nicht vor seinen externalisierten Plugins veröffentlicht wird.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem die QA-Lab-Mock-Paritäts-Lane sowie das schnelle Live-Matrix-Profil und die Telegram-QA-Lane vor der Release-Freigabe aus. Die Live-Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie den vollständigen Matrix-Transport-, Medien- und E2EE-Bestand parallel prüfen möchten.
- Plattformübergreifende Installations- und Upgrade-Laufzeitvalidierung ist Teil der öffentlichen `OpenClaw Release Checks` und von `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz, deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer eigenen Lane bleiben, damit sie den Publish nicht aufhalten oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release Validation` oder vom Workflow-Ref `main`/Release aus gestartet werden, damit Workflow-Logik und Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, solange der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der rein validierende Preflight von `OpenClaw NPM Release` akzeptiert außerdem die aktuelle vollständige 40-stellige Workflow-Branch-Commit-SHA, ohne ein gepushtes Tag zu verlangen
- Dieser SHA-Pfad dient nur der Validierung und kann nicht zu einem echten Publish befördert werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die Paketmetadatenprüfung; echter Publish erfordert weiterhin ein echtes Release-Tag
- Beide Workflows behalten den echten Publish- und Promotion-Pfad auf GitHub-gehosteten Runnern, während der nicht mutierende Validierungspfad die größeren Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Checks-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach dem npm-Publish
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-Installationspfad in einem frischen temporären Prefix zu prüfen
- Führen Sie nach einem Beta-Publish `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um Installed-Package-Onboarding, Telegram-Einrichtung und echtes Telegram-E2E gegen das veröffentlichte npm-Paket mit dem gemeinsam genutzten geleasten Telegram-Credential-Pool zu prüfen. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen und die drei `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Maintainer können dieselbe Post-Publish-Prüfung über den manuellen Workflow `NPM Telegram Beta E2E` aus GitHub Actions ausführen. Er ist bewusst ausschließlich manuell und läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echter npm-Publish muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - der echte npm-Publish muss von demselben `main`- oder `release/YYYY.M.D`-Branch gestartet werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabiler npm-Publish kann über Workflow-Eingabe explizit auf `latest` zielen
  - tokenbasierte npm-Dist-Tag-Mutation liegt aus Sicherheitsgründen jetzt in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`, da `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das öffentliche Repo OIDC-only-Publish beibehält
  - öffentliches `macOS Release` ist nur validierend; wenn ein Tag nur auf einem Release-Branch liegt, der Workflow aber von `main` gestartet wird, setzen Sie `public_release_branch=release/YYYY.M.D`
  - echter privater Mac-Publish muss erfolgreiche private Mac-`preflight_run_id` und `validate_run_id` bestehen
  - die echten Publish-Pfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier außerdem denselben Temp-Prefix-Upgrade-Pfad von `YYYY.M.D` zu `YYYY.M.D-N`, damit Release-Korrekturen ältere globale Installationen nicht stillschweigend auf dem stabilen Basis-Payload zurücklassen können
- Der npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl `dist/control-ui/index.html` als auch einen nicht leeren Payload `dist/control-ui/assets/` enthält, damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Entry-Points und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das fehlende Plugin-Laufzeit-Payloads ausliefert, lässt den Postpublish-Verifier fehlschlagen und kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für den Kandidaten-Update-Tarball, sodass Installer-E2E versehentlichen Pack-Bloat vor dem Release-Publish-Pfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder Extension-Testmatrizen berührt hat, regenerieren und prüfen Sie vor der Freigabe die Planner-eigenen `plugin-prerelease-extension-shard`-Matrixausgaben aus `.github/workflows/plugin-prerelease.yml`, damit Release Notes kein veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst außerdem die Updater-Flächen:
  - das GitHub-Release muss am Ende die gepackten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach dem Publish auf das neue stabile Zip verweisen
  - die gepackte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Minimum für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist die Methode, mit der Operatoren alle Pre-Release-Tests über einen Einstiegspunkt starten. Für einen gepinnten Commit-Nachweis auf einem schnell bewegten Branch verwenden Sie den Helper, damit jeder Child-Workflow von einem temporären Branch läuft, der auf die Ziel-SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, startet `Full Release Validation` von diesem Branch mit `ref=<sha>`, prüft, dass jede Child-Workflow-`headSha` dem Ziel entspricht, und löscht anschließend den temporären Branch. Dadurch wird vermieden, versehentlich einen neueren `main`-Child-Lauf nachzuweisen.

Für Release-Branch- oder Tag-Validierung führen Sie ihn vom vertrauenswürdigen Workflow-Ref `main` aus und übergeben den Release-Branch oder das Tag als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Der Workflow löst den Ziel-Ref auf, dispatcht manuell `CI` mit
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks` und dispatcht
eigenständige Telegram-Paket-E2E, wenn `release_profile=full` mit
`rerun_group=all` gesetzt ist oder wenn `npm_telegram_package_spec` gesetzt ist.
`OpenClaw Release Checks` verzweigt dann in Install-Smoke, Cross-OS-Release-Checks,
Live/E2E-Docker-Abdeckung des Release-Pfads, Package Acceptance mit Telegram-Paket-QA,
QA-Lab-Parität, Live-Matrix und Live-Telegram. Ein vollständiger Lauf ist nur
akzeptabel, wenn die Zusammenfassung von `Full Release Validation` `normal_ci`
und `release_checks` als erfolgreich anzeigt. Im full/all-Modus muss auch der
`npm_telegram`-Child erfolgreich sein; außerhalb von full/all wird er übersprungen,
sofern kein veröffentlichtes `npm_telegram_package_spec` bereitgestellt wurde.
Die abschließende Verifier-Zusammenfassung enthält Tabellen der langsamsten Jobs
für jeden Child-Lauf, sodass der Release-Manager den aktuellen kritischen Pfad
sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für
die vollständige Stage-Matrix, exakte Workflow-Jobnamen, Unterschiede zwischen
stable- und full-Profilen, Artefakte und gezielte Rerun-Handles.
Child-Workflows werden von dem vertrauenswürdigen Ref dispatched, der
`Full Release Validation` ausführt, normalerweise `--ref main`, selbst wenn der
Ziel-`ref` auf einen älteren Release-Branch oder Tag zeigt. Es gibt keine separate
Workflow-Ref-Eingabe für Full Release Validation; wählen Sie den vertrauenswürdigen
Harness, indem Sie den Ref des Workflow-Laufs wählen. Verwenden Sie nicht
`--ref main -f ref=<sha>` für exakte Commit-Nachweise auf einem sich bewegenden
`main`; rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein. Verwenden Sie
daher `pnpm ci:full-release --sha <sha>`, um den gepinnten temporären Branch zu
erstellen.

Verwenden Sie `release_profile`, um die Breite von Live/Provider auszuwählen:

- `minimum`: schnellster releasekritischer OpenAI/Core-Live- und Docker-Pfad
- `stable`: minimum plus stabile Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: stable plus breite advisory Provider-/Media-Abdeckung

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den
Ziel-Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses
Artefakt sowohl in Docker-Checks des Release-Pfads als auch in Package Acceptance
wieder. Dadurch bleiben alle packagebezogenen Boxen auf denselben Bytes, und
wiederholte Paket-Builds werden vermieden. Der Cross-OS-OpenAI-Install-Smoke
verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die Repo-/Org-Variable gesetzt
ist, andernfalls `openai/gpt-5.4`, weil diese Lane Paketinstallation, Onboarding,
Gateway-Start und einen Live-Agent-Turn nachweist, statt das langsamste
Standardmodell zu benchmarken. Die breitere Live-Provider-Matrix bleibt der Ort
für modellspezifische Abdeckung.

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

Verwenden Sie den vollständigen Umbrella-Lauf nicht als ersten Rerun nach einem
gezielten Fix. Wenn eine Box fehlschlägt, verwenden Sie für den nächsten Nachweis
den fehlgeschlagenen Child-Workflow, Job, die Docker-Lane, das Paketprofil, den
Modell-Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella-Lauf nur
dann erneut aus, wenn der Fix die gemeinsame Release-Orchestrierung geändert hat
oder frühere All-Box-Nachweise veraltet gemacht hat. Der abschließende Verifier
des Umbrella-Laufs prüft die aufgezeichneten Child-Workflow-Run-IDs erneut.
Nachdem ein Child-Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher
nur den fehlgeschlagenen Parent-Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella-Lauf.
`all` ist der echte Release-Candidate-Lauf, `ci` führt nur den normalen CI-Child
aus, `plugin-prerelease` führt nur den releasebezogenen Plugin-Child aus,
`release-checks` führt jede Release-Box aus, und die engeren Release-Gruppen sind
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`
und `npm-telegram`. Gezielte `npm-telegram`-Reruns erfordern
`npm_telegram_package_spec`; full/all-Läufe mit `release_profile=full` verwenden
das Paketartefakt aus den Release-Checks.

### Vitest

Die Vitest-Box ist der manuelle `CI`-Child-Workflow. Manuelle CI umgeht bewusst
Changed-Scoping und erzwingt den normalen Testgraphen für den Release-Kandidaten:
Linux-Node-Shards, gebündelte Plugin-Shards, Kanalverträge, Node-22-Kompatibilität,
`check`, `check-additional`, Build-Smoke, Docs-Checks, Python-Skills, Windows,
macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Quellbaum die vollständige
normale Testsuite bestanden?“ Sie ist nicht dasselbe wie Produktvalidierung über
den Release-Pfad. Aufzubewahrende Nachweise:

- Zusammenfassung von `Full Release Validation` mit der URL des dispatched `CI`-Laufs
- grüner `CI`-Lauf auf der exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn ein
  Lauf eine Performance-Analyse benötigt

Führen Sie manuelle CI nur dann direkt aus, wenn das Release deterministische
normale CI benötigt, aber nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder
Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-Workflow
`install-smoke`. Sie validiert den Release-Kandidaten über paketierte
Docker-Umgebungen statt nur über Tests auf Quellcodeebene.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamen globalen Bun-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA,
  wobei QR-, Root/Gateway- und Installer/Bun-Smoke-Jobs als separate
  install-smoke-Shards laufen
- Repository-E2E-Lanes
- Docker-Chunks des Release-Pfads: `core`, `package-update-openai`,
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
  Live-Suites einschließen

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Scheduler des Release-Pfads
lädt `.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für gezielte
Wiederherstellung verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren
Live/E2E-Workflow, statt alle Release-Chunks erneut auszuführen. Generierte
Rerun-Befehle enthalten frühere `package_artifact_run_id`- und vorbereitete
Docker-Image-Eingaben, wenn verfügbar, sodass eine fehlgeschlagene Lane denselben
Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das
Release-Gate für agentisches Verhalten und Kanalebene, getrennt von Vitest und
Docker-Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Parity-Lane, die die OpenAI-Kandidaten-Lane mit der Opus-4.6-Baseline
  mithilfe des agentischen Parity-Packs vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in
QA-Szenarien und Live-Kanalflüssen korrekt?“ Bewahren Sie die Artefakt-URLs für
Parity-, Matrix- und Telegram-Lanes auf, wenn Sie das Release freigeben.
Vollständige Matrix-Abdeckung bleibt als manueller geshardeter QA-Lab-Lauf
verfügbar und ist nicht die standardmäßige releasekritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird durch
`Package Acceptance` und den Resolver `scripts/resolve-openclaw-package-candidate.mjs`
gestützt. Der Resolver normalisiert einen Kandidaten in den Tarball
`package-under-test`, der von Docker E2E konsumiert wird, validiert das
Paketinventar, zeichnet Paketversion und SHA-256 auf und hält den
Workflow-Harness-Ref vom Paketquell-Ref getrennt.

Unterstützte Kandidatenquellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version
- `source=ref`: einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständige
  Commit-SHA mit dem ausgewählten `workflow_ref`-Harness packen
- `source=url`: ein HTTPS-`.tgz` mit erforderlichem `package_sha256` herunterladen
- `source=artifact`: ein von einem anderen GitHub-Actions-Lauf hochgeladenes `.tgz` wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paketartefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` und
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update,
Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-Fixtures,
Plugin-Update und Telegram-Paket-QA gegen denselben aufgelösten Tarball. Die
Upgrade-Matrix deckt jede stabile npm-veröffentlichte Baseline von `2026.4.23`
bis `latest` ab; verwenden Sie Package Acceptance mit `source=npm` für einen
bereits ausgelieferten Kandidaten oder `source=ref`/`source=artifact` für einen
SHA-gestützten lokalen npm-Tarball vor der Veröffentlichung. Sie ist der
GitHub-native Ersatz für den größten Teil der Paket-/Update-Abdeckung, die zuvor
Parallels erforderte. Cross-OS-Release-Checks bleiben für OS-spezifisches
Onboarding, Installer- und Plattformverhalten wichtig, aber Paket-/Update-
Produktvalidierung sollte Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie,
wenn Sie entscheiden, welche lokale Lane, Docker-Lane, Package-Acceptance-Lane
oder Release-Check-Lane eine Plugin-Installation/ein Plugin-Update,
Doctor-Cleanup oder eine Änderung der Migration veröffentlichter Pakete nachweist.
Erschöpfende veröffentlichte Update-Migration aus jedem stabilen Paket
`2026.4.23+` ist ein separater manueller Workflow `Update Migration` und nicht
Teil von Full Release CI.

Legacy-Nachsicht bei package-acceptance ist bewusst zeitlich begrenzt. Pakete
bis einschließlich `2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken
verwenden, die bereits auf npm veröffentlicht wurden: private QA-Inventareinträge,
die im Tarball fehlen, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien
in der aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes
`update.channel`, Legacy-Speicherorte für Plugin-Install-Records, fehlende
Persistenz von Marketplace-Install-Records und Config-Metadatenmigration während
`plugins update`. Das veröffentlichte Paket `2026.4.26` darf für bereits
ausgelieferte lokale Build-Metadaten-Stamp-Dateien warnen. Spätere Pakete müssen
die modernen Paketverträge erfüllen; dieselben Lücken lassen die Release-Validierung
fehlschlagen.

Verwenden Sie breitere Package-Acceptance-Profile, wenn sich die Release-Frage
auf ein tatsächlich installierbares Paket bezieht:

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

- `smoke`: schnelle Lanes für Paketinstallation/Kanal/Agent, Gateway-Netzwerk und Config-Neuladen
- `package`: Install-/Update-/Plugin-Paketverträge ohne Live-ClawHub; dies ist der
  Standard für Release-Checks
- `product`: `package` plus MCP-Kanäle, Cron-/Subagent-Cleanup, OpenAI-Websuche und OpenWebUI
- `full`: Docker-Chunks des Release-Pfads mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für gezielte Reruns

Für den Telegram-Nachweis eines Package-Kandidaten aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt das
aufgelöste `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Automatisierung der Release-Veröffentlichung

`OpenClaw Release Publish` ist der normale mutierende Einstiegspunkt für Veröffentlichungen. Er
orchestriert die Trusted-Publisher-Workflows in der Reihenfolge, die das Release benötigt:

1. Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Prüfen, dass der Tag von `main` oder `release/*` erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und derselben SHA auslösen.
6. `OpenClaw NPM Release` mit dem Release-Tag, npm-Dist-Tag und der
   gespeicherten `preflight_run_id` auslösen.

Beispiel für Beta-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Veröffentlichung zum standardmäßigen Beta-Dist-Tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Promotion direkt zu `latest` ist explizit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Verwenden Sie die untergeordneten Workflows `Plugin NPM Release` und `Plugin ClawHub Release`
nur für gezielte Reparatur- oder Neuveröffentlichungsarbeiten. Für eine ausgewählte Plugin-Reparatur übergeben Sie
`plugin_publish_scope=selected` und `plugins=@openclaw/name` an
`OpenClaw Release Publish`, oder lösen Sie den Child-Workflow direkt aus, wenn das
OpenClaw-Paket nicht veröffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, kann er auch die aktuelle
  vollständige 40-Zeichen-Commit-SHA des Workflow-Branches für einen reinen Validierungs-Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow
  das vorbereitete Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standardwert ist `beta`

`OpenClaw Release Publish` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche Preflight-Lauf-ID von `OpenClaw NPM Release`;
  erforderlich, wenn `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: Standardwert ist `all-publishable`; verwenden Sie `selected` nur
  für gezielte Reparaturarbeiten
- `plugins`: kommagetrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: Standardwert ist `true`; setzen Sie dies nur dann auf `false`, wenn Sie den
  Workflow als reinen Reparatur-Orchestrator für Plugins verwenden

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA zur Validierung. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.

Regeln:

- Stabile Tags und Korrektur-Tags dürfen entweder zu `beta` oder `latest` veröffentlicht werden
- Beta-Prerelease-Tags dürfen nur zu `beta` veröffentlicht werden
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` sind immer
  reine Validierung
- Der echte Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden, das während des Preflights verwendet wurde;
  der Workflow prüft diese Metadaten vor dem Fortsetzen der Veröffentlichung

## Stabile npm-Release-Sequenz

Beim Erstellen eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie die aktuelle vollständige Commit-SHA des Workflow-Branches
     für einen reinen Validierungs-Trockenlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder nur dann `latest`,
   wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Referenz aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`
   und der gespeicherten `preflight_run_id` aus; dies veröffentlicht externalisierte Plugins auf npm
   und ClawHub, bevor das OpenClaw-npm-Paket promoted wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   Workflow, um diese stabile Version von `beta` zu `latest` zu promoten
8. Wenn das Release bewusst direkt zu `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zeigen zu lassen, oder lassen Sie dessen geplante
   selbstheilende Synchronisierung `beta` später verschieben

Die Dist-Tag-Mutation liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repo nur OIDC-Veröffentlichung verwendet.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Promotion-Pfad
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen Sie alle 1Password
CLI-(`op`)-Befehle nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Agent-Shell auf; wenn es in tmux bleibt, sind Prompts,
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

Maintainer verwenden die privaten Release-Dokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
für das eigentliche Runbook.

## Verwandt

- [Release-Kanäle](/de/install/development-channels)
