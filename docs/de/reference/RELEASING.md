---
read_when:
    - Suche nach Definitionen für öffentliche Veröffentlichungskanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suchen nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Betreiber-Checkliste, Validierungsboxen, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-05T01:48:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen, oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Stand von `main`

## Versionsbenennung

- Stabile Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stabile Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bezeichnet das aktuell promotete stabile npm-Release
- `beta` bezeichnet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können ausdrücklich `latest` als Ziel wählen oder später einen geprüften Beta-Build promoten
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paket-Pfad, wobei
  Build/Signieren/Notarisieren der macOS-App stabilen Releases vorbehalten bleibt, sofern nicht ausdrücklich angefordert

## Release-Takt

- Releases laufen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise aus einem Branch `release/YYYY.M.D`, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, erstellen Maintainer
  das nächste `-beta.N`-Tag, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detailliertes Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste ist die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, dist-tag-Wiederherstellung und Details zum Notfall-Rollback bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Starten Sie vom aktuellen `main`: neuesten Stand pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle `main`-CI ausreichend grün ist, um davon zu branchen.
2. Schreiben Sie den obersten Abschnitt von `CHANGELOG.md` aus der echten Commit-Historie mit
   `/changelog` neu, halten Sie Einträge nutzerorientiert, committen und pushen Sie ihn, und rebasen/pullen
   Sie vor dem Branching noch einmal.
3. Prüfen Sie Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts`. Entfernen Sie abgelaufene
   Kompatibilität nur, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren Sie, warum sie
   bewusst beibehalten wird.
4. Erstellen Sie `release/YYYY.M.D` aus dem aktuellen `main`; führen Sie normale Release-Arbeiten nicht
   direkt auf `main` durch.
5. Erhöhen Sie jede erforderliche Versionsstelle für das vorgesehene Tag, führen Sie
   `pnpm plugins:sync` aus, damit veröffentlichbare Plugin-Pakete die Release-Version
   und Kompatibilitätsmetadaten teilen, und führen Sie anschließend den lokalen deterministischen Preflight aus:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` und
   `pnpm release:check`.
6. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branchs für einen reinen Validierungs-Preflight zulässig.
   Speichern Sie die erfolgreiche `preflight_run_id`.
7. Starten Sie alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA. Dies ist der einzige manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, beheben Sie das Problem im Release-Branch und führen Sie die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, Provider- oder Modell-Allowlist erneut aus, die
   den Fix nachweist. Führen Sie das vollständige Umbrella nur erneut aus, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Beta taggen Sie `vYYYY.M.D-beta.N` und führen dann `OpenClaw Release Publish` aus
   dem passenden Branch `release/YYYY.M.D` aus. Es verifiziert `pnpm plugins:sync:check`,
   veröffentlicht zuerst alle veröffentlichbaren Plugin-Pakete auf npm, veröffentlicht denselben
   Satz anschließend als ClawPack npm-pack-Tarballs auf ClawHub und promotet dann das
   vorbereitete OpenClaw-npm-Preflight-Artefakt mit dem passenden dist-tag. Führen Sie nach
   der Veröffentlichung die Package-Acceptance nach dem Publish gegen das veröffentlichte
   Paket `openclaw@YYYY.M.D-beta.N` oder `openclaw@beta` aus. Wenn ein gepushter oder veröffentlichter
   Prerelease einen Fix benötigt, erstellen Sie die nächste passende Prerelease-Nummer; löschen oder überschreiben Sie den alten
   Prerelease nicht.
