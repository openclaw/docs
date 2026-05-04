---
read_when:
    - Suche nach Definitionen öffentlicher Release-Kanäle
    - Release-Validierung oder Paketakzeptanz ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Kadenz
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-04T06:43:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Spuren:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Vorab-Release-Tags, die auf npm `beta` veröffentlichen
- dev: der sich fortlaufend bewegende Stand von `main`

## Versionsbenennung

- Stabile Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stabile Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Vorab-Release-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell hochgestufte stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Verantwortliche können ausdrücklich `latest` anvisieren oder einen geprüften Beta-Build später hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App zusammen aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, wobei
  Build, Signierung und Notarisierung der Mac-App stabilen Releases vorbehalten bleiben, sofern nicht ausdrücklich angefordert

## Release-Takt

- Releases bewegen sich zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise von einem `release/YYYY.M.D`-Branch, der
  vom aktuellen `main` erstellt wurde, damit Release-Validierung und Korrekturen neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und eine Korrektur benötigt, erstellen Maintainer
  den nächsten `-beta.N`-Tag, statt den alten Beta-Tag zu löschen oder neu zu erstellen
- Detailliertes Release-Verfahren, Freigaben, Anmeldedaten und Wiederherstellungshinweise sind
  ausschließlich für Maintainer bestimmt

## Checkliste für Release-Verantwortliche

Diese Checkliste ist die öffentliche Form des Release-Ablaufs. Private Anmeldedaten,
Signierung, Notarisierung, Wiederherstellung von dist-tags und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Beginnen Sie vom aktuellen `main`: neuesten Stand pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle CI auf `main` ausreichend grün ist, um davon zu branchen.
2. Schreiben Sie den obersten Abschnitt von `CHANGELOG.md` anhand der echten Commit-Historie mit
   `/changelog` neu, halten Sie Einträge nutzerorientiert, committen und pushen Sie ihn, und führen Sie vor dem Branching
   noch einmal Rebase/Pull aus.
3. Prüfen Sie Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts`. Entfernen Sie abgelaufene
   Kompatibilität nur, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren Sie, warum sie
   absichtlich weitergeführt wird.
4. Erstellen Sie `release/YYYY.M.D` vom aktuellen `main`; führen Sie normale Release-Arbeit nicht
   direkt auf `main` aus.
5. Erhöhen Sie jede erforderliche Versionsstelle für den vorgesehenen Tag, führen Sie
   `pnpm plugins:sync` aus, damit veröffentlichbare Plugin-Pakete die Release-
   Version und Kompatibilitätsmetadaten teilen, und führen Sie anschließend den lokalen deterministischen Preflight aus:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` und
   `pnpm release:check`.
6. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus. Bevor ein Tag existiert,
   ist ein vollständiger 40-stelliger Release-Branch-SHA für ausschließlich validierenden
   Preflight zulässig. Speichern Sie die erfolgreiche `preflight_run_id`.
7. Starten Sie alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, Tag oder vollständigen Commit-SHA. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, beheben Sie das Problem auf dem Release-Branch und führen Sie die kleinste fehlgeschlagene
   Datei, Spur, den Workflow-Job, das Package-Profil, den Provider oder die Modell-Allowlist erneut aus, die
   die Korrektur belegt. Führen Sie das vollständige Dach nur erneut aus, wenn die geänderte Oberfläche
   frühere Nachweise veraltet macht.
9. Für Beta taggen Sie `vYYYY.M.D-beta.N` und führen anschließend `OpenClaw Release Publish` vom
   passenden `release/YYYY.M.D`-Branch aus. Es verifiziert `pnpm plugins:sync:check`,
   veröffentlicht zuerst alle veröffentlichbaren Plugin-Pakete auf npm, veröffentlicht denselben
   Satz danach auf ClawHub als ClawPack-npm-pack-Tarballs und stuft dann das
   vorbereitete OpenClaw-npm-Preflight-Artefakt mit dem passenden dist-tag hoch. Nach der
   Veröffentlichung führen Sie die Package-Akzeptanz nach der Veröffentlichung gegen das veröffentlichte
   Paket `openclaw@YYYY.M.D-beta.N` oder `openclaw@beta` aus. Wenn ein gepushter oder veröffentlichter Vorab-Release eine Korrektur benötigt,
   erstellen Sie die nächste passende Vorab-Release-Nummer; löschen oder überschreiben Sie den alten
   Vorab-Release nicht.
