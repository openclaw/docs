---
read_when:
    - Suche nach Definitionen für öffentliche Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Rhythmus
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-12T08:46:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig in npm `beta` veröffentlichen, oder in npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Vorab-Release-Tags, die in npm `beta` veröffentlichen
- dev: der bewegliche Head von `main`

## Versionsbenennung

- Stable-Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stable-Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Vorab-Release-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet den aktuell promoteten stabilen npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig in npm `beta`; Release-Operatoren können ausdrücklich `latest` als Ziel wählen oder später einen geprüften Beta-Build promoten
- Jeder stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  macOS-App-Build, Signierung und Notarisierung für stabile Releases reserviert sind, sofern nicht ausdrücklich angefordert

## Release-Takt

- Releases durchlaufen zuerst Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise aus einem `release/YYYY.M.D`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, erstellen Maintainer
  das nächste `-beta.N`-Tag, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detailliertes Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, Dist-Tag-Wiederherstellung und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neuesten Stand pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle `main`-CI ausreichend grün ist, um davon zu branchen.
2. Den obersten Abschnitt in `CHANGELOG.md` anhand der echten Commit-Historie mit
   `/changelog` neu schreiben, Einträge benutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren, warum sie
   absichtlich beibehalten wird.
4. `release/YYYY.M.D` aus dem aktuellen `main` erstellen; normale Release-Arbeiten nicht
   direkt auf `main` durchführen.
5. Jede erforderliche Versionsstelle für das beabsichtigte Tag erhöhen, dann
   `pnpm release:prep` ausführen. Dies aktualisiert Plugin-Versionen, Plugin-Inventar, Konfigurationsschema,
   gebündelte Channel-Konfigurationsmetadaten, Konfigurationsdokumentations-Baseline, Plugin SDK
   Exporte und Plugin SDK API-Baseline in der richtigen Reihenfolge. Jegliche generierte
   Drift vor dem Taggen committen. Dann den lokalen deterministischen Preflight ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branch für rein validierenden
   Preflight zulässig. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA starten. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch fixen und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, Provider- oder Modell-Allowlist erneut ausführen, die
   den Fix belegt. Den vollständigen Umbrella nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veraltet macht.
9. Für Beta `vYYYY.M.D-beta.N` taggen, dann `OpenClaw Release Publish` aus
   dem passenden `release/YYYY.M.D`-Branch ausführen. Es prüft `pnpm plugins:sync:check`,
   dispatcht alle veröffentlichbaren Plugin-Pakete an npm und dieselbe Menge parallel an
   ClawHub und promotet dann das vorbereitete OpenClaw-npm-Preflight-Artefakt
   mit dem passenden Dist-Tag, sobald die Plugin-npm-Veröffentlichung erfolgreich ist.
   Nachdem das OpenClaw-npm-Publish-Child erfolgreich ist, erstellt oder aktualisiert es die
   passende GitHub-Release-/Prerelease-Seite aus dem vollständigen passenden
   Abschnitt in `CHANGELOG.md`. Stable-Releases, die in npm `latest` veröffentlicht werden, werden zum
   neuesten GitHub-Release; stabile Wartungs-Releases, die auf npm `beta` bleiben, werden
   mit GitHub `latest=false` erstellt.
   Die ClawHub-Veröffentlichung kann noch laufen, während OpenClaw npm veröffentlicht, aber der
   Release-Publish-Workflow gibt die Child-Run-IDs sofort aus. Standardmäßig
   wartet er nach dem Dispatch nicht auf ClawHub, damit die OpenClaw-npm-Verfügbarkeit
   nicht durch langsamere ClawHub-Freigaben oder Registry-Arbeiten blockiert wird; setzen Sie
   `wait_for_clawhub=true`, wenn ClawHub den Workflow-Abschluss blockieren muss. Der
   ClawHub-Pfad wiederholt vorübergehende Fehler bei der Installation von CLI-Abhängigkeiten, veröffentlicht
   Plugins mit bestandenem Preview auch dann, wenn eine Preview-Zelle flakt, und endet mit
   Registry-Verifizierung für jede erwartete Plugin-Version, sodass Teilveröffentlichungen
   sichtbar und wiederholbar bleiben. Nach der Veröffentlichung ausführen:
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   um GitHub-Prerelease, npm-`beta`-Dist-Tags, npm-Integrität,
   veröffentlichten Installationspfad, exakte ClawHub-Versionen, ClawHub-Artefakte und Child-
   Workflow-Ergebnisse mit einem Befehl zu verifizieren. `--rerun-failed-clawhub` hinzufügen, wenn der
   ClawHub-Sidecar nur in wiederholbaren Jobs fehlgeschlagen ist und direkt erneut ausgeführt werden soll.
   Dann die Post-Publish-Package-Acceptance gegen das veröffentlichte
   Paket `openclaw@YYYY.M.D-beta.N` oder
   `openclaw@beta` ausführen. Wenn ein gepushter oder veröffentlichter Prerelease einen Fix benötigt,
   die nächste passende Prerelease-Nummer erstellen; den alten
   Prerelease nicht löschen oder umschreiben.
