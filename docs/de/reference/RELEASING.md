---
read_when:
    - Suche nach Definitionen für öffentliche Release-Kanäle
    - Release-Validierung oder Paketakzeptanz ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Taktung
title: Veröffentlichungsrichtlinie
x-i18n:
    generated_at: "2026-05-03T21:37:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig nach npm `beta` veröffentlichen, oder nach npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Prerelease-Tags, die nach npm `beta` veröffentlichen
- dev: der bewegliche Stand von `main`

## Versionsbenennung

- Stable-Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stable-Korrekturrelease-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuelle hervorgehobene stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrekturreleases veröffentlichen standardmäßig nach npm `beta`; Release-Operatoren können ausdrücklich `latest` anvisieren oder einen geprüften Beta-Build später hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  Build/Signierung/Notarisierung der Mac-App für stable reserviert bleibt, sofern nicht ausdrücklich angefordert

## Release-Takt

- Releases laufen zuerst über beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise von einem Branch `release/YYYY.M.D`, der
  vom aktuellen `main` erstellt wurde, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, erstellen Maintainer
  das nächste `-beta.N`-Tag, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Prozeduren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, dist-tag-Wiederherstellung und Details zum Notfall-Rollback bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: den neuesten Stand pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass das aktuelle `main`-CI grün genug ist, um davon zu branchen.
2. Den obersten Abschnitt von `CHANGELOG.md` anhand der echten Commit-Historie mit
   `/changelog` neu schreiben, Einträge benutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt ist, oder dokumentieren, warum sie
   absichtlich beibehalten wird.
4. `release/YYYY.M.D` vom aktuellen `main` erstellen; normale Release-Arbeiten nicht
   direkt auf `main` durchführen.
5. Jede erforderliche Versionsstelle für das geplante Tag erhöhen, dann
   `pnpm plugins:sync` ausführen, damit veröffentlichbare Plugin-Pakete die Release-
   Version und Kompatibilitätsmetadaten teilen, anschließend den lokalen deterministischen Preflight ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` und
   `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branches für einen reinen Validierungs-
   Preflight zulässig. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA starten. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch fixen und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, den Provider oder die Modell-Allowlist erneut ausführen, die
   den Fix belegt. Die vollständige Umbrella-Validierung nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Beta `vYYYY.M.D-beta.N` taggen, dann `OpenClaw Release Publish` vom
   passenden Branch `release/YYYY.M.D` aus ausführen. Es überprüft `pnpm plugins:sync:check`,
   veröffentlicht zuerst alle veröffentlichbaren Plugin-Pakete nach npm, veröffentlicht dieselbe
   Menge danach nach ClawHub als ClawPack npm-pack-Tarballs und stuft anschließend das
   vorbereitete OpenClaw-npm-Preflight-Artefakt mit dem passenden dist-tag hoch. Nach
   der Veröffentlichung die Post-Publish-Paket-
   abnahme gegen das veröffentlichte Paket `openclaw@YYYY.M.D-beta.N` oder
   `openclaw@beta` ausführen. Wenn ein gepushter oder veröffentlichter Prerelease einen Fix benötigt,
   die nächste passende Prerelease-Nummer erstellen; das alte
   Prerelease nicht löschen oder umschreiben.