10. Für Stable fahren Sie erst fort, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die stabile npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish`, wobei das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` wiederverwendet wird; die Release-Bereitschaft für stabiles macOS erfordert außerdem die
    paketierten `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte `appcast.xml` auf `main`.
11. Nach der Veröffentlichung führen Sie den npm-Post-Publish-Verifizierer aus, optional die eigenständige
    Telegram-E2E mit veröffentlichtem npm, wenn Sie Channel-Nachweis nach der Veröffentlichung benötigen,
    dist-tag-Hochstufung bei Bedarf, GitHub-Release-/Vorab-Release-Notizen aus dem
    vollständigen passenden Abschnitt von `CHANGELOG.md` sowie die Schritte für die Release-Ankündigung.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Prüfungen auf Importzyklen
  und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm plugins:sync` nach dem Root-Versionsbump und vor dem Tagging aus. Es
  aktualisiert veröffentlichbare Plugin-Paketversionen, OpenClaw-Peer/API-Kompatibilitäts-
  Metadaten, Build-Metadaten und Plugin-Changelog-Stubs passend zur Core-
  Release-Version. `pnpm plugins:sync:check` ist der nicht mutierende Release-Guard;
  der Veröffentlichungs-Workflow schlägt vor jeder Registry-Mutation fehl, wenn dieser Schritt
  vergessen wurde.
- Führen Sie den manuellen `Full Release Validation`-Workflow vor der Release-Freigabe aus, um
  alle Pre-Release-Testboxen von einem Einstiegspunkt aus zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, stößt manuelles `CI` an und stößt
  `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Docker-
  Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-
  Lanes an. Mit `release_profile=full` und `rerun_group=all` führt er außerdem Package
  Telegram E2E gegen das `release-package-under-test`-Artefakt aus den Release-
  Checks aus. Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn derselbe
  Telegram E2E auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie
  `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance
  seine Paket-/Update-Matrix gegen das ausgelieferte npm-Paket statt
  gegen das aus dem SHA gebaute Artefakt ausführen soll. Geben Sie
  `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die
  Validierung zu einem veröffentlichten npm-Paket passt, ohne Telegram E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen `Package Acceptance`-Workflow aus, wenn Sie Side-Channel-Nachweise
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
  Artefakt der Kandidat und `published_upgrade_survivor_baseline` wählt
  die veröffentlichte Baseline aus.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Installations-/Kanal-/Agent-, Gateway-Netzwerk- und Konfigurations-Reload-Lanes
  - `package`: artefaktnative Paket-/Update-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Blöcke mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten erneuten Lauf
- Führen Sie den manuellen `CI`-Workflow direkt aus, wenn Sie nur die vollständige normale CI-
  Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen das Changed-
  Scoping und erzwingen die Linux-Node-Shards, Bundled-Plugin-Shards, Kanal-
  Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke,
  Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-
  Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es führt
  QA-Lab über einen lokalen OTLP/HTTP-Empfänger aus und verifiziert die exportierten Trace-
  Span-Namen, begrenzten Attribute sowie Inhalts-/Kennungs-Redaktion, ohne
  Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die mutierende Veröffentlichungssequenz aus, nachdem das
  Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` (oder `main`, wenn Sie ein
  von main erreichbares Tag veröffentlichen), übergeben Sie das Release-Tag und die erfolgreiche OpenClaw-npm-
  `preflight_run_id` und behalten Sie den standardmäßigen Plugin-Veröffentlichungsumfang
  `all-publishable` bei, sofern Sie nicht bewusst eine fokussierte Reparatur ausführen. Der
  Workflow serialisiert Plugin-npm-Veröffentlichung, Plugin-ClawHub-Veröffentlichung und OpenClaw-
  npm-Veröffentlichung, damit das Core-Paket nicht vor seinen externalisierten
  Plugins veröffentlicht wird.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe außerdem die QA-Lab-Mock-Paritäts-Lane sowie das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-
  Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-
  Credential-Leases. Führen Sie den manuellen `QA-Lab - All Lanes`-Workflow mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständigen Matrix-
  Transport, Medien und E2EE-Inventar parallel wünschen.
- Cross-OS-Installations- und Upgrade-Laufzeitvalidierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad bleibt kurz,
  deterministisch und artefaktorientiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release
