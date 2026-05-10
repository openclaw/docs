---
read_when:
    - Suche nach öffentlichen Release-Channel-Definitionen
    - Release-Validierung oder Paketabnahme ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Kanäle, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Kadenz
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-10T19:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Lanes:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der sich bewegende Head von `main`

## Versionsbenennung

- Version eines stabilen Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines stabilen Korrektur-Releases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version eines Beta-Prereleases: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen schreiben
- `latest` bedeutet das aktuell hochgestufte stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können ausdrücklich `latest` als Ziel wählen oder später einen geprüften Beta-Build hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App zusammen aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  Build, Signierung und Beglaubigung der Mac-App für stabile Releases reserviert sind, sofern sie nicht ausdrücklich angefordert werden

## Release-Kadenz

- Releases laufen zuerst über Beta
- Stabil folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise von einem `release/YYYY.M.D`-Branch aus,
  der aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Korrekturen neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und eine Korrektur benötigt, erstellen Maintainer
  das nächste `-beta.N`-Tag, anstatt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Prozedur, Genehmigungen, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Beglaubigung, dist-tag-Wiederherstellung und Details für Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: den neuesten Stand pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass das aktuelle `main`-CI grün genug ist, um davon einen Branch zu erstellen.
2. Den obersten Abschnitt in `CHANGELOG.md` anhand der realen Commit-Historie mit
   `/changelog` neu schreiben, Einträge nutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt ist, oder dokumentieren, warum sie
   bewusst weitergeführt wird.
4. `release/YYYY.M.D` vom aktuellen `main` erstellen; normale Release-Arbeit nicht
   direkt auf `main` durchführen.
5. Jeden erforderlichen Versionsort für das beabsichtigte Tag erhöhen, dann
   `pnpm release:prep` ausführen. Dadurch werden Plugin-Versionen, Plugin-Inventar, Konfigurationsschema,
   Metadaten der gebündelten Channel-Konfiguration, Baseline der Konfigurationsdokumentation, Plugin-SDK-
   Exporte und Plugin-SDK-API-Baseline in der richtigen Reihenfolge aktualisiert. Jegliche generierte
   Abweichung vor dem Tagging committen. Dann die lokale deterministische Vorabprüfung ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-stelliger Release-Branch-SHA für eine reine Validierungs-
   Vorabprüfung zulässig. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA starten. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch korrigieren und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, Provider- oder Modell-Allowlist erneut ausführen, die
   die Korrektur nachweist. Den vollständigen Umbrella nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Beta `vYYYY.M.D-beta.N` taggen, dann `OpenClaw Release Publish` vom
   passenden `release/YYYY.M.D`-Branch ausführen. Es verifiziert `pnpm plugins:sync:check`,
   dispatcht alle veröffentlichbaren Plugin-Pakete parallel zu npm und denselben Satz zu
   ClawHub und stuft anschließend das vorbereitete OpenClaw-npm-Vorabprüfungsartefakt
   mit dem passenden dist-tag hoch, sobald die npm-Veröffentlichung der Plugins erfolgreich ist.
   Nachdem der OpenClaw-npm-Publish-Child erfolgreich ist, erstellt oder aktualisiert es die
   passende GitHub-Release-/Prerelease-Seite aus dem vollständigen passenden
   Abschnitt in `CHANGELOG.md`. Stabile Releases, die auf npm `latest` veröffentlicht werden, werden zum
   neuesten GitHub-Release; stabile Wartungs-Releases, die auf npm `beta` bleiben, werden
   mit GitHub `latest=false` erstellt.
   ClawHub-Veröffentlichung kann noch laufen, während OpenClaw-npm veröffentlicht, aber der
   Release-Publish-Workflow gibt die Child-Run-IDs sofort aus. Standardmäßig wartet er
   nach dem Dispatch nicht auf ClawHub, sodass die Verfügbarkeit von OpenClaw auf npm
   nicht durch langsamere ClawHub-Genehmigungen oder Registry-Arbeit blockiert wird; setzen Sie
   `wait_for_clawhub=true`, wenn ClawHub den Workflow-Abschluss blockieren muss. Der
   ClawHub-Pfad wiederholt vorübergehende Installationsfehler von CLI-Abhängigkeiten, veröffentlicht
   preview-bestehende Plugins auch dann, wenn eine Preview-Zelle instabil ist, und endet mit
   Registry-Verifizierung für jede erwartete Plugin-Version, damit Teilveröffentlichungen
   sichtbar und wiederholbar bleiben. Nach der Veröffentlichung die Paketakzeptanz
   nach der Veröffentlichung gegen das veröffentlichte Paket `openclaw@YYYY.M.D-beta.N` oder
   `openclaw@beta` ausführen. Wenn ein gepushtes oder veröffentlichtes Prerelease eine Korrektur benötigt,
   die nächste passende Prerelease-Nummer erstellen; das alte Prerelease nicht löschen oder überschreiben.
