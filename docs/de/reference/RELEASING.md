---
read_when:
    - Suche nach Definitionen für öffentliche Release-Kanäle
    - Release-Validierung oder Paketakzeptanz ausführen
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Lanes, Betreiber-Checkliste, Validierungsboxen, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-06-27T18:08:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hat drei öffentliche Release-Lanes:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen, oder auf npm `latest`, wenn dies ausdrücklich angefordert wird
- beta: Vorabversion-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Stand von `main`

## Versionsbenennung

- Stable-Release-Version: `YYYY.M.PATCH`
  - Git-Tag: `vYYYY.M.PATCH`
- Stable-Korrektur-Release-Version: `YYYY.M.PATCH-N`
  - Git-Tag: `vYYYY.M.PATCH-N`
- Beta-Vorabversion: `YYYY.M.PATCH-beta.N`
  - Git-Tag: `vYYYY.M.PATCH-beta.N`
- Monat oder Patch nicht mit führenden Nullen schreiben
- Seit der Aktualisierung des Release-Prozesses im Juni 2026 ist die dritte Komponente eine
  fortlaufende monatliche Release-Train-Nummer, kein Kalendertag. Stable- und Beta-
  Releases bestimmen den aktuellen Train; reine Alpha-Tags verbrauchen oder
  erhöhen die Beta-/Stable-Patchnummer nicht. Tags und npm-Versionen vor der
  Aktualisierung behalten ihre bestehenden Namen und bleiben gültig; die Release-Automatisierung vergleicht sie weiterhin nach
  Jahr, Monat, Patch, Kanal und Vorabversions- oder Korrektur-
  nummer.
- Alpha-/Nightly-Builds verwenden den nächsten unveröffentlichten Patch-Train und erhöhen nur
  `alpha.N` bei wiederholten Builds. Sobald dieser Patch eine Beta hat, wechseln neue Alpha-Builds
  zum folgenden Patch. Ignorieren Sie ältere reine Alpha-Tags mit höheren Patch-
  Nummern, wenn Sie einen Beta- oder Stable-Train auswählen.
- npm-Versionen sind unveränderlich. Wenn ein Beta-Tag bereits veröffentlicht wurde, dürfen Sie ihn nicht
  löschen, erneut veröffentlichen oder wiederverwenden; schneiden Sie stattdessen die nächste Beta-Nummer oder den nächsten monatlichen
  Patch. Da `2026.6.5-beta.1` während der
  Umstellung bereits veröffentlicht wurde, müssen Release-Trains für Juni 2026 Patch `5` oder höher verwenden. Veröffentlichen Sie
  neue Stable- oder Beta-Trains für Juni 2026 nicht als `2026.6.2`, `2026.6.3` oder
  `2026.6.4`.
- Nach Stable `2026.6.5` ist der nächste neue Beta-Train `2026.6.6-beta.1`, auch
  wenn automatisierte reine Alpha-Tags mit höheren Patchnummern bereits existieren.
- `latest` bedeutet das aktuell promotete Stable-npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können ausdrücklich `latest` ansteuern oder später einen geprüften Beta-Build promoten
- Jedes Stable-OpenClaw-Release liefert das npm-Paket, die macOS-App und signierte
  Windows-Hub-Installer gemeinsam aus; Beta-Releases validieren und veröffentlichen normalerweise
  zuerst den npm-/Paket-Pfad, wobei Native-App-Build, Signierung, Notarisierung und Promotion
  Stable vorbehalten sind, sofern nicht ausdrücklich angefordert

## Release-Takt

- Releases laufen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise von einem `release/YYYY.M.PATCH`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, schneiden Maintainer
  den nächsten `-beta.N`-Tag, anstatt den alten Beta-Tag zu löschen oder neu zu erstellen
- Detailliertes Release-Verfahren, Genehmigungen, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Release-Operator-Checkliste

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, Dist-Tag-Wiederherstellung und Notfall-Rollback-Details bleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Starten Sie vom aktuellen `main`: ziehen Sie den neuesten Stand, bestätigen Sie, dass der Ziel-Commit gepusht ist,
   und bestätigen Sie, dass die aktuelle `main`-CI ausreichend grün ist, um davon zu branchen.
2. Generieren Sie den obersten Abschnitt von `CHANGELOG.md` aus gemergten PRs und allen direkten
   Commits seit dem letzten erreichbaren Release-Tag. Halten Sie Einträge nutzerorientiert,
   deduplizieren Sie überlappende PR-/Direct-Commit-Einträge, committen Sie die Neufassung, pushen Sie sie,
   und führen Sie vor dem Branching noch einmal Rebase/Pull aus.