10. Für Stable fahren Sie erst fort, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die stabile npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` wieder; die Release-Bereitschaft für stabiles macOS erfordert außerdem die
    gepackten `.zip`, `.dmg`, `.dSYM.zip` und eine aktualisierte `appcast.xml` auf `main`.
11. Führen Sie nach der Veröffentlichung den npm-Post-Publish-Verifier aus, optional das eigenständige
    veröffentlichte-npm-Telegram-E2E, wenn Sie einen Nachweis für den Kanal nach der Veröffentlichung benötigen,
    dist-tag-Promotion bei Bedarf, GitHub-Release-/Prerelease-Notes aus dem
    vollständig passenden Abschnitt von `CHANGELOG.md` sowie die Schritte zur Release-Ankündigung.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript auch außerhalb des schnelleren lokalen `pnpm check`-Gates
  abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Prüfungen für Importzyklen
  und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm plugins:sync` nach dem Root-Versions-Bump und vor dem Tagging aus. Es
  aktualisiert die Versionen veröffentlichbarer Plugin-Pakete, OpenClaw-Peer-/API-Kompatibilitäts-
  Metadaten, Build-Metadaten und Plugin-Changelog-Stubs, damit sie zur Core-
  Release-Version passen. `pnpm plugins:sync:check` ist der nicht verändernde Release-Guard;
  der Publish-Workflow schlägt vor jeder Registry-Mutation fehl, wenn dieser Schritt
  vergessen wurde.
- Führen Sie den manuellen `Full Release Validation`-Workflow vor der Release-Freigabe aus, um
  alle Pre-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch,
  ein Tag oder einen vollständigen Commit-SHA, dispatcht manuelles `CI` und dispatcht
  `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-
  Paketprüfungen, QA Lab-Parität, Matrix- und Telegram-Lanes. Stabile/standardmäßige Läufe
  halten umfassende Live-/E2E- und Docker-Release-Pfad-Soaks hinter
  `run_release_soak=true`; `release_profile=full` erzwingt den Soak. Mit
  `release_profile=full` und `rerun_group=all` wird außerdem Paket-Telegram-
  E2E gegen das `release-package-under-test`-Artefakt aus den Release Checks ausgeführt.
  Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dasselbe
  Telegram-E2E auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie
  `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance
  seine Paket-/Update-Matrix gegen das ausgelieferte npm-Paket statt
  gegen das aus dem SHA gebaute Artefakt ausführen soll. Geben Sie
  `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die
  Validierung einem veröffentlichten npm-Paket entspricht, ohne Telegram-E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen `Package Acceptance`-Workflow aus, wenn Sie Side-Channel-Nachweise
  für einen Paketkandidaten benötigen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen `package_ref`-Branch/-Tag/-SHA mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem
  SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub
  Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die
  ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt
  der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Gängige Profile:
  - `smoke`: Installations-/Kanal-/Agent-, Gateway-Netzwerk- und Config-Reload-Lanes
  - `package`: artefaktnative Paket-/Update-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten erneuten Lauf
- Führen Sie den manuellen `CI`-Workflow direkt aus, wenn Sie nur die vollständige normale CI-
  Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen das Changed-
  Scoping und erzwingen die Linux-Node-Shards, Bundled-Plugin-Shards, Kanal-
  Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke,
  Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control UI-i18n-
  Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt
  QA-Lab über einen lokalen OTLP/HTTP-Receiver aus und prüft die exportierten Trace-
  Span-Namen, begrenzten Attribute sowie die Redaktion von Inhalt/Identifiern, ohne
  Opik, Langfuse oder einen anderen externen Collector zu erfordern.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die verändernde Publish-Sequenz aus, nachdem das
  Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` (oder `main`, wenn Sie ein
  von main erreichbares Tag veröffentlichen), übergeben Sie das Release-Tag und die erfolgreiche OpenClaw-npm-
  `preflight_run_id`, und behalten Sie den standardmäßigen Plugin-Publish-Scope
  `all-publishable` bei, außer Sie führen bewusst eine fokussierte Reparatur aus. Der
  Workflow serialisiert Plugin-npm-Publish, Plugin-ClawHub-Publish und OpenClaw-
  npm-Publish, damit das Core-Paket nicht vor seinen externalisierten
  Plugins veröffentlicht wird.
