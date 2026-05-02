---
read_when:
    - Suche nach Definitionen öffentlicher Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suchen Sie Informationen zu Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-05-02T21:01:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat vier öffentliche Release-Lanes:

- stable: getaggte Releases, die standardmäßig nach npm `beta` veröffentlichen oder nach npm `latest`, wenn dies ausdrücklich angefordert wird
- alpha: Prerelease-Tags, die nach npm `alpha` veröffentlichen
- beta: Prerelease-Tags, die nach npm `beta` veröffentlichen
- dev: der bewegliche Head von `main`

## Versionsbenennung

- Stabile Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stabile Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Alpha-Prerelease-Version: `YYYY.M.D-alpha.N`
  - Git-Tag: `vYYYY.M.D-alpha.N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen schreiben
- `latest` bedeutet das aktuell promotete stabile npm-Release
- `alpha` bedeutet das aktuelle Alpha-Installationsziel
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrektur-Releases veröffentlichen standardmäßig nach npm `beta`; Release-Operatoren können ausdrücklich `latest` als Ziel wählen oder später einen geprüften Beta-Build promoten
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App zusammen aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, wobei
  Build/Signierung/Notarisierung der mac-App für stabile Releases reserviert bleibt, sofern nicht ausdrücklich angefordert

## Release-Rhythmus

- Releases bewegen sich Beta-zuerst
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise von einem `release/YYYY.M.D`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, erstellen Maintainer
  das nächste `-beta.N`-Tag, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detailliertes Release-Verfahren, Freigaben, Anmeldedaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Checkliste für Release-Operatoren

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Anmeldedaten,
Signierung, Notarisierung, Dist-Tag-Wiederherstellung und Details zu Notfall-Rollbacks bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Vom aktuellen `main` starten: neueste Änderungen pullen, bestätigen, dass der Ziel-Commit gepusht ist,
   und bestätigen, dass die aktuelle CI von `main` grün genug ist, um davon zu branchen.
2. Den obersten Abschnitt in `CHANGELOG.md` aus der echten Commit-Historie mit
   `/changelog` neu schreiben, Einträge nutzerorientiert halten, committen, pushen und
   vor dem Branching noch einmal rebasen/pullen.
3. Release-Kompatibilitätseinträge in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts` prüfen. Abgelaufene
   Kompatibilität nur entfernen, wenn der Upgrade-Pfad weiter abgedeckt bleibt, oder dokumentieren, warum sie
   absichtlich beibehalten wird.
4. `release/YYYY.M.D` aus dem aktuellen `main` erstellen; normale Release-Arbeiten nicht
   direkt auf `main` durchführen.