3. Prüfen Sie Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts`. Entfernen Sie abgelaufene
   Kompatibilität nur, wenn der Upgrade-Pfad abgedeckt bleibt, oder dokumentieren Sie, warum sie
   absichtlich weitergeführt wird.
4. Erstellen Sie `release/YYYY.M.PATCH` aus dem aktuellen `main`; führen Sie normale Release-Arbeiten nicht
   direkt auf `main` aus.
5. Erhöhen Sie alle erforderlichen Versionsstellen für den vorgesehenen Tag und führen Sie dann
   `pnpm release:prep` aus. Der Befehl aktualisiert Plugin-Versionen, Plugin-Inventar, Konfigurations-
   schema, gebündelte Kanal-Konfigurationsmetadaten, Baseline der Konfigurationsdokumentation, Plugin-SDK-
   Exporte und Plugin-SDK-API-Baseline in der richtigen Reihenfolge. Committen Sie alle generierten
   Abweichungen vor dem Tagging. Führen Sie dann den lokalen deterministischen Preflight aus:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branches für einen reinen Validierungs-
   Preflight zulässig. Der Preflight erzeugt Dependency-Release-Nachweise für den
   exakt ausgecheckten Dependency-Graphen und speichert sie im npm-Preflight-
   Artefakt. Speichern Sie die erfolgreiche `preflight_run_id`.
7. Starten Sie alle Vorab-Release-Tests mit `Full Release Validation` für den
   Release-Branch, Tag oder vollständigen Commit-SHA. Dies ist der einzige manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, fixen Sie auf dem Release-Branch und führen Sie die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, Provider- oder Modell-Allowlist erneut aus, die
   den Fix beweist. Führen Sie den vollständigen Umbrella nur erneut aus, wenn die geänderte Oberfläche
   frühere Nachweise veralten lässt.
9. Für einen getaggten Beta-Kandidaten führen Sie
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` vom passenden
   `release/YYYY.M.PATCH`-Branch aus. Für Stable übergeben Sie zusätzlich das erforderliche Windows-Source-
   Release:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Der Helper führt die lokalen Generated-Release-Checks aus, startet oder verifiziert
   die vollständige Release-Validierung und npm-Preflight-Nachweise, führt Parallels-
   Fresh-/Update-Proof gegen den exakt vorbereiteten Tarball plus Telegram-Paket-
   Proof aus, zeichnet Plugin-npm- und ClawHub-Pläne auf und gibt den exakten
   `OpenClaw Release Publish`-Befehl erst aus, nachdem das Nachweispaket grün ist.
   `OpenClaw Release Publish` startet die ausgewählten oder alle veröffentlichbaren Plugin-
   Pakete parallel zu npm und dieselbe Menge zu ClawHub und promotet anschließend das
   vorbereitete OpenClaw-npm-Preflight-Artefakt mit dem passenden Dist-Tag, sobald
   die Plugin-npm-Veröffentlichung erfolgreich ist.
   Nachdem der OpenClaw-npm-Publish-Child erfolgreich ist, erstellt oder aktualisiert er die
   passende GitHub-Release-/Prerelease-Seite aus dem vollständigen passenden
   `CHANGELOG.md`-Abschnitt. Stable-Releases, die auf npm `latest` veröffentlicht wurden, werden zum
   neuesten GitHub-Release; Stable-Maintenance-Releases, die auf npm `beta` bleiben, werden
   mit GitHub `latest=false` erstellt. Der Workflow lädt außerdem die Preflight-
   Dependency-Nachweise, das Full-Validation-Manifest und Postpublish-Registry-
   Verifikationsnachweise in das GitHub-Release hoch, damit Post-Release-Incident-
   Response möglich ist. Der Publish-Workflow gibt Child-Run-IDs sofort aus, genehmigt
   Release-Environment-Gates automatisch, soweit der Workflow-Token sie genehmigen darf, fasst
   fehlgeschlagene Child-Jobs mit Log-Enden zusammen, schließt das GitHub-Release und die Dependency-
   Nachweise ab, sobald OpenClaw-npm-Publish erfolgreich ist, wartet auf ClawHub, wenn
   OpenClaw-npm veröffentlicht wird, führt dann `pnpm release:verify-beta` aus und
   lädt Postpublish-Nachweise für das GitHub-Release, npm-Paket, ausgewählte
   Plugin-npm-Pakete, ausgewählte ClawHub-Pakete, Child-Workflow-Run-IDs und
   optional die NPM-Telegram-Run-ID hoch. Der ClawHub-Pfad wiederholt transiente CLI-
   Dependency-Installationsfehler, veröffentlicht Plugins mit bestandener Preview auch dann, wenn eine
   Preview-Zelle flakt, und endet mit Registry-Verifikation für jede erwartete
   Plugin-Version, sodass Teilveröffentlichungen sichtbar und wiederholbar bleiben. Führen Sie danach die Post-Publish-
   Package-Acceptance gegen das veröffentlichte
   `openclaw@YYYY.M.PATCH-beta.N`- oder
   `openclaw@beta`-Paket aus. Wenn eine gepushte oder veröffentlichte Vorabversion einen Fix benötigt,
   schneiden Sie die nächste passende Vorabversionsnummer; löschen oder überschreiben Sie die alte
   Vorabversion nicht.
10. Für Stable fahren Sie erst fort, nachdem die geprüfte Beta oder der Release-Kandidat die
    erforderlichen Validierungsnachweise hat. Stable-npm-Publish läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` wieder; Stable-macOS-Release-Bereitschaft erfordert außerdem die
    paketierte `.zip`, `.dmg`, `.dSYM.zip` und aktualisierte `appcast.xml` auf `main`.
    Der macOS-Publish-Workflow veröffentlicht den signierten Appcast nach erfolgreicher Prüfung der Release-Assets
    automatisch auf öffentliches `main`; wenn Branch Protection den
    direkten Push blockiert, öffnet oder aktualisiert er einen Appcast-PR. Stable-Windows-Hub-
    Bereitschaft erfordert die signierten Assets `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` und
    `OpenClawCompanion-SHA256SUMS.txt` im OpenClaw-GitHub-Release.
    Übergeben Sie den exakten signierten Release-Tag `openclaw/openclaw-windows-node` als
    `windows_node_tag` und dessen kandidatengeprüfte Installer-Digest-Map als
    `windows_node_installer_digests`; `OpenClaw Release Publish` behält den
    Release-Entwurf bei, startet `Windows Node Release` und verifiziert alle drei
    Assets vor der Veröffentlichung.
11. Führen Sie nach der Veröffentlichung den npm-Post-Publish-Verifier aus, optional ein eigenständiges
    Published-npm-Telegram-E2E, wenn Sie Post-Publish-Kanalnachweis benötigen,
    Dist-Tag-Promotion bei Bedarf, verifizieren Sie die generierte GitHub-Release-Seite,
    führen Sie die Release-Ankündigungsschritte aus und schließen Sie dann [Stable-main-
    Abschluss](#stable-main-closeout) ab, bevor Sie ein Stable-Release als fertig bezeichnen.

## Stable-main-Abschluss

Stable-Veröffentlichung ist erst abgeschlossen, wenn `main` den tatsächlich ausgelieferten
Release-Stand enthält.

1. Beginnen Sie mit einem frischen, aktuellen `main`. Prüfen Sie `release/YYYY.M.PATCH` dagegen und
   forward-portieren Sie echte Fehlerbehebungen, die in `main` fehlen. Mergen Sie keine rein
   release-spezifischen Kompatibilitäts-, Test- oder Validierungsadapter blind in den neueren `main`.
2. Setzen Sie `main` auf die ausgelieferte stabile Version, nicht auf einen spekulativen nächsten Train. Führen Sie
   `pnpm release:prep` nach der Änderung der Root-Version aus, anschließend
   `pnpm deps:shrinkwrap:generate`.
3. Sorgen Sie dafür, dass der Abschnitt `## YYYY.M.PATCH` in `CHANGELOG.md` auf `main` exakt dem
   getaggten Release-Branch entspricht. Schließen Sie das stabile `appcast.xml`-Update ein, wenn das Mac-Release
   eines veröffentlicht hat.
4. Fügen Sie `YYYY.M.PATCH+1`, eine Beta-Version oder einen leeren zukünftigen Changelog-
   Abschnitt erst zu `main` hinzu, wenn der Operator diesen Release-Train ausdrücklich startet.