10. Für stable erst fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Auch die Stable-npm-Veröffentlichung läuft über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` erneut; die Stable-macOS-Release-Bereitschaft erfordert außerdem die
    paketierten `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifier ausführen, optional den eigenständigen
    published-npm Telegram E2E, wenn Sie einen Post-Publish-Kanalnachweis benötigen,
    dist-tag-Hochstufung bei Bedarf, GitHub-Release-/Prerelease-Notizen aus dem
    vollständigen passenden Abschnitt von `CHANGELOG.md` und die Schritte für die Release-Ankündigung.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript auch außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt.
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Importzyklus- und Architekturgrenzen-Prüfungen außerhalb des schnelleren lokalen Gates grün sind.
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-Validierungsschritt vorhanden sind.
- Führen Sie `pnpm plugins:sync` nach dem Versions-Bump im Root und vor dem Tagging aus. Es aktualisiert veröffentlichbare Plugin-Paketversionen, OpenClaw-Peer/API-Kompatibilitätsmetadaten, Build-Metadaten und Plugin-Changelog-Stubs passend zur Core-Release-Version. `pnpm plugins:sync:check` ist der nicht verändernde Release-Schutz; der Publish-Workflow schlägt vor jeder Registry-Mutation fehl, wenn dieser Schritt vergessen wurde.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um alle Pre-Release-Testboxen von einem Einstiegspunkt aus zu starten. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, dispatcht manuell `CI` und dispatcht `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Docker-Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes. Mit `release_profile=full` und `rerun_group=all` führt er außerdem Paket-Telegram-E2E gegen das Artefakt `release-package-under-test` aus den Release Checks aus. Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dieselbe Telegram-E2E auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance seine Paket-/Update-Matrix gegen das ausgelieferte npm-Paket statt gegen das aus der SHA gebaute Artefakt ausführen soll. Geben Sie `evidence_package_spec` an, wenn der private Nachweisbericht belegen soll, dass die Validierung einem veröffentlichten npm-Paket entspricht, ohne Telegram-E2E zu erzwingen. Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie einen Side-Channel-Nachweis für einen Paketkandidaten wünschen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`, um einen vertrauenswürdigen `package_ref`-Branch/Tag/SHA mit dem aktuellen `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlicher SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen Tarball erneut und kann Telegram-QA gegen denselben Tarball mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Gängige Profile:
  - `smoke`: Install-/Channel-/Agent-, Gateway-Netzwerk- und Konfigurations-Reload-Lanes
  - `package`: artefaktnative Paket-/Update-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Channels, Cron-/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten erneuten Lauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur vollständige normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen Changed-Scoping und erzwingen die Linux-Node-Shards, gebündelten Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Checks, Python-Skills, Windows, macOS, Android und Control-UI-i18n-Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt QA-Lab über einen lokalen OTLP/HTTP-Receiver aus und verifiziert die exportierten Trace-Span-Namen, begrenzten Attribute sowie Inhalts-/Kennungs-Redaktion, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus.
- Führen Sie `OpenClaw Release Publish` für die verändernde Publish-Sequenz aus, nachdem das Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` (oder `main`, wenn ein von `main` erreichbares Tag veröffentlicht wird), übergeben Sie das Release-Tag und die erfolgreiche OpenClaw-npm-`preflight_run_id` und behalten Sie den standardmäßigen Plugin-Publish-Scope `all-publishable` bei, sofern Sie nicht bewusst eine fokussierte Reparatur ausführen. Der Workflow serialisiert Plugin-npm-Publish, Plugin-ClawHub-Publish und OpenClaw-npm-Publish, damit das Core-Paket nicht vor seinen externalisierten Plugins veröffentlicht wird.
- Release Checks laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem die QA-Lab-Mock-Paritäts-Lane sowie das schnelle Live-Matrix-Profil und die Telegram-QA-Lane vor der Release-Freigabe aus. Die Live-Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet zusätzlich Convex-CI-Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständigen Matrix-Transport, Medien und E2EE-Inventar parallel wünschen.
- Cross-OS-Installations- und Upgrade-Laufzeitvalidierung ist Teil der öffentlichen `OpenClaw Release Checks` und der `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen.
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz, deterministisch und artefaktfokussiert, während langsamere Live-Checks in ihrer eigenen Lane bleiben, damit sie das Veröffentlichen nicht verzögern oder blockieren.
- Release Checks mit Geheimnissen sollten über `Full Release Validation` oder vom `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und Secrets kontrolliert bleiben.
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, solange der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist.
- Der nur validierende Preflight von `OpenClaw NPM Release` akzeptiert auch die aktuelle vollständige 40-Zeichen-Commit-SHA des Workflow-Branches, ohne ein gepushtes Tag zu verlangen.
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in einen echten Publish überführt werden.
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für den Paketmetadaten-Check; echter Publish erfordert weiterhin ein echtes Release-Tag.
- Beide Workflows behalten den echten Publish- und Promotion-Pfad auf GitHub-gehosteten Runnern, während der nicht verändernde Validierungspfad die größeren Blacksmith-Linux-Runner verwenden kann.
- Dieser Workflow führt `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus.
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Checks-Lane.
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus.
- Führen Sie nach dem npm-Publish `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-Installationspfad in einem frischen temporären Prefix zu verifizieren.
- Führen Sie nach einem Beta-Publish `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um Installed-Package-Onboarding, Telegram-Einrichtung und echtes Telegram-E2E gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Credential-Pool zu verifizieren. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen und die drei `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Maintainer können denselben Post-Publish-Check über den manuellen Workflow `NPM Telegram Beta E2E` von GitHub Actions ausführen. Er ist absichtlich nur manuell und läuft nicht bei jedem Merge.
- Die Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echter npm-Publish muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - der echte npm-Publish muss von demselben `main`- oder `release/YYYY.M.D`-Branch dispatcht werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases setzen standardmäßig auf `beta`
  - stabiler npm-Publish kann über Workflow-Input explizit `latest` anvisieren
  - tokenbasierte npm-Dist-Tag-Mutation befindet sich jetzt aus Sicherheitsgründen in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das öffentliche Repo OIDC-only-Publish beibehält
  - öffentlicher `macOS Release` dient nur der Validierung; wenn ein Tag nur auf einem Release-Branch liegt, der Workflow aber von `main` dispatcht wird, setzen Sie `public_release_branch=release/YYYY.M.D`
  - echter privater Mac-Publish muss erfolgreiche private Mac-`preflight_run_id` und `validate_run_id` bestehen
  - die echten Publish-Pfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier außerdem denselben Temp-Prefix-Upgrade-Pfad von `YYYY.M.D` zu `YYYY.M.D-N`, damit Release-Korrekturen ältere globale Installationen nicht stillschweigend auf dem stabilen Basis-Payload belassen.
