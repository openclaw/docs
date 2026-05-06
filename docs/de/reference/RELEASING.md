---
read_when:
    - Suche nach öffentlichen Release-Channel-Definitionen
    - Release-Validierung oder Paketakzeptanz ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Veröffentlichungskanäle, Checkliste für Betreiber, Validierungsboxen, Versionsbenennung und Rhythmus
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-06T18:00:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Vorabrelease-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Head von `main`

## Versionsbenennung

- Stabile Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stabile Korrekturrelease-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Vorabrelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell beworbene stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrekturreleases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können ausdrücklich `latest` als Ziel wählen oder einen geprüften Beta-Build später bewerben
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App zusammen aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, wobei
  Build, Signierung und Notarisierung der Mac-App stabilen Releases vorbehalten bleiben, sofern sie nicht ausdrücklich angefordert werden

## Release-Rhythmus

- Releases laufen zuerst über beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise aus einem `release/YYYY.M.D`-Branch, der
  vom aktuellen `main` erstellt wurde, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, erstellen Maintainer
  das nächste `-beta.N`-Tag, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detailliertes Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste ist die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, dist-tag-Wiederherstellung und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neuesten Stand pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass das aktuelle `main`-CI ausreichend grün ist, um davon zu branchen.
2. Den obersten Abschnitt in `CHANGELOG.md` aus der echten Commit-Historie mit
   `/changelog` neu schreiben, Einträge nutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätseinträge in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiter abgedeckt bleibt, oder dokumentieren, warum sie
   bewusst weitergeführt wird.
4. `release/YYYY.M.D` vom aktuellen `main` erstellen; normale Release-Arbeit nicht
   direkt auf `main` durchführen.
5. Jede erforderliche Versionsstelle für das geplante Tag erhöhen, dann
   `pnpm plugins:sync` ausführen, damit veröffentlichbare Plugin-Pakete dieselbe Release-
   Version und dieselben Kompatibilitätsmetadaten teilen, anschließend den lokalen deterministischen Preflight ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` und
   `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branches für den reinen Validierungs-
   Preflight erlaubt. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA starten. Dies ist der einzige manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch fixen und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, den Provider oder die Modell-Allowlist erneut ausführen, die
   den Fix beweist. Den vollständigen Umbrella nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für beta `vYYYY.M.D-beta.N` taggen, dann `OpenClaw Release Publish` vom
   passenden `release/YYYY.M.D`-Branch ausführen. Es verifiziert `pnpm plugins:sync:check`,
   dispatcht alle veröffentlichbaren Plugin-Pakete parallel an npm und dieselbe Menge an
   ClawHub und bewirbt anschließend das vorbereitete OpenClaw-npm-Preflight-
   Artefakt mit dem passenden dist-tag, sobald die npm-Veröffentlichung der Plugins erfolgreich ist.
   Die ClawHub-Veröffentlichung kann noch laufen, während OpenClaw auf npm veröffentlicht, aber der
   Release-Publish-Workflow endet erst, wenn beide Plugin-Veröffentlichungspfade und
   der OpenClaw-npm-Veröffentlichungspfad erfolgreich abgeschlossen sind. Nach der Veröffentlichung die
   Post-Publish-Paket-
   akzeptanz gegen das veröffentlichte Paket `openclaw@YYYY.M.D-beta.N` oder
   `openclaw@beta` ausführen. Wenn ein gepushtes oder veröffentlichtes Vorabrelease einen Fix benötigt,
   die nächste passende Vorabrelease-Nummer erstellen; das alte
   Vorabrelease nicht löschen oder umschreiben.
10. Für stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die stabile npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` wieder; die Release-Bereitschaft für stabile macOS-Releases erfordert außerdem die
    paketierten Dateien `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifizierer ausführen, optional das eigenständige
    Published-npm-Telegram-E2E, wenn Sie Post-Publish-Kanalnachweise benötigen,
    dist-tag-Bewerbung bei Bedarf, GitHub-Release-/Vorabrelease-Notizen aus dem
    vollständigen passenden Abschnitt in `CHANGELOG.md` und die Release-Ankündigungs-
    schritte.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor der Release-Vorprüfung aus, damit Test-TypeScript außerhalb des schnelleren lokalen `pnpm check`-Prüflaufs abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor der Release-Vorprüfung aus, damit die umfassenderen Prüfungen auf Importzyklen und Architekturgrenzen außerhalb des schnelleren lokalen Prüflaufs grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Paketvalidierungsschritt vorhanden sind