5. Führen Sie `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` und
   `OPENCLAW_TESTBOX=1 pnpm check:changed` aus. Pushen Sie, und verifizieren Sie anschließend, dass `origin/main`
   die ausgelieferte Version und den Changelog enthält, bevor Sie das stabile Release
   als abgeschlossen bezeichnen.
6. Halten Sie die Repository-Variablen `RELEASE_ROLLBACK_DRILL_ID` und
   `RELEASE_ROLLBACK_DRILL_DATE` nach jeder privaten Rollback-Übung aktuell.
   `OpenClaw Stable Main Closeout` beginnt mit dem `main`-Push, der nach der stabilen Veröffentlichung
   die ausgelieferte Version, den Changelog und den Appcast enthält. Er liest
   unveränderliche Postpublish-Nachweise, um das ausgelieferte Tag an seine Full Release
   Validation- und Publish-Läufe zu binden, und verifiziert anschließend den stabilen Main-Zustand, das Release,
   den verpflichtenden stabilen Soak und blockierende Performance-Nachweise. Er hängt ein
   unveränderliches Closeout-Manifest und eine Prüfsumme an das GitHub-Release an. Der automatische
   Push-Trigger überspringt Legacy-Releases, die vor unveränderlichen Postpublish-
   Nachweisen liegen; er behandelt dieses Überspringen niemals als abgeschlossenen Closeout. Ein vollständiger
   Closeout erfordert sowohl Assets als auch eine passende Prüfsumme. Ein partielles Manifest
   spielt seinen aufgezeichneten `main`-SHA und die Rollback-Übung erneut ab, um identische
   Bytes neu zu erzeugen, und hängt dann die fehlende Prüfsumme an; ein ungültiges Paar oder eine Prüfsumme
   ohne Manifest bleibt blockierend. Ein durch Push ausgelöster Lauf ohne Repository-Variablen für die Rollback-
   Übung überspringt, ohne den Closeout abzuschließen; ein fehlender oder
   mehr als 90 Tage alter Übungsdatensatz blockiert weiterhin einen manuellen, nachweisgestützten
   Closeout. Private Wiederherstellungsbefehle bleiben im nur für Maintainer bestimmten Runbook.
   Verwenden Sie manuellen Dispatch nur, um einen nachweisgestützten stabilen Closeout zu reparieren oder erneut abzuspielen.
   Ein Legacy-Fallback-Korrekturtag darf Basispaket-Nachweise nur wiederverwenden, wenn
   das Korrekturtag auf denselben Quell-Commit wie das stabile Basistag verweist.
   Eine Korrektur mit anderer Quelle muss ihre eigenen Paketnachweise
   veröffentlichen und verifizieren.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  auch außerhalb des schnelleren lokalen Gates `pnpm check` abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Prüfungen auf Import-
  Zyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Paket-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:prep` nach der Versionsanhebung im Root und vor dem Tagging aus. Es
  führt jeden deterministischen Release-Generator aus, der nach einer
  Versions-/Konfigurations-/API-Änderung häufig abweicht: Plugin-Versionen, Plugin-Inventar, Basiskonfigurations-
  schema, gebündelte Kanal-Konfigurationsmetadaten, Baseline der Konfigurationsdokumentation, Plugin-SDK-
  Exporte und Plugin-SDK-API-Baseline. `pnpm release:check` führt diese
  Guards im Prüfmodus erneut aus und meldet jeden gefundenen Drift-Fehler generierter Dateien in einem
  Durchlauf, bevor die Paket-Release-Prüfungen laufen.
- Die Plugin-Versionssynchronisierung aktualisiert standardmäßig die Paketversionen offizieller Plugins und bestehende
  `openclaw.compat.pluginApi`-Mindestversionen auf die OpenClaw-Release-Version.
  Behandeln Sie dieses Feld als Mindestversion für die Plugin-SDK-/Runtime-API, nicht nur als Kopie
  der Paketversion: Für reine Plugin-Releases, die absichtlich mit
  älteren OpenClaw-Hosts kompatibel bleiben, belassen Sie die Mindestversion bei der ältesten unterstützten
  Host-API und dokumentieren Sie diese Entscheidung im Plugin-Release-Nachweis.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um
  alle Pre-Release-Testboxen über einen Einstiegspunkt zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, startet manuell `CI` und startet
  `OpenClaw Release Checks` für Installations-Smoke, Package Acceptance, Cross-OS-
  Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stabile und vollständige
  Läufe enthalten immer umfassende Live-/E2E- und Docker-Release-Pfad-Soaks;
  `run_release_soak=true` bleibt für einen expliziten Beta-Soak erhalten. Package
  Acceptance stellt während der Kandidatenvalidierung das kanonische Paket-Telegram-E2E bereit
  und vermeidet damit einen zweiten gleichzeitigen Live-Poller.
  Geben Sie `release_package_spec` nach der Veröffentlichung einer Beta an, um das veröffentlichte
  npm-Paket über Release-Prüfungen, Package Acceptance und Paket-Telegram-
  E2E hinweg wiederzuverwenden, ohne den Release-Tarball neu zu bauen. Geben Sie
  `npm_telegram_package_spec` nur an, wenn Telegram ein anderes
  veröffentlichtes Paket als der Rest der Release-Validierung verwenden soll. Geben Sie
  `package_acceptance_package_spec` an, wenn Package Acceptance ein
  anderes veröffentlichtes Paket als die Release-Paketspezifikation verwenden soll. Geben Sie
  `evidence_package_spec` an, wenn der Release-Nachweisbericht belegen soll, dass die
  Validierung zu einem veröffentlichten npm-Paket passt, ohne Telegram E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Side-Channel-Nachweise
  für einen Paketkandidaten benötigen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen `package_ref`-Branch/-Tag/-SHA mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen öffentlichen HTTPS-Tarball mit
  erforderlichem SHA-256 und strenger Richtlinie für öffentliche URLs; `source=trusted-url` für eine
  benannte Richtlinie für vertrauenswürdige Quellen mit erforderlicher `trusted_source_id` und SHA-256; oder
  `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde. Der
  Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram-QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die
  ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paket-
  Artefakt der Kandidat und `published_upgrade_survivor_baseline` wählt
  die veröffentlichte Baseline. `update-restart-auth` verwendet das Kandidatenpaket
  sowohl als installierte CLI als auch als Package-under-Test, damit der
  verwaltete Neustartpfad des Update-Befehls des Kandidaten getestet wird.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Häufige Profile:
  - `smoke`: Installations-/Kanal-/Agent-, Gateway-Netzwerk- und Konfigurations-Neulade-Lanes
  - `package`: artefaktnative Paket-/Update-/Neustart-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Blöcke mit OpenWebUI
  - `custom`: exakte `docker_lanes`-Auswahl für einen fokussierten erneuten Lauf
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur deterministische normale
  CI-Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Starts umgehen geänderten-
  Scope und erzwingen die Linux-Node-Shards, gebündelte-Plugin-Shards, Plugin- und
  Kanalvertrags-Shards, Node-22-Kompatibilität, `check-*`, `check-additional-*`,
  Smoke-Prüfungen für gebaute Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS und
  Control-UI-i18n-Lanes. Eigenständige manuelle CI-Läufe führen Android nur aus, wenn sie
  mit `include_android=true` gestartet werden; `Full Release Validation` übergibt diese Eingabe an
  sein CI-Kind.
  Beispiel mit Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es testet
  QA-Lab über einen lokalen OTLP/HTTP-Receiver und verifiziert Trace-, Metrik- und Log-
  Export sowie begrenzte Trace-Attribute und die Schwärzung von Inhalten/Bezeichnern, ohne
  Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm qa:otel:collector-smoke` aus, wenn Sie Collector-Kompatibilität validieren.
  Es leitet denselben QA-Lab-OTLP-Export durch einen echten OpenTelemetry-Collector-
  Docker-Container, bevor die lokalen Receiver-Assertions ausgeführt werden.
- Führen Sie `pnpm qa:prometheus:smoke` aus, wenn Sie geschütztes Prometheus-Scraping validieren.
  Es testet QA-Lab, weist nicht authentifizierte Scrapes zurück und verifiziert,
  dass releasekritische Metrikfamilien frei von Prompt-Inhalten, rohen Bezeichnern,
  Auth-Tokens und lokalen Pfaden bleiben.
- Führen Sie `pnpm qa:observability:smoke` aus, wenn Sie die OpenTelemetry- und
  Prometheus-Smoke-Lanes im Source-Checkout direkt nacheinander ausführen möchten.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Der Preflight von `OpenClaw NPM Release` erzeugt Release-Nachweise für Abhängigkeiten, bevor
  der npm-Tarball gepackt wird. Das npm-Advisory-Schwachstellen-Gate ist
  releaseblockierend. Das Risiko des transitiven Manifests, die Dependency-Ownership-/Installations-
  Oberfläche und die Berichte zu Abhängigkeitsänderungen sind nur Release-Nachweise. Der
  Bericht zu Abhängigkeitsänderungen vergleicht den Release-Kandidaten mit dem vorherigen
  erreichbaren Release-Tag.
- Der Preflight lädt Abhängigkeitsnachweise als
  `openclaw-release-dependency-evidence-<tag>` hoch und bettet sie außerdem unter
  `dependency-evidence/` in das vorbereitete npm-Preflight-Artefakt ein. Der echte
  Veröffentlichungspfad verwendet dieses Preflight-Artefakt wieder und hängt anschließend dieselben Nachweise
  als `openclaw-<version>-dependency-evidence.zip` an das GitHub-Release an.
- Führen Sie `OpenClaw Release Publish` für die mutierende Veröffentlichungssequenz aus, nachdem der
  Tag existiert. Starten Sie ihn von `release/YYYY.M.PATCH` (oder `main`, wenn Sie einen
  von main erreichbaren Tag veröffentlichen), übergeben Sie den Release-Tag, die erfolgreiche OpenClaw-npm-
  `preflight_run_id` und die erfolgreiche `full_release_validation_run_id`, und behalten Sie
  den Standard-Plugin-Veröffentlichungsumfang `all-publishable` bei, außer Sie führen bewusst
  eine fokussierte Reparatur aus. Der Workflow serialisiert die Plugin-npm-Veröffentlichung, die Plugin-
  ClawHub-Veröffentlichung und die OpenClaw-npm-Veröffentlichung, damit das Kernpaket nicht
  vor seinen externalisierten Plugins veröffentlicht wird.
- Stabiles `OpenClaw Release Publish` erfordert ein exaktes `windows_node_tag`, nachdem
  das passende Nicht-Prerelease-Release `openclaw/openclaw-windows-node` existiert.
  Es erfordert außerdem die kandidatenfreigegebene Map `windows_node_installer_digests`.
  Bevor ein Veröffentlichungs-Kind gestartet wird, verifiziert es, dass das Quell-Release
  veröffentlicht, kein Prerelease ist, die erforderlichen x64-/ARM64-Installer enthält und
  weiterhin zu dieser freigegebenen Map passt. Anschließend startet es `Windows Node Release`,
  während das OpenClaw-Release noch ein Entwurf ist, und übernimmt die festgelegte Installer-
  Digest-Map unverändert. Der Kind-
  Workflow lädt die signierten Windows-Hub-Installer von exakt diesem Tag herunter,
  gleicht sie mit den festgelegten Digests ab, verifiziert auf einem Windows-Runner, dass ihre Authenticode-
  Signaturen den erwarteten OpenClaw-Foundation-Signer verwenden,
  schreibt ein SHA-256-Manifest und lädt die Installer plus Manifest in das
  kanonische OpenClaw-GitHub-Release hoch. Danach lädt er die promoteten Assets erneut herunter und
  verifiziert Manifestzugehörigkeit und Hashes. Der Parent verifiziert den aktuellen
  x64-, ARM64- und Prüfsummen-Asset-Vertrag vor der Veröffentlichung. Direkte Wiederherstellung
  weist unerwartete `OpenClawCompanion-*`-Asset-Namen zurück, bevor die
  erwarteten Vertrags-Assets durch die festgelegten Quellbytes ersetzt werden. Starten Sie
  `Windows Node Release` nur zur Wiederherstellung manuell, und übergeben Sie immer einen exakten Tag, niemals
  `latest`, sowie die explizite JSON-Map `expected_installer_digests` aus dem
  freigegebenen Quell-Release. Website-Downloadlinks sollten auf exakte OpenClaw-
  Release-Asset-URLs für das aktuelle stabile Release zeigen oder
  `releases/latest/download/...` nur verwenden, nachdem verifiziert wurde, dass GitHubs latest-Redirect
  auf dasselbe Release zeigt; verlinken Sie nicht nur auf die Release-
  Seite des Companion-Repos.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem die QA-Lab-Mock-Paritäts-Lane sowie das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane vor der Release-Freigabe aus. Die Live-
  Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-
  Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständige Matrix-
  Transport-, Medien- und E2EE-Inventarisierung parallel wünschen.
- Cross-OS-Installations- und Upgrade-Runtime-Validierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release
Validation` oder aus der `main`-/Release-Workflow-Ref gestartet werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der reine Validierungs-Preflight von `OpenClaw NPM Release` akzeptiert außerdem den aktuellen
  vollständigen 40-stelligen Workflow-Branch-Commit-SHA, ohne einen gepushten Tag zu verlangen
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung promotet werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; echte Veröffentlichung erfordert weiterhin einen echten Release-Tag
- Beide Workflows halten den echten Veröffentlichungs- und Promotion-Pfad auf von GitHub gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Prüfungs-Lane
- Bevor Sie einen Release-Kandidaten lokal taggen, führen Sie
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` aus. Der Helper
  führt die schnellen Release-Guardrails, Plugin-npm-/ClawHub-Release-Prüfungen, Build,
  UI-Build und `release:openclaw:npm:check` in der Reihenfolge aus, die häufige
  freigabeblockierende Fehler erkennt, bevor der GitHub-Veröffentlichungsworkflow startet.
- Führen Sie `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder den passenden Beta-/Korrektur-Tag) vor der Freigabe aus
- Nach der npm-Veröffentlichung führen Sie aus
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (oder die passende Beta-/Korrekturversion), um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus,
  um das Onboarding des installierten Pakets, die Telegram-Einrichtung und ein echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket unter Verwendung des gemeinsam geleasten Telegram-Zugangsdaten-
  Pools zu verifizieren. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen und die drei
  `OPENCLAW_QA_TELEGRAM_*`-Env-Zugangsdaten direkt übergeben.