10. Für Stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Stable-npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish`, wobei das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` wiederverwendet wird; Stable-macOS-Release-Bereitschaft erfordert außerdem die
    paketierten `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte `appcast.xml` auf `main`.
    Der private macOS-Publish-Workflow veröffentlicht den signierten Appcast automatisch auf dem öffentlichen
    `main`, nachdem Release-Assets verifiziert wurden; wenn Branch-Schutz den
    direkten Push blockiert, öffnet oder aktualisiert er einen Appcast-PR.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifizierer, bei Bedarf optionales eigenständiges
    veröffentlichtes-npm-Telegram-E2E für Post-Publish-Channel-Nachweis,
    Dist-Tag-Promotion bei Bedarf, die generierte GitHub-Release-Seite verifizieren
    und die Schritte für die Release-Ankündigung ausführen.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript auch
  außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren Prüfungen
  auf Importzyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:prep` nach dem Versionsbump im Root und vor dem Tagging aus. Es
  führt jeden deterministischen Release-Generator aus, der nach einer
  Versions-/Konfigurations-/API-Änderung häufig driftet: Plugin-Versionen, Plugin-Inventar, Basiskonfigurations-
  schema, gebündelte Channel-Konfigurationsmetadaten, Konfigurationsdokumentations-Baseline, Plugin-SDK-
  Exporte und Plugin-SDK-API-Baseline. `pnpm release:check` führt diese
  Guards im Prüfmodus erneut aus und meldet jeden gefundenen Driftfehler generierter Dateien in einem
  Durchlauf, bevor Paket-Release-Prüfungen ausgeführt werden.
- Führen Sie den manuellen `Full Release Validation`-Workflow vor der Release-Freigabe aus, um
  alle Pre-Release-Testboxen über einen einzigen Einstiegspunkt zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, dispatcht manuelle `CI` und dispatcht
  `OpenClaw Release Checks` für Installations-Smoke, Paketakzeptanz, Cross-OS-
  Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stabile/Standardläufe
  behalten erschöpfende Live-/E2E- und Docker-Release-Pfad-Soak-Prüfungen hinter
  `run_release_soak=true`; `release_profile=full` erzwingt Soak. Mit
  `release_profile=full` und `rerun_group=all` läuft außerdem Paket-Telegram-
  E2E gegen das `release-package-under-test`-Artefakt aus den Release-Prüfungen.
  Geben Sie `release_package_spec` nach der Veröffentlichung einer Beta an, um das ausgelieferte
  npm-Paket über Release-Prüfungen, Package Acceptance und Paket-Telegram-
  E2E hinweg wiederzuverwenden, ohne den Release-Tarball neu zu bauen. Geben Sie
  `npm_telegram_package_spec` nur an, wenn Telegram ein anderes
  veröffentlichtes Paket als der Rest der Release-Validierung verwenden soll. Geben Sie
  `package_acceptance_package_spec` an, wenn Package Acceptance ein
  anderes veröffentlichtes Paket als die Release-Paketspezifikation verwenden soll. Geben Sie
  `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die
  Validierung einem veröffentlichten npm-Paket entspricht, ohne Telegram E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen `Package Acceptance`-Workflow aus, wenn Sie einen Side-Channel-Nachweis
  für einen Paketkandidaten möchten, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen `package_ref`-Branch/-Tag/-SHA mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem
  SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-
  Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram-QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die
  ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paket-
  artefakt der Kandidat und `published_upgrade_survivor_baseline` wählt
  die veröffentlichte Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket als
  sowohl installierte CLI als auch package-under-test, damit der verwaltete Neustartpfad des
  Update-Befehls des Kandidaten geprüft wird.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Installations-/Channel-/Agent-, Gateway-Netzwerk- und Konfigurations-Neulade-Lanes
  - `package`: artefaktnative Paket-/Update-/Neustart-/Plugin-Lanes ohne OpenWebUI oder live ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten erneuten Lauf
- Führen Sie den manuellen `CI`-Workflow direkt aus, wenn Sie nur vollständige normale CI-
  Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen Changed-
  Scoping und erzwingen die Linux-Node-Shards, Bundled-Plugin-Shards, Channel-
  Contracts, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke,
  Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-
  Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es führt
  QA-Lab über einen lokalen OTLP/HTTP-Empfänger aus und verifiziert die exportierten Trace-
  Span-Namen, begrenzten Attribute und Inhalts-/Kennungs-Redaktion, ohne
  Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die verändernde Publish-Sequenz aus, nachdem der
  Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` (oder `main`, wenn ein
  von main erreichbarer Tag veröffentlicht wird), übergeben Sie den Release-Tag und die erfolgreiche OpenClaw-npm-
  `preflight_run_id`, und behalten Sie den standardmäßigen Plugin-Publish-Scope
  `all-publishable` bei, es sei denn, Sie führen bewusst eine fokussierte Reparatur aus. Der
  Workflow serialisiert Plugin-npm-Publish, Plugin-ClawHub-Publish und OpenClaw-
  npm-Publish, damit das Core-Paket nicht vor seinen externalisierten
  Plugins veröffentlicht wird.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe außerdem die QA-Lab-Mock-Paritätslane plus das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-
  Lanes verwenden die `qa-live-shared`-Umgebung; Telegram verwendet außerdem Convex-CI-
  Credential-Leases. Führen Sie den manuellen `QA-Lab - All Lanes`-Workflow mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständigen Matrix-
  Transport sowie Medien- und E2EE-Inventar parallel möchten.
