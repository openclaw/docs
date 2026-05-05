---
read_when:
    - Suche nach Definitionen öffentlicher Release-Kanäle
    - Release-Validierung oder Paketakzeptanz ausführen
    - Suchen Sie Informationen zur Versionsbenennung und zum Veröffentlichungsrhythmus
summary: Release-Lanes, Betreiber-Checkliste, Validierungsboxen, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-05T06:18:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen, oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Kopf von `main`

## Versionsbenennung

- Stabile Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stabile Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führender Null schreiben
- `latest` bedeutet das aktuell promotete stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können ausdrücklich `latest` anvisieren oder später einen geprüften Beta-Build promoten
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  Build, Signierung und Notarisierung der Mac-App für stabile Releases reserviert bleiben, sofern sie nicht ausdrücklich angefordert werden

## Release-Taktung

- Releases laufen zuerst über Beta
- Stabil folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise von einem `release/YYYY.M.D`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Fehlerbehebungen neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und eine Korrektur benötigt, schneiden Maintainer
  das nächste `-beta.N`-Tag, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, Wiederherstellung von Dist-Tags und Details für Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neueste Änderungen pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle CI von `main` ausreichend grün ist, um davon zu branchen.
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
5. Jede erforderliche Versionsstelle für das vorgesehene Tag anheben,
   `pnpm plugins:sync` ausführen, damit veröffentlichbare Plugin-Pakete die Release-Version
   und Kompatibilitätsmetadaten teilen, anschließend die lokale deterministische Vorabprüfung ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` und
   `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branches für eine reine
   Validierungs-Vorabprüfung zulässig. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA starten. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch korrigieren und die kleinste fehlgeschlagene
   Datei, den kleinsten fehlgeschlagenen Kanal, Workflow-Job, Paket-Profile, Provider oder die kleinste Model-Allowlist erneut ausführen, die
   die Korrektur belegt. Den vollständigen Sammellauf nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veraltet macht.
9. Für Beta `vYYYY.M.D-beta.N` taggen und anschließend `OpenClaw Release Publish` aus dem
   passenden `release/YYYY.M.D`-Branch ausführen. Es verifiziert `pnpm plugins:sync:check`,
   veröffentlicht zuerst alle veröffentlichbaren Plugin-Pakete auf npm, veröffentlicht dieselbe
   Menge anschließend auf ClawHub als ClawPack-npm-pack-Tarballs und promotet dann das
   vorbereitete OpenClaw-npm-Vorabprüfungsartefakt mit dem passenden Dist-Tag. Nach der
   Veröffentlichung die Paketabnahme nach der Veröffentlichung gegen das veröffentlichte Paket
   `openclaw@YYYY.M.D-beta.N` oder
   `openclaw@beta` ausführen. Wenn ein gepushter oder veröffentlichter Prerelease eine Korrektur benötigt,
   die nächste passende Prerelease-Nummer schneiden; den alten
   Prerelease nicht löschen oder umschreiben.