10. Für stabil erst fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Auch die stabile npm-Veröffentlichung läuft über
    `OpenClaw Release Publish`, wobei das erfolgreiche Vorabprüfungsartefakt über
    `preflight_run_id` wiederverwendet wird; die Bereitschaft für ein stabiles macOS-Release erfordert außerdem
    die paketierten Dateien `.zip`, `.dmg`, `.dSYM.zip` und eine aktualisierte `appcast.xml` auf `main`.
    Der private macOS-Publish-Workflow veröffentlicht den signierten Appcast automatisch auf dem öffentlichen
    `main`, nachdem die Release-Assets verifiziert wurden; wenn Branch-Schutz den direkten Push blockiert,
    öffnet oder aktualisiert er einen Appcast-PR.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifizierer ausführen, optional einen eigenständigen
    veröffentlichten-npm-Telegram-E2E, wenn Sie Channel-Nachweise nach der Veröffentlichung benötigen,
    dist-tag-Hochstufung bei Bedarf durchführen, die generierte GitHub-Release-Seite verifizieren
    und die Schritte zur Release-Ankündigung ausführen.

## Release-Vorabprüfung

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript auch
  außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren Prüfungen auf Importzyklen
  und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:prep` nach dem Versions-Bump im Root und vor dem Tagging aus. Es
  führt jeden deterministischen Release-Generator aus, der nach einer
  Versions-/Konfigurations-/API-Änderung häufig abweicht: Plugin-Versionen, Plugin-Inventar, Basiskonfigurations-
  Schema, gebündelte Kanal-Konfigurationsmetadaten, Konfigurationsdokumentations-Baseline, Plugin-SDK-
  Exporte und Plugin-SDK-API-Baseline. `pnpm release:check` führt diese
  Wächter im Prüfmodus erneut aus und meldet jeden gefundenen generierten Drift-Fehler in einem
  Durchlauf, bevor Paket-Release-Prüfungen ausgeführt werden.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um
  alle Pre-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, dispatcht manuell `CI` und dispatcht
  `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Cross-OS-
  Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stabile/Standardläufe
  behalten umfangreiche Live-/E2E- und Docker-Release-Pfad-Soak-Prüfungen hinter
  `run_release_soak=true`; `release_profile=full` erzwingt Soak. Mit
  `release_profile=full` und `rerun_group=all` wird außerdem Paket-Telegram-
  E2E gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen ausgeführt.
  Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dieselbe
  Telegram-E2E auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie
  `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance
  seine Paket-/Update-Matrix gegen das ausgelieferte npm-Paket statt
  gegen das aus dem SHA gebaute Artefakt ausführen soll. Geben Sie
  `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die
  Validierung mit einem veröffentlichten npm-Paket übereinstimmt, ohne Telegram-E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweise
  für einen Paketkandidaten wünschen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen `package_ref`-Branch/-Tag/-SHA mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem
  SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-
  Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram-QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die
  ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paket-
  Artefakt der Kandidat und `published_upgrade_survivor_baseline` wählt
  die veröffentlichte Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket sowohl
  als installierte CLI als auch als Package-under-test, sodass der verwaltete Neustartpfad
  des Update-Befehls des Kandidaten ausgeübt wird.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Install-/Kanal-/Agent-, Gateway-Netzwerk- und Konfigurationsneulade-Lanes
  - `package`: artefakt-native Paket-/Update-/Neustart-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Blöcke mit OpenWebUI
  - `custom`: exakte Auswahl von `docker_lanes` für einen fokussierten erneuten Lauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-
  Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen die
  Changed-Scope-Logik und erzwingen die Linux-Node-Shards, gebündelte-Plugin-Shards, Kanal-
  Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke,
  Dokumentationsprüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-
  Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt
  QA-Lab über einen lokalen OTLP/HTTP-Empfänger aus und verifiziert die exportierten Trace-
  Span-Namen, begrenzten Attribute und Inhalts-/Kennungsredaktion, ohne
  Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die verändernde Veröffentlichungssequenz aus, nachdem der
  Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` (oder `main`, wenn ein
  von main erreichbarer Tag veröffentlicht wird), übergeben Sie den Release-Tag und die erfolgreiche OpenClaw-npm-
  `preflight_run_id`, und behalten Sie den Standard-Plugin-Veröffentlichungsumfang
  `all-publishable` bei, sofern Sie nicht bewusst eine fokussierte Reparatur ausführen. Der
  Workflow serialisiert Plugin-npm-Publish, Plugin-ClawHub-Publish und OpenClaw-
  npm-Publish, damit das Core-Paket nicht vor seinen externalisierten
  Plugins veröffentlicht wird.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem die QA-Lab-Mock-Paritäts-Lane plus das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane vor der Release-Freigabe aus. Die Live-
  Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-
  Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständiges Matrix-
  Transport-, Medien- und E2EE-Inventar parallel wünschen.
- Cross-OS-Installations- und Upgrade-Runtime-Validierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, sodass sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release
Validation` oder vom `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- `OpenClaw NPM Release`-Validierungs-Preflight akzeptiert außerdem den aktuellen
  vollständigen 40-Zeichen-Workflow-Branch-Commit-SHA, ohne einen gepushten Tag zu verlangen
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung
  befördert werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; echte Veröffentlichung erfordert weiterhin einen echten Release-Tag
- Beide Workflows behalten den echten Veröffentlichungs- und Promotionspfad auf GitHub-gehosteten
  Runnern, während der nicht verändernde Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- npm-Release-Preflight wartet nicht mehr auf die separate Release-Prüfungs-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder den passenden Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach dem npm-Publish
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Prefix zu verifizieren
- Führen Sie nach einem Beta-Publish `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Installed-Package-Onboarding, Telegram-Einrichtung und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Credential-
  Pool zu verifizieren. Lokale Maintainer-Einzelläufe können die Convex-Variablen auslassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einer Maintainer-Maschine auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, dispatcht `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über GitHub Actions mit dem
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist bewusst nur manuell
  und läuft nicht bei jedem Merge.
- Die Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss von demselben `main`- oder
    `release/YYYY.M.D`-Branch wie der erfolgreiche Preflight-Lauf dispatcht werden
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Eingabe explizit `latest` ansteuern
  - tokenbasierte npm-Dist-Tag-Mutation lebt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo nur OIDC-Publish beibehält
  - öffentliches `macOS Release` ist nur Validierung; wenn ein Tag nur auf einem
    Release-Branch lebt, der Workflow aber von `main` dispatcht wird, setzen Sie
    `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie erneut
    zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier
  außerdem denselben temporären Prefix-Upgrade-Pfad von `YYYY.M.D` auf `YYYY.M.D-N`,
  sodass Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem
  stabilen Basis-Payload belassen können
- npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Entrypoints und
  Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das
  fehlende Plugin-Runtime-Payloads ausliefert, lässt den Postpublish-Verifier fehlschlagen und
  kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliches Pack-Bloat
  vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder
  Extension-Testmatrizen berührt hat, regenerieren und prüfen Sie vor der Freigabe die vom Planner verwalteten
  `plugin-prerelease-extension-shard`-Matrix-Ausgaben aus
  `.github/workflows/plugin-prerelease.yml`, damit Release Notes kein
  veraltetes CI-Layout beschreiben
- Zur Bereitschaft für stabile macOS-Releases gehören außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile ZIP-Datei zeigen; der
    private macOS-Publish-Workflow committet sie automatisch oder öffnet eine Appcast-
    PR, wenn direkter Push blockiert ist
  - die paketierte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder oberhalb des kanonischen Sparkle-Build-Floors
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist die Methode, mit der Operatoren alle Pre-Release-Tests von
einem Einstiegspunkt starten. Für einen gepinnten Commit-Nachweis auf einem schnelllebigen Branch verwenden Sie den
Helper, damit jeder untergeordnete Workflow von einem temporären Branch aus läuft, der auf den Ziel-
SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, löst `Full Release Validation`
von diesem Branch mit `ref=<sha>` aus, prüft, dass jeder untergeordnete Workflow-`headSha`
dem Ziel entspricht, und löscht anschließend den temporären Branch. Dadurch wird vermieden,
versehentlich einen neueren untergeordneten `main`-Lauf nachzuweisen.