- Cross-OS-Installations- und Upgrade-Laufzeitvalidierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie den Publish nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release
Validation` oder über die `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Die validierungsreine Preflight-Prüfung von `OpenClaw NPM Release` akzeptiert außerdem den aktuellen
  vollständigen 40-Zeichen-Commit-SHA des Workflow-Branches, ohne einen gepushten Tag zu verlangen
- Dieser SHA-Pfad dient nur der Validierung und kann nicht zu einem echten Publish
  hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; echter Publish erfordert weiterhin einen echten Release-Tag
- Beide Workflows halten den echten Publish- und Promotion-Pfad auf GitHub-gehosteten
  Runnern, während der nicht verändernde Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- npm-Release-Preflight wartet nicht mehr auf die separate Release-Prüfungs-Lane
- Bevor Sie einen Release-Kandidaten lokal taggen, führen Sie
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check` aus. Der Helper
  führt die schnellen Release-Guardrails, Plugin-npm-/ClawHub-Release-Prüfungen, Build,
  UI-Build und `release:openclaw:npm:check` in der Reihenfolge aus, die häufige
  freigabeblockierende Fehler abfängt, bevor der GitHub-Publish-Workflow startet.
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder den passenden Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach dem npm-Publish
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Prefix zu verifizieren
- Führen Sie nach einem Beta-Publish `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Onboarding mit installiertem Paket, Telegram-Einrichtung und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket über den gemeinsam geleasten Telegram-Credential-
  Pool zu verifizieren. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einer Maintainer-Maschine aus auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, dispatcht `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über den manuellen Workflow
  `NPM Telegram Beta E2E` aus GitHub Actions ausführen. Er ist bewusst nur manuell und
  läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promotion:
  - Echter npm-Publish muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - Der echte npm-Publish muss vom selben `main`- oder
    `release/YYYY.M.D`-Branch dispatcht werden wie der erfolgreiche Preflight-Lauf
  - Stabile npm-Releases verwenden standardmäßig `beta`
  - Stabile npm-Publishs können über Workflow-Eingabe explizit `latest` anvisieren
  - Tokenbasierte npm-dist-tag-Mutation liegt jetzt in
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo bei OIDC-only-Publish bleibt
  - Öffentliches `macOS Release` ist validierungsrein; wenn ein Tag nur auf einem
    Release-Branch existiert, der Workflow aber von `main` dispatcht wird, setzen Sie
    `public_release_branch=release/YYYY.M.D`
  - Echter privater Mac-Publish muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - Die echten Publish-Pfade promoten vorbereitete Artefakte, statt sie erneut
    neu zu bauen
- Bei stabilen Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifizierer
  außerdem denselben Temp-Prefix-Upgrade-Pfad von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem
  stabilen Basis-Payload belassen können
- npm-Release-Preflight schlägt geschlossen fehl, wenn der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Entrypoints und
  Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das
  fehlende Plugin-Laufzeit-Payloads ausliefert, schlägt im Postpublish-Verifizierer fehl und
  kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, damit Installer-E2E versehentliche Pack-Aufblähung
  vor dem Release-Publish-Pfad abfängt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder
  Extension-Testmatrizen berührt hat, regenerieren und prüfen Sie die plannerverwalteten
  `plugin-prerelease-extension-shard`-Matrix-Ausgaben aus
  `.github/workflows/plugin-prerelease.yml` vor der Freigabe, damit Release Notes kein
  veraltetes CI-Layout beschreiben
- Die Bereitschaft stabiler macOS-Releases umfasst außerdem die Updater-Oberflächen:
  - Das GitHub-Release muss am Ende die gepackte `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach dem Publish auf das neue stabile Zip zeigen; der
    private macOS-Publish-Workflow committet es automatisch oder öffnet einen Appcast-
    PR, wenn direkter Push blockiert ist
  - Die gepackte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist der Weg, mit dem Operatoren alle Pre-Release-Tests von