- Der npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält, damit wir nicht erneut ein leeres Browser-Dashboard ausliefern.
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Entrypoints und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, dem Plugin-Runtime-Payloads fehlen, schlägt im Postpublish-Verifier fehl und kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für den Kandidaten-Update-Tarball, damit Installer-E2E versehentliches Pack-Bloat vor dem Release-Publish-Pfad erkennt.
- Wenn die Release-Arbeit CI-Planung, Plugin-Timing-Manifeste oder Plugin-Testmatrizen berührt hat, regenerieren und prüfen Sie vor der Freigabe die Planner-eigenen `plugin-prerelease-extension-shard`-Matrix-Ausgaben aus `.github/workflows/plugin-prerelease.yml`, damit Release Notes kein veraltetes CI-Layout beschreiben.
- Die Bereitschaft für stabile macOS-Releases umfasst außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach dem Publish auf die neue stabile Zip zeigen
  - die paketierte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist der Weg, wie Operatoren alle Pre-Release-Tests von einem Einstiegspunkt aus starten. Für einen gepinnten Commit-Nachweis auf einem schnell fortschreitenden Branch verwenden Sie den Helper, damit jeder Child-Workflow von einem temporären Branch läuft, der auf die Ziel-SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation` von diesem Branch mit `ref=<sha>`, verifiziert, dass jede Child-Workflow-`headSha` dem Ziel entspricht, und löscht anschließend den temporären Branch. So vermeiden Sie, versehentlich einen neueren `main`-Child-Lauf nachzuweisen.

Für die Validierung eines Release-Branches oder Tags führen Sie ihn vom vertrauenswürdigen `main`-Workflow-Ref aus und übergeben den Release-Branch oder das Tag als `ref`:

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
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks`, bereitet ein
übergeordnetes Artefakt `release-package-under-test` für paketbezogene Prüfungen vor und
dispatcht eigenständige Paket-Telegram-E2E, wenn `release_profile=full` mit
`rerun_group=all` verwendet wird oder wenn `npm_telegram_package_spec` gesetzt ist. `OpenClaw Release
Checks` fächert dann Install-Smoke, Cross-OS-Release-Prüfungen, Live-/E2E-Docker-
Abdeckung für den Release-Pfad, Package Acceptance mit Telegram-Paket-QA, QA-Lab-
Parität, Live-Matrix und Live-Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die
Zusammenfassung von `Full Release Validation`
`normal_ci` und `release_checks` als erfolgreich ausweist. Im full/all-Modus
muss auch der untergeordnete Lauf `npm_telegram` erfolgreich sein; außerhalb von full/all wird er übersprungen,
sofern keine veröffentlichte `npm_telegram_package_spec` angegeben wurde. Die finale
Prüferzusammenfassung enthält Tabellen der langsamsten Jobs für jeden untergeordneten Lauf, sodass der Release-
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Phasenmatrix, die exakten Workflow-Jobnamen, Unterschiede zwischen Stable- und Full-Profil,
Artefakte und gezielte Rerun-Handles.
Untergeordnete Workflows werden von der vertrauenswürdigen Ref dispatcht, auf der `Full Release
Validation` läuft, normalerweise `--ref main`, auch wenn die Ziel-`ref` auf einen
älteren Release-Branch oder Tag zeigt. Es gibt keine separate Full-Release-Validation-
Workflow-Ref-Eingabe; wählen Sie den vertrauenswürdigen Harness, indem Sie die Ref des Workflow-Laufs wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für exakten Commit-Nachweis auf einem sich bewegenden `main`;
rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein, verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den angehefteten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus Stable-Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite Advisory-Provider-/Medienabdeckung

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die Ziel-
Ref einmal als `release-package-under-test` aufzulösen, und nutzt dieses Artefakt sowohl in
Docker-Prüfungen des Release-Pfads als auch in Package Acceptance wieder. Dadurch bleiben alle
paketbezogenen Boxen auf denselben Bytes, und wiederholte Paket-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane
Paketinstallation, Onboarding, Gateway-Start und einen Live-Agent-Turn nachweist,
anstatt das langsamste Standardmodell zu benchmarken. Die breitere Live-Provider-
Matrix bleibt der Ort für modellspezifische Abdeckung.

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

