---
read_when:
    - Suche nach Definitionen für öffentliche Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suchen Sie nach Versionsbenennung und Veröffentlichungsrhythmus
    - Planung monatlicher Support- oder LTS-Release-Linien
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung, geplante monatliche Support-Linien und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-07T01:53:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Lanes:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der sich bewegende Stand von `main`

## Versionsbenennung

- Stable-Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Legacy-Stable-Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen versehen
- `latest` bezeichnet das aktuell hochgestufte stabile npm-Release
- `beta` bezeichnet das aktuelle Beta-Installationsziel
- Stable- und Legacy-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können ausdrücklich `latest` als Ziel wählen oder später einen geprüften Beta-Build hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, wobei
  Build/Signierung/Notarisierung der Mac-App für Stable reserviert bleiben, sofern sie nicht ausdrücklich angefordert werden

### Geplante monatliche Support-Versionierung

OpenClaw hat noch keinen LTS- oder monatlichen Support-Kanal. Maintainer arbeiten
auf SemVer-kompatible monatliche Support-Linien hin, aber die heute ausgelieferten
Update-Kanäle sind weiterhin `stable`, `beta` und `dev`.

Das geplante Versionsformat ist `YYYY.M.PATCH`:

- `YYYY` ist das Jahr.
- `M` ist die monatliche Release-Linie ohne führende Null.
- `PATCH` wird innerhalb dieser monatlichen Linie erhöht und kann so hoch wie nötig werden.

Beispielsweise würden `2026.6.0`, `2026.6.1` und `2026.6.2` alle zur Juni-
2026-Linie gehören. Ein zukünftiges monatliches Support-Dist-Tag wie `stable-2026-6` oder
`lts-2026-6` kann auf diese Linie zeigen, während `latest` weiterhin schnell weiterläuft.

Dieses zukünftige Modell ersetzt die Notwendigkeit neuer `YYYY.M.D-N`-Korrektur-Releases.
Bestehende Legacy-Korrekturversionen bleiben weiterhin anerkannt, damit ältere Pakete und
Upgrade-Pfade funktionsfähig bleiben.

## Release-Taktung

- Releases bewegen sich zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise aus einem `release/YYYY.M.D`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Fehlerbehebungen die neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und eine Korrektur benötigt, erstellen Maintainer
  das nächste `-beta.N`-Tag, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Prozedur, Genehmigungen, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, Dist-Tag-Wiederherstellung und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neuesten Stand pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle `main`-CI ausreichend grün ist, um davon zu branchen.
2. Den obersten Abschnitt in `CHANGELOG.md` aus der realen Commit-Historie mit
   `/changelog` neu schreiben, Einträge benutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren, warum sie
   absichtlich beibehalten wird.
4. `release/YYYY.M.D` aus dem aktuellen `main` erstellen; normale Release-Arbeit nicht
   direkt auf `main` durchführen.
5. Jede erforderliche Versionsstelle für das beabsichtigte Tag erhöhen, dann
   `pnpm plugins:sync` ausführen, damit veröffentlichbare Plugin-Pakete die Release-
   Version und Kompatibilitätsmetadaten teilen, anschließend den lokalen deterministischen Preflight ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` und
   `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branches für reine Validierungs-
   Preflights zulässig. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA starten. Dies ist der einzige manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch korrigieren und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, Provider- oder Modell-Allowlist erneut ausführen, die
   die Korrektur belegt. Das vollständige Umbrella-Set nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Beta `vYYYY.M.D-beta.N` taggen und dann `OpenClaw Release Publish` aus
   dem passenden `release/YYYY.M.D`-Branch ausführen. Es verifiziert `pnpm plugins:sync:check`,
   dispatcht alle veröffentlichbaren Plugin-Pakete parallel an npm und dieselbe Menge an
   ClawHub und stuft dann das vorbereitete OpenClaw-npm-Preflight-
   Artefakt mit dem passenden Dist-Tag hoch, sobald die Plugin-npm-Veröffentlichung erfolgreich ist.
   Die ClawHub-Veröffentlichung kann noch laufen, während OpenClaw npm veröffentlicht, aber der
   Release-Publish-Workflow endet erst, wenn beide Plugin-Veröffentlichungspfade und
   der OpenClaw-npm-Veröffentlichungspfad erfolgreich abgeschlossen sind. Nach der Veröffentlichung die
   Post-Publish-Paket-
   Acceptance gegen das veröffentlichte Paket `openclaw@YYYY.M.D-beta.N` oder
   `openclaw@beta` ausführen. Wenn ein gepushtes oder veröffentlichtes Prerelease eine Korrektur benötigt,
   die nächste passende Prerelease-Nummer erstellen; das alte
   Prerelease nicht löschen oder umschreiben.