einem einzigen Einstiegspunkt aus starten. Für einen Nachweis eines fixierten Commits auf
einem schnelllebigen Branch verwenden Sie den Helper, damit jeder untergeordnete Workflow
von einem temporären Branch ausgeführt wird, der auf die Ziel-SHA festgelegt ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, startet `Full Release Validation`
von diesem Branch mit `ref=<sha>`, verifiziert, dass jede untergeordnete Workflow-`headSha`
mit dem Ziel übereinstimmt, und löscht anschließend den temporären Branch. Dadurch wird vermieden, versehentlich einen
neueren untergeordneten `main`-Lauf nachzuweisen.

Für die Validierung eines Release-Branchs oder -Tags führen Sie sie vom vertrauenswürdigen `main`-Workflow-
Ref aus und übergeben den Release-Branch oder -Tag als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Der Workflow löst den Ziel-Ref auf, startet manuelles `CI` mit
`target_ref=<release-ref>`, startet `OpenClaw Release Checks`, bereitet ein
übergeordnetes `release-package-under-test`-Artefakt für paketbezogene Prüfungen vor und
startet eigenständiges Paket-Telegram-E2E, wenn `release_profile=full` mit
`rerun_group=all` verwendet wird oder wenn `release_package_spec` oder
`npm_telegram_package_spec` gesetzt ist. `OpenClaw Release
Checks` fächert dann Install-Smoke, plattformübergreifende Release-Prüfungen, Live-/E2E-Docker-
Release-Pfad-Abdeckung bei aktiviertem Soak, Package Acceptance mit Telegram-
Paket-QA, QA-Lab-Parität, Live-Matrix und Live-Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die
Zusammenfassung von `Full Release Validation`
`normal_ci` und `release_checks` als erfolgreich anzeigt. Im full/all-Modus
muss auch das untergeordnete `npm_telegram` erfolgreich sein; außerhalb von full/all wird es übersprungen,
sofern kein veröffentlichtes `release_package_spec` oder `npm_telegram_package_spec`
bereitgestellt wurde. Die abschließende
Verifier-Zusammenfassung enthält Tabellen der langsamsten Jobs für jeden untergeordneten Lauf, sodass der Release-
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Stufenmatrix, exakte Workflow-Jobnamen, Unterschiede zwischen stabilem und vollständigem Profil,
Artefakte und gezielte Rerun-Handles.
Untergeordnete Workflows werden von dem vertrauenswürdigen Ref gestartet, der `Full Release
Validation` ausführt, normalerweise `--ref main`, selbst wenn der Ziel-`ref` auf einen
älteren Release-Branch oder -Tag zeigt. Es gibt keinen separaten Full-Release-Validation-
Workflow-Ref-Eingang; wählen Sie das vertrauenswürdige Harness, indem Sie den Workflow-Run-Ref wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für einen exakten Commit-Nachweis auf einem beweglichen `main`;
rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein, verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den fixierten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite Advisory-Provider-/Medienabdeckung