- Führen Sie `pnpm plugins:sync` nach dem Root-Versions-Bump und vor dem Tagging aus. Es aktualisiert die Versionen veröffentlichbarer Plugin-Pakete, OpenClaw-Peer-/API-Kompatibilitätsmetadaten, Build-Metadaten und Plugin-Changelog-Stubs passend zur Core-Release-Version. `pnpm plugins:sync:check` ist der nicht verändernde Release-Schutz; der Veröffentlichungsworkflow schlägt vor jeder Registry-Mutation fehl, wenn dieser Schritt vergessen wurde.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um alle Pre-Release-Testboxen von einem Einstiegspunkt aus zu starten. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, dispatcht manuell `CI` und dispatcht `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stabile/Standardläufe behalten umfassende Live-/E2E- und Docker-Release-Pfad-Soaks hinter `run_release_soak=true`; `release_profile=full` erzwingt den Soak. Mit `release_profile=full` und `rerun_group=all` führt er außerdem Paket-Telegram-E2E gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen aus. Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dieselbe Telegram-E2E-Prüfung auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance seine Paket-/Update-Matrix gegen das ausgelieferte npm-Paket statt gegen das aus der SHA gebaute Artefakt ausführen soll. Geben Sie `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die Validierung zu einem veröffentlichten npm-Paket passt, ohne Telegram-E2E zu erzwingen. Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweise für einen Paketkandidaten möchten, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`, um einen vertrauenswürdigen `package_ref`-Branch/-Tag/-SHA mit dem aktuellen `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlicher SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen Tarball wieder und kann Telegram-QA gegen denselben Tarball mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline. `update-restart-auth` verwendet das Kandidatenpaket sowohl als installierte CLI als auch als package-under-test, sodass der Managed-Restart-Pfad des Update-Befehls des Kandidaten geprüft wird.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Lanes für Installation/Channel/Agent, Gateway-Netzwerk und Konfigurations-Reload
  - `package`: paket-/update-/restart-/Plugin-Lanes, die artefaktnativ sind und ohne OpenWebUI oder Live-ClawHub laufen
  - `product`: Paketprofil plus MCP-Channels, Cron-/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten Wiederholungslauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen Changed-Scoping und erzwingen die Linux-Node-Shards, Bundled-Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es prüft QA-Lab über einen lokalen OTLP/HTTP-Receiver und verifiziert die exportierten Trace-Span-Namen, begrenzten Attribute und die Schwärzung von Inhalten/Identifiern, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die verändernde Veröffentlichungssequenz aus, nachdem das Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` aus (oder von `main`, wenn Sie ein von main erreichbares Tag veröffentlichen), übergeben Sie das Release-Tag und die erfolgreiche OpenClaw-npm-`preflight_run_id`, und behalten Sie den standardmäßigen Plugin-Veröffentlichungsumfang `all-publishable` bei, außer Sie führen bewusst eine fokussierte Reparatur aus. Der Workflow serialisiert die Veröffentlichung von Plugin-npm, Plugin-ClawHub und OpenClaw-npm, damit das Core-Paket nicht vor seinen externalisierten Plugins veröffentlicht wird.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe auch die QA-Lab-Mock-Paritäts-Lane sowie das schnelle Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständigen Matrix-Transport sowie Medien- und E2EE-Inventar parallel ausführen möchten.
- Cross-OS-Installations- und Upgrade-Runtime-Validierung ist Teil der öffentlichen Workflows `OpenClaw Release Checks` und `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz, deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release Validation` oder vom `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, solange der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag aus erreichbar ist
- Die reine Validierungs-Vorprüfung von `OpenClaw NPM Release` akzeptiert auch die aktuelle vollständige 40-stellige Commit-SHA des Workflow-Branches, ohne ein gepushtes Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht zu einer echten Veröffentlichung befördert werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die Paketmetadatenprüfung; echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows behalten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten Runnern, während der nicht verändernde Validierungspfad die größeren Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Die npm-Release-Vorprüfung wartet nicht mehr auf die separate Release-Checks-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-Installationspfad in einem frischen temporären Präfix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um Installed-Package-Onboarding, Telegram-Setup und echte Telegram-E2E-Prüfung gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Credential-Pool zu verifizieren. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen und die drei `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einem Maintainer-Rechner auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, dispatcht `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über GitHub Actions mit dem manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist absichtlich nur manuell und läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestanden haben
  - die echte npm-Veröffentlichung muss vom selben `main`- oder `release/YYYY.M.D`-Branch dispatcht werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Eingabe explizit `latest` als Ziel verwenden
  - tokenbasierte npm-Dist-Tag-Mutation liegt jetzt aus Sicherheitsgründen in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das öffentliche Repo OIDC-only-Veröffentlichung beibehält
  - öffentliches `macOS Release` ist nur Validierung; wenn ein Tag nur auf einem Release-Branch existiert, der Workflow aber von `main` dispatcht wird, setzen Sie `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-`preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Bei stabilen Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier auch denselben Temp-Präfix-Upgrade-Pfad von `YYYY.M.D` zu `YYYY.M.D-N`, damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem stabilen Basis-Payload belassen