10. Für Stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die Stable-npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` erneut; die Release-Bereitschaft für Stable macOS erfordert außerdem die
    paketierten Dateien `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifier ausführen, optional ein eigenständiges
    Published-npm-Telegram-E2E, wenn Sie einen Post-Publish-Kanalnachweis benötigen,
    Dist-Tag-Hochstufung bei Bedarf, GitHub-Release-/Prerelease-Notes aus dem
    vollständigen passenden Abschnitt in `CHANGELOG.md` und die Release-Ankündigungs-
    schritte.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Prüfungen auf Importzyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-Validierungsschritt vorhanden sind
- Führen Sie `pnpm plugins:sync` nach dem Root-Versions-Bump und vor dem Taggen aus. Es aktualisiert veröffentlichbare Plugin-Paketversionen, OpenClaw-Peer/API-Kompatibilitätsmetadaten, Build-Metadaten und Plugin-Changelog-Stubs passend zur Core-Release-Version. `pnpm plugins:sync:check` ist der nicht verändernde Release-Wächter; der Veröffentlichungsworkflow schlägt vor jeder Registry-Mutation fehl, wenn dieser Schritt vergessen wurde.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um alle Pre-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, dispatcht manuell `CI` und dispatcht `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stabile/Default-Läufe halten exhaustive Live/E2E- und Docker-Release-Pfad-Soak hinter `run_release_soak=true`; `release_profile=full` erzwingt Soak. Mit `release_profile=full` und `rerun_group=all` führt er außerdem Package-Telegram-E2E gegen das Artefakt `release-package-under-test` aus den Release Checks aus. Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dieselbe Telegram-E2E-Prüfung auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance seine Paket/Update-Matrix gegen das ausgelieferte npm-Paket statt gegen das aus der SHA gebaute Artefakt ausführen soll. Geben Sie `evidence_package_spec` an, wenn der private Evidenzbericht nachweisen soll, dass die Validierung zu einem veröffentlichten npm-Paket passt, ohne Telegram-E2E zu erzwingen. Beispiel: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie während fortlaufender Release-Arbeiten Side-Channel-Nachweise für einen Paketkandidaten wünschen. Verwenden Sie `source=npm` für `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`, um einen vertrauenswürdigen `package_ref`-Branch/Tag/SHA mit dem aktuellen `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen Tarball erneut und kann Telegram-QA gegen denselben Tarball mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket sowohl als installierte CLI als auch als Package-under-Test, sodass der Managed-Restart-Pfad des Update-Befehls des Kandidaten ausgeübt wird.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Install-/Channel-/Agent-, Gateway-Netzwerk- und Config-Reload-Lanes
  - `package`: paketnative Artefakt-/Update-/Restart-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Channels, Cron/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten Wiederholungslauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen das Changed-Scoping und erzwingen die Linux-Node-Shards, Bundled-Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Android und Control-UI-i18n-Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt QA-Lab über einen lokalen OTLP/HTTP-Receiver aus und verifiziert die exportierten Trace-Span-Namen, begrenzten Attribute sowie Inhalts-/Identifier-Redaktion, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die verändernde Veröffentlichungssequenz aus, nachdem das Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` (oder `main`, wenn ein von main erreichbares Tag veröffentlicht wird), übergeben Sie das Release-Tag und die erfolgreiche OpenClaw-npm-`preflight_run_id`, und behalten Sie den Standard-Plugin-Publish-Scope `all-publishable` bei, sofern Sie nicht bewusst eine fokussierte Reparatur ausführen. Der Workflow serialisiert Plugin-npm-Publish, Plugin-ClawHub-Publish und OpenClaw-npm-Publish, damit das Core-Paket nicht vor seinen externalisierten Plugins veröffentlicht wird.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem vor der Release-Freigabe die QA-Lab-Mock-Paritätslane sowie das schnelle Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständigen Matrix-Transport, Medien und E2EE-Inventar parallel wünschen.
- Cross-OS-Install- und Upgrade-Runtime-Validierung ist Teil der öffentlichen `OpenClaw Release Checks` und `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz, deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer eigenen Lane bleiben, damit sie Publish nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release Validation` oder vom `main`-/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, solange der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der nur validierende Preflight von `OpenClaw NPM Release` akzeptiert außerdem die aktuelle vollständige 40-Zeichen-Commit-SHA des Workflow-Branches, ohne ein gepushtes Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung promoted werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die Paketmetadatenprüfung; echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows halten den echten Publish- und Promotion-Pfad auf GitHub-gehosteten Runnern, während der nicht verändernde Validierungspfad die größeren Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` aus und verwendet dabei sowohl die Workflow-Secrets `OPENAI_API_KEY` als auch `ANTHROPIC_API_KEY`
- npm-Release-Preflight wartet nicht mehr auf die separate Release-Checks-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach npm-Publish `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-Installationspfad in einem frischen temporären Prefix zu verifizieren
- Führen Sie nach einem Beta-Publish `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um Installed-Package-Onboarding, Telegram-Setup und echte Telegram-E2E gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Credential-Pool zu verifizieren. Lokale Maintainer-Einmalläufe können die Convex-Variablen weglassen und die drei `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einer Maintainer-Maschine auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, dispatcht `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über den manuellen Workflow `NPM Telegram Beta E2E` aus GitHub Actions ausführen. Er ist absichtlich nur manuell und läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - echte npm-Veröffentlichung muss von demselben `main`- oder `release/YYYY.M.D`-Branch dispatcht werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Eingabe explizit `latest` ansteuern
  - tokenbasierte npm-dist-tag-Mutation liegt jetzt aus Sicherheitsgründen in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das öffentliche Repo OIDC-only Publish beibehält
  - öffentlicher `macOS Release` dient nur der Validierung; wenn ein Tag nur auf einem Release-Branch liegt, der Workflow aber von `main` dispatcht wird, setzen Sie `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-`preflight_run_id` und `validate_run_id` bestehen
  - die echten Publish-Pfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Für ältere stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier außerdem denselben Temp-Prefix-Upgrade-Pfad von `YYYY.M.D` auf `YYYY.M.D-N`, damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem stabilen Basis-Payload belassen
- npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält, damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Entrypoints und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, dem Plugin-Runtime-Payloads fehlen, schlägt im Postpublish-Verifier fehl und kann nicht auf `latest` promoted werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliche Pack-Aufblähung vor dem Release-Publish-Pfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder Extension-Testmatrizen berührt hat, generieren und prüfen Sie vor der Freigabe die vom Planner besessenen `plugin-prerelease-extension-shard`-Matrixausgaben aus `.github/workflows/plugin-prerelease.yml`, damit Release Notes kein veraltetes CI-Layout beschreiben
- Stabile macOS-Release-Bereitschaft umfasst außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die gepackten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach dem Publish auf die neue stabile Zip verweisen
  - die gepackte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist die Methode, mit der Betreiber alle Pre-Release-Tests über einen Einstiegspunkt starten. Für einen gepinnten Commit-Nachweis auf einem sich schnell bewegenden Branch verwenden Sie den Helper, damit jeder Child-Workflow von einem temporären Branch läuft, der auf die Ziel-SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation` von diesem Branch mit `ref=<sha>`, verifiziert, dass jede Child-Workflow-`headSha` dem Ziel entspricht, und löscht dann den temporären Branch. Dadurch wird vermieden, versehentlich einen neueren `main`-Child-Lauf nachzuweisen.