10. Für stabil erst fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die stabile npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Vorabprüfungsartefakt über
    `preflight_run_id` wieder; die Bereitschaft für ein stabiles macOS-Release erfordert außerdem die
    gepackten Dateien `.zip`, `.dmg`, `.dSYM.zip` und eine aktualisierte `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Prüfer nach der Veröffentlichung ausführen, optional die eigenständige
    Telegram-E2E mit veröffentlichtem npm, wenn Sie einen Kanalnachweis nach der Veröffentlichung benötigen,
    Dist-Tag-Promotion bei Bedarf, GitHub-Release-/Prerelease-Hinweise aus dem
    vollständigen passenden Abschnitt in `CHANGELOG.md` sowie die Schritte zur Release-Ankündigung.

## Release-Vorabprüfung

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren Prüfungen auf Importzyklen
  und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm plugins:sync` nach dem Versionssprung im Root und vor dem Tagging aus. Es
  aktualisiert die Versionen veröffentlichbarer Plugin-Pakete, die OpenClaw-Peer/API-Kompatibilitäts-
  Metadaten, Build-Metadaten und Plugin-Changelog-Stubs passend zur Core-
  Release-Version. `pnpm plugins:sync:check` ist der nicht verändernde Release-Guard;
  der Publish-Workflow schlägt vor jeder Registry-Mutation fehl, wenn dieser Schritt
  vergessen wurde.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um
  alle Pre-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, dispatcht manuelles `CI` und dispatcht
  `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-
  Paketprüfungen, QA-Lab-Parität, Matrix und Telegram-Lanes. Stabile/Standardläufe
  halten exhaustive Live/E2E- und Docker-Release-Pfad-Soak hinter
  `run_release_soak=true`; `release_profile=full` erzwingt Soak. Mit
  `release_profile=full` und `rerun_group=all` wird auch Package-Telegram-
  E2E gegen das Artefakt `release-package-under-test` aus den Release-Checks ausgeführt.
  Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dasselbe
  Telegram-E2E auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie
  `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance
  seine Paket-/Update-Matrix gegen das ausgelieferte npm-Paket statt
  gegen das aus dem SHA gebaute Artefakt ausführen soll. Geben Sie
  `evidence_package_spec` an, wenn der private Evidence-Report nachweisen soll, dass die
  Validierung einem veröffentlichten npm-Paket entspricht, ohne Telegram-E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweise
  für einen Paketkandidaten möchten, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen `package_ref`-Branch/Tag/SHA mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem
  SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-
  Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram-QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die
  ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt
  der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus.
  `update-restart-auth` verwendet das Kandidatenpaket sowohl als installierte CLI
  als auch als package-under-test, sodass es den Managed-Restart-Pfad des
  Kandidaten-Update-Befehls ausübt.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Install-/Channel-/Agent-, Gateway-Netzwerk- und Config-Reload-Lanes
  - `package`: paketnative Artefakt-/Update-/Restart-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Package-Profil plus MCP-Channels, Cron/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten Wiederholungslauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur vollständige normale CI-
  Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen das Changed-
  Scoping und erzwingen die Linux-Node-Shards, Bundled-Plugin-Shards, Channel-
  Contracts, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke,
  Docs-Checks, Python-Skills, Windows, macOS, Android und Control-UI-i18n-
  Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt
  QA-Lab über einen lokalen OTLP/HTTP-Receiver aus und verifiziert die exportierten Trace-
  Span-Namen, begrenzten Attribute und die Schwärzung von Inhalten/Bezeichnern, ohne
  Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die verändernde Publish-Sequenz aus, nachdem der
  Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` (oder `main`, wenn ein
  von main erreichbarer Tag veröffentlicht wird), übergeben Sie den Release-Tag und die erfolgreiche OpenClaw-npm-
  `preflight_run_id`, und behalten Sie den standardmäßigen Plugin-Publish-Scope
  `all-publishable` bei, sofern Sie nicht bewusst eine fokussierte Reparatur ausführen. Der
  Workflow serialisiert Plugin-npm-Publish, Plugin-ClawHub-Publish und OpenClaw-
  npm-Publish, sodass das Core-Paket nicht vor seinen externalisierten
  Plugins veröffentlicht wird.
- Release-Checks laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem die QA-Lab-Mock-Paritäts-Lane plus das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane vor der Release-Freigabe aus. Die Live-
  Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-
  Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständiges Matrix-
  Transport-, Medien- und E2EE-Inventar parallel möchten.
- Cross-OS-Installations- und Upgrade-Runtime-Validierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Checks in ihrer
  eigenen Lane bleiben, damit sie Publish nicht verzögern oder blockieren
- Secret-tragende Release-Checks sollten über `Full Release
Validation` oder vom `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- `OpenClaw NPM Release`-Validierungs-Preflight akzeptiert außerdem den aktuellen
  vollständigen 40-Zeichen-Workflow-Branch-Commit-SHA, ohne einen gepushten Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in einen echten Publish
  befördert werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; echter Publish erfordert weiterhin einen echten Release-Tag
- Beide Workflows halten den echten Publish- und Promotion-Pfad auf GitHub-gehosteten
  Runnern, während der nicht verändernde Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- npm-Release-Preflight wartet nicht mehr auf die separate Release-Checks-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder den passenden Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach npm-Publish
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrektur-Version) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Prefix zu verifizieren
- Führen Sie nach einem Beta-Publish `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Installed-Package-Onboarding, Telegram-Setup und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Credential-
  Pool zu verifizieren. Lokale Maintainer-Einmalläufe können die Convex-Variablen weglassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einer Maintainer-Maschine aus auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, dispatcht `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Report aus.