- Die npm-Release-Vorprüfung schlägt geschlossen fehl, sofern der Tarball nicht sowohl `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält, damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Einstiegspunkte und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, dem Plugin-Runtime-Payloads fehlen, schlägt im Postpublish-Verifier fehl und kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliche Paketaufblähung vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder Extension-Testmatrizen berührt hat, generieren und prüfen Sie vor der Freigabe die planner-eigenen `plugin-prerelease-extension-shard`-Matrix-Ausgaben aus `.github/workflows/plugin-prerelease.yml`, damit Release Notes kein veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst auch die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die gepackten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile Zip-Datei zeigen
  - die gepackte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist die Methode, mit der Betreiber alle Pre-Release-Tests von einem Einstiegspunkt aus starten. Für einen Pinned-Commit-Nachweis auf einem schnell beweglichen Branch verwenden Sie den Helper, damit jeder Child-Workflow von einem temporären Branch ausgeführt wird, der auf die Ziel-SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation` von diesem Branch mit `ref=<sha>`, verifiziert, dass jede Child-Workflow-`headSha` zum Ziel passt, und löscht dann den temporären Branch. So wird vermieden, versehentlich einen neueren `main`-Child-Lauf nachzuweisen.

Für Release-Branch- oder Tag-Validierung führen Sie dies vom vertrauenswürdigen `main`-Workflow-Ref aus und übergeben den Release-Branch oder das Tag als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Der Workflow löst die Ziel-Ref auf, startet manuell `CI` mit
`target_ref=<release-ref>`, startet `OpenClaw Release Checks`, bereitet ein
übergeordnetes `release-package-under-test`-Artefakt für paketbezogene Prüfungen
vor und startet eigenständige Paket-Telegram-E2E, wenn `release_profile=full`
mit `rerun_group=all` verwendet wird oder wenn `npm_telegram_package_spec`
gesetzt ist. `OpenClaw Release Checks` verzweigt dann in Install-Smoke,
Cross-OS-Release-Prüfungen, Live-/E2E-Docker-Abdeckung für den Release-Pfad,
wenn Soak aktiviert ist, Package Acceptance mit Telegram-Paket-QA, QA-Lab-Parität,
Live-Matrix und Live-Telegram. Ein vollständiger Lauf ist nur akzeptabel, wenn
die Zusammenfassung von `Full Release Validation` `normal_ci` und
`release_checks` als erfolgreich anzeigt. Im Full-/All-Modus muss auch das
Kind `npm_telegram` erfolgreich sein; außerhalb von Full/All wird es übersprungen,
sofern kein veröffentlichtes `npm_telegram_package_spec` angegeben wurde. Die
abschließende Verifizierer-Zusammenfassung enthält Tabellen der langsamsten Jobs
für jeden Kindlauf, sodass die Release-Verantwortlichen den aktuellen kritischen
Pfad sehen können, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für
die vollständige Phasenmatrix, die exakten Workflow-Jobnamen, die Unterschiede
zwischen Stable- und Full-Profil, Artefakte und gezielte Handles für erneute
Läufe.
Kind-Workflows werden von der vertrauenswürdigen Ref gestartet, die
`Full Release Validation` ausführt, normalerweise `--ref main`, selbst wenn die
Ziel-`ref` auf einen älteren Release-Branch oder Tag zeigt. Es gibt keine
separate Workflow-Ref-Eingabe für Full Release Validation; wählen Sie das
vertrauenswürdige Harness, indem Sie die Ref des Workflow-Laufs wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für exakte Commit-Nachweise auf
einem sich bewegenden `main`; rohe Commit-SHAs können keine Workflow-Dispatch-Refs
sein. Verwenden Sie daher `pnpm ci:full-release --sha <sha>`, um den angehefteten
temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus Stable-Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite Advisory-Provider-/Medienabdeckung