- Release Checks laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem vor der Release-Freigabe die QA Lab-Mock-Parity-Lane plus das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-
  Lanes verwenden die `qa-live-shared`-Umgebung; Telegram verwendet außerdem Convex-CI-
  Credential-Leases. Führen Sie den manuellen `QA-Lab - All Lanes`-Workflow mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie das vollständige Matrix-
  Transport-, Medien- und E2EE-Inventar parallel benötigen.
- Cross-OS-Installations- und Upgrade-Runtime-Validierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie Publish nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release
Validation` oder vom `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der nur validierende Preflight von `OpenClaw NPM Release` akzeptiert außerdem den aktuellen
  vollständigen 40-Zeichen-Workflow-Branch-Commit-SHA, ohne ein gepushtes Tag zu verlangen
- Dieser SHA-Pfad ist nur für die Validierung vorgesehen und kann nicht in einen echten Publish
  überführt werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; ein echter Publish erfordert weiterhin ein echtes Release-Tag
- Beide Workflows belassen den echten Publish- und Promotion-Pfad auf GitHub-gehosteten
  Runnern, während der nicht verändernde Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Checks-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder das passende Beta-/Correction-Tag) vor der Freigabe aus
- Führen Sie nach dem npm-Publish
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Correction-Version) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu prüfen
- Führen Sie nach einem Beta-Publish `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Installed-Package-Onboarding, Telegram-Einrichtung und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Credential-
  Pool zu prüfen. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einem Maintainer-Rechner auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, dispatcht `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über GitHub Actions mit dem
  manuellen `NPM Telegram Beta E2E`-Workflow ausführen. Er ist absichtlich nur manuell
  und läuft nicht bei jedem Merge.
- Maintainer-Release-Automation verwendet jetzt Preflight-dann-Promote:
  - echter npm-Publish muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - der echte npm-Publish muss vom selben `main`- oder
    `release/YYYY.M.D`-Branch dispatcht werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabiler npm-Publish kann über Workflow-Eingabe explizit `latest` anvisieren
  - tokenbasierte npm-dist-tag-Mutation lebt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo OIDC-only Publish beibehält
  - öffentliches `macOS Release` ist nur validierend; wenn ein Tag nur auf einem
    Release-Branch lebt, der Workflow aber von `main` dispatcht wird, setzen Sie
    `public_release_branch=release/YYYY.M.D`
  - echter privater Mac-Publish muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Publish-Pfade promoten vorbereitete Artefakte, statt sie erneut
    zu bauen
- Bei stabilen Correction-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier
  außerdem denselben Temp-Prefix-Upgrade-Pfad von `YYYY.M.D` zu `YYYY.M.D-N`,
  damit Release-Corrections ältere globale Installationen nicht stillschweigend auf dem
  Basis-Stable-Payload belassen können