- Maintainer können dieselbe Post-Publish-Prüfung über GitHub Actions mit dem
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist absichtlich nur manuell und
  läuft nicht bei jedem Merge.
- Maintainer-Release-Automation verwendet jetzt Preflight-dann-Promote:
  - echter npm-Publish muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - der echte npm-Publish muss von demselben `main`- oder
    `release/YYYY.M.D`-Branch dispatcht werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabiler npm-Publish kann explizit über Workflow-Input `latest` ansteuern
  - tokenbasierte npm-dist-tag-Mutation lebt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, da `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo OIDC-only-Publish beibehält
  - öffentlicher `macOS Release` ist nur Validierung; wenn ein Tag nur auf einem
    Release-Branch lebt, der Workflow aber von `main` dispatcht wird, setzen Sie
    `public_release_branch=release/YYYY.M.D`
  - echter privater Mac-Publish muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Publish-Pfade promoten vorbereitete Artefakte, statt sie erneut
    zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier
  außerdem denselben temporären Prefix-Upgrade-Pfad von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen ältere globale Installationen nicht stillschweigend auf der
  stabilen Basis-Payload belassen können
- npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Entrypoints und
  Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das
  fehlende Plugin-Runtime-Payloads ausliefert, lässt den Postpublish-Verifier fehlschlagen und
  kann nicht zu `latest` promoted werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliches Pack-Bloat
  vor dem Release-Publish-Pfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder
  Extension-Testmatrizen berührt hat, regenerieren und prüfen Sie die planner-owned
  `plugin-prerelease-extension-shard`-Matrix-Ausgaben aus
  `.github/workflows/plugin-prerelease.yml` vor der Freigabe, damit Release Notes
  kein veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die gepackten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach dem Publish auf die neue stabile ZIP-Datei zeigen
  - die gepackte App muss eine nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder oberhalb des kanonischen Sparkle-Build-Floors
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist der Weg, mit dem Operatoren alle Pre-Release-Tests von
einem Einstiegspunkt starten. Für einen gepinnten Commit-Nachweis auf einem schnelllebigen Branch verwenden Sie den
Helper, damit jeder Child-Workflow von einem temporären Branch ausgeführt wird, der auf den Ziel-
SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
von diesem Branch mit `ref=<sha>`, verifiziert, dass jeder Child-Workflow-`headSha`
dem Ziel entspricht, und löscht anschließend den temporären Branch. So wird vermieden, versehentlich einen
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

Der Workflow löst den Ziel-Ref auf, dispatcht manuelles `CI` mit
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks`, bereitet ein
übergeordnetes `release-package-under-test`-Artefakt für paketbezogene Prüfungen
vor und dispatcht eigenständiges Paket-Telegram-E2E, wenn `release_profile=full`
mit `rerun_group=all` verwendet wird oder wenn `npm_telegram_package_spec`
gesetzt ist. `OpenClaw Release Checks` fächert dann in Installations-Smoke,
Cross-OS-Release-Prüfungen, Live/E2E-Docker-Abdeckung für den Release-Pfad bei
aktiviertem Soak, Package Acceptance mit Telegram-Paket-QA, QA-Lab-Parität,
Live-Matrix und Live-Telegram auf. Ein vollständiger Lauf ist nur akzeptabel,
wenn die Zusammenfassung von `Full Release Validation` `normal_ci` und
`release_checks` als erfolgreich ausweist. Im Full/All-Modus muss auch das
`npm_telegram`-Child erfolgreich sein; außerhalb von Full/All wird es
übersprungen, sofern kein veröffentlichtes `npm_telegram_package_spec`
angegeben wurde. Die abschließende Verifier-Zusammenfassung enthält Tabellen
der langsamsten Jobs für jeden Child-Lauf, sodass der Release-Manager den
aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation)
für die vollständige Stufenmatrix, exakte Workflow-Jobnamen, Unterschiede
zwischen Stable- und Full-Profil, Artefakte und gezielte Rerun-Handles.
Child-Workflows werden vom vertrauenswürdigen Ref dispatcht, der `Full Release
Validation` ausführt, normalerweise `--ref main`, auch wenn der Ziel-`ref` auf
einen älteren Release-Branch oder Tag zeigt. Es gibt keinen separaten
Workflow-Ref-Eingang für Full Release Validation; wählen Sie den
vertrauenswürdigen Harness, indem Sie den Ref des Workflow-Laufs wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für exakte Commit-Nachweise auf
einem beweglichen `main`; rohe Commit-SHAs können keine Workflow-Dispatch-Refs
sein. Verwenden Sie daher `pnpm ci:full-release --sha <sha>`, um den
angehefteten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite abdeckende Provider/Medien-Abdeckung