Führen Sie die Validierung für Release-Branches oder Tags vom vertrauenswürdigen `main`-Workflow-
Ref aus und übergeben Sie den Release-Branch oder das Tag als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Der Workflow löst den Ziel-Ref auf, löst manuelles `CI` mit
`target_ref=<release-ref>` aus, löst `OpenClaw Release Checks` aus, bereitet ein
übergeordnetes `release-package-under-test`-Artefakt für paketbezogene Checks vor und
löst eigenständige Paket-Telegram-E2E aus, wenn `release_profile=full` mit
`rerun_group=all` gesetzt ist oder wenn `npm_telegram_package_spec` gesetzt ist. `OpenClaw Release
Checks` fächert anschließend Install-Smoke, Cross-OS-Release-Checks, Live-/E2E-Docker-
Release-Pfad-Abdeckung bei aktiviertem Soak, Package Acceptance mit Telegram-
Paket-QA, QA-Lab-Parität, Live Matrix und Live Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die
`Full Release Validation`-
Zusammenfassung `normal_ci` und `release_checks` als erfolgreich anzeigt. Im full/all-Modus
muss auch der untergeordnete `npm_telegram`-Lauf erfolgreich sein; außerhalb von full/all wird er übersprungen,
sofern kein veröffentlichtes `npm_telegram_package_spec` bereitgestellt wurde. Die abschließende
Verifier-Zusammenfassung enthält Tabellen mit den langsamsten Jobs für jeden untergeordneten Lauf, sodass der Release-
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Stufenmatrix, exakte Workflow-Jobnamen, Unterschiede zwischen stabilem und vollständigem Profil,
Artefakte und gezielte Rerun-Handles.
Untergeordnete Workflows werden von dem vertrauenswürdigen Ref ausgelöst, der `Full Release
Validation` ausführt, normalerweise `--ref main`, selbst wenn der Ziel-`ref` auf einen
älteren Release-Branch oder ein älteres Tag zeigt. Es gibt keinen separaten Full-Release-Validation-
Workflow-Ref-Input; wählen Sie den vertrauenswürdigen Harness, indem Sie den Workflow-Run-Ref wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für exakten Commit-Nachweis auf einem sich bewegenden `main`;
reine Commit-SHAs können keine Workflow-Dispatch-Refs sein. Verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den gepinnten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite advisory Provider-/Medienabdeckung

