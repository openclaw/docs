---
read_when:
    - Suche nach Definitionen für öffentliche Release-Kanäle
    - Release-Validierung oder Paketakzeptanz ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Kadenz
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-07T13:25:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen, oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der sich bewegende Kopf von `main`

## Versionsbenennung

- Version eines stabilen Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines stabilen Korrektur-Releases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version eines Beta-Prereleases: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit Nullen auffüllen
- `latest` bedeutet das aktuell promotete stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können ausdrücklich `latest` als Ziel wählen oder später einen geprüften Beta-Build promoten
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  Build, Signierung und Notarisierung der Mac-App für stabile Releases reserviert sind, sofern nicht ausdrücklich angefordert

## Release-Takt

- Releases laufen zuerst über Beta
- Stabil folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise von einem `release/YYYY.M.D`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, erstellen Maintainer
  das nächste `-beta.N`-Tag, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Abläufe, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, Dist-Tag-Wiederherstellung und Details zum Notfall-Rollback bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Beginnen Sie mit dem aktuellen `main`: holen Sie den neuesten Stand, bestätigen Sie, dass der Ziel-Commit gepusht ist,
   und bestätigen Sie, dass die aktuelle CI von `main` ausreichend grün ist, um davon abzuzweigen.
2. Schreiben Sie den obersten Abschnitt von `CHANGELOG.md` anhand der echten Commit-Historie mit
   `/changelog` neu, halten Sie Einträge nutzerorientiert, committen Sie ihn, pushen Sie ihn und führen Sie vor dem Branching
   noch einmal Rebase/Pull aus.
3. Prüfen Sie Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts`. Entfernen Sie abgelaufene
   Kompatibilität nur, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren Sie, warum sie
   absichtlich beibehalten wird.
4. Erstellen Sie `release/YYYY.M.D` aus dem aktuellen `main`; führen Sie normale Release-Arbeit
   nicht direkt auf `main` aus.
5. Erhöhen Sie jede erforderliche Versionsstelle für das vorgesehene Tag, führen Sie
   `pnpm plugins:sync` aus, damit veröffentlichbare Plugin-Pakete die Release-Version
   und Kompatibilitätsmetadaten teilen, und führen Sie dann den lokalen deterministischen Preflight aus:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` und
   `pnpm release:check`.
6. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus. Bevor ein Tag existiert,
   ist ein vollständiger 40-stelliger SHA des Release-Branch für einen nur validierenden
   Preflight erlaubt. Speichern Sie die erfolgreiche `preflight_run_id`.
7. Starten Sie alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, beheben Sie das Problem auf dem Release-Branch und führen Sie die kleinste fehlgeschlagene
   Datei, den kleinsten fehlgeschlagenen Kanal, Workflow-Job, das Paketprofil, den Provider oder die Modell-Allowlist erneut aus, der bzw. die
   den Fix nachweist. Führen Sie den vollständigen Umbrella-Lauf nur erneut aus, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Beta taggen Sie `vYYYY.M.D-beta.N` und führen dann `OpenClaw Release Publish` vom
   passenden `release/YYYY.M.D`-Branch aus. Es prüft `pnpm plugins:sync:check`,
   dispatcht alle veröffentlichbaren Plugin-Pakete parallel an npm und denselben Satz an
   ClawHub und promotet anschließend das vorbereitete OpenClaw-npm-Preflight-
   Artefakt mit dem passenden Dist-Tag, sobald die npm-Veröffentlichung der Plugins erfolgreich ist.
   Die Veröffentlichung auf ClawHub kann noch laufen, während OpenClaw auf npm veröffentlicht, aber der
   Release-Publish-Workflow endet erst, wenn beide Plugin-Veröffentlichungspfade und
   der OpenClaw-npm-Veröffentlichungspfad erfolgreich abgeschlossen sind. Führen Sie nach der Veröffentlichung
   die Paketakzeptanz nach der Veröffentlichung gegen das veröffentlichte Paket
   `openclaw@YYYY.M.D-beta.N` oder `openclaw@beta` aus. Wenn ein gepushtes oder veröffentlichtes Prerelease einen Fix benötigt,
   erstellen Sie die nächste passende Prerelease-Nummer; löschen oder überschreiben Sie das alte
   Prerelease nicht.