Validation` oder aus der `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der reine Validierungs-Preflight von `OpenClaw NPM Release` akzeptiert auch den aktuellen
  vollständigen 40-Zeichen-Workflow-Branch-Commit-SHA, ohne ein gepushtes Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung
  überführt werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows behalten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  unter Verwendung der Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Checks-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Installed-Package-Onboarding, Telegram-Einrichtung und echtes Telegram E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsamen geleasten Telegram-Credential-
  Pool zu verifizieren. Lokale Maintainer-Einmalläufe können die Convex-Variablen weglassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einem Maintainer-Rechner aus auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, dispatcht `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über GitHub Actions mit dem
  manuellen `NPM Telegram Beta E2E`-Workflow ausführen. Er ist absichtlich nur manuell und
  läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestanden haben
  - die echte npm-Veröffentlichung muss vom selben `main`- oder
    `release/YYYY.M.D`-Branch dispatcht werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Eingabe explizit `latest` anvisieren
  - tokenbasierte npm-Dist-Tag-Mutation liegt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo OIDC-only-Veröffentlichung beibehält
  - öffentliches `macOS Release` dient nur der Validierung; wenn ein Tag nur auf einem
    Release-Branch existiert, der Workflow aber von `main` dispatcht wird, setzen Sie
    `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestanden haben
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie
    erneut zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier
  außerdem denselben Temp-Präfix-Upgrade-Pfad von `YYYY.M.D` zu `YYYY.M.D-N`,
  damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf der
  stabilen Basis-Payload zurücklassen können
- Der npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Einstiegspunkte und
  Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das
  fehlende Plugin-Runtime-Payloads ausliefert, lässt den Postpublish-Verifier fehlschlagen und
  kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliches Pack-Bloat
  vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder
  Extension-Testmatrizen berührt hat, generieren und prüfen Sie vor der Freigabe die vom Planner verwalteten
  `plugin-prerelease-extension-shard`-Matrix-Ausgaben aus
  `.github/workflows/plugin-prerelease.yml`, damit Release Notes keine
  veraltete CI-Struktur beschreiben
- Die Bereitschaft eines stabilen macOS-Releases umfasst auch die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die gepackte `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile Zip verweisen
  - die gepackte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist der Weg, wie Operatoren alle Pre-Release-Tests von
einem Einstiegspunkt aus starten. Für einen gepinnten Commit-Nachweis auf einem schnelllebigen Branch verwenden Sie den
Helper, damit jeder Child-Workflow von einem temporären Branch ausgeht, der auf den Ziel-
SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
von diesem Branch mit `ref=<sha>`, verifiziert, dass jede Child-Workflow-`headSha`
zum Ziel passt, und löscht dann den temporären Branch. Dadurch wird vermieden, versehentlich einen
neueren `main`-Child-Lauf nachzuweisen.

Für Release-Branch- oder Tag-Validierung führen Sie ihn von der vertrauenswürdigen `main`-Workflow-
Ref aus und übergeben den Release-Branch oder das Tag als `ref`:

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
übergeordnetes `release-package-under-test`-Artefakt für packagebezogene Checks
vor und dispatcht eigenständiges Package-Telegram-E2E, wenn `release_profile=full` mit
`rerun_group=all` verwendet wird oder wenn `npm_telegram_package_spec` gesetzt ist. `OpenClaw Release
Checks` fächert anschließend in Install-Smoke, Cross-OS-Release-Checks,
Live/E2E-Docker-Abdeckung für den Release-Pfad, Package Acceptance mit Telegram-Package-QA, QA Lab
Parity, Live Matrix und Live Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die
Zusammenfassung von `Full Release Validation` `normal_ci` und `release_checks` als erfolgreich
anzeigt. Im full/all-Modus muss auch das Kind `npm_telegram` erfolgreich sein; außerhalb von full/all wird es übersprungen,
sofern keine veröffentlichte `npm_telegram_package_spec` angegeben wurde. Die abschließende
Verifier-Zusammenfassung enthält Tabellen der langsamsten Jobs für jeden Kindlauf, sodass die Release-Verantwortlichen
den aktuellen kritischen Pfad sehen können, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Stufenmatrix, exakte Workflow-Jobnamen, Unterschiede zwischen stable- und full-Profil,
Artefakte und fokussierte Rerun-Handles.
Kind-Workflows werden von der vertrauenswürdigen Ref dispatcht, die `Full Release
Validation` ausführt, normalerweise `--ref main`, auch wenn die Ziel-`ref` auf einen
älteren Release-Branch oder Tag zeigt. Es gibt keine separate Full-Release-Validation-
Workflow-Ref-Eingabe; wählen Sie den vertrauenswürdigen Harness, indem Sie die Ref des Workflow-Laufs wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für exakten Commit-Nachweis auf einem beweglichen `main`;
rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein, verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den gepinnten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster releasekritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: minimum plus stabile Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: stable plus breite Advisory-Provider-/Media-Abdeckung

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die Ziel-Ref
einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt sowohl in
Docker-Checks für den Release-Pfad als auch in Package Acceptance erneut. Dadurch bleiben alle
packagebezogenen Boxen auf denselben Bytes und wiederholte Package-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane
Package-Installation, Onboarding, Gateway-Start und eine Live-Agent-Runde nachweist,
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

Verwenden Sie den vollständigen Umbrella nicht als ersten Rerun nach einem fokussierten Fix. Wenn eine Box
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen Kind-Workflow, Job,
die Docker-Lane, das Package-Profil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella erst dann
erneut aus, wenn der Fix gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise
veraltet gemacht hat. Der abschließende Verifier des Umbrella prüft die aufgezeichneten Kind-Workflow-Run-
IDs erneut. Nachdem ein Kind-Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur das normale CI-Kind aus, `plugin-prerelease`
führt nur das releaseexklusive Plugin-Kind aus, `release-checks` führt jede Release-
Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Fokussierte `npm-telegram`-Reruns erfordern `npm_telegram_package_spec`; full/all-Läufe
mit `release_profile=full` verwenden das Package-Artefakt der Release-Checks.

### Vitest

Die Vitest-Box ist der manuelle `CI`-Kind-Workflow. Manuelle CI umgeht bewusst
Changed-Scoping und erzwingt den normalen Testgraphen für den Release-
Candidate: Linux-Node-Shards, Bundled-Plugin-Shards, Channel-Contracts, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Checks, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Source Tree die vollständige normale Testsuite bestanden?“
Das ist nicht dasselbe wie Produktvalidierung für den Release-Pfad. Aufzubewahrende Nachweise:

- `Full Release Validation`-Zusammenfassung mit der URL des dispatchten `CI`-Laufs
- grüner `CI`-Lauf auf der exakten Ziel-SHA
- fehlgeschlagene oder langsame Shard-Namen aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Lauf Performance-Analyse benötigt

Führen Sie manuelle CI nur dann direkt aus, wenn der Release deterministische normale CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Package-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box lebt in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` plus den Release-Modus-
`install-smoke`-Workflow. Sie validiert den Release-Candidate über paketierte
Docker-Umgebungen statt nur über Tests auf Source-Ebene.