Verwenden Sie `run_release_soak=true` mit `stable`, wenn die release-blockierenden Lanes
grün sind und Sie vor der Promotion den erschöpfenden Live-/E2E-, Docker-Release-Pfad- und
begrenzten veröffentlichten Upgrade-Survivor-Sweep ausführen möchten. Dieser Sweep deckt
die neuesten vier stabilen Pakete plus gepinnte `2026.4.23`- und `2026.5.2`-
Baselines sowie ältere `2026.4.15`-Abdeckung ab, wobei doppelte Baselines entfernt und
jede Baseline in einen eigenen Docker-Runner-Job geshardet wird. `full` impliziert
`run_release_soak=true`.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den Ziel-
Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt in Cross-OS-,
Package-Acceptance- und Release-Pfad-Docker-Checks erneut, wenn Soak läuft. Dadurch bleiben
alle paketbezogenen Boxen auf denselben Bytes und wiederholte Paket-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane
Paketinstallation, Onboarding, Gateway-Start und eine Live-Agent-Antwort nachweist,
anstatt das langsamste Standardmodell zu benchmarken. Die breitere Live-Provider-
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

Verwenden Sie den vollständigen Umbrella nicht als ersten Rerun nach einem gezielten Fix. Wenn eine Box
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job,
die Docker-Lane, das Paketprofil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella erst erneut aus, wenn
der Fix gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise
veraltet gemacht hat. Der abschließende Verifier des Umbrellas prüft die aufgezeichneten untergeordneten Workflow-Run-
IDs erneut. Nachdem ein untergeordneter Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Übergeben Sie für begrenzte Wiederherstellung `rerun_group` an den Umbrella. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur das normale untergeordnete CI aus, `plugin-prerelease`
führt nur das release-spezifische untergeordnete Plugin aus, `release-checks` führt jede Release-
Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Gezielte `npm-telegram`-Reruns erfordern `npm_telegram_package_spec`; full/all-Läufe
mit `release_profile=full` verwenden das Package-Artefakt der Release-Checks. Gezielte
Cross-OS-Reruns können `cross_os_suite_filter=windows/packaged-upgrade` oder
einen anderen OS-/Suite-Filter hinzufügen. QA-Release-Check-Fehler sind advisory; ein nur QA-bezogener
Fehler blockiert die Release-Validierung nicht.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete `CI`-Workflow. Manuelles CI umgeht absichtlich
Changed-Scoping und erzwingt den normalen Testgraphen für den Release-
Candidate: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Checks, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um die Frage zu beantworten: „Hat der Source-Tree die vollständige normale Testsuite bestanden?“
Sie ist nicht dasselbe wie Release-Pfad-Produktvalidierung. Zu sichernde Nachweise:

- `Full Release Validation`-Zusammenfassung mit der URL des ausgelösten `CI`-Laufs
- grüner `CI`-Lauf auf dem exakten Ziel-SHA
- fehlgeschlagene oder langsame Shard-Namen aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Lauf Performance-Analyse benötigt