Verwenden Sie den vollständigen Umbrella nicht als ersten Rerun nach einem gezielten Fix. Wenn eine Box
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job,
die Docker-Lane, das Paketprofil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella nur dann erneut aus,
wenn der Fix die gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise
veraltet gemacht hat. Der finale Prüfer des Umbrellas prüft die aufgezeichneten IDs der untergeordneten Workflow-Läufe erneut,
sodass nach einem erfolgreich erneut ausgeführten untergeordneten Workflow nur der fehlgeschlagene übergeordnete Job
`Verify full validation` erneut ausgeführt werden muss.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur den normalen CI-Unterlauf aus, `plugin-prerelease`
führt nur den release-spezifischen Plugin-Unterlauf aus, `release-checks` führt jede Release-
Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Gezielte `npm-telegram`-Reruns erfordern `npm_telegram_package_spec`; full/all-Läufe
mit `release_profile=full` verwenden das Paketartefakt aus release-checks.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete Workflow `CI`. Manuelle CI umgeht
Changed-Scoping absichtlich und erzwingt den normalen Testgraphen für den Release-
Kandidaten: Linux-Node-Shards, gebündelte-Plugin-Shards, Channel-Verträge, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Quellbaum die vollständige normale Testsuite bestanden?“
Sie ist nicht dasselbe wie Produktvalidierung auf dem Release-Pfad. Zu sichernde Nachweise:

- Zusammenfassung von `Full Release Validation` mit der URL des dispatchten `CI`-Laufs
- grüner `CI`-Lauf auf der exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Lauf Performance-Analyse benötigt

Führen Sie manuelle CI nur dann direkt aus, wenn das Release deterministische normale CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie den Release-Modus-
Workflow `install-smoke`. Sie validiert den Release-Kandidaten über paketierte
Docker-Umgebungen statt nur über Tests auf Quellcodeebene.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamem Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-,
  Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate Install-Smoke-
  Shards laufen
- Repository-E2E-Lanes
- Docker-Chunks des Release-Pfads: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` und `plugins-runtime-install-h`
- OpenWebUI-Abdeckung innerhalb des Chunks `plugins-runtime-services`, wenn angefordert
- aufgeteilte Lanes für Installation/Deinstallation gebündelter Plugins
  `bundled-plugin-install-uninstall-0` bis
  `bundled-plugin-install-uninstall-23`
- Live-/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Prüfungen
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für gezielte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, statt
alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten frühere
`package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, wenn verfügbar, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest- und Docker-
Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Kandidaten-Lane anhand des agentischen Parity-Packs
  mit der Opus-4.6-Baseline vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Paritäts-, Matrix- und Telegram-
Lanes auf, wenn Sie das Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller sharded QA-Lab-Lauf verfügbar und ist nicht die standardmäßige release-kritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird von
`Package Acceptance` und dem Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen
Kandidaten in den Tarball `package-under-test`, der von Docker E2E konsumiert wird, validiert
das Paketinventar, zeichnet die Paketversion und SHA-256 auf und hält die
Workflow-Harness-Ref von der Paket-Quell-Ref getrennt.

Unterstützte Kandidatenquellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness packen
- `source=url`: ein HTTPS-`.tgz` mit erforderlicher `package_sha256` herunterladen
- `source=artifact`: ein von einem anderen GitHub-Actions-Lauf hochgeladenes `.tgz` wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paketartefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` und
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update, Bereinigung veralteter
Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Update und Telegram-
Paket-QA gegen denselben aufgelösten Tarball. Die Upgrade-Matrix deckt jede stabile npm-veröffentlichte Baseline von `2026.4.23` bis `latest` ab; verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Kandidaten oder
`source=ref`/`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der
Veröffentlichung. Sie ist der GitHub-native
Ersatz für den Großteil der Paket-/Update-Abdeckung, die zuvor Parallels erforderte.
Cross-OS-Release-Prüfungen bleiben für OS-spezifisches Onboarding,
Installer- und Plattformverhalten wichtig, aber Paket-/Update-Produktvalidierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn
Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine
Plugin-Installation/-Aktualisierung, Doctor-Bereinigung oder veröffentlichte-Paket-Migrationsänderung nachweist.
Erschöpfende veröffentlichte Update-Migration aus jedem stabilen `2026.4.23+`-Paket ist
ein separater manueller Workflow `Update Migration`, nicht Teil von Full Release CI.

Legacy-Nachsicht in Package Acceptance ist absichtlich zeitlich begrenzt. Pakete bis einschließlich
`2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits
auf npm veröffentlicht wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-
Fixture, fehlende persistierte `update.channel`, Legacy-Speicherorte für Plugin-Install-Records,
fehlende Persistenz von Marketplace-Install-Records und Konfigurationsmetadaten-
Migration während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf für lokale
Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete
müssen die modernen Paketverträge erfüllen; dieselben Lücken lassen die Release-
Validierung fehlschlagen.

Verwenden Sie breitere Package-Acceptance-Profile, wenn die Release-Frage ein
tatsächlich installierbares Paket betrifft:

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

- `smoke`: schnelle Lanes für Paketinstallation/Kanal/Agent, Gateway-Netzwerk und
  Neuladen der Konfiguration
- `package`: Installations-/Update-/Plugin-Paketverträge ohne Live-ClawHub; dies ist der
  Standard für Release-Checks
- `product`: `package` plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Abschnitte mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Wiederholungsläufe

Aktivieren Sie für den Telegram-Nachweis eines Paketkandidaten `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den
aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Automatisierung der Release-Veröffentlichung