Für Release-Branch- oder Tag-Validierung führen Sie ihn vom vertrauenswürdigen `main`-Workflow-Ref aus und übergeben den Release-Branch oder das Tag als `ref`:

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
übergeordnetes `release-package-under-test`-Artefakt für paketbezogene Checks vor und
startet eigenständige Paket-Telegram-E2E, wenn `release_profile=full` mit
`rerun_group=all` verwendet wird oder wenn `npm_telegram_package_spec` gesetzt ist. `OpenClaw Release
Checks` fächert dann in Install-Smoke, Cross-OS-Release-Checks, Live/E2E-Docker-
Release-Pfad-Abdeckung bei aktiviertem Soak, Package Acceptance mit Telegram-
Paket-QA, QA-Lab-Parität, Live Matrix und Live Telegram auf. Ein vollständiger Lauf ist nur akzeptabel, wenn die
Zusammenfassung von `Full Release Validation`
`normal_ci` und `release_checks` als erfolgreich ausweist. Im Full/All-Modus
muss auch das untergeordnete `npm_telegram` erfolgreich sein; außerhalb von Full/All wird es übersprungen,
sofern kein veröffentlichtes `npm_telegram_package_spec` angegeben wurde. Die abschließende
Verifier-Zusammenfassung enthält Tabellen mit den langsamsten Jobs für jeden untergeordneten Lauf, damit der Release-
Manager den aktuellen kritischen Pfad sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Stufenmatrix, die exakten Workflow-Jobnamen, Unterschiede zwischen stabilem und vollständigem Profil,
Artefakte und gezielte Wiederholungshandles.
Untergeordnete Workflows werden von der vertrauenswürdigen Ref gestartet, die `Full Release
Validation` ausführt, normalerweise `--ref main`, selbst wenn die Ziel-`ref` auf einen
älteren Release-Branch oder Tag zeigt. Es gibt keine separate Full-Release-Validation-
Workflow-Ref-Eingabe; wählen Sie das vertrauenswürdige Harness, indem Sie die Ref des Workflow-Laufs wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht als exakten Commit-Nachweis auf einem beweglichen `main`;
rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein. Verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den gepinnten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live/Provider-Breite auszuwählen:

- `minimum`: schnellster releasekritischer OpenAI/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite Advisory-Provider/Medien-Abdeckung

Verwenden Sie `run_release_soak=true` mit `stable`, wenn die releaseblockierenden Lanes
grün sind und Sie vor der Promotion den vollständigen Live/E2E-, Docker-Release-Pfad- und
begrenzten veröffentlichten Upgrade-Survivor-Sweep wünschen. Dieser Sweep deckt
die neuesten vier stabilen Pakete plus gepinnte Baselines `2026.4.23` und `2026.5.2`
sowie ältere `2026.4.15`-Abdeckung ab, wobei doppelte Baselines entfernt werden und
jede Baseline in einen eigenen Docker-Runner-Job geshardet wird. `full` impliziert
`run_release_soak=true`.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die Ziel-
Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt in Cross-OS-,
Package-Acceptance- und Release-Pfad-Docker-Checks erneut, wenn Soak läuft. Dadurch bleiben
alle paketbezogenen Boxen auf denselben Bytes und wiederholte Paket-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane
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

Verwenden Sie das vollständige Umbrella nicht als erste Wiederholung nach einer gezielten Korrektur. Wenn eine Box
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job, die Docker-Lane, das Paketprofil, den Modell-
Provider oder die QA-Lane. Führen Sie das vollständige Umbrella nur dann erneut aus, wenn
die Korrektur die gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Nachweise
veraltet gemacht hat. Der abschließende Verifier des Umbrellas prüft die aufgezeichneten untergeordneten Workflow-Run-
IDs erneut. Nachdem ein untergeordneter Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an das Umbrella. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur den normalen CI-Child aus, `plugin-prerelease`
führt nur den releasebezogenen Plugin-Child aus, `release-checks` führt jede Release-
Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Gezielte `npm-telegram`-Wiederholungen erfordern `npm_telegram_package_spec`; Full/All-Läufe
mit `release_profile=full` verwenden das Paketartefakt aus den Release-Checks. Gezielte
Cross-OS-Wiederholungen können `cross_os_suite_filter=windows/packaged-upgrade` oder
einen anderen OS/Suite-Filter hinzufügen. QA-Release-Check-Fehler sind beratend; ein reiner QA-
Fehler blockiert die Release-Validierung nicht.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete `CI`-Workflow. Manuelle CI umgeht absichtlich
Changed-Scoping und erzwingt den normalen Testgraphen für den Release-
Candidate: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-
Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Checks, Python-
Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Quellbaum die vollständige normale Testsuite bestanden?“
Sie ist nicht dasselbe wie Produktvalidierung des Release-Pfads. Aufzubewahrende Nachweise:

- `Full Release Validation`-Zusammenfassung, die die URL des gestarteten `CI`-Laufs zeigt
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
`openclaw-live-and-e2e-checks-reusable.yml` plus den Release-Modus-
`install-smoke`-Workflow. Sie validiert den Release Candidate durch paketierte
Docker-Umgebungen statt nur durch Tests auf Quelltextebene.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamem Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-,
  Root/Gateway- und Installer/Bun-Smoke-Jobs als separate Install-Smoke-
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
- aufgeteilte Install/Uninstall-Lanes für gebündelte Plugins
  `bundled-plugin-install-uninstall-0` bis
  `bundled-plugin-install-uninstall-23`
- Live/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Checks
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte, bevor Sie erneut ausführen. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Wiederholungsbefehlen hoch. Für gezielte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow, statt
alle Release-Chunks erneut auszuführen. Generierte Wiederholungsbefehle enthalten, wenn verfügbar, vorherige
`package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest- und Docker-
Paketmechanik.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane mit der Opus-4.6-
  Baseline mithilfe des agentischen Parity Packs vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Paritäts-, Matrix- und Telegram-
Lanes auf, wenn Sie das Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller geshardeter QA-Lab-Lauf verfügbar und ist nicht die standardmäßige releasekritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird durch
`Package Acceptance` und den Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen
Candidate in den `package-under-test`-Tarball, der von Docker E2E verwendet wird, validiert
das Paketinventar, zeichnet Paketversion und SHA-256 auf und hält die
Workflow-Harness-Ref getrennt von der Paketquell-Ref.

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
Neustart bei konfigurierter Authentifizierung nach Update, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-
Fixtures, Plugin-Update und Telegram-Paket-QA gegen denselben aufgelösten
Tarball. Blockierende Release-Checks verwenden die standardmäßige neueste veröffentlichte Paket-
Baseline; `run_release_soak=true` oder
`release_profile=full` erweitert auf jede stabile npm-veröffentlichte Baseline von
`2026.4.23` bis `latest` plus gemeldete Issue-Fixtures. Verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Candidate oder
`source=ref`/`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der
Veröffentlichung. Es ist der GitHub-native
Ersatz für den Großteil der Paket/Update-Abdeckung, die zuvor
Parallels erforderte. Cross-OS-Release-Checks bleiben für OS-spezifisches Onboarding,
Installer- und Plattformverhalten wichtig, aber Paket/Update-Produktvalidierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn
Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine
Plugin-Installation/ein Plugin-Update, Doctor-Bereinigung oder eine Migrationsänderung eines veröffentlichten Pakets nachweist.
Die vollständige veröffentlichte Update-Migration aus jedem stabilen `2026.4.23+`-Paket ist
ein separater manueller `Update Migration`-Workflow und nicht Teil von Full Release CI.