10. Für stabil fahren Sie erst fort, nachdem die geprüfte Beta oder der Release Candidate über die
    erforderlichen Validierungsnachweise verfügt. Die stabile npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` erneut; die Release-Bereitschaft der stabilen macOS-Version erfordert außerdem die
    paketierte `.zip`, `.dmg`, `.dSYM.zip` und eine aktualisierte `appcast.xml` auf `main`.
11. Führen Sie nach der Veröffentlichung den npm-Post-Publish-Verifier aus, optional ein eigenständiges
    Published-npm-Telegram-E2E, wenn Sie Channel-Nachweise nach der Veröffentlichung benötigen,
    Dist-Tag-Promotion bei Bedarf, GitHub-Release-/Prerelease-Notizen aus dem
    vollständigen passenden Abschnitt von `CHANGELOG.md` sowie die Schritte zur Release-Ankündigung.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  außerhalb des schnelleren lokalen Gates `pnpm check` abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren
  Prüfungen für Importzyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  Release-Artefakte `dist/*` und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm plugins:sync` nach dem Versions-Bump im Root und vor dem Tagging aus. Es
  aktualisiert die Paketversionen veröffentlichbarer Plugins, OpenClaw-Peer/API-Kompatibilitäts-
  Metadaten, Build-Metadaten und Plugin-Changelog-Stubs, damit sie zur Core-
  Release-Version passen. `pnpm plugins:sync:check` ist der nicht verändernde Release-Guard;
  der Veröffentlichungs-Workflow schlägt vor jeder Registry-Mutation fehl, wenn dieser Schritt
  vergessen wurde.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um
  alle Pre-Release-Testboxen von einem Einstiegspunkt aus zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, dispatcht manuell `CI` und dispatcht
  `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Cross-OS-
  Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stabile/Standardläufe
  lassen exhaustive Live/E2E- und Docker-Release-Pfad-Soak-Prüfungen hinter
  `run_release_soak=true`; `release_profile=full` erzwingt Soak. Mit
  `release_profile=full` und `rerun_group=all` führt er außerdem Paket-Telegram-
  E2E gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen aus.
  Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dasselbe
  Telegram-E2E auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie
  `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance
  seine Paket-/Update-Matrix gegen das ausgelieferte npm-Paket statt gegen das aus dem SHA
  gebaute Artefakt ausführen soll. Geben Sie
  `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die
  Validierung zu einem veröffentlichten npm-Paket passt, ohne Telegram-E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweise
  für einen Paketkandidaten benötigen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen `package_ref`-Branch/-Tag/-SHA mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem
  SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-
  Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram-QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die
  ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt
  der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte
  Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket sowohl als
  installierte CLI als auch als Package-under-test, damit der verwaltete Neustartpfad des
  Update-Befehls des Kandidaten ausgeübt wird.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Gängige Profile:
  - `smoke`: Installations-/Channel-/Agent-, Gateway-Netzwerk- und Konfigurations-Reload-Lanes
  - `package`: artefaktnative Paket-/Update-/Neustart-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Channels, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten erneuten Lauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-
  Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen Changed-
  Scoping und erzwingen die Linux-Node-Shards, Bundled-Plugin-Shards, Channel-
  Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke,
  Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-
  Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt
  QA-Lab über einen lokalen OTLP/HTTP-Receiver aus und verifiziert die exportierten Trace-
  Span-Namen, begrenzten Attribute und Inhalts-/Identifier-Redaktion, ohne
  Opik, Langfuse oder einen anderen externen Collector zu erfordern.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die mutierende Veröffentlichungssequenz aus, nachdem der
  Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` (oder `main`, wenn ein von main
  erreichbarer Tag veröffentlicht wird), übergeben Sie den Release-Tag und die erfolgreiche OpenClaw-npm-
  `preflight_run_id`, und behalten Sie den Standard-Plugin-Veröffentlichungs-Scope
  `all-publishable` bei, sofern Sie nicht bewusst eine fokussierte Reparatur ausführen. Der
  Workflow serialisiert die Veröffentlichung von Plugin-npm, Plugin-ClawHub und OpenClaw-
  npm, damit das Core-Paket nicht vor seinen externalisierten
  Plugins veröffentlicht wird.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem vor der Release-Freigabe die QA-Lab-Mock-Paritäts-Lane sowie das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-
  Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-
  Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie das vollständige Matrix-
  Transport-, Medien- und E2EE-Inventar parallel benötigen.
- Cross-OS-Installations- und Upgrade-Runtime-Validierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad bleibt kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release
Validation` oder vom `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Die rein validierende Preflight-Prüfung `OpenClaw NPM Release` akzeptiert außerdem den aktuellen
  vollständigen 40-Zeichen-Commit-SHA des Workflow-Branches, ohne einen gepushten Tag zu verlangen
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung
  übernommen werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; eine echte Veröffentlichung erfordert weiterhin einen echten Release-Tag
- Beide Workflows halten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten
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
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Installed-Package-Onboarding, Telegram-Einrichtung und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket unter Verwendung des gemeinsam geleasten Telegram-Credential-
  Pools zu verifizieren. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einem Maintainer-Rechner aus auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, dispatcht `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über GitHub Actions mit dem
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist absichtlich nur manuell und
  läuft nicht bei jedem Merge.
- Die Maintainer-Release-Automatisierung verwendet jetzt Preflight-then-Promote:
  - echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestanden haben
  - die echte npm-Veröffentlichung muss vom selben `main`- oder
    `release/YYYY.M.D`-Branch dispatcht werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Input explizit `latest` als Ziel verwenden
  - tokenbasierte npm-Dist-Tag-Mutation befindet sich jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo OIDC-only-Veröffentlichung beibehält
  - öffentliches `macOS Release` ist nur Validierung; wenn ein Tag nur auf einem
    Release-Branch existiert, der Workflow aber von `main` dispatcht wird, setzen Sie
    `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestanden haben
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Bei stabilen Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier
  außerdem denselben Temp-Prefix-Upgrade-Pfad von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen ältere globale Installationen nicht stillschweigend auf dem
  Basis-Stable-Payload belassen können
- Der npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Entrypoints und
  Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das
  fehlende Plugin-Runtime-Payloads ausliefert, lässt den Postpublish-Verifier fehlschlagen und
  kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliche Pack-Aufblähung
  vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder
  Extension-Testmatrizen berührt hat, regenerieren und prüfen Sie die planner-eigenen
  `plugin-prerelease-extension-shard`-Matrixausgaben aus
  `.github/workflows/plugin-prerelease.yml` vor der Freigabe, damit Release Notes kein
  veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die gepackten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf das neue stabile ZIP verweisen
  - die gepackte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist die Methode, mit der Operatoren alle Pre-Release-Tests von
einem Einstiegspunkt aus starten. Für einen Nachweis eines gepinnten Commits auf einem sich schnell bewegenden Branch verwenden Sie den
Helper, damit jeder Child-Workflow von einem temporären Branch läuft, der auf den Ziel-
SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
von diesem Branch mit `ref=<sha>`, verifiziert, dass jeder Child-Workflow-`headSha`
zum Ziel passt, und löscht anschließend den temporären Branch. Dadurch wird vermieden, versehentlich einen
neueren `main`-Child-Lauf nachzuweisen.

Für die Validierung von Release-Branches oder Tags führen Sie ihn vom vertrauenswürdigen `main`-Workflow-
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

Der Workflow löst den Ziel-Ref auf, dispatcht manuell `CI` mit
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks`, bereitet ein
übergeordnetes `release-package-under-test`-Artefakt für paketbezogene Prüfungen vor und
dispatcht eigenständiges Paket-Telegram-E2E, wenn `release_profile=full` mit
`rerun_group=all` verwendet wird oder wenn `npm_telegram_package_spec` gesetzt ist. `OpenClaw Release
Checks` fächert dann in Install-Smoke, Cross-OS-Release-Prüfungen, Live/E2E-Docker-
Release-Pfad-Abdeckung bei aktiviertem Soak, Package Acceptance mit Telegram-
Paket-QA, QA-Lab-Parität, Live-Matrix und Live-Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die
`Full Release Validation`-
Zusammenfassung `normal_ci` und `release_checks` als erfolgreich anzeigt. Im Modus full/all
muss das `npm_telegram`-Child ebenfalls erfolgreich sein; außerhalb von full/all wird es übersprungen,
sofern keine veröffentlichte `npm_telegram_package_spec` angegeben wurde. Die abschließende
Verifier-Zusammenfassung enthält Tabellen mit den langsamsten Jobs für jeden Child-Lauf, damit der Release-
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Full release validation](/de/reference/full-release-validation) für die
vollständige Stage-Matrix, exakte Workflow-Job-Namen, Unterschiede zwischen Stable- und Full-Profil,
Artefakte und gezielte Rerun-Handles.
Child-Workflows werden von dem vertrauenswürdigen Ref dispatcht, der `Full Release
Validation` ausführt, normalerweise `--ref main`, auch wenn der Ziel-`ref` auf einen
älteren Release-Branch oder Tag zeigt. Es gibt keine separate Full-Release-Validation-
Workflow-Ref-Eingabe; wählen Sie den vertrauenswürdigen Harness, indem Sie den Workflow-Run-Ref wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für den exakten Commit-Nachweis auf sich bewegendem `main`;
rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein. Verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den angepinnten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite advisory Provider-/Medien-Abdeckung

Verwenden Sie `run_release_soak=true` mit `stable`, wenn die release-blockierenden Lanes
grün sind und Sie vor der Promotion den vollständigen Live/E2E-, Docker-Release-Pfad- und
begrenzten veröffentlichten Upgrade-Survivor-Sweep möchten. Dieser Sweep deckt
die neuesten vier stabilen Pakete plus angepinnte `2026.4.23`- und `2026.5.2`-
Baselines plus ältere `2026.4.15`-Abdeckung ab, wobei doppelte Baselines entfernt und
jede Baseline in ihren eigenen Docker-Runner-Job geshardet wird. `full` impliziert
`run_release_soak=true`.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den Ziel-
Ref einmalig als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt in Cross-OS-,
Package-Acceptance- und Release-Pfad-Docker-Prüfungen wieder, wenn Soak läuft. Dadurch bleiben
alle paketbezogenen Boxen auf denselben Bytes und wiederholte Paket-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane
Paketinstallation, Onboarding, Gateway-Start und eine Live-Agent-Runde nachweist,
statt das langsamste Standardmodell zu benchmarken. Die breitere Live-Provider-
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

Verwenden Sie den vollständigen Umbrella nicht als ersten Rerun nach einer gezielten Korrektur. Wenn eine Box
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen Child-Workflow, Job, die Docker-Lane, das Paketprofil, den Modell-
Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella nur dann erneut aus, wenn
die Korrektur die gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise
veraltet gemacht hat. Der abschließende Verifier des Umbrellas prüft die aufgezeichneten Child-Workflow-Run-
IDs erneut. Nachdem ein Child-Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur das normale CI-Child aus, `plugin-prerelease`
führt nur das release-spezifische Plugin-Child aus, `release-checks` führt jede Release-
Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Gezielte `npm-telegram`-Reruns erfordern `npm_telegram_package_spec`; full/all-Läufe
mit `release_profile=full` verwenden das Paketartefakt aus release-checks. Gezielte
Cross-OS-Reruns können `cross_os_suite_filter=windows/packaged-upgrade` oder
einen anderen OS-/Suite-Filter hinzufügen. QA-Release-Check-Fehler sind advisory; ein reiner QA-
Fehler blockiert die Release-Validierung nicht.

### Vitest

Die Vitest-Box ist der manuelle `CI`-Child-Workflow. Manuelles CI umgeht absichtlich
Changed-Scoping und erzwingt den normalen Testgraphen für den Release-
Candidate: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Source Tree die vollständige normale Testsuite bestanden?“
Sie ist nicht dasselbe wie die Produktvalidierung des Release-Pfads. Aufzubewahrende Nachweise:

- `Full Release Validation`-Zusammenfassung mit der URL des dispatchten `CI`-Laufs
- grüner `CI`-Lauf auf der exakten Ziel-SHA
- fehlgeschlagene oder langsame Shard-Namen aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Lauf Performance-Analyse benötigt

Führen Sie manuelles CI nur dann direkt aus, wenn das Release deterministisches normales CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` plus den Release-Modus-
`install-smoke`-Workflow. Sie validiert den Release-Candidate über paketierte
Docker-Umgebungen statt nur über Tests auf Source-Ebene.

Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamem Bun-Global-Install-Smoke
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
- Live/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Prüfungen
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für gezielte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow, statt
alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten frühere
`package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, wenn verfügbar, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest und Docker-
Paketmechanik.

Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane mit der Opus-4.6-
  Baseline anhand des agentischen Parity Packs vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Paritäts-, Matrix- und Telegram-
Lanes auf, wenn Sie das Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller geshardeter QA-Lab-Lauf verfügbar, nicht als standardmäßige release-kritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird durch
`Package Acceptance` und den Resolver
`scripts/resolve-openclaw-package-candidate.mjs` unterstützt. Der Resolver normalisiert einen
Candidate in den `package-under-test`-Tarball, der von Docker E2E genutzt wird, validiert
das Paketinventar, zeichnet die Paketversion und SHA-256 auf und hält den
Workflow-Harness-Ref vom Paket-Source-Ref getrennt.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness packen
- `source=url`: ein HTTPS-`.tgz` mit erforderlichem `package_sha256` herunterladen
- `source=artifact`: ein von einem anderen GitHub-Actions-Lauf hochgeladenes `.tgz` wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paketartefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update,
Neustart bei konfigurierter Auth-Aktualisierung, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-
Fixtures, Plugin-Update und Telegram-Paket-QA gegen denselben aufgelösten
Tarball. Blockierende Release-Prüfungen verwenden die standardmäßige zuletzt veröffentlichte Paket-
Baseline; `run_release_soak=true` oder
`release_profile=full` erweitert auf jede stabile npm-veröffentlichte Baseline von
`2026.4.23` bis `latest` plus Fixtures zu gemeldeten Issues. Verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Candidate oder
`source=ref`/`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der
Veröffentlichung. Es ist der GitHub-native
Ersatz für den Großteil der Paket-/Update-Abdeckung, die zuvor
Parallels erforderte. Cross-OS-Release-Prüfungen bleiben für OS-spezifisches Onboarding,
Installer- und Plattformverhalten wichtig, aber die Produktvalidierung für Pakete/Updates sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Testing updates and plugins](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn
Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine
Plugin-Installation/-Aktualisierung, Doctor-Bereinigung oder veröffentlichte Paketmigration nachweist.
Eine vollständige veröffentlichte Update-Migration von jedem stabilen `2026.4.23+`-Paket ist
ein separater manueller `Update Migration`-Workflow, nicht Teil von Full Release CI.

Die Toleranz fuer Legacy-Package-Acceptance ist absichtlich zeitlich
begrenzt. Pakete bis einschliesslich `2026.4.25` duerfen den
Kompatibilitaetspfad fuer Metadatenluecken verwenden, die bereits auf npm
veroeffentlicht wurden: private QA-Inventareintraege, die im Tarball fehlen,
fehlendes `gateway install --wrapper`, fehlende Patchdateien in der aus dem
Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`,
Legacy-Speicherorte fuer Plugin-Installationsdatensaetze, fehlende Persistenz
von Marketplace-Installationsdatensaetzen und Migration von
Konfigurationsmetadaten waehrend `plugins update`. Das veroeffentlichte Paket
`2026.4.26` darf fuer bereits ausgelieferte lokale Build-Metadaten-Stempeldateien
warnen. Spaetere Pakete muessen die modernen Paketvertraege erfuellen; dieselben
Luecken lassen die Release-Validierung fehlschlagen.

Verwenden Sie breitere Package Acceptance-Profile, wenn es bei der
Release-Frage um ein tatsaechlich installierbares Paket geht:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Gelaeufige Paketprofile:

- `smoke`: schnelle Lanes fuer Paketinstallation/Kanal/Agent, Gateway-Netzwerk
  und Neuladen der Konfiguration
- `package`: Installations-/Update-/Neustart-/Plugin-Paketvertraege ohne
  Live-ClawHub; dies ist der Standard fuer Release-Pruefungen
- `product`: `package` plus MCP-Kanaele, Cron-/Subagent-Bereinigung,
  OpenAI-Websuche und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste fuer fokussierte Wiederholungen

Aktivieren Sie fuer Package-Candidate-Telegram-Nachweise
`telegram_mode=mock-openai` oder `telegram_mode=live-frontier` in Package
Acceptance. Der Workflow uebergibt den aufgeloesten `package-under-test`-Tarball
an die Telegram-Lane; der eigenstaendige Telegram-Workflow akzeptiert weiterhin
eine veroeffentlichte npm-Spezifikation fuer Pruefungen nach der
Veroeffentlichung.

## Automatisierung der Release-Veroeffentlichung

`OpenClaw Release Publish` ist der normale mutierende Einstiegspunkt fuer
Veroeffentlichungen. Er orchestriert die Trusted-Publisher-Workflows in der
Reihenfolge, die das Release benoetigt:

1. Release-Tag auschecken und dessen Commit-SHA aufloesen.
2. Pruefen, ob das Tag von `main` oder `release/*` aus erreichbar ist.
3. `pnpm plugins:sync:check` ausfuehren.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` dispatchen.
5. `Plugin ClawHub Release` mit demselben Scope und derselben SHA dispatchen.
6. `OpenClaw NPM Release` mit dem Release-Tag, dem npm-dist-tag und der
   gespeicherten `preflight_run_id` dispatchen.

Beispiel fuer Beta-Veroeffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Veroeffentlichung mit dem Standard-beta-dist-tag:

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
nur fuer fokussierte Reparatur- oder Wiederveroeffentlichungsarbeiten. Fuer eine
ausgewaehlte Plugin-Reparatur uebergeben Sie `plugin_publish_scope=selected` und
`plugins=@openclaw/name` an `OpenClaw Release Publish`, oder dispatchen Sie den
Child-Workflow direkt, wenn das OpenClaw-Paket nicht veroeffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true` ist, darf es auch die aktuelle
  vollstaendige 40-stellige Workflow-Branch-Commit-SHA fuer einen
  rein validierenden Preflight sein
- `preflight_only`: `true` nur fuer Validierung/Build/Paket, `false` fuer den
  echten Veroeffentlichungspfad
- `preflight_run_id`: auf dem echten Veroeffentlichungspfad erforderlich, damit
  der Workflow den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf
  wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag fuer den Veroeffentlichungspfad; Standard ist
  `beta`

`OpenClaw Release Publish` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche Preflight-Run-ID von `OpenClaw NPM Release`;
  erforderlich, wenn `publish_openclaw_npm=true` ist
- `npm_dist_tag`: npm-Ziel-Tag fuer das OpenClaw-Paket
- `plugin_publish_scope`: Standard ist `all-publishable`; verwenden Sie
  `selected` nur fuer fokussierte Reparaturarbeiten
- `plugins`: kommagetrennte Paketnamen `@openclaw/*`, wenn
  `plugin_publish_scope=selected` ist
- `publish_openclaw_npm`: Standard ist `true`; setzen Sie dies nur dann auf
  `false`, wenn der Workflow als reiner Plugin-Reparatur-Orchestrator verwendet
  wird

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Eingaben:

- `ref`: Branch, Tag oder vollstaendige Commit-SHA zur Validierung.
  Secret-haltige Pruefungen erfordern, dass der aufgeloeste Commit von einem
  OpenClaw-Branch oder Release-Tag aus erreichbar ist.
- `run_release_soak`: aktiviert exhaustive Live-/E2E-, Docker-Release-Pfad- und
  all-since-Upgrade-Survivor-Soak-Pruefungen bei stabilen/Standard-Release-Pruefungen.
  Dies wird durch `release_profile=full` erzwungen.

Regeln:

- Stabile und Korrektur-Tags duerfen entweder nach `beta` oder `latest`
  veroeffentlichen
- Beta-Prerelease-Tags duerfen nur nach `beta` veroeffentlichen
- Fuer `OpenClaw NPM Release` ist die Eingabe einer vollstaendigen Commit-SHA
  nur erlaubt, wenn `preflight_only=true` ist
- `OpenClaw Release Checks` und `Full Release Validation` sind immer nur
  validierend
- Der echte Veroeffentlichungspfad muss dasselbe `npm_dist_tag` verwenden, das
  waehrend des Preflight verwendet wurde; der Workflow prueft diese Metadaten,
  bevor die Veroeffentlichung fortgesetzt wird

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release erstellen:

1. Fuehren Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, duerfen Sie die aktuelle vollstaendige
     Workflow-Branch-Commit-SHA fuer einen rein validierenden Probelauf des
     Preflight-Workflows verwenden
2. Waehlen Sie `npm_dist_tag=beta` fuer den normalen Beta-zuerst-Ablauf oder
   `latest` nur dann, wenn Sie bewusst eine direkte stabile Veroeffentlichung
   wuenschen
3. Fuehren Sie `Full Release Validation` auf dem Release-Branch, Release-Tag
   oder der vollstaendigen Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache,
   Docker, QA Lab, Matrix und Telegram-Abdeckung aus einem manuellen Workflow
   heraus wuenschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benoetigen,
   fuehren Sie stattdessen den manuellen `CI`-Workflow auf dem Release-Ref aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Fuehren Sie `OpenClaw Release Publish` mit demselben `tag`, demselben
   `npm_dist_tag` und der gespeicherten `preflight_run_id` aus; dies
   veroeffentlicht externalisierte Plugins in npm und ClawHub, bevor das
   OpenClaw-npm-Paket promoted wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten Workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`, um
   diese stabile Version von `beta` auf `latest` zu promoten
8. Wenn das Release bewusst direkt nach `latest` veroeffentlicht wurde und
   `beta` sofort demselben stabilen Build folgen soll, verwenden Sie denselben
   privaten Workflow, um beide dist-tags auf die stabile Version zu setzen, oder
   lassen Sie die geplante Self-Healing-Synchronisierung `beta` spaeter
   verschieben

Die dist-tag-Mutation liegt aus Sicherheitsgruenden im privaten Repo, weil sie
weiterhin `NPM_TOKEN` erfordert, waehrend das oeffentliche Repo
OIDC-only-Veroeffentlichung beibehaelt.

Dadurch bleiben der direkte Veroeffentlichungspfad und der Beta-zuerst-Promotionspfad
beide dokumentiert und fuer Operator sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurueckfallen muss, fuehren
Sie alle 1Password-CLI-Befehle (`op`) nur innerhalb einer dedizierten tmux-Sitzung
aus. Rufen Sie `op` nicht direkt aus der Haupt-Agent-Shell auf; die Ausfuehrung
innerhalb von tmux macht Prompts, Warnungen und OTP-Handling beobachtbar und
verhindert wiederholte Host-Warnungen.

## Oeffentliche Referenzen

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
fuer das eigentliche Runbook.

## Verwandt

- [Release-Kanaele](/de/install/development-channels)