- Um den vollständigen Beta-Smoke nach der Veröffentlichung von einer Maintainer-Maschine aus auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt die Parallels-npm-Update-/Fresh-Target-Validierung aus, startet `NPM Telegram Beta E2E`, fragt den exakten Workflow-Lauf ab, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Prüfung nach der Veröffentlichung über GitHub Actions mit dem
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist absichtlich nur manuell
  und läuft nicht bei jedem Merge.
- Die Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - die echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss aus demselben `main`- oder
    `release/YYYY.M.PATCH`-Branch gestartet werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichungen können über Workflow-Eingabe explizit `latest` als Ziel verwenden
  - tokenbasierte npm-dist-tag-Mutationen liegen jetzt in
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, weil
    `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das Quell-Repo
    OIDC-only-Veröffentlichung beibehält
  - öffentlicher `macOS Release` dient nur der Validierung; wenn ein Tag nur auf einem
    Release-Branch liegt, der Workflow aber von `main` gestartet wird, setzen Sie
    `public_release_branch=release/YYYY.M.PATCH`
  - die echte macOS-Veröffentlichung muss erfolgreiche macOS-`preflight_run_id` und
    `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie
    erneut zu bauen
- Bei stabilen Korrektur-Releases wie `YYYY.M.PATCH-N` prüft der Post-Publish-Verifier
  auch denselben Temp-Präfix-Upgradepfad von `YYYY.M.PATCH` zu `YYYY.M.PATCH-N`,
  damit Release-Korrekturen ältere globale Installationen nicht stillschweigend auf dem
  Basis-Stable-Payload belassen können