`OpenClaw Release Publish` ist der normale mutierende Einstiegspunkt für Veröffentlichungen. Er
orchestriert die Trusted-Publisher-Workflows in der Reihenfolge, die das Release benötigt:

1. Checken Sie das Release-Tag aus und ermitteln Sie dessen Commit-SHA.
2. Verifizieren Sie, dass das Tag von `main` oder `release/*` erreichbar ist.
3. Führen Sie `pnpm plugins:sync:check` aus.
4. Lösen Sie `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` aus.
5. Lösen Sie `Plugin ClawHub Release` mit demselben Scope und derselben SHA aus.
6. Lösen Sie `OpenClaw NPM Release` mit dem Release-Tag, dem npm-Dist-Tag und
   der gespeicherten `preflight_run_id` aus.

Beispiel für eine Beta-Veröffentlichung:

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

Stabile Promotion direkt nach `latest` ist explizit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Verwenden Sie die untergeordneten Workflows `Plugin NPM Release` und `Plugin ClawHub Release`
nur für fokussierte Reparatur- oder erneute Veröffentlichungsarbeiten. Übergeben Sie für eine ausgewählte Plugin-Reparatur
`plugin_publish_scope=selected` und `plugins=@openclaw/name` an
`OpenClaw Release Publish`, oder lösen Sie den untergeordneten Workflow direkt aus, wenn das
OpenClaw-Paket nicht veröffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true` gilt, kann es auch die aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branch für einen reinen Validierungs-Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: auf dem echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Publish` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Lauf-ID;
  erforderlich, wenn `publish_openclaw_npm=true` gilt
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: Standard ist `all-publishable`; verwenden Sie `selected` nur
  für fokussierte Reparaturarbeiten
- `plugins`: durch Kommas getrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected` gilt
- `publish_openclaw_npm`: Standard ist `true`; setzen Sie es nur dann auf `false`,
  wenn der Workflow als reiner Plugin-Reparatur-Orchestrator verwendet wird

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA, der bzw. die validiert werden soll. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.

Regeln:

- Stabile Tags und Korrektur-Tags dürfen entweder nach `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true` gilt
- `OpenClaw Release Checks` und `Full Release Validation` sind immer
  ausschließlich Validierungen
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflight verwendet wurde;
  der Workflow verifiziert diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release erstellen:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie die aktuelle vollständige Commit-SHA des Workflow-Branch
     für einen reinen Validierungs-Trockenlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder nur dann `latest`,
   wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Ref aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`
   und der gespeicherten `preflight_run_id` aus; er veröffentlicht externalisierte Plugins bei npm
   und ClawHub, bevor das OpenClaw-npm-Paket promotet wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   Workflow, um diese stabile Version von `beta` nach `latest` zu promoten
8. Wenn das Release bewusst direkt nach `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie
   die geplante Selbstheilungs-Synchronisierung `beta` später verschieben

Die Dist-Tag-Mutation liegt aus Sicherheitsgründen im privaten Repository, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repository ausschließlich OIDC-Veröffentlichung verwendet.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Promotion-Pfad
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen Sie alle 1Password-
CLI-Befehle (`op`) nur in einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Agent-Shell auf; die Ausführung in tmux macht Prompts,
Warnungen und OTP-Verarbeitung beobachtbar und verhindert wiederholte Host-Warnungen.

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