Die Release-Docker-Abdeckung umfasst:

- vollständiger Install-Smoke mit aktiviertem langsamen globalen Bun-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-,
  Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate Install-Smoke-
  Shards laufen
- Repository-E2E-Lanes
- Docker-Chunks für den Release-Pfad: `core`, `package-update-openai`,
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
- Live/E2E-Provider-Suiten und Docker-Live-Modellabdeckung, wenn Release-Checks
  Live-Suiten enthalten

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Scheduler für den Release-Pfad lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für fokussierte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow statt
alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten frühere
`package_artifact_run_id` und vorbereitete Docker-Image-Eingaben, wenn verfügbar, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images erneut verwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest und Docker-
Package-Mechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Parity-Lane, die die OpenAI-Candidate-Lane anhand des agentischen Parity-Packs
  mit der Opus-4.6-Baseline vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich der Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Parity-, Matrix- und Telegram-
Lanes auf, wenn Sie den Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller, geshardeter QA-Lab-Lauf verfügbar statt als standardmäßige releasekritische Lane.

### Package

Die Package-Box ist das Gate für das installierbare Produkt. Sie wird durch
`Package Acceptance` und den Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen
Candidate in den `package-under-test`-Tarball, der von Docker-E2E verbraucht wird, validiert
das Package-Inventar, zeichnet Package-Version und SHA-256 auf und hält die
Workflow-Harness-Ref von der Package-Source-Ref getrennt.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness packen
- `source=url`: ein HTTPS-`.tgz` mit erforderlicher `package_sha256` herunterladen
- `source=artifact`: ein von einem anderen GitHub-Actions-Lauf hochgeladenes `.tgz` wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Package-Artefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` und
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update, Bereinigung veralteter
Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Update und Telegram-
Package-QA gegen denselben aufgelösten Tarball. Die Upgrade-Matrix deckt jede stabile npm-veröffentlichte Baseline von `2026.4.23` bis `latest` ab; verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Candidate oder
`source=ref`/`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der
Veröffentlichung. Es ist der GitHub-native
Ersatz für den Großteil der Package-/Update-Abdeckung, die zuvor Parallels erforderte.
Cross-OS-Release-Checks bleiben für OS-spezifisches Onboarding,
Installer- und Plattformverhalten wichtig, aber Package-/Update-Produktvalidierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn
Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine
Plugin-Installation/ein Plugin-Update, Doctor-Bereinigung oder eine Published-Package-Migrationsänderung nachweist.
Vollständige veröffentlichte Update-Migration aus jedem stabilen `2026.4.23+`-Package ist
ein separater manueller `Update Migration`-Workflow, nicht Teil der vollständigen Release-CI.