Führen Sie manuelles CI direkt nur aus, wenn das Release deterministisches normales CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Paket-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box lebt in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-
`install-smoke`-Workflow. Sie validiert den Release-Candidate über paketierte
Docker-Umgebungen statt nur über Tests auf Source-Ebene.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamen Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-,
  Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate install-smoke-
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
- Live-/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Checks
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Verwenden Sie für gezielte Wiederherstellung
`docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, anstatt
alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten frühere
`package_artifact_run_id`- und vorbereitete Docker-Image-Inputs, wenn verfügbar, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest und Docker-
Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane anhand des agentischen Parity-Packs
  mit der Opus-4.6-Baseline vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um die Frage zu beantworten: „Verhält sich das Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Parity-, Matrix- und Telegram-
Lanes auf, wenn Sie das Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller geshardeter QA-Lab-Lauf verfügbar und ist nicht die standardmäßige release-kritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird von
`Package Acceptance` und dem Resolver
`scripts/resolve-openclaw-package-candidate.mjs` unterstützt. Der Resolver normalisiert einen
Candidate in den `package-under-test`-Tarball, der von Docker-E2E konsumiert wird, validiert
das Paketinventar, zeichnet Paketversion und SHA-256 auf und hält den
Workflow-Harness-Ref vom Paket-Source-Ref getrennt.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: packt einen vertrauenswürdigen `package_ref`-Branch, ein Tag oder einen vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness
- `source=url`: lädt ein HTTPS-`.tgz` mit erforderlichem `package_sha256` herunter
- `source=artifact`: verwendet ein von einem anderen GitHub-Actions-Lauf hochgeladenes `.tgz` wieder

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Package-Artefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update,
konfigurierten Auth-Update-Neustart, Live-ClawHub-Skill-Installation, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-
Fixtures, Plugin-Update und Telegram-Paket-QA gegen denselben aufgelösten
Tarball. Blockierende Release-Checks verwenden die standardmäßige neueste veröffentlichte Paket-
Baseline; `run_release_soak=true` oder
`release_profile=full` erweitert dies auf jede stabile npm-veröffentlichte Baseline von
`2026.4.23` bis `latest` plus gemeldete Issue-Fixtures. Verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Candidate oder
`source=ref`/`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der
Veröffentlichung. Es ist der GitHub-native
Ersatz für den Großteil der Paket-/Update-Abdeckung, die zuvor
Parallels erforderte. Cross-OS-Release-Checks bleiben wichtig für OS-spezifisches Onboarding,
Installer- und Plattformverhalten, aber Paket-/Update-Produktvalidierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn
Sie entscheiden, welche lokale, Docker-, Package Acceptance- oder Release-Check-Lane
eine Plugin-Installation/ein Plugin-Update, eine Doctor-Bereinigung oder eine
Migrationsänderung für veröffentlichte Pakete nachweist. Die vollständige Migration
veröffentlichter Updates aus jedem stabilen Paket ab `2026.4.23+` ist ein separater
manueller `Update Migration`-Workflow und nicht Teil der Full Release CI.

Die Nachsicht für Legacy-Package-Acceptance ist absichtlich zeitlich begrenzt.
Pakete bis einschließlich `2026.4.25` dürfen den Kompatibilitätspfad für
Metadatenlücken verwenden, die bereits in npm veröffentlicht wurden: private
QA-Inventareinträge, die im Tarball fehlen, fehlendes `gateway install --wrapper`,
fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes
persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze,
fehlende Persistenz von Marketplace-Installationsdatensätzen und Migration von
Konfigurationsmetadaten während `plugins update`. Das veröffentlichte Paket
`2026.4.26` darf Warnungen für lokale Build-Metadaten-Stempeldateien ausgeben,
die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen
Paketverträge erfüllen; dieselben Lücken lassen die Release-Validierung fehlschlagen.

Verwenden Sie breitere Package Acceptance-Profile, wenn sich die Release-Frage
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

Häufige Paketprofile:

- `smoke`: schnelle Lanes für Paketinstallation, Kanal/Agent, Gateway-Netzwerk
  und Neuladen der Konfiguration
- `package`: Installations-/Update-/Neustart-/Plugin-Paketverträge plus Live-Nachweis
  der ClawHub-Skill-Installation; dies ist die Standardeinstellung für Release-Checks
- `product`: `package` plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: genaue `docker_lanes`-Liste für fokussierte Wiederholungen