Verwenden Sie `run_release_soak=true` mit `stable`, wenn die
release-blockierenden Lanes grün sind und Sie vor der Promotion den
erschöpfenden Live/E2E-, Docker-Release-Pfad- und begrenzten veröffentlichten
Upgrade-Survivor-Sweep wünschen. Dieser Sweep deckt die neuesten vier Stable
Packages plus die angehefteten Baselines `2026.4.23` und `2026.5.2` sowie ältere
`2026.4.15`-Abdeckung ab, wobei doppelte Baselines entfernt werden und jede
Baseline in einen eigenen Docker-Runner-Job geshardet wird. `full` impliziert
`run_release_soak=true`.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den
Ziel-Ref einmal als `release-package-under-test` aufzulösen, und verwendet
dieses Artefakt in Cross-OS-, Package-Acceptance- und Release-Pfad-Docker-
Prüfungen wieder, wenn Soak läuft. Dadurch bleiben alle paketbezogenen Boxen
auf denselben Bytes, und wiederholte Paket-Builds werden vermieden. Der
Cross-OS-OpenAI-Installations-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`,
wenn die Repo/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil
diese Lane Paketinstallation, Onboarding, Gateway-Start und eine Live-Agent-
Runde nachweist, statt das langsamste Standardmodell zu benchmarken. Die
breitere Live-Provider-Matrix bleibt der Ort für modellspezifische Abdeckung.

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

Verwenden Sie den vollständigen Umbrella nicht als ersten Rerun nach einem
gezielten Fix. Wenn eine Box fehlschlägt, verwenden Sie für den nächsten
Nachweis den fehlgeschlagenen Child-Workflow, Job, die Docker-Lane, das
Paketprofil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen
Umbrella erst wieder aus, wenn der Fix die gemeinsame Release-Orchestrierung
geändert hat oder frühere All-Box-Nachweise veraltet sind. Der abschließende
Verifier des Umbrella prüft die aufgezeichneten Child-Workflow-Run-IDs erneut.
Nachdem ein Child-Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher
nur den fehlgeschlagenen übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella.
`all` ist der echte Release-Candidate-Lauf, `ci` führt nur das normale CI-Child
aus, `plugin-prerelease` führt nur das release-spezifische Plugin-Child aus,
`release-checks` führt jede Release-Box aus, und die engeren Release-Gruppen
sind `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`,
`qa-live` und `npm-telegram`. Gezielte `npm-telegram`-Reruns erfordern
`npm_telegram_package_spec`; Full/All-Läufe mit `release_profile=full`
verwenden das Paketartefakt der Release-Prüfungen. Gezielte Cross-OS-Reruns
können `cross_os_suite_filter=windows/packaged-upgrade` oder einen anderen
OS/Suite-Filter hinzufügen. QA-Release-Check-Fehler sind beratend; ein reiner
QA-Fehler blockiert die Release-Validierung nicht.

### Vitest

Die Vitest-Box ist der manuelle `CI`-Child-Workflow. Manuelles CI umgeht
absichtlich Changed-Scoping und erzwingt den normalen Testgraphen für den
Release Candidate: Linux-Node-Shards, gebündelte Plugin-Shards,
Channel-Contracts, Node-22-Kompatibilität, `check`, `check-additional`,
Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control
UI i18n.

Verwenden Sie diese Box, um die Frage zu beantworten: „Hat der Source Tree die
vollständige normale Testsuite bestanden?“ Sie ist nicht dasselbe wie
Produktvalidierung des Release-Pfads. Aufzubewahrende Nachweise:

- Zusammenfassung von `Full Release Validation` mit der URL des dispatchten `CI`-Laufs
- grüner `CI`-Lauf auf der exakten Ziel-SHA
- fehlgeschlagene oder langsame Shard-Namen aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn ein Lauf Performance-Analyse benötigt

Führen Sie manuelles CI nur dann direkt aus, wenn das Release deterministisches
normales CI benötigt, aber nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder
Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box lebt in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-
`install-smoke`-Workflow. Sie validiert den Release Candidate über paketierte
Docker-Umgebungen statt nur über Source-Level-Tests.

Release-Docker-Abdeckung umfasst:

- vollständigen Installations-Smoke mit aktiviertem langsamem globalem Bun-Installations-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-, Root/Gateway- und Installer/Bun-Smoke-Jobs als separate Install-Smoke-Shards laufen
- Repository-E2E-Lanes
- Release-Pfad-Docker-Chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` und `plugins-runtime-install-h`
- OpenWebUI-Abdeckung innerhalb des Chunks `plugins-runtime-services`, wenn angefordert
- aufgeteilte Lanes für Installation/Deinstallation gebündelter Plugins `bundled-plugin-install-uninstall-0` bis `bundled-plugin-install-uninstall-23`
- Live/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Prüfungen Live-Suites einschließen

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für gezielte
Wiederherstellung verwenden Sie `docker_lanes=<lane[,lane]>` im
wiederverwendbaren Live/E2E-Workflow, statt alle Release-Chunks erneut
auszuführen. Generierte Rerun-Befehle enthalten frühere
`package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, sofern
verfügbar, sodass eine fehlgeschlagene Lane denselben Tarball und dieselben
GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das
agentische Behavior- und Channel-Level-Release-Gate, getrennt von Vitest- und
Docker-Paketmechanik.

Release-QA-Lab-Abdeckung umfasst:

- Mock-Parity-Lane, die die OpenAI-Kandidaten-Lane mit der Opus-4.6-Baseline mithilfe des Agentic-Parity-Packs vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um die Frage zu beantworten: „Verhält sich das Release
in QA-Szenarien und Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs
für Parity-, Matrix- und Telegram-Lanes auf, wenn Sie das Release freigeben.
Vollständige Matrix-Abdeckung bleibt als manueller geshardeter QA-Lab-Lauf
verfügbar, statt die standardmäßige release-kritische Lane zu sein.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird von
`Package Acceptance` und dem Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver
normalisiert einen Kandidaten in den `package-under-test`-Tarball, der von
Docker-E2E verbraucht wird, validiert das Paketinventar, zeichnet die
Paketversion und SHA-256 auf und hält den Workflow-Harness-Ref vom
Paket-Source-Ref getrennt.

Unterstützte Kandidatenquellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version
- `source=ref`: einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständigen Commit-SHA mit dem ausgewählten `workflow_ref`-Harness packen
- `source=url`: ein HTTPS-`.tgz` mit erforderlichem `package_sha256` herunterladen
- `source=artifact`: ein `.tgz` wiederverwenden, das von einem anderen GitHub-Actions-Lauf hochgeladen wurde

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paketartefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`
und `telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update,
konfigurierten Auth-Update-Neustart, Bereinigung veralteter
Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Update und
Telegram-Paket-QA gegen denselben aufgelösten Tarball. Blockierende
Release-Prüfungen verwenden die standardmäßige neueste veröffentlichte
Paket-Baseline; `run_release_soak=true` oder `release_profile=full` erweitert
auf jede stabile npm-veröffentlichte Baseline von `2026.4.23` bis `latest` plus
Fixtures für gemeldete Issues. Verwenden Sie Package Acceptance mit
`source=npm` für einen bereits ausgelieferten Kandidaten oder `source=ref`/
`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der
Veröffentlichung. Es ist der GitHub-native Ersatz für den Großteil der
Paket/Update-Abdeckung, die zuvor Parallels erforderte. Cross-OS-Release-
Prüfungen bleiben für OS-spezifisches Onboarding, Installer und
Plattformverhalten wichtig, aber Paket/Update-Produktvalidierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie,
wenn Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder
Release-Check-Lane eine Plugin-Installation/ein Plugin-Update,
Doctor-Bereinigung oder eine Migrationsänderung veröffentlichter Pakete
nachweist. Erschöpfende veröffentlichte Update-Migration von jedem stabilen
`2026.4.23+`-Paket ist ein separater manueller `Update Migration`-Workflow, kein
Teil von Full Release CI.