- Der npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Validierung prüft außerdem, dass veröffentlichte Plugin-Entrypoints und
  Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das
  fehlende Plugin-Runtime-Payloads ausliefert, schlägt im Postpublish-Verifier fehl und
  kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, damit Installer-E2E versehentlichen Pack-Bloat
  vor dem Release-Publish-Pfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder
  Extension-Testmatrizen berührt hat, regenerieren und prüfen Sie vor der Freigabe die planner-eigenen
  `plugin-prerelease-extension-shard`-Matrix-Ausgaben aus
  `.github/workflows/plugin-prerelease.yml`, damit Release Notes kein veraltetes CI-Layout
  beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst außerdem die Updater-Oberflächen:
  - Das GitHub-Release muss am Ende das paketierte `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach dem Publish auf das neue stabile Zip zeigen
  - Die paketierte App muss eine nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist die Methode, mit der Betreiber alle Pre-Release-Tests von
einem Einstiegspunkt aus starten. Für einen gepinnten Commit-Nachweis auf einem schnell beweglichen Branch verwenden Sie den
Helper, damit jeder Child-Workflow von einem temporären Branch ausgeführt wird, der auf den Ziel-
SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
von diesem Branch mit `ref=<sha>`, prüft, dass jeder Child-Workflow-`headSha`
dem Ziel entspricht, und löscht dann den temporären Branch. Dies verhindert, dass versehentlich ein
neuerer `main`-Child-Lauf nachgewiesen wird.

Für Release-Branch- oder Tag-Validierung führen Sie ihn vom vertrauenswürdigen `main`-Workflow-
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
übergeordnetes `release-package-under-test`-Artefakt für paketbezogene Prüfungen
vor und dispatcht eigenständige Paket-Telegram-E2E, wenn `release_profile=full`
mit `rerun_group=all` verwendet wird oder wenn `npm_telegram_package_spec` gesetzt ist. `OpenClaw Release
Checks` fächert dann Install-Smoke, Cross-OS-Release-Prüfungen, Live-/E2E-Docker-
Release-Pfad-Abdeckung bei aktiviertem Soak, Package Acceptance mit Telegram-
Paket-QA, QA-Lab-Parität, Live-Matrix und Live-Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die
Zusammenfassung von `Full Release Validation`
`normal_ci` und `release_checks` als erfolgreich ausweist. Im Full-/All-Modus
muss auch das Kind `npm_telegram` erfolgreich sein; außerhalb von Full/All wird es übersprungen,
sofern keine veröffentlichte `npm_telegram_package_spec` angegeben wurde. Die abschließende
Verifier-Zusammenfassung enthält Tabellen mit den langsamsten Jobs für jeden Kindlauf, damit der Release
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Stufenmatrix, exakte Workflow-Jobnamen, Unterschiede zwischen Stable- und Full-Profil,
Artefakte und gezielte Rerun-Handles.
Kind-Workflows werden von der vertrauenswürdigen Ref dispatcht, die `Full Release
Validation` ausführt, normalerweise `--ref main`, selbst wenn die Ziel-`ref` auf einen
älteren Release-Branch oder Tag zeigt. Es gibt keine separate Workflow-Ref-Eingabe für Full Release Validation;
wählen Sie den vertrauenswürdigen Harness, indem Sie die Ref des Workflow-Laufs wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für exakten Commit-Nachweis auf einem beweglichen `main`;
rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein, verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den angehefteten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite beratende Provider-/Medienabdeckung

Verwenden Sie `run_release_soak=true` mit `stable`, wenn die release-blockierenden Lanes
grün sind und Sie vor der Promotion den erschöpfenden Live-/E2E-, Docker-Release-Pfad- und
All-since-2026.4.23-Upgrade-Survivor-Sweep wünschen. `full` impliziert
`run_release_soak=true`.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die Ziel-
Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt in Cross-OS,
Package Acceptance und Release-Pfad-Docker-Prüfungen wieder, wenn Soak läuft. Dadurch bleiben
alle paketbezogenen Boxen auf denselben Bytes und wiederholte Paket-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane
Paketinstallation, Onboarding, Gateway-Start und eine Live-Agent-Runde nachweist,
statt das langsamste Standardmodell zu benchmarken. Die breitere Live-Provider-
Matrix bleibt der Ort für modellspezifische Abdeckung.

Verwenden Sie diese Varianten abhängig von der Release-Stufe:

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
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen Kind-Workflow, Job, die Docker-Lane,
das Paketprofil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella nur dann erneut aus, wenn
der Fix die gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise
veraltet gemacht hat. Der abschließende Verifier des Umbrellas prüft die aufgezeichneten Kind-Workflow-Lauf-
IDs erneut. Nachdem ein Kind-Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur das normale CI-Kind aus, `plugin-prerelease`
führt nur das release-spezifische Plugin-Kind aus, `release-checks` führt jede Release-
Box aus, und die schmaleren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Gezielte `npm-telegram`-Reruns benötigen `npm_telegram_package_spec`; Full-/All-Läufe
mit `release_profile=full` verwenden das Paketartefakt aus den Release-Prüfungen. Gezielte
Cross-OS-Reruns können `cross_os_suite_filter=windows/packaged-upgrade` oder
einen anderen OS-/Suite-Filter hinzufügen. QA-Release-Check-Fehler sind beratend; ein reiner QA-
Fehler blockiert die Release-Validierung nicht.

### Vitest

Die Vitest-Box ist der manuelle Kind-Workflow `CI`. Manuelles CI umgeht
bewusst Changed-Scoping und erzwingt den normalen Testgraphen für den Release
Candidate: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Source Tree die vollständige normale Testsuite bestanden?“
Sie ist nicht dasselbe wie Produktvalidierung auf dem Release-Pfad. Aufzubewahrende Nachweise:

- Zusammenfassung von `Full Release Validation` mit der URL des dispatchten `CI`-Laufs
- grüner `CI`-Lauf auf dem exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Lauf Performance-Analyse benötigt

Führen Sie manuelles CI nur dann direkt aus, wenn das Release deterministisches normales CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box liegt in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-
Workflow `install-smoke`. Sie validiert den Release Candidate über paketierte
Docker-Umgebungen statt nur über Source-Level-Tests.

Release-Docker-Abdeckung umfasst:

- vollständiger Install-Smoke mit aktiviertem langsamem Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-,
  Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate Install-Smoke-
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
- Live-/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Prüfungen
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für gezielte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow statt
alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten vorherige
`package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, wenn verfügbar, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest- und Docker-
Paketmechanik.

Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane mit der Opus-4.6-
  Baseline unter Verwendung des agentischen Paritätspakets vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Paritäts-, Matrix- und Telegram-
