---
read_when:
    - Suche nach Definitionen öffentlicher Veröffentlichungskanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Auf der Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Kanäle, Checkliste für Betreiber, Validierungsboxen, Versionsbenennung und Veröffentlichungsrhythmus
title: Veröffentlichungsrichtlinie
x-i18n:
    generated_at: "2026-07-16T13:32:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw bietet derzeit drei benutzerseitige Update-Kanäle:

- stable: der bestehende freigegebene Release-Kanal, der weiterhin über npm `latest` aufgelöst wird, bis der separate CLI-/Kanal-Meilenstein erreicht ist
- beta: Vorabversion-Tags, die unter npm `beta` veröffentlicht werden
- dev: der sich fortlaufend ändernde Head von `main`

Unabhängig davon können Release-Verantwortliche das Core-Paket des zuletzt abgeschlossenen Monats unter npm `extended-stable` veröffentlichen, beginnend mit Patch `33`. Die reguläre finale Linie des aktuellen Monats wird weiterhin unter npm `latest` geführt; diese betreiberseitige Aufteilung der Veröffentlichung ändert für sich genommen nicht die Auflösung der CLI-Update-Kanäle.

Tideclaw-Alpha-Builds bilden eine separate interne Vorabversionslinie (npm-Dist-Tag `alpha`), die unter [NPM-Workflow-Eingaben](#npm-workflow-inputs) und [Release-Testboxen](#release-test-boxes) behandelt wird.

## Versionsbenennung

- Monatliche npm-Version des Extended-Stable-Releases: `YYYY.M.PATCH`, mit `PATCH >= 33`, Git-Tag `vYYYY.M.PATCH`
- Tägliche/reguläre finale Release-Version: `YYYY.M.PATCH`, mit `PATCH < 33`, Git-Tag `vYYYY.M.PATCH`
- Reguläre Release-Version für Fallback-Korrekturen: `YYYY.M.PATCH-N`, Git-Tag `vYYYY.M.PATCH-N`
- Beta-Vorabversionsnummer: `YYYY.M.PATCH-beta.N`, Git-Tag `vYYYY.M.PATCH-beta.N`
- Alpha-Vorabversionsnummer: `YYYY.M.PATCH-alpha.N`, Git-Tag `vYYYY.M.PATCH-alpha.N`
- Monat oder Patch niemals mit führenden Nullen auffüllen
- `PATCH` ist eine fortlaufende monatliche Release-Train-Nummer, kein Kalendertag. Reguläre finale und Beta-Releases setzen den aktuellen Train fort; reine Alpha-Tags belegen oder erhöhen niemals die Beta-/reguläre Patchnummer. Ignorieren Sie daher bei der Auswahl eines Beta- oder regulären Trains ältere reine Alpha-Tags mit höheren Patchnummern.
- Alpha-/Nightly-Builds verwenden den nächsten noch nicht veröffentlichten Patch-Train und erhöhen bei wiederholten Builds nur `alpha.N`. Sobald für diesen Patch eine Beta vorliegt, wechseln neue Alpha-Builds zum darauffolgenden Patch.
- npm-Versionen sind unveränderlich: Löschen, veröffentlichen oder verwenden Sie ein veröffentlichtes Tag niemals erneut. Erstellen Sie stattdessen die nächste Vorabversionsnummer oder den nächsten monatlichen Patch.
- `latest` folgt weiterhin der aktuellen regulären/täglichen npm-Linie; `beta` ist das aktuelle Beta-Installationsziel
- `extended-stable` bezeichnet das unterstützte npm-Paket des zurückliegenden Monats, beginnend mit Patch `33`; Patch `34` und höher sind Wartungs-Releases dieser monatlichen Linie
- Reguläre finale Releases und reguläre Korrektur-Releases werden standardmäßig unter npm `beta` veröffentlicht; Release-Verantwortliche können explizit `latest` wählen oder einen geprüften Beta-Build später hochstufen
- Der dedizierte monatliche Extended-Stable-Pfad veröffentlicht das Core-npm-Paket und jedes über npm veröffentlichbare offizielle Plugin exakt in derselben Version. Er veröffentlicht weder Plugins auf ClawHub noch macOS- oder Windows-Artefakte, ein GitHub-Release, Dist-Tags privater Repositorys, Docker-Images, mobile Artefakte oder Website-Downloads.
- Jedes reguläre finale Release liefert das npm-Paket, die macOS-App, die signierte eigenständige Android-APK und die signierten Windows-Hub-Installationsprogramme gemeinsam aus. Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad; Build, Signierung, Notarisierung und Hochstufung nativer Apps bleiben regulären finalen Releases vorbehalten, sofern sie nicht ausdrücklich angefordert werden.

## Release-Zyklus

- Releases durchlaufen zuerst die Beta; Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise aus einem von der aktuellen `main` erstellten `release/YYYY.M.PATCH`-Branch, damit Release-Validierung und Fehlerbehebungen die neue Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und korrigiert werden muss, erstellen Maintainer das nächste `-beta.N`-Tag, statt das alte zu löschen oder neu zu erstellen
- Detaillierte Release-Verfahren, Genehmigungen, Anmeldedaten und Wiederherstellungshinweise sind ausschließlich für Maintainer bestimmt

## Monatliche reine npm-Veröffentlichung von Extended Stable

Dies ist eine dedizierte Ausnahme vom nachstehenden regulären Release-Verfahren. Erstellen Sie für einen abgeschlossenen Monat `YYYY.M` den Branch `extended-stable/YYYY.M.33`; veröffentlichen Sie `vYYYY.M.33` und spätere Wartungs-Patches aus demselben Branch. Release-Tag, Branch-Spitze, Checkout, Paketversion, npm-Preflight und der Lauf der vollständigen Release-Validierung müssen alle denselben Commit bezeichnen. Der geschützte Branch `main` muss bereits die finale Version eines strikt späteren Kalendermonats mit einer Patchnummer unter `33` enthalten; Wartungs-Patches bleiben zulässig, nachdem `main` um mehr als einen Monat fortgeschritten ist.

Erhöhen Sie im betreffenden Extended-Stable-Branch die Version des Root-Pakets auf `YYYY.M.P`, führen Sie `pnpm release:prep` aus und prüfen Sie, dass jedes veröffentlichbare Erweiterungspaket dieselbe Version aufweist. Committen und pushen Sie alle generierten Änderungen, erstellen und pushen Sie das unveränderliche Tag `vYYYY.M.P` für diesen Commit und notieren Sie den resultierenden vollständigen SHA. Die Workflows verwenden diesen vorbereiteten Stand; sie erhöhen oder synchronisieren die Versionen nicht für Sie.

Führen Sie den npm-Preflight und die vollständige Release-Validierung von exakt dieser vorbereiteten Branch-Spitze aus und speichern Sie anschließend beide Lauf-IDs sowie den erfolgreichen Laufversuch der vollständigen Release-Validierung:

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

`release_profile=stable` ist das bestehende Profil für die Validierungstiefe; es ist vom npm-Dist-Tag `extended-stable` getrennt und bleibt absichtlich unverändert.

Nachdem beide Läufe erfolgreich waren, veröffentlichen Sie jedes über npm veröffentlichbare offizielle Plugin von exakt derselben Branch-Spitze. Patch `P` muss mindestens `33` sein. Übergeben Sie den vollständigen Release-SHA als `ref`, warten Sie auf die vollständige Matrix und das Zurücklesen aus der Registry und speichern Sie anschließend die ID des erfolgreichen Plugin-NPM-Release-Laufs:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Der Workflow verwendet das regulär vorbereitete Paketinventar `all-publishable`, einschließlich Paketen, deren Quellcode nicht geändert wurde. Vor dem erfolgreichen Abschluss prüft er jedes exakte Paket und jedes Plugin-Tag `extended-stable`. Wenn ein Teillauf fehlschlägt, führen Sie denselben Befehl erneut aus: Bereits veröffentlichte Pakete werden wiederverwendet, fehlende oder veraltete Plugin-Tags werden in der npm-Release-Umgebung abgeglichen, und das abschließende Zurücklesen deckt weiterhin den vollständigen Paketsatz ab.

Nachdem der Plugin-Workflow erfolgreich abgeschlossen wurde und die npm-Release-Umgebung bereit ist, veröffentlichen Sie das exakte Core-Preflight-Tarball. Die Core-Veröffentlichung prüft, dass der referenzierte Plugin-Lauf auf demselben kanonischen Branch und mit exakt demselben Quell-SHA `completed/success` ist:

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

Fügen Sie bei einer Fork- oder Nicht-Produktionsprobe, die absichtlich die monatliche `.33`- oder die Monatsrichtlinie des geschützten Branches `main` nicht erfüllen kann, sowohl dem npm-Preflight- als auch dem Veröffentlichungs-Dispatch `-f bypass_extended_stable_guard=true` hinzu. Der Standardwert ist `false`. Die Umgehung wird nur zusammen mit `npm_dist_tag=extended-stable` akzeptiert und in der Workflow-Zusammenfassung festgehalten. Sie umgeht weder die kanonische Workflow-Referenz `extended-stable/YYYY.M.33` noch die Übereinstimmung von Branch-Spitze, Tag und Checkout, die Syntax finaler Tags, die Gleichheit der Paket- und Tag-Versionen, die Identität referenzierter Läufe und Manifeste, die Tarball-Herkunft, die Umgebungsgenehmigung, das Zurücklesen aus der Registry oder den Nachweis der Selektorreparatur.

Der Veröffentlichungs-Workflow prüft die Identitäten der referenzierten Preflight-, Validierungs- und Plugin-Läufe, den Digest des vorbereiteten Tarballs sowie die Core-Registry-Selektoren. Bestätigen Sie das Ergebnis nach erfolgreichem Workflow unabhängig:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Beide Befehle müssen `YYYY.M.P` zurückgeben. Wenn die Veröffentlichung erfolgreich ist, das Zurücklesen des Selektors jedoch fehlschlägt, veröffentlichen Sie die unveränderliche Paketversion nicht erneut. Verwenden Sie den einzelnen in der bei jedem Lauf erzeugten Zusammenfassung des fehlgeschlagenen Workflows ausgegebenen Reparaturbefehl `npm dist-tag add openclaw@YYYY.M.P extended-stable` und wiederholen Sie anschließend beide unabhängigen Prüfungen. Ein Rollback auf den vorherigen Selektor ist eine separate Entscheidung der Release-Verantwortlichen und nicht der Reparaturpfad für das Zurücklesen.

Die öffentliche Support-Dokumentation weist zunächst Slack, Discord und Codex als abgedeckte Extended-Stable-Plugin-Oberflächen aus. Diese Liste ist eine Support-Aussage und keine Allowlist im Release-Code: Jedes über npm veröffentlichbare offizielle Plugin folgt demselben Veröffentlichungspfad mit exakt gleicher Version.

Die nachstehende reguläre Checkliste bleibt für Beta, `latest`, GitHub-Releases, Plugins, macOS, Windows und Veröffentlichungen auf anderen Plattformen maßgeblich. Führen Sie diese Schritte nicht für diesen reinen npm-Extended-Stable-Pfad aus.

## Reguläre Checkliste für Release-Verantwortliche

Diese Checkliste beschreibt die öffentliche Form des Release-Ablaufs. Private Anmeldedaten sowie Details zu Signierung, Notarisierung, Wiederherstellung von Dist-Tags und Notfall-Rollbacks verbleiben im ausschließlich für Maintainer bestimmten Release-Runbook.

1. Beginnen Sie mit der aktuellen `main`: Rufen Sie den neuesten Stand ab, bestätigen Sie, dass der Ziel-Commit gepusht wurde, und prüfen Sie, dass die CI für `main` ausreichend grün ist, um davon einen Branch zu erstellen.
2. Erstellen Sie `release/YYYY.M.PATCH` aus diesem Commit. Backports sind optional; wenden Sie nur die von den Release-Verantwortlichen ausgewählte Menge an. Erhöhen Sie die Version an allen erforderlichen Stellen, führen Sie `pnpm release:prep` aus, schließen Sie Release-Korrekturen und erforderliche Forward-Ports ab und prüfen Sie `src/plugins/compat/registry.ts` sowie `src/commands/doctor/shared/deprecation-compat.ts`.
3. Fixieren Sie den produktseitig vollständigen Commit vor dem Changelog als **Code-SHA**. Führen Sie den deterministischen Quellcode-Preflight aus und verwenden Sie anschließend `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Dadurch wird vertrauenswürdiges Workflow-Tooling fixiert, während die vollständige Vitest-, Docker-, QA-, Paket- und Performance-Matrix exakt den Code-SHA prüft.
4. Klassifizieren Sie Fehler, bevor Sie Änderungen vornehmen. Ein Produkt-/Codefehler erzeugt einen neuen Code-SHA und erfordert eine erfolgreiche vollständige Validierung für diesen SHA. Ein Workflow-, Harness-, Anmeldedaten-, Genehmigungs- oder Infrastrukturfehler wird in der jeweils verantwortlichen Oberfläche behoben und erneut gegen denselben Code-SHA ausgeführt.
5. Erstellen Sie erst dann den obersten Abschnitt `CHANGELOG.md` aus zusammengeführten PRs und direkten Commits seit dem letzten erreichbaren ausgelieferten Tag, wenn der Code-SHA erfolgreich validiert wurde. Formulieren Sie die Einträge benutzerorientiert und ohne Duplikate. Wenn ein abweichendes ausgeliefertes Tag oder ein späterer Forward-Port bereits veröffentlichte PRs erneut zuordnet, übergeben Sie es explizit als `--shipped-ref`.
6. Committen Sie ausschließlich `CHANGELOG.md`. Dieser Commit ist der **Release-SHA**. Der vollständige Diff vom Code-SHA zum Release-SHA darf ausschließlich `CHANGELOG.md` enthalten; jeder andere geänderte Pfad setzt den Release-Prozess auf Schritt 2 zurück.
7. Führen Sie die SHA-fixierte vollständige Release-Validierung für den Release-SHA mit aktivierter Wiederverwendung von Nachweisen aus. Der schlanke übergeordnete Lauf muss `changelog-only-release-v1` aufzeichnen, auf den erfolgreich validierten Code-SHA verweisen und darf keine untergeordneten Produkt-Lanes auslösen. Dadurch werden Produktnachweise wiederverwendet, nicht jedoch Paketbytes.
8. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` gegen den Release-SHA beziehungsweise das Tag aus. Speichern Sie den erfolgreichen `preflight_run_id`. Dadurch werden exakt die Paketbytes erstellt und geprüft, die den finalen Changelog enthalten.
9. Taggen Sie den Release-SHA und führen Sie anschließend den Candidate-Helper mit dem erfolgreichen übergeordneten Release-SHA-Validierungslauf und dem npm-Preflight aus, statt einen der beiden erneut auszulösen:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Für Stable übergeben Sie außerdem `--windows-node-tag vX.Y.Z`. Das Hilfsprogramm überprüft die Herkunft der Versionshinweise, die npm-Preflight-Bytes, den Parallels-Installations-/Aktualisierungsnachweis, den Telegram-Paketnachweis und die Plugin-Veröffentlichungspläne und gibt anschließend den Veröffentlichungsbefehl aus.

   `OpenClaw Release Publish` übermittelt die ausgewählten oder alle veröffentlichungsfähigen Plugin-Pakete parallel an npm und dieselbe Menge an ClawHub und stuft anschließend das vorbereitete OpenClaw-npm-Preflight-Artefakt mit dem passenden dist-tag hoch, sobald die npm-Veröffentlichung der Plugins erfolgreich ist. Der Release-Checkout bleibt der Produkt-/Datenstamm, während Planung und abschließende Verifizierung aus dem exakten vertrauenswürdigen Workflow-Quell-Checkout ausgeführt werden, sodass ein älterer Release-Commit nicht unbemerkt veraltete Release-Werkzeuge verwenden kann. Bevor ein untergeordneter Veröffentlichungslauf startet, rendert und speichert der Workflow den exakten GitHub-Release-Text zwischen. Wenn der vollständige passende Abschnitt `CHANGELOG.md` innerhalb des GitHub-Limits von 125,000 Zeichen und der entsprechenden Sicherheitsobergrenze des Renderers von 125,000 Byte liegt, enthält die Seite exakt diesen Abschnitt `## YYYY.M.PATCH` einschließlich seiner Überschrift. Wenn der Quellabschnitt nicht hineinpasst, behält die Seite die exakten gruppierten redaktionellen Hinweise bei und ersetzt den übergroßen Beitragsdatensatz durch einen stabilen Link zum vollständigen Datensatz in der an das Tag gebundenen Datei `CHANGELOG.md`; unvollständige Datensätze und abgeschnittene Aufzählungspunkte werden niemals veröffentlicht. Der Workflow wählt diesen vollständigen oder kompakten Text aus, bevor er `### Release verification` hinzufügt; würde der Nachweisanhang das Limit überschreiten, behält er den kanonischen Text bei und stützt sich stattdessen auf die unveränderlichen angehängten Nachweise. Stabile Releases, die unter npm `latest` veröffentlicht werden, werden zum neuesten GitHub-Release, während stabile Wartungs-Releases, die unter npm `beta` verbleiben, mit GitHub `latest=false` erstellt werden. Der Workflow lädt außerdem den Preflight-Abhängigkeitsnachweis, das vollständige Validierungsmanifest und den Nachweis der Registry-Verifizierung nach der Veröffentlichung in das GitHub-Release hoch, damit sie für die Reaktion auf Vorfälle nach dem Release verfügbar sind. Er gibt die IDs der untergeordneten Läufe sofort aus, genehmigt automatisch Release-Umgebungsfreigaben, die das Workflow-Token genehmigen darf, fasst fehlgeschlagene untergeordnete Jobs mit den letzten Protokollzeilen zusammen, erstellt die GitHub-Release-Seite vorab als Entwurf und stuft Windows- und Android-Artefakte parallel zur npm-Veröffentlichung von OpenClaw hoch, schließt die Release-Seite und den Abhängigkeitsnachweis ab, sobald diese Phasen erfolgreich waren, wartet bei jeder Veröffentlichung von OpenClaw auf npm auf ClawHub, führt anschließend den Beta-Verifizierer vom vertrauenswürdigen main-Stand aus und lädt Nachweise nach der Veröffentlichung für das GitHub-Release, das npm-Paket, die ausgewählten Plugin-npm-Pakete, die ausgewählten ClawHub-Pakete, die IDs der untergeordneten Workflow-Läufe und die optionale ID des NPM-Telegram-Laufs hoch. Der ClawHub-Bootstrap-Verifizierer erfordert den exakten vertrauenswürdigen main-Workflow-Pfad und -SHA, die Laufversuche des Erzeugers und des abschließenden Laufs, den Release-SHA, die angeforderte Paketmenge, das unveränderliche Tupel des Paketartefakts und das abschließende Registry-Ausleseartefakt; ein erfolgreicher Legacy-Lauf über eine Release-Referenz wird nicht akzeptiert.

   Führen Sie anschließend die Paketabnahme nach der Veröffentlichung für das veröffentlichte Paket `openclaw@YYYY.M.PATCH-beta.N` oder `openclaw@beta` aus. Wenn ein gepushtes oder veröffentlichtes Vorab-Release eine Korrektur benötigt, erstellen Sie die nächste passende Vorab-Release-Nummer; löschen oder überschreiben Sie niemals die alte.

10. Behalten Sie nach einem fehlgeschlagenen Veröffentlichungsversuch den Release-SHA unverändert bei, sofern der Fehler nicht einen Produkt- oder Changelog-Defekt nachweist. Setzen Sie erfolgreiche unveränderliche untergeordnete Läufe und Artefakte fort; erstellen oder veröffentlichen Sie niemals eine Paketversion erneut, die bereits erfolgreich war.
11. Fahren Sie für Stable erst fort, nachdem die geprüfte Beta oder der Release Candidate über die erforderlichen Validierungsnachweise verfügt. Die stabile npm-Veröffentlichung erfolgt ebenfalls über `OpenClaw Release Publish`, wobei das erfolgreiche Preflight-Artefakt über `preflight_run_id` wiederverwendet wird. Die Bereitschaft für ein stabiles macOS-Release erfordert außerdem die paketierten Dateien `.zip`, `.dmg`, `.dSYM.zip` und die aktualisierte Datei `appcast.xml` auf `main`; der macOS-Veröffentlichungsworkflow veröffentlicht den signierten Appcast automatisch im öffentlichen `main`, nachdem die Release-Artefakte verifiziert wurden, oder öffnet/aktualisiert einen Appcast-PR, wenn der Branch-Schutz den direkten Push blockiert. Die Bereitschaft für den stabilen Windows Hub erfordert die signierten Artefakte `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` und `OpenClawCompanion-SHA256SUMS.txt` im OpenClaw-GitHub-Release. Übergeben Sie das exakte signierte Release-Tag `openclaw/openclaw-windows-node` als `windows_node_tag` und dessen für den Kandidaten genehmigte Installationsprogramm-Digest-Zuordnung als `windows_node_installer_digests`; `OpenClaw Release Publish` behält den Release-Entwurf bei, startet `Windows Node Release` und verifiziert alle drei Artefakte vor der Veröffentlichung.
12. Führen Sie nach der Veröffentlichung den npm-Verifizierer für die Zeit nach der Veröffentlichung, optional den eigenständigen Telegram-E2E-Test für das veröffentlichte npm-Paket, wenn Sie einen Kanalnachweis nach der Veröffentlichung benötigen, sowie bei Bedarf die dist-tag-Hochstufung aus, verifizieren Sie die generierte GitHub-Release-Seite, führen Sie die Schritte für die Release-Ankündigung aus und schließen Sie anschließend [Abschluss des stabilen main-Stands](#stable-main-closeout) ab, bevor Sie ein stabiles Release als abgeschlossen bezeichnen.

## Abschluss des stabilen main-Stands

Die stabile Veröffentlichung ist erst abgeschlossen, wenn `main` den tatsächlich ausgelieferten Release-Stand enthält.

1. Beginnen Sie mit dem aktuellen neuesten Stand von `main`. Prüfen Sie `release/YYYY.M.PATCH` dagegen und übertragen Sie echte Korrekturen nach vorn, die in `main` fehlen. Führen Sie nicht blind ausschließlich für das Release bestimmte Kompatibilitäts-, Test- oder Validierungsadapter mit dem neueren `main` zusammen.
2. Setzen Sie für den normalen Pfad `main` auf die ausgelieferte stabile Version. Bei einem verspäteten Abschluss kann `main` verwendet werden, nachdem es auf eine spätere stabile OpenClaw-CalVer-Version fortgeschritten ist; stufen Sie einen bereits begonnenen Release-Zyklus nicht allein zum Abschluss des vorherigen Releases zurück. Der Validator erfordert weiterhin den exakten ausgelieferten Changelog-Abschnitt und Appcast-Eintrag und zeichnet die tatsächliche Version und den SHA von `main` auf. Führen Sie nach jeder Änderung der Stammversion `pnpm release:prep` und anschließend `pnpm deps:shrinkwrap:generate` aus.
3. Sorgen Sie dafür, dass der Abschnitt `## YYYY.M.PATCH` von `CHANGELOG.md` auf `main` exakt dem getaggten Release-Branch entspricht. Schließen Sie die stabile Aktualisierung von `appcast.xml` ein, wenn das Mac-Release eine veröffentlicht hat.
4. Fügen Sie `YYYY.M.PATCH+1`, eine Beta-Version oder einen leeren zukünftigen Changelog-Abschnitt erst dann zu `main` hinzu, wenn der Operator diesen Release-Zyklus ausdrücklich startet.
5. Führen Sie `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` und `OPENCLAW_TESTBOX=1 pnpm check:changed` aus. Pushen Sie und verifizieren Sie anschließend, dass `origin/main` die ausgelieferte Version und den Changelog enthält, bevor Sie das stabile Release als abgeschlossen bezeichnen.
6. Halten Sie die Repository-Variablen `RELEASE_ROLLBACK_DRILL_ID` und `RELEASE_ROLLBACK_DRILL_DATE` nach jeder privaten Rollback-Übung aktuell.

`OpenClaw Stable Main Closeout` beginnt mit dem Push von `main`, der nach der stabilen Veröffentlichung die ausgelieferte Version, den Changelog und den Appcast enthält. Der Workflow liest unveränderliche Nachweise nach der Veröffentlichung, um das ausgelieferte Tag an seine Läufe für die vollständige Release-Validierung und Veröffentlichung zu binden, und verifiziert anschließend den stabilen main-Stand, das Release, die obligatorische stabile Reifephase und die blockierenden Leistungsnachweise. Er hängt ein unveränderliches Abschlussmanifest und eine Prüfsumme an das GitHub-Release an. Der automatische Push-Auslöser überspringt Legacy-Releases, die älter als unveränderliche Nachweise nach der Veröffentlichung sind, und behandelt dieses Überspringen niemals als abgeschlossenen Abschluss.

Ein vollständiger Abschluss erfordert beide Artefakte und eine passende Prüfsumme. Ein unvollständiges Manifest spielt seinen aufgezeichneten SHA `main` und die Rollback-Übung erneut ab, um identische Bytes zu erzeugen, und hängt anschließend die fehlende Prüfsumme an; ein ungültiges Paar oder eine Prüfsumme ohne Manifest bleibt blockierend. Ein durch einen Push ausgelöster Lauf ohne Repository-Variablen für die Rollback-Übung wird übersprungen, ohne den Abschluss zu vollenden; ein fehlender oder mehr als 90 Tage alter Übungsdatensatz blockiert weiterhin den manuellen nachweisgestützten Abschluss. Private Wiederherstellungsbefehle verbleiben im ausschließlich für Maintainer bestimmten Runbook. Verwenden Sie die manuelle Auslösung nur, um einen nachweisgestützten stabilen Abschluss zu reparieren oder erneut abzuspielen.

Wenn der übergeordnete Release-Veröffentlichungslauf erst fehlschlug, nachdem unveränderliche npm-/Plugin-Nachweise angehängt wurden, reparieren und veröffentlichen Sie zunächst alle stabilen Plattformartefakte. Anschließend kann ein Maintainer den Abschluss manuell mit `allow_failed_publish_recovery=true` auslösen; dieser Modus akzeptiert nur einen abgeschlossenen fehlgeschlagenen übergeordneten Lauf und erfordert zusätzlich die exakten Android- und Windows-Artefaktverträge, GitHub-SHA-256-Digests, Prüfsummenverifizierung, Android-Herkunftsnachweise und eine erfolgreiche, vom übergeordneten Lauf ausgelöste Windows-Hochstufung, deren Authenticode-Prüfungen und für den Kandidaten genehmigte Digests mit den veröffentlichten Installationsprogrammen übereinstimmen, zusammen mit den normalen macOS-/Appcast-Prüfungen. Der automatische Push-Abschluss aktiviert diesen Wiederherstellungsmodus niemals.

Ein Legacy-Korrektur-Tag als Ausweichlösung darf Nachweise des Basispakets nur dann wiederverwenden, wenn das Korrektur-Tag auf denselben Quell-Commit wie das stabile Basis-Tag verweist. Sein Android-Release verwendet die verifizierte APK des Basis-Tags wieder und fügt Herkunftsnachweise für das Korrektur-Tag hinzu. Eine Korrektur mit abweichender Quelle muss eigene Paketnachweise veröffentlichen und verifizieren und einen höheren Android-Wert `versionCode` verwenden.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript außerhalb der schnelleren lokalen Prüfung `pnpm check` weiterhin abgedeckt bleibt.
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Prüfungen auf Importzyklen und Architekturgrenzen außerhalb der schnelleren lokalen Prüfung erfolgreich sind.
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten Release-Artefakte `dist/*` und das Control-UI-Bundle für den Paketvalidierungsschritt vorhanden sind.
- Führen Sie `pnpm release:prep` nach der Erhöhung der Stammversion und vor dem Tagging aus. Der Befehl führt jeden deterministischen Release-Generator aus, bei dem nach einer Versions-, Konfigurations- oder API-Änderung häufig Abweichungen entstehen: Plugin-Versionen, npm-Shrinkwraps, Plugin-Inventar, Basiskonfigurationsschema, Konfigurationsmetadaten gebündelter Kanäle, Baseline der Konfigurationsdokumentation, Plugin-SDK-Exporte und Plugin-SDK-API-Baseline. `pnpm release:check` führt diese Prüfmechanismen erneut im Prüfmodus aus, ergänzt um eine Prüfung des Budgets für die Plugin-SDK-Oberfläche, und meldet alle Abweichungsfehler generierter Dateien in einem Durchlauf, bevor die Paket-Release-Prüfungen ausgeführt werden.
- Die Synchronisierung der Plugin-Versionen aktualisiert standardmäßig das veröffentlichungsfähige Laufzeitpaket `@openclaw/ai`, die Paketversionen offizieller Plugins und vorhandene Mindestversionen `openclaw.compat.pluginApi` auf die OpenClaw-Release-Version. Behandeln Sie dieses Feld als Mindestversion der Plugin-SDK-/Laufzeit-API und nicht nur als Kopie der Paketversion: Behalten Sie bei ausschließlich Plugins betreffenden Releases, die absichtlich mit älteren OpenClaw-Hosts kompatibel bleiben, die Mindestversion bei der ältesten unterstützten Host-API und dokumentieren Sie diese Entscheidung im Plugin-Release-Nachweis.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Genehmigung aus, um alle Pre-Release-Testboxen über einen einzigen Einstiegspunkt zu starten. Er akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, startet manuell `CI` und startet `OpenClaw Release Checks` für Installations-Smoke-Tests, Paketabnahme, betriebssystemübergreifende Paketprüfungen, QA-Lab-Parität sowie Matrix- und Telegram-Testläufe. Stabile und vollständige Läufe umfassen immer umfassende Live-/E2E-Tests und eine Reifephase für den Docker-Release-Pfad; `run_release_soak=true` bleibt für eine ausdrücklich angeforderte Beta-Reifephase erhalten. Die Paketabnahme stellt während der Kandidatenvalidierung den kanonischen Paket-Telegram-E2E-Test bereit und vermeidet dadurch einen zweiten parallel laufenden Live-Poller.

  Geben Sie `release_package_spec` nach der Veröffentlichung einer Beta an, um das ausgelieferte npm-Paket in den Release-Prüfungen, der Paketabnahme und dem Paket-Telegram-E2E-Test wiederzuverwenden, ohne den Release-Tarball erneut zu erstellen. Geben Sie `npm_telegram_package_spec` nur an, wenn Telegram ein anderes veröffentlichtes Paket als die übrige Release-Validierung verwenden soll. Geben Sie `package_acceptance_package_spec` an, wenn die Paketabnahme ein anderes veröffentlichtes Paket als die Release-Paketspezifikation verwenden soll. Geben Sie `evidence_package_spec` an, wenn der Release-Nachweisbericht belegen soll, dass die Validierung mit einem veröffentlichten npm-Paket übereinstimmt, ohne Telegram-E2E zu erzwingen.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Führen Sie den manuellen `Package Acceptance`-Workflow aus, wenn Sie während der laufenden Release-Arbeiten einen unabhängigen Nachweis für einen Paketkandidaten benötigen. Verwenden Sie `source=npm` für `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`, um einen vertrauenswürdigen `package_ref`-Branch/-Tag/-SHA mit dem aktuellen `workflow_ref`-Testsystem zu packen; `source=url` für einen öffentlichen HTTPS-Tarball mit erforderlichem SHA-256 und strikter Richtlinie für öffentliche URLs; `source=trusted-url` für eine benannte Richtlinie für vertrauenswürdige Quellen mit erforderlichem `trusted_source_id` und SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde.

  Der Workflow löst den Kandidaten in `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler erneut für diesen Tarball und kann Telegram-QA mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` für denselben Tarball ausführen. Wenn die ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket sowohl als installierte CLI als auch als zu testendes Paket, sodass der Pfad für den verwalteten Neustart des Update-Befehls des Kandidaten geprüft wird.

  Beispiel:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Gängige Profile:
  - `smoke`: Installations-/Kanal-/Agent-, Gateway-Netzwerk- und Konfigurations-Neulade-Lanes
  - `package`: artefaktnative Paket-/Update-/Neustart-/Plugin-Lanes ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfadabschnitte mit OpenWebUI
  - `custom`: exakte Auswahl von `docker_lanes` für eine gezielte Wiederholung

- Führen Sie den manuellen `CI`-Workflow direkt aus, wenn Sie nur eine deterministische normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuell ausgelöste CI-Läufe umgehen die Eingrenzung auf Änderungen und erzwingen die Linux-Node-Shards, Shards für gebündelte Plugins, Plugin- und Kanalvertrag-Shards, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Checks für erstellte Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS und die i18n-Lanes der Control UI. Eigenständige manuelle CI-Läufe führen Android nur aus, wenn sie mit `include_android=true` ausgelöst werden; `Full Release Validation` übergibt diese Eingabe an seinen untergeordneten CI-Lauf.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie die Release-Telemetrie validieren. Dies führt QA-Lab über einen lokalen OTLP/HTTP-Empfänger aus und überprüft den Export von Traces, Metriken und Logs sowie begrenzte Trace-Attribute und die Schwärzung von Inhalten und Kennungen, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm qa:otel:collector-smoke` aus, wenn Sie die Collector-Kompatibilität validieren. Dies leitet denselben OTLP-Export von QA-Lab durch einen echten OpenTelemetry-Collector-Docker-Container, bevor die Prüfungen des lokalen Empfängers erfolgen.
- Führen Sie `pnpm qa:prometheus:smoke` aus, wenn Sie geschütztes Prometheus-Scraping validieren. Dies führt QA-Lab aus, weist nicht authentifizierte Scrapes zurück und überprüft, dass releasekritische Metrikfamilien frei von Prompt-Inhalten, unbereinigten Kennungen, Authentifizierungstokens und lokalen Pfaden bleiben.
- Führen Sie `pnpm qa:observability:smoke` aus, um die OpenTelemetry- und Prometheus-Smoke-Lanes für den Quellcode-Checkout direkt nacheinander auszuführen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus.
- Der `OpenClaw NPM Release`-Preflight erzeugt Release-Nachweise zu Abhängigkeiten, bevor er den npm-Tarball packt. Das Schwachstellen-Gate für npm-Advisories blockiert das Release. Die Berichte zu Risiken im transitiven Manifest, zur Abhängigkeitseigentümerschaft und Installationsoberfläche sowie zu Abhängigkeitsänderungen dienen nur als Release-Nachweise. Der Bericht zu Abhängigkeitsänderungen vergleicht den Release-Kandidaten mit dem vorherigen erreichbaren Release-Tag. Der Preflight lädt die Abhängigkeitsnachweise als `openclaw-release-dependency-evidence-<tag>` hoch und bettet sie außerdem unter `dependency-evidence/` in das vorbereitete npm-Preflight-Artefakt ein. Der tatsächliche Veröffentlichungspfad verwendet dieses Preflight-Artefakt erneut und hängt anschließend dieselben Nachweise als `openclaw-<version>-dependency-evidence.zip` an das GitHub-Release an.
- Führen Sie `OpenClaw Release Publish` für die verändernde Veröffentlichungssequenz aus, nachdem der Tag vorhanden ist. Lösen Sie reguläre Beta- und stabile Veröffentlichungen vom vertrauenswürdigen `main` aus; der Release-Tag wählt weiterhin den exakten Ziel-Commit aus und kann auf `release/YYYY.M.PATCH` verweisen. Tideclaw-Alpha-Veröffentlichungen verbleiben auf ihrem jeweiligen Alpha-Branch. Übergeben Sie den erfolgreichen OpenClaw-npm-`preflight_run_id`, den erfolgreichen `full_release_validation_run_id` und den exakten `full_release_validation_run_attempt`, und behalten Sie den standardmäßigen Plugin-Veröffentlichungsumfang `all-publishable` bei, sofern Sie nicht absichtlich eine gezielte Reparatur durchführen. Der Workflow serialisiert die npm-Veröffentlichung der Plugins, die ClawHub-Veröffentlichung der Plugins und die npm-Veröffentlichung von OpenClaw, damit das Kernpaket nicht vor seinen externalisierten Plugins veröffentlicht wird; die Windows- und Android-Promotion wird parallel zur npm-Veröffentlichung des Kerns für die Release-Entwurfsseite ausgeführt. Wiederholungen der Veröffentlichung können fortgesetzt werden: Eine bereits veröffentlichte npm-Version des Kerns überspringt die Kernauslösung, nachdem der Workflow nachgewiesen hat, dass der Registry-Tarball mit dem Preflight-Artefakt des Tags übereinstimmt. Die Windows-/Android-Promotion wird übersprungen, wenn das Release bereits den verifizierten Artefaktvertrag erfüllt, sodass bei einem erneuten Versuch nur die fehlgeschlagenen Phasen wiederholt werden. Gezielte Reparaturen ausschließlich für Plugins erfordern `plugin_publish_scope=selected` und eine nicht leere Plugin-Liste. Nur Plugins betreffende `all-publishable`-Läufe erfordern vollständige, unveränderliche Preflight- und Full-Release-Validation-Nachweise; unvollständige Nachweise werden zurückgewiesen.
- Stabiles `OpenClaw Release Publish` erfordert einen exakten `windows_node_tag`, nachdem das entsprechende `openclaw/openclaw-windows-node`-Release ohne Vorabversionsstatus vorhanden ist, sowie die für den Kandidaten genehmigte `windows_node_installer_digests`-Zuordnung. Vor dem Auslösen eines untergeordneten Veröffentlichungs-Workflows wird überprüft, dass das Quell-Release veröffentlicht und keine Vorabversion ist, die erforderlichen x64-/ARM64-Installationsprogramme enthält und weiterhin mit dieser genehmigten Zuordnung übereinstimmt. Anschließend wird `Windows Node Release` ausgelöst, während das OpenClaw-Release noch ein Entwurf ist, wobei die festgeschriebene Digest-Zuordnung der Installationsprogramme unverändert übergeben wird. Der untergeordnete Workflow lädt die signierten Installationsprogramme des Windows Hub von genau diesem Tag herunter, gleicht sie mit den festgeschriebenen Digests ab, überprüft auf einem Windows-Runner, dass ihre Authenticode-Signaturen den erwarteten Signierer der OpenClaw Foundation verwenden, schreibt ein SHA-256-Manifest und lädt die Installationsprogramme samt Manifest in das kanonische OpenClaw-GitHub-Release hoch. Anschließend lädt er die hochgestuften Artefakte erneut herunter und überprüft ihre Aufnahme in das Manifest sowie ihre Hashes. Der übergeordnete Workflow überprüft vor der Veröffentlichung den aktuellen Vertrag für x64-, ARM64- und Prüfsummenartefakte. Eine direkte Wiederherstellung weist unerwartete `OpenClawCompanion-*`-Artefaktnamen zurück, bevor die erwarteten Vertragsartefakte durch die festgeschriebenen Bytes der Quelle ersetzt werden.

  Lösen Sie `Windows Node Release` nur zur Wiederherstellung manuell aus, und übergeben Sie stets einen exakten Tag, niemals `latest`, sowie die explizite `expected_installer_digests`-JSON-Zuordnung aus dem genehmigten Quell-Release. Downloadlinks auf der Website sollten auf exakte OpenClaw-Release-Artefakt-URLs des aktuellen stabilen Releases verweisen oder nur nach der Überprüfung, dass die Weiterleitung von GitHubs neuestem Release auf dasselbe Release verweist, auf `releases/latest/download/...`; verlinken Sie nicht ausschließlich auf die Release-Seite des Begleit-Repositorys.

- Release-Prüfungen werden jetzt in einem separaten manuellen Workflow ausgeführt: `OpenClaw Release Checks`. Er führt außerdem vor der Release-Freigabe den Mock-Paritätslauf des QA Lab sowie das Matrix-Release-Profil und den Telegram-QA-Lauf aus. Die Live-Läufe verwenden die Umgebung `qa-live-shared`; Telegram verwendet zusätzlich Convex-CI-Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit `matrix_profile=all` aus, wenn Sie alle gepflegten Matrix-Szenarien benötigen; der Workflow verteilt diese Auswahl auf die Transport-, Medien- und E2EE-Profile, damit der vollständige Nachweis innerhalb der Zeitüberschreitungen pro Job bleibt.
- Die Laufzeitvalidierung für Installation und Upgrade auf verschiedenen Betriebssystemen ist Teil der öffentlichen Workflows `OpenClaw Release Checks` und `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen. Diese Aufteilung ist beabsichtigt: Der reale npm-Release-Pfad bleibt kurz, deterministisch und auf Artefakte ausgerichtet, während langsamere Live-Prüfungen in ihrem eigenen Lauf verbleiben, damit sie die Veröffentlichung weder verzögern noch blockieren.
- Release-Prüfungen mit Secrets sollten über `Full Release Validation` oder vom `main`-/Release-Workflow-Ref aus gestartet werden, damit Workflow-Logik und Secrets kontrolliert bleiben.
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, sofern der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag aus erreichbar ist.
- Der reine Validierungs-Preflight `OpenClaw NPM Release` akzeptiert außerdem den aktuellen vollständigen, 40 Zeichen langen Commit-SHA des Workflow-Branches, ohne ein gepushtes Tag zu erfordern. Dieser SHA-Pfad dient ausschließlich der Validierung und kann nicht zu einer realen Veröffentlichung hochgestuft werden. Im SHA-Modus erzeugt der Workflow `v<package.json version>` nur für die Prüfung der Paketmetadaten; eine reale Veröffentlichung erfordert weiterhin ein echtes Release-Tag.
- Beide Workflows belassen den realen Veröffentlichungs- und Hochstufungspfad auf von GitHub gehosteten Runnern, während der nicht verändernde Validierungspfad die größeren Blacksmith-Linux-Runner verwenden kann.
- Dieser Workflow führt `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` sowohl mit dem Workflow-Secret `OPENAI_API_KEY` als auch mit `ANTHROPIC_API_KEY` aus.
- Der npm-Release-Preflight wartet nicht mehr auf den separaten Lauf der Release-Prüfungen.
- Führen Sie vor dem lokalen Taggen eines Release-Kandidaten `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` aus. Das Hilfsprogramm führt die schnellen Release-Schutzprüfungen, die npm-/ClawHub-Release-Prüfungen der Plugins, den Build, den UI-Build und `release:openclaw:npm:check` in einer Reihenfolge aus, die häufige, die Freigabe blockierende Fehler erkennt, bevor der GitHub-Veröffentlichungsworkflow startet.
- Führen Sie vor der Freigabe `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (oder das entsprechende Vorabversions-/Korrektur-Tag) aus.
- Führen Sie nach der npm-Veröffentlichung `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (oder die entsprechende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-Installationspfad in einem neuen temporären Präfix zu verifizieren.
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um das Onboarding des installierten Pakets, die Telegram-Einrichtung und echtes Telegram-E2E mit dem veröffentlichten npm-Paket unter Verwendung des gemeinsam genutzten Pools geleaster Telegram-Credentials zu verifizieren. Einmalige lokale Ausführungen durch Maintainer können die Convex-Variablen auslassen und die drei `OPENCLAW_QA_TELEGRAM_*`-Umgebungs-Credentials direkt übergeben.
- Verwenden Sie `pnpm release:beta-smoke -- --beta betaN`, um den vollständigen Beta-Smoke-Test nach der Veröffentlichung von einem Maintainer-Rechner aus auszuführen. Das Hilfsprogramm führt die Parallels-Validierung für npm-Updates und neue Zielsysteme aus, startet `NPM Telegram Beta E2E`, fragt den exakten Workflow-Lauf ab, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Prüfung nach der Veröffentlichung über den manuellen Workflow `NPM Telegram Beta E2E` in GitHub Actions ausführen. Er ist bewusst ausschließlich manuell und wird nicht bei jedem Merge ausgeführt.
- Die Release-Automatisierung für Maintainer verwendet „Preflight, dann Hochstufung“:
  - Eine reale npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` durchlaufen.
  - Die reguläre Orchestrierung und der Preflight für Beta- und stabile Veröffentlichungen verwenden das vertrauenswürdige `main` für das exakte Ziel-Tag. Veröffentlichung und Preflight von Tideclaw Alpha verwenden den entsprechenden Alpha-Branch.
  - Stabile npm-Releases verwenden standardmäßig `beta`; eine stabile npm-Veröffentlichung kann über eine Workflow-Eingabe explizit `latest` als Ziel verwenden.
  - Die tokenbasierte Änderung von npm-Dist-Tags befindet sich in `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, da `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das Quell-Repository ausschließlich OIDC-Veröffentlichungen verwendet.
  - Das öffentliche `macOS Release` dient ausschließlich der Validierung; wenn ein Tag nur auf einem Release-Branch vorhanden ist, der Workflow aber von `main` aus gestartet wird, setzen Sie `public_release_branch=release/YYYY.M.PATCH`.
  - Eine reale macOS-Veröffentlichung muss erfolgreiche macOS-`preflight_run_id` und `validate_run_id` durchlaufen.
  - Reale Veröffentlichungspfade stufen vorbereitete Artefakte hoch, statt sie erneut zu erstellen.
- Bei stabilen Korrektur-Releases wie `YYYY.M.PATCH-N` prüft der Verifizierer nach der Veröffentlichung außerdem denselben Upgrade-Pfad mit temporärem Präfix von `YYYY.M.PATCH` auf `YYYY.M.PATCH-N`, damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem ursprünglichen stabilen Payload belassen.
- Der npm-Release-Preflight schlägt sicher fehl, sofern das Tarball nicht sowohl `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält, damit nicht erneut ein leeres Browser-Dashboard ausgeliefert wird.
- Die Verifizierung nach der Veröffentlichung prüft außerdem, ob die veröffentlichten Plugin-Einstiegspunkte und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release mit fehlenden Plugin-Laufzeit-Payloads besteht den Verifizierer nach der Veröffentlichung nicht und kann nicht zu `latest` hochgestuft werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-Pack-Budget `unpackedSize` für das Update-Tarball des Kandidaten, sodass Installer-E2E eine unbeabsichtigte Vergrößerung des Pakets erkennt, bevor der Release-Veröffentlichungspfad ausgeführt wird.
- Wenn die Release-Arbeit die CI-Planung, Zeitsteuerungsmanifeste für Erweiterungen oder Testmatrizen für Erweiterungen verändert hat, generieren und prüfen Sie vor der Freigabe die vom Planer verwalteten `plugin-prerelease-extension-shard`-Matrixausgaben aus `.github/workflows/plugin-prerelease.yml` erneut, damit die Release Notes kein veraltetes CI-Layout beschreiben.
- Zur Bereitschaft eines stabilen macOS-Releases gehören außerdem die Updater-Oberflächen: Das GitHub-Release muss letztlich die gepackten Dateien `.zip`, `.dmg` und `.dSYM.zip` enthalten; `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile ZIP-Datei verweisen (der macOS-Veröffentlichungsworkflow committet sie automatisch oder öffnet einen Appcast-PR, wenn ein direkter Push blockiert ist); die gepackte App muss eine Bundle-ID ohne Debug-Kennung, eine nicht leere Sparkle-Feed-URL und einen `CFBundleVersion` auf oder über der kanonischen Sparkle-Build-Untergrenze für diese Release-Version beibehalten.

## Release-Testboxen

Mit `Full Release Validation` starten Operatoren die vollständige Produktmatrix über einen einzigen Einstiegspunkt. Verwenden Sie das Hilfsprogramm, damit jeder untergeordnete Workflow von einem temporären Branch aus ausgeführt wird, der auf einen vertrauenswürdigen `main`-Workflow-SHA festgelegt ist, während der angeforderte Commit der zu testende Kandidat bleibt:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

Das Hilfsprogramm ruft den aktuellen Stand von `origin/main` ab, pusht `release-ci/<workflow-sha>-...` bei diesem vertrauenswürdigen Workflow-Commit, leitet `beta` aus Alpha-/Beta-Paketversionen und andernfalls `stable` ab, startet `Full Release Validation` vom temporären Branch mit `ref=<target-sha>`, verifiziert, dass jeder `headSha` eines untergeordneten Workflows mit dem angehefteten SHA des übergeordneten Workflows übereinstimmt, und löscht anschließend den temporären Branch. Übergeben Sie `-f reuse_evidence=false`, um einen neuen Lauf zu erzwingen, `-f release_profile=full` für die umfassende beratende Prüfung oder `--workflow-sha <trusted-main-sha>`, um einen älteren Commit anzuheften, der vom aktuellen `origin/main` aus weiterhin erreichbar ist. Der Workflow selbst schreibt niemals Repository-Refs. Dadurch bleiben die ausschließlich für main verfügbaren Release-Werkzeuge nutzbar, ohne dem Kandidaten Werkzeug-Commits hinzuzufügen, und es wird vermieden, versehentlich einen neueren untergeordneten `main`-Lauf als Nachweis zu verwenden.

Nachdem der Code-SHA erfolgreich geprüft wurde, committen Sie ausschließlich `CHANGELOG.md` und führen dasselbe Hilfsprogramm mit dem Release-SHA aus:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Der zweite übergeordnete Lauf verwendet Produktnachweise nur dann wieder, wenn GitHub bestätigt, dass der Release-SHA vom Code-SHA abstammt und die vollständige Menge geänderter Pfade exakt `CHANGELOG.md` entspricht. Er zeichnet `changelog-only-release-v1` auf und startet keine untergeordneten Produkt-Workflows. npm-Preflight sowie Paket-/Installationsakzeptanz werden weiterhin für den Release-SHA ausgeführt, da sich die Bytes seines Tarballs geändert haben.

Für einen neuen Code-SHA löst der Workflow das Ziel auf, startet den manuellen Workflow `CI` und anschließend `OpenClaw Release Checks`. `OpenClaw Release Checks` verteilt Installations-Smoke-Tests, betriebssystemübergreifende Release-Prüfungen, Live-/E2E-Docker-Abdeckung des Release-Pfads bei aktivierter Dauerprüfung, Package Acceptance mit dem kanonischen Telegram-Paket-E2E, QA-Lab-Parität, Live-Matrix und Live-Telegram. Ein vollständiger/umfassender Lauf ist nur akzeptabel, wenn die Zusammenfassung `Full Release Validation` `normal_ci`, `plugin_prerelease` und `release_checks` als erfolgreich ausweist, es sei denn, bei einer gezielten Wiederholung wurde der separate untergeordnete Workflow `Plugin Prerelease` absichtlich übersprungen. Verwenden Sie den eigenständigen untergeordneten Workflow `npm-telegram` nur für eine gezielte Wiederholung mit veröffentlichtem Paket und `release_package_spec` oder `npm_telegram_package_spec`. Die abschließende Zusammenfassung des Verifizierers enthält Tabellen mit den langsamsten Jobs jedes untergeordneten Laufs, sodass der Release-Manager den aktuellen kritischen Pfad ohne Herunterladen der Protokolle erkennen kann.

Der untergeordnete Produktleistungs-Workflow ist in diesem Release-Pfad ausschließlich artefaktbasiert. Der
übergeordnete Workflow startet ihn mit `publish_reports=false`, und die Validierung wird abgelehnt,
sofern seine Schutzprüfung für den reinen Artefaktmodus nicht bestätigt, dass die Veröffentlichung
des Clawgrit-Berichts übersprungen blieb.

Unter [Vollständige Release-Validierung](/de/reference/full-release-validation) finden Sie die vollständige Phasenmatrix, die exakten Workflow-Jobnamen, die Unterschiede zwischen stabilem und vollständigem Profil, Artefakte und Optionen für gezielte Wiederholungen.

Untergeordnete Workflows werden vom SHA-angehefteten vertrauenswürdigen Ref aus gestartet, der `Full Release Validation` ausführt. Jeder untergeordnete Lauf muss exakt den SHA des übergeordneten Workflows verwenden. Verwenden Sie für Release-Nachweise keine direkten `--ref main -f ref=<sha>`-Starts; verwenden Sie `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Verwenden Sie `release_profile`, um den Umfang der Live-/Provider-Abdeckung auszuwählen:

- `beta`: schnellster releasekritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Beta- sowie stabile Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: stabile sowie umfassende beratende Provider-/Medienabdeckung

Bei stabiler und vollständiger Validierung werden vor der Hochstufung stets die umfassende Live-/E2E-Prüfung, der Docker-Release-Pfad und die begrenzte Prüfung veröffentlichter Upgrade-Überlebensfälle ausgeführt. Verwenden Sie `run_release_soak=true`, um dieselbe Prüfung für eine Beta anzufordern. Diese Prüfung deckt die neuesten vier stabilen Pakete sowie die angehefteten Baselines `2026.4.23` und `2026.5.2` und zusätzlich ältere `2026.4.15`-Abdeckung ab; doppelte Baselines werden entfernt und jede Baseline wird einem eigenen Docker-Runner-Job zugeordnet.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den Ziel-Ref einmalig als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt bei aktiver Dauerprüfung in betriebssystemübergreifenden Prüfungen, Package Acceptance und Docker-Prüfungen des Release-Pfads wieder. Dadurch verwenden alle paketbezogenen Testboxen dieselben Bytes, und wiederholte Paket-Builds werden vermieden. Nachdem eine Beta bereits auf npm verfügbar ist, setzen Sie `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, damit die Release-Prüfungen das ausgelieferte Paket einmal herunterladen, dessen Build-Quell-SHA aus `dist/build-info.json` extrahieren und dieses Artefakt für betriebssystemübergreifende Prüfungen, Package Acceptance, Docker-Prüfungen des Release-Pfads und Telegram-Paketläufe wiederverwenden.

Der betriebssystemübergreifende OpenAI-Installations-Smoke-Test verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die Repository-/Organisationsvariable gesetzt ist, andernfalls `openai/gpt-5.6-luna`, da dieser Lauf die Paketinstallation, das Onboarding, den Gateway-Start und einen Live-Agentenlauf nachweist, statt das leistungsfähigste Modell zu benchmarken. Die umfassendere Live-Provider-Matrix bleibt der Ort für modellspezifische Abdeckung.

Verwenden Sie je nach Release-Phase diese Varianten:

```bash
# Die produktvollständige Code-SHA validieren.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Die ausschließlich das Änderungsprotokoll betreffende Release-SHA durch Wiederverwendung der Produktnachweise der Code-SHA validieren.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Nach der Veröffentlichung einer Beta-Version Telegram-E2E für das veröffentlichte Paket hinzufügen.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Verwenden Sie den vollständigen Umbrella-Workflow nicht als ersten erneuten Lauf nach einer gezielten Korrektur. Wenn eine Box fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job, Docker-Lane, das Paketprofil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen Umbrella-Workflow nur dann erneut aus, wenn die Korrektur die gemeinsame Release-Orchestrierung geändert oder frühere Nachweise aller Boxen ungültig gemacht hat. Der abschließende Prüfer des Umbrella-Workflows überprüft die aufgezeichneten Lauf-IDs der untergeordneten Workflows erneut. Führen Sie daher nach einem erfolgreichen erneuten Lauf eines untergeordneten Workflows nur den fehlgeschlagenen übergeordneten Job `Verify full validation` erneut aus.

`rerun_group=all` kann einen früheren erfolgreichen Umbrella-Lauf wiederverwenden, wenn das Release-Profil,
die effektive Soak-Einstellung und die Validierungseingaben übereinstimmen und entweder die Ziel-SHA
identisch ist oder das neue Ziel ein Nachfolger ist, dessen vollständige Menge geänderter Pfade
genau `CHANGELOG.md` entspricht. Bei Wiederverwendung des exakten Ziels wird
`exact-target-full-validation-v1` aufgezeichnet; die Release-SHA nach der Validierung zeichnet
`changelog-only-release-v1` auf. Letztere verwendet nur die Produktvalidierung wieder. Npm-
Preflight, Paketbytes, Herkunft der Release-Hinweise sowie die Installations-/Update-Abnahme
müssen weiterhin für die Release-SHA ausgeführt werden. Jede Änderung an Version, Quelle, generierten
Inhalten, Abhängigkeiten, Paketen oder Workflow-eigenen Zielen erfordert eine neue Code-SHA
und eine neue vollständige Validierung. Neuere Umbrella-Läufe für dieselbe `release/*`-Referenz und
Gruppe erneuter Läufe ersetzen laufende automatisch. Übergeben Sie
`reuse_evidence=false`, um einen neuen vollständigen Lauf zu erzwingen.

Übergeben Sie für eine begrenzte Wiederherstellung `rerun_group` an den Umbrella-Workflow. `all` ist der tatsächliche Release-Kandidatenlauf, `ci` führt nur den normalen untergeordneten CI-Workflow aus, `plugin-prerelease` führt nur den ausschließlich für Releases vorgesehenen untergeordneten Plugin-Workflow aus, `release-checks` führt jede Release-Box aus, und die enger gefassten Release-Gruppen sind `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`. Gezielte erneute Läufe von `npm-telegram` erfordern `release_package_spec` oder `npm_telegram_package_spec`; vollständige/alle Läufe verwenden das kanonische Telegram-E2E für Pakete innerhalb von Package Acceptance. Gezielte plattformübergreifende erneute Läufe können `cross_os_suite_filter=windows/packaged-upgrade` oder einen anderen Betriebssystem-/Suite-Filter hinzufügen. Fehler bei QA-Release-Prüfungen blockieren die normale Release-Validierung, einschließlich der erforderlichen Drift dynamischer OpenClaw-Tools in der Standardstufe. Tideclaw-Alpha-Läufe können Release-Prüfungs-Lanes, die nicht der Paketsicherheit dienen, weiterhin als unverbindlich behandeln. Mit `release_profile=beta` sind die Live-Provider-Suites `Run repo/live E2E validation` unverbindlich (Warnungen, keine Blocker); stabile und vollständige Profile behandeln sie weiterhin als blockierend. Wenn `live_suite_filter` ausdrücklich eine geschützte QA-Live-Lane wie Discord, WhatsApp oder Slack anfordert, muss die entsprechende Repository-Variable `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` aktiviert sein; andernfalls schlägt die Eingabeerfassung fehl, statt die Lane stillschweigend zu überspringen.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete Workflow `CI`. Die manuelle CI umgeht absichtlich die Eingrenzung auf Änderungen und erzwingt den normalen Testgraphen für den Release-Kandidaten: Linux-Node-Shards, Shards gebündelter Plugins, Vertrags-Shards für Plugins und Kanäle, Kompatibilität mit Node 22, `check-*`, `check-additional-*`, Smoke-Prüfungen erstellter Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Android ist enthalten, wenn `Full Release Validation` die Box ausführt, da der Umbrella-Workflow `include_android=true` übergibt; eine eigenständige manuelle CI erfordert `include_android=true` für die Android-Abdeckung.

Verwenden Sie diese Box, um die Frage „Hat der Quellbaum die vollständige normale Testsuite bestanden?“ zu beantworten. Sie entspricht nicht der Produktvalidierung des Release-Pfads. Aufzubewahrende Nachweise:

- `Full Release Validation`-Zusammenfassung mit der URL des ausgelösten `CI`-Laufs
- erfolgreicher `CI`-Lauf für die exakte Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Zeitmessungsartefakte wie `.artifacts/vitest-shard-timings.json`, wenn für einen Lauf eine Leistungsanalyse erforderlich ist

Führen Sie die manuelle CI nur dann direkt aus, wenn das Release eine deterministische normale CI benötigt, jedoch nicht die Docker-, QA-Lab-, Live-, plattformübergreifenden oder Paket-Boxen. Verwenden Sie den ersten Befehl für eine direkte CI ohne Android. Fügen Sie `include_android=true` hinzu, wenn die direkte Release-Kandidaten-CI Android abdecken muss:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` bis `openclaw-live-and-e2e-checks-reusable.yml`, ergänzt durch den Release-Modus-Workflow `install-smoke`. Sie validiert den Release-Kandidaten über paketierte Docker-Umgebungen statt ausschließlich durch Tests auf Quellcodeebene.

Die Docker-Abdeckung für Releases umfasst:

- vollständigen Installations-Smoke-Test mit aktiviertem langsamen globalen Bun-Installations-Smoke-Test
- Vorbereitung/Wiederverwendung des Smoke-Test-Images des Root-Dockerfiles anhand der Ziel-SHA, wobei QR-, Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate Installations-Smoke-Shards ausgeführt werden
- E2E-Lanes des Repositorys
- Docker-Chunks des Release-Pfads: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` bis `plugins-runtime-install-h` und `openwebui`
- OpenWebUI-Abdeckung auf einem dedizierten Runner mit großem Datenträger, wenn angefordert
- aufgeteilte Lanes für Installation/Deinstallation gebündelter Plugins von `bundled-plugin-install-uninstall-0` bis `bundled-plugin-install-uninstall-23`
- Live-/E2E-Provider-Suites und Docker-Abdeckung für Live-Modelle, wenn die Release-Prüfungen Live-Suites enthalten

Verwenden Sie Docker-Artefakte, bevor Sie einen Lauf wiederholen. Der Scheduler des Release-Pfads lädt `.artifacts/docker-tests/` mit Lane-Protokollen, `summary.json`, `failures.json`, Phasenzeitmessungen, dem Scheduler-Plan als JSON und Befehlen für erneute Läufe hoch. Verwenden Sie für eine gezielte Wiederherstellung `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, statt alle Release-Chunks erneut auszuführen. Generierte Befehle für erneute Läufe enthalten vorherige `package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, sofern verfügbar, sodass eine fehlgeschlagene Lane denselben Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das Release-Gate für agentisches Verhalten und die Kanalebene, getrennt von Vitest und den Paketmechanismen von Docker.

Die QA-Lab-Abdeckung für Releases umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Kandidaten-Lane mithilfe des agentischen Paritätspakets mit der `anthropic/claude-opus-4-8`-Baseline vergleicht
- Release-Profil des Matrix-Live-Adapters unter Verwendung der `qa-live-shared`-Umgebung
- Live-Telegram-QA-Lane unter Verwendung von Convex-CI-Zugangsdaten-Leases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` oder `pnpm qa:observability:smoke`, wenn die Release-Telemetrie einen ausdrücklichen lokalen Nachweis benötigt

Verwenden Sie diese Box, um die Frage „Verhält sich das Release in QA-Szenarien und Live-Kanalabläufen korrekt?“ zu beantworten. Bewahren Sie bei der Freigabe des Releases die Artefakt-URLs für die Paritäts-, Matrix- und Telegram-Lanes auf. Die vollständige Matrix-Abdeckung bleibt als manueller, in Shards aufgeteilter QA-Lab-Lauf verfügbar und ist nicht die standardmäßige releasekritische Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie basiert auf `Package Acceptance` und dem Resolver `scripts/resolve-openclaw-package-candidate.mjs`. Der Resolver normalisiert einen Kandidaten in den von Docker-E2E verwendeten `package-under-test`-Tarball, validiert das Paketinventar, zeichnet die Paketversion und SHA-256 auf und hält die Referenz des Workflow-Harness von der Referenz der Paketquelle getrennt.

Unterstützte Kandidatenquellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version
- `source=ref`: einen vertrauenswürdigen `package_ref`-Branch, ein Tag oder eine vollständige Commit-SHA mit dem ausgewählten `workflow_ref`-Harness paketieren
- `source=url`: ein öffentliches HTTPS-`.tgz` mit erforderlichem `package_sha256` herunterladen; URL-Zugangsdaten, nicht standardmäßige HTTPS-Ports, private/interne/für besondere Zwecke reservierte Hostnamen oder aufgelöste Adressen sowie unsichere Weiterleitungen werden abgelehnt
- `source=trusted-url`: ein HTTPS-`.tgz` mit erforderlichem `package_sha256` und `trusted_source_id` anhand einer benannten Richtlinie in `.github/package-trusted-sources.json` herunterladen; verwenden Sie dies für von Maintainern betriebene Unternehmens-Mirrors oder private Paket-Repositorys, statt `source=url` eine eingabebasierte Umgehung für private Netzwerke hinzuzufügen
- `source=artifact`: ein von einem anderen GitHub-Actions-Lauf hochgeladenes `.tgz` wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai` aus. Package Acceptance verwendet für Migration, Update, das Upgrade eines vom Root-Benutzer verwalteten VPS, den Neustart nach einem Update mit konfigurierter Authentifizierung, die Installation eines Live-ClawHub-Skills, die Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Updates, die Absicherung gegen Escaping bei Plugin-Befehlsbindungen und die Telegram-Paket-QA denselben aufgelösten Tarball. Blockierende Release-Prüfungen verwenden standardmäßig die Baseline des neuesten veröffentlichten Pakets; das Beta-Profil mit `run_release_soak=true`, `release_profile=stable` oder `release_profile=full` erweitert die Prüfung veröffentlichter Pakete, die ein Upgrade überstehen müssen, auf `last-stable-4` sowie die festgelegten Baselines `2026.4.23`, `2026.5.2` und `2026.4.15` mit `reported-issues`-Szenarien. Verwenden Sie Package Acceptance mit `source=npm` für einen bereits veröffentlichten Kandidaten, `source=ref` für einen SHA-basierten lokalen npm-Tarball vor der Veröffentlichung, `source=trusted-url` für einen von Maintainern betriebenen Unternehmens-/privaten Mirror oder `source=artifact` für einen vorbereiteten Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde.

Dies ist der GitHub-native Ersatz für den Großteil der Paket-/Update-Abdeckung, für die zuvor Parallels erforderlich war. Plattformübergreifende Release-Prüfungen bleiben für betriebssystemspezifisches Onboarding-, Installer- und Plattformverhalten relevant, die Produktvalidierung von Paketen und Updates sollte jedoch Package Acceptance bevorzugen.

Die kanonische Checkliste für die Validierung von Updates und Plugins ist [Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Prüfungs-Lane die Installation/Aktualisierung eines Plugins, eine Doctor-Bereinigung oder eine Migration veröffentlichter Pakete nachweist. Die vollständige Migration veröffentlichter Updates von jedem stabilen `2026.4.23+`-Paket ist ein separater manueller `Update Migration`-Workflow und nicht Teil der vollständigen Release-CI.

Die Nachsicht für ältere Package-Acceptance-Fälle ist absichtlich zeitlich begrenzt. Pakete bis einschließlich `2026.4.25` dürfen den Kompatibilitätspfad für bereits auf npm veröffentlichte Metadatenlücken verwenden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes `gateway install --wrapper`, im aus dem Tarball abgeleiteten Git-Fixture fehlende Patch-Dateien, fehlendes persistiertes `update.channel`, veraltete Speicherorte für Plugin-Installationsdatensätze, fehlende Persistenz von Marketplace-Installationsdatensätzen und die Migration von Konfigurationsmetadaten während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf vor bereits ausgelieferten lokalen Stempeldateien für Build-Metadaten warnen. Spätere Pakete müssen die modernen Paketverträge erfüllen; dieselben Lücken führen dann zum Fehlschlagen der Release-Validierung.

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

Übliche Paketprofile:

- `smoke`: schnelle Lanes für Paketinstallation/Kanal/Agent, Gateway-Netzwerk und Neuladen der Konfiguration
- `package`: Verträge für Installation/Aktualisierung/Neustart/Plugin-Pakete sowie Live-Nachweis der Installation eines ClawHub-Skills; dies ist der Standard für die Release-Prüfung
- `product`: `package` sowie MCP-Kanäle, Bereinigung von Cron/Subagenten, OpenAI-Websuche und OpenWebUI
- `full`: Abschnitte des Docker-Release-Pfads mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für gezielte Wiederholungsläufe

Aktivieren Sie für den Telegram-Nachweis eines Paketkandidaten `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` bei der Paketabnahme. Der Workflow übergibt den aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige Telegram-Workflow akzeptiert für Prüfungen nach der Veröffentlichung weiterhin eine veröffentlichte npm-Spezifikation.

## Reguläre Automatisierung der Release-Veröffentlichung

Für Beta, `latest`, Plugin, GitHub Release und Plattformveröffentlichung
ist `OpenClaw Release Publish` der normale verändernde Einstiegspunkt. Der monatliche
reine npm-Pfad `.33+` für Extended Stable verwendet diesen Orchestrator nicht. Der
reguläre Workflow orchestriert die Trusted-Publisher-Workflows in der Reihenfolge, die
das Release erfordert:

1. Checken Sie das Release-Tag aus und ermitteln Sie dessen Commit-SHA.
2. Prüfen Sie, ob das Tag von `main` oder `release/*` erreichbar ist (oder bei Alpha-Vorabversionen von einem Tideclaw-Alpha-Branch).
3. Führen Sie `pnpm plugins:sync:check` aus.
4. Starten Sie `Plugin NPM Release` mit `publish_scope=all-publishable` und `ref=<release-sha>`.
5. Starten Sie `Plugin ClawHub Release` mit demselben Umfang und derselben SHA.
6. Starten Sie `OpenClaw NPM Release` mit dem Release-Tag, dem npm-Dist-Tag und dem gespeicherten `preflight_run_id`, nachdem Sie das gespeicherte `full_release_validation_run_id` und den exakten Ausführungsversuch geprüft haben.
7. Erstellen oder aktualisieren Sie bei stabilen Releases das GitHub-Release als Entwurf, starten Sie `Windows Node Release` mit dem expliziten `windows_node_tag` und dem vom Kandidaten genehmigten `windows_node_installer_digests` und prüfen Sie die kanonischen Windows-Installer-/Prüfsummen-Assets. Starten Sie außerdem `Android Release`, um die signierte APK des exakten Tags samt Prüfsumme und Provenienz zu erstellen. Prüfen Sie beide nativen Asset-Verträge, bevor Sie den Entwurf veröffentlichen.

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

Stabile Veröffentlichung auf dem standardmäßigen Beta-Dist-Tag:

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

Die direkte stabile Heraufstufung auf `latest` erfolgt explizit:

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

Verwenden Sie die untergeordneten Workflows `Plugin NPM Release` und `Plugin ClawHub Release` nur für gezielte Reparaturen oder erneute Veröffentlichungen. `OpenClaw Release Publish` weist `plugin_publish_scope=selected` zurück, wenn `publish_openclaw_npm=true`, damit das Kernpaket nicht ohne jedes veröffentlichbare offizielle Plugin ausgeliefert werden kann, einschließlich `@openclaw/diffs-language-pack`. Legen Sie für die Reparatur eines ausgewählten Plugins `publish_openclaw_npm=false` mit `plugin_publish_scope=selected` und `plugins=@openclaw/name` fest oder starten Sie den untergeordneten Workflow direkt.

Der ClawHub-Bootstrap für die Erstveröffentlichung ist die Ausnahme: Starten Sie `Plugin ClawHub New`
vom vertrauenswürdigen `main` und übergeben Sie die vollständige SHA des Ziel-Releases über `ref`.
Führen Sie den Bootstrap-Workflow selbst niemals vom Release-Tag oder -Branch aus:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Die Validierung vor dem Tagging erfordert `dry_run=true`, weist Eingaben für Release-Tags und übergeordnete Ausführungen
zurück und akzeptiert nur ein exaktes Ziel, das von `main` oder `release/*` erreichbar ist.
Sie lädt keine ClawHub-Anmeldedaten, veröffentlicht keine Paketbytes und ändert keine
Trusted-Publisher-Konfiguration. Der Workflow löst dennoch den Live-Registry-Plan auf,
checkt das Ziel ausschließlich in einem Job ohne Secrets aus und packt es dort, stellt die
gesperrte ClawHub-Toolchain bereit und validiert das unveränderliche Artefakt sowie den
Paket-Slug/die Paketidentität, bevor das Release-Tag existiert. Genehmigen Sie die
`clawhub-plugin-bootstrap`-Umgebung erst, nachdem die Pack-Jobs ohne Secrets
abgeschlossen sind; dieser geschützte Validierungsjob verfügt weder über Anmeldedaten noch über verändernde Befehle.

Ein genehmigter Probelauf oder ein echter Bootstrap nach dem Tagging muss das exakte
Release-Tag sowie die ID, den Versuch und den
Branch der übergeordneten `OpenClaw Release Publish`-Ausführung enthalten. Die übergeordnete Ausführung bestätigt ihre eigene Workflow-SHA und eine separate exakte vertrauenswürdige
`main`-SHA für `Plugin ClawHub New`; die untergeordnete Ausführung und jede Genehmigung einer geschützten
Umgebung müssen mit dieser genehmigten untergeordneten SHA übereinstimmen. Das Release-Tag wird
vor jedem Veröffentlichungsversuch und jeder Trusted-Publisher-Änderung erneut geprüft.

Der Pack-Job
lädt ein unveränderliches Artefakt hoch, dessen Name, Actions-Artefakt-ID/-Digest,
erzeugende Ausführung/erzeugender Versuch, Ziel-SHA und SHA-256/Größe des Tarballs pro Paket
an die Validierungs- und geschützten Jobs weitergegeben werden. Der geschützte Job checkt ausschließlich vertrauenswürdige
`main`-Werkzeuge aus, validiert das Artefakt-Tupel über die GitHub-API, lädt
anhand der exakten Artefakt-ID herunter, berechnet den Hash jedes Tarballs erneut und validiert lokale TAR-Pfade sowie
die Paketidentität anhand der USTAR-Kanonisierungsregeln der angehefteten CLI. Anschließend
durchläuft jeder Kandidat den Probelauf der angehefteten CLI für die Veröffentlichung, der vor
Registry-Abfrage oder Authentifizierung zurückkehrt. Der Vorfilter des Jobs mit Anmeldedaten begrenzt komprimierte ClawPacks
auf 120 MiB, die gesamte Dateinutzlast auf 50 MiB, erweiterte TAR-Daten auf 64 MiB und
die Anzahl der TAR-Einträge auf 10.000. Die Reparatur von Trusted Publishern für bestehende Pakete bleibt
auf die Konfiguration beschränkt, packt jedoch weiterhin das Ziel und erfordert das angeforderte Tag
sowie die exakte Übereinstimmung von Registry-Bytes und -Metadaten, bevor die Trusted-Publisher-
Konfiguration geändert wird. Die Prüfung nach der Veröffentlichung lädt das ClawHub-Artefakt herunter und
erfordert dieselbe SHA-256 und Größe. Eine Wiederherstellung durch erneutes Ausführen fehlgeschlagener Jobs darf das Paketartefakt eines früheren
Versuchs nur wiederverwenden, wenn der exakte erzeugende Job
erfolgreich abgeschlossen wurde. Der abschließende Nachweis bindet außerdem die gesperrte ClawHub-Version, die Lock-
SHA-256 und die npm-Integrität ein. Eine Abweichung erfordert eine neue Paketversion.

## Eingaben des NPM-Workflows

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` oder `v2026.4.2-alpha.1`; bei `preflight_only=true` kann es für einen reinen Validierungs-Preflight auch die aktuelle vollständige 40-stellige Commit-SHA des Workflow-Branches sein
- `preflight_only`: `true` nur für Validierung/Build/Paketierung, `false` für den echten Veröffentlichungspfad
- `preflight_run_id`: ID einer bestehenden erfolgreichen Preflight-Ausführung, auf dem echten Veröffentlichungspfad erforderlich, damit der Workflow den vorbereiteten Tarball wiederverwendet, statt ihn neu zu erstellen
- `full_release_validation_run_id`: ID einer erfolgreichen `Full Release Validation`-Ausführung für dieses Tag/diese SHA, für die echte Veröffentlichung erforderlich. Beta-Veröffentlichungen dürfen allein mit dem Preflight und einer Warnung fortfahren, aber die Heraufstufung auf Stable/`latest` erfordert sie weiterhin.
- `full_release_validation_run_attempt`: exakter positiver Ausführungsversuch, gekoppelt mit `full_release_validation_run_id`; immer erforderlich, wenn die Ausführungs-ID angegeben wird, damit Wiederholungsläufe den Autorisierungsnachweis während der Veröffentlichung nicht ändern können.
- `release_publish_run_id`: ID der genehmigten `OpenClaw Release Publish`-Ausführung; erforderlich, wenn dieser Workflow von dieser übergeordneten Ausführung gestartet wird (Bot-Akteur-Aufrufe für echte Veröffentlichungen)
- `plugin_npm_run_id`: ID einer erfolgreichen `Plugin NPM Release`-Ausführung mit exaktem Head; für eine echte Veröffentlichung des `extended-stable`-Kernpakets erforderlich
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; akzeptiert `alpha`, `beta`, `latest` oder `extended-stable` und verwendet standardmäßig `beta`. Der finale Patch `33` und spätere müssen `extended-stable` verwenden; standardmäßig weist `extended-stable` frühere Patches zurück und weist Tags, die nicht final sind, immer zurück.
- `bypass_extended_stable_guard`: boolescher Wert nur für Tests, standardmäßig `false`; umgeht mit `npm_dist_tag=extended-stable` die monatliche Extended-Stable-Berechtigung, während Prüfungen der Release-Identität, des Artefakts, der Genehmigung und des Rücklesens erhalten bleiben.

`Plugin NPM Release` akzeptiert `npm_dist_tag=default` für das bestehende Release-
Verhalten oder `npm_dist_tag=extended-stable` für den abgesicherten monatlichen Pfad. Die
Extended-Stable-Option erfordert `publish_scope=all-publishable`, eine leere
`plugins`-Eingabe, einen finalen Patch ab `33` und den kanonischen
`extended-stable/YYYY.M.33`-Branch an dessen exakter Spitze. Sie verschiebt niemals die Plugin-
Tags `latest` oder `beta`. Neue Paketversionen erhalten `extended-stable` atomar
durch vertrauenswürdige OIDC-Veröffentlichung (`npm publish --tag extended-stable`); dieser
Quell-Workflow verwendet kein tokenauthentifiziertes `npm dist-tag add`. Wiederholungsversuche
überspringen exakte Versionen, die bereits in npm vorhanden sind, und brechen anschließend sicher ab, sofern nicht ein vollständiges
Rücklesen bestätigt, dass jedes exakte Paket und `extended-stable`-Tag konvergiert ist.

`OpenClaw Release Publish` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag; muss bereits existieren
- `preflight_run_id`: ID einer erfolgreichen `OpenClaw NPM Release`-Preflight-Ausführung; erforderlich bei `publish_openclaw_npm=true` oder `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: ID einer erfolgreichen `Full Release Validation`-Ausführung; erforderlich bei `publish_openclaw_npm=true` oder `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: exakter positiver Versuch, gekoppelt mit `full_release_validation_run_id`; immer erforderlich, wenn die Ausführungs-ID angegeben wird
- `windows_node_tag`: exaktes `openclaw/openclaw-windows-node`-Release-Tag, das keine Vorabversion bezeichnet; für die stabile OpenClaw-Veröffentlichung erforderlich
- `windows_node_installer_digests`: vom Kandidaten genehmigte kompakte JSON-Zuordnung der aktuellen Windows-Installer-Namen zu ihren angehefteten `sha256:`-Digests; für die stabile OpenClaw-Veröffentlichung erforderlich
- `npm_telegram_run_id`: optionale ID einer erfolgreichen `NPM Telegram Beta E2E`-Ausführung, die in den abschließenden Release-Nachweis aufgenommen werden soll
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket, eines von `alpha`, `beta` oder `latest`
- `plugin_publish_scope`: standardmäßig `all-publishable`; verwenden Sie `selected` nur für gezielte reine Plugin-Reparaturen mit `publish_openclaw_npm=false`
- `plugins`: durch Kommas getrennte `@openclaw/*`-Paketnamen, wenn `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standardmäßig `true`; legen Sie `false` nur fest, wenn Sie den Workflow als Orchestrator für reine Plugin-Reparaturen verwenden
- `release_profile`: Release-Abdeckungsprofil für Zusammenfassungen des Release-Nachweises; standardmäßig `from-validation`, wodurch es aus dem Validierungsmanifest gelesen wird, oder überschreiben Sie es mit `beta`, `stable` oder `full`
- `wait_for_clawhub`: standardmäßig `false`, damit die npm-Verfügbarkeit nicht durch den ClawHub-Sidecar blockiert wird; legen Sie `true` nur fest, wenn der Abschluss des Workflows den Abschluss von ClawHub einschließen muss

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständiger Commit-SHA, der validiert werden soll. Prüfungen, die Geheimnisse verwenden, erfordern, dass der aufgelöste Commit über einen OpenClaw-Branch oder ein Release-Tag erreichbar ist.
- `run_release_soak`: Aktiviert für Beta-Release-Prüfungen umfassende Live-/E2E-Prüfungen, den Docker-Release-Pfad und einen Dauertest aller Upgrade-Überlebensszenarien seit Beginn. Dies wird durch `release_profile=stable` und `release_profile=full` erzwungen.

Regeln:

- Reguläre finale Versionen und Korrekturversionen unterhalb von Patch `33` können entweder unter `beta` oder `latest` veröffentlicht werden. Finale Versionen ab Patch `33` müssen unter `extended-stable` veröffentlicht werden; Versionen mit Korrektursuffix an dieser Grenze werden abgelehnt.
- Beta-Prerelease-Tags dürfen nur unter `beta` veröffentlicht werden; Alpha-Prerelease-Tags nur unter `alpha`
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur zulässig, wenn `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer ausschließlich der Validierung
- Der tatsächliche Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflights verwendet wurde; der Workflow überprüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Reguläre Release-Abfolge für Beta/neueste stabile Version

Diese Legacy-Abfolge ist für das reguläre orchestrierte Release vorgesehen, das auch Plugins, das GitHub Release, Windows und weitere Plattformarbeiten umfasst. Sie ist nicht der monatliche, ausschließlich für npm vorgesehene Extended-Stable-Pfad `.33+`, der am Anfang dieser Seite dokumentiert ist.

Beim Erstellen eines regulären orchestrierten stabilen Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus. Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit-SHA des Workflow-Branches für einen Dry Run des Preflight-Workflows verwenden, der ausschließlich der Validierung dient.
2. Wählen Sie `npm_dist_tag=beta` für den normalen Ablauf, bei dem zuerst die Beta veröffentlicht wird, oder `latest` nur dann, wenn Sie bewusst direkt eine stabile Version veröffentlichen möchten.
3. Führen Sie `Full Release Validation` auf dem Release-Branch, dem Release-Tag oder dem vollständigen Commit-SHA aus, wenn Sie normale CI sowie Abdeckung für Live-Prompt-Cache, Docker, QA Lab, Matrix und Telegram über einen einzigen manuellen Workflow wünschen. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den manuellen Workflow `CI` auf der Release-Referenz aus.
4. Wählen Sie genau das Nicht-Prerelease-Release-Tag `openclaw/openclaw-windows-node`, dessen signierte x64- und ARM64-Installationsprogramme ausgeliefert werden sollen. Speichern Sie es als `windows_node_tag` und die validierte Digest-Zuordnung der Installationsprogramme als `windows_node_installer_digests`. Das Release-Candidate-Hilfsprogramm zeichnet beides auf und nimmt die Werte in den generierten Veröffentlichungsbefehl auf.
5. Speichern Sie die erfolgreichen Werte für `preflight_run_id`, `full_release_validation_run_id` und den exakten Wert für `full_release_validation_run_attempt`.
6. Führen Sie `OpenClaw Release Publish` aus dem vertrauenswürdigen `main` mit demselben `tag`, demselben `npm_dist_tag`, dem ausgewählten `windows_node_tag`, dessen gespeichertem `windows_node_installer_digests`, dem gespeicherten `preflight_run_id`, `full_release_validation_run_id` und `full_release_validation_run_attempt` aus. Der Vorgang veröffentlicht externalisierte Plugins auf npm und ClawHub, bevor das OpenClaw-npm-Paket hochgestuft wird.
7. Wenn das Release unter `beta` veröffentlicht wurde, verwenden Sie den Workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, um diese stabile Version von `beta` auf `latest` hochzustufen.
8. Wenn das Release bewusst direkt unter `latest` veröffentlicht wurde und `beta` sofort demselben stabilen Build folgen soll, verwenden Sie denselben Release-Workflow, um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie `beta` später durch dessen geplante selbstheilende Synchronisierung verschieben.

Die Änderung des Dist-Tags erfolgt im Release-Ledger-Repository, da sie weiterhin `NPM_TOKEN` erfordert, während das Quell-Repository ausschließlich über OIDC veröffentlicht. Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Pfad mit vorheriger Beta-Hochstufung dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen Sie sämtliche Befehle der 1Password-CLI (`op`) nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht direkt aus der Haupt-Shell des Agenten auf. Die Ausführung innerhalb von tmux macht Eingabeaufforderungen, Warnmeldungen und die OTP-Verarbeitung nachvollziehbar und verhindert wiederholte Host-Warnmeldungen.

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

Maintainer verwenden für das tatsächliche Runbook die privaten Release-Dokumente unter [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md).

## Verwandte Themen

- [Release-Kanäle](/de/install/development-channels)