- Der npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Post-Publish-Verifizierung prüft außerdem, ob veröffentlichte Plugin-Einstiegspunkte und
  Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, dem Plugin-Laufzeit-Payloads fehlen, schlägt im Postpublish-Verifier fehl und
  kann nicht auf `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliche Paketaufblähung
  vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit CI-Planung, Erweiterungs-Timing-Manifeste oder
  Erweiterungs-Testmatrizen berührt hat, generieren und prüfen Sie vor der Freigabe die planner-eigenen
  `plugin-prerelease-extension-shard`-Matrixausgaben aus
  `.github/workflows/plugin-prerelease.yml`, damit Release Notes
  kein veraltetes CI-Layout beschreiben
- Zur Bereitschaft stabiler macOS-Releases gehören außerdem die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierten `.zip`-, `.dmg`- und `.dSYM.zip`-Dateien enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf das neue stabile Zip verweisen; der
    macOS-Veröffentlichungsworkflow committet dies automatisch oder öffnet einen Appcast-
    PR, wenn direkter Push blockiert ist
  - die paketierte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist der Weg, über den Operator alle Pre-Release-Tests
von einem Einstiegspunkt aus starten. Für einen Proof mit festem Commit auf
einem schnell bewegten Branch verwenden Sie den Helper, damit jeder
untergeordnete Workflow von einem temporären Branch ausgeführt wird, der auf
den Ziel-SHA festgelegt ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
von diesem Branch mit `ref=<sha>`, verifiziert, dass jeder untergeordnete
Workflow-`headSha` dem Ziel entspricht, und löscht anschließend den temporären
Branch. Dadurch wird vermieden, versehentlich einen neueren untergeordneten
`main`-Lauf nachzuweisen.

Für die Validierung eines Release-Branch oder Tags führen Sie sie vom
vertrauenswürdigen `main`-Workflow-Ref aus und übergeben den Release-Branch oder
das Tag als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Der Workflow löst den Ziel-Ref auf, dispatcht manuelles `CI` mit
`target_ref=<release-ref>` und dispatcht danach `OpenClaw Release Checks`.
`OpenClaw Release Checks` fächert Install-Smoke, Cross-OS-Release-Checks,
live/E2E-Docker-Coverage für den Release-Pfad bei aktiviertem Soak, Package
Acceptance mit dem kanonischen Telegram-Package-E2E, QA-Lab-Parität, Live Matrix
und Live Telegram auf. Ein vollständiger/all-Lauf ist nur akzeptabel, wenn die
Zusammenfassung von `Full Release Validation` `normal_ci`, `plugin_prerelease`
und `release_checks` als erfolgreich ausweist, außer ein fokussierter erneuter
Lauf hat den separaten untergeordneten `Plugin Prerelease` bewusst übersprungen.
Verwenden Sie den eigenständigen untergeordneten `npm-telegram`-Workflow nur für
einen fokussierten erneuten Lauf eines veröffentlichten Pakets mit
`release_package_spec` oder `npm_telegram_package_spec`. Die abschließende
Verifier-Zusammenfassung enthält Tabellen der langsamsten Jobs für jeden
untergeordneten Lauf, damit der Release-Manager den aktuellen kritischen Pfad
sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation)
für die vollständige Stage-Matrix, exakte Workflow-Jobnamen, Unterschiede
zwischen stabilem und vollständigem Profil, Artefakte und Handles für
fokussierte erneute Läufe.
Untergeordnete Workflows werden von dem vertrauenswürdigen Ref dispatcht, der
`Full Release Validation` ausführt, normalerweise `--ref main`, selbst wenn der
Ziel-`ref` auf einen älteren Release-Branch oder ein älteres Tag zeigt. Es gibt
keine separate Workflow-Ref-Eingabe für Full Release Validation; wählen Sie den
vertrauenswürdigen Harness, indem Sie den Workflow-Lauf-Ref wählen. Verwenden
Sie `--ref main -f ref=<sha>` nicht für exakten Commit-Proof auf bewegtem
`main`; rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein. Verwenden
Sie daher `pnpm ci:full-release --sha <sha>`, um den festgelegten temporären
Branch zu erstellen.

Verwenden Sie `release_profile`, um die live/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI/Core-Live- und Docker-Pfad
- `stable`: Minimum plus stabile Provider/Backend-Coverage für Release-Freigabe
- `full`: Stable plus breite advisory Provider/Media-Coverage

Stabile und vollständige Validierung führen vor der Promotion immer den
erschöpfenden live/E2E-, Docker-Release-Pfad- und begrenzten Published-
Upgrade-Survivor-Sweep aus. Verwenden Sie `run_release_soak=true`, um denselben
Sweep für eine Beta anzufordern. Dieser Sweep deckt die neuesten vier stabilen
Pakete plus festgelegte Baselines `2026.4.23` und `2026.5.2` sowie ältere
`2026.4.15`-Coverage ab, wobei doppelte Baselines entfernt werden und jede
Baseline in ihren eigenen Docker-Runner-Job geshardet wird.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den
Ziel-Ref einmal als `release-package-under-test` aufzulösen, und verwendet
dieses Artefakt in Cross-OS-, Package-Acceptance- und Release-Pfad-Docker-Checks
wieder, wenn Soak läuft. Dadurch bleiben alle paketbezogenen Boxen auf
denselben Bytes, und wiederholte Paket-Builds werden vermieden.
Nachdem eine Beta bereits auf npm ist, setzen Sie
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, damit Release-Checks das
ausgelieferte Paket einmal herunterladen, dessen Build-Source-SHA aus
`dist/build-info.json` extrahieren und dieses Artefakt für Cross-OS, Package
Acceptance, Release-Pfad-Docker und Paket-Telegram-Lanes wiederverwenden.
Der Cross-OS-OpenAI-Install-Smoke verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`,
wenn die Repo/Org-Variable gesetzt ist, andernfalls `openai/gpt-5.4`, weil
diese Lane Paketinstallation, Onboarding, Gateway-Start und einen Live-Agent-
Turn nachweist, statt das langsamste Standardmodell zu benchmarken. Die breitere
Live-Provider-Matrix bleibt der Ort für modellspezifische Coverage.