Lanes auf, wenn Sie das Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller geshardeter QA-Lab-Lauf verfügbar und ist nicht die standardmäßige release-kritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird durch
`Package Acceptance` und den Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen
Candidate in den `package-under-test`-Tarball, der von Docker E2E verwendet wird, validiert
das Paketinventar, zeichnet Paketversion und SHA-256 auf und hält die
Workflow-Harness-Ref getrennt von der Paket-Source-Ref.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness
- `source=url`: lädt eine HTTPS-`.tgz` mit erforderlicher `package_sha256` herunter
- `source=artifact`: verwendet eine von einem anderen GitHub-Actions-Lauf hochgeladene `.tgz` wieder

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paketartefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update, Bereinigung veralteter
Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Update und Telegram-
Paket-QA gegen denselben aufgelösten Tarball. Blockierende Release-Prüfungen verwenden die
standardmäßige neueste veröffentlichte Paket-Baseline; `run_release_soak=true` oder
`release_profile=full` erweitert dies auf jede stabile npm-veröffentlichte Baseline von
`2026.4.23` bis `latest` plus Fixtures für gemeldete Issues. Verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Candidate oder
`source=ref`/`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der
Veröffentlichung. Es ist der GitHub-native
Ersatz für den Großteil der Paket-/Update-Abdeckung, die zuvor
Parallels erforderte. Cross-OS-Release-Prüfungen bleiben für OS-spezifisches Onboarding,
Installer und Plattformverhalten wichtig, aber Paket-/Update-Produktvalidierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn
Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine
Plugin-Installation/-Aktualisierung, Doctor-Bereinigung oder veröffentlichte Paketmigration nachweist.
Erschöpfende veröffentlichte Update-Migration von jedem stabilen `2026.4.23+`-Paket ist
ein separater manueller `Update Migration`-Workflow, nicht Teil von Full Release CI.

Legacy-Nachsicht bei Package Acceptance ist bewusst zeitlich begrenzt. Pakete bis
`2026.4.25` dürfen den Kompatibilitätspfad für bereits auf npm veröffentlichte Metadatenlücken nutzen:
private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien in der aus dem Tarball abgeleiteten Git-
Fixture, fehlender persistierter `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze,
fehlende Persistenz von Marketplace-Installationsdatensätzen und Konfigurationsmetadaten-
Migration während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf
für lokale Build-Metadatenstempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete
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

