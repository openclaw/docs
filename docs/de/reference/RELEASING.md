---
doc-schema-version: 1
read_when:
    - Suche nach öffentlichen Release-Channel-Definitionen
    - Release-Validierung oder Paketabnahme ausführen
    - Auf der Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Release-Kanäle, Betreiber-Checkliste, Validierungsboxen, Versionsbenennung und Veröffentlichungsrhythmus
title: Veröffentlichungsrichtlinie
x-i18n:
    generated_at: "2026-07-24T04:54:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: de2429f039bb42deabdcfe280b7d91afac3bae3dc24714203ab7a67672dcc10c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw stellt vier benutzerseitige Aktualisierungskanäle bereit:

- stable: die freigegebene reguläre Version auf npm `latest`
- extended-stable: die `.33+`-Wartungslinie des letzten abgeschlossenen Monats auf
  npm `extended-stable`
- beta: Vorabversions-Tags auf npm `beta`
- dev: der fortlaufend aktualisierte Head von `main`

Extended-stable stellt den Gateway, die offiziellen npm-Plugins und die
Docker-Images des letzten Monats bereit, ohne die regulären Selektoren `latest` oder `main` zu verschieben.

Tideclaw-Alpha-Builds bilden einen separaten internen Vorabversionszweig (npm-Dist-Tag `alpha`), der unter [NPM-Workflow-Eingaben](#npm-workflow-inputs) und [Release-Testboxen](#release-test-boxes) behandelt wird.

## Versionsbenennung

- Monatliche Extended-Stable-Release-Version des Gateways: `YYYY.M.PATCH`, mit `PATCH >= 33`, Git-Tag `vYYYY.M.PATCH`
- Tägliche/reguläre finale Release-Version: `YYYY.M.PATCH`, mit `PATCH < 33`, Git-Tag `vYYYY.M.PATCH`
- Reguläre Fallback-Korrektur-Release-Version: `YYYY.M.PATCH-N`, Git-Tag `vYYYY.M.PATCH-N`
- Beta-Vorabversionsnummer: `YYYY.M.PATCH-beta.N`, Git-Tag `vYYYY.M.PATCH-beta.N`
- Alpha-Vorabversionsnummer: `YYYY.M.PATCH-alpha.N`, Git-Tag `vYYYY.M.PATCH-alpha.N`
- Monat oder Patch niemals mit führenden Nullen auffüllen
- `PATCH` ist eine fortlaufende monatliche Release-Train-Nummer, kein Kalendertag. Reguläre finale und Beta-Releases erhöhen den aktuellen Train; reine Alpha-Tags verbrauchen oder erhöhen niemals die Beta-/reguläre Patchnummer. Ignorieren Sie daher ältere reine Alpha-Tags mit höheren Patchnummern, wenn Sie einen Beta- oder regulären Train auswählen.
- Alpha-/Nightly-Builds verwenden den nächsten noch nicht veröffentlichten Patch-Train und erhöhen bei wiederholten Builds nur `alpha.N`. Sobald für diesen Patch eine Beta vorliegt, wechseln neue Alpha-Builds zum darauffolgenden Patch.
- npm-Versionen sind unveränderlich: Löschen, veröffentlichen oder verwenden Sie ein veröffentlichtes Tag niemals erneut. Erstellen Sie stattdessen die nächste Vorabversionsnummer oder den nächsten monatlichen Patch.
- `latest` folgt weiterhin der aktuellen regulären/täglichen npm-Linie; `beta` ist das aktuelle Beta-Installationsziel
- `extended-stable` bezeichnet die unterstützte Gateway-Distribution des letzten Monats, beginnend mit Patch `33`; Patch `34` und spätere Versionen sind Wartungs-Releases dieser monatlichen Linie
- Reguläre finale und reguläre Korrektur-Releases werden standardmäßig unter npm `beta` veröffentlicht; Release-Verantwortliche können explizit `latest` anvisieren oder einen geprüften Beta-Build später hochstufen
- Gateway Extended-Stable veröffentlicht Core, jedes über npm veröffentlichbare offizielle Plugin
  und die zugehörigen Docker-Images unter exakt derselben Version; siehe den dedizierten Workflow unten.
- Jedes reguläre finale Release stellt das npm-Paket, die macOS-App, die signierte eigenständige Android-APK und die signierten Windows-Hub-Installationsprogramme gemeinsam bereit. Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad; Build, Signierung, Notarisierung und Hochstufung nativer Apps bleiben dem regulären finalen Release vorbehalten, sofern sie nicht ausdrücklich angefordert werden.

## Release-Zyklus

- Releases durchlaufen zuerst die Beta; Stable folgt erst nach erfolgreicher Validierung der neuesten Beta
- Maintainer erstellen Releases normalerweise aus einem `release/YYYY.M.PATCH`-Branch, der vom aktuellen `main` erstellt wurde, damit Release-Validierung und Korrekturen die neue Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und korrigiert werden muss, erstellen Maintainer das nächste `-beta.N`-Tag, statt das alte zu löschen oder neu zu erstellen
- Detaillierte Release-Verfahren, Genehmigungen, Anmeldedaten und Wiederherstellungshinweise sind ausschließlich für Maintainer bestimmt

## Monatliche Extended-Stable-Veröffentlichung des Gateways

Erstellen Sie für den abgeschlossenen Monat `YYYY.M` den Branch `extended-stable/YYYY.M.33` und veröffentlichen Sie
`.33+` aus diesem Branch. Tag, Branch, Checkout, Paketversion, Vorabprüfung und
Validierung müssen denselben Commit bezeichnen. Vor `.33` muss der geschützte Branch `main`
eine finale Version eines späteren Monats unterhalb von Patch `33` enthalten; spätere Wartungs-Patches
bleiben zulässig.

### Kandidaten vorbereiten und stabilisieren

Prüfen Sie den noch nicht auditierten Mainline-Bereich, gleichen Sie private Sicherheitsarbeiten ab, genehmigen Sie eine
begrenzte Backport-Menge und führen Sie einen koordinierten PR zusammen. Pushen Sie nicht direkt auf den kanonischen
Branch.

Setzen Sie auf dem kanonischen Branch `YYYY.M.P`, führen Sie `pnpm release:prep` aus und verlangen Sie
diese Version in jedem veröffentlichbaren offiziellen Plugin. Generieren und committen Sie anhand des genehmigten Verzeichnisses
einen vollständigen Abschnitt `## YYYY.M.P` mit `### Highlights`,
`### Changes` und `### Fixes`, wobei für gleichwertige Backports die ursprünglichen zusammengeführten `main`-PRs
angeführt werden. Die Vorabprüfung lehnt einen fehlenden oder leeren Abschnitt ab.

Übernehmen Sie die vollständige Docker-Release-Kanaleinheit des aktuellen Main-Branchs: Workflow, Hochstufungslogik,
Richtlinie, gemeinsamen Klassifikator, Tests und Workflow-Validierung. GitHub lädt Tag-
Workflows aus dem mit dem Tag versehenen Commit; eine unvollständige Kopie kann nach dem Build fehlschlagen oder
reguläre Aliasse verschieben. Führen Sie gezielte Prüfungen aus.

Fixieren Sie den vollständigen SHA der Branch-Spitze. Prüfen Sie vor dem Tagging die exakten npm-Bytes
vorab und führen Sie die vollständige Release-Validierung für diesen SHA aus:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"

gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag="$RELEASE_SHA" \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

Die SHA-Form dient ausschließlich der Vorabprüfung. Führen Sie die Validierung auf dem kanonischen Branch aus; die Veröffentlichung
bindet ihre Workflow-Referenz, den Head-/Ziel-SHA, die Ausführungs-ID und den Versuch. Speichern Sie beide IDs und
den erfolgreichen `run_attempt`; lehnen Sie `release-ci/*`-Nachweise ab.

Klassifizieren Sie Fehler vor jeder Bearbeitung:

- Produkt: Führen Sie einen weiteren genehmigten Backport-PR zusammen.
- Werkzeug für das fixierte Ziel: Übernehmen Sie nur die kleinste Kompatibilitätskorrektur,
  die das alte Produkt unverändert testet.
- Provider, Genehmigung, Runner oder Dienst: Lassen Sie den Kandidaten unverändert und verwenden Sie
  den begrenzten Wiederholungspfad.

Jede Änderung am Branch macht beide Prüfungen ungültig. Sobald sie bestanden wurden, stellen Sie sicher, dass die Spitze weiterhin
`RELEASE_SHA` entspricht, und pushen Sie anschließend das signierte Tag `vYYYY.M.P`. Spätere Änderungen erfordern den nächsten
Patch; verschieben oder löschen Sie das Tag niemals. Sein Push startet `Docker Release`.

### npm-Pakete veröffentlichen

Veröffentlichen Sie jedes über npm veröffentlichbare offizielle Plugin aus demselben SHA und speichern Sie die
ID der erfolgreichen Ausführung:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Der Workflow deckt alle `all-publishable`-Pakete einschließlich unveränderter Pakete ab
und überprüft jede exakte Version und jeden Selektor. Wiederholungen verwenden bereits veröffentlichte Versionen erneut.

Veröffentlichen Sie anschließend den vorbereiteten Core-Tarball mit allen drei gespeicherten Ausführungsidentitäten:

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

Fügen Sie ausschließlich für Probeläufe außerhalb der Produktion
`-f bypass_extended_stable_guard=true` zur Vorabprüfung und Veröffentlichung hinzu. Dadurch wird nur die
Monatsprüfung umgangen, niemals jedoch Prüfungen der kanonischen Referenz, der Gleichheit von SHA/Tag/Version, der Herkunft,
der Genehmigung oder des Rücklesens. Verwenden Sie dies niemals für die Produktion.

### Überprüfen und wiederherstellen

Führen Sie in einem separaten sauberen Checkout des aktuellen `main`, nicht im fixierten Branch, Folgendes aus:

```bash
node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.P
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Verlangen Sie Signaturen und npm-Herkunftsnachweise für den kanonischen Branch sowie die Bindung von Veröffentlichung,
Vorabprüfung und Tarball-Digest an den Release-SHA. Beide Befehle müssen
`YYYY.M.P` zurückgeben. Überprüfen Sie jedes vorbereitete Core-Paket und jedes der `all-publishable`
offiziellen Plugins anhand seiner exakten Version und seines Selektors.

Wenn nur der Root-Selektor fehlschlägt, verwenden Sie den generierten
`npm dist-tag add openclaw@YYYY.M.P extended-stable`-Reparaturbefehl, der in
der Workflow-Zusammenfassung ausgegeben wird. Reparieren Sie vorhandene Plugin- oder andere vorbereitete Core-Selektoren
mithilfe genehmigter, von Anmeldedaten isolierter Werkzeuge; die OIDC-Quelle kann sie nicht verändern.
Veröffentlichen Sie niemals eine unveränderliche Version erneut.

Verlangen Sie, dass `Docker Release` die exakten Standard-, Slim-, Browser- und Architektur-
Images in GHCR und Docker Hub einschließlich Attestierungen und Plattformversionen überprüft. Dabei dürfen ausschließlich
`extended-stable`, `extended-stable-slim` und `extended-stable-browser`
anhand des Digests aktualisiert werden; reguläre Aliasse bleiben unverändert und ein automatisches Rollback wird abgelehnt.

Führen Sie zur Alias-Reparatur das genehmigungspflichtige `Docker Channel Promotion` vom aktuellen
`main` mit dem Tag aus. Es wiederholt die Digest-, Attestierungs- und Plattformprüfungen, erlaubt
ein explizites Rollback und erstellt niemals Images neu.

Slack, Discord und Codex sind die anfänglich dokumentierten Support-Oberflächen, keine
Release-Zulassungsliste: Jedes über npm veröffentlichbare offizielle Plugin wird ausgeliefert. Ausschließlich die reguläre
Checkliste ist für Beta/`latest`, GitHub Releases, ClawHub, native Apps, Mobilgeräte,
Website und private Dist-Tags zuständig; führen Sie diese Schritte für diesen Gateway-Pfad nicht aus.

## Checkliste für reguläre Release-Verantwortliche

Diese Checkliste bildet die öffentliche Struktur des Release-Ablaufs ab. Private Anmeldedaten sowie Details zu Signierung, Notarisierung, Wiederherstellung von Dist-Tags und Notfall-Rollbacks verbleiben im ausschließlich für Maintainer bestimmten Release-Runbook.

1. Beginnen Sie mit dem aktuellen `main`: Rufen Sie den neuesten Stand ab, bestätigen Sie, dass der Ziel-Commit gepusht wurde, und stellen Sie sicher, dass die CI für `main` ausreichend fehlerfrei ist, um davon einen Branch zu erstellen.
2. Erstellen Sie `release/YYYY.M.PATCH` aus diesem Commit. Backports sind optional; übernehmen Sie ausschließlich die von den Release-Verantwortlichen ausgewählte Menge. Erhöhen Sie alle erforderlichen Versionsangaben, führen Sie `pnpm release:prep` aus, schließen Sie Release-Korrekturen und erforderliche Forward-Ports ab und prüfen Sie `src/plugins/compat/registry.ts` sowie `src/commands/doctor/shared/deprecation-compat.ts`.
3. Fixieren Sie den produktseitig vollständigen Commit vor dem Changelog als **Code-SHA**. Führen Sie die deterministische Quellcode-Vorabprüfung aus und verwenden Sie anschließend `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Dadurch werden vertrauenswürdige Workflow-Werkzeuge fixiert, während die vollständige Vitest-, Docker-, QA-, Paket- und Performance-Matrix exakt auf den Code-SHA ausgerichtet ist.
4. Klassifizieren Sie Fehler vor jeder Bearbeitung. Ein Produkt-/Codefehler erzeugt einen neuen Code-SHA und erfordert eine erfolgreiche vollständige Validierung für diesen SHA. Ein Fehler im Workflow, in der Testumgebung, bei Anmeldedaten, bei der Genehmigung oder in der Infrastruktur wird in der jeweils zuständigen Oberfläche behoben und erneut mit demselben Code-SHA ausgeführt.
5. Erstellen Sie erst nach erfolgreicher Prüfung des Code-SHA den obersten Abschnitt `CHANGELOG.md` aus zusammengeführten PRs und direkten Commits seit dem letzten erreichbaren ausgelieferten Tag. Formulieren Sie Einträge benutzerorientiert und vermeiden Sie Duplikate. Wenn ein abweichendes ausgeliefertes Tag oder ein späterer Forward-Port bereits veröffentlichte PRs neu zuordnet, übergeben Sie es explizit als `--shipped-ref`.
6. Committen Sie ausschließlich `CHANGELOG.md`. Dieser Commit ist der **Release-SHA**. Der vollständige Diff vom Code-SHA zum Release-SHA muss exakt `CHANGELOG.md` entsprechen; jeder andere geänderte Pfad setzt das Release auf Schritt 2 zurück.
7. Führen Sie die SHA-fixierte vollständige Release-Validierung für den Release-SHA mit aktivierter Wiederverwendung von Nachweisen aus. Der leichtgewichtige übergeordnete Lauf muss `changelog-only-release-v1` aufzeichnen, auf den erfolgreichen Code-SHA verweisen und darf keine untergeordneten Produkt-Lanes starten. Dadurch werden Produktnachweise wiederverwendet, nicht jedoch Paketbytes.
8. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` für den Release-SHA bzw. das Tag aus. Speichern Sie den erfolgreichen `preflight_run_id`. Dadurch werden exakt die Paketbytes erstellt und geprüft, die den finalen Changelog enthalten.
9. Versehen Sie den Release-SHA mit einem Tag und führen Sie anschließend das Kandidaten-Hilfsprogramm mit dem erfolgreichen übergeordneten Release-SHA-Validierungslauf und der npm-Vorabprüfung aus, anstatt einen der beiden erneut zu starten:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Für Stable übergeben Sie außerdem `--windows-node-tag vX.Y.Z`. Das Hilfsprogramm überprüft die Herkunft der Release Notes, die npm-Preflight-Bytes, den Parallels-Installations-/Aktualisierungsnachweis, den Telegram-Paketnachweis und die Plugin-Veröffentlichungspläne und gibt anschließend den Veröffentlichungsbefehl aus.

   `OpenClaw Release Publish` übermittelt die ausgewählten oder alle veröffentlichungsfähigen Plugin-Pakete parallel an npm und dieselbe Auswahl an ClawHub und stuft anschließend das vorbereitete OpenClaw-npm-Preflight-Artefakt mit dem passenden dist-tag hoch, sobald die npm-Veröffentlichung der Plugins erfolgreich war. Der Release-Checkout bleibt der Produkt-/Datenstamm, während Planung und abschließende Überprüfung aus dem exakten vertrauenswürdigen Checkout der Workflow-Quelle ausgeführt werden, damit ein älterer Release-Commit nicht unbemerkt veraltete Release-Werkzeuge verwenden kann. Bevor ein untergeordneter Veröffentlichungslauf startet, rendert und speichert der Workflow den exakten GitHub-Release-Text zwischen. Wenn der vollständige passende Abschnitt `CHANGELOG.md` innerhalb des GitHub-Limits von 125,000 Zeichen und der passenden Sicherheitsobergrenze des Renderers von 125,000 Byte liegt, enthält die Seite exakt diesen Abschnitt `## YYYY.M.PATCH` einschließlich seiner Überschrift. Wenn der Quellabschnitt nicht hineinpasst, behält die Seite die exakten gruppierten redaktionellen Hinweise bei und ersetzt den übergroßen Beitragsnachweis durch einen stabilen Link zum vollständigen Nachweis in `CHANGELOG.md`, das an den Tag gebunden ist; teilweise Nachweise und abgeschnittene Aufzählungspunkte werden niemals veröffentlicht. Der Workflow wählt diesen vollständigen oder kompakten Text aus, bevor `### Release verification` hinzugefügt wird; würde der Nachweisanhang das Limit überschreiten, behält er den kanonischen Text bei und stützt sich stattdessen auf den unveränderlichen angehängten Nachweis. Stable-Releases, die auf npm mit `latest` veröffentlicht werden, werden zum neuesten GitHub-Release, während Stable-Wartungsreleases, die auf npm unter `beta` verbleiben, mit GitHub `latest=false` erstellt werden. Der Workflow lädt außerdem den Preflight-Abhängigkeitsnachweis, das Manifest der vollständigen Validierung und den Nachweis der Registry-Überprüfung nach der Veröffentlichung in das GitHub-Release hoch, um die Reaktion auf Vorfälle nach dem Release zu unterstützen. Er gibt die IDs der untergeordneten Läufe sofort aus, genehmigt automatisch die Gates der Release-Umgebung, die das Workflow-Token genehmigen darf, fasst fehlgeschlagene untergeordnete Jobs mit den letzten Protokollzeilen zusammen, erstellt die GitHub-Release-Seite vorab als Entwurf und stuft Windows- und Android-Artefakte gleichzeitig mit der Veröffentlichung von OpenClaw auf npm hoch, schließt die Release-Seite und den Abhängigkeitsnachweis ab, sobald diese Phasen erfolgreich sind, wartet bei jeder Veröffentlichung von OpenClaw auf npm auf ClawHub, führt anschließend den Beta-Verifizierer vom vertrauenswürdigen Main-Branch aus und lädt Nachweise nach der Veröffentlichung für das GitHub-Release, das npm-Paket, die ausgewählten Plugin-npm-Pakete, die ausgewählten ClawHub-Pakete, die IDs der untergeordneten Workflow-Läufe und die optionale ID des NPM-Telegram-Laufs hoch. Der ClawHub-Bootstrap-Verifizierer verlangt den exakten vertrauenswürdigen Main-Workflow-Pfad und SHA, die Laufversuche des Erzeugers und des abschließenden Laufs, den Release-SHA, die angeforderte Paketauswahl, das unveränderliche Tupel der Paketartefakte und das abschließende Artefakt zum Rücklesen aus der Registry; ein erfolgreicher älterer Lauf auf einer Release-Referenz wird nicht akzeptiert.

   Führen Sie anschließend die Paketabnahme nach der Veröffentlichung für das veröffentlichte Paket `openclaw@YYYY.M.PATCH-beta.N` oder `openclaw@beta` aus. Wenn ein gepushtes oder veröffentlichtes Vorab-Release korrigiert werden muss, erstellen Sie die nächste passende Vorab-Release-Nummer; löschen oder überschreiben Sie niemals die alte.

10. Behalten Sie nach einem fehlgeschlagenen Veröffentlichungsversuch den Release-SHA unverändert bei, sofern der Fehler nicht einen Produkt- oder Changelog-Defekt nachweist. Setzen Sie erfolgreiche unveränderliche untergeordnete Läufe und Artefakte fort; erstellen oder veröffentlichen Sie niemals eine bereits erfolgreiche Paketversion erneut.
11. Fahren Sie bei Stable erst fort, nachdem die geprüfte Beta oder der Release Candidate über die erforderlichen Validierungsnachweise verfügt. Die Stable-Veröffentlichung auf npm läuft ebenfalls über `OpenClaw Release Publish` und verwendet dabei das erfolgreiche Preflight-Artefakt über `preflight_run_id` erneut. Die Bereitschaft eines Stable-macOS-Releases erfordert außerdem die paketierten `.zip`, `.dmg`, `.dSYM.zip` und das aktualisierte `appcast.xml` auf `main`; der macOS-Veröffentlichungsworkflow veröffentlicht den signierten Appcast automatisch im öffentlichen `main`, nachdem die Release-Artefakte überprüft wurden, oder öffnet/aktualisiert einen Appcast-PR, wenn der Branch-Schutz den direkten Push blockiert. Die Bereitschaft des Stable-Windows-Hub erfordert die signierten Artefakte `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` und `OpenClawCompanion-SHA256SUMS.txt` im OpenClaw-GitHub-Release. Übergeben Sie den exakten signierten Release-Tag `openclaw/openclaw-windows-node` als `windows_node_tag` und seine für den Kandidaten genehmigte Installer-Digest-Zuordnung als `windows_node_installer_digests`; `OpenClaw Release Publish` behält den Release-Entwurf bei, startet `Windows Node Release` und überprüft alle drei Artefakte vor der Veröffentlichung.
12. Führen Sie nach der Veröffentlichung den npm-Verifizierer nach der Veröffentlichung, bei Bedarf den optionalen eigenständigen Telegram-E2E-Test für das veröffentlichte npm-Paket zum Nachweis des Kanals nach der Veröffentlichung, bei Bedarf die Hochstufung des dist-tag, die Überprüfung der generierten GitHub-Release-Seite sowie die Schritte zur Release-Ankündigung aus und schließen Sie anschließend [Abschluss des Stable-Main-Branch](#stable-main-closeout) ab, bevor Sie ein Stable-Release als abgeschlossen bezeichnen.

## Abschluss des Stable-Main-Branch

Die Stable-Veröffentlichung ist erst abgeschlossen, wenn `main` den tatsächlich ausgelieferten Release-Stand enthält.

1. Beginnen Sie mit dem aktuellen Stand von `main`. Prüfen Sie `release/YYYY.M.PATCH` dagegen und übertragen Sie echte Korrekturen nach vorn, die in `main` fehlen. Führen Sie nicht unbesehen ausschließlich für das Release vorgesehene Kompatibilitäts-, Test- oder Validierungsadapter in das neuere `main` zusammen.
2. Setzen Sie für den normalen Ablauf `main` auf die ausgelieferte Stable-Version. Bei einem verspäteten Abschluss kann `main` verwendet werden, nachdem es bereits auf eine spätere stabile OpenClaw-CalVer-Version fortgeschritten ist; stufen Sie einen bereits begonnenen Release-Zyklus nicht nur zum Abschluss des vorherigen Releases zurück. Der Validator verlangt weiterhin den exakten ausgelieferten Changelog-Abschnitt und Appcast-Eintrag und zeichnet die tatsächliche Version und den SHA von `main` auf. Führen Sie nach jeder Änderung der Stammversion `pnpm release:prep` und anschließend `pnpm deps:shrinkwrap:generate` aus.
3. Sorgen Sie dafür, dass der Abschnitt `## YYYY.M.PATCH` von `CHANGELOG.md` auf `main` exakt mit dem getaggten Release-Branch übereinstimmt. Nehmen Sie die Stable-Aktualisierung von `appcast.xml` auf, wenn das Mac-Release eine veröffentlicht hat.
4. Fügen Sie `main` weder `YYYY.M.PATCH+1` noch eine Beta-Version oder einen leeren zukünftigen Changelog-Abschnitt hinzu, bis der Operator diesen Release-Zyklus ausdrücklich startet.
5. Führen Sie `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` und `OPENCLAW_TESTBOX=1 pnpm check:changed` aus. Pushen Sie anschließend und überprüfen Sie, dass `origin/main` die ausgelieferte Version und den Changelog enthält, bevor Sie das Stable-Release als abgeschlossen bezeichnen.
6. Halten Sie die Repository-Variablen `RELEASE_ROLLBACK_DRILL_ID` und `RELEASE_ROLLBACK_DRILL_DATE` nach jeder privaten Rollback-Übung aktuell.

`OpenClaw Stable Main Closeout` beginnt mit dem Push von `main`, der nach der Stable-Veröffentlichung die ausgelieferte Version, den Changelog und den Appcast enthält. Der Vorgang liest unveränderliche Nachweise nach der Veröffentlichung, um den ausgelieferten Tag an seine Läufe zur vollständigen Release-Validierung und Veröffentlichung zu binden, und überprüft anschließend den Stable-Main-Stand, das Release, die obligatorische Stable-Beobachtungsphase und die blockierenden Leistungsnachweise. Er hängt ein unveränderliches Abschlussmanifest und eine Prüfsumme an das GitHub-Release an. Der automatische Push-Trigger überspringt ältere Releases, die vor den unveränderlichen Nachweisen nach der Veröffentlichung liegen, und behandelt dieses Überspringen niemals als abgeschlossenen Abschluss.

Ein vollständiger Abschluss erfordert beide Artefakte und eine passende Prüfsumme. Ein unvollständiges Manifest spielt den darin aufgezeichneten SHA `main` und die Rollback-Übung erneut ab, um identische Bytes zu erzeugen, und hängt anschließend die fehlende Prüfsumme an; ein ungültiges Paar oder eine Prüfsumme ohne Manifest bleibt blockierend. Ein durch einen Push ausgelöster Lauf ohne Repository-Variablen für die Rollback-Übung wird übersprungen, ohne den Abschluss zu vollenden; ein fehlender oder mehr als 90 Tage alter Übungsnachweis blockiert weiterhin einen manuellen, nachweisgestützten Abschluss. Private Wiederherstellungsbefehle verbleiben im ausschließlich für Maintainer vorgesehenen Runbook. Verwenden Sie die manuelle Auslösung nur, um einen nachweisgestützten Stable-Abschluss zu reparieren oder erneut abzuspielen.

Wenn der übergeordnete Release-Veröffentlichungslauf erst fehlgeschlagen ist, nachdem unveränderliche npm-/Plugin-Nachweise angehängt wurden, reparieren und veröffentlichen Sie zunächst alle Stable-Plattformartefakte. Anschließend darf ein Maintainer den Abschluss manuell mit `allow_failed_publish_recovery=true` auslösen; dieser Modus akzeptiert nur einen abgeschlossenen, fehlgeschlagenen übergeordneten Lauf und verlangt zusätzlich die exakten Android- und Windows-Artefaktverträge, GitHub-SHA-256-Digests, die Prüfsummenüberprüfung, die Android-Herkunft sowie eine erfolgreiche, vom übergeordneten Lauf ausgelöste Windows-Hochstufung, deren Authenticode-Prüfungen und für den Kandidaten genehmigte Digests mit den veröffentlichten Installationsprogrammen übereinstimmen, zusätzlich zu den normalen macOS-/Appcast-Prüfungen. Der automatische Push-Abschluss aktiviert diesen Wiederherstellungsmodus niemals.

Ein älterer Fallback-Korrektur-Tag darf den Nachweis des Basispakets nur erneut verwenden, wenn der Korrektur-Tag auf denselben Quell-Commit wie der Stable-Basis-Tag verweist. Sein Android-Release verwendet die verifizierte APK des Basis-Tags erneut und fügt einen Herkunftsnachweis für den Korrektur-Tag hinzu. Eine Korrektur mit abweichender Quelle muss eigene Paketnachweise veröffentlichen und überprüfen und eine höhere Android-Version `versionCode` verwenden.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript auch außerhalb des schnelleren lokalen Gates `pnpm check` abgedeckt bleibt.
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Prüfungen auf Importzyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates erfolgreich sind.
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten Release-Artefakte `dist/*` und das Control-UI-Bundle für den Paketvalidierungsschritt vorhanden sind.
- Führen Sie `pnpm release:prep` nach der Erhöhung der Stammversion und vor dem Tagging aus. Der Befehl führt alle deterministischen Release-Generatoren aus, die nach einer Versions-, Konfigurations- oder API-Änderung häufig abweichen: Plugin-Versionen, npm-Shrinkwraps, Plugin-Inventar, Basiskonfigurationsschema, Konfigurationsmetadaten gebündelter Kanäle, Baseline der Konfigurationsdokumentation, Plugin-SDK-Exporte, das API-Vertragsmanifest des Plugin SDK und Control-UI-Locale-Bundles. Außerdem blockiert er, bis die Übersetzungen nativer Apps und die von den Plattformen generierten Locale-Ressourcen mit dem Quellinventar übereinstimmen; wenn sie zurückliegen, warten Sie vor dem Einfrieren des Code-SHA auf `Native App Locale Refresh` oder lösen Sie es aus. `pnpm release:check` führt diese Schutzprüfungen erneut im Prüfmodus aus (einschließlich der strengen Locale-Gates und des Oberflächenbudgets des Plugin SDK) und meldet alle Abweichungsfehler generierter Dateien in einem Durchlauf, bevor die Paket-Release-Prüfungen ausgeführt werden.
- Die Synchronisierung der Plugin-Versionen aktualisiert standardmäßig das veröffentlichungsfähige Laufzeitpaket `@openclaw/ai`, die offiziellen Plugin-Paketversionen und vorhandene Untergrenzen von `openclaw.compat.pluginApi` auf die OpenClaw-Release-Version. Behandeln Sie dieses Feld als Untergrenze der Plugin-SDK-/Laufzeit-API und nicht lediglich als Kopie der Paketversion: Behalten Sie bei reinen Plugin-Releases, die absichtlich mit älteren OpenClaw-Hosts kompatibel bleiben, die Untergrenze bei der ältesten unterstützten Host-API und dokumentieren Sie diese Entscheidung im Plugin-Release-Nachweis.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um alle Testboxen vor dem Release über einen einzigen Einstiegspunkt zu starten. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, startet manuell `CI` und startet `OpenClaw Release Checks` für Installations-Smoke-Tests, Paketabnahme, betriebssystemübergreifende Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stable- und vollständige Läufe enthalten immer umfassende Live-/E2E-Tests und eine Docker-Beobachtungsphase des Release-Pfads; `run_release_soak=true` bleibt für eine ausdrücklich angeforderte Beta-Beobachtungsphase erhalten. Die Paketabnahme stellt während der Kandidatenvalidierung den kanonischen Telegram-E2E-Test des Pakets bereit und vermeidet damit einen zweiten gleichzeitig laufenden Live-Poller.

  Geben Sie nach der Veröffentlichung einer Beta `release_package_spec` an, um das ausgelieferte npm-Paket über Release-Prüfungen, Paketabnahme und den Telegram-E2E-Test des Pakets hinweg erneut zu verwenden, ohne das Release-Tarball neu zu erstellen. Geben Sie `npm_telegram_package_spec` nur an, wenn Telegram ein anderes veröffentlichtes Paket als die übrige Release-Validierung verwenden soll. Geben Sie `package_acceptance_package_spec` an, wenn die Paketabnahme ein anderes veröffentlichtes Paket als die Release-Paketspezifikation verwenden soll. Geben Sie `evidence_package_spec` an, wenn der Release-Nachweisbericht belegen soll, dass die Validierung mit einem veröffentlichten npm-Paket übereinstimmt, ohne einen Telegram-E2E-Test zu erzwingen.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Führen Sie den manuellen `Package Acceptance`-Workflow aus, wenn Sie einen Nachweis über einen Seitenkanal für einen Paketkandidaten benötigen, während die Release-Arbeiten fortgesetzt werden. Verwenden Sie `source=npm` für `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`, um einen vertrauenswürdigen `package_ref`-Branch, -Tag oder -SHA mit dem aktuellen `workflow_ref`-Harness zu paketieren; `source=url` für einen öffentlichen HTTPS-Tarball mit erforderlicher SHA-256-Prüfsumme und strikter Richtlinie für öffentliche URLs; `source=trusted-url` für eine benannte Richtlinie für vertrauenswürdige Quellen mit erforderlichem `trusted_source_id` und SHA-256; oder `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde.

  Der Workflow löst den Kandidaten zu `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler für diesen Tarball erneut und kann Telegram-QA für denselben Tarball mit `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket sowohl als installierte CLI als auch als zu testendes Paket, sodass der Pfad für den verwalteten Neustart des Update-Befehls des Kandidaten ausgeführt wird.

  Beispiel:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Gängige Profile:
  - `smoke`: Lanes für Installation/Kanal/Agent, Gateway-Netzwerk und erneutes Laden der Konfiguration
  - `package`: artefaktnative Lanes für Paket/Update/Neustart/Plugin ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Bereinigung von Cron/Subagent, OpenAI-Websuche und OpenWebUI
  - `full`: Abschnitte des Docker-Release-Pfads mit OpenWebUI
  - `custom`: exakte Auswahl von `docker_lanes` für einen gezielten erneuten Lauf

- Führen Sie den manuellen `CI`-Workflow direkt aus, wenn Sie nur eine deterministische normale CI-Abdeckung für den Release-Kandidaten benötigen. Manuell ausgelöste CI-Läufe umgehen die Eingrenzung auf Änderungen und erzwingen die Linux-Node-Shards, die Shards gebündelter Plugins, die Vertrags-Shards für Plugins und Kanäle, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Tests für erstellte Artefakte, Dokumentationsprüfungen, Python-Skills sowie die Windows-, macOS- und Control-UI-i18n-Lanes. Eigenständige manuelle CI-Läufe führen Android nur aus, wenn sie mit `include_android=true` ausgelöst werden; `Full Release Validation` übergibt diese Eingabe an seinen untergeordneten CI-Workflow.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie die Release-Telemetrie validieren. Dabei wird QA-lab über einen lokalen OTLP/HTTP-Empfänger ausgeführt und der Export von Traces, Metriken und Protokollen sowie begrenzte Trace-Attribute und die Schwärzung von Inhalten und Bezeichnern überprüft, ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm qa:otel:collector-smoke` aus, wenn Sie die Collector-Kompatibilität validieren. Dabei wird derselbe OTLP-Export von QA-lab durch einen echten Docker-Container mit OpenTelemetry Collector geleitet, bevor die Zusicherungen des lokalen Empfängers geprüft werden.
- Führen Sie `pnpm qa:prometheus:smoke` aus, wenn Sie geschütztes Prometheus-Scraping validieren. Dabei wird QA-lab ausgeführt, nicht authentifiziertes Scraping abgelehnt und überprüft, dass für das Release kritische Metrikfamilien frei von Prompt-Inhalten, unbearbeiteten Bezeichnern, Authentifizierungstoken und lokalen Pfaden bleiben.
- Führen Sie `pnpm qa:observability:smoke` aus, um die OpenTelemetry- und Prometheus-Smoke-Lanes für den Quellcode-Checkout direkt nacheinander auszuführen.
- Führen Sie `pnpm release:check` vor jedem mit einem Tag versehenen Release aus.
- Der `OpenClaw NPM Release`-Preflight erzeugt Release-Nachweise zu Abhängigkeiten, bevor er den npm-Tarball paketiert. Das Schwachstellen-Gate für npm-Advisories blockiert das Release. Die Berichte zu Risiken im transitiven Manifest, zur Eigentümerschaft und Installationsoberfläche von Abhängigkeiten sowie zu Änderungen an Abhängigkeiten dienen lediglich als Release-Nachweise. Der Bericht zu Änderungen an Abhängigkeiten vergleicht den Release-Kandidaten mit dem vorherigen erreichbaren Release-Tag. Der Preflight lädt die Abhängigkeitsnachweise als `openclaw-release-dependency-evidence-<tag>` hoch und bettet sie außerdem unter `dependency-evidence/` in das vorbereitete npm-Preflight-Artefakt ein. Der tatsächliche Veröffentlichungspfad verwendet dieses Preflight-Artefakt erneut und hängt anschließend dieselben Nachweise als `openclaw-<version>-dependency-evidence.zip` an das GitHub-Release an.
- Führen Sie `OpenClaw Release Publish` für die verändernde Veröffentlichungssequenz aus, nachdem das Tag vorhanden ist. Lösen Sie reguläre Beta- und stabile Veröffentlichungen aus dem vertrauenswürdigen `main` aus; das Release-Tag wählt weiterhin den exakten Ziel-Commit aus und kann auf `release/YYYY.M.PATCH` verweisen. Tideclaw-Alpha-Veröffentlichungen verbleiben auf ihrem jeweils passenden Alpha-Branch. Übergeben Sie den erfolgreichen OpenClaw-npm-`preflight_run_id`, den erfolgreichen `full_release_validation_run_id` und den exakten `full_release_validation_run_attempt`, und behalten Sie den standardmäßigen Veröffentlichungsumfang für Plugins `all-publishable` bei, sofern Sie nicht absichtlich eine gezielte Reparatur ausführen. Der Workflow serialisiert die npm-Veröffentlichung der Plugins, die ClawHub-Veröffentlichung der Plugins und die npm-Veröffentlichung von OpenClaw, damit das Kernpaket nicht vor seinen externalisierten Plugins veröffentlicht wird; die Windows- und Android-Promotion wird parallel zur npm-Veröffentlichung des Kerns für die Entwurfsseite des Releases ausgeführt. Erneute Veröffentlichungsläufe können fortgesetzt werden: Bei einer bereits veröffentlichten npm-Version des Kerns wird das Auslösen der Kernveröffentlichung übersprungen, nachdem der Workflow nachgewiesen hat, dass der Registry-Tarball mit dem Preflight-Artefakt des Tags übereinstimmt. Die Windows-/Android-Promotion wird übersprungen, wenn das Release bereits den verifizierten Artefaktvertrag erfüllt, sodass bei einem erneuten Versuch nur die fehlgeschlagenen Phasen wiederholt werden. Gezielte Reparaturen ausschließlich für Plugins erfordern `plugin_publish_scope=selected` und eine nicht leere Plugin-Liste. Ausschließlich Plugins betreffende `all-publishable`-Läufe erfordern vollständige, unveränderliche Nachweise aus Preflight und Full Release Validation; unvollständige Nachweise werden abgelehnt.
- Eine stabile `OpenClaw Release Publish` erfordert einen exakten `windows_node_tag`, nachdem das zugehörige, nicht als Vorabversion gekennzeichnete `openclaw/openclaw-windows-node`-Release vorhanden ist, sowie die für den Kandidaten genehmigte `windows_node_installer_digests`-Zuordnung. Bevor ein untergeordneter Veröffentlichungs-Workflow ausgelöst wird, wird überprüft, dass dieses Quell-Release veröffentlicht und keine Vorabversion ist, die erforderlichen x64-/ARM64-Installationsprogramme enthält und weiterhin mit dieser genehmigten Zuordnung übereinstimmt. Anschließend wird `Windows Node Release` ausgelöst, während das OpenClaw-Release noch ein Entwurf ist; dabei wird die festgeschriebene Zuordnung der Installationsprogramm-Digests unverändert übergeben. Der untergeordnete Workflow lädt die signierten Windows-Hub-Installationsprogramme von genau diesem Tag herunter, gleicht sie mit den festgeschriebenen Digests ab, überprüft auf einem Windows-Runner, dass ihre Authenticode-Signaturen den erwarteten Unterzeichner OpenClaw Foundation verwenden, schreibt ein SHA-256-Manifest und lädt die Installationsprogramme samt Manifest in das kanonische GitHub-Release von OpenClaw hoch. Anschließend lädt er die hochgestuften Artefakte erneut herunter und überprüft ihre Zugehörigkeit zum Manifest sowie ihre Hashes. Der übergeordnete Workflow überprüft vor der Veröffentlichung den aktuellen Artefaktvertrag für x64, ARM64 und Prüfsummen. Bei einer direkten Wiederherstellung werden unerwartete `OpenClawCompanion-*`-Artefaktnamen abgelehnt, bevor die erwarteten Vertragsartefakte durch die festgeschriebenen Bytes der Quelle ersetzt werden.

  Lösen Sie `Windows Node Release` nur zur Wiederherstellung manuell aus und übergeben Sie immer ein exaktes Tag, niemals `latest`, sowie die explizite `expected_installer_digests`-JSON-Zuordnung aus dem genehmigten Quell-Release. Downloadlinks auf der Website sollten auf exakte OpenClaw-Release-Artefakt-URLs für das aktuelle stabile Release verweisen oder nur dann auf `releases/latest/download/...`, wenn überprüft wurde, dass die Weiterleitung von GitHubs neuestem Release auf dasselbe Release verweist; verlinken Sie nicht ausschließlich auf die Release-Seite des Begleit-Repositorys.

- Release-Prüfungen werden jetzt in einem separaten manuellen Workflow ausgeführt: `OpenClaw Release Checks`. Er führt außerdem vor der Release-Freigabe die Mock-Paritäts-Lane von QA Lab sowie das Matrix-Release-Profil und die Telegram-QA-Lane aus. Die Live-Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet zusätzlich Convex-Leases für CI-Anmeldedaten. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit `matrix_profile=all` aus, wenn Sie alle gepflegten Matrix-Szenarien ausführen möchten; der Workflow verteilt diese Auswahl auf die Transport-, Medien- und E2EE-Profile, damit der vollständige Nachweis innerhalb der Zeitlimits pro Job bleibt.
- Die laufzeitbezogene Validierung von Installation und Upgrade über mehrere Betriebssysteme hinweg ist Bestandteil der öffentlichen Workflows `OpenClaw Release Checks` und `Full Release Validation`, die den wiederverwendbaren Workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen. Diese Trennung ist beabsichtigt: Der echte npm-Release-Pfad bleibt kurz, deterministisch und auf Artefakte ausgerichtet, während langsamere Live-Prüfungen in ihrer eigenen Lane verbleiben, damit sie die Veröffentlichung weder verzögern noch blockieren.
- Release-Prüfungen mit Secrets sollten über `Full Release Validation` oder von der Workflow-Referenz `main`/release ausgelöst werden, damit Workflow-Logik und Secrets kontrolliert bleiben.
- `OpenClaw Release Checks` akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, sofern der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist.
- Der ausschließlich zur Validierung dienende Preflight von `OpenClaw NPM Release` akzeptiert auch den aktuellen vollständigen, 40 Zeichen langen Commit-SHA des Workflow-Branches, ohne ein gepushtes Tag zu verlangen. Dieser SHA-Pfad dient ausschließlich der Validierung und kann nicht zu einer echten Veröffentlichung hochgestuft werden. Im SHA-Modus erzeugt der Workflow `v<package.json version>` nur für die Prüfung der Paketmetadaten; eine echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag.
- Beide Workflows belassen den echten Veröffentlichungs- und Hochstufungspfad auf von GitHub gehosteten Runnern, während der nicht verändernde Validierungspfad die größeren Blacksmith-Linux-Runner verwenden kann.
- Dieser Workflow führt `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` unter Verwendung der beiden Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus.
- Der npm-Release-Preflight wartet nicht mehr auf die separate Lane für Release-Prüfungen.
- Führen Sie vor dem lokalen Taggen eines Release-Kandidaten `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` aus. Das Hilfsprogramm führt die schnellen Release-Schutzprüfungen, die npm-/ClawHub-Release-Prüfungen für Plugins, den Build, den UI-Build und `release:openclaw:npm:check` in einer Reihenfolge aus, die häufige, die Freigabe blockierende Fehler erkennt, bevor der Veröffentlichungs-Workflow von GitHub startet.
- Führen Sie vor der Freigabe `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (oder das entsprechende Vorabversions-/Korrektur-Tag) aus.
- Führen Sie nach der npm-Veröffentlichung `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (oder die entsprechende Beta-/Korrekturversion) aus, um den Installationspfad der veröffentlichten Registry mit einem neuen temporären Präfix zu überprüfen.
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus, um das Onboarding des installierten Pakets, die Telegram-Einrichtung und echte Telegram-E2E-Tests mit dem veröffentlichten npm-Paket unter Verwendung des gemeinsam geleasten Pools für Telegram-Anmeldedaten zu überprüfen. Bei einmaligen lokalen Ausführungen durch Maintainer können die Convex-Variablen entfallen und die drei `OPENCLAW_QA_TELEGRAM_*`-Umgebungsanmeldedaten direkt übergeben werden.
- Verwenden Sie `pnpm release:beta-smoke -- --beta betaN`, um den vollständigen Beta-Smoke-Test nach der Veröffentlichung auf einem Maintainer-Rechner auszuführen. Das Hilfsprogramm führt die Validierung von Parallels-npm-Updates und neuen Zielsystemen aus, löst `NPM Telegram Beta E2E` aus, fragt exakt diesen Workflow-Lauf ab, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Prüfung nach der Veröffentlichung über GitHub Actions mit dem manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist absichtlich ausschließlich manuell und wird nicht bei jedem Merge ausgeführt.
- Die Release-Automatisierung für Maintainer verwendet „Preflight, dann Hochstufung“:
  - Eine echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` durchlaufen.
  - Die reguläre Orchestrierung und der Preflight für Beta- und stabile Veröffentlichungen verwenden das vertrauenswürdige `main` für exakt das Ziel-Tag. Tideclaw-Alpha-Veröffentlichung und -Preflight verwenden den entsprechenden Alpha-Branch.
  - Stabile npm-Releases verwenden standardmäßig `beta`; die stabile npm-Veröffentlichung kann über eine Workflow-Eingabe explizit auf `latest` abzielen.
  - Die tokenbasierte Änderung des npm-Dist-Tags befindet sich in `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, da `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das Quell-Repository ausschließlich OIDC-basierte Veröffentlichungen verwendet.
  - Der öffentliche Workflow `macOS Release` dient ausschließlich der Validierung; wenn ein Tag nur auf einem Release-Branch vorhanden ist, der Workflow jedoch von `main` ausgelöst wird, setzen Sie `public_release_branch=release/YYYY.M.PATCH`.
  - Eine echte macOS-Veröffentlichung muss erfolgreiche macOS-`preflight_run_id` und `validate_run_id` durchlaufen.
  - Echte Veröffentlichungspfade stufen vorbereitete Artefakte hoch, anstatt sie erneut zu erstellen.
- Bei stabilen Korrektur-Releases wie `YYYY.M.PATCH-N` prüft der Verifizierer nach der Veröffentlichung außerdem denselben Upgrade-Pfad mit temporärem Präfix von `YYYY.M.PATCH` auf `YYYY.M.PATCH-N`, damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem ursprünglichen stabilen Payload belassen.
- Der npm-Release-Preflight schlägt sicher fehl, sofern das Tarball nicht sowohl `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload enthält, damit nicht erneut ein leeres Browser-Dashboard ausgeliefert wird.
- Die Verifizierung nach der Veröffentlichung prüft außerdem, ob die veröffentlichten Plugin-Einstiegspunkte und Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release mit fehlenden Plugin-Laufzeit-Payloads besteht den Verifizierer nach der Veröffentlichung nicht und kann nicht zu `latest` hochgestuft werden.
- `pnpm test:install:smoke` setzt außerdem das npm-Pack-Budget `unpackedSize` für das Tarball des Update-Kandidaten durch, damit Installer-E2E-Tests eine unbeabsichtigte Vergrößerung des Pakets erkennen, bevor der Veröffentlichungs-Pfad des Releases ausgeführt wird.
- Wenn die Release-Arbeit die CI-Planung, Zeitsteuerungsmanifeste für Erweiterungen oder Testmatrizen für Erweiterungen geändert hat, generieren und prüfen Sie vor der Freigabe die vom Planer verwalteten `plugin-prerelease-extension-shard`-Matrixausgaben aus `.github/workflows/plugin-prerelease.yml` neu, damit die Release Notes kein veraltetes CI-Layout beschreiben.
- Zur Bereitschaft eines stabilen macOS-Releases gehören außerdem die Updater-Oberflächen: Das GitHub-Release muss letztlich die paketierten Dateien `.zip`, `.dmg` und `.dSYM.zip` enthalten; `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile ZIP-Datei verweisen (der macOS-Veröffentlichungs-Workflow committet sie automatisch oder öffnet einen Appcast-PR, wenn ein direkter Push blockiert ist); die paketierte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-URL und einen `CFBundleVersion` auf oder über dem kanonischen Mindestwert für Sparkle-Builds dieser Release-Version beibehalten.

## Release-Testboxen

Mit `Full Release Validation` starten Operatoren die vollständige Produktmatrix über einen einzigen Einstiegspunkt. Verwenden Sie das Hilfsprogramm, damit jeder untergeordnete Workflow von einem temporären Branch ausgeführt wird, der auf einen vertrauenswürdigen Workflow-SHA `main` festgelegt ist, während der angeforderte Commit der zu testende Kandidat bleibt:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

Das Hilfsprogramm ruft den aktuellen Stand von `origin/main` ab, pusht `release-ci/<workflow-sha>-...` bei diesem vertrauenswürdigen Workflow-Commit, leitet `beta` aus Alpha-/Beta-Paketversionen und andernfalls `stable` ab, löst `Full Release Validation` vom temporären Branch mit `ref=<target-sha>` aus, überprüft, dass jeder untergeordnete Workflow `headSha` mit dem festgelegten SHA des übergeordneten Workflows übereinstimmt, und löscht anschließend den temporären Branch. Übergeben Sie `-f reuse_evidence=false`, um einen neuen Lauf zu erzwingen, `-f release_profile=full` für die umfassende Advisory-Prüfung oder `--workflow-sha <trusted-main-sha>`, um einen älteren Commit festzulegen, der weiterhin vom aktuellen `origin/main` erreichbar ist. Der Workflow selbst schreibt niemals Repository-Referenzen. Dadurch bleiben die ausschließlich auf main verfügbaren Release-Werkzeuge nutzbar, ohne dem Kandidaten Tooling-Commits hinzuzufügen, und es wird vermieden, versehentlich einen neueren untergeordneten Lauf `main` als Nachweis zu verwenden.

Nachdem der Code-SHA erfolgreich durchgelaufen ist, committen Sie ausschließlich `CHANGELOG.md` und führen dasselbe Hilfsprogramm mit dem Release-SHA aus:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Der zweite übergeordnete Lauf verwendet Produktnachweise nur dann erneut, wenn GitHub belegt, dass der Release-SHA vom Code-SHA abstammt und die vollständige Menge geänderter Pfade exakt `CHANGELOG.md` entspricht. Er zeichnet `changelog-only-release-v1` auf und löst keine untergeordneten Produkt-Workflows aus. npm-Preflight sowie Paket-/Installationsabnahme werden weiterhin mit dem Release-SHA ausgeführt, da sich dessen Tarball-Bytes geändert haben.

Für einen neuen Code-SHA löst der Workflow nach der Auflösung des Ziels zunächst manuell `CI` und anschließend `OpenClaw Release Checks` aus. `OpenClaw Release Checks` verteilt Installations-Smoke-Tests, betriebssystemübergreifende Release-Prüfungen, Live-/E2E-Docker-Abdeckung des Release-Pfads bei aktivierter Dauerprüfung, die Paketabnahme mit dem kanonischen Telegram-Paket-E2E-Test, QA-Lab-Parität, Live-Matrix und Live-Telegram. Ein vollständiger Lauf beziehungsweise ein Lauf mit allen Prüfungen ist nur akzeptabel, wenn die Zusammenfassung `Full Release Validation` `normal_ci`, `plugin_prerelease` und `release_checks` als erfolgreich ausweist, sofern bei einer gezielten Wiederholung nicht absichtlich der separate untergeordnete Workflow `Plugin Prerelease` übersprungen wurde. Verwenden Sie den eigenständigen untergeordneten Workflow `npm-telegram` nur für eine gezielte Wiederholung mit dem veröffentlichten Paket unter Verwendung von `release_package_spec` oder `npm_telegram_package_spec`. Die abschließende Verifizierungszusammenfassung enthält für jeden untergeordneten Lauf Tabellen mit den langsamsten Jobs, sodass die Release-Verantwortlichen den aktuellen kritischen Pfad ohne Herunterladen der Protokolle erkennen können.

Der untergeordnete Produktleistungs-Workflow ist in diesem Release-Pfad ausschließlich für Artefakte vorgesehen. Der
übergeordnete Workflow startet ihn mit `publish_reports=false`, und die Validierung wird abgelehnt,
sofern seine Schutzprüfung für den reinen Artefaktbetrieb nicht nachweist, dass die Veröffentlichung
des Clawgrit-Berichts übersprungen blieb.

Unter [Vollständige Release-Validierung](/de/reference/full-release-validation) finden Sie die vollständige Phasenmatrix, die exakten Workflow-Jobnamen, die Unterschiede zwischen stabilem und vollständigem Profil, Artefakte und Optionen für gezielte Wiederholungsläufe.

Untergeordnete Workflows werden von der per SHA fixierten vertrauenswürdigen Referenz gestartet, die `Full Release Validation` ausführt. Jeder untergeordnete Lauf muss exakt den SHA des übergeordneten Workflows verwenden. Verwenden Sie für Release-Nachweise keine direkten `--ref main -f ref=<sha>`-Starts, sondern `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Verwenden Sie `release_profile`, um den Umfang der Live-/Provider-Abdeckung auszuwählen:

- `beta`: schnellster releasekritischer Live- und Docker-Pfad für OpenAI/Core
- `stable`: Beta sowie Abdeckung stabiler Provider/Backends für die Release-Freigabe
- `full`: stabil sowie breite ergänzende Provider-/Medienabdeckung

Die stabile und vollständige Validierung führt vor der Promotion stets die umfassenden Live-/E2E-Prüfungen, den Docker-Release-Pfad und die begrenzte Überlebensprüfung für Upgrades veröffentlichter Pakete aus. Verwenden Sie `run_release_soak=true`, um dieselbe Prüfung für eine Beta anzufordern. Diese Prüfung deckt die neuesten vier stabilen Pakete sowie die fixierten Baselines `2026.4.23` und `2026.5.2` und zusätzlich ältere Abdeckung mit `2026.4.15` ab. Doppelte Baselines werden entfernt, und jede Baseline wird in einen eigenen Docker-Runner-Job aufgeteilt.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Referenz, um die Zielreferenz einmalig als `release-package-under-test` aufzulösen, und verwendet dieses Artefakt bei Soak-Läufen erneut für betriebssystemübergreifende Prüfungen, die Paketabnahme und Docker-Prüfungen des Release-Pfads. Dadurch verwenden alle paketbezogenen Umgebungen dieselben Bytes, und wiederholte Paket-Builds werden vermieden. Nachdem eine Beta bereits auf npm verfügbar ist, setzen Sie `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, damit die Release-Prüfungen das veröffentlichte Paket einmalig herunterladen, den SHA seiner Build-Quelle aus `dist/build-info.json` extrahieren und dieses Artefakt für betriebssystemübergreifende Prüfungen, die Paketabnahme, den Docker-Release-Pfad und die Telegram-Paket-Lanes wiederverwenden.

Der betriebssystemübergreifende OpenAI-Installations-Smoke-Test verwendet `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die Repository-/Organisationsvariable gesetzt ist, andernfalls `openai/gpt-5.6-luna`, da diese Lane die Paketinstallation, das Onboarding, den Gateway-Start und einen Live-Agentendurchlauf nachweist, statt das leistungsfähigste Modell zu benchmarken. Die breitere Matrix der Live-Provider bleibt der Ort für modellspezifische Abdeckung.

Verwenden Sie je nach Release-Phase diese Varianten:

```bash
# Den produktvollständigen Code-SHA validieren.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Den ausschließlich das Änderungsprotokoll betreffenden Release-SHA durch Wiederverwendung der Produktnachweise des Code-SHA validieren.
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

Verwenden Sie nach einer gezielten Korrektur nicht zuerst den vollständigen Sammellauf als erneuten Lauf. Wenn eine Box fehlschlägt, verwenden Sie für den nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job, Docker-Lane, das Paketprofil, den Modell-Provider oder die QA-Lane. Führen Sie den vollständigen Sammellauf nur erneut aus, wenn die Korrektur die gemeinsam genutzte Release-Orchestrierung geändert oder frühere Nachweise aller Boxen ungültig gemacht hat. Die abschließende Verifizierung des Sammellaufs überprüft die aufgezeichneten Lauf-IDs der untergeordneten Workflows erneut. Nachdem ein untergeordneter Workflow erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen übergeordneten Job `Verify full validation` erneut aus.

`rerun_group=all` kann einen früheren erfolgreichen Sammellauf wiederverwenden, wenn das Release-Profil,
die effektive Soak-Einstellung und die Validierungseingaben übereinstimmen und entweder der Ziel-SHA
identisch ist oder das neue Ziel ein Nachfolger ist, dessen vollständige Menge geänderter Pfade
exakt `CHANGELOG.md` entspricht. Bei der Wiederverwendung des exakten Ziels wird
`exact-target-full-validation-v1` aufgezeichnet; beim Release-SHA nach der Validierung wird
`changelog-only-release-v1` aufgezeichnet. Letzterer verwendet nur die Produktvalidierung wieder. Npm-
Vorabprüfung, Paketbytes, Herkunft der Release Notes und Akzeptanz von Installation/Aktualisierung
müssen weiterhin anhand des Release-SHA ausgeführt werden. Jede Änderung am Ziel, die Version, Quelle, generierte
Dateien, Abhängigkeiten, Pakete oder Workflow-eigene Inhalte betrifft, erfordert einen neuen Code-SHA
und eine neue vollständige Validierung. Neuere Sammelläufe für dieselbe Ref `release/*` und
Gruppe erneuter Läufe ersetzen laufende Läufe automatisch. Übergeben Sie
`reuse_evidence=false`, um einen neuen vollständigen Lauf zu erzwingen.

Übergeben Sie für eine begrenzte Wiederherstellung `rerun_group` an den Sammellauf. `all` ist der tatsächliche Release-Kandidatenlauf, `ci` führt nur den normalen untergeordneten CI-Workflow aus, `plugin-prerelease` führt nur den ausschließlich für Releases bestimmten untergeordneten Plugin-Workflow aus, `release-checks` führt jede Release-Box aus, und die enger gefassten Release-Gruppen sind `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` und `npm-telegram`. Gezielte erneute Läufe von `npm-telegram` erfordern `release_package_spec` oder `npm_telegram_package_spec`; vollständige/alle Läufe verwenden das kanonische Paket-Telegram-E2E innerhalb von Package Acceptance. Gezielte betriebssystemübergreifende erneute Läufe können `cross_os_suite_filter=windows/packaged-upgrade` oder einen anderen Betriebssystem-/Suite-Filter hinzufügen. Fehler bei QA-Release-Prüfungen blockieren die normale Release-Validierung, einschließlich Abweichungen dynamischer OpenClaw-Tools in der Lane für das Kern-Runtime-Paar. Tideclaw-Alpha-Läufe können Release-Prüfungs-Lanes, die nicht der Paketsicherheit dienen, weiterhin als informativ behandeln. Mit `release_profile=beta` sind die Live-Provider-Suites `Run repo/live E2E validation` informativ (Warnungen, keine Blocker); stabile und vollständige Profile behandeln sie weiterhin als blockierend. Wenn `live_suite_filter` ausdrücklich eine zugangsbeschränkte QA-Live-Lane wie Discord, WhatsApp oder Slack anfordert, muss die entsprechende Repo-Variable `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` aktiviert sein; andernfalls schlägt die Eingabeerfassung fehl, anstatt die Lane stillschweigend zu überspringen.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete Workflow `CI`. Die manuelle CI umgeht bewusst die Eingrenzung auf Änderungen und erzwingt den normalen Testgraphen für den Release-Kandidaten: Linux-Node-Shards, Shards gebündelter Plugins, Plugin- und Channel-Vertrags-Shards, Kompatibilität mit Node 22, `check-*`, `check-additional-*`, Smoke-Prüfungen erstellter Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Android ist enthalten, wenn `Full Release Validation` die Box ausführt, da der Sammellauf `include_android=true` übergibt; die eigenständige manuelle CI erfordert `include_android=true` für die Android-Abdeckung.

Verwenden Sie diese Box, um die Frage „Hat der Quellbaum die vollständige normale Testsuite bestanden?“ zu beantworten. Sie ist nicht mit der Produktvalidierung des Release-Pfads identisch. Aufzubewahrende Nachweise:

- `Full Release Validation`-Zusammenfassung mit der URL des ausgelösten Laufs `CI`
- erfolgreicher Lauf `CI` auf dem exakten Ziel-SHA
- Namen fehlgeschlagener oder langsamer Shards aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Zeitmessungsartefakte wie `.artifacts/vitest-shard-timings.json`, wenn ein Lauf eine Leistungsanalyse erfordert

Führen Sie die manuelle CI nur dann direkt aus, wenn das Release eine deterministische normale CI, jedoch nicht die Docker-, QA-Lab-, Live-, betriebssystemübergreifenden oder Paket-Boxen benötigt. Verwenden Sie den ersten Befehl für direkte CI ohne Android. Fügen Sie `include_android=true` hinzu, wenn die direkte Release-Kandidaten-CI Android abdecken muss:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Die Docker-Box befindet sich in `OpenClaw Release Checks` bis `openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-Workflow `install-smoke`. Sie validiert den Release-Kandidaten über paketierte Docker-Umgebungen statt ausschließlich über Tests auf Quellcodeebene.

Die Release-Docker-Abdeckung umfasst:

- vollständigen Installations-Smoke-Test mit aktiviertem langsamen globalen Bun-Installations-Smoke-Test
- Vorbereitung/Wiederverwendung des Smoke-Test-Images aus dem Stamm-Dockerfile nach Ziel-SHA, wobei QR-, Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate Installations-Smoke-Shards ausgeführt werden
- Repository-E2E-Lanes
- Docker-Chunks des Release-Pfads: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` bis `plugins-runtime-install-h` und `openwebui`
- OpenWebUI-Abdeckung auf einem dedizierten Runner mit großem Speicherplatz, wenn angefordert
- aufgeteilte Installations-/Deinstallations-Lanes für gebündelte Plugins `bundled-plugin-install-uninstall-0` bis `bundled-plugin-install-uninstall-23`
- Live-/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn die Release-Prüfungen Live-Suites enthalten

Verwenden Sie Docker-Artefakte, bevor Sie einen Lauf erneut ausführen. Der Scheduler des Release-Pfads lädt `.artifacts/docker-tests/` mit Lane-Protokollen, `summary.json`, `failures.json`, Phasenzeitmessungen, dem Scheduler-Plan als JSON und Befehlen für erneute Läufe hoch. Verwenden Sie für eine gezielte Wiederherstellung `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, anstatt alle Release-Chunks erneut auszuführen. Generierte Befehle für erneute Läufe enthalten nach Möglichkeit frühere `package_artifact_run_id`- und vorbereitete Docker-Image-Eingaben, sodass eine fehlgeschlagene Lane dasselbe Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das Release-Gate für agentisches Verhalten und die Channel-Ebene und von den Paketmechanismen von Vitest und Docker getrennt.

Die Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Kandidaten-Lane mithilfe des agentischen Paritätspakets mit der Basislinie `anthropic/claude-opus-4-8` vergleicht
- Release-Profil des Matrix-Live-Adapters unter Verwendung der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane unter Verwendung von Convex-CI-Zugangsdaten-Leases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` oder `pnpm qa:observability:smoke`, wenn die Release-Telemetrie einen expliziten lokalen Nachweis benötigt

Verwenden Sie diese Box, um die Frage „Verhält sich das Release in QA-Szenarien und Live-Channel-Abläufen korrekt?“ zu beantworten. Bewahren Sie bei der Freigabe des Releases die Artefakt-URLs für die Paritäts-, Matrix- und Telegram-Lanes auf. Eine vollständige Matrix-Abdeckung bleibt als manueller geshardeter QA-Lab-Lauf verfügbar und gehört nicht zur standardmäßigen releasekritischen Lane.

### Paket

Die Paket-Box ist das Gate für das installierbare Produkt. Sie basiert auf `Package Acceptance` und dem Resolver `scripts/resolve-openclaw-package-candidate.mjs`. Der Resolver normalisiert einen Kandidaten in das von Docker-E2E verwendete Tarball `package-under-test`, validiert den Paketbestand, zeichnet die Paketversion und SHA-256 auf und hält die Ref des Workflow-Testsystems von der Ref der Paketquelle getrennt.

Unterstützte Kandidatenquellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version
- `source=ref`: einen vertrauenswürdigen Branch, Tag oder vollständigen Commit-SHA `package_ref` mit dem ausgewählten Testsystem `workflow_ref` paketieren
- `source=url`: eine öffentliche HTTPS-Quelle `.tgz` mit erforderlichem `package_sha256` herunterladen; URL-Zugangsdaten, nicht standardmäßige HTTPS-Ports, private/interne/für besondere Zwecke reservierte Hostnamen oder aufgelöste Adressen sowie unsichere Weiterleitungen werden abgelehnt
- `source=trusted-url`: eine HTTPS-Quelle `.tgz` mit erforderlichem `package_sha256` und `trusted_source_id` aus einer benannten Richtlinie in `.github/package-trusted-sources.json` herunterladen; verwenden Sie dies für unternehmenseigene Spiegelserver oder private Paket-Repositorys im Besitz der Maintainer, anstatt `source=url` eine private Netzwerkumgehung auf Eingabeebene hinzuzufügen
- `source=artifact`: ein von einem anderen GitHub-Actions-Lauf hochgeladenes `.tgz` wiederverwenden

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape` und `telegram_mode=mock-openai` aus. Package Acceptance führt Migration, Aktualisierung, das Upgrade eines vom Root-Benutzer verwalteten VPS, den Neustart nach einer Aktualisierung mit konfigurierter Authentifizierung, die Live-Installation eines ClawHub-Skills, die Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-Fixtures, Plugin-Aktualisierung, Härtung gegen Escaping bei Plugin-Befehlsbindungen und Telegram-Paket-QA anhand desselben aufgelösten Tarballs aus. Blockierende Release-Prüfungen verwenden standardmäßig das neueste veröffentlichte Paket als Basislinie; das Beta-Profil mit `run_release_soak=true`, `release_profile=stable` oder `release_profile=full` erweitert die Prüfung auf überlebende Aktualisierungen veröffentlichter Versionen auf `last-stable-4` sowie die angehefteten Basislinien `2026.4.23`, `2026.5.2` und `2026.4.15` mit `reported-issues`-Szenarien. Verwenden Sie Package Acceptance mit `source=npm` für einen bereits veröffentlichten Kandidaten, `source=ref` für ein SHA-basiertes lokales npm-Tarball vor der Veröffentlichung, `source=trusted-url` für einen unternehmenseigenen/privaten Spiegelserver im Besitz der Maintainer oder `source=artifact` für ein vorbereitetes Tarball, das von einem anderen GitHub-Actions-Lauf hochgeladen wurde.

Es ist der GitHub-native Ersatz für den Großteil der Paket-/Aktualisierungsabdeckung, die zuvor Parallels erforderte. Betriebssystemübergreifende Release-Prüfungen bleiben für betriebssystemspezifisches Onboarding, Installer- und Plattformverhalten relevant, die Produktvalidierung von Paketen/Aktualisierungen sollte jedoch Package Acceptance bevorzugen.

Die kanonische Checkliste für die Validierung von Aktualisierungen und Plugins ist [Aktualisierungen und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie bei der Entscheidung, welche lokale, Docker-, Package-Acceptance- oder Release-Prüfungs-Lane die Installation/Aktualisierung eines Plugins, die Doctor-Bereinigung oder eine Migration veröffentlichter Pakete nachweist. Die umfassende Migration veröffentlichter Aktualisierungen von jedem stabilen Paket `2026.4.23+` ist ein separater manueller Workflow `Update Migration` und nicht Bestandteil der vollständigen Release-CI.

Die Nachsichtigkeit der Legacy-Paketakzeptanz ist bewusst zeitlich begrenzt. Pakete bis einschließlich `2026.4.25` dürfen den Kompatibilitätspfad für bereits auf npm veröffentlichte Metadatenlücken verwenden: private QA-Bestandseinträge, die im Tarball fehlen, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, veraltete Speicherorte für Plugin-Installationsdatensätze, fehlende Persistenz von Marketplace-Installationsdatensätzen und die Migration von Konfigurationsmetadaten während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf bei lokalen Stempeldateien für Build-Metadaten warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Paketverträge erfüllen; dieselben Lücken lassen die Release-Validierung fehlschlagen.

Verwenden Sie umfassendere Package-Acceptance-Profile, wenn die Release-Frage ein tatsächlich installierbares Paket betrifft:

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

- `smoke`: schnelle Pfade für Paketinstallation/Kanal/Agent, Gateway-Netzwerk und erneutes Laden der Konfiguration
- `package`: Verträge für Installation/Aktualisierung/Neustart/Plugin-Pakete sowie Live-Nachweis der ClawHub-Skill-Installation; dies ist der Standard für die Release-Prüfung
- `product`: `package` plus MCP-Kanäle, Bereinigung von Cron/Subagenten, OpenAI-Websuche und OpenWebUI
- `full`: Abschnitte des Docker-Release-Pfads mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für gezielte Wiederholungsläufe

Aktivieren Sie für den Telegram-Nachweis eines Paketkandidaten `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` bei der Paketabnahme. Der Workflow übergibt den aufgelösten `package-under-test`-Tarball an den Telegram-Pfad; der eigenständige Telegram-Workflow akzeptiert für Prüfungen nach der Veröffentlichung weiterhin eine veröffentlichte npm-Spezifikation.

## Automatisierung der regulären Release-Veröffentlichung

Für Beta, `latest`, Plugin, GitHub Release und Plattformveröffentlichung ist
`OpenClaw Release Publish` der normale verändernde Einstiegspunkt. Der monatliche
erweitert-stabile Gateway-Pfad `.33+` verwendet diesen Orchestrator nicht. Der
reguläre Workflow orchestriert die Workflows für vertrauenswürdige Herausgeber in der Reihenfolge, die
das Release benötigt:

1. Checken Sie das Release-Tag aus und ermitteln Sie dessen Commit-SHA.
2. Überprüfen Sie, ob das Tag von `main` oder `release/*` aus erreichbar ist (oder bei Alpha-Vorabversionen von einem Tideclaw-Alpha-Branch).
3. Führen Sie `pnpm plugins:sync:check` aus.
4. Starten Sie `Plugin NPM Release` mit `publish_scope=all-publishable` und `ref=<release-sha>`.
5. Starten Sie `Plugin ClawHub Release` mit demselben Umfang und derselben SHA.
6. Starten Sie `OpenClaw NPM Release` mit dem Release-Tag, dem npm-Dist-Tag und dem gespeicherten `preflight_run_id`, nachdem das gespeicherte `full_release_validation_run_id` und der exakte Ausführungsversuch überprüft wurden.
7. Erstellen oder aktualisieren Sie bei stabilen Releases das GitHub-Release als Entwurf, starten Sie `Windows Node Release` mit dem expliziten `windows_node_tag` und dem vom Kandidaten genehmigten `windows_node_installer_digests`, und überprüfen Sie die kanonischen Assets für Windows-Installationsprogramme und Prüfsummen. Starten Sie außerdem `Android Release`, um die signierte APK des exakten Tags samt Prüfsumme und Herkunftsnachweis zu erstellen. Überprüfen Sie vor der Veröffentlichung des Entwurfs beide Verträge für native Assets.

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

Die direkte Hochstufung einer stabilen Version auf `latest` erfolgt ausdrücklich:

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

Verwenden Sie die untergeordneten Workflows `Plugin NPM Release` und `Plugin ClawHub Release` nur für gezielte Reparatur- oder Neuveröffentlichungsarbeiten. `OpenClaw Release Publish` lehnt `plugin_publish_scope=selected` ab, wenn `publish_openclaw_npm=true`, damit das Kernpaket nicht ohne jedes veröffentlichungsfähige offizielle Plugin ausgeliefert werden kann, einschließlich `@openclaw/diffs-language-pack`. Legen Sie für die Reparatur eines ausgewählten Plugins `publish_openclaw_npm=false` mit `plugin_publish_scope=selected` und `plugins=@openclaw/name` fest, oder starten Sie den untergeordneten Workflow direkt.

Das ClawHub-Bootstrapping bei der Erstveröffentlichung ist die Ausnahme: Starten Sie `Plugin ClawHub New`
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

Die Validierung vor dem Tag erfordert `dry_run=true`, lehnt Eingaben für Release-Tags und übergeordnete Ausführungen
ab und akzeptiert nur ein exaktes Ziel, das von `main` oder `release/*` aus erreichbar ist.
Sie lädt keine ClawHub-Anmeldedaten, veröffentlicht keine Paketbytes und ändert nicht die
Konfiguration des vertrauenswürdigen Herausgebers. Der Workflow löst dennoch den Live-Registry-Plan auf,
checkt das Ziel ausschließlich in einem geheimnisfreien Job aus und packt es dort, materialisiert die
gesperrte ClawHub-Toolchain und validiert das unveränderliche Artefakt sowie
Slug/Identität des Pakets, bevor das Release-Tag existiert. Genehmigen Sie die
`clawhub-plugin-bootstrap`-Umgebung erst, nachdem die geheimnisfreien Pack-Jobs
abgeschlossen sind; dieser geschützte Validierungsjob verfügt weder über Anmeldedaten noch über Änderungsbefehle.

Ein genehmigter Probelauf oder ein echtes Bootstrapping nach dem Tagging muss das exakte
Release-Tag sowie die Ausführungs-ID, den Versuch und den
Branch des übergeordneten `OpenClaw Release Publish` enthalten. Der übergeordnete Lauf bestätigt seine eigene Workflow-SHA und eine separate exakte vertrauenswürdige
`main`-SHA für `Plugin ClawHub New`; der untergeordnete Lauf und jede Genehmigung einer geschützten
Umgebung müssen mit dieser genehmigten untergeordneten SHA übereinstimmen. Das Release-Tag wird
vor jedem Veröffentlichungsversuch und jeder Änderung am vertrauenswürdigen Herausgeber erneut geprüft.

Der Pack-Job
lädt ein unveränderliches Artefakt hoch, dessen Name, Actions-Artefakt-ID/-Digest,
erzeugende Ausführung/Versuch, Ziel-SHA und SHA-256/Größe des Tarballs pro Paket
in die Validierungs- und geschützten Jobs übernommen werden. Der geschützte Job checkt nur vertrauenswürdige
`main`-Werkzeuge aus, validiert das Artefakt-Tupel über die GitHub-API, lädt
anhand der exakten Artefakt-ID herunter, berechnet die Hashes aller Tarballs erneut und validiert lokale TAR-Pfade sowie
die Paketidentität mit den USTAR-Kanonisierungsregeln der angehefteten CLI. Jeder
Kandidat durchläuft anschließend den Probelauf für die Veröffentlichung der angehefteten CLI, der vor
Registry-Abfrage oder Authentifizierung zurückkehrt. Der Vorfilter des Anmeldedaten-Jobs begrenzt komprimierte ClawPacks
auf 120 MiB, die gesamte Datei-Nutzlast auf 50 MiB, expandierte TAR-Daten auf 64 MiB und
die Anzahl der TAR-Einträge auf 10,000. Die Reparatur des vertrauenswürdigen Herausgebers für vorhandene Pakete bleibt
rein konfigurierend, packt jedoch weiterhin das Ziel und erfordert die Übereinstimmung des angeforderten Tags
sowie der exakten Registry-Bytes und Metadaten, bevor die Konfiguration des vertrauenswürdigen Herausgebers
geändert wird. Die Überprüfung nach der Veröffentlichung lädt das ClawHub-Artefakt herunter und
erfordert dieselbe SHA-256 und Größe. Eine Wiederherstellung durch erneutes Ausführen fehlgeschlagener Jobs darf das Paketartefakt eines früheren
Versuchs nur wiederverwenden, wenn der exakte erzeugende Job
erfolgreich abgeschlossen wurde. Der abschließende Nachweis bindet außerdem die gesperrte ClawHub-Version, die
Lock-SHA-256 und die npm-Integrität. Eine Abweichung erfordert eine neue Paketversion.

## Eingaben des NPM-Workflows

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` oder `v2026.4.2-alpha.1`; wenn `preflight_only=true`, kann es für einen reinen Validierungs-Preflight auch die aktuelle vollständige 40-stellige Commit-SHA des Workflow-Branches sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den tatsächlichen Veröffentlichungspfad
- `preflight_run_id`: ID einer vorhandenen erfolgreichen Preflight-Ausführung, erforderlich auf dem tatsächlichen Veröffentlichungspfad, damit der Workflow den vorbereiteten Tarball wiederverwendet, statt ihn neu zu erstellen
- `full_release_validation_run_id`: ID einer erfolgreichen `Full Release Validation`-Ausführung für dieses Tag/diese SHA, erforderlich für die tatsächliche Veröffentlichung. Beta-Veröffentlichungen dürfen allein mit dem Preflight und einer Warnung fortfahren, aber die Hochstufung zu stabil/`latest` erfordert sie weiterhin.
- `full_release_validation_run_attempt`: exakter positiver Ausführungsversuch, gekoppelt mit `full_release_validation_run_id`; erforderlich, sobald die Ausführungs-ID angegeben wird, damit Wiederholungsläufe den Autorisierungsnachweis während der Veröffentlichung nicht ändern können.
- `release_publish_run_id`: ID der genehmigten `OpenClaw Release Publish`-Ausführung; erforderlich, wenn dieser Workflow vom übergeordneten Workflow gestartet wird (Aufrufe zur tatsächlichen Veröffentlichung durch einen Bot-Akteur)
- `plugin_npm_run_id`: ID einer erfolgreichen `Plugin NPM Release`-Ausführung mit exaktem Head; erforderlich für eine tatsächliche `extended-stable`-Kernveröffentlichung
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; akzeptiert `alpha`, `beta`, `latest` oder `extended-stable` und verwendet standardmäßig `beta`. Der finale Patch `33` und spätere müssen `extended-stable` verwenden; standardmäßig lehnt `extended-stable` frühere Patches ab und nicht finale Tags werden immer abgelehnt.
- `bypass_extended_stable_guard`: nur zum Testen bestimmter boolescher Wert, standardmäßig `false`; umgeht mit `npm_dist_tag=extended-stable` die monatliche Berechtigung für die erweitert-stabile Version, während Prüfungen von Release-Identität, Artefakt, Genehmigung und Rücklesen erhalten bleiben.

`Plugin NPM Release` akzeptiert `npm_dist_tag=default` für das Verhalten vorhandener Releases
oder `npm_dist_tag=extended-stable` für den abgesicherten monatlichen Pfad. Die
erweitert-stabile Option erfordert `publish_scope=all-publishable`, eine leere
`plugins`-Eingabe, einen finalen Patch ab `33` und den kanonischen
`extended-stable/YYYY.M.33`-Branch an dessen exakter Spitze. Sie verschiebt niemals Plugin-
`latest` oder `beta`. Neue Paketversionen erhalten `extended-stable` atomar
durch vertrauenswürdige OIDC-Veröffentlichung (`npm publish --tag extended-stable`); dieser
Quell-Workflow verwendet kein tokenauthentifiziertes `npm dist-tag add`. Wiederholungsversuche
überspringen exakte Versionen, die bereits in npm vorhanden sind, und schlagen anschließend sicher fehl, sofern das vollständige
Rücklesen nicht bestätigt, dass jedes exakte Paket und `extended-stable`-Tag konvergiert ist.

`OpenClaw Release Publish` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag; muss bereits vorhanden sein
- `preflight_run_id`: ID einer erfolgreichen `OpenClaw NPM Release`-Preflight-Ausführung; erforderlich, wenn `publish_openclaw_npm=true` oder `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: ID einer erfolgreichen `Full Release Validation`-Ausführung; erforderlich, wenn `publish_openclaw_npm=true` oder `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: exakter positiver Versuch, gekoppelt mit `full_release_validation_run_id`; erforderlich, sobald die Ausführungs-ID angegeben wird
- `windows_node_tag`: exaktes Release-Tag von `openclaw/openclaw-windows-node`, das keine Vorabversion bezeichnet; erforderlich für die stabile OpenClaw-Veröffentlichung
- `windows_node_installer_digests`: vom Kandidaten genehmigte kompakte JSON-Zuordnung der aktuellen Namen der Windows-Installationsprogramme zu ihren angehefteten `sha256:`-Digests; erforderlich für die stabile OpenClaw-Veröffentlichung
- `npm_telegram_run_id`: optionale ID einer erfolgreichen `NPM Telegram Beta E2E`-Ausführung zur Aufnahme in den abschließenden Release-Nachweis
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket, entweder `alpha`, `beta` oder `latest`
- `plugin_publish_scope`: standardmäßig `all-publishable`; verwenden Sie `selected` nur für gezielte reine Plugin-Reparaturarbeiten mit `publish_openclaw_npm=false`
- `plugins`: durch Kommas getrennte `@openclaw/*`-Paketnamen, wenn `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standardmäßig `true`; setzen Sie `false` nur, wenn Sie den Workflow als Orchestrator für reine Plugin-Reparaturen verwenden
- `release_profile`: Release-Abdeckungsprofil für Zusammenfassungen des Release-Nachweises; standardmäßig `from-validation`, wodurch es aus dem Validierungsmanifest gelesen wird, oder überschreiben Sie es mit `beta`, `stable` oder `full`
- `wait_for_clawhub`: standardmäßig `false`, damit die npm-Verfügbarkeit nicht durch den ClawHub-Sidecar blockiert wird; setzen Sie `true` nur, wenn der Abschluss des Workflows den Abschluss von ClawHub einschließen muss

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständiger Commit-SHA, der validiert werden soll. Prüfungen, die Secrets verwenden, setzen voraus, dass der aufgelöste Commit über einen OpenClaw-Branch oder Release-Tag erreichbar ist.
- `run_release_soak`: aktiviert für Beta-Release-Prüfungen umfassende Live-/E2E-Prüfungen, den Docker-Release-Pfad und einen Dauertest zur Upgrade-Beständigkeit für alle vorherigen Versionen. Wird durch `release_profile=stable` und `release_profile=full` erzwungen.

Regeln:

- Reguläre finale Versionen und Korrekturversionen unterhalb von Patch `33` dürfen entweder unter `beta` oder `latest` veröffentlicht werden. Finale Versionen ab Patch `33` müssen unter `extended-stable` veröffentlicht werden; Versionen mit Korrektursuffix werden an dieser Grenze abgelehnt.
- Beta-Prerelease-Tags dürfen nur unter `beta` veröffentlicht werden; Alpha-Prerelease-Tags dürfen nur unter `alpha` veröffentlicht werden
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur zulässig, wenn `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` dienen immer ausschließlich der Validierung
- Der tatsächliche Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden wie der Preflight; der Workflow überprüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Regulärer Ablauf für Beta-/neueste stabile Releases

Dieser ältere Ablauf gilt für das reguläre orchestrierte Release, das auch Plugins, das GitHub Release, Windows und weitere Plattformarbeiten umfasst. Es handelt sich nicht um den monatlichen erweiterten Stable-Pfad des `.33+`-Gateways, der am Anfang dieser Seite dokumentiert ist.

Beim Erstellen eines regulären orchestrierten Stable-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus. Bevor ein Tag vorhanden ist, können Sie den vollständigen aktuellen Commit-SHA des Workflow-Branches für einen ausschließlich der Validierung dienenden Probelauf des Preflight-Workflows verwenden.
2. Wählen Sie `npm_dist_tag=beta` für den normalen Ablauf, der mit einer Beta beginnt, oder `latest` nur dann, wenn Sie bewusst direkt eine stabile Version veröffentlichen möchten.
3. Führen Sie `Full Release Validation` auf dem Release-Branch, dem Release-Tag oder dem vollständigen Commit-SHA aus, wenn Sie normale CI sowie Abdeckung für Live-Prompt-Cache, Docker, QA Lab, Matrix und Telegram über einen einzigen manuellen Workflow wünschen. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den manuellen Workflow `CI` auf der Release-Referenz aus.
4. Wählen Sie genau den `openclaw/openclaw-windows-node`-Release-Tag ohne Prerelease-Kennzeichnung aus, dessen signierte x64- und ARM64-Installationsprogramme ausgeliefert werden sollen. Speichern Sie ihn als `windows_node_tag` und die validierte Digest-Zuordnung der Installationsprogramme als `windows_node_installer_digests`. Das Release-Candidate-Hilfsprogramm zeichnet beides auf und fügt es seinem generierten Veröffentlichungsbefehl hinzu.
5. Speichern Sie die erfolgreichen `preflight_run_id`, `full_release_validation_run_id` und den exakten `full_release_validation_run_attempt`.
6. Führen Sie `OpenClaw Release Publish` vom vertrauenswürdigen `main` aus und verwenden Sie dabei denselben `tag`, denselben `npm_dist_tag`, den ausgewählten `windows_node_tag`, dessen gespeicherten `windows_node_installer_digests`, den gespeicherten `preflight_run_id`, `full_release_validation_run_id` und `full_release_validation_run_attempt`. Dadurch werden externalisierte Plugins auf npm und ClawHub veröffentlicht, bevor das OpenClaw-npm-Paket hochgestuft wird.
7. Wenn das Release unter `beta` veröffentlicht wurde, verwenden Sie den Workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, um diese stabile Version von `beta` nach `latest` hochzustufen.
8. Wenn das Release bewusst direkt unter `latest` veröffentlicht wurde und `beta` sofort demselben stabilen Build folgen soll, verwenden Sie denselben Release-Workflow, um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie `beta` später durch dessen geplante selbstheilende Synchronisierung verschieben.

Die Änderung der Dist-Tags erfolgt im Release-Ledger-Repository, da sie weiterhin `NPM_TOKEN` erfordert, während das Quell-Repository ausschließlich per OIDC veröffentlicht. Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der mit einer Beta beginnende Hochstufungspfad dokumentiert und für Bedienpersonal sichtbar.

Falls ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen Sie sämtliche Befehle der 1Password CLI (`op`) ausschließlich in einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht direkt aus der primären Agent-Shell auf. Die Ausführung in tmux macht Eingabeaufforderungen, Warnungen und die OTP-Verarbeitung beobachtbar und verhindert wiederholte Warnungen des Hosts.

## Öffentliche Referenzen

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`.github/workflows/docker-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/docker-release.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer verwenden die privaten Release-Dokumente unter [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) als tatsächliches Runbook.

## Verwandte Themen

- [Release-Kanäle](/de/install/development-channels)