Verwenden Sie `run_release_soak=true` mit `stable`, wenn die release-blockierenden
Lanes grün sind und Sie vor der Promotion den erschöpfenden Live-/E2E-,
Docker-Release-Pfad- und begrenzten Survivor-Sweep für veröffentlichte Upgrades
wünschen. Dieser Sweep deckt die neuesten vier Stable-Pakete plus angeheftete
`2026.4.23`- und `2026.5.2`-Baselines sowie ältere `2026.4.15`-Abdeckung ab,
entfernt doppelte Baselines und shardet jede Baseline in einen eigenen
Docker-Runner-Job. `full` impliziert `run_release_soak=true`.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die
Ziel-Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses
Artefakt in Cross-OS-, Package-Acceptance- und Release-Pfad-Docker-Prüfungen
wieder, wenn Soak läuft. Dadurch verwenden alle paketbezogenen Boxen dieselben
Bytes, und wiederholte Paket-Builds werden vermieden. Der Cross-OS-OpenAI-
Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die Repo-/Org-
Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane die
Paketinstallation, das Onboarding, den Gateway-Start und eine Live-Agent-Runde
prüft, statt das langsamste Standardmodell zu benchmarken. Die breitere
Live-Provider-Matrix bleibt der Ort für modellspezifische Abdeckung.

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Verwenden Sie das vollständige Umbrella nicht als ersten erneuten Lauf nach einem
gezielten Fix. Wenn eine Box fehlschlägt, verwenden Sie für den nächsten Nachweis
den fehlgeschlagenen Kind-Workflow, Job, die Docker-Lane, das Paketprofil, den
Modell-Provider oder die QA-Lane. Führen Sie das vollständige Umbrella erst dann
erneut aus, wenn der Fix die gemeinsame Release-Orchestrierung geändert oder
frühere All-Box-Nachweise veraltet gemacht hat. Der abschließende Verifizierer
des Umbrella prüft die aufgezeichneten Kind-Workflow-Run-IDs erneut. Nachdem ein
Kind-Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den
fehlgeschlagenen übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an das Umbrella.
`all` ist der echte Release-Candidate-Lauf, `ci` führt nur das normale CI-Kind
aus, `plugin-prerelease` führt nur das release-spezifische Plugin-Kind aus,
`release-checks` führt jede Release-Box aus, und die engeren Release-Gruppen sind
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`
und `npm-telegram`. Gezielte `npm-telegram`-erneute Läufe erfordern
`npm_telegram_package_spec`; Full-/All-Läufe mit `release_profile=full` verwenden
das Paketartefakt der Release-Prüfungen. Gezielte Cross-OS-Wiederholungen können
`cross_os_suite_filter=windows/packaged-upgrade` oder einen anderen OS-/Suite-
Filter hinzufügen. QA-Release-Check-Fehler sind beratend; ein reiner QA-Fehler
blockiert die Release-Validierung nicht.

### Vitest

Die Vitest-Box ist der manuelle Kind-Workflow `CI`. Manuelles CI umgeht
absichtlich die geänderte Eingrenzung und erzwingt den normalen Testgraphen für
den Release Candidate: Linux-Node-Shards, gebündelte Plugin-Shards,
Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`,
Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Android
und Control-UI-i18n.

Verwenden Sie diese Box, um die Frage „Hat der Quellbaum die vollständige normale
Testsuite bestanden?“ zu beantworten. Sie ist nicht dasselbe wie Produktvalidierung
für den Release-Pfad. Aufzubewahrende Nachweise:

- Zusammenfassung von `Full Release Validation`, die die URL des gestarteten
  `CI`-Laufs zeigt
- grüner `CI`-Lauf auf der exakten Ziel-SHA
- fehlgeschlagene oder langsame Shard-Namen aus den CI-Jobs bei der Untersuchung
  von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn ein
  Lauf Performance-Analyse benötigt