Legacy-Package-Acceptance-Toleranz ist absichtlich zeitlich begrenzt. Packages bis
`2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits
auf npm veröffentlicht wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-
Fixture, fehlende persistierte `update.channel`, Legacy-Speicherorte für Plugin-Install-Records,
fehlende Persistenz von Marketplace-Install-Records und Config-Metadatenmigration während
`plugins update`. Das veröffentlichte Package `2026.4.26` darf für lokale Build-Metadaten-
Stamp-Dateien warnen, die bereits ausgeliefert wurden. Spätere Packages müssen
die modernen Package-Verträge erfüllen; dieselben Lücken lassen die Release-
Validierung fehlschlagen.

Verwenden Sie breitere Package-Acceptance-Profile, wenn die Release-Frage ein
tatsächlich installierbares Package betrifft:

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

- `smoke`: schnelle Lanes für Paketinstallation/Kanal/Agent, Gateway-Netzwerk und
  erneutes Laden der Konfiguration
- `package`: Installations-/Update-/Plugin-Paketverträge ohne Live-ClawHub; dies ist der
  Standard für Release-Checks
- `product`: `package` plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Abschnitte mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Wiederholungen

Aktivieren Sie für den Telegram-Nachweis mit Paketkandidat `telegram_mode=mock-openai` oder
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

Stabile Promotion direkt zu `latest` ist explizit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Verwenden Sie die niedrigeren Workflows `Plugin NPM Release` und `Plugin ClawHub Release`
nur für fokussierte Reparatur- oder erneute Veröffentlichungsarbeiten. Für eine ausgewählte Plugin-Reparatur übergeben Sie
`plugin_publish_scope=selected` und `plugins=@openclaw/name` an
`OpenClaw Release Publish`, oder lösen Sie den untergeordneten Workflow direkt aus, wenn das
OpenClaw-Paket nicht veröffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true` ist, darf es auch die aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches für einen rein validierenden Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; standardmäßig `beta`

`OpenClaw Release Publish` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Lauf-ID;
  erforderlich, wenn `publish_openclaw_npm=true` ist
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: standardmäßig `all-publishable`; verwenden Sie `selected` nur
  für fokussierte Reparaturarbeiten
- `plugins`: kommagetrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standardmäßig `true`; setzen Sie dies nur auf `false`, wenn Sie den
  Workflow als reinen Plugin-Reparatur-Orchestrator verwenden

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA, die validiert werden soll. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.

Regeln:

- Stabile und Korrektur-Tags dürfen entweder nach `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true` ist
- `OpenClaw Release Checks` und `Full Release Validation` sind immer
  nur zur Validierung
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflights verwendet wurde;
  der Workflow prüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Stabile npm-Release-Abfolge

Beim Schneiden eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie die aktuelle vollständige Commit-SHA des Workflow-Branches
     für einen rein validierenden Trockenlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur,
   wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Referenz aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`
   und der gespeicherten `preflight_run_id` aus; dies veröffentlicht externalisierte Plugins in npm
   und ClawHub, bevor das OpenClaw-npm-Paket promoted wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-Workflow,
   um diese stabile Version von `beta` nach `latest` zu promoten
8. Wenn das Release bewusst direkt nach `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zu zeigen, oder lassen Sie dessen geplante
   Self-Healing-Synchronisierung `beta` später verschieben

Die Dist-Tag-Mutation liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repo nur OIDC-Veröffentlichung beibehält.

Dadurch bleiben der direkte Veröffentlichungspfad und der Beta-zuerst-Promotion-Pfad beide
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückfallen muss, führen Sie alle 1Password-
CLI-Befehle (`op`) nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Agent-Shell auf; wenn es in tmux bleibt, sind Prompts,
Warnungen und OTP-Handhabung beobachtbar, und wiederholte Host-Warnungen werden verhindert.

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