Verwenden Sie je nach Release-Phase diese Varianten:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Verwenden Sie den vollständigen Umbrella nicht als ersten erneuten Lauf nach
einem fokussierten Fix. Wenn eine Box fehlschlägt, verwenden Sie den
fehlgeschlagenen untergeordneten Workflow, Job, die Docker-Lane, das
Paketprofil, den Modell-Provider oder die QA-Lane für den nächsten Proof.
Führen Sie den vollständigen Umbrella erst wieder aus, wenn der Fix gemeinsame
Release-Orchestrierung geändert oder frühere All-Box-Evidenz veraltet gemacht
hat. Der abschließende Verifier des Umbrella prüft die aufgezeichneten IDs der
untergeordneten Workflow-Läufe erneut. Nachdem ein untergeordneter Workflow
erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Wiederherstellung übergeben Sie `rerun_group` an den Umbrella.
`all` ist der echte Release-Candidate-Lauf, `ci` führt nur das normale
untergeordnete CI aus, `plugin-prerelease` führt nur das release-only
untergeordnete Plugin aus, `release-checks` führt jede Release-Box aus, und die
engeren Release-Gruppen sind `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`. Fokussierte
`npm-telegram`-Reruns erfordern `release_package_spec` oder
`npm_telegram_package_spec`; vollständige/all-Läufe verwenden das kanonische
Package-Telegram-E2E innerhalb von Package Acceptance. Fokussierte Cross-OS-
Reruns können `cross_os_suite_filter=windows/packaged-upgrade` oder einen
anderen OS/Suite-Filter hinzufügen. Fehler in QA-Release-Checks blockieren die
normale Release-Validierung, einschließlich erforderlichem OpenClaw Dynamic Tool
Drift im Standard-Tier. Tideclaw-Alpha-Läufe können nicht paket-
sicherheitsrelevante Release-Check-Lanes weiterhin als advisory behandeln. Wenn
`live_suite_filter` explizit eine gegatete QA-Live-Lane wie Discord, WhatsApp
oder Slack anfordert, muss die passende Repo-Variable
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` aktiviert sein; andernfalls schlägt die
Eingabeerfassung fehl, statt die Lane stillschweigend zu überspringen.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete `CI`-Workflow. Manuelles CI
umgeht Changed-Scoping absichtlich und erzwingt den normalen Testgraphen für
den Release Candidate: Linux-Node-Shards, Bundled-Plugin-Shards, Plugin- und
Channel-Contract-Shards, Node-22-Kompatibilität, `check-*`,
`check-additional-*`, Built-Artifact-Smoke-Checks, Docs-Checks, Python-Skills,
Windows, macOS und Control-UI-i18n. Android ist enthalten, wenn
`Full Release Validation` die Box ausführt, weil der Umbrella
`include_android=true` übergibt; eigenständiges manuelles CI erfordert
`include_android=true` für Android-Coverage.

Verwenden Sie diese Box, um zu beantworten: „Hat der Source Tree die vollständige
normale Testsuite bestanden?“ Sie ist nicht dasselbe wie Produktvalidierung des
Release-Pfads. Aufzubewahrende Evidenz:

- `Full Release Validation`-Zusammenfassung mit der URL des dispatchten
  `CI`-Laufs
- grüner `CI`-Lauf auf dem exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der
  Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn ein
  Lauf Performance-Analyse benötigt

Führen Sie manuelles CI direkt nur aus, wenn der Release deterministisches
normales CI benötigt, aber nicht die Docker-, QA-Lab-, Live-, Cross-OS- oder
Paket-Boxen. Verwenden Sie den ersten Befehl für direktes CI ohne Android.
Fügen Sie `include_android=true` hinzu, wenn direktes Release-Candidate-CI
Android abdecken muss:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Die Docker-Box lebt in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` plus dem Release-Modus-Workflow
`install-smoke`. Sie validiert den Release Candidate durch paketierte
Docker-Umgebungen, statt nur Source-Level-Tests auszuführen.