Verwenden Sie `run_release_soak=true` mit `stable`, wenn die release-blockierenden Lanes
grün sind und Sie vor der Promotion die umfassende Live-/E2E-, Docker-Release-Pfad- und
begrenzte veröffentlichte Upgrade-Survivor-Prüfung wünschen. Diese Prüfung deckt
die neuesten vier stabilen Pakete plus fixierte `2026.4.23`- und `2026.5.2`-
Baselines sowie ältere `2026.4.15`-Abdeckung ab, wobei doppelte Baselines entfernt und
jede Baseline in einen eigenen Docker-Runner-Job geshardet wird. `full` impliziert
`run_release_soak=true`.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den Ziel-
Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt in plattformübergreifenden,
Package-Acceptance- und Release-Pfad-Docker-Prüfungen erneut, wenn Soak läuft. Dadurch bleiben
alle paketbezogenen Boxen auf denselben Bytes und wiederholte Paket-Builds werden vermieden.
Nachdem eine Beta bereits auf npm ist, setzen Sie `release_package_spec=openclaw@YYYY.M.D-beta.N`,
damit Release-Prüfungen das ausgelieferte Paket einmal herunterladen, dessen Build-Source-
SHA aus `dist/build-info.json` extrahieren und dieses Artefakt für plattformübergreifende,
Package-Acceptance-, Release-Pfad-Docker- und Paket-Telegram-Lanes wiederverwenden.
Der plattformübergreifende OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane
Paketinstallation, Onboarding, Gateway-Start und eine Live-Agent-Runde nachweist
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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Verwenden Sie den vollständigen Umbrella nicht als ersten Rerun nach einem gezielten Fix. Wenn eine Box
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job, die Docker-Lane, das Paketprofil, den Modell-
Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella erst wieder aus, wenn
der Fix die gemeinsame Release-Orchestrierung geändert hat oder frühere All-Box-Nachweise
veraltet gemacht hat. Der abschließende Verifier des Umbrellas prüft die aufgezeichneten untergeordneten Workflow-Run-
IDs erneut; nachdem ein untergeordneter Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur das normale untergeordnete CI aus, `plugin-prerelease`
führt nur das release-spezifische untergeordnete Plugin aus, `release-checks` führt jede Release-
Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Gezielte `npm-telegram`-Reruns erfordern `release_package_spec` oder
`npm_telegram_package_spec`; full/all-Läufe mit `release_profile=full` verwenden das
Paketartefakt der Release-Prüfungen. Gezielte
plattformübergreifende Reruns können `cross_os_suite_filter=windows/packaged-upgrade` oder
einen anderen OS-/Suite-Filter hinzufügen. QA-Release-Check-Fehlschläge sind advisory; ein reiner QA-
Fehlschlag blockiert die Release-Validierung nicht.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete `CI`-Workflow. Manuelles CI umgeht absichtlich
Changed-Scoping und erzwingt den normalen Testgraphen für den Release
Candidate: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Source Tree die vollständige normale Testsuite bestanden?“
Sie ist nicht dasselbe wie Release-Pfad-Produktvalidierung. Aufzubewahrende Nachweise:

- `Full Release Validation`-Zusammenfassung mit der URL des gestarteten `CI`-Laufs
- grüner `CI`-Lauf auf der exakten Ziel-SHA
- fehlgeschlagene oder langsame Shard-Namen aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Lauf eine Performance-Analyse benötigt

Führen Sie manuelles CI nur direkt aus, wenn das Release deterministisches normales CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, plattformübergreifenden oder Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-
Workflow `install-smoke`. Sie validiert den Release Candidate über paketierte
Docker-Umgebungen statt nur über Tests auf Source-Ebene.

Die Release-Docker-Abdeckung umfasst:

- vollständiger Install-Smoke mit aktiviertem langsamem globalem Bun-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, mit QR-,
  Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate Install-Smoke-
  Shards
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
- Live-/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Prüfungen
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für gezielte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow statt
alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten vorherige
`package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, sofern verfügbar, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest und Docker-
Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Parity-Lane, die die OpenAI-Candidate-Lane mit der Opus-4.6-
  Baseline mithilfe des agentischen Parity-Packs vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Parity-, Matrix- und Telegram-
Lanes auf, wenn Sie das Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller geshardeter QA-Lab-Lauf verfügbar statt als standardmäßige release-kritische Lane.

### Package

Die Package-Box ist das Gate für das installierbare Produkt. Sie wird durch
`Package Acceptance` und den Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen
Candidate in den `package-under-test`-Tarball, der von Docker E2E verwendet wird, validiert
das Paketinventar, zeichnet die Paketversion und SHA-256 auf und hält den
Workflow-Harness-Ref vom Package-Source-Ref getrennt.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständige Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness packen
- `source=url`: eine HTTPS-`.tgz` mit erforderlichem `package_sha256` herunterladen
- `source=artifact`: eine von einem anderen GitHub-Actions-Lauf hochgeladene `.tgz` wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paketartefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update,
Neustart eines konfigurierten Auth-Updates, Live-Installation von ClawHub-Skills, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-
Fixtures, Plugin-Update und Telegram-Paket-QA gegen denselben aufgelösten
Tarball. Blockierende Release-Prüfungen verwenden die standardmäßige Baseline
des neuesten veröffentlichten Pakets; `run_release_soak=true` oder
`release_profile=full` erweitert dies auf jede stabile, in npm veröffentlichte
Baseline von `2026.4.23` bis `latest` plus Fixtures zu gemeldeten Issues.
Verwenden Sie Package Acceptance mit `source=npm` für einen bereits
ausgelieferten Kandidaten oder `source=ref`/`source=artifact` für einen
SHA-gestützten lokalen npm-Tarball vor der Veröffentlichung. Es ist der
GitHub-native Ersatz für den Großteil der Paket-/Update-Abdeckung, die zuvor
Parallels erforderte. Release-Prüfungen über mehrere Betriebssysteme hinweg
bleiben für betriebssystemspezifisches Onboarding, Installer und
Plattformverhalten wichtig, aber die Produktvalidierung für Pakete/Updates
sollte Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie,
wenn Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder
Release-Check-Lane eine Plugin-Installation/ein Plugin-Update, eine
Doctor-Bereinigung oder eine Migrationsänderung eines veröffentlichten Pakets
belegt. Eine vollständige veröffentlichte Update-Migration aus jedem stabilen
`2026.4.23+`-Paket ist ein separater manueller `Update Migration`-Workflow und
nicht Teil von Full Release CI.

Die Nachsicht der Legacy-Package-Acceptance ist bewusst zeitlich begrenzt.
Pakete bis einschließlich `2026.4.25` dürfen den Kompatibilitätspfad für
Metadatenlücken verwenden, die bereits in npm veröffentlicht wurden: private
QA-Inventareinträge, die im Tarball fehlen, fehlendes `gateway install --wrapper`,
fehlende Patch-Dateien in der aus dem Tarball abgeleiteten Git-Fixture,
fehlendes persistiertes `update.channel`, Legacy-Speicherorte für
Plugin-Installationsdatensätze, fehlende Persistenz von Marketplace-
Installationsdatensätzen und Konfigurationsmetadatenmigration während
`plugins update`. Das veröffentlichte Paket `2026.4.26` darf für bereits
ausgelieferte lokale Build-Metadaten-Stempeldateien warnen. Spätere Pakete
müssen die modernen Paketverträge erfüllen; dieselben Lücken lassen die
Release-Validierung fehlschlagen.

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

- `smoke`: schnelle Lanes für Paketinstallation/Kanal/Agent, Gateway-Netzwerk
  und erneutes Laden der Konfiguration
- `package`: Verträge für Installations-/Update-/Neustart-/Plugin-Paket plus
  Live-Nachweis der ClawHub-Skill-Installation; dies ist der Standard für
  Release-Prüfungen
- `product`: `package` plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Wiederholungen

Für Telegram-Nachweise von Paketkandidaten aktivieren Sie
`telegram_mode=mock-openai` oder `telegram_mode=live-frontier` in Package
Acceptance. Der Workflow übergibt den aufgelösten `package-under-test`-Tarball
an die Telegram-Lane; der eigenständige Telegram-Workflow akzeptiert weiterhin
eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Release-Veröffentlichungsautomatisierung

`OpenClaw Release Publish` ist der normale mutierende Einstiegspunkt für
Veröffentlichungen. Er orchestriert die Trusted-Publisher-Workflows in der
Reihenfolge, die das Release benötigt:

1. Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Prüfen, dass der Tag von `main` oder `release/*` erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und derselben SHA auslösen.
6. `OpenClaw NPM Release` mit Release-Tag, npm-Dist-Tag und gespeichertem
   `preflight_run_id` auslösen.

Beispiel für eine Beta-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Veröffentlichung in den standardmäßigen Beta-Dist-Tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Promotion direkt nach `latest` ist ausdrücklich:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Verwenden Sie die niedrigeren Workflows `Plugin NPM Release` und
`Plugin ClawHub Release` nur für fokussierte Reparatur- oder
Neu-Veröffentlichungsarbeiten. Für eine ausgewählte Plugin-Reparatur übergeben
Sie `plugin_publish_scope=selected` und `plugins=@openclaw/name` an
`OpenClaw Release Publish` oder lösen den untergeordneten Workflow direkt aus,
wenn das OpenClaw-Paket nicht veröffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf dies auch die aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches für einen
  nur validierenden Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der
  Workflow den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf
  wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Publish` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Lauf-ID;
  erforderlich, wenn `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: Standard ist `all-publishable`; verwenden Sie
  `selected` nur für fokussierte Reparaturarbeiten
- `plugins`: durch Kommas getrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: Standard ist `true`; setzen Sie dies nur auf `false`,
  wenn Sie den Workflow als reinen Plugin-Reparatur-Orchestrator verwenden
- `wait_for_clawhub`: Standard ist `false`, damit die npm-Verfügbarkeit nicht
  durch den ClawHub-Sidecar blockiert wird; setzen Sie dies nur auf `true`, wenn
  der Workflow-Abschluss den ClawHub-Abschluss einschließen muss

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA zur Validierung. Prüfungen
  mit Secrets erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch
  oder Release-Tag erreichbar ist.
- `run_release_soak`: entscheidet sich für vollständige Live-/E2E-, Docker-
  Release-Pfad- und All-Since-Upgrade-Survivor-Soak-Tests bei stabilen/
  Standard-Release-Prüfungen. Wird durch `release_profile=full` erzwungen.

Regeln:

- Stabile Tags und Korrektur-Tags dürfen entweder nach `beta` oder `latest`
  veröffentlicht werden
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlicht werden
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur
  erlaubt, wenn `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` sind immer nur
  Validierung
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der
  während des Preflights verwendet wurde; der Workflow prüft diese Metadaten,
  bevor die Veröffentlichung fortgesetzt wird

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release erstellen:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, dürfen Sie die aktuelle vollständige Commit-SHA
     des Workflow-Branches für einen nur validierenden Probelauf des
     Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-First-Ablauf oder
   `latest` nur, wenn Sie bewusst eine direkte stabile Veröffentlichung möchten
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder
   der vollständigen Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache,
   Docker, QA Lab, Matrix und Telegram-Abdeckung aus einem manuellen Workflow
   möchten
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen,
   führen Sie stattdessen den manuellen `CI`-Workflow auf der Release-Ref aus
5. Speichern Sie den erfolgreichen `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben
   `npm_dist_tag` und dem gespeicherten `preflight_run_id` aus; es veröffentlicht
   externalisierte Plugins in npm und ClawHub, bevor das OpenClaw-npm-Paket
   promoted wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`-
   Workflow, um diese stabile Version von `beta` nach `latest` zu promoten
8. Wenn das Release bewusst direkt nach `latest` veröffentlicht wurde und
   `beta` sofort demselben stabilen Build folgen soll, verwenden Sie denselben
   privaten Workflow, um beide Dist-Tags auf die stabile Version zeigen zu
   lassen, oder lassen Sie die geplante Selbstheilungs-Synchronisierung `beta`
   später verschieben

Die Dist-Tag-Mutation befindet sich aus Sicherheitsgründen im privaten Repo,
weil sie weiterhin `NPM_TOKEN` benötigt, während das öffentliche Repo
ausschließlich OIDC-Veröffentlichung beibehält.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der
Beta-First-Promotion-Pfad dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen
Sie alle 1Password-CLI-(`op`-)Befehle nur innerhalb einer dedizierten
tmux-Sitzung aus. Rufen Sie `op` nicht direkt aus der Haupt-Agent-Shell auf;
wenn es in tmux bleibt, sind Prompts, Warnungen und OTP-Handhabung beobachtbar,
und wiederholte Host-Warnungen werden verhindert.

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