Führen Sie manuelles CI nur direkt aus, wenn der Release deterministisches
normales CI benötigt, aber nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder
Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-
`install-smoke`-Workflow. Sie validiert den Release Candidate über paketierte
Docker-Umgebungen, statt nur Tests auf Quelltextebene auszuführen.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamem Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA,
  wobei QR-, Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate
  Install-Smoke-Shards laufen
- Repository-E2E-Lanes
- Docker-Chunks für den Release-Pfad: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` und `plugins-runtime-install-h`
- OpenWebUI-Abdeckung innerhalb des Chunks `plugins-runtime-services`, wenn
  angefordert
- aufgeteilte Install-/Uninstall-Lanes für gebündelte Plugins
  `bundled-plugin-install-uninstall-0` bis
  `bundled-plugin-install-uninstall-23`
- Live-/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Prüfungen
  Live-Suites einschließen

Verwenden Sie Docker-Artefakte, bevor Sie erneut ausführen. Der Release-Pfad-
Scheduler lädt `.artifacts/docker-tests/` mit Lane-Logs, `summary.json`,
`failures.json`, Phasen-Timings, Scheduler-Plan-JSON und Befehlen für erneute
Läufe hoch. Für gezielte Wiederherstellung verwenden Sie
`docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, statt
alle Release-Chunks erneut auszuführen. Generierte Befehle für erneute Läufe
enthalten, sofern verfügbar, frühere `package_artifact_run_id`- und vorbereitete
Docker-Image-Eingaben, sodass eine fehlgeschlagene Lane denselben Tarball und
dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das
Release-Gate für agentisches Verhalten und Channel-Ebene, getrennt von Vitest
und Docker-Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane mit der Opus-4.6-Baseline
  unter Verwendung des agentischen Paritätspakets vergleicht
- schnelles Live-Matrix-QA-Profil unter Verwendung der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane unter Verwendung von Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis
  benötigt

Verwenden Sie diese Box, um die Frage „Verhält sich der Release in QA-Szenarien
und Live-Channel-Flows korrekt?“ zu beantworten. Bewahren Sie bei der
Release-Freigabe die Artefakt-URLs für Paritäts-, Matrix- und Telegram-Lanes auf.
Vollständige Matrix-Abdeckung bleibt als manueller, geshardeter QA-Lab-Lauf
verfügbar, statt die standardmäßige release-kritische Lane zu sein.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird von
`Package Acceptance` und dem Resolver `scripts/resolve-openclaw-package-candidate.mjs`
gestützt. Der Resolver normalisiert einen Candidate in den `package-under-test`-
Tarball, der von Docker E2E genutzt wird, validiert das Paketinventar, zeichnet
Paketversion und SHA-256 auf und hält die Ref des Workflow-Harness von der
Paketquell-Ref getrennt.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte
  OpenClaw-Release-Version
- `source=ref`: Packt einen vertrauenswürdigen `package_ref`-Branch, Tag oder
  vollständige Commit-SHA mit dem ausgewählten `workflow_ref`-Harness
- `source=url`: Lädt ein HTTPS-`.tgz` mit erforderlichem `package_sha256` herunter
- `source=artifact`: Verwendet ein von einem anderen GitHub-Actions-Lauf
  hochgeladenes `.tgz` wieder

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paketartefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update,
konfigurierten Auth-Update-Neustart, Bereinigung veralteter Plugin-Abhängigkeiten,
Offline-Plugin-Fixtures, Plugin-Update und Telegram-Paket-QA gegen denselben
aufgelösten Tarball. Blockierende Release-Prüfungen verwenden die standardmäßige
Baseline des neuesten veröffentlichten Pakets; `run_release_soak=true` oder
`release_profile=full` erweitert auf jede stabile, bei npm veröffentlichte
Baseline von `2026.4.23` bis `latest` plus Fixtures für gemeldete Issues.
Verwenden Sie Package Acceptance mit `source=npm` für einen bereits ausgelieferten
Candidate oder `source=ref`/`source=artifact` für einen SHA-gestützten lokalen
npm-Tarball vor der Veröffentlichung. Es ist der GitHub-native Ersatz für den
Großteil der Paket-/Update-Abdeckung, die zuvor Parallels erforderte. Cross-OS-
Release-Prüfungen bleiben für OS-spezifisches Onboarding, Installer- und
Plattformverhalten wichtig, aber Produktvalidierung für Pakete/Updates sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie,
wenn Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder
Release-Check-Lane eine Plugin-Installation/-Aktualisierung, Doctor-Bereinigung
oder veröffentlichte Paketmigrationsänderung nachweist. Erschöpfende
veröffentlichte Update-Migration von jedem Stable-`2026.4.23+`-Paket ist ein
separater manueller `Update Migration`-Workflow, nicht Teil von Full Release CI.