Release-Docker-Coverage umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamem globalem Bun-Install-
  Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA,
  wobei QR-, Root/Gateway- und Installer/Bun-Smoke-Jobs als separate
  Install-Smoke-Shards laufen
- Repository-E2E-Lanes
- Docker-Chunks für den Release-Pfad: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` und `plugins-runtime-install-h`
- OpenWebUI-Coverage innerhalb des Chunks `plugins-runtime-services`, wenn
  angefordert
- aufgeteilte Install/Uninstall-Lanes für gebündelte Plugins
  `bundled-plugin-install-uninstall-0` bis
  `bundled-plugin-install-uninstall-23`
- live/E2E-Provider-Suites und Docker-Live-Modell-Coverage, wenn Release-Checks
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte vor einem erneuten Lauf. Der Release-Pfad-
Scheduler lädt `.artifacts/docker-tests/` mit Lane-Logs, `summary.json`,
`failures.json`, Phasen-Timings, Scheduler-Plan-JSON und Rerun-Befehlen hoch.
Für fokussierte Wiederherstellung verwenden Sie `docker_lanes=<lane[,lane]>`
auf dem wiederverwendbaren Live/E2E-Workflow, statt alle Release-Chunks erneut
auszuführen. Generierte Rerun-Befehle enthalten vorherige
`package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, wenn
verfügbar, sodass eine fehlgeschlagene Lane denselben Tarball und dieselben
GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das
agentische Verhaltens- und Channel-Level-Release-Gate, getrennt von Vitest und
Docker-Paketmechanik.

Release-QA-Lab-Coverage umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane anhand des agentischen
  Parity Pack mit der Opus-4.6-Baseline vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` oder
  `pnpm qa:observability:smoke`, wenn Release-Telemetrie expliziten lokalen
  Proof benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich der Release in
QA-Szenarien und Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs
für Paritäts-, Matrix- und Telegram-Lanes auf, wenn Sie den Release freigeben.
Vollständige Matrix-Coverage bleibt als manueller geshardeter QA-Lab-Lauf
verfügbar, statt die standardmäßige release-kritische Lane zu sein.

### Package

Die Package-Box ist das Gate für das installierbare Produkt. Sie wird durch
`Package Acceptance` und den Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver
normalisiert einen Candidate in den `package-under-test`-Tarball, der von
Docker E2E verbraucht wird, validiert das Package-Inventar, zeichnet
Paketversion und SHA-256 auf und hält den Workflow-Harness-Ref getrennt vom
Paket-Source-Ref.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: packt einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness
- `source=url`: lädt ein öffentliches HTTPS-`.tgz` mit erforderlichem `package_sha256` herunter;
  URL-Zugangsdaten, nicht standardmäßige HTTPS-Ports, private/interne/spezielle
  Hostnamen oder aufgelöste Adressen sowie unsichere Weiterleitungen werden abgelehnt
- `source=trusted-url`: lädt ein HTTPS-`.tgz` mit erforderlichem
  `package_sha256` und `trusted_source_id` aus einer benannten Richtlinie in
  `.github/package-trusted-sources.json` herunter; verwenden Sie dies für maintainerverwaltete
  Enterprise-Mirrors oder private Paket-Repositorys, anstatt einen
  privaten Netzwerk-Bypass auf Eingabeebene zu `source=url` hinzuzufügen
- `source=artifact`: verwendet ein `.tgz` wieder, das von einem anderen GitHub-Actions-Lauf hochgeladen wurde

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paket-Artefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Aktualisierung,
Neustart der Aktualisierung mit konfigurierter Authentifizierung, Live-ClawHub-Skill-Installation, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-
Fixtures, Plugin-Aktualisierung und Telegram-Paket-QA gegen denselben aufgelösten
Tarball. Blockierende Release-Prüfungen verwenden die standardmäßige zuletzt veröffentlichte Paket-
Baseline; das Beta-Profil mit `run_release_soak=true`, `release_profile=stable` oder
`release_profile=full` erweitert auf jede stabile npm-veröffentlichte Baseline von
`2026.4.23` bis `latest` plus gemeldete Issue-Fixtures. Verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Kandidaten,
`source=ref` für einen SHA-gestützten lokalen npm-Tarball vor der Veröffentlichung,
`source=trusted-url` für einen maintainerverwalteten Enterprise-/privaten Mirror oder
`source=artifact` für einen vorbereiteten Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde.
Es ist der GitHub-native
Ersatz für den Großteil der Paket-/Aktualisierungsabdeckung, die zuvor
Parallels erforderte. Betriebssystemübergreifende Release-Prüfungen bleiben für betriebssystemspezifisches Onboarding,
Installer und Plattformverhalten wichtig, aber die Produktvalidierung für Paket/Aktualisierung sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Aktualisierungs- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn
Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine
Plugin-Installation/-Aktualisierung, Doctor-Bereinigung oder Änderung der veröffentlichten Paketmigration belegt.
Die erschöpfende veröffentlichte Aktualisierungsmigration aus jedem stabilen `2026.4.23+`-Paket ist
ein separater manueller `Update Migration`-Workflow und nicht Teil von Full Release CI.

Legacy-Nachsicht bei Package Acceptance ist absichtlich zeitlich begrenzt. Pakete bis
`2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits
auf npm veröffentlicht wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-
Fixture, fehlendes persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze,
fehlende Persistenz von Marketplace-Installationsdatensätzen und Config-Metadaten-
Migration während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf
bei lokalen Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete
müssen die modernen Paketverträge erfüllen; dieselben Lücken lassen die Release-
Validierung fehlschlagen.

Verwenden Sie breitere Package-Acceptance-Profile, wenn es bei der Release-Frage um ein
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

- `smoke`: schnelle Lanes für Paketinstallation/Kanal/Agent, Gateway-Netzwerk und Config-
  Neuladen
