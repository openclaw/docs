---
read_when:
    - Suche nach Definitionen öffentlicher Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Auf der Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Kanäle, Checkliste für Betreiber, Validierungsumgebungen, Versionsbenennung und Veröffentlichungsrhythmus
title: Veröffentlichungsrichtlinie
x-i18n:
    generated_at: "2026-07-12T02:07:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw stellt derzeit drei benutzerseitige Aktualisierungskanäle bereit:

- stable: der bestehende freigegebene Release-Kanal, der weiterhin über npm `latest` aufgelöst wird, bis der separate Meilenstein für CLI/Kanäle umgesetzt ist
- beta: Vorabversions-Tags, die unter npm `beta` veröffentlicht werden
- dev: die jeweils aktuelle Spitze von `main`

Unabhängig davon können Release-Verantwortliche das Core-Paket des letzten abgeschlossenen Monats unter npm `extended-stable` veröffentlichen, beginnend mit Patch `33`. Die reguläre finale Linie des aktuellen Monats wird weiterhin unter npm `latest` geführt; diese betreiberseitige Aufteilung der Veröffentlichung ändert für sich genommen nicht die Auflösung des CLI-Aktualisierungskanals.

Tideclaw-Alpha-Builds bilden einen separaten internen Vorabversionszweig (npm-Dist-Tag `alpha`), der unter [Eingaben für den NPM-Workflow](#npm-workflow-inputs) und [Release-Testumgebungen](#release-test-boxes) behandelt wird.

## Versionsbenennung

- Monatliche npm-Extended-Stable-Release-Version: `YYYY.M.PATCH`, mit `PATCH >= 33`, Git-Tag `vYYYY.M.PATCH`
- Tägliche/reguläre finale Release-Version: `YYYY.M.PATCH`, mit `PATCH < 33`, Git-Tag `vYYYY.M.PATCH`
- Reguläre Fallback-Korrektur-Release-Version: `YYYY.M.PATCH-N`, Git-Tag `vYYYY.M.PATCH-N`
- Beta-Vorabversionsnummer: `YYYY.M.PATCH-beta.N`, Git-Tag `vYYYY.M.PATCH-beta.N`
- Alpha-Vorabversionsnummer: `YYYY.M.PATCH-alpha.N`, Git-Tag `vYYYY.M.PATCH-alpha.N`
- Monat oder Patch niemals mit führenden Nullen auffüllen
- `PATCH` ist eine fortlaufende monatliche Nummer des Release-Zugs und kein Kalendertag. Reguläre finale Releases und Beta-Releases setzen den aktuellen Zug fort; reine Alpha-Tags belegen oder erhöhen niemals die Patch-Nummer für Beta/reguläre Releases. Ignorieren Sie daher bei der Auswahl eines Beta- oder regulären Zugs ältere reine Alpha-Tags mit höheren Patch-Nummern.
- Alpha-/Nightly-Builds verwenden den nächsten noch nicht veröffentlichten Patch-Zug und erhöhen bei wiederholten Builds ausschließlich `alpha.N`. Sobald dieser Patch eine Beta-Version besitzt, wechseln neue Alpha-Builds zum darauffolgenden Patch.
- npm-Versionen sind unveränderlich: Löschen, veröffentlichen oder verwenden Sie ein veröffentlichtes Tag niemals erneut. Erstellen Sie stattdessen die nächste Vorabversionsnummer oder den nächsten monatlichen Patch.
- `latest` folgt weiterhin der aktuellen regulären/täglichen npm-Linie; `beta` ist das aktuelle Installationsziel für Beta-Versionen
- `extended-stable` bezeichnet das unterstützte npm-Paket des zurückliegenden Monats, beginnend mit Patch `33`; Patch `34` und höher sind Wartungs-Releases dieser monatlichen Linie
- Reguläre finale Releases und reguläre Korrektur-Releases werden standardmäßig unter npm `beta` veröffentlicht; Release-Verantwortliche können explizit `latest` als Ziel angeben oder einen geprüften Beta-Build später hochstufen
- Der dedizierte monatliche Extended-Stable-Pfad veröffentlicht das Core-npm-Paket und jedes über npm veröffentlichbare offizielle Plugin mit exakt derselben Version. Er veröffentlicht weder Plugins in ClawHub noch macOS- oder Windows-Artefakte, ein GitHub Release, Dist-Tags privater Repositorys, Docker-Images, mobile Artefakte oder Website-Downloads.
- Jedes reguläre finale Release liefert das npm-Paket, die macOS-App, die signierte eigenständige Android-APK und die signierten Windows-Hub-Installationsprogramme gemeinsam aus. Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad; Build, Signierung, Beglaubigung und Hochstufung nativer Apps bleiben regulären finalen Releases vorbehalten, sofern sie nicht ausdrücklich angefordert werden.

## Release-Rhythmus

- Releases durchlaufen zuerst die Beta-Phase; stable folgt erst, nachdem die neueste Beta-Version validiert wurde
- Maintainer erstellen Releases normalerweise aus einem Branch `release/YYYY.M.PATCH`, der vom aktuellen Stand von `main` abgezweigt wird, damit Release-Validierung und Korrekturen die neue Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag bereits gepusht oder veröffentlicht wurde und korrigiert werden muss, erstellen Maintainer das nächste Tag `-beta.N`, anstatt das alte zu löschen oder neu zu erstellen
- Detaillierte Release-Verfahren sowie Hinweise zu Genehmigungen, Anmeldedaten und Wiederherstellung sind ausschließlich für Maintainer bestimmt

## Monatliche npm-exklusive Extended-Stable-Veröffentlichung

Dies ist eine dedizierte Ausnahme vom nachstehenden regulären Release-Verfahren. Erstellen Sie für einen abgeschlossenen Monat `YYYY.M` den Branch `extended-stable/YYYY.M.33`; veröffentlichen Sie `vYYYY.M.33` und spätere Wartungs-Patches aus demselben Branch. Release-Tag, Branch-Spitze, Checkout, Paketversion, npm-Vorabprüfung und Lauf der vollständigen Release-Validierung müssen alle denselben Commit bezeichnen. Das geschützte `main` muss bereits eine finale Version eines strikt späteren Kalendermonats mit einer Patch-Nummer unter `33` enthalten; Wartungs-Patches bleiben auch dann zulässig, wenn `main` um mehr als einen Monat fortgeschritten ist.

Setzen Sie im betreffenden Extended-Stable-Branch die Version des Root-Pakets auf `YYYY.M.P`, führen Sie `pnpm release:prep` aus und prüfen Sie, dass jedes veröffentlichbare Erweiterungspaket dieselbe Version besitzt. Committen und pushen Sie alle generierten Änderungen, erstellen und pushen Sie das unveränderliche Tag `vYYYY.M.P` für diesen Commit und notieren Sie den resultierenden vollständigen SHA. Die Workflows verwenden diesen vorbereiteten Arbeitsbaum; sie erhöhen oder synchronisieren die Versionen nicht für Sie.

Führen Sie die npm-Vorabprüfung und die vollständige Release-Validierung von exakt dieser vorbereiteten Branch-Spitze aus. Speichern Sie anschließend beide Lauf-IDs und den erfolgreichen Laufversuch der vollständigen Release-Validierung:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` ist das bestehende Profil für den Validierungsumfang; es ist vom npm-Dist-Tag `extended-stable` unabhängig und bleibt absichtlich unverändert.

Nachdem beide Läufe erfolgreich abgeschlossen wurden, veröffentlichen Sie jedes über npm veröffentlichbare offizielle Plugin von exakt derselben Branch-Spitze. Patch `P` muss `33` oder größer sein. Übergeben Sie den vollständigen Release-SHA als `ref`, warten Sie auf die vollständige Matrix und das erneute Auslesen der Registry und speichern Sie anschließend die ID des erfolgreichen Plugin-NPM-Release-Laufs:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Der Workflow verwendet den regulären vorbereiteten Paketbestand `all-publishable`, einschließlich Paketen, deren Quellcode sich nicht geändert hat. Vor dem erfolgreichen Abschluss prüft er jedes exakte Paket und jedes Plugin-Tag `extended-stable`. Wenn ein Teillauf fehlschlägt, führen Sie denselben Befehl erneut aus: Bereits veröffentlichte Pakete werden wiederverwendet, fehlende oder veraltete Plugin-Tags werden innerhalb der npm-Release-Umgebung abgeglichen und das abschließende erneute Auslesen deckt weiterhin den vollständigen Paketsatz ab.

Nachdem der Plugin-Workflow erfolgreich abgeschlossen wurde und die npm-Release-Umgebung bereit ist, veröffentlichen Sie das exakte Core-Tarball aus der Vorabprüfung. Die Core-Veröffentlichung prüft, dass der referenzierte Plugin-Lauf für denselben kanonischen Branch und exakt denselben Quell-SHA den Status `completed/success` besitzt:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Fügen Sie für eine Fork- oder nicht produktive Testausführung, die absichtlich die monatliche `.33`-Regel oder die Monatsrichtlinie für das geschützte `main` nicht erfüllen kann, sowohl dem Dispatch der npm-Vorabprüfung als auch dem Veröffentlichungs-Dispatch `-f bypass_extended_stable_guard=true` hinzu. Der Standardwert ist `false`. Die Umgehung wird nur zusammen mit `npm_dist_tag=extended-stable` akzeptiert und in der Workflow-Zusammenfassung protokolliert. Sie umgeht weder die kanonische Workflow-Referenz `extended-stable/YYYY.M.33` noch die Übereinstimmung von Branch-Spitze, Tag und Checkout, die Syntax finaler Tags, die Übereinstimmung von Paket- und Tag-Version, die Identität referenzierter Läufe und Manifeste, die Herkunft des Tarballs, die Umgebungsgenehmigung, das erneute Auslesen der Registry oder den Nachweis der Selektorreparatur.

Der Veröffentlichungs-Workflow prüft die Identitäten der referenzierten Vorabprüfung, Validierung und Plugin-Läufe, den Digest des vorbereiteten Tarballs sowie die Core-Registry-Selektoren. Bestätigen Sie das Ergebnis unabhängig, nachdem der Workflow erfolgreich abgeschlossen wurde:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Beide Befehle müssen `YYYY.M.P` zurückgeben. Wenn die Veröffentlichung erfolgreich ist, das erneute Auslesen des Selektors jedoch fehlschlägt, veröffentlichen Sie die unveränderliche Paketversion nicht erneut. Verwenden Sie den einzelnen Reparaturbefehl `npm dist-tag add openclaw@YYYY.M.P extended-stable`, der in der stets ausgeführten Zusammenfassung des fehlgeschlagenen Workflows ausgegeben wird, und wiederholen Sie anschließend beide unabhängigen Auslesevorgänge. Ein Rollback auf den vorherigen Selektor ist eine separate Betreiberentscheidung und nicht der Reparaturpfad für das erneute Auslesen.

Die öffentliche Support-Dokumentation weist zunächst Slack, Discord und Codex als abgedeckte Extended-Stable-Plugin-Oberflächen aus. Diese Liste ist eine Support-Aussage und keine Allowlist im Release-Code: Jedes über npm veröffentlichbare offizielle Plugin folgt demselben Veröffentlichungspfad mit exakt übereinstimmender Version.

Die nachstehende reguläre Checkliste bleibt für Beta, `latest`, GitHub Release, Plugins, macOS, Windows und Veröffentlichungen auf anderen Plattformen maßgeblich. Führen Sie diese Schritte nicht für diesen npm-exklusiven Extended-Stable-Pfad aus.

## Checkliste für reguläre Release-Verantwortliche

Diese Checkliste bildet die öffentliche Struktur des Release-Ablaufs ab. Details zu privaten Anmeldedaten, Signierung, Beglaubigung, Wiederherstellung von Dist-Tags und Notfall-Rollbacks verbleiben im ausschließlich für Maintainer bestimmten Release-Runbook.

1. Beginnen Sie mit dem aktuellen `main`: Rufen Sie den neuesten Stand ab, bestätigen Sie, dass der Ziel-Commit gepusht wurde, und vergewissern Sie sich, dass die CI von `main` ausreichend fehlerfrei ist, um davon einen Branch zu erstellen.
2. Erzeugen Sie den obersten Abschnitt von `CHANGELOG.md` aus zusammengeführten PRs und allen direkten Commits seit dem letzten erreichbaren Release-Tag. Formulieren Sie die Einträge für Benutzer, entfernen Sie Überschneidungen zwischen PR- und Direkt-Commit-Einträgen, committen und pushen Sie die Änderungen und führen Sie vor dem Erstellen des Branches erneut einen Rebase beziehungsweise Pull durch. Wenn ein abweichendes ausgeliefertes Tag oder ein späterer Forward-Port bereits veröffentlichte PRs neu zuordnet, übergeben Sie dieses Tag ausdrücklich als `--shipped-ref`; die Prüfung verwendet explizite PR-Zeilen aus vollständigen Beitragsdatensätzen in nummerierten Abschnitten des Tag-Snapshots, ignoriert `Unreleased` und zeichnet den exakten Bestand und die Anzahl der ausgeschlossenen PRs auf.
3. Prüfen Sie die Aufzeichnungen zur Release-Kompatibilität in `src/plugins/compat/registry.ts` und `src/commands/doctor/shared/deprecation-compat.ts`. Entfernen Sie abgelaufene Kompatibilität nur, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren Sie, warum sie bewusst beibehalten wird.
4. Erstellen Sie `release/YYYY.M.PATCH` aus dem aktuellen `main`. Führen Sie normale Release-Arbeiten nicht direkt auf `main` aus.
5. Erhöhen Sie für das Tag die Version an allen erforderlichen Stellen und führen Sie anschließend `pnpm release:prep` aus. Dadurch werden nacheinander Plugin-Versionen, npm-Shrinkwraps, das Plugin-Inventar, das Basiskonfigurationsschema, die Konfigurationsmetadaten gebündelter Kanäle, die Baseline der Konfigurationsdokumentation, die Exporte des Plugin SDK und die API-Baseline des Plugin SDK aktualisiert. Committen Sie vor dem Taggen alle erzeugten Abweichungen und führen Sie danach die lokale deterministische Vorabprüfung aus: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus. Solange noch kein Tag existiert, ist für eine reine Validierungsvorabprüfung ein vollständiger 40-stelliger SHA des Release-Branches zulässig. Die Vorabprüfung erzeugt Release-Nachweise für Abhängigkeiten für den exakt ausgecheckten Abhängigkeitsgraphen und speichert sie im npm-Vorabprüfungsartefakt. Speichern Sie die erfolgreiche `preflight_run_id`.
7. Starten Sie alle Tests vor dem Release über `Full Release Validation` für den Release-Branch, das Tag oder den vollständigen Commit-SHA. Dies ist der einzige manuelle Einstiegspunkt für die vier großen Release-Testbereiche: Vitest, Docker, QA Lab und Package. Speichern Sie die `full_release_validation_run_id` und den exakten `full_release_validation_run_attempt`; beide sind erforderliche Eingaben für `OpenClaw NPM Release` und `OpenClaw Release Publish`.
8. Wenn die Validierung fehlschlägt, beheben Sie den Fehler auf dem Release-Branch und führen Sie erneut nur die kleinste fehlgeschlagene Datei, Lane, Workflow-Aufgabe, das kleinste Paketprofil, den Provider oder die Modell-Zulassungsliste aus, die beziehungsweise der die Korrektur nachweist. Führen Sie den vollständigen übergreifenden Lauf nur erneut aus, wenn die geänderte Oberfläche frühere Nachweise ungültig macht.
9. Führen Sie für einen getaggten Beta-Kandidaten auf dem passenden Branch `release/YYYY.M.PATCH` den Befehl `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` aus. Übergeben Sie für eine stabile Version zusätzlich das erforderliche Windows-Quellrelease: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. Das Hilfsprogramm verwendet das vertrauenswürdige `main` als Workflow-Quelle, während jeder Workflow auf das exakte Tag ausgerichtet ist. Es speichert die unveränderliche Identität des Kandidaten und der Werkzeuge sowie die IDs der gestarteten Läufe in `.artifacts/release-candidate/<tag>/release-candidate-state.json`; eine erneute Ausführung desselben Befehls setzt genau diese Läufe fort, während jede Abweichung bei Kandidat, Werkzeugen, Profil oder Optionen zum sicheren Abbruch führt. Bevor es die vollständige Validierungsmatrix startet, rendert das Hilfsprogramm deterministisch den exakten GitHub-Release-Text des Tags und weist eine fehlende Versionsüberschrift, einen zu langen Text, für den die kanonische Kompaktform nicht verwendet werden kann, oder eine Herkunft von Basis und Ziel des Beitragsdatensatzes zurück, die vom Tag aus nicht erreichbar ist. Außerdem validiert es alle expliziten Ausschlussmetadaten zur ausgelieferten Baseline anhand der referenzierten kumulativen Tag-Datensätze. Anschließend führt es die lokalen Prüfungen des erzeugten Releases aus, startet oder verifiziert die vollständige Release-Validierung und die npm-Vorabprüfungsnachweise, führt einen Parallels-Nachweis für Neuinstallation und Aktualisierung anhand des exakt vorbereiteten Tarballs sowie einen Telegram-Paketnachweis aus, zeichnet die Pläne für Plugin-Veröffentlichungen auf npm und ClawHub auf und gibt den exakten Befehl für `OpenClaw Release Publish` erst aus, wenn das Nachweispaket fehlerfrei ist.

   `OpenClaw Release Publish` veröffentlicht die ausgewählten oder alle veröffentlichbaren Plugin-Pakete parallel auf npm und dieselbe Auswahl auf ClawHub und übernimmt anschließend das vorbereitete npm-Vorabprüfungsartefakt von OpenClaw mit dem passenden Dist-Tag, sobald die Veröffentlichung der Plugins auf npm erfolgreich war. Der Release-Checkout bleibt das Stammverzeichnis für Produkt und Daten, während Planung und abschließende Verifizierung aus dem exakten vertrauenswürdigen Checkout der Workflow-Quelle erfolgen, damit ein älterer Release-Commit nicht unbemerkt veraltete Release-Werkzeuge verwenden kann. Bevor ein untergeordneter Veröffentlichungsvorgang beginnt, rendert und speichert der Workflow den exakten GitHub-Release-Text zwischen. Wenn der vollständige passende Abschnitt von `CHANGELOG.md` sowohl unter GitHubs Grenze von 125.000 Zeichen als auch unter der entsprechenden Sicherheitsgrenze des Renderers von 125.000 Byte bleibt, enthält die Seite einschließlich ihrer Überschrift exakt diesen Abschnitt `## YYYY.M.PATCH`. Wenn der Quellabschnitt nicht hineinpasst, behält die Seite die exakt gruppierten redaktionellen Hinweise bei und ersetzt den übergroßen Beitragsdatensatz durch einen stabilen Link zum vollständigen Datensatz in der durch das Tag fixierten `CHANGELOG.md`; unvollständige Datensätze und abgeschnittene Aufzählungspunkte werden niemals veröffentlicht. Der Workflow wählt den vollständigen oder kompakten Text aus, bevor er `### Release verification` hinzufügt; würde der Nachweisanhang die Grenze überschreiten, behält er den kanonischen Text bei und stützt sich stattdessen auf den unveränderlichen angehängten Nachweis. Stabile Releases, die unter npm `latest` veröffentlicht werden, werden zum neuesten GitHub-Release, während stabile Wartungsreleases, die unter npm `beta` verbleiben, mit GitHub `latest=false` erstellt werden. Für die Behandlung von Vorfällen nach dem Release lädt der Workflow außerdem die Vorabprüfungsnachweise für Abhängigkeiten, das Manifest der vollständigen Validierung und die Nachweise der Registry-Verifizierung nach der Veröffentlichung in das GitHub-Release hoch. Er gibt die IDs untergeordneter Läufe sofort aus, genehmigt automatisch die Freigaben von Release-Umgebungen, die das Workflow-Token genehmigen darf, fasst fehlgeschlagene untergeordnete Aufgaben mit den Enden ihrer Protokolle zusammen, erstellt die GitHub-Release-Seite vorab als Entwurf und überträgt Windows- und Android-Artefakte gleichzeitig mit der npm-Veröffentlichung von OpenClaw. Sobald diese Phasen erfolgreich sind, schließt er die Release-Seite und die Abhängigkeitsnachweise ab, wartet bei jeder Veröffentlichung von OpenClaw auf npm auf ClawHub, führt anschließend die Beta-Prüfung vom vertrauenswürdigen `main` aus und lädt Nachweise nach der Veröffentlichung für das GitHub-Release, das npm-Paket, die ausgewählten Plugin-Pakete auf npm, die ausgewählten ClawHub-Pakete, die IDs untergeordneter Workflow-Läufe und die optionale NPM-Telegram-Lauf-ID hoch. Die ClawHub-Bootstrap-Prüfung erfordert den exakten Workflow-Pfad und SHA des vertrauenswürdigen `main`, die Laufversuche des Erzeugers und des abschließenden Laufs, den Release-SHA, die angeforderte Paketauswahl, das unveränderliche Tupel des Paketartefakts und das Artefakt der abschließenden Rücklesung aus der Registry; ein erfolgreicher älterer Lauf mit einer Release-Referenz wird nicht akzeptiert.

   Führen Sie anschließend die Paketabnahme nach der Veröffentlichung anhand des veröffentlichten Pakets `openclaw@YYYY.M.PATCH-beta.N` oder `openclaw@beta` aus. Wenn eine gepushte oder veröffentlichte Vorabversion korrigiert werden muss, erstellen Sie die nächste passende Vorabversionsnummer; löschen oder überschreiben Sie niemals die alte Version.

10. Fahren Sie bei einer stabilen Version erst fort, wenn die geprüfte Beta-Version oder der Release-Kandidat über die erforderlichen Validierungsnachweise verfügt. Auch die stabile npm-Veröffentlichung erfolgt über `OpenClaw Release Publish`, wobei das erfolgreiche Vorabprüfungsartefakt über `preflight_run_id` wiederverwendet wird. Die Freigabebereitschaft des stabilen macOS-Releases erfordert außerdem die gepackten Dateien `.zip`, `.dmg` und `.dSYM.zip` sowie eine aktualisierte `appcast.xml` auf `main`; der macOS-Veröffentlichungsworkflow veröffentlicht den signierten Appcast automatisch im öffentlichen `main`, nachdem die Release-Artefakte verifiziert wurden, oder öffnet beziehungsweise aktualisiert einen Appcast-PR, wenn der Branch-Schutz den direkten Push blockiert. Die Freigabebereitschaft von Windows Hub erfordert die signierten Artefakte `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` und `OpenClawCompanion-SHA256SUMS.txt` im GitHub-Release von OpenClaw. Übergeben Sie das exakte signierte Release-Tag von `openclaw/openclaw-windows-node` als `windows_node_tag` und dessen vom Kandidaten genehmigte Zuordnung von Installer-Prüfsummen als `windows_node_installer_digests`; `OpenClaw Release Publish` behält den Release-Entwurf bei, startet `Windows Node Release` und verifiziert vor der Veröffentlichung alle drei Artefakte.
11. Führen Sie nach der Veröffentlichung die npm-Prüfung nach der Veröffentlichung aus, optional den eigenständigen Telegram-E2E-Test des veröffentlichten npm-Pakets, wenn Sie einen Kanalnachweis nach der Veröffentlichung benötigen, bei Bedarf die Übernahme des Dist-Tags, prüfen Sie die erzeugte GitHub-Release-Seite, führen Sie die Schritte zur Release-Ankündigung aus und schließen Sie anschließend [Abschluss des stabilen Zustands auf main](#stable-main-closeout) ab, bevor Sie ein stabiles Release als fertig bezeichnen.

## Abschluss des stabilen Zustands auf main

Die stabile Veröffentlichung ist erst abgeschlossen, wenn `main` den tatsächlich ausgelieferten Release-Zustand enthält.

1. Beginnen Sie mit einem frischen, aktuellen `main`. Prüfen Sie `release/YYYY.M.PATCH` dagegen und portieren Sie tatsächliche Korrekturen, die in `main` fehlen, vorwärts. Führen Sie nicht unbesehen ausschließlich für das Release bestimmte Kompatibilitäts-, Test- oder Validierungsadapter in das neuere `main` zusammen.
2. Setzen Sie `main` auf die ausgelieferte stabile Version und nicht auf einen spekulativen nächsten Release-Zyklus. Führen Sie nach der Änderung der Stammversion `pnpm release:prep` und anschließend `pnpm deps:shrinkwrap:generate` aus.
3. Sorgen Sie dafür, dass der Abschnitt `## YYYY.M.PATCH` von `CHANGELOG.md` auf `main` exakt dem getaggten Release-Branch entspricht. Beziehen Sie die stabile Aktualisierung von `appcast.xml` ein, wenn das macOS-Release eine veröffentlicht hat.
4. Fügen Sie `YYYY.M.PATCH+1`, eine Beta-Version oder einen leeren zukünftigen Changelog-Abschnitt erst dann zu `main` hinzu, wenn der Betreiber diesen Release-Zyklus ausdrücklich startet.
5. Führen Sie `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` und `OPENCLAW_TESTBOX=1 pnpm check:changed` aus. Pushen Sie die Änderungen und verifizieren Sie anschließend, dass `origin/main` die ausgelieferte Version und den Changelog enthält, bevor Sie das stabile Release als abgeschlossen bezeichnen.
6. Halten Sie die Repository-Variablen `RELEASE_ROLLBACK_DRILL_ID` und `RELEASE_ROLLBACK_DRILL_DATE` nach jeder privaten Rücksetzungsübung aktuell.

`OpenClaw Stable Main Closeout` beginnt mit dem Push auf `main`, der nach der stabilen Veröffentlichung die ausgelieferte Version, den Changelog und den Appcast enthält. Der Workflow liest unveränderliche Nachweise nach der Veröffentlichung, um das ausgelieferte Tag an seine Läufe für die vollständige Release-Validierung und Veröffentlichung zu binden, und verifiziert anschließend den stabilen Zustand von `main`, das Release, die vorgeschriebene stabile Beobachtungsphase und die blockierenden Leistungsnachweise. Er hängt ein unveränderliches Abschlussmanifest und dessen Prüfsumme an das GitHub-Release an. Der automatische Push-Auslöser überspringt ältere Releases, die vor der Einführung unveränderlicher Nachweise nach der Veröffentlichung entstanden sind, und behandelt dieses Überspringen niemals als abgeschlossenen Abschluss.

Ein vollständiger Abschluss erfordert beide Artefakte und eine passende Prüfsumme. Bei einem unvollständigen Manifest werden der darin aufgezeichnete `main`-SHA und die Rücksetzungsübung erneut verwendet, um identische Bytes zu erzeugen; anschließend wird die fehlende Prüfsumme angehängt. Ein ungültiges Paar oder eine Prüfsumme ohne Manifest bleibt blockierend. Ein durch einen Push ausgelöster Lauf ohne Repository-Variablen für die Rücksetzungsübung wird übersprungen, ohne den Abschluss zu vollenden; ein fehlender oder mehr als 90 Tage alter Übungsdatensatz blockiert weiterhin einen manuellen, nachweisgestützten Abschluss. Private Wiederherstellungsbefehle verbleiben im ausschließlich für Maintainer bestimmten Betriebshandbuch. Verwenden Sie die manuelle Ausführung nur, um einen nachweisgestützten stabilen Abschluss zu reparieren oder erneut abzuspielen.

Ein älteres Korrektur-Tag als Rückfalllösung darf die Nachweise des Basispakets nur wiederverwenden, wenn das Korrektur-Tag auf denselben Quell-Commit wie das stabile Basis-Tag verweist. Sein Android-Release verwendet das verifizierte APK des Basis-Tags erneut und ergänzt die Herkunft für das Korrektur-Tag. Eine Korrektur mit einer anderen Quelle muss eigene Paketnachweise veröffentlichen und verifizieren sowie einen höheren Android-`versionCode` verwenden.

## Release-Vorabprüfung

- Führen Sie vor dem Release-Preflight `pnpm check:test-types` aus, damit Test-TypeScript auch außerhalb des schnelleren lokalen Gates `pnpm check` abgedeckt bleibt.
- Führen Sie vor dem Release-Preflight `pnpm check:architecture` aus, damit die umfassenderen Prüfungen auf Importzyklen und Architekturgrenzen auch außerhalb des schnelleren lokalen Gates erfolgreich sind.
- Führen Sie vor `pnpm release:check` den Befehl `pnpm build && pnpm ui:build` aus, damit die erwarteten Release-Artefakte unter `dist/*` und das Control-UI-Bundle für den Paketvalidierungsschritt vorhanden sind.
- Führen Sie `pnpm release:prep` nach der Erhöhung der Root-Version und vor dem Tagging aus. Der Befehl führt alle deterministischen Release-Generatoren aus, bei denen es nach einer Versions-, Konfigurations- oder API-Änderung häufig zu Abweichungen kommt: Plugin-Versionen, npm-Shrinkwraps, Plugin-Inventar, Basiskonfigurationsschema, Konfigurationsmetadaten der gebündelten Kanäle, Baseline der Konfigurationsdokumentation, Exporte des Plugin-SDK und API-Baseline des Plugin-SDK. `pnpm release:check` führt diese Prüfungen erneut im Prüfmodus aus, ergänzt um eine Budgetprüfung der Oberfläche des Plugin-SDK, und meldet alle Abweichungen der generierten Dateien in einem Durchlauf, bevor die Paket-Release-Prüfungen ausgeführt werden.
- Die Synchronisierung der Plugin-Versionen aktualisiert standardmäßig das veröffentlichbare Runtime-Paket `@openclaw/ai`, die Versionen der offiziellen Plugin-Pakete und bestehende Untergrenzen in `openclaw.compat.pluginApi` auf die OpenClaw-Release-Version. Behandeln Sie dieses Feld als Untergrenze der Plugin-SDK-/Runtime-API und nicht lediglich als Kopie der Paketversion: Bei reinen Plugin-Releases, die absichtlich mit älteren OpenClaw-Hosts kompatibel bleiben, behalten Sie als Untergrenze die älteste unterstützte Host-API bei und dokumentieren diese Entscheidung im Nachweis zum Plugin-Release.
- Führen Sie vor der Release-Freigabe den manuellen Workflow `Full Release Validation` aus, um alle Testumgebungen vor dem Release über einen einzigen Einstiegspunkt zu starten. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, startet manuell `CI` und startet `OpenClaw Release Checks` für Installations-Smoke-Tests, Paketakzeptanz, betriebssystemübergreifende Paketprüfungen, QA-Lab-Parität sowie Matrix- und Telegram-Prüfläufe. Stabile und vollständige Durchläufe enthalten immer umfassende Live-/E2E-Prüfungen und Dauertests des Docker-Release-Pfads; `run_release_soak=true` bleibt für einen ausdrücklich angeforderten Beta-Dauertest erhalten. Package Acceptance stellt während der Kandidatenvalidierung den kanonischen Paket-Telegram-E2E-Test bereit und vermeidet damit einen zweiten gleichzeitig ausgeführten Live-Poller.

  Geben Sie nach der Veröffentlichung einer Beta `release_package_spec` an, um das ausgelieferte npm-Paket über Release-Prüfungen, Package Acceptance und den Paket-Telegram-E2E-Test hinweg wiederzuverwenden, ohne den Release-Tarball neu zu erstellen. Geben Sie `npm_telegram_package_spec` nur an, wenn Telegram ein anderes veröffentlichtes Paket als die übrige Release-Validierung verwenden soll. Geben Sie `package_acceptance_package_spec` an, wenn Package Acceptance ein anderes veröffentlichtes Paket als das in der Release-Paketspezifikation verwenden soll. Geben Sie `evidence_package_spec` an, wenn der Release-Nachweisbericht belegen soll, dass die Validierung einem veröffentlichten npm-Paket entspricht, ohne Telegram-E2E zu erzwingen.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie einen zusätzlichen unabhängigen Nachweis für einen Paketkandidaten benötigen, während die Release-Arbeiten fortgesetzt werden. Verwenden Sie `source=npm` für `openclaw@beta`, `openclaw@latest` oder eine genaue Release-Version, `source=ref`, um einen vertrauenswürdigen Branch, ein Tag oder eine SHA aus `package_ref` mit dem aktuellen `workflow_ref`-Testgerüst zu paketieren, `source=url` für einen öffentlichen HTTPS-Tarball mit erforderlicher SHA-256-Prüfsumme und strenger Richtlinie für öffentliche URLs, `source=trusted-url` für eine benannte Richtlinie für vertrauenswürdige Quellen mit erforderlicher `trusted_source_id` und SHA-256-Prüfsumme oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Durchlauf hochgeladen wurde.

  Der Workflow löst den Kandidaten zu `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler für diesen Tarball erneut und kann Telegram-QA mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` gegen denselben Tarball ausführen. Wenn die ausgewählten Docker-Prüfläufe `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket sowohl als installierte CLI als auch als zu testendes Paket, sodass der verwaltete Neustartpfad des Aktualisierungsbefehls des Kandidaten geprüft wird.

  Beispiel:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Häufig verwendete Profile:
  - `smoke`: Prüfpfade für Installation/Kanal/Agent, Gateway-Netzwerk und erneutes Laden der Konfiguration
  - `package`: artefaktnative Prüfpfade für Paket/Aktualisierung/Neustart/Plugin ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Bereinigung von Cron/Subagenten, OpenAI-Websuche und OpenWebUI
  - `full`: Abschnitte des Docker-Release-Pfads mit OpenWebUI
  - `custom`: genaue Auswahl von `docker_lanes` für eine gezielte Wiederholung

- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur eine deterministische normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuell gestartete CI-Durchläufe umgehen die Eingrenzung auf Änderungen und erzwingen die Linux-Node-Shards, Shards gebündelter Plugins, Vertrags-Shards für Plugins und Kanäle, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Tests für erstellte Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS und die i18n-Prüfpfade der Control UI. Eigenständige manuelle CI-Durchläufe führen Android nur aus, wenn sie mit `include_android=true` gestartet werden; `Full Release Validation` übergibt diese Eingabe an seinen untergeordneten CI-Workflow.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie die Release-Telemetrie validieren. Der Befehl führt QA-Lab über einen lokalen OTLP/HTTP-Empfänger aus und überprüft den Export von Traces, Metriken und Protokollen sowie begrenzte Trace-Attribute und die Schwärzung von Inhalten und Kennungen, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm qa:otel:collector-smoke` aus, wenn Sie die Collector-Kompatibilität validieren. Der Befehl leitet denselben OTLP-Export von QA-Lab durch einen echten Docker-Container mit OpenTelemetry Collector, bevor die Prüfungen des lokalen Empfängers ausgeführt werden.
- Führen Sie `pnpm qa:prometheus:smoke` aus, wenn Sie geschütztes Prometheus-Scraping validieren. Der Befehl führt QA-Lab aus, weist nicht authentifizierte Scraping-Anfragen zurück und überprüft, dass für das Release kritische Metrikfamilien frei von Prompt-Inhalten, unverarbeiteten Kennungen, Authentifizierungstoken und lokalen Pfaden bleiben.
- Führen Sie `pnpm qa:observability:smoke` aus, um die OpenTelemetry- und Prometheus-Smoke-Prüfpfade für den Quellcode-Checkout nacheinander auszuführen.
- Führen Sie vor jedem getaggten Release `pnpm release:check` aus.
- Der Preflight von `OpenClaw NPM Release` erzeugt Nachweise zu Release-Abhängigkeiten, bevor der npm-Tarball paketiert wird. Das npm-Gate für bekannte Sicherheitslücken blockiert das Release. Die Berichte zu Risiken im transitiven Manifest, zur Abhängigkeitsverantwortung und Installationsoberfläche sowie zu Abhängigkeitsänderungen dienen ausschließlich als Release-Nachweise. Der Bericht zu Abhängigkeitsänderungen vergleicht den Release-Kandidaten mit dem vorherigen erreichbaren Release-Tag. Der Preflight lädt die Abhängigkeitsnachweise als `openclaw-release-dependency-evidence-<tag>` hoch und bettet sie außerdem unter `dependency-evidence/` in das vorbereitete npm-Preflight-Artefakt ein. Der eigentliche Veröffentlichungspfad verwendet dieses Preflight-Artefakt erneut und hängt anschließend dieselben Nachweise als `openclaw-<version>-dependency-evidence.zip` an das GitHub-Release an.
- Führen Sie `OpenClaw Release Publish` für die verändernde Veröffentlichungssequenz aus, nachdem das Tag vorhanden ist. Starten Sie reguläre Beta- und stabile Veröffentlichungen vom vertrauenswürdigen Branch `main`; das Release-Tag wählt weiterhin den genauen Ziel-Commit aus und kann auf `release/YYYY.M.PATCH` verweisen. Tideclaw-Alpha-Veröffentlichungen verbleiben auf ihrem jeweiligen Alpha-Branch. Übergeben Sie die erfolgreiche OpenClaw-npm-`preflight_run_id`, die erfolgreiche `full_release_validation_run_id` und den genauen `full_release_validation_run_attempt`, und behalten Sie den standardmäßigen Plugin-Veröffentlichungsumfang `all-publishable` bei, sofern Sie nicht bewusst eine gezielte Reparatur ausführen. Der Workflow führt die npm-Veröffentlichung der Plugins, die ClawHub-Veröffentlichung der Plugins und die OpenClaw-npm-Veröffentlichung nacheinander aus, damit das Kernpaket nicht vor seinen externalisierten Plugins veröffentlicht wird; die Windows- und Android-Bereitstellung wird parallel zur Veröffentlichung des Kernpakets auf npm gegen die Entwurfsseite des Releases ausgeführt. Wiederholungen der Veröffentlichung können fortgesetzt werden: Eine bereits auf npm veröffentlichte Kernversion überspringt den Kern-Start, nachdem der Workflow nachgewiesen hat, dass der Registry-Tarball dem Preflight-Artefakt des Tags entspricht. Die Windows-/Android-Bereitstellung wird übersprungen, wenn das Release bereits den verifizierten Artefaktvertrag erfüllt, sodass bei einer Wiederholung nur die fehlgeschlagenen Stufen erneut ausgeführt werden. Gezielte Reparaturen ausschließlich an Plugins erfordern `plugin_publish_scope=selected` und eine nicht leere Plugin-Liste. Reine Plugin-Durchläufe mit `all-publishable` erfordern vollständige, unveränderliche Preflight- und Full-Release-Validation-Nachweise; unvollständige Nachweise werden abgelehnt.
- Eine stabile Ausführung von `OpenClaw Release Publish` erfordert ein genaues `windows_node_tag`, nachdem das zugehörige Release ohne Vorabversionskennzeichnung von `openclaw/openclaw-windows-node` vorhanden ist, sowie die für den Kandidaten freigegebene Zuordnung `windows_node_installer_digests`. Bevor ein untergeordneter Veröffentlichungsworkflow gestartet wird, prüft der Workflow, dass das Quell-Release veröffentlicht und keine Vorabversion ist, die erforderlichen x64-/ARM64-Installationsprogramme enthält und weiterhin dieser freigegebenen Zuordnung entspricht. Anschließend startet er `Windows Node Release`, während sich das OpenClaw-Release noch im Entwurfsstatus befindet, und übergibt die festgelegte Zuordnung der Prüfsummen der Installationsprogramme unverändert. Der untergeordnete Workflow lädt die signierten Windows-Hub-Installationsprogramme von genau diesem Tag herunter, gleicht sie mit den festgelegten Prüfsummen ab, überprüft auf einem Windows-Runner, dass ihre Authenticode-Signaturen den erwarteten Unterzeichner OpenClaw Foundation verwenden, erstellt ein SHA-256-Manifest und lädt die Installationsprogramme samt Manifest in das kanonische OpenClaw-GitHub-Release hoch. Anschließend lädt er die bereitgestellten Artefakte erneut herunter und überprüft ihre Zugehörigkeit zum Manifest sowie ihre Hashwerte. Der übergeordnete Workflow überprüft vor der Veröffentlichung den aktuellen Vertrag für x64-, ARM64- und Prüfsummenartefakte. Die direkte Wiederherstellung weist unerwartete Artefaktnamen nach dem Muster `OpenClawCompanion-*` zurück, bevor die erwarteten Vertragsartefakte durch die festgelegten Bytes aus der Quelle ersetzt werden.

  Starten Sie `Windows Node Release` nur zur Wiederherstellung manuell und übergeben Sie immer ein genaues Tag, niemals `latest`, sowie die ausdrückliche JSON-Zuordnung `expected_installer_digests` aus dem freigegebenen Quell-Release. Downloadlinks auf der Website sollten auf die genauen URLs der OpenClaw-Release-Artefakte für das aktuelle stabile Release verweisen oder erst dann auf `releases/latest/download/...`, nachdem überprüft wurde, dass die Weiterleitung von GitHubs neuestem Release auf dasselbe Release verweist; verlinken Sie nicht ausschließlich auf die Release-Seite des Companion-Repositorys.

- Release-Prüfungen werden jetzt in einem separaten manuellen Workflow ausgeführt: `OpenClaw Release Checks`. Vor der Release-Freigabe führt er außerdem den Mock-Paritäts-Testpfad des QA Lab sowie das schnelle Live-Matrix-Profil und den Telegram-QA-Testpfad aus. Die Live-Testpfade verwenden die Umgebung `qa-live-shared`; Telegram verwendet zusätzlich Convex-CI-Leases für Anmeldedaten. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie das vollständige Inventar für Matrix-Transport, -Medien und -E2EE parallel prüfen möchten.
- Die laufzeitbezogene Installations- und Upgrade-Validierung über mehrere Betriebssysteme hinweg ist Bestandteil der öffentlichen Workflows `OpenClaw Release Checks` und `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen. Diese Trennung ist beabsichtigt: Der tatsächliche npm-Release-Pfad bleibt kurz, deterministisch und auf Artefakte konzentriert, während langsamere Live-Prüfungen in einem eigenen Testpfad verbleiben, sodass sie die Veröffentlichung weder verzögern noch blockieren.
- Release-Prüfungen, die Secrets verwenden, sollten über `Full Release Validation` oder von der Workflow-Referenz für `main` beziehungsweise den Release ausgelöst werden, damit Workflow-Logik und Secrets kontrolliert bleiben.
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, sofern der aufgelöste Commit über einen OpenClaw-Branch oder ein Release-Tag erreichbar ist.
- Der ausschließlich validierende Preflight von `OpenClaw NPM Release` akzeptiert außerdem den aktuellen vollständigen, 40 Zeichen langen Commit-SHA des Workflow-Branches, ohne ein veröffentlichtes Tag zu erfordern. Dieser SHA-Pfad dient ausschließlich der Validierung und kann nicht zu einer tatsächlichen Veröffentlichung hochgestuft werden. Im SHA-Modus erzeugt der Workflow `v<package.json version>` nur für die Prüfung der Paketmetadaten; eine tatsächliche Veröffentlichung erfordert weiterhin ein echtes Release-Tag.
- Beide Workflows belassen den tatsächlichen Veröffentlichungs- und Hochstufungspfad auf von GitHub gehosteten Runnern, während der nicht verändernde Validierungspfad die größeren Blacksmith-Linux-Runner verwenden kann.
- Dieser Workflow führt `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` mit den beiden Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus.
- Der npm-Release-Preflight wartet nicht mehr auf den separaten Testpfad für Release-Prüfungen.
- Führen Sie vor dem lokalen Taggen eines Release-Kandidaten `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` aus. Das Hilfsprogramm führt die schnellen Release-Schutzprüfungen, die npm-/ClawHub-Release-Prüfungen für Plugins, den Build, den UI-Build und `release:openclaw:npm:check` in einer Reihenfolge aus, die häufige Fehler, welche die Freigabe blockieren würden, vor dem Start des GitHub-Veröffentlichungsworkflows erkennt.
- Führen Sie vor der Freigabe `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` aus oder verwenden Sie das entsprechende Vorabversions-/Korrektur-Tag.
- Führen Sie nach der npm-Veröffentlichung `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` aus oder verwenden Sie die entsprechende Beta-/Korrekturversion, um den Installationspfad aus der veröffentlichten Registry in einem neuen temporären Präfix zu überprüfen.
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um das Onboarding des installierten Pakets, die Telegram-Einrichtung und einen echten Telegram-E2E-Test mit dem veröffentlichten npm-Paket unter Verwendung des gemeinsam genutzten geleasten Pools von Telegram-Anmeldedaten zu überprüfen. Für einmalige lokale Ausführungen durch Maintainer können die Convex-Variablen entfallen und die drei Umgebungs-Anmeldedaten `OPENCLAW_QA_TELEGRAM_*` direkt übergeben werden.
- Verwenden Sie `pnpm release:beta-smoke -- --beta betaN`, um den vollständigen Smoke-Test nach einer Beta-Veröffentlichung von einem Maintainer-Rechner auszuführen. Das Hilfsprogramm führt die Validierung eines npm-Updates und eines neuen Zielsystems unter Parallels aus, löst `NPM Telegram Beta E2E` aus, fragt exakt diesen Workflow-Lauf ab, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Prüfung nach der Veröffentlichung über den manuellen Workflow `NPM Telegram Beta E2E` in GitHub Actions ausführen. Er ist absichtlich ausschließlich manuell und wird nicht bei jedem Merge ausgeführt.
- Die Release-Automatisierung für Maintainer verwendet zunächst einen Preflight und anschließend die Hochstufung:
  - Eine tatsächliche npm-Veröffentlichung erfordert eine erfolgreiche npm-`preflight_run_id`.
  - Die Orchestrierung und der Preflight regulärer Beta- und stabiler Veröffentlichungen verwenden das vertrauenswürdige `main` mit dem exakten Ziel-Tag. Veröffentlichung und Preflight einer Tideclaw-Alpha-Version verwenden den entsprechenden Alpha-Branch.
  - Stabile npm-Releases verwenden standardmäßig `beta`; eine stabile npm-Veröffentlichung kann über eine Workflow-Eingabe ausdrücklich `latest` als Ziel verwenden.
  - Die tokenbasierte Änderung von npm-Dist-Tags befindet sich in `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, da `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das Quell-Repository ausschließlich über OIDC veröffentlicht.
  - Der öffentliche Workflow `macOS Release` dient ausschließlich der Validierung. Wenn ein Tag nur auf einem Release-Branch vorhanden ist, der Workflow jedoch von `main` ausgelöst wird, setzen Sie `public_release_branch=release/YYYY.M.PATCH`.
  - Eine tatsächliche macOS-Veröffentlichung erfordert eine erfolgreiche macOS-`preflight_run_id` und `validate_run_id`.
  - Tatsächliche Veröffentlichungspfade stufen vorbereitete Artefakte hoch, statt sie erneut zu erstellen.
- Bei stabilen Korrektur-Releases wie `YYYY.M.PATCH-N` überprüft die Nachveröffentlichungsprüfung außerdem denselben Upgrade-Pfad mit temporärem Präfix von `YYYY.M.PATCH` auf `YYYY.M.PATCH-N`, damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem ursprünglichen stabilen Payload belassen.
- Der npm-Release-Preflight schlägt standardmäßig fehl, sofern der Tarball nicht sowohl `dist/control-ui/index.html` als auch einen nicht leeren Payload unter `dist/control-ui/assets/` enthält, damit nicht erneut ein leeres Browser-Dashboard ausgeliefert wird.
- Die Nachveröffentlichungsprüfung kontrolliert außerdem, ob die veröffentlichten Plugin-Einstiegspunkte und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, bei dem Laufzeit-Payloads von Plugins fehlen, besteht die Nachveröffentlichungsprüfung nicht und kann nicht zu `latest` hochgestuft werden.
- `pnpm test:install:smoke` setzt außerdem das Budget für `unpackedSize` des npm-Pakets beim vorgesehenen Update-Tarball durch, sodass der Installer-E2E-Test eine unbeabsichtigte Vergrößerung des Pakets erkennt, bevor der Release-Veröffentlichungspfad beginnt.
- Wenn die Release-Arbeit die CI-Planung, Zeitsteuerungsmanifeste für Erweiterungen oder Testmatrizen für Erweiterungen berührt hat, erzeugen und prüfen Sie vor der Freigabe erneut die vom Planer verwalteten Matrix-Ausgaben für `plugin-prerelease-extension-shard` aus `.github/workflows/plugin-prerelease.yml`, damit die Release-Hinweise kein veraltetes CI-Layout beschreiben.
- Zur Bereitschaft eines stabilen macOS-Releases gehören auch die Aktualisierungsoberflächen: Das GitHub-Release muss schließlich die paketierten Dateien `.zip`, `.dmg` und `.dSYM.zip` enthalten; `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile ZIP-Datei verweisen (der macOS-Veröffentlichungsworkflow committet sie automatisch oder öffnet einen Appcast-PR, wenn direktes Pushen blockiert ist); die paketierte App muss eine Bundle-ID ohne Debug-Kennzeichnung, eine nicht leere Sparkle-Feed-URL und eine `CFBundleVersion` beibehalten, die mindestens dem kanonischen Sparkle-Build-Mindestwert für diese Release-Version entspricht.

## Release-Testsysteme

Mit `Full Release Validation` starten Betreiber alle Vorab-Release-Tests über einen einzigen Einstiegspunkt. Verwenden Sie für den Nachweis eines fixierten Commits auf einem sich schnell ändernden Branch das Hilfsprogramm, damit jeder untergeordnete Workflow von einem temporären Branch ausgeführt wird, der auf einen einzigen vertrauenswürdigen Workflow-SHA von `main` festgelegt ist, während der angeforderte Commit der zu testende Kandidat bleibt:

```bash
pnpm ci:full-release --sha <full-sha>
```

Das Hilfsprogramm ruft den aktuellen Stand von `origin/main` ab, pusht `release-ci/<workflow-sha>-...` für diesen vertrauenswürdigen Workflow-Commit, löst `Full Release Validation` vom temporären Branch mit `ref=<target-sha>` aus, verwendet verfügbare strikte Nachweise für das exakte Ziel erneut, überprüft, dass der `headSha` jedes untergeordneten Workflows dem fixierten SHA des übergeordneten Workflows entspricht, und löscht anschließend den temporären Branch. Übergeben Sie `-f reuse_evidence=false`, um einen neuen Lauf zu erzwingen, oder `--workflow-sha <trusted-main-sha>`, um einen älteren Commit festzulegen, der vom aktuellen `origin/main` weiterhin erreichbar ist. Der Workflow selbst schreibt niemals Repository-Referenzen. Dadurch bleibt die ausschließlich auf `main` verfügbare Release-Werkzeugausstattung nutzbar, ohne dem Kandidaten Werkzeug-Commits hinzuzufügen, und es wird vermieden, versehentlich einen neueren untergeordneten Lauf von `main` als Nachweis zu verwenden.

Führen Sie die Validierung eines Release-Branches oder -Tags von der vertrauenswürdigen Workflow-Referenz `main` aus und übergeben Sie den Release-Branch oder das Tag als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Der Workflow löst die Zielreferenz auf, startet den manuellen Workflow `CI` mit `target_ref=<release-ref>` und anschließend `OpenClaw Release Checks`. `OpenClaw Release Checks` fächert die Ausführung auf Installations-Smoke-Tests, betriebssystemübergreifende Release-Prüfungen, Live-/E2E-Docker-Abdeckung des Release-Pfads bei aktiviertem Dauertest, Package Acceptance mit dem kanonischen Telegram-Paket-E2E-Test, QA-Lab-Parität, Live-Matrix und Live-Telegram auf. Ein vollständiger Lauf beziehungsweise ein Lauf mit allen Prüfungen ist nur akzeptabel, wenn die Zusammenfassung von `Full Release Validation` `normal_ci`, `plugin_prerelease` und `release_checks` als erfolgreich ausweist, sofern bei einer gezielten Wiederholung nicht absichtlich der separate untergeordnete Workflow `Plugin Prerelease` übersprungen wurde. Verwenden Sie den eigenständigen untergeordneten Workflow `npm-telegram` nur für eine gezielte Wiederholung mit einem veröffentlichten Paket und `release_package_spec` oder `npm_telegram_package_spec`. Die abschließende Prüfzusammenfassung enthält für jeden untergeordneten Lauf Tabellen mit den langsamsten Jobs, sodass der Release-Manager den aktuellen kritischen Pfad erkennen kann, ohne Protokolle herunterzuladen.

Der untergeordnete Workflow für die Produktleistung erzeugt in diesem Release-Pfad ausschließlich Artefakte. Der übergeordnete Workflow löst ihn mit `publish_reports=false` aus, und die Validierung wird abgelehnt, sofern seine Schutzprüfung für den reinen Artefaktmodus nicht nachweist, dass die Veröffentlichung des Clawgrit-Berichts übersprungen blieb.

Die vollständige Phasenmatrix, die exakten Namen der Workflow-Jobs, die Unterschiede zwischen stabilem und vollständigem Profil, Artefakte und Optionen für gezielte Wiederholungen finden Sie unter [Vollständige Release-Validierung](/de/reference/full-release-validation).

Untergeordnete Workflows werden von der vertrauenswürdigen Referenz ausgelöst, die `Full Release Validation` ausführt, normalerweise `--ref main`, selbst wenn die Zielreferenz `ref` auf einen älteren Release-Branch oder ein älteres Tag verweist. Jeder untergeordnete Lauf muss den exakten SHA des übergeordneten Workflows verwenden. Wenn `main` vor Abschluss der Auflösung eines untergeordneten Auslösers fortschreitet, schlägt der übergeordnete Workflow standardmäßig fehl. Für `Full Release Validation` gibt es keine separate Eingabe für die Workflow-Referenz; Sie wählen die vertrauenswürdige Testumgebung über die Referenz des Workflow-Laufs aus. Verwenden Sie für den Nachweis eines exakten Commits auf einem sich ändernden `main` nicht `--ref main -f ref=<sha`; unverarbeitete Commit-SHAs können keine Referenzen für Workflow-Auslöser sein. Verwenden Sie daher `pnpm ci:full-release --sha <target-sha>`, um einen temporären Branch am vertrauenswürdigen `origin/main` zu erstellen, während der Ziel-SHA als Kandidateneingabe erhalten bleibt.

Verwenden Sie `release_profile`, um den Umfang der Live-/Provider-Prüfungen auszuwählen:

- `minimum`: schnellster releasekritischer Live- und Docker-Pfad für OpenAI/Core
- `stable`: Mindestumfang plus Abdeckung stabiler Provider und Backends für die Release-Freigabe
- `full`: stabiler Umfang plus breite, informative Abdeckung von Providern und Medien

Die stabile und die vollständige Validierung führen vor der Hochstufung immer die umfassenden Live-/E2E-Prüfungen, den Docker-Release-Pfad sowie den begrenzten Überlebensfähigkeitstest für Upgrades veröffentlichter Versionen aus. Verwenden Sie `run_release_soak=true`, um denselben Durchlauf für eine Beta anzufordern. Dieser Durchlauf deckt die neuesten vier stabilen Pakete sowie die festgelegten Ausgangsversionen `2026.4.23` und `2026.5.2` und zusätzlich die ältere Version `2026.4.15` ab; doppelte Ausgangsversionen werden entfernt, und jede Ausgangsversion wird einem eigenen Docker-Runner-Job zugewiesen.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Referenz, um die Zielreferenz einmalig als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt bei aktivem Dauertest in betriebssystemübergreifenden Prüfungen, Package Acceptance und Docker-Prüfungen des Release-Pfads erneut. Dadurch verwenden alle paketbezogenen Testsysteme exakt dieselben Bytes, und wiederholte Paket-Builds werden vermieden. Nachdem eine Beta bereits auf npm verfügbar ist, setzen Sie `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, damit die Release-Prüfungen das ausgelieferte Paket einmalig herunterladen, den SHA seiner Build-Quelle aus `dist/build-info.json` extrahieren und dieses Artefakt für betriebssystemübergreifende Prüfungen, Package Acceptance, Release-Pfad-Docker und die Telegram-Paket-Testpfade erneut verwenden.

Der betriebssystemübergreifende OpenAI-Installations-Smoke-Test verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die Repository-/Organisationsvariable gesetzt ist, andernfalls `openai/gpt-5.6-luna`, da dieser Testpfad die Paketinstallation, das Onboarding, den Start des Gateway und einen einzelnen Live-Agentendurchlauf nachweist, statt das leistungsfähigste Modell zu benchmarken. Die breitere Matrix für Live-Provider bleibt der vorgesehene Ort für modellspezifische Abdeckung.

Verwenden Sie je nach Release-Phase die folgenden Varianten:

```bash
# Einen unveröffentlichten Release-Candidate-Branch validieren.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Einen bestimmten gepushten Commit validieren.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Nach der Veröffentlichung einer Beta-Version Telegram-E2E für das veröffentlichte Paket hinzufügen.
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

Verwenden Sie nach einer gezielten Korrektur nicht zuerst den vollständigen übergeordneten Workflow für die erneute Ausführung. Wenn eine Box fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job, Docker-Lane, das Paketprofil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen übergeordneten Workflow nur erneut aus, wenn die Korrektur die gemeinsam genutzte Release-Orchestrierung geändert oder frühere Nachweise für alle Boxen ungültig gemacht hat. Der abschließende Prüfer des übergeordneten Workflows überprüft die aufgezeichneten Ausführungs-IDs der untergeordneten Workflows erneut. Führen Sie daher nach der erfolgreichen erneuten Ausführung eines untergeordneten Workflows nur den fehlgeschlagenen übergeordneten Job `Verify full validation` erneut aus.

`rerun_group=all` darf eine frühere erfolgreiche Ausführung des übergeordneten Workflows nur wiederverwenden, wenn sie exakt denselben Ziel-SHA, dasselbe Release-Profil, dieselbe effektive Soak-Einstellung und dieselben Validierungseingaben geprüft hat. Dies ist eine begrenzte Wiederherstellung für die erneute Ausführung desselben Kandidaten, keine Wiederverwendung von Nachweisen über verschiedene SHAs hinweg. Führen Sie für einen geänderten Kandidaten, einschließlich eines Commits, der nur das Änderungsprotokoll oder die Version ändert, jedes Paket-, Artefakt-, Installations-, Docker- oder Provider-Gate erneut aus, das von den geänderten Pfaden oder Artefakt-Hashes betroffen ist. Neuere Ausführungen des übergeordneten Workflows für dieselbe `release/*`-Referenz und Wiederholungsgruppe ersetzen laufende Ausführungen automatisch. Übergeben Sie `reuse_evidence=false`, um eine vollständig neue Ausführung zu erzwingen.

Übergeben Sie für eine begrenzte Wiederherstellung `rerun_group` an den übergeordneten Workflow. `all` ist die eigentliche Release-Candidate-Ausführung, `ci` führt nur den normalen untergeordneten CI-Workflow aus, `plugin-prerelease` nur den ausschließlich für Releases vorgesehenen untergeordneten Plugin-Workflow, `release-checks` jede Release-Box; die enger gefassten Release-Gruppen sind `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`. Gezielte erneute `npm-telegram`-Ausführungen erfordern `release_package_spec` oder `npm_telegram_package_spec`; vollständige beziehungsweise `all`-Ausführungen verwenden das kanonische Paket-Telegram-E2E innerhalb von Package Acceptance. Bei gezielten plattformübergreifenden Wiederholungen kann `cross_os_suite_filter=windows/packaged-upgrade` oder ein anderer Betriebssystem-/Suite-Filter hinzugefügt werden. Fehler bei QA-Release-Prüfungen blockieren die normale Release-Validierung, einschließlich erforderlicher Abweichungsprüfungen für dynamische OpenClaw-Tools in der Standardstufe. Tideclaw-Alpha-Ausführungen dürfen Release-Prüf-Lanes, die nicht der Paketsicherheit dienen, weiterhin als Hinweis behandeln. Mit `release_profile=beta` sind die Live-Provider-Suites von `Run repo/live E2E validation` nur Hinweise (Warnungen, keine Blocker); die Profile „stable“ und „full“ behandeln sie weiterhin als blockierend. Wenn `live_suite_filter` ausdrücklich eine geschützte QA-Live-Lane wie Discord, WhatsApp oder Slack anfordert, muss die entsprechende Repository-Variable `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` aktiviert sein; andernfalls schlägt die Eingabeerfassung fehl, anstatt die Lane stillschweigend zu überspringen.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete Workflow `CI`. Die manuelle CI umgeht absichtlich die Eingrenzung auf Änderungen und erzwingt den normalen Testgraphen für den Release Candidate: Linux-Node-Shards, Shards für gebündelte Plugins, Vertrags-Shards für Plugins und Kanäle, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Tests für gebaute Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Android ist enthalten, wenn `Full Release Validation` die Box ausführt, da der übergeordnete Workflow `include_android=true` übergibt; eine eigenständige manuelle CI benötigt `include_android=true`, um Android abzudecken.

Verwenden Sie diese Box zur Beantwortung der Frage: „Hat der Quellbaum die vollständige normale Testsuite bestanden?“ Sie entspricht nicht der Produktvalidierung des Release-Pfads. Aufzubewahrende Nachweise:

- Zusammenfassung von `Full Release Validation` mit der URL der gestarteten `CI`-Ausführung
- erfolgreiche `CI`-Ausführung für den exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Zeitmessungsartefakte wie `.artifacts/vitest-shard-timings.json`, wenn für eine Ausführung eine Leistungsanalyse erforderlich ist

Führen Sie die manuelle CI nur dann direkt aus, wenn der Release eine deterministische normale CI benötigt, jedoch nicht die Docker-, QA-Lab-, Live-, plattformübergreifenden oder Paket-Boxen. Verwenden Sie den ersten Befehl für eine direkte CI ohne Android. Fügen Sie `include_android=true` hinzu, wenn die direkte Release-Candidate-CI Android abdecken muss:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` über `openclaw-live-and-e2e-checks-reusable.yml` sowie im `install-smoke`-Workflow im Release-Modus. Sie validiert den Release Candidate in paketierten Docker-Umgebungen statt ausschließlich mit Tests auf Quellcodeebene.

Die Docker-Abdeckung für Releases umfasst:

- vollständigen Installations-Smoke-Test mit aktiviertem langsamem globalem Bun-Installations-Smoke-Test
- Vorbereitung beziehungsweise Wiederverwendung des Smoke-Images aus dem Root-Dockerfile anhand des Ziel-SHA, wobei QR-, Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate `install-smoke`-Shards ausgeführt werden
- Repository-E2E-Lanes
- Docker-Abschnitte des Release-Pfads: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` bis `plugins-runtime-install-h` und `openwebui`
- OpenWebUI-Abdeckung auf einem dedizierten Runner mit großem Datenträger, wenn angefordert
- aufgeteilte Installations-/Deinstallations-Lanes für gebündelte Plugins von `bundled-plugin-install-uninstall-0` bis `bundled-plugin-install-uninstall-23`
- Live-/E2E-Provider-Suites und Docker-Abdeckung für Live-Modelle, wenn die Release-Prüfungen Live-Suites enthalten

Verwenden Sie vor einer erneuten Ausführung die Docker-Artefakte. Der Scheduler des Release-Pfads lädt `.artifacts/docker-tests/` mit Lane-Protokollen, `summary.json`, `failures.json`, Phasenzeiten, dem Scheduler-Plan als JSON und Befehlen für erneute Ausführungen hoch. Verwenden Sie für eine gezielte Wiederherstellung `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, anstatt alle Release-Abschnitte erneut auszuführen. Generierte Befehle für erneute Ausführungen enthalten nach Möglichkeit die vorherige `package_artifact_run_id` und Eingaben für vorbereitete Docker-Images, sodass eine fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das Release-Gate für agentisches Verhalten und die Kanalebene und von Vitest sowie den Docker-Paketmechanismen getrennt.

Die QA-Lab-Abdeckung für Releases umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Kandidaten-Lane anhand des agentischen Paritätspakets mit der Baseline `anthropic/claude-opus-4-8` vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Zugangsdaten-Leases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` oder `pnpm qa:observability:smoke`, wenn die Release-Telemetrie einen ausdrücklichen lokalen Nachweis benötigt

Verwenden Sie diese Box zur Beantwortung der Frage: „Verhält sich der Release in QA-Szenarien und Live-Kanalabläufen korrekt?“ Bewahren Sie bei der Freigabe des Releases die Artefakt-URLs für die Paritäts-, Matrix- und Telegram-Lanes auf. Die vollständige Matrix-Abdeckung bleibt als manuelle, in Shards aufgeteilte QA-Lab-Ausführung verfügbar und ist nicht die standardmäßig releasekritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie wird von `Package Acceptance` und dem Resolver `scripts/resolve-openclaw-package-candidate.mjs` unterstützt. Der Resolver normalisiert einen Kandidaten in den von Docker-E2E verwendeten Tarball `package-under-test`, validiert das Paketinventar, zeichnet die Paketversion und SHA-256 auf und hält die Workflow-Harness-Referenz von der Referenz der Paketquelle getrennt.

Unterstützte Kandidatenquellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version
- `source=ref`: einen vertrauenswürdigen Branch, ein Tag oder einen vollständigen Commit-SHA aus `package_ref` mit dem ausgewählten `workflow_ref`-Harness paketieren
- `source=url`: eine öffentliche HTTPS-Datei mit der Endung `.tgz` und erforderlichem `package_sha256` herunterladen; URL-Zugangsdaten, vom Standard abweichende HTTPS-Ports, private/interne/für Sonderzwecke reservierte Hostnamen oder aufgelöste Adressen sowie unsichere Weiterleitungen werden abgelehnt
- `source=trusted-url`: eine HTTPS-Datei mit der Endung `.tgz`, erforderlichem `package_sha256` und `trusted_source_id` aus einer benannten Richtlinie in `.github/package-trusted-sources.json` herunterladen; verwenden Sie dies für von Maintainern betriebene Unternehmens-Mirrors oder private Paket-Repositorys, anstatt `source=url` eine Umgehung privater Netzwerke auf Eingabeebene hinzuzufügen
- `source=artifact`: eine von einer anderen GitHub-Actions-Ausführung hochgeladene `.tgz`-Datei wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape` und `telegram_mode=mock-openai` aus. Package Acceptance behält Migration, Aktualisierung, Aktualisierung von Root-verwalteten VPS, Neustart nach Aktualisierung mit konfigurierter Authentifizierung, Live-Installation von ClawHub-Skills, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Aktualisierung, Absicherung gegen Escaping bei Plugin-Befehlsbindungen und Telegram-Paket-QA für denselben aufgelösten Tarball bei. Blockierende Release-Prüfungen verwenden standardmäßig das neueste veröffentlichte Paket als Baseline; das Beta-Profil mit `run_release_soak=true`, `release_profile=stable` oder `release_profile=full` erweitert die Prüfung überlebender veröffentlichter Upgrades auf `last-stable-4` sowie die festgelegten Baselines `2026.4.23`, `2026.5.2` und `2026.4.15` mit `reported-issues`-Szenarien. Verwenden Sie Package Acceptance mit `source=npm` für einen bereits veröffentlichten Kandidaten, `source=ref` für einen SHA-gestützten lokalen npm-Tarball vor der Veröffentlichung, `source=trusted-url` für einen von Maintainern betriebenen Unternehmens-/Privat-Mirror oder `source=artifact` für einen vorbereiteten Tarball, der von einer anderen GitHub-Actions-Ausführung hochgeladen wurde.

Dies ist der GitHub-native Ersatz für den Großteil der Paket-/Aktualisierungsabdeckung, für die zuvor Parallels erforderlich war. Plattformübergreifende Release-Prüfungen bleiben für betriebssystemspezifisches Onboarding-, Installer- und Plattformverhalten wichtig, doch bei der Produktvalidierung von Paketen und Aktualisierungen sollte Package Acceptance bevorzugt werden.

Die kanonische Prüfliste für die Validierung von Aktualisierungen und Plugins ist [Aktualisierungen und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Prüf-Lane eine Plugin-Installation/-Aktualisierung, eine Doctor-Bereinigung oder eine Migration eines veröffentlichten Pakets nachweist. Die umfassende Migration veröffentlichter Aktualisierungen von jedem stabilen Paket ab `2026.4.23` ist ein separater manueller `Update Migration`-Workflow und nicht Teil der vollständigen Release-CI.

Die Nachsicht der veralteten Paketabnahme ist absichtlich zeitlich begrenzt. Pakete bis einschließlich `2026.4.25` dürfen den Kompatibilitätspfad für bereits auf npm veröffentlichte Metadatenlücken verwenden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, veraltete Speicherorte für Plugin-Installationsdatensätze, fehlende Persistenz von Marketplace-Installationsdatensätzen und Migration von Konfigurationsmetadaten während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf bei lokalen Stempeldateien für Build-Metadaten warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Paketverträge erfüllen; dieselben Lücken führen dann zum Fehlschlagen der Release-Validierung.

Verwenden Sie umfassendere Package-Acceptance-Profile, wenn sich die Release-Frage auf ein tatsächlich installierbares Paket bezieht:

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

- `smoke`: schnelle Prüfpfade für Paketinstallation/Kanal/Agent, Gateway-Netzwerk und erneutes Laden der Konfiguration
- `package`: Verträge für Installation/Aktualisierung/Neustart/Plugin-Pakete sowie Live-Nachweis der Installation eines ClawHub-Skills; dies ist der Standard für Release-Prüfungen
- `product`: `package` plus MCP-Kanäle, Bereinigung von Cron/Subagenten, OpenAI-Websuche und OpenWebUI
- `full`: Abschnitte des Docker-Release-Pfads mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für gezielte Wiederholungsläufe

Aktivieren Sie für den Telegram-Nachweis eines Paketkandidaten `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` bei der Paketabnahme. Der Workflow übergibt den aufgelösten `package-under-test`-Tarball an den Telegram-Prüfpfad; der eigenständige Telegram-Workflow akzeptiert für Prüfungen nach der Veröffentlichung weiterhin eine veröffentlichte npm-Spezifikation.

## Automatisierung regulärer Release-Veröffentlichungen

Für Beta-, `latest`-, Plugin-, GitHub-Release- und Plattformveröffentlichungen ist `OpenClaw Release Publish` der normale Einstiegspunkt mit Änderungen. Der monatliche, ausschließlich npm betreffende Extended-Stable-Pfad für `.33+` verwendet diesen Orchestrator nicht. Der reguläre Workflow orchestriert die Trusted-Publisher-Workflows in der für das Release erforderlichen Reihenfolge:

1. Checken Sie das Release-Tag aus und ermitteln Sie dessen Commit-SHA.
2. Prüfen Sie, ob das Tag von `main` oder `release/*` aus erreichbar ist (oder bei Alpha-Vorabversionen von einem Tideclaw-Alpha-Branch).
3. Führen Sie `pnpm plugins:sync:check` aus.
4. Starten Sie `Plugin NPM Release` mit `publish_scope=all-publishable` und `ref=<release-sha>`.
5. Starten Sie `Plugin ClawHub Release` mit demselben Gültigkeitsbereich und derselben SHA.
6. Starten Sie `OpenClaw NPM Release` mit dem Release-Tag, dem npm-Dist-Tag und der gespeicherten `preflight_run_id`, nachdem die gespeicherte `full_release_validation_run_id` und der exakte Ausführungsversuch geprüft wurden.
7. Erstellen oder aktualisieren Sie bei stabilen Releases das GitHub-Release als Entwurf, starten Sie `Windows Node Release` mit dem expliziten `windows_node_tag` und den vom Kandidatenprozess genehmigten `windows_node_installer_digests`, und prüfen Sie die kanonischen Windows-Installer-/Prüfsummen-Artefakte. Starten Sie außerdem `Android Release`, um die signierte APK des exakten Tags samt Prüfsumme und Provenienz zu erstellen. Prüfen Sie beide nativen Artefaktverträge, bevor Sie den Entwurf veröffentlichen.

Beispiel für eine Beta-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Stabile Veröffentlichung mit dem standardmäßigen Beta-Dist-Tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Die direkte Heraufstufung einer stabilen Version auf `latest` erfolgt explizit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Verwenden Sie die untergeordneten Workflows `Plugin NPM Release` und `Plugin ClawHub Release` nur für gezielte Reparaturen oder erneute Veröffentlichungen. `OpenClaw Release Publish` lehnt `plugin_publish_scope=selected` ab, wenn `publish_openclaw_npm=true` gilt, damit das Kernpaket nicht ohne jedes veröffentlichbare offizielle Plugin ausgeliefert werden kann, einschließlich `@openclaw/diffs-language-pack`. Setzen Sie für die Reparatur eines ausgewählten Plugins `publish_openclaw_npm=false` mit `plugin_publish_scope=selected` und `plugins=@openclaw/name`, oder starten Sie den untergeordneten Workflow direkt.

Das erstmalige ClawHub-Bootstrapping für eine Veröffentlichung ist die Ausnahme: Starten Sie `Plugin ClawHub New` vom vertrauenswürdigen `main` und übergeben Sie die vollständige SHA des Ziel-Releases über `ref`. Führen Sie den Bootstrap-Workflow selbst niemals vom Release-Tag oder -Branch aus:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Die Validierung vor dem Tag erfordert `dry_run=true`, lehnt Eingaben für Release-Tags und übergeordnete Ausführungen ab und akzeptiert nur ein exaktes Ziel, das von `main` oder `release/*` aus erreichbar ist. Sie lädt keine ClawHub-Anmeldedaten, veröffentlicht keine Paketbytes und ändert keine Trusted-Publisher-Konfiguration. Der Workflow ermittelt dennoch den aktuellen Registry-Plan, checkt das Ziel ausschließlich in einem Job ohne Secrets aus und packt es dort, materialisiert die gesperrte ClawHub-Toolchain und validiert das unveränderliche Artefakt sowie den Paket-Slug und die Paketidentität, bevor das Release-Tag existiert. Genehmigen Sie die Umgebung `clawhub-plugin-bootstrap` erst, nachdem die Pack-Jobs ohne Secrets abgeschlossen sind; dieser geschützte Validierungsjob besitzt weder Anmeldedaten noch Befehle, die Änderungen vornehmen.

Ein genehmigter Testlauf oder ein echtes Bootstrap nach dem Tagging muss das exakte Release-Tag sowie die Ausführungs-ID, den Versuch und den Branch der übergeordneten Ausführung von `OpenClaw Release Publish` enthalten. Der übergeordnete Workflow bestätigt seine eigene Workflow-SHA und eine separate, exakte, vertrauenswürdige `main`-SHA für `Plugin ClawHub New`; die untergeordnete Ausführung und jede Genehmigung einer geschützten Umgebung müssen mit dieser genehmigten untergeordneten SHA übereinstimmen. Das Release-Tag wird vor jedem Veröffentlichungsversuch und jeder Trusted-Publisher-Änderung erneut geprüft.

Der Pack-Job lädt ein unveränderliches Artefakt hoch, dessen Name, Actions-Artefakt-ID/-Digest, erzeugende Ausführung/erzeugender Versuch, Ziel-SHA sowie SHA-256 und Größe des Tarballs jedes Pakets an die Validierungs- und geschützten Jobs weitergegeben werden. Der geschützte Job checkt ausschließlich vertrauenswürdige `main`-Werkzeuge aus, validiert das Artefakt-Tupel über die GitHub-API, lädt anhand der exakten Artefakt-ID herunter, hasht jeden Tarball erneut und validiert lokale TAR-Pfade sowie die Paketidentität anhand der USTAR-Kanonisierungsregeln der angehefteten CLI. Jeder Kandidat durchläuft anschließend den Testlauf der Veröffentlichung mit der angehefteten CLI, der vor Registry-Abfrage oder Authentifizierung zurückkehrt. Der Vorfilter des Anmeldedaten-Jobs begrenzt komprimierte ClawPacks auf 120 MiB, die gesamte Dateinutzlast auf 50 MiB, expandierte TAR-Daten auf 64 MiB und die Anzahl der TAR-Einträge auf 10.000. Die Reparatur des Trusted Publishers für bestehende Pakete bleibt auf die Konfiguration beschränkt, packt jedoch weiterhin das Ziel und erfordert vor der Änderung der Trusted-Publisher-Konfiguration das angeforderte Tag sowie die exakte Übereinstimmung von Registry-Bytes und -Metadaten. Die Prüfung nach der Veröffentlichung lädt das ClawHub-Artefakt herunter und erfordert dieselbe SHA-256 und Größe. Bei einer Wiederherstellung mit erneutem Ausführen fehlgeschlagener Jobs darf das Paketartefakt eines früheren Versuchs nur wiederverwendet werden, wenn der exakte erzeugende Job erfolgreich abgeschlossen wurde. Der abschließende Nachweis bindet außerdem die gesperrte ClawHub-Version, die Lock-SHA-256 und die npm-Integrität ein. Eine Abweichung erfordert eine neue Paketversion.

## Eingaben des NPM-Workflows

`OpenClaw NPM Release` akzeptiert diese vom Betreiber gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` oder `v2026.4.2-alpha.1`; wenn `preflight_only=true` gilt, darf es für einen ausschließlich validierenden Vorabtest auch die aktuelle vollständige, 40 Zeichen lange Commit-SHA des Workflow-Branches sein
- `preflight_only`: `true` nur für Validierung/Build/Paketierung, `false` für den tatsächlichen Veröffentlichungspfad
- `preflight_run_id`: ID einer vorhandenen erfolgreichen Vorabtest-Ausführung, die für den tatsächlichen Veröffentlichungspfad erforderlich ist, damit der Workflow den vorbereiteten Tarball wiederverwendet, anstatt ihn neu zu erstellen
- `full_release_validation_run_id`: ID einer erfolgreichen Ausführung von `Full Release Validation` für dieses Tag/diese SHA; für eine tatsächliche Veröffentlichung erforderlich. Beta-Veröffentlichungen dürfen mit einer Warnung allein auf Grundlage des Vorabtests fortfahren, für die Heraufstufung einer stabilen Version bzw. auf `latest` ist sie jedoch weiterhin erforderlich.
- `full_release_validation_run_attempt`: exakter positiver Ausführungsversuch, der `full_release_validation_run_id` zugeordnet ist; bei Angabe der Ausführungs-ID immer erforderlich, damit Wiederholungsläufe den Autorisierungsnachweis während der Veröffentlichung nicht ändern können.
- `release_publish_run_id`: ID der genehmigten Ausführung von `OpenClaw Release Publish`; erforderlich, wenn dieser Workflow von diesem übergeordneten Workflow gestartet wird (Aufrufe tatsächlicher Veröffentlichungen durch einen Bot-Akteur)
- `plugin_npm_run_id`: ID einer erfolgreichen Ausführung von `Plugin NPM Release` für den exakten Stand; erforderlich für eine tatsächliche `extended-stable`-Veröffentlichung des Kernpakets
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; akzeptiert `alpha`, `beta`, `latest` oder `extended-stable` und verwendet standardmäßig `beta`. Der finale Patch `33` und spätere müssen `extended-stable` verwenden; standardmäßig lehnt `extended-stable` frühere Patches ab und lehnt nicht finale Tags immer ab.
- `bypass_extended_stable_guard`: ausschließlich für Tests vorgesehener boolescher Wert, standardmäßig `false`; umgeht bei `npm_dist_tag=extended-stable` die monatliche Extended-Stable-Berechtigungsprüfung, während Prüfungen von Release-Identität, Artefakt, Genehmigung und Rücklesen erhalten bleiben.

`Plugin NPM Release` akzeptiert `npm_dist_tag=default` für das bestehende Release-Verhalten oder `npm_dist_tag=extended-stable` für den geschützten monatlichen Pfad. Die Extended-Stable-Option erfordert `publish_scope=all-publishable`, eine leere `plugins`-Eingabe, einen finalen Patch ab `33` und den kanonischen Branch `extended-stable/YYYY.M.33` an dessen exakter Spitze. Sie verschiebt niemals die Plugin-Tags `latest` oder `beta`. Neue Paketversionen erhalten `extended-stable` atomar durch vertrauenswürdige OIDC-Veröffentlichung (`npm publish --tag extended-stable`); dieser Quell-Workflow verwendet kein tokenauthentifiziertes `npm dist-tag add`. Wiederholungsversuche überspringen exakte Versionen, die bereits in npm vorhanden sind, und schlagen anschließend sicher fehl, sofern das vollständige Rücklesen nicht bestätigt, dass jedes exakte Paket und das `extended-stable`-Tag konvergiert sind.

`OpenClaw Release Publish` akzeptiert diese vom Betreiber gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag; muss bereits vorhanden sein
- `preflight_run_id`: ID einer erfolgreichen Vorabtest-Ausführung von `OpenClaw NPM Release`; erforderlich, wenn `publish_openclaw_npm=true` oder `plugin_publish_scope=all-publishable` gilt
- `full_release_validation_run_id`: ID einer erfolgreichen Ausführung von `Full Release Validation`; erforderlich, wenn `publish_openclaw_npm=true` oder `plugin_publish_scope=all-publishable` gilt
- `full_release_validation_run_attempt`: exakter positiver Versuch, der `full_release_validation_run_id` zugeordnet ist; bei Angabe der Ausführungs-ID immer erforderlich
- `windows_node_tag`: exaktes Nicht-Vorabversions-Release-Tag von `openclaw/openclaw-windows-node`; für eine stabile OpenClaw-Veröffentlichung erforderlich
- `windows_node_installer_digests`: vom Kandidatenprozess genehmigte kompakte JSON-Zuordnung der aktuellen Windows-Installer-Namen zu ihren angehefteten `sha256:`-Digests; für eine stabile OpenClaw-Veröffentlichung erforderlich
- `npm_telegram_run_id`: optionale ID einer erfolgreichen Ausführung von `NPM Telegram Beta E2E`, die in den abschließenden Release-Nachweis aufgenommen wird
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket, entweder `alpha`, `beta` oder `latest`
- `plugin_publish_scope`: standardmäßig `all-publishable`; verwenden Sie `selected` nur für gezielte, ausschließlich Plugins betreffende Reparaturen mit `publish_openclaw_npm=false`
- `plugins`: durch Kommas getrennte Paketnamen im Format `@openclaw/*`, wenn `plugin_publish_scope=selected` gilt
- `publish_openclaw_npm`: standardmäßig `true`; setzen Sie dies nur dann auf `false`, wenn Sie den Workflow als Orchestrator für ausschließlich Plugins betreffende Reparaturen verwenden
- `release_profile`: Release-Abdeckungsprofil für Zusammenfassungen des Release-Nachweises; standardmäßig `from-validation`, wodurch es aus dem Validierungsmanifest gelesen wird; alternativ kann es mit `beta`, `stable` oder `full` überschrieben werden
- `wait_for_clawhub`: standardmäßig `false`, damit die npm-Verfügbarkeit nicht durch den ClawHub-Begleitprozess blockiert wird; setzen Sie dies nur dann auf `true`, wenn der Abschluss des Workflows den Abschluss von ClawHub einschließen muss

`OpenClaw Release Checks` akzeptiert diese vom Betreiber gesteuerten Eingaben:

- `ref`: zu validierender Branch, Tag oder vollständige Commit-SHA. Prüfungen, die Secrets verwenden, erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag aus erreichbar ist.
- `run_release_soak`: aktiviert für Beta-Release-Prüfungen den umfassenden Live-/E2E-Dauertest, den Docker-Release-Pfad und den Dauertest aller Upgrade-Überlebensprüfungen seit dem letzten Stand. Bei `release_profile=stable` und `release_profile=full` wird dies erzwungen.

Regeln:

- Reguläre finale Versionen und Korrekturversionen unter Patch `33` können entweder unter `beta` oder `latest` veröffentlicht werden. Finale Versionen ab Patch `33` müssen unter `extended-stable` veröffentlicht werden; Versionen mit Korrektursuffix an dieser Grenze werden abgelehnt.
- Beta-Vorabversionstags dürfen nur unter `beta` veröffentlicht werden; Alpha-Vorabversionstags nur unter `alpha`.
- Bei `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur zulässig, wenn `preflight_only=true` gilt.
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer ausschließlich der Validierung.
- Der tatsächliche Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden wie der Vorabprüfungslauf; der Workflow überprüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird.

## Reguläre stabile Release-Abfolge für beta/latest

Diese bisherige Abfolge gilt für den regulären orchestrierten Release, der auch Plugins, den GitHub-Release, Windows und weitere Plattformarbeiten umfasst. Sie gilt nicht für den oben auf dieser Seite dokumentierten monatlichen npm-exklusiven Extended-Stable-Pfad `.33+`.

So erstellen Sie einen regulären orchestrierten stabilen Release:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus. Solange noch kein Tag vorhanden ist, können Sie den aktuellen vollständigen Commit-SHA des Workflow-Branches für einen ausschließlich der Validierung dienenden Probelauf des Vorabprüfungs-Workflows verwenden.
2. Wählen Sie `npm_dist_tag=beta` für den normalen Ablauf, der zuerst über beta führt, oder `latest` nur dann, wenn Sie bewusst direkt stabil veröffentlichen möchten.
3. Führen Sie `Full Release Validation` auf dem Release-Branch, dem Release-Tag oder dem vollständigen Commit-SHA aus, wenn Sie mit einem manuellen Workflow die normale CI sowie Abdeckung für Live-Prompt-Cache, Docker, QA Lab, Matrix und Telegram wünschen. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den manuellen `CI`-Workflow auf der Release-Referenz aus.
4. Wählen Sie den exakten Tag eines Nicht-Vorabversions-Releases von `openclaw/openclaw-windows-node` aus, dessen signierte Installationsprogramme für x64 und ARM64 ausgeliefert werden sollen. Speichern Sie ihn als `windows_node_tag` und die validierte Digest-Zuordnung der Installationsprogramme als `windows_node_installer_digests`. Das Hilfsprogramm für Release-Kandidaten zeichnet beide Werte auf und nimmt sie in den generierten Veröffentlichungsbefehl auf.
5. Speichern Sie die Werte des erfolgreichen `preflight_run_id`, `full_release_validation_run_id` und des exakten `full_release_validation_run_attempt`.
6. Führen Sie `OpenClaw Release Publish` vom vertrauenswürdigen `main` aus und verwenden Sie dabei denselben `tag`, dasselbe `npm_dist_tag`, den ausgewählten `windows_node_tag`, dessen gespeicherte `windows_node_installer_digests` sowie die gespeicherten Werte für `preflight_run_id`, `full_release_validation_run_id` und `full_release_validation_run_attempt`. Dadurch werden externalisierte Plugins auf npm und ClawHub veröffentlicht, bevor das npm-Paket von OpenClaw hochgestuft wird.
7. Wenn der Release unter `beta` veröffentlicht wurde, verwenden Sie den Workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, um diese stabile Version von `beta` auf `latest` hochzustufen.
8. Wenn der Release bewusst direkt unter `latest` veröffentlicht wurde und `beta` sofort auf denselben stabilen Build verweisen soll, verwenden Sie denselben Release-Workflow, um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie `beta` später durch dessen geplante selbstheilende Synchronisierung verschieben.

Die Änderung der Dist-Tags erfolgt im Release-Ledger-Repository, da sie weiterhin `NPM_TOKEN` benötigt, während das Quell-Repository ausschließlich per OIDC veröffentlicht. Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der zuerst über beta führende Hochstufungspfad dokumentiert und für die zuständigen Personen sichtbar.

Falls eine für die Wartung zuständige Person ersatzweise auf lokale npm-Authentifizierung zurückgreifen muss, dürfen Befehle der 1Password-CLI (`op`) nur innerhalb einer dedizierten tmux-Sitzung ausgeführt werden. Rufen Sie `op` nicht direkt aus der Shell des Haupt-Agenten auf. Die Ausführung innerhalb von tmux macht Eingabeaufforderungen, Warnmeldungen und die OTP-Verarbeitung beobachtbar und verhindert wiederholte Warnmeldungen des Hosts.

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

Für den tatsächlichen Ablauf verwenden die für die Wartung zuständigen Personen die privaten Release-Dokumente unter [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md).

## Verwandte Themen

- [Release-Kanäle](/de/install/development-channels)