Die Legacy-Nachsicht bei der Paketakzeptanz ist absichtlich zeitlich begrenzt. Pakete bis einschließlich
`2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits
auf npm veröffentlicht wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-
Fixture, fehlendes persistiertes `update.channel`, Legacy-Speicherorte für Plugin-
Installationsdatensätze, fehlende Persistierung von Marketplace-Installationsdatensätzen und die Migration von Konfigurationsmetadaten
während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf für lokale Build-Metadaten-
Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete
müssen die modernen Paketverträge erfüllen; dieselben Lücken lassen die Release-
Validierung fehlschlagen.

Verwenden Sie breitere Paketakzeptanzprofile, wenn es bei der Release-Frage um ein
tatsächlich installierbares Paket geht:

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

- `smoke`: schnelle Lanes für Paketinstallation, Channel/Agent, Gateway-Netzwerk und
  Neuladen der Konfiguration
- `package`: Installations-, Update-, Neustart- und Plugin-Paketverträge ohne live
  ClawHub; dies ist der Standard für Release-Prüfungen
- `product`: `package` plus MCP-Channels, Bereinigung von Cron/Subagent, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte erneute Läufe

Für Telegram-Nachweise von Paketkandidaten aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in der Paketakzeptanz. Der Workflow übergibt den
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

Stabile Veröffentlichung mit dem Standard-Beta-Dist-Tag:

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

Verwenden Sie die Low-Level-Workflows `Plugin NPM Release` und `Plugin ClawHub Release`
nur für fokussierte Reparatur- oder Neuveröffentlichungsarbeiten. Für eine ausgewählte Plugin-Reparatur übergeben Sie
`plugin_publish_scope=selected` und `plugins=@openclaw/name` an
`OpenClaw Release Publish`, oder lösen Sie den untergeordneten Workflow direkt aus, wenn das
OpenClaw-Paket nicht veröffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true` ist, darf es auch die aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches für einen reinen Validierungs-Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: auf dem echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Publish` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Lauf-ID;
  erforderlich, wenn `publish_openclaw_npm=true` ist
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: Standard ist `all-publishable`; verwenden Sie `selected` nur
  für fokussierte Reparaturarbeiten
- `plugins`: durch Kommas getrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected` ist
- `publish_openclaw_npm`: Standard ist `true`; setzen Sie `false` nur, wenn Sie den
  Workflow als reinen Plugin-Reparatur-Orchestrator verwenden

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA, die validiert werden soll. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.
- `run_release_soak`: entscheidet sich für ausführliche Live/E2E-, Docker-Release-Pfad- und
  vollständige Upgrade-Survivor-Soak-Prüfungen bei stabilen/standardmäßigen Release-Prüfungen. Wird durch
  `release_profile=full` erzwungen.

Regeln:

- Stabile und Korrektur-Tags dürfen entweder nach `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true` ist
- `OpenClaw Release Checks` und `Full Release Validation` sind immer
  reine Validierungen
- Der echte Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden wie während des Preflights;
  der Workflow prüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release schneiden:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie die aktuelle vollständige Commit-SHA des Workflow-Branches
     für einen reinen Validierungs-Trockenlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur,
   wenn Sie absichtlich eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie absichtlich nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Ref aus
5. Speichern Sie das erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`
   und dem gespeicherten `preflight_run_id` aus; dies veröffentlicht externalisierte Plugins auf npm
   und ClawHub, bevor das OpenClaw-npm-Paket hochgestuft wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   Workflow, um diese stabile Version von `beta` auf `latest` hochzustufen
8. Wenn das Release absichtlich direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie dessen geplante
   Selbstheilungs-Synchronisierung `beta` später verschieben

Die Dist-Tag-Mutation liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repo reine OIDC-Veröffentlichung beibehält.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Hochstufungspfad
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückfallen muss, führen Sie alle 1Password-
CLI-(`op`)-Befehle nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Agent-Shell auf; wenn es in tmux bleibt, werden Prompts,
Warnungen und OTP-Behandlung beobachtbar und wiederholte Host-Warnungen verhindert.

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

- [Release-Channels](/de/install/development-channels)