- `package`: Installations-/Aktualisierungs-/Neustart-/Plugin-Paketverträge plus Live-ClawHub-
  Skill-Installationsnachweis; dies ist der Standard für Release-Prüfungen
- `product`: `package` plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Web-
  Suche und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte erneute Läufe

Für Telegram-Nachweise von Paketkandidaten aktivieren Sie `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den
aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Release-Veröffentlichungsautomatisierung

`OpenClaw Release Publish` ist der normale mutierende Veröffentlichungseinstiegspunkt. Er
orchestriert die Trusted-Publisher-Workflows in der Reihenfolge, die das Release benötigt:

1. Release-Tag auschecken und dessen Commit-SHA auflösen.
2. Prüfen, dass der Tag von `main` oder `release/*` erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und SHA auslösen.
6. `OpenClaw NPM Release` mit dem Release-Tag, npm-Dist-Tag und
   gespeichertem `preflight_run_id` auslösen, nachdem die gespeicherte
   `full_release_validation_run_id` geprüft wurde.
7. Für stabile Releases das GitHub-Release als Entwurf erstellen oder aktualisieren, 
   `Windows Node Release` mit dem expliziten `windows_node_tag` und
   kandidatzugelassenen `windows_node_installer_digests` auslösen und die kanonischen
   Installer-/Prüfsummen-Assets vor der Veröffentlichung des Entwurfs prüfen.

Beta-Veröffentlichungsbeispiel:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Stabile Veröffentlichung auf den standardmäßigen Beta-Dist-Tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Direkte stabile Promotion auf `latest` ist explizit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Verwenden Sie die untergeordneten Workflows `Plugin NPM Release` und `Plugin ClawHub Release`
nur für fokussierte Reparatur- oder Neuveröffentlichungsarbeiten. `OpenClaw Release Publish` lehnt
`plugin_publish_scope=selected` ab, wenn `publish_openclaw_npm=true`, damit das Core-
Paket nicht ohne jedes veröffentlichbare offizielle Plugin ausgeliefert werden kann, einschließlich
`@openclaw/diffs-language-pack`. Für eine ausgewählte Plugin-Reparatur setzen Sie
`publish_openclaw_npm=false` mit `plugin_publish_scope=selected` und
`plugins=@openclaw/name`, oder lösen Sie den untergeordneten Workflow direkt aus.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf es auch der aktuelle
  vollständige 40-Zeichen-Commit-SHA des Workflow-Branches für einen nur validierenden Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: auf dem echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Zieltag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Publish` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Lauf-ID;
  erforderlich, wenn `publish_openclaw_npm=true`
- `full_release_validation_run_id`: erfolgreiche `Full Release Validation`-Lauf-
  ID; erforderlich, wenn `publish_openclaw_npm=true`
- `windows_node_tag`: exakter Nicht-Prerelease-`openclaw/openclaw-windows-node`-
  Release-Tag; erforderlich für stabile OpenClaw-Veröffentlichungen
- `windows_node_installer_digests`: kandidatzugelassene kompakte JSON-Map der
  aktuellen Windows-Installer-Namen zu ihren fixierten `sha256:`-Digests; erforderlich
  für stabile OpenClaw-Veröffentlichungen
- `npm_dist_tag`: npm-Zieltag für das OpenClaw-Paket
- `plugin_publish_scope`: Standard ist `all-publishable`; verwenden Sie `selected` nur
  für fokussierte reine Plugin-Reparaturarbeiten mit `publish_openclaw_npm=false`
- `plugins`: kommagetrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: Standard ist `true`; setzen Sie `false` nur, wenn Sie den
  Workflow als reinen Plugin-Reparatur-Orchestrator verwenden
- `wait_for_clawhub`: Standard ist `false`, damit npm-Verfügbarkeit nicht durch
  den ClawHub-Sidecar blockiert wird; setzen Sie `true` nur, wenn der Workflow-Abschluss
  den ClawHub-Abschluss einschließen muss

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständiger Commit-SHA zur Validierung. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.
- `run_release_soak`: aktiviert den erschöpfenden Live-/E2E-, Docker-Release-Pfad- und
  All-since-Upgrade-Survivor-Soak für Beta-Release-Prüfungen. Er wird durch
  `release_profile=stable` und `release_profile=full` erzwungen.

Regeln:

- Stabile und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` sind immer
  nur validierend
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflights verwendet wurde;
  der Workflow prüft diese Metadaten vor der weiteren Veröffentlichung

## Stabile npm-Release-Sequenz

Beim Erstellen eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit-SHA
     des Workflow-Branches für einen validierungsreinen Probelauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur dann,
   wenn Sie bewusst eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `Full Release Validation` auf dem Release-Branch, dem Release-Tag oder dem vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf der Release-Referenz aus
5. Wählen Sie den exakten Nicht-Prerelease-Release-Tag `openclaw/openclaw-windows-node` aus,
   dessen signierte x64- und ARM64-Installer ausgeliefert werden sollen. Speichern Sie ihn als
   `windows_node_tag` und speichern Sie deren validierte Digest-Zuordnung als
   `windows_node_installer_digests`. Der Release-Candidate-Helfer zeichnet beides auf
   und nimmt es in seinen generierten Veröffentlichungsbefehl auf.
6. Speichern Sie die erfolgreichen `preflight_run_id` und `full_release_validation_run_id`
7. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`,
   dem ausgewählten `windows_node_tag`, seinen gespeicherten `windows_node_installer_digests`,
   der gespeicherten `preflight_run_id` und der gespeicherten `full_release_validation_run_id` aus;
   es veröffentlicht externalisierte Plugins auf npm und ClawHub, bevor das
   OpenClaw-npm-Paket hochgestuft wird
8. Wenn das Release auf `beta` gelandet ist, verwenden Sie den
   Workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` auf `latest` hochzustufen
9. Wenn das Release bewusst direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben Release-Workflow,
   um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie die geplante
   Selbstheilungs-Synchronisierung `beta` später verschieben

Die Dist-Tag-Änderung lebt im Release-Ledger-Repo, weil sie weiterhin
`NPM_TOKEN` benötigt, während das Quell-Repo OIDC-only-Veröffentlichung beibehält.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Hochstufungspfad
dokumentiert und für Operators sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückfallen muss, führen Sie alle 1Password
CLI-(`op`)-Befehle nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op`
nicht direkt aus der Haupt-Agent-Shell auf; wenn es innerhalb von tmux bleibt, sind Prompts,
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
für das tatsächliche Runbook.

## Verwandt

- [Release-Kanäle](/de/install/development-channels)