- `smoke`: schnelle Lanes für Paketinstallation, Kanal/Agent, Gateway-Netzwerk und
  Neuladen der Konfiguration
- `package`: Installations-, Aktualisierungs- und Plugin-Paketverträge ohne Live-ClawHub; dies ist die
  Standardeinstellung der Release-Prüfung
- `product`: `package` plus MCP-Kanäle, Bereinigung von Cron/Subagent, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Abschnitte mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Wiederholungen

Für Telegram-Nachweise zu Paketkandidaten aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den
aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Automatisierung der Release-Veröffentlichung

`OpenClaw Release Publish` ist der normale ändernde Einstiegspunkt für Veröffentlichungen. Er
orchestriert die Trusted-Publisher-Workflows in der für das Release benötigten Reihenfolge:

1. Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Prüfen, dass das Tag von `main` oder `release/*` aus erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und derselben SHA auslösen.
6. `OpenClaw NPM Release` mit dem Release-Tag, dem npm-Dist-Tag und der
   gespeicherten `preflight_run_id` auslösen.

Beispiel für Beta-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Veröffentlichung auf das standardmäßige Beta-Dist-Tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Hochstufung direkt auf `latest` ist explizit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Verwenden Sie die untergeordneten Workflows `Plugin NPM Release` und `Plugin ClawHub Release`
nur für fokussierte Reparaturen oder erneute Veröffentlichungen. Übergeben Sie für eine ausgewählte Plugin-Reparatur
`plugin_publish_scope=selected` und `plugins=@openclaw/name` an
`OpenClaw Release Publish`, oder lösen Sie den untergeordneten Workflow direkt aus, wenn das
OpenClaw-Paket nicht veröffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese durch Operatoren gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true` gesetzt ist, kann es auch die aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches für einen reinen Validierungs-Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; standardmäßig `beta`

`OpenClaw Release Publish` akzeptiert diese durch Operatoren gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Run-ID;
  erforderlich, wenn `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: standardmäßig `all-publishable`; verwenden Sie `selected` nur
  für fokussierte Reparaturarbeiten
- `plugins`: kommagetrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standardmäßig `true`; setzen Sie dies nur dann auf `false`, wenn Sie den
  Workflow als reinen Plugin-Reparatur-Orchestrator verwenden

`OpenClaw Release Checks` akzeptiert diese durch Operatoren gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA, die validiert werden soll. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag aus erreichbar ist.
- `run_release_soak`: exhaustive Live/E2E-, Docker-Release-Pfad- und
  all-since Upgrade-Survivor-Soak-Prüfungen für stabile/standardmäßige Release-Prüfungen aktivieren. Dies wird
  durch `release_profile=full` erzwungen.

Regeln:

- Stabile Tags und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer
  ausschließlich der Validierung
- Der echte Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden, das während des Preflight verwendet wurde;
  der Workflow prüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release schneiden:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie die aktuelle vollständige Commit-SHA des Workflow-Branches
     für einen reinen Validierungs-Testlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur dann,
   wenn Sie bewusst eine direkte stabile Veröffentlichung möchten
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Ref aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`
   und der gespeicherten `preflight_run_id` aus; er veröffentlicht externalisierte Plugins auf npm
   und ClawHub, bevor das OpenClaw-npm-Paket hochgestuft wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   Workflow, um diese stabile Version von `beta` auf `latest` hochzustufen
8. Wenn das Release absichtlich direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zeigen zu lassen, oder lassen Sie dessen geplante
   selbstheilende Synchronisierung `beta` später verschieben

Die Dist-Tag-Mutation liegt aus Sicherheitsgründen im privaten Repo, da sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repo ausschließlich OIDC-Veröffentlichungen nutzt.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Hochstufungspfad
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen Sie alle 1Password-
CLI-(`op`)-Befehle nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Agent-Shell auf; die Ausführung innerhalb von tmux macht Eingabeaufforderungen,
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
für das eigentliche Runbook.

## Verwandt

- [Release-Kanäle](/de/install/development-channels)