Die Nachsicht bei der Legacy-Package-Acceptance ist bewusst zeitlich begrenzt. Packages bis einschließlich
`2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits
auf npm veröffentlicht wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture,
fehlendes persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze,
fehlende Persistenz von Marketplace-Installationsdatensätzen und Migration von Konfigurationsmetadaten
während `plugins update`. Das veröffentlichte Package `2026.4.26` darf für lokale
Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Packages
müssen die modernen Package-Verträge erfüllen; dieselben Lücken lassen die Release-Validierung
fehlschlagen.

Verwenden Sie breitere Package-Acceptance-Profile, wenn sich die Release-Frage auf ein
tatsächlich installierbares Package bezieht:

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

- `smoke`: schnelle Package-Installations-, Kanal-, Agent-, Gateway-Netzwerk- und
  Konfigurations-Neulade-Lanes
- `package`: Installations-, Update-, Neustart- und Plugin-Package-Verträge ohne live
  ClawHub; dies ist der Standard für Release-Prüfungen
- `product`: `package` plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Abschnitte mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Wiederholungen

Für den Telegram-Nachweis eines Package-Kandidaten aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den
aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Release-Veröffentlichungsautomatisierung

`OpenClaw Release Publish` ist der normale mutierende Einstiegspunkt für Veröffentlichungen. Er
orchestriert die Trusted-Publisher-Workflows in der Reihenfolge, die das Release benötigt:

1. Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Prüfen, ob der Tag von `main` oder `release/*` erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und derselben SHA auslösen.
6. `OpenClaw NPM Release` mit dem Release-Tag, npm-Dist-Tag und
   gespeichertem `preflight_run_id` auslösen.

Beispiel für Beta-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Veröffentlichung auf den standardmäßigen Beta-Dist-Tag:

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
OpenClaw-Package nicht veröffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf dies auch die aktuelle
  vollständige 40-Zeichen-Commit-SHA des Workflow-Branches für einen reinen Validierungs-Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Package, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Publish` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Lauf-ID;
  erforderlich, wenn `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Package
- `plugin_publish_scope`: Standard ist `all-publishable`; verwenden Sie `selected` nur
  für fokussierte Reparaturarbeiten
- `plugins`: kommagetrennte `@openclaw/*`-Package-Namen, wenn
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: Standard ist `true`; setzen Sie dies nur dann auf `false`, wenn Sie den
  Workflow als reinen Plugin-Reparatur-Orchestrator verwenden

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA, die validiert werden soll. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.
- `run_release_soak`: aktiviert umfassende Live-/E2E-, Docker-Release-Pfad- und
  All-since-Upgrade-Survivor-Soaks für stabile/Standard-Release-Prüfungen. Dies wird
  durch `release_profile=full` erzwungen.

Regeln:

- Stabile Tags und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur zulässig, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer
  ausschließlich der Validierung
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflight verwendet wurde;
  der Workflow prüft diese Metadaten vor der Veröffentlichung erneut

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release erstellen:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, dürfen Sie die aktuelle vollständige Commit-SHA des Workflow-Branches
     für einen reinen Validierungs-Trockenlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur,
   wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache-, Docker-, QA-Lab-,
   Matrix- und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Referenz aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`
   und der gespeicherten `preflight_run_id` aus; dies veröffentlicht externalisierte Plugins auf npm
   und ClawHub, bevor das OpenClaw-npm-Package promotet wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   Workflow, um diese stabile Version von `beta` auf `latest` zu promoten
8. Wenn das Release bewusst direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie dessen geplante
   Selbstheilungs-Synchronisierung `beta` später verschieben

Die Dist-Tag-Mutation liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repo ausschließlich OIDC-basierte Veröffentlichungen nutzt.

Damit bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Promotion-Pfad
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückfallen muss, führen Sie alle 1Password-
CLI-(`op`)-Befehle nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Agent-Shell auf; innerhalb von tmux bleiben Prompts,
Warnungen und OTP-Behandlung beobachtbar und wiederholte Host-Warnungen werden verhindert.

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

## Verwandte Themen

- [Release-Kanäle](/de/install/development-channels)