5. Jede erforderliche Versionsstelle für das beabsichtigte Tag erhöhen, dann
   `pnpm plugins:sync` ausführen, damit veröffentlichbare Plugin-Pakete dieselbe Release-
   Version und Kompatibilitätsmetadaten teilen, danach den lokalen deterministischen Preflight ausführen:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` und
   `pnpm release:check`.
6. `OpenClaw NPM Release` mit `preflight_only=true` ausführen. Bevor ein Tag existiert,
   ist ein vollständiger 40-stelliger Release-Branch-SHA für einen nur zur Validierung dienenden
   Preflight erlaubt. Die erfolgreiche `preflight_run_id` speichern.
7. Alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA starten. Dies ist der einzige manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, auf dem Release-Branch fixen und die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, Provider- oder Modell-Allowlist erneut ausführen, die
   den Fix nachweist. Den gesamten Umbrella nur erneut ausführen, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für Alpha oder Beta `vYYYY.M.D-alpha.N` oder `vYYYY.M.D-beta.N` taggen, dann `OpenClaw Release Publish` vom
   passenden `release/YYYY.M.D`-Branch ausführen. Es verifiziert `pnpm plugins:sync:check`,
   veröffentlicht zuerst alle veröffentlichbaren Plugin-Pakete nach npm, veröffentlicht dieselbe
   Menge anschließend nach ClawHub und promotet dann das vorbereitete OpenClaw-npm-Preflight-
   Artefakt mit dem passenden Dist-Tag. Nach der Veröffentlichung die Package-Acceptance nach dem Veröffentlichen
   gegen das veröffentlichte Paket `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` oder `openclaw@beta` ausführen. Wenn ein gepushter oder
   veröffentlichter Prerelease einen Fix benötigt, die nächste passende Prerelease-Nummer erstellen;
   den alten Prerelease nicht löschen oder umschreiben.
10. Für stable nur fortfahren, nachdem die geprüfte Beta oder der Release Candidate die
    erforderlichen Validierungsnachweise hat. Die stabile npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` erneut; die stabile macOS-Release-Bereitschaft erfordert außerdem die
    paketierten `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte `appcast.xml` auf `main`.
11. Nach der Veröffentlichung den npm-Post-Publish-Verifier ausführen, optional eigenständige
    veröffentlichte-npm-Telegram-E2E, wenn Sie Channel-Nachweise nach der Veröffentlichung benötigen,
    Dist-Tag-Promotion bei Bedarf, GitHub-Release-/Prerelease-Notizen aus dem
    vollständigen passenden Abschnitt in `CHANGELOG.md` und die Schritte zur Release-Ankündigung.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript auch außerhalb des schnelleren lokalen `pnpm check`-Gates abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren Importzyklus- und Architekturgrenzenprüfungen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten Release-Artefakte unter `dist/*` und das Control-UI-Bundle für den Pack-Validierungsschritt vorhanden sind
- Führen Sie `pnpm plugins:sync` nach dem Versionssprung im Root und vor dem Tagging aus. Es aktualisiert veröffentlichbare Plugin-Paketversionen, OpenClaw-Peer/API-Kompatibilitätsmetadaten, Build-Metadaten und Plugin-Changelog-Stubs passend zur Core-Release-Version. `pnpm plugins:sync:check` ist der nicht-mutierende Release-Guard; der Veröffentlichungsworkflow schlägt vor jeder Registry-Mutation fehl, wenn dieser Schritt vergessen wurde.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um alle Pre-Release-Testboxen von einem Einstiegspunkt aus zu starten. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, dispatcht manuelles `CI` und dispatcht `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Docker-Release-Path-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix und Telegram-Lanes. Mit `release_profile=full` und `rerun_group=all` führt er außerdem Paket-Telegram-E2E gegen das Artefakt `release-package-under-test` aus den Release-Checks aus. Geben Sie `npm_telegram_package_spec` nach der Veröffentlichung an, wenn dieselbe Telegram-E2E auch das veröffentlichte npm-Paket nachweisen soll. Geben Sie `package_acceptance_package_spec` nach der Veröffentlichung an, wenn Package Acceptance seine Paket/Update-Matrix gegen das ausgelieferte npm-Paket statt gegen das aus dem SHA gebaute Artefakt ausführen soll. Geben Sie `evidence_package_spec` an, wenn der private Evidence-Bericht nachweisen soll, dass die Validierung zu einem veröffentlichten npm-Paket passt, ohne Telegram-E2E zu erzwingen. Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweise für einen Paketkandidaten benötigen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`, um einen vertrauenswürdigen `package_ref`-Branch/Tag/SHA mit dem aktuellen `workflow_ref`-Harness zu packen; `source=url` für einen HTTPS-Tarball mit erforderlichem SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde. Der Workflow löst den Kandidaten zu `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen Tarball erneut und kann Telegram-QA gegen denselben Tarball mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Installations-, Channel/Agent-, Gateway-Netzwerk- und Config-Reload-Lanes
  - `package`: artefaktnative Paket/Update/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Channels, Cron/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Path-Chunks mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für eine fokussierte Wiederholung
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur die vollständige normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Dispatches umgehen Changed-Scoping und erzwingen die Linux-Node-Shards, Bundled-Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Checks, Python-Skills, Windows, macOS, Android und Control-UI-i18n-Lanes.
  Beispiel: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt QA-Lab über einen lokalen OTLP/HTTP-Empfänger aus und verifiziert die exportierten Trace-Span-Namen, begrenzten Attribute und die Redaktion von Inhalten/Bezeichnern, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Führen Sie `OpenClaw Release Publish` für die mutierende Veröffentlichungssequenz aus, nachdem das Tag existiert. Dispatchen Sie ihn von `release/YYYY.M.D` (oder `main`, wenn ein von main erreichbares Tag veröffentlicht wird), übergeben Sie das Release-Tag und die erfolgreiche OpenClaw-npm-`preflight_run_id`, und behalten Sie den Standard-Plugin-Veröffentlichungsumfang `all-publishable` bei, sofern Sie nicht bewusst eine fokussierte Reparatur ausführen. Der Workflow serialisiert die Veröffentlichung von Plugin-npm, Plugin-ClawHub und OpenClaw-npm, damit das Core-Paket nicht vor seinen externalisierten Plugins veröffentlicht wird.
- Release-Checks laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe außerdem die QA-Lab-Mock-Paritäts-Lane plus das schnelle Live-Matrix-Profil und die Telegram-QA-Lane aus. Die Live-Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie den vollständigen Matrix-Transport, Medien und E2EE-Inventar parallel benötigen.
- Cross-OS-Installations- und Upgrade-Laufzeitvalidierung ist Teil der öffentlichen `OpenClaw Release Checks` und `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad bleibt kurz, deterministisch und artefaktfokussiert, während langsamere Live-Checks in ihrer eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Checks mit Secrets sollten über `Full Release Validation` oder vom `main`/Release-Workflow-Ref dispatcht werden, damit Workflow-Logik und Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, solange der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der validierungsreine Preflight `OpenClaw NPM Release` akzeptiert auch den aktuellen vollständigen 40-Zeichen-Commit-SHA des Workflow-Branches, ohne ein gepushtes Tag zu verlangen
- Dieser SHA-Pfad ist nur für die Validierung und kann nicht in eine echte Veröffentlichung befördert werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die Paketmetadatenprüfung; echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows halten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten Runnern, während der nicht-mutierende Validierungspfad die größeren Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` mit den beiden Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Checks-Lane
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (oder das passende Beta/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (oder die passende Beta/Korrektur-Version) aus, um den veröffentlichten Registry-Installationspfad in einem frischen temporären Präfix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um Installed-Package-Onboarding, Telegram-Einrichtung und echte Telegram-E2E gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-Credential-Pool zu verifizieren. Lokale Maintainer-Einmalprüfungen können die Convex-Variablen weglassen und die drei `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials direkt übergeben.
- Maintainer können dieselbe Post-Publish-Prüfung über den manuellen Workflow `NPM Telegram Beta E2E` in GitHub Actions ausführen. Er ist absichtlich nur manuell und läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss vom selben `main`- oder `release/YYYY.M.D`-Branch wie der erfolgreiche Preflight-Lauf dispatcht werden
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Eingabe explizit `latest` ansteuern
  - tokenbasierte npm-Dist-Tag-Mutation befindet sich aus Sicherheitsgründen jetzt in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das öffentliche Repo nur OIDC-Veröffentlichung beibehält
  - öffentliches `macOS Release` dient nur der Validierung; wenn ein Tag nur auf einem Release-Branch existiert, der Workflow aber von `main` dispatcht wird, setzen Sie `public_release_branch=release/YYYY.M.D`
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-`preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier außerdem denselben Upgrade-Pfad mit temporärem Präfix von `YYYY.M.D` zu `YYYY.M.D-N`, damit Release-Korrekturen ältere globale Installationen nicht still auf dem Basis-Stable-Payload belassen können
- Der npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält, damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, dass veröffentlichte Plugin-Einstiegspunkte und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das fehlende Plugin-Runtime-Payloads ausliefert, schlägt im Postpublish-Verifier fehl und kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-`unpackedSize`-Budget für den Kandidaten-Update-Tarball, damit Installer-E2E versehentlichen Pack-Bloat vor dem Release-Veröffentlichungspfad findet
- Wenn die Release-Arbeit CI-Planung, Timing-Manifeste von Erweiterungen oder Testmatrizen von Erweiterungen berührt hat, generieren und prüfen Sie die planer-eigenen `plugin-prerelease-extension-shard`-Matrixausgaben aus `.github/workflows/plugin-prerelease.yml` vor der Freigabe neu, damit Release Notes kein veraltetes CI-Layout beschreiben
- Zur Bereitschaft eines stabilen macOS-Release gehören außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die gepackten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf das neue stabile Zip zeigen
  - die gepackte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist der Weg, wie Operators alle Pre-Release-Tests von einem Einstiegspunkt aus starten. Für einen Pinned-Commit-Nachweis auf einem schnelllebigen Branch verwenden Sie den Helper, damit jeder Child-Workflow von einem temporären Branch läuft, der auf den Ziel-SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation` von diesem Branch mit `ref=<sha>`, verifiziert, dass jeder Child-Workflow-`headSha` dem Ziel entspricht, und löscht dann den temporären Branch. So wird vermieden, versehentlich einen neueren `main`-Child-Lauf nachzuweisen.

Für die Validierung von Release-Branch oder Tag führen Sie ihn vom vertrauenswürdigen `main`-Workflow-Ref aus und übergeben den Release-Branch oder das Tag als `ref`:

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
`target_ref=<release-ref>`, startet `OpenClaw Release Checks` und startet
eigenständige Package-Telegram-E2E, wenn `release_profile=full` mit
`rerun_group=all` verwendet wird oder wenn `npm_telegram_package_spec` gesetzt
ist. `OpenClaw Release Checks` verzweigt dann in Install-Smoke, Cross-OS-Release-Checks, Live-/E2E-Docker-Abdeckung für den Release-Pfad, Package Acceptance mit Telegram-Package-QA, QA-Lab-Parität, Live-Matrix und Live-Telegram. Ein vollständiger Lauf ist nur akzeptabel, wenn die
Zusammenfassung von `Full Release Validation`
`normal_ci` und `release_checks` als erfolgreich ausweist. Im full/all-Modus
muss auch das untergeordnete `npm_telegram` erfolgreich sein; außerhalb von
full/all wird es übersprungen, sofern kein veröffentlichtes
`npm_telegram_package_spec` angegeben wurde. Die abschließende
Verifiziererzusammenfassung enthält Tabellen der langsamsten Jobs für jeden untergeordneten Lauf, sodass die Release-Verantwortlichen den aktuellen kritischen Pfad sehen können, ohne Logs herunterladen zu müssen.
Siehe [vollständige Release-Validierung](/de/reference/full-release-validation) für die
vollständige Phasenmatrix, die exakten Workflow-Jobnamen, Unterschiede zwischen stabilem und vollständigem Profil, Artefakte und gezielte Rerun-Handles.
Untergeordnete Workflows werden von der vertrauenswürdigen Ref gestartet, die
`Full Release Validation` ausführt, normalerweise `--ref main`, selbst wenn die Ziel-`ref` auf einen
älteren Release-Branch oder Tag zeigt. Es gibt keine separate Workflow-Ref-Eingabe für Full Release Validation; wählen Sie das vertrauenswürdige Harness, indem Sie die Ref des Workflow-Laufs wählen.
Verwenden Sie `--ref main -f ref=<sha>` nicht für exakten Commit-Nachweis auf beweglichem `main`;
rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein. Verwenden Sie daher
`pnpm ci:full-release --sha <sha>`, um den angehefteten temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Breite von Live/Provider auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider-/Backend-Abdeckung für Release-Freigabe
- `full`: Stable plus breite Abdeckung für beratende Provider/Medien

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die Ziel-Ref
einmal als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt sowohl in
Docker-Checks für den Release-Pfad als auch in Package Acceptance wieder. Dadurch bleiben alle
package-seitigen Boxen auf denselben Bytes und wiederholte Package-Builds werden vermieden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die
Repo-/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil diese Lane
Package-Installation, Onboarding, Gateway-Start und eine Live-Agent-Runde nachweist,
statt das langsamste Standardmodell zu benchmarken. Die breitere Live-Provider-Matrix
bleibt der Ort für modellspezifische Abdeckung.

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
fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job, Docker-Lane, Package-Profil, Modell-Provider oder QA-Lane. Führen Sie den vollständigen Umbrella nur erneut aus, wenn
der Fix die gemeinsame Release-Orchestrierung geändert oder frühere All-Box-Evidence
veraltet gemacht hat. Der abschließende Verifizierer des Umbrella prüft die aufgezeichneten IDs untergeordneter Workflow-Läufe erneut. Nachdem ein untergeordneter Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen übergeordneten Job
`Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella. `all` ist der echte
Release-Candidate-Lauf, `ci` führt nur das normale CI-Child aus, `plugin-prerelease`
führt nur das release-only Plugin-Child aus, `release-checks` führt jede Release-Box aus, und die engeren Release-Gruppen sind `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`.
Gezielte `npm-telegram`-Reruns erfordern `npm_telegram_package_spec`; full/all-Läufe
mit `release_profile=full` verwenden das Package-Artefakt aus release-checks.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete `CI`-Workflow. Manuelles CI umgeht absichtlich
Changed-Scoping und erzwingt den normalen Testgraphen für den Release
Candidate: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Contracts, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Checks, Python-Skills, Windows, macOS, Android und Control-UI-i18n.

Verwenden Sie diese Box, um zu beantworten: „Hat der Source Tree die vollständige normale Testsuite bestanden?“
Sie ist nicht dasselbe wie Produktvalidierung für den Release-Pfad. Aufzubewahrende Evidence:

- Zusammenfassung von `Full Release Validation`, die die URL des gestarteten `CI`-Laufs zeigt
- grüner `CI`-Lauf auf dem exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn
  ein Lauf Performance-Analyse benötigt

Führen Sie manuelles CI nur direkt aus, wenn der Release deterministisches normales CI benötigt, aber
nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder Package-Boxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` plus dem Release-Modus-Workflow
`install-smoke`. Sie validiert den Release Candidate durch paketierte
Docker-Umgebungen statt nur durch Source-Level-Tests.

Die Docker-Abdeckung für Releases umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamem globalem Bun-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA, wobei QR-,
  Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate Install-Smoke-Shards laufen
- Repository-E2E-Lanes
- Docker-Chunks für den Release-Pfad: `core`, `package-update-openai`,
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
- Live-/E2E-Provider-Suiten und Docker-Live-Modellabdeckung, wenn Release-Checks
  Live-Suiten enthalten

Verwenden Sie Docker-Artefakte vor einem Rerun. Der Release-Pfad-Scheduler lädt
`.artifacts/docker-tests/` mit Lane-Logs, `summary.json`, `failures.json`,
Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch. Für gezielte Wiederherstellung
verwenden Sie `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, statt
alle Release-Chunks erneut auszuführen. Generierte Rerun-Befehle enthalten vorherige
`package_artifact_run_id` und vorbereitete Docker-Image-Eingaben, wenn verfügbar, sodass eine
fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das agentische
Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest und Docker-
Package-Mechanik.

Die QA-Lab-Abdeckung für Releases umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane mit der Opus-4.6-
  Baseline unter Verwendung des agentischen Paritätspakets vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, wenn Release-Telemetrie expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich der Release in QA-Szenarien und
Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für Paritäts-, Matrix- und Telegram-
Lanes auf, wenn Sie den Release freigeben. Vollständige Matrix-Abdeckung bleibt als
manueller, geshardeter QA-Lab-Lauf verfügbar, nicht als standardmäßige release-kritische Lane.

### Package

Die Package-Box ist das Gate für das installierbare Produkt. Sie wird von
`Package Acceptance` und dem Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver normalisiert einen
Candidate in den `package-under-test`-Tarball, der von Docker E2E konsumiert wird, validiert
das Package-Inventar, zeichnet die Package-Version und SHA-256 auf und hält die
Workflow-Harness-Ref getrennt von der Package-Source-Ref.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness packen
- `source=url`: eine HTTPS-`.tgz` mit erforderlichem `package_sha256` herunterladen
- `source=artifact`: eine von einem anderen GitHub-Actions-Lauf hochgeladene `.tgz` wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Package-Artefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` und
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update, Bereinigung veralteter
Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Update und Telegram-
Package-QA gegen denselben aufgelösten Tarball. Die Upgrade-Matrix deckt jede stabil npm-veröffentlichte Baseline von `2026.4.23` bis `latest` ab; verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Candidate oder
`source=ref`/`source=artifact` für einen SHA-gestützten lokalen npm-Tarball vor der
Veröffentlichung. Sie ist der GitHub-native
Ersatz für den Großteil der Package-/Update-Abdeckung, die zuvor Parallels erforderte.
Cross-OS-Release-Checks bleiben für OS-spezifisches Onboarding,
Installer- und Plattformverhalten wichtig, aber Package-/Update-Produktvalidierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn Sie
entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine
Plugin-Installation/ein Plugin-Update, Doctor-Cleanup oder eine veröffentlichte Package-Migrationsänderung nachweist.
Erschöpfende veröffentlichte Update-Migration aus jedem stabilen Package `2026.4.23+` ist
ein separater manueller Workflow `Update Migration` und nicht Teil von Full Release CI.

Legacy-Nachsicht bei Package Acceptance ist absichtlich zeitlich begrenzt. Packages bis
`2026.4.25` dürfen den Kompatibilitätspfad für bereits auf npm veröffentlichte Metadatenlücken
verwenden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-
Fixture, fehlendes persistiertes `update.channel`, Legacy-Plugin-Install-Record-
Speicherorte, fehlende Persistenz von Marketplace-Install-Records und Config-Metadaten-
Migration während `plugins update`. Das veröffentlichte Package `2026.4.26` darf
für bereits ausgelieferte lokale Build-Metadaten-Stamp-Dateien warnen. Spätere Packages
müssen die modernen Package-Verträge erfüllen; dieselben Lücken lassen die Release-
Validierung fehlschlagen.

Verwenden Sie breitere Package-Acceptance-Profile, wenn sich die Release-Frage auf ein
tatsächliches installierbares Package bezieht:

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

- `smoke`: schnelle Package-Install-/Channel-/Agent-, Gateway-Netzwerk- und Config-
  Reload-Lanes
- `package`: Install-/Update-/Plugin-Package-Verträge ohne Live-ClawHub; dies ist der Release-Check-
  Standard
- `product`: `package` plus MCP-Channels, Cron-/Subagent-Cleanup, OpenAI-Web-
  Suche und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für gezielte Reruns

Für den Telegram-Nachweis für Package Candidates aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den
aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Automatisierung der Release-Veröffentlichung

`OpenClaw Release Publish` ist der normale mutierende Einstiegspunkt für Veröffentlichungen. Er
orchestriert die Trusted-Publisher-Workflows in der Reihenfolge, die das Release benötigt:

1. Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Prüfen, ob das Tag von `main` oder `release/*` erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und derselben SHA auslösen.
6. `OpenClaw NPM Release` mit dem Release-Tag, dem npm-Dist-Tag und der
   gespeicherten `preflight_run_id` auslösen.

Beispiel für eine Beta-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Beispiel für eine Alpha-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

Stabile Veröffentlichung mit dem Standard-Beta-Dist-Tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Die stabile Promotion direkt zu `latest` erfolgt ausdrücklich:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Verwenden Sie die untergeordneten Workflows `Plugin NPM Release` und `Plugin ClawHub Release`
nur für gezielte Reparatur- oder erneute Veröffentlichungsarbeiten. Für die Reparatur eines ausgewählten Plugins übergeben Sie
`plugin_publish_scope=selected` und `plugins=@openclaw/name` an
`OpenClaw Release Publish`, oder lösen Sie den Child-Workflow direkt aus, wenn das
OpenClaw-Paket nicht veröffentlicht werden darf.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-alpha.1` oder `v2026.4.2-beta.1`; wenn `preflight_only=true` gilt, kann es auch die aktuelle
  vollständige 40-Zeichen-Commit-SHA des Workflow-Branches für einen rein validierenden Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: auf dem echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standardwert ist `beta`

`OpenClaw Release Publish` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Run-ID;
  erforderlich, wenn `publish_openclaw_npm=true` gilt
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: Standardwert ist `all-publishable`; verwenden Sie `selected` nur
  für gezielte Reparaturarbeiten
- `plugins`: durch Kommas getrennte Paketnamen im Format `@openclaw/*`, wenn
  `plugin_publish_scope=selected` gilt
- `publish_openclaw_npm`: Standardwert ist `true`; setzen Sie dies nur dann auf `false`, wenn der
  Workflow als reiner Plugin-Reparatur-Orchestrator verwendet wird

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständige Commit-SHA, die validiert werden soll. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.

Regeln:

- Stabile Tags und Korrektur-Tags dürfen entweder zu `beta` oder `latest` veröffentlichen
- Alpha-Prerelease-Tags dürfen nur zu `alpha` veröffentlichen
- Beta-Prerelease-Tags dürfen nur zu `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist eine vollständige Commit-SHA-Eingabe nur erlaubt, wenn
  `preflight_only=true` gilt
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer
  nur der Validierung
- Der echte Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden, das während des Preflights verwendet wurde;
  der Workflow prüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Stabile npm-Release-Sequenz

Beim Erstellen eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie die aktuelle vollständige Workflow-Branch-Commit-SHA
     für einen rein validierenden Probelauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur dann,
   wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, dem Release-Tag oder der vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow heraus wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Ref aus
5. Speichern Sie die erfolgreiche `preflight_run_id`
6. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`
   und der gespeicherten `preflight_run_id` aus; dies veröffentlicht externalisierte Plugins auf npm
   und ClawHub, bevor das OpenClaw-npm-Paket hochgestuft wird
7. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   Workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` zu `latest` hochzustufen
8. Wenn das Release bewusst direkt zu `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zeigen zu lassen, oder lassen Sie die geplante
   selbstheilende Synchronisierung `beta` später verschieben

Die Dist-Tag-Mutation liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` benötigt, während das öffentliche Repo ausschließlich OIDC-Veröffentlichungen verwendet.

Damit bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Promotion-Pfad
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückfallen muss, führen Sie alle 1Password-
CLI-Befehle (`op`) nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Agent-Shell auf; innerhalb von tmux bleiben Prompts,
Warnungen und OTP-Handling beobachtbar und wiederholte Host-Warnungen werden verhindert.

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