Aktivieren Sie für Telegram-Nachweise von Paketkandidaten `telegram_mode=mock-openai`
oder `telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt
den aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für
Prüfungen nach der Veröffentlichung.

## Release-Veröffentlichungsautomatisierung

`OpenClaw Release Publish` ist der normale verändernde Einstiegspunkt für
Veröffentlichungen. Er orchestriert die Trusted-Publisher-Workflows in der Reihenfolge,
die das Release benötigt:

1. Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Überprüfen, dass der Tag von `main` oder `release/*` erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und derselben SHA auslösen.
6. `OpenClaw NPM Release` mit dem Release-Tag, npm-dist-tag und der gespeicherten
   `preflight_run_id` auslösen.

Beispiel für Beta-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabile Veröffentlichung mit dem standardmäßigen Beta-dist-tag:

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

Verwenden Sie die niedrigeren Workflows `Plugin NPM Release` und
`Plugin ClawHub Release` nur für fokussierte Reparatur- oder Neuveröffentlichungsarbeit.
Übergeben Sie für eine ausgewählte Plugin-Reparatur `plugin_publish_scope=selected`
und `plugins=@openclaw/name` an `OpenClaw Release Publish`, oder lösen Sie den
untergeordneten Workflow direkt aus, wenn das OpenClaw-Paket nicht veröffentlicht
werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true` ist, darf dies für einen
  nur validierenden Preflight auch die aktuelle vollständige 40-stellige
  Commit-SHA des Workflow-Branches sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der
  Workflow den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf
  wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; standardmäßig `beta`

`OpenClaw Release Publish` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Lauf-ID;
  erforderlich, wenn `publish_openclaw_npm=true` ist
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: standardmäßig `all-publishable`; verwenden Sie
  `selected` nur für fokussierte Reparaturarbeit
- `plugins`: kommagetrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected` ist
- `publish_openclaw_npm`: standardmäßig `true`; setzen Sie dies nur dann auf
  `false`, wenn Sie den Workflow als reinen Plugin-Reparatur-Orchestrator verwenden

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA, die validiert werden soll.
  Prüfungen mit Secrets erfordern, dass der aufgelöste Commit von einem
  OpenClaw-Branch oder Release-Tag erreichbar ist.
- `run_release_soak`: aktiviert exhaustive Live-/E2E-, Docker-Release-Pfad-
  und All-Since-Upgrade-Survivor-Soak-Prüfungen bei stabilen/standardmäßigen
  Release-Checks. Wird durch `release_profile=full` erzwungen.

Regeln:

- Stabile und Korrektur-Tags dürfen entweder nach `beta` oder nach `latest`
  veröffentlichen
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA
  nur erlaubt, wenn `preflight_only=true` ist
- `OpenClaw Release Checks` und `Full Release Validation` sind immer
  ausschließlich Validierungen
- Der echte Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden, das
  während des Preflights verwendet wurde; der Workflow überprüft diese Metadaten,
  bevor die Veröffentlichung fortgesetzt wird

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release erstellen:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, dürfen Sie die aktuelle vollständige Commit-SHA
     des Workflow-Branches für einen nur validierenden Trockenlauf des
     Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder
   `latest` nur dann, wenn Sie bewusst eine direkte stabile Veröffentlichung
   wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder
   der vollständigen Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache,
   Docker, QA Lab, Matrix und Telegram-Abdeckung aus einem manuellen Workflow
   wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen,
   führen Sie stattdessen den manuellen `CI`-Workflow auf der Release-Referenz aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben
   `npm_dist_tag` und der gespeicherten `preflight_run_id` aus; dies veröffentlicht
   externalisierte Plugins nach npm und ClawHub, bevor das OpenClaw-npm-Paket
   promotet wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten Workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` nach `latest` zu promoten
8. Wenn das Release bewusst direkt nach `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide dist-tags auf die stabile Version zu setzen, oder lassen
   Sie dessen geplante Selbstheilungssynchronisierung `beta` später verschieben

Die dist-tag-Mutation liegt aus Sicherheitsgründen im privaten Repository, weil
sie weiterhin `NPM_TOKEN` erfordert, während das öffentliche Repository
ausschließlich OIDC-Veröffentlichung beibehält.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der
Beta-zuerst-Promotion-Pfad dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen
Sie alle 1Password-CLI-(`op`-)Befehle nur innerhalb einer dedizierten tmux-Sitzung
aus. Rufen Sie `op` nicht direkt aus der Haupt-Agent-Shell auf; wenn es in tmux
bleibt, sind Prompts, Warnungen und OTP-Handling beobachtbar und wiederholte
Host-Warnungen werden vermieden.

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