Die ältere Nachsicht bei der Paketakzeptanz ist absichtlich zeitlich begrenzt. Pakete bis
`2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits
auf npm veröffentlicht wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien in der aus dem Tarball abgeleiteten Git-Fixture,
fehlendes persistiertes `update.channel`, ältere Speicherorte für Plugin-Installationsdatensätze,
fehlende Persistenz von Marketplace-Installationsdatensätzen und Migration von Konfigurationsmetadaten
während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf für lokale Build-Metadaten-Stempeldateien
warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Paketverträge erfüllen;
dieselben Lücken lassen die Release-Validierung fehlschlagen.

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

- `smoke`: schnelle Lanes für Paketinstallation, Kanal/Agent, Gateway-Netzwerk und
  Neuladen der Konfiguration
- `package`: Installations-, Aktualisierungs-, Neustart- und Plugin-Paketverträge ohne live
  ClawHub; dies ist der Standard für Release-Prüfungen
- `product`: `package` plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche
  und OpenWebUI
- `full`: Docker-Release-Pfad-Blöcke mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Wiederholungen

Für Telegram-Nachweise zu Paketkandidaten aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` bei der Paketakzeptanz. Der Workflow übergibt den
aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Automatisierung der Release-Veröffentlichung

`OpenClaw Release Publish` ist der normale verändernde Einstiegspunkt für Veröffentlichungen. Er
orchestriert die Trusted-Publisher-Workflows in der für das Release erforderlichen Reihenfolge:

1. Den Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Prüfen, dass der Tag von `main` oder `release/*` erreichbar ist.
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

Stabile Veröffentlichung auf den standardmäßigen Beta-Dist-Tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Die stabile Hochstufung direkt auf `latest` ist explizit:

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

## npm-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true` ist, darf dies auch die aktuelle
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
- `plugins`: kommagetrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected` ist
- `publish_openclaw_npm`: Standard ist `true`; setzen Sie `false` nur, wenn Sie den
  Workflow als reinen Plugin-Reparatur-Orchestrator verwenden

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA zur Validierung. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.
- `run_release_soak`: exhaustive Live-/E2E-, Docker-Release-Pfad- und
  All-since-Upgrade-Survivor-Soak bei stabilen/standardmäßigen Release-Prüfungen aktivieren. Er wird
  durch `release_profile=full` erzwungen.

Regeln:

- Stable- und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe einer vollständigen Commit-SHA nur zulässig, wenn
  `preflight_only=true` ist
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer
  nur der Validierung
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflights verwendet wurde;
  der Workflow prüft diese Metadaten vor der Veröffentlichung weiterhin

## Stabile npm-Release-Sequenz

Wenn Sie ein stabiles npm-Release erstellen:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, dürfen Sie die aktuelle vollständige Commit-SHA des Workflow-Branches
     für einen reinen Validierungs-Trockenlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur dann,
   wenn Sie absichtlich eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix- und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie absichtlich nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Referenz aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`
   und der gespeicherten `preflight_run_id` aus; dies veröffentlicht externalisierte Plugins auf npm
   und ClawHub, bevor das OpenClaw-npm-Paket hochgestuft wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-Workflow,
   um diese stabile Version von `beta` auf `latest` hochzustufen
8. Wenn das Release absichtlich direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie die geplante
   Selbstheilungs-Synchronisierung `beta` später verschieben

Die Dist-Tag-Änderung liegt aus Sicherheitsgründen im privaten Repository, da sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repository reine OIDC-Veröffentlichung beibehält.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Hochstufungspfad
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen Sie alle 1Password
CLI-(`op`)-Befehle nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op`
nicht direkt aus der Haupt-Agent-Shell auf; die Ausführung in tmux macht Prompts,
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
für das eigentliche Runbook.

## Verwandt

- [Release-Kanäle](/de/install/development-channels)
