---
read_when:
    - Suche nach Definitionen öffentlicher Release-Kanäle
    - Release-Validierung oder Paketabnahme ausführen
    - Suche nach Versionsbenennung und Release-Takt
summary: Release-Lanes, Operator-Checkliste, Validierungsboxen, Versionsbenennung und Kadenz
title: Veröffentlichungsrichtlinie
x-i18n:
    generated_at: "2026-07-04T17:59:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw stellt derzeit drei benutzerseitige Update-Kanäle bereit:

- stable: der bestehende beworbene Release-Kanal, der bis zum separaten CLI-/Kanal-Meilenstein weiterhin über
  npm `latest` aufgelöst wird
- beta: Prerelease-Tags, die nach npm `beta` veröffentlicht werden
- dev: der bewegliche Kopf von `main`

Separat können Release-Operatoren das Core-Package des abgeschlossenen Vormonats
auf npm `extended-stable` veröffentlichen, beginnend mit Patch `33`. Die reguläre
Final-Linie des aktuellen Monats bleibt auf npm `latest`; diese operatorseitige Aufteilung der Veröffentlichung
ändert für sich genommen nicht die CLI-Update-Kanal-Auflösung.

## Versionsbenennung

- Monatliche npm-extended-stable-Release-Version: `YYYY.M.PATCH`, mit `PATCH >= 33`
  - Git-Tag: `vYYYY.M.PATCH`
- Tägliche/reguläre Final-Release-Version: `YYYY.M.PATCH`, mit `PATCH < 33`
  - Git-Tag: `vYYYY.M.PATCH`
- Reguläre Fallback-Korrektur-Release-Version: `YYYY.M.PATCH-N`
  - Git-Tag: `vYYYY.M.PATCH-N`
- Beta-Prerelease-Version: `YYYY.M.PATCH-beta.N`
  - Git-Tag: `vYYYY.M.PATCH-beta.N`
- Monat oder Patch nicht mit führenden Nullen auffüllen
- Ab der Aktualisierung des Release-Prozesses im Juni 2026 ist die dritte Komponente eine
  sequenzielle monatliche Release-Train-Nummer, kein Kalendertag. Stable- und Beta-
  Releases bestimmen den aktuellen Train; rein alpha-Tags verbrauchen oder
  erhöhen die Beta-/Stable-Patchnummer nicht. Tags und npm-Versionen vor der
  Aktualisierung behalten ihre bestehenden Namen und bleiben gültig; die Release-Automatisierung vergleicht sie weiterhin
  nach Jahr, Monat, Patch, Kanal und Prerelease- oder Korrektur-
  Nummer.
- Alpha-/Nightly-Builds verwenden den nächsten unveröffentlichten Patch-Train und erhöhen nur
  `alpha.N` bei wiederholten Builds. Sobald dieser Patch eine Beta hat, wechseln
  neue Alpha-Builds zum folgenden Patch. Ignorieren Sie ältere rein alpha-Tags mit höheren Patch-
  Nummern, wenn Sie einen Beta- oder Stable-Train auswählen.
- npm-Versionen sind unveränderlich. Wenn ein Beta-Tag bereits veröffentlicht wurde, löschen,
  veröffentlichen oder verwenden Sie ihn nicht erneut; erstellen Sie stattdessen die nächste Beta-Nummer oder den nächsten monatlichen
  Patch. Da `2026.6.5-beta.1` bereits während der
  Umstellung veröffentlicht wurde, müssen Release-Trains für Juni 2026 Patch `5` oder höher verwenden. Veröffentlichen Sie
  keine neuen Stable- oder Beta-Trains für Juni 2026 als `2026.6.2`, `2026.6.3` oder
  `2026.6.4`.
- Nach dem regulären Final `2026.6.5` ist der nächste neue Beta-Train
  `2026.6.6-beta.1`, selbst
  wenn bereits automatisierte rein alpha-Tags mit höheren Patchnummern existieren.
- `latest` folgt weiterhin der aktuellen regulären/täglichen npm-Linie
- `beta` bezeichnet das aktuelle Beta-Installationsziel
- `extended-stable` bezeichnet das unterstützte npm-Package des Vormonats, beginnend mit Patch
  `33`; Patch `34` und später sind Wartungs-Releases auf dieser monatlichen Linie
- Der dedizierte monatliche extended-stable-Pfad veröffentlicht nur das Core-npm-Package. Er
  veröffentlicht keine Plugins, macOS- oder Windows-Artefakte, kein GitHub Release,
  keine Dist-Tags für private Repositories, Docker-Images, Mobile-Artefakte oder Website-
  Downloads.

## Release-Takt

- Releases erfolgen zuerst als Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer erstellen Releases normalerweise von einem `release/YYYY.M.PATCH`-Branch, der
  aus dem aktuellen `main` erstellt wurde, damit Release-Validierung und Korrekturen neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und eine Korrektur benötigt, erstellen Maintainer
  den nächsten `-beta.N`-Tag, anstatt den alten Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Monatliche npm-only-extended-stable-Veröffentlichung

Dies ist eine dedizierte Ausnahme vom regulären Release-Verfahren unten. Für einen
abgeschlossenen Monat `YYYY.M` erstellen Sie `extended-stable/YYYY.M.33`; veröffentlichen Sie `vYYYY.M.33` und
spätere Wartungs-Patches von demselben Branch. Release-Tag, Branch-Spitze,
Checkout, Package-Version, npm-Preflight und Full Release Validation müssen
alle denselben Commit identifizieren. Das geschützte `main` muss bereits die Final-Version eines strikt
späteren Kalendermonats unter Patch `33` enthalten; Wartungs-Patches bleiben
zulässig, nachdem `main` um mehr als einen Monat weitergelaufen ist.

Führen Sie den npm-Preflight und Full Release Validation vom exakten extended-stable-Branch aus
und speichern Sie anschließend beide Run-IDs:

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

`release_profile=stable` ist das bestehende Profil für die Validierungstiefe; es ist
vom npm-Dist-Tag `extended-stable` getrennt und bleibt absichtlich unverändert.

Nachdem beide Runs erfolgreich waren und die npm-Release-Umgebung bereit ist, bewerben Sie den
exakten Preflight-Tarball. Patch `P` muss `33` oder größer sein:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Für einen Fork oder eine Nicht-Produktionsprobe, die die
monatliche `.33`- oder geschützte-`main`-Monatsrichtlinie absichtlich nicht erfüllen kann, fügen Sie
`-f bypass_extended_stable_guard=true` zu npm-Preflight- und Publish-Dispatches hinzu. Der
Standardwert ist `false`. Der Bypass wird nur mit `npm_dist_tag=extended-stable` akzeptiert und
in der Workflow-Zusammenfassung aufgezeichnet. Er umgeht nicht die kanonische
`extended-stable/YYYY.M.33`-Workflow-Ref, die Gleichheit von Branch-Spitze/Tag/Checkout, die Final-Tag-
Syntax, die Gleichheit von Package-/Tag-Version, referenzierte Run- und Manifest-Identität,
Tarball-Herkunft, Umgebungsfreigabe, Registry-Readback oder Selector-
Repair-Nachweise.

Der Publish-Workflow verifiziert die referenzierten Run-Identitäten, den vorbereiteten
Tarball-Digest und beide npm-Registry-Selectors. Bestätigen Sie das
Ergebnis unabhängig, nachdem der Workflow erfolgreich war:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Beide Befehle müssen `YYYY.M.P` zurückgeben. Wenn die Veröffentlichung erfolgreich ist, aber der Selector-
Readback fehlschlägt, veröffentlichen Sie die unveränderliche Package-Version nicht erneut. Verwenden Sie den einzelnen
`npm dist-tag add openclaw@YYYY.M.P extended-stable`-Repair-Befehl, der in der
Always-run-Zusammenfassung des fehlgeschlagenen Workflows ausgegeben wird, und wiederholen Sie anschließend beide unabhängigen
Readbacks. Ein Rollback auf den vorherigen Selector ist eine separate Operator-Entscheidung, nicht
der Readback-Repair-Pfad.

Die reguläre Checkliste unten bleibt für Beta, `latest`, GitHub Release,
Plugins, macOS, Windows und andere Plattformveröffentlichungen zuständig. Führen Sie diese Schritte
für diesen npm-only-extended-stable-Pfad nicht aus.

## Reguläre Release-Operator-Checkliste

Diese Checkliste ist die öffentliche Form des Release-Ablaufs. Private Zugangsdaten,
Signierung, Notarisierung, Dist-Tag-Wiederherstellung und Notfall-Rollback-Details verbleiben im
nur für Maintainer bestimmten Release-Runbook.

1. Starten Sie von aktuellem `main`: Ziehen Sie den neuesten Stand, bestätigen Sie, dass der Ziel-Commit gepusht ist,
   und bestätigen Sie, dass die aktuelle CI von `main` ausreichend erfolgreich ist, um davon zu branchen.
2. Generieren Sie den obersten Abschnitt in `CHANGELOG.md` aus gemergten PRs und allen direkten
   Commits seit dem letzten erreichbaren Release-Tag. Halten Sie Einträge benutzerorientiert,
   deduplizieren Sie überlappende PR-/Direkt-Commit-Einträge, committen Sie die Neufassung, pushen Sie sie,
   und führen Sie vor dem Branching noch einmal Rebase/Pull aus.
3. Prüfen Sie Release-Kompatibilitätsdatensätze in
   `src/plugins/compat/registry.ts` und
   `src/commands/doctor/shared/deprecation-compat.ts`. Entfernen Sie abgelaufene
   Kompatibilität nur, wenn der Upgrade-Pfad weiterhin abgedeckt bleibt, oder dokumentieren Sie, warum sie
   absichtlich weitergeführt wird.
4. Erstellen Sie `release/YYYY.M.PATCH` aus aktuellem `main`; führen Sie normale Release-Arbeit nicht
   direkt auf `main` aus.
5. Erhöhen Sie jede erforderliche Versionsstelle für das vorgesehene Tag, und führen Sie dann
   `pnpm release:prep` aus. Es aktualisiert Plugin-Versionen, Plugin-Inventar, Konfigurationsschema,
   Metadaten der gebündelten Channel-Konfiguration, Baseline der Konfigurationsdokumentation, Plugin-SDK-
   Exporte und Plugin-SDK-API-Baseline in der richtigen Reihenfolge. Committen Sie jeden generierten
   Drift vor dem Tagging. Führen Sie dann den lokalen deterministischen Preflight aus:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` und `pnpm release:check`.
6. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus. Bevor ein Tag existiert,
   ist ein vollständiger 40-Zeichen-SHA des Release-Branch für einen reinen Validierungs-
   Preflight zulässig. Der Preflight generiert Dependency-Release-Evidence für den
   exakt ausgecheckten Dependency-Graph und speichert sie im npm-Preflight-
   Artefakt. Speichern Sie die erfolgreiche `preflight_run_id`.
7. Starten Sie alle Pre-Release-Tests mit `Full Release Validation` für den
   Release-Branch, das Tag oder den vollständigen Commit-SHA. Dies ist der eine manuelle Einstiegspunkt
   für die vier großen Release-Testboxen: Vitest, Docker, QA Lab und Package.
8. Wenn die Validierung fehlschlägt, beheben Sie das Problem auf dem Release-Branch und führen Sie die kleinste fehlgeschlagene
   Datei, Lane, Workflow-Job, Paketprofil, Provider- oder Modell-Allowlist erneut aus, die
   den Fix belegt. Führen Sie den vollständigen Umbrella nur erneut aus, wenn die geänderte Oberfläche
   frühere Evidence veralten lässt.
9. Für einen getaggten Beta-Kandidaten führen Sie
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` aus dem passenden
   `release/YYYY.M.PATCH`-Branch aus. Für Stable übergeben Sie zusätzlich das erforderliche Windows-Quell-
   Release:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Der Helper führt die lokalen generierten Release-Prüfungen aus, dispatcht oder verifiziert
   die vollständige Release-Validierung und npm-Preflight-Evidence, führt Parallels-
   Frisch-/Update-Proof gegen den exakt vorbereiteten Tarball plus Telegram-Paket-
   Proof aus, zeichnet Plugin-npm- und ClawHub-Pläne auf und gibt den exakten
   `OpenClaw Release Publish`-Befehl erst aus, nachdem das Evidence-Bundle grün ist.
   `OpenClaw Release Publish` dispatcht die ausgewählten oder alle veröffentlichbaren Plugin-
   Pakete parallel an npm und denselben Satz an ClawHub und promotet anschließend das
   vorbereitete OpenClaw-npm-Preflight-Artefakt mit dem passenden dist-tag, sobald
   die Plugin-npm-Veröffentlichung erfolgreich ist.
   Nachdem der OpenClaw-npm-Publish-Child erfolgreich ist, erstellt oder aktualisiert er die
   passende GitHub-Release-/Prerelease-Seite aus dem vollständigen passenden
   `CHANGELOG.md`-Abschnitt. Stabile Releases, die auf npm `latest` veröffentlicht werden, werden zum
   neuesten GitHub-Release; stabile Maintenance-Releases, die auf npm `beta` bleiben, werden
   mit GitHub `latest=false` erstellt. Der Workflow lädt außerdem die Preflight-
   Dependency-Evidence, das vollständige Validierungsmanifest und Postpublish-Registry-
   Verifizierungs-Evidence in das GitHub-Release hoch, damit nach dem Release auf Incidents
   reagiert werden kann. Der Publish-Workflow gibt Child-Run-IDs sofort aus, genehmigt
   Release-Environment-Gates automatisch, die das Workflow-Token genehmigen darf, fasst
   fehlgeschlagene Child-Jobs mit Log-Enden zusammen, schließt das GitHub-Release und die Dependency-
   Evidence ab, sobald die OpenClaw-npm-Veröffentlichung erfolgreich ist, wartet auf ClawHub, wann immer
   OpenClaw-npm veröffentlicht wird, führt dann `pnpm release:verify-beta` aus und
   lädt Postpublish-Evidence für das GitHub-Release, npm-Paket, ausgewählte
   Plugin-npm-Pakete, ausgewählte ClawHub-Pakete, Child-Workflow-Run-IDs und
   optionale NPM-Telegram-Run-ID hoch. Der ClawHub-Pfad versucht transiente CLI-
   Dependency-Installationsfehler erneut, veröffentlicht Plugins mit erfolgreicher Preview auch dann, wenn eine
   Preview-Zelle flakt, und endet mit Registry-Verifizierung für jede erwartete
   Plugin-Version, sodass Teilveröffentlichungen sichtbar und wiederholbar bleiben. Führen Sie dann die Post-Publish-
   Paketabnahme gegen das veröffentlichte
   `openclaw@YYYY.M.PATCH-beta.N`- oder
   `openclaw@beta`-Paket aus. Wenn ein gepushtes oder veröffentlichtes Prerelease einen Fix benötigt,
   schneiden Sie die nächste passende Prerelease-Nummer; löschen oder überschreiben Sie das alte
   Prerelease nicht.
10. Für Stable fahren Sie erst fort, nachdem die geprüfte Beta oder der Release Candidate die
    erforderliche Validierungs-Evidence hat. Stable-npm-Veröffentlichung läuft ebenfalls über
    `OpenClaw Release Publish` und verwendet das erfolgreiche Preflight-Artefakt über
    `preflight_run_id` wieder; Stable-macOS-Release-Bereitschaft erfordert außerdem die
    paketierten `.zip`, `.dmg`, `.dSYM.zip` und eine aktualisierte `appcast.xml` auf `main`.
    Der macOS-Publish-Workflow veröffentlicht den signierten Appcast nach der Verifizierung der Release-Assets
    automatisch auf öffentlichem `main`; wenn Branch Protection den
    direkten Push blockiert, öffnet oder aktualisiert er einen Appcast-PR. Stable-Windows-Hub-
    Bereitschaft erfordert die signierten Assets `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` und
    `OpenClawCompanion-SHA256SUMS.txt` im OpenClaw-GitHub-Release.
    Übergeben Sie das exakte signierte `openclaw/openclaw-windows-node`-Release-Tag als
    `windows_node_tag` und dessen vom Kandidaten genehmigte Installer-Digest-Map als
    `windows_node_installer_digests`; `OpenClaw Release Publish` behält den
    Release-Entwurf bei, dispatcht `Windows Node Release` und verifiziert alle drei
    Assets vor der Veröffentlichung.
11. Führen Sie nach der Veröffentlichung den npm-Post-Publish-Verifier aus, optional ein eigenständiges
    Published-npm-Telegram-E2E, wenn Sie Post-Publish-Channel-Proof benötigen,
    dist-tag-Promotion bei Bedarf, verifizieren Sie die generierte GitHub-Release-Seite,
    führen Sie die Schritte für die Release-Ankündigung aus, und schließen Sie dann [Abschluss für stabiles main](#stable-main-closeout) ab, bevor Sie ein stabiles Release als fertig bezeichnen.

## Abschluss für stabiles main

Die stabile Veröffentlichung ist erst abgeschlossen, wenn `main` den tatsächlich ausgelieferten
Release-Zustand trägt.

1. Starten Sie vom frischen neuesten `main`. Auditieren Sie `release/YYYY.M.PATCH` dagegen und
   portieren Sie echte Fixes vorwärts, die auf `main` fehlen. Mergen Sie Release-only-
   Kompatibilitäts-, Test- oder Validierungsadapter nicht blind in ein neueres `main`.
2. Setzen Sie `main` auf die ausgelieferte stabile Version, nicht auf einen spekulativen nächsten Train. Führen Sie
   `pnpm release:prep` nach der Änderung der Root-Version aus, dann
   `pnpm deps:shrinkwrap:generate`.
3. Sorgen Sie dafür, dass der Abschnitt `## YYYY.M.PATCH` in `CHANGELOG.md` auf `main` exakt dem
   getaggten Release-Branch entspricht. Nehmen Sie das stabile `appcast.xml`-Update auf, wenn das mac-
   Release eines veröffentlicht hat.
4. Fügen Sie `YYYY.M.PATCH+1`, eine Beta-Version oder einen leeren zukünftigen Changelog-
   Abschnitt nicht zu `main` hinzu, bis der Operator diesen Release-Train ausdrücklich startet.
5. Führen Sie `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` und
   `OPENCLAW_TESTBOX=1 pnpm check:changed` aus. Pushen Sie, und verifizieren Sie dann, dass `origin/main`
   die ausgelieferte Version und den Changelog enthält, bevor Sie das stabile Release
   als erledigt bezeichnen.
6. Halten Sie die Repository-Variablen `RELEASE_ROLLBACK_DRILL_ID` und
   `RELEASE_ROLLBACK_DRILL_DATE` nach jedem privaten Rollback-Drill aktuell.
   `OpenClaw Stable Main Closeout` startet von dem `main`-Push, der die
   ausgelieferte Version, den Changelog und den Appcast nach der stabilen Veröffentlichung trägt. Es liest
   unveränderliche Postpublish-Evidence, um das ausgelieferte Tag an seine vollständige Release-
   Validierung und Publish-Runs zu binden, und verifiziert dann den stabilen main-Zustand, das Release,
   den obligatorischen Stable-Soak und blockierende Performance-Evidence. Es hängt ein
   unveränderliches Closeout-Manifest und eine Prüfsumme an das GitHub-Release an. Der automatische
   Push-Trigger überspringt Legacy-Releases, die unveränderlicher Postpublish-
   Evidence vorausgehen; er behandelt diesen Skip niemals als abgeschlossenen Closeout. Ein vollständiger
   Closeout erfordert beide Assets und eine passende Prüfsumme. Ein partielles Manifest
   spielt seinen aufgezeichneten `main`-SHA und Rollback-Drill erneut ab, um identische
   Bytes zu regenerieren, und hängt dann die fehlende Prüfsumme an; ein ungültiges Paar oder eine Prüfsumme
   ohne Manifest bleibt blockierend. Ein durch Push ausgelöster Run ohne Rollback-
   Drill-Repository-Variablen überspringt ohne abgeschlossenen Closeout; ein fehlender oder
   mehr als 90 Tage alter Drill-Datensatz blockiert weiterhin manuellen Evidence-gestützten
   Closeout. Private Recovery-Befehle bleiben im Maintainer-only-Runbook.
   Verwenden Sie manuelles Dispatching nur, um einen Evidence-gestützten stabilen Closeout zu reparieren oder erneut abzuspielen.
   Ein Legacy-Fallback-Korrektur-Tag darf Base-Package-Evidence nur wiederverwenden, wenn
   das Korrektur-Tag auf denselben Source-Commit wie das stabile Basis-Tag auflöst.
   Eine Korrektur mit anderem Source muss eigene Package-
   Evidence veröffentlichen und verifizieren.

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  außerhalb des schnelleren lokalen Gates `pnpm check` abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren Prüfungen auf Importzyklen
  und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  Release-Artefakte unter `dist/*` und das Control-UI-Bundle für den Schritt zur Paketvalidierung
  vorhanden sind
- Führen Sie `pnpm release:prep` nach der Versionsanhebung im Root und vor dem Tagging aus. Es
  führt jeden deterministischen Release-Generator aus, der nach einer
  Versions-/Konfigurations-/API-Änderung häufig abweicht: Plugin-Versionen, Plugin-Inventar, Basiskonfigurationsschema,
  gebündelte Kanal-Konfigurationsmetadaten, Baseline der Konfigurationsdokumentation, Plugin-SDK-
  Exporte und Plugin-SDK-API-Baseline. `pnpm release:check` führt diese
  Wächter erneut im Prüfmodus aus und meldet jede gefundene generierte Abweichung in einem
  Durchlauf, bevor Paket-Release-Prüfungen ausgeführt werden.
- Die Plugin-Versionssynchronisierung aktualisiert offizielle Plugin-Paketversionen und vorhandene
  `openclaw.compat.pluginApi`-Untergrenzen standardmäßig auf die OpenClaw-Release-Version.
  Behandeln Sie dieses Feld als Untergrenze der Plugin-SDK-/Runtime-API, nicht nur als Kopie
  der Paketversion: Für reine Plugin-Releases, die absichtlich mit älteren OpenClaw-Hosts
  kompatibel bleiben, belassen Sie die Untergrenze bei der ältesten unterstützten
  Host-API und dokumentieren Sie diese Entscheidung im Plugin-Release-Nachweis.
- Führen Sie den manuellen Workflow `Full Release Validation` vor der Release-Freigabe aus, um
  alle Pre-Release-Testboxen von einem Einstiegspunkt aus zu starten. Er akzeptiert einen Branch,
  Tag oder vollständigen Commit-SHA, löst manuell `CI` aus und löst
  `OpenClaw Release Checks` für Installations-Smoke, Paketakzeptanz, Cross-OS-
  Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes aus. Stabile und vollständige
  Läufe enthalten immer umfassende Live-/E2E- und Docker-Release-Pfad-Soak-Tests;
  `run_release_soak=true` bleibt für einen expliziten Beta-Soak erhalten. Package
  Acceptance stellt während der Kandidatenvalidierung den kanonischen Paket-Telegram-E2E bereit
  und vermeidet einen zweiten gleichzeitigen Live-Poller.
  Geben Sie `release_package_spec` nach der Veröffentlichung einer Beta an, um das ausgelieferte
  npm-Paket über Release-Prüfungen, Package Acceptance und Paket-Telegram-
  E2E hinweg wiederzuverwenden, ohne den Release-Tarball neu zu bauen. Geben Sie
  `npm_telegram_package_spec` nur an, wenn Telegram ein anderes
  veröffentlichtes Paket als der Rest der Release-Validierung verwenden soll. Geben Sie
  `package_acceptance_package_spec` an, wenn Package Acceptance ein
  anderes veröffentlichtes Paket als die Release-Paketspezifikation verwenden soll. Geben Sie
  `evidence_package_spec` an, wenn der Release-Evidenzbericht nachweisen soll, dass die
  Validierung zu einem veröffentlichten npm-Paket passt, ohne Telegram-E2E zu erzwingen.
  Beispiel:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Führen Sie den manuellen Workflow `Package Acceptance` aus, wenn Sie Nebenkanal-Nachweise
  für einen Paketkandidaten benötigen, während die Release-Arbeit weiterläuft. Verwenden Sie `source=npm` für
  `openclaw@beta`, `openclaw@latest` oder eine exakte Release-Version; `source=ref`,
  um einen vertrauenswürdigen Branch/Tag/SHA `package_ref` mit dem aktuellen
  `workflow_ref`-Harness zu packen; `source=url` für einen öffentlichen HTTPS-Tarball mit
  erforderlichem SHA-256 und strikter Richtlinie für öffentliche URLs; `source=trusted-url` für eine
  benannte Trusted-Source-Richtlinie mit erforderlicher `trusted_source_id` und SHA-256; oder
  `source=artifact` für einen Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde. Der
  Workflow löst den Kandidaten zu
  `package-under-test` auf, verwendet den Docker-E2E-Release-Scheduler gegen diesen
  Tarball wieder und kann Telegram-QA gegen denselben Tarball mit
  `telegram_mode=mock-openai` oder `telegram_mode=live-frontier` ausführen. Wenn die
  ausgewählten Docker-Lanes `published-upgrade-survivor` enthalten, ist das Paketartefakt
  der Kandidat und `published_upgrade_survivor_baseline` wählt
  die veröffentlichte Baseline aus. `update-restart-auth` verwendet das Kandidatenpaket sowohl als
  installierte CLI als auch als package-under-test, damit der
  verwaltete Neustartpfad des Update-Befehls des Kandidaten ausgeübt wird.
  Beispiel: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Gängige Profile:
  - `smoke`: Installations-/Kanal-/Agent-, Gateway-Netzwerk- und Konfigurations-Neulade-Lanes
  - `package`: paket-/update-/neustart-/Plugin-Lanes, die nativ mit Artefakten arbeiten, ohne OpenWebUI oder Live-ClawHub
  - `product`: Paketprofil plus MCP-Kanäle, Cron-/Subagent-Bereinigung,
    OpenAI-Websuche und OpenWebUI
  - `full`: Docker-Release-Pfad-Abschnitte mit OpenWebUI
  - `custom`: exakte Auswahl von `docker_lanes` für eine fokussierte Wiederholung
- Führen Sie den manuellen Workflow `CI` direkt aus, wenn Sie nur deterministische normale
  CI-Abdeckung für den Release-Kandidaten benötigen. Manuelle CI-Auslösungen umgehen geändertenbezogene
  Eingrenzung und erzwingen die Linux-Node-Shards, Shards für gebündelte Plugins, Plugin- und
  Kanal-Contract-Shards, Node-22-Kompatibilität, `check-*`, `check-additional-*`,
  Smoke-Prüfungen für gebaute Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS und
  Control-UI-i18n-Lanes. Eigenständige manuelle CI-Läufe führen Android nur aus, wenn sie
  mit `include_android=true` ausgelöst werden; `Full Release Validation` übergibt diese Eingabe an
  das CI-Kind.
  Beispiel mit Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es übt
  QA-lab über einen lokalen OTLP/HTTP-Empfänger aus und verifiziert Trace-, Metrik- und Log-
  Export sowie begrenzte Trace-Attribute und Inhalts-/Kennungsredaktion, ohne
  Opik, Langfuse oder einen anderen externen Collector zu erfordern.
- Führen Sie `pnpm qa:otel:collector-smoke` aus, wenn Sie Collector-Kompatibilität validieren.
  Es leitet denselben QA-lab-OTLP-Export durch einen echten OpenTelemetry-Collector-
  Docker-Container, bevor die lokalen Empfängerassertionen ausgeführt werden.
- Führen Sie `pnpm qa:prometheus:smoke` aus, wenn Sie geschütztes Prometheus-Scraping validieren.
  Es übt QA-lab aus, weist nicht authentifizierte Scrapes zurück und verifiziert, dass
  releasekritische Metrikfamilien frei von Prompt-Inhalten, rohen Kennungen,
  Auth-Token und lokalen Pfaden bleiben.
- Führen Sie `pnpm qa:observability:smoke` aus, wenn Sie die OpenTelemetry- und
  Prometheus-Smoke-Lanes des Source-Checkouts nacheinander ausführen möchten.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Der Preflight von `OpenClaw NPM Release` erzeugt Release-Evidenz zu Abhängigkeiten, bevor
  der npm-Tarball gepackt wird. Das npm-Advisory-Schwachstellen-Gate ist
  releaseblockierend. Das transitive Manifestrisiko, die Abhängigkeits-Ownership-/Installations-
  Oberfläche und die Berichte zu Abhängigkeitsänderungen sind nur Release-Evidenz. Der
  Bericht zu Abhängigkeitsänderungen vergleicht den Release-Kandidaten mit dem vorherigen
  erreichbaren Release-Tag.
- Der Preflight lädt Abhängigkeitsevidenz als
  `openclaw-release-dependency-evidence-<tag>` hoch und bettet sie außerdem unter
  `dependency-evidence/` in das vorbereitete npm-Preflight-Artefakt ein. Der echte
  Veröffentlichungspfad verwendet dieses Preflight-Artefakt wieder und hängt dieselbe Evidenz
  an das GitHub-Release als `openclaw-<version>-dependency-evidence.zip` an.
- Führen Sie `OpenClaw Release Publish` für die mutierende Veröffentlichungssequenz aus, nachdem der
  Tag existiert. Lösen Sie sie von `release/YYYY.M.PATCH` aus aus (oder von `main`, wenn Sie einen
  von main erreichbaren Tag veröffentlichen), übergeben Sie den Release-Tag, die erfolgreiche OpenClaw-npm-
  `preflight_run_id` und die erfolgreiche `full_release_validation_run_id`, und behalten Sie
  den standardmäßigen Plugin-Veröffentlichungsumfang `all-publishable` bei, sofern Sie nicht bewusst
  eine fokussierte Reparatur ausführen. Der Workflow serialisiert Plugin-npm-Veröffentlichung, Plugin-
  ClawHub-Veröffentlichung und OpenClaw-npm-Veröffentlichung, damit das Kernpaket nicht veröffentlicht wird,
  bevor seine externalisierten Plugins veröffentlicht sind.
- Stabiles `OpenClaw Release Publish` erfordert ein exaktes `windows_node_tag`, nachdem
  das passende Nicht-Prerelease-Release `openclaw/openclaw-windows-node` existiert.
  Es erfordert außerdem die kandidatenfreigegebene Map `windows_node_installer_digests`.
  Vor dem Auslösen eines Publish-Kinds verifiziert es, dass das Quellrelease
  veröffentlicht, kein Prerelease ist, die erforderlichen x64-/ARM64-Installer enthält und
  weiterhin zu dieser freigegebenen Map passt. Danach löst es `Windows Node Release`
  aus, während das OpenClaw-Release noch ein Entwurf ist, und übernimmt die fixierte Installer-
  Digest-Map unverändert. Der Kind-
  Workflow lädt die signierten Windows-Hub-Installer von genau diesem Tag herunter,
  gleicht sie mit den fixierten Digests ab, verifiziert, dass ihre Authenticode-
  Signaturen auf einem Windows-Runner den erwarteten Signierer OpenClaw Foundation verwenden,
  schreibt ein SHA-256-Manifest und lädt die Installer plus Manifest in das
  kanonische OpenClaw-GitHub-Release hoch, lädt dann die promoteten Assets erneut herunter und
  verifiziert Manifestzugehörigkeit und Hashes. Der Elternworkflow verifiziert den aktuellen
  x64-, ARM64- und Prüfsummen-Asset-Contract vor der Veröffentlichung. Direkte Wiederherstellung
  weist unerwartete Asset-Namen `OpenClawCompanion-*` zurück, bevor die
  erwarteten Contract-Assets durch die fixierten Quellbytes ersetzt werden. Lösen Sie
  `Windows Node Release` nur zur Wiederherstellung manuell aus und übergeben Sie immer einen exakten Tag, niemals
  `latest`, plus die explizite JSON-Map `expected_installer_digests` aus dem
  freigegebenen Quellrelease. Website-Downloadlinks sollten auf exakte OpenClaw-
  Release-Asset-URLs für das aktuelle stabile Release zielen oder
  `releases/latest/download/...` nur verwenden, nachdem verifiziert wurde, dass GitHubs latest-Weiterleitung
  auf dasselbe Release zeigt; verlinken Sie nicht nur auf die Release-
  Seite des Companion-Repos.
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt außerdem die QA-Lab-Mock-Paritäts-Lane sowie das schnelle
  Live-Matrix-Profil und die Telegram-QA-Lane vor der Release-Freigabe aus. Die Live-
  Lanes verwenden die Umgebung `qa-live-shared`; Telegram verwendet außerdem Convex-CI-
  Credential-Leases. Führen Sie den manuellen Workflow `QA-Lab - All Lanes` mit
  `matrix_profile=all` und `matrix_shards=true` aus, wenn Sie vollständiges Matrix-
  Transport-, Medien- und E2EE-Inventar parallel benötigen.
- Cross-OS-Installations- und Upgrade-Runtime-Validierung ist Teil der öffentlichen
  `OpenClaw Release Checks` und `Full Release Validation`, die den
  wiederverwendbaren Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direkt aufrufen
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad bleibt kurz,
  deterministisch und artefaktorientiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen mit Secrets sollten über `Full Release
Validation` oder vom `main`-/Release-Workflow-Ref ausgelöst werden, damit Workflow-Logik und
  Secrets kontrolliert bleiben
- `OpenClaw Release Checks` akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, solange
  der aufgelöste Commit von einem OpenClaw-Branch oder Release-Tag erreichbar ist
- Der reine Validierungs-Preflight von `OpenClaw NPM Release` akzeptiert außerdem den aktuellen
  vollständigen 40-Zeichen-Commit-SHA des Workflow-Branch, ohne einen gepushten Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung übernommen werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Paketmetadatenprüfung; echte Veröffentlichung erfordert weiterhin einen echten Release-Tag
- Beide Workflows halten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Release-Prüfungs-Lane
- Führen Sie vor dem lokalen Tagging eines Release-Kandidaten
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` aus. Der Helper
  führt die schnellen Release-Leitplanken, Plugin-npm-/ClawHub-Release-Prüfungen, Build,
  UI-Build und `release:openclaw:npm:check` in der Reihenfolge aus, die häufige
  freigabeblockierende Fehler erkennt, bevor der GitHub-Veröffentlichungsworkflow startet.
- Führen Sie `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder den passenden Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung aus
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (oder die passende Beta-/Korrekturversion), um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` aus,
  um Installed-Package-Onboarding, Telegram-Einrichtung und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam geleasten Telegram-
  Credential-Pool zu verifizieren. Lokale einmalige Maintainer-Läufe können die
  Convex-Variablen weglassen und die drei `OPENCLAW_QA_TELEGRAM_*`-Env-Credentials
  direkt übergeben.
- Um den vollständigen Post-Publish-Beta-Smoke von einer Maintainer-Maschine aus auszuführen, verwenden Sie `pnpm release:beta-smoke -- --beta betaN`. Der Helper führt Parallels-npm-Update-/Fresh-Target-Validierung aus, dispatcht `NPM Telegram Beta E2E`, pollt den exakten Workflow-Lauf, lädt das Artefakt herunter und gibt den Telegram-Bericht aus.
- Maintainer können dieselbe Post-Publish-Prüfung über GitHub Actions mit dem
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist bewusst nur
  manuell und läuft nicht bei jedem Merge.
- Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - die echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss von demselben `main`- oder
    `release/YYYY.M.PATCH`-Branch dispatcht werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann über Workflow-Eingabe explizit `latest` anvisieren
  - tokenbasierte npm-dist-tag-Mutation befindet sich jetzt in
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, weil
    `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das Quell-Repo
    nur OIDC-Publish beibehält
  - öffentlicher `macOS Release` dient nur der Validierung; wenn ein Tag nur auf einem
    Release-Branch liegt, der Workflow aber von `main` dispatcht wird, setzen Sie
    `public_release_branch=release/YYYY.M.PATCH`
  - echte macOS-Veröffentlichung muss erfolgreiche macOS-`preflight_run_id` und
    `validate_run_id` bestehen
  - die echten Publish-Pfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.PATCH-N` prüft der Post-Publish-Verifier
  auch denselben temporären Präfix-Upgrade-Pfad von `YYYY.M.PATCH` auf `YYYY.M.PATCH-N`,
  damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf dem
  stabilen Basis-Payload belassen
- npm-Release-Preflight schlägt geschlossen fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren `dist/control-ui/assets/`-Payload
  enthält, damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Post-Publish-Verifizierung prüft auch, dass veröffentlichte Plugin-Entrypoints und
  Paketmetadaten im installierten Registry-Layout vorhanden sind. Ein Release, das
  fehlende Plugin-Runtime-Payloads ausliefert, besteht den Postpublish-Verifier nicht
  und kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-pack-`unpackedSize`-Budget für
  den Kandidaten-Update-Tarball, sodass Installer-E2E versehentliches Pack-Bloat
  vor dem Release-Publish-Pfad erkennt
- Wenn die Release-Arbeit CI-Planung, Extension-Timing-Manifeste oder
  Extension-Testmatrizen berührt hat, generieren und prüfen Sie vor der Freigabe die
  vom Planner verantworteten `plugin-prerelease-extension-shard`-Matrixausgaben aus
  `.github/workflows/plugin-prerelease.yml` neu, damit Release Notes kein veraltetes
  CI-Layout beschreiben
- Bereitschaft für stabile macOS-Releases umfasst auch die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierte `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf das neue stabile Zip zeigen; der
    macOS-Publish-Workflow committet es automatisch oder öffnet einen Appcast-PR,
    wenn direkter Push blockiert ist
  - die paketierte App muss eine Nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## Release-Testboxen

`Full Release Validation` ist der Weg, wie Operator alle Pre-Release-Tests über
einen einzigen Einstiegspunkt starten. Für einen gepinnten Commit-Nachweis auf
einem schnell veränderlichen Branch verwenden Sie den Helper, damit jeder
untergeordnete Workflow von einem temporären Branch ausgeführt wird, der auf den
Ziel-SHA fixiert ist:

```bash
pnpm ci:full-release --sha <full-sha>
```

Der Helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
von diesem Branch mit `ref=<sha>`, verifiziert, dass jeder untergeordnete
Workflow-`headSha` dem Ziel entspricht, und löscht dann den temporären Branch.
So wird vermieden, versehentlich einen neueren untergeordneten `main`-Lauf
nachzuweisen.

Für die Validierung eines Release-Branch oder Tags führen Sie sie vom
vertrauenswürdigen `main`-Workflow-Ref aus und übergeben den Release-Branch oder
Tag als `ref`:

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
`target_ref=<release-ref>` und dispatcht anschließend
`OpenClaw Release Checks`. `OpenClaw Release Checks` fächert Install-Smoke,
plattformübergreifende Release-Checks, Live-/E2E-Docker-Abdeckung für den
Release-Pfad bei aktiviertem Soak, Package Acceptance mit dem kanonischen
Telegram-Paket-E2E, QA-Lab-Parität, Live-Matrix und Live-Telegram auf. Ein
vollständiger/alles umfassender Lauf ist nur akzeptabel, wenn die Zusammenfassung
von `Full Release Validation` `normal_ci`, `plugin_prerelease` und
`release_checks` als erfolgreich anzeigt, es sei denn, ein fokussierter
Wiederholungslauf hat das separate untergeordnete `Plugin Prerelease` bewusst
übersprungen. Verwenden Sie den eigenständigen untergeordneten `npm-telegram` nur
für einen fokussierten Wiederholungslauf eines veröffentlichten Pakets mit
`release_package_spec` oder `npm_telegram_package_spec`. Die finale
Verifier-Zusammenfassung enthält Tabellen der langsamsten Jobs für jeden
untergeordneten Lauf, damit der Release-Manager den aktuellen kritischen Pfad
sehen kann, ohne Logs herunterzuladen.
Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für
die vollständige Stage-Matrix, exakten Workflow-Jobnamen, Unterschiede zwischen
Stable- und Full-Profil, Artefakte und Handles für fokussierte Wiederholungsläufe.
Untergeordnete Workflows werden von dem vertrauenswürdigen Ref dispatcht, der
`Full Release Validation` ausführt, normalerweise `--ref main`, selbst wenn der
Ziel-`ref` auf einen älteren Release-Branch oder Tag zeigt. Es gibt keine
separate Workflow-Ref-Eingabe für Full Release Validation; wählen Sie den
vertrauenswürdigen Harness durch die Wahl des Workflow-Lauf-Refs. Verwenden Sie
`--ref main -f ref=<sha>` nicht für einen exakten Commit-Nachweis auf dem sich
bewegenden `main`; rohe Commit-SHAs können keine Workflow-Dispatch-Refs sein,
verwenden Sie daher `pnpm ci:full-release --sha <sha>`, um den gepinnten
temporären Branch zu erstellen.

Verwenden Sie `release_profile`, um die Live-/Provider-Breite auszuwählen:

- `minimum`: schnellster release-kritischer OpenAI-/Core-Live- und Docker-Pfad
- `stable`: Minimum plus Stable-Provider-/Backend-Abdeckung für die Release-Freigabe
- `full`: Stable plus breite beratende Provider-/Medienabdeckung

Stable- und vollständige Validierung führen vor der Promotion immer den
exhaustiven Live-/E2E-, Docker-Release-Pfad- und begrenzten
veröffentlichten Upgrade-Survivor-Sweep aus. Verwenden Sie
`run_release_soak=true`, um denselben Sweep für eine Beta anzufordern. Dieser
Sweep deckt die neuesten vier Stable-Pakete plus gepinnte Baselines `2026.4.23`
und `2026.5.2` sowie ältere Abdeckung für `2026.4.15` ab, wobei doppelte
Baselines entfernt und jede Baseline in einen eigenen Docker-Runner-Job
geshardet wird.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den
Ziel-Ref einmal als `release-package-under-test` aufzulösen, und verwendet dieses
Artefakt in plattformübergreifenden Checks, Package Acceptance und
Release-Pfad-Docker-Checks wieder, wenn Soak läuft. Dadurch bleiben alle
paketbezogenen Boxen auf denselben Bytes und wiederholte Paket-Builds werden
vermieden. Nachdem eine Beta bereits auf npm ist, setzen Sie
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, damit Release-Checks das
ausgelieferte Paket einmal herunterladen, seinen Build-Quell-SHA aus
`dist/build-info.json` extrahieren und dieses Artefakt für plattformübergreifende
Lanes, Package Acceptance, Release-Pfad-Docker und Paket-Telegram-Lanes
wiederverwenden.
Der plattformübergreifende OpenAI-Install-Smoke verwendet
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn die Repo-/Org-Variable gesetzt ist,
andernfalls `openai/gpt-5.4`, weil diese Lane Paketinstallation, Onboarding,
Gateway-Start und eine Live-Agent-Turn nachweist, statt das langsamste
Standardmodell zu benchmarken. Die breitere Live-Provider-Matrix bleibt der Ort
für modellspezifische Abdeckung.

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

Verwenden Sie den vollständigen Umbrella nicht als ersten Wiederholungslauf nach
einer fokussierten Korrektur. Wenn eine Box fehlschlägt, verwenden Sie für den
nächsten Nachweis den fehlgeschlagenen untergeordneten Workflow, Job, die
Docker-Lane, das Paketprofil, den Modell-Provider oder die QA-Lane. Führen Sie
den vollständigen Umbrella nur dann erneut aus, wenn die Korrektur die gemeinsam
genutzte Release-Orchestrierung geändert oder frühere All-Box-Evidence veraltet
gemacht hat. Der finale Verifier des Umbrella prüft die aufgezeichneten
untergeordneten Workflow-Lauf-IDs erneut. Nachdem ein untergeordneter Workflow
erfolgreich erneut ausgeführt wurde, führen Sie daher nur den fehlgeschlagenen
übergeordneten Job `Verify full validation` erneut aus.

Für begrenzte Recovery übergeben Sie `rerun_group` an den Umbrella. `all` ist
der echte Release-Candidate-Lauf, `ci` führt nur das normale untergeordnete CI
aus, `plugin-prerelease` führt nur den release-spezifischen untergeordneten
Plugin-Lauf aus, `release-checks` führt jede Release-Box aus, und die engeren
Release-Gruppen sind `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` und `npm-telegram`. Fokussierte `npm-telegram`-Wiederholungsläufe
erfordern `release_package_spec` oder `npm_telegram_package_spec`;
Full-/All-Läufe verwenden das kanonische Paket-Telegram-E2E innerhalb von
Package Acceptance. Fokussierte plattformübergreifende Wiederholungsläufe können
`cross_os_suite_filter=windows/packaged-upgrade` oder einen anderen OS-/Suite-Filter
hinzufügen. QA-Release-Check-Fehler blockieren die normale Release-Validierung,
einschließlich erforderlichem OpenClaw-Dynamic-Tool-Drift in der Standardstufe.
Tideclaw-Alpha-Läufe können nicht paket-sicherheitsrelevante
Release-Check-Lanes weiterhin als beratend behandeln. Wenn `live_suite_filter`
explizit eine gegatete QA-Live-Lane wie Discord, WhatsApp oder Slack anfordert,
muss die passende Repo-Variable `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
aktiviert sein; andernfalls schlägt die Eingabeerfassung fehl, statt die Lane
still zu überspringen.

### Vitest

Die Vitest-Box ist der manuelle untergeordnete `CI`-Workflow. Manuelles CI
umgeht bewusst Changed-Scoping und erzwingt den normalen Testgraphen für den
Release Candidate: Linux-Node-Shards, Bundled-Plugin-Shards, Plugin- und
Channel-Contract-Shards, Node-22-Kompatibilität, `check-*`,
`check-additional-*`, Smoke-Checks für gebaute Artefakte, Docs-Checks,
Python-Skills, Windows, macOS und Control-UI-i18n. Android ist enthalten, wenn
`Full Release Validation` die Box ausführt, weil der Umbrella
`include_android=true` übergibt; eigenständiges manuelles CI erfordert
`include_android=true` für Android-Abdeckung.

Verwenden Sie diese Box, um zu beantworten: „Hat der Quellbaum die vollständige
normale Testsuite bestanden?“ Sie ist nicht dasselbe wie
Release-Pfad-Produktvalidierung. Aufzubewahrende Evidence:

- Zusammenfassung von `Full Release Validation` mit der URL des dispatchten `CI`-Laufs
- grüner `CI`-Lauf auf dem exakten Ziel-SHA
- fehlgeschlagene oder langsame Shard-Namen aus den CI-Jobs bei der Untersuchung von Regressionen
- Vitest-Timing-Artefakte wie `.artifacts/vitest-shard-timings.json`, wenn ein
  Lauf Performance-Analyse benötigt

Führen Sie manuelles CI nur dann direkt aus, wenn das Release deterministisches
normales CI benötigt, aber nicht die Docker-, QA-Lab-, Live-, plattformübergreifenden
oder Paket-Boxen. Verwenden Sie den ersten Befehl für direktes CI ohne Android.
Fügen Sie `include_android=true` hinzu, wenn direktes Release-Candidate-CI
Android abdecken muss:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Die Docker-Box lebt in `OpenClaw Release Checks` über
`openclaw-live-and-e2e-checks-reusable.yml` sowie im Release-Modus-Workflow
`install-smoke`. Sie validiert den Release Candidate über paketierte
Docker-Umgebungen, statt nur Tests auf Quellcodeebene auszuführen.

Release-Docker-Abdeckung umfasst:

- vollständigen Install-Smoke mit aktiviertem langsamem Bun-Global-Install-Smoke
- Vorbereitung/Wiederverwendung des Root-Dockerfile-Smoke-Images nach Ziel-SHA,
  wobei QR-, Root-/Gateway- und Installer-/Bun-Smoke-Jobs als separate
  install-smoke-Shards laufen
- Repository-E2E-Lanes
- Release-Pfad-Docker-Chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` und `plugins-runtime-install-h`
- OpenWebUI-Abdeckung innerhalb des Chunks `plugins-runtime-services`, wenn angefordert
- aufgeteilte Bundled-Plugin-Install-/Uninstall-Lanes
  `bundled-plugin-install-uninstall-0` bis
  `bundled-plugin-install-uninstall-23`
- Live-/E2E-Provider-Suites und Docker-Live-Modellabdeckung, wenn Release-Checks
  Live-Suites enthalten

Verwenden Sie Docker-Artefakte vor einem Wiederholungslauf. Der
Release-Pfad-Scheduler lädt `.artifacts/docker-tests/` mit Lane-Logs,
`summary.json`, `failures.json`, Phase-Timings, Scheduler-Plan-JSON und
Wiederholungslauf-Befehlen hoch. Für fokussierte Recovery verwenden Sie
`docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, statt
alle Release-Chunks erneut auszuführen. Generierte Wiederholungslauf-Befehle
enthalten frühere `package_artifact_run_id`- und vorbereitete
Docker-Image-Eingaben, wenn verfügbar, sodass eine fehlgeschlagene Lane denselben
Tarball und dieselben GHCR-Images wiederverwenden kann.

### QA Lab

Die QA-Lab-Box ist ebenfalls Teil von `OpenClaw Release Checks`. Sie ist das
agentische Verhalten und das Channel-Level-Release-Gate, getrennt von Vitest und
Docker-Paketmechanik.

Release-QA-Lab-Abdeckung umfasst:

- Mock-Paritäts-Lane, die die OpenAI-Candidate-Lane mit der Opus-4.6-Baseline
  unter Verwendung des agentischen Parity-Packs vergleicht
- schnelles Live-Matrix-QA-Profil mit der Umgebung `qa-live-shared`
- Live-Telegram-QA-Lane mit Convex-CI-Credential-Leases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` oder
  `pnpm qa:observability:smoke`, wenn Release-Telemetrie expliziten lokalen
  Nachweis benötigt

Verwenden Sie diese Box, um zu beantworten: „Verhält sich das Release in
QA-Szenarien und Live-Channel-Flows korrekt?“ Bewahren Sie die Artefakt-URLs für
Paritäts-, Matrix- und Telegram-Lanes auf, wenn Sie das Release freigeben.
Vollständige Matrix-Abdeckung bleibt als manueller geshardeter QA-Lab-Lauf
verfügbar, nicht als standardmäßige release-kritische Lane.

### Package

Die Package-Box ist das Gate für das installierbare Produkt. Sie wird durch
`Package Acceptance` und den Resolver
`scripts/resolve-openclaw-package-candidate.mjs` gestützt. Der Resolver
normalisiert einen Candidate in den `package-under-test`-Tarball, der von Docker
E2E konsumiert wird, validiert das Paket-Inventar, zeichnet Paketversion und
SHA-256 auf und hält den Workflow-Harness-Ref vom Paketquell-Ref getrennt.

Unterstützte Candidate-Quellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-
  Version
- `source=ref`: packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA
  mit dem ausgewählten `workflow_ref`-Harness
- `source=url`: lädt eine öffentliche HTTPS-`.tgz` mit erforderlichem `package_sha256` herunter;
  URL-Zugangsdaten, nicht standardmäßige HTTPS-Ports, private/interne/Special-Use-
  Hostnamen oder aufgelöste Adressen sowie unsichere Weiterleitungen werden abgelehnt
- `source=trusted-url`: lädt eine HTTPS-`.tgz` mit erforderlichem
  `package_sha256` und `trusted_source_id` aus einer benannten Richtlinie in
  `.github/package-trusted-sources.json` herunter; verwenden Sie dies für maintainerverwaltete
  Enterprise-Spiegel oder private Paket-Repositorys, statt einen
  privaten Netzwerk-Bypass auf Eingabeebene zu `source=url` hinzuzufügen
- `source=artifact`: verwendet eine `.tgz` wieder, die von einem anderen GitHub-Actions-Lauf hochgeladen wurde

`OpenClaw Release Checks` führt Package Acceptance mit `source=artifact`, dem
vorbereiteten Release-Paketartefakt, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` aus. Package Acceptance hält Migration, Update,
Neustart nach Update mit konfigurierter Authentifizierung, Live-ClawHub-Skill-Installation, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-
Fixtures, Plugin-Update und Telegram-Paket-QA gegen denselben aufgelösten
Tarball. Blockierende Release-Prüfungen verwenden die standardmäßige aktuelle veröffentlichte Paket-
Baseline; das Beta-Profil mit `run_release_soak=true`, `release_profile=stable` oder
`release_profile=full` erweitert auf jede stabile, bei npm veröffentlichte Baseline von
`2026.4.23` bis `latest` plus Fixtures für gemeldete Probleme. Verwenden Sie
Package Acceptance mit `source=npm` für einen bereits ausgelieferten Kandidaten,
`source=ref` für einen SHA-gestützten lokalen npm-Tarball vor der Veröffentlichung,
`source=trusted-url` für einen maintainerverwalteten Enterprise-/privaten Spiegel oder
`source=artifact` für einen vorbereiteten Tarball, der von einem anderen GitHub-Actions-Lauf hochgeladen wurde.
Es ist der GitHub-native
Ersatz für den Großteil der Paket-/Update-Abdeckung, die zuvor
Parallels erforderte. Plattformübergreifende Release-Prüfungen bleiben für OS-spezifisches Onboarding,
Installer- und Plattformverhalten wichtig, aber die Produktvalidierung von Paketen/Updates sollte
Package Acceptance bevorzugen.

Die kanonische Checkliste für Update- und Plugin-Validierung ist
[Updates und Plugins testen](/de/help/testing-updates-plugins). Verwenden Sie sie, wenn
Sie entscheiden, welche lokale, Docker-, Package-Acceptance- oder Release-Check-Lane eine
Plugin-Installation/-Aktualisierung, Doctor-Bereinigung oder Änderung der Migration veröffentlichter Pakete belegt.
Die vollständige veröffentlichte Update-Migration von jedem stabilen `2026.4.23+`-Paket ist
ein separater manueller `Update Migration`-Workflow und nicht Teil der Full Release CI.

Legacy-Nachsicht in der Package Acceptance ist absichtlich zeitlich begrenzt. Pakete bis
`2026.4.25` dürfen den Kompatibilitätspfad für Metadatenlücken verwenden, die bereits
bei npm veröffentlicht wurden: private QA-Inventareinträge, die im Tarball fehlen, fehlendes
`gateway install --wrapper`, fehlende Patch-Dateien in der aus dem Tarball abgeleiteten Git-
Fixture, fehlendes persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze,
fehlende Persistenz von Marketplace-Installationsdatensätzen und Konfigurationsmetadaten-
Migration während `plugins update`. Das veröffentlichte Paket `2026.4.26` darf
für lokale Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete
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

- `smoke`: schnelle Paketinstallations-/Channel-/Agent-, Gateway-Netzwerk- und Konfigurations-
  Reload-Lanes
- `package`: Installations-/Update-/Neustart-/Plugin-Paketverträge plus Live-ClawHub-
  Skill-Installationsnachweis; dies ist der Release-Check-Standard
- `product`: `package` plus MCP-Channels, Cron-/Subagent-Bereinigung, OpenAI-Web-
  Suche und OpenWebUI
- `full`: Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom`: exakte `docker_lanes`-Liste für fokussierte Wiederholungsläufe

Aktivieren Sie für Telegram-Nachweise zu Paketkandidaten `telegram_mode=mock-openai` oder
`telegram_mode=live-frontier` in Package Acceptance. Der Workflow übergibt den
aufgelösten `package-under-test`-Tarball an die Telegram-Lane; der eigenständige
Telegram-Workflow akzeptiert weiterhin eine veröffentlichte npm-Spezifikation für Prüfungen nach der Veröffentlichung.

## Reguläre Release-Veröffentlichungsautomatisierung

Für Beta, `latest`, Plugin, GitHub Release und Plattformveröffentlichung ist
`OpenClaw Release Publish` der normale mutierende Einstiegspunkt. Der monatliche
`.33+`-nur-npm-Extended-Stable-Pfad verwendet diesen Orchestrator nicht. Der reguläre Workflow
orchestriert die Trusted-Publisher-Workflows in der Reihenfolge, die das Release benötigt:

1. Den Release-Tag auschecken und seinen Commit-SHA auflösen.
2. Prüfen, dass der Tag von `main` oder `release/*` erreichbar ist.
3. `pnpm plugins:sync:check` ausführen.
4. `Plugin NPM Release` mit `publish_scope=all-publishable` und
   `ref=<release-sha>` auslösen.
5. `Plugin ClawHub Release` mit demselben Scope und SHA auslösen.
6. `OpenClaw NPM Release` mit dem Release-Tag, npm-Dist-Tag und
   gespeicherter `preflight_run_id` auslösen, nachdem die gespeicherte
   `full_release_validation_run_id` verifiziert wurde.
7. Für stabile Releases das GitHub Release als Entwurf erstellen oder aktualisieren,
   `Windows Node Release` mit dem expliziten `windows_node_tag` und
   kandidatenfreigegebenen `windows_node_installer_digests` auslösen und die kanonischen
   Installer-/Prüfsummen-Assets verifizieren, bevor der Entwurf veröffentlicht wird.

Beispiel für Beta-Veröffentlichung:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Stabile Veröffentlichung zum standardmäßigen Beta-Dist-Tag:

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

Stabile Promotion direkt zu `latest` ist explizit:

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
nur für fokussierte Reparatur- oder Wiederveröffentlichungsarbeiten. `OpenClaw Release Publish` lehnt
`plugin_publish_scope=selected` ab, wenn `publish_openclaw_npm=true` ist, damit das Core-
Paket nicht ohne jedes veröffentlichbare offizielle Plugin ausgeliefert werden kann, einschließlich
`@openclaw/diffs-language-pack`. Für eine ausgewählte Plugin-Reparatur setzen Sie
`publish_openclaw_npm=false` mit `plugin_publish_scope=selected` und
`plugins=@openclaw/name`, oder lösen Sie den untergeordneten Workflow direkt aus.

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true` ist, darf es auch der aktuelle
  vollständige 40-Zeichen-Commit-SHA des Workflow-Branchs für einen rein validierenden Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `full_release_validation_run_id`: für echte monatliche Extended-Stable- und reguläre
  Nicht-Beta-Veröffentlichungen erforderlich, damit der Workflow den exakten Validierungslauf authentifiziert
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; akzeptiert `alpha`, `beta`,
  `latest` oder `extended-stable` und ist standardmäßig `beta`. Finale Patch-Versionen `33` und später müssen
  `extended-stable` verwenden; standardmäßig lehnt `extended-stable` frühere Patches ab, und es lehnt immer
  nicht finale Tags ab.
- `bypass_extended_stable_guard`: nur zum Testen bestimmter boolescher Wert, Standard `false`; mit
  `npm_dist_tag=extended-stable` umgeht er die monatliche Extended-Stable-Berechtigung, während
  Release-Identität, Artefakt, Freigabe und Rückleseprüfungen erhalten bleiben.

`OpenClaw Release Publish` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag; muss bereits existieren
- `preflight_run_id`: erfolgreiche `OpenClaw NPM Release`-Preflight-Lauf-ID;
  erforderlich, wenn `publish_openclaw_npm=true`
- `full_release_validation_run_id`: erfolgreiche `Full Release Validation`-Lauf-
  ID; erforderlich, wenn `publish_openclaw_npm=true`
- `windows_node_tag`: exakter Nicht-Prerelease-Release-Tag von `openclaw/openclaw-windows-node`;
  erforderlich für stabile OpenClaw-Veröffentlichung
- `windows_node_installer_digests`: kandidatenfreigegebene kompakte JSON-Map der
  aktuellen Windows-Installer-Namen auf ihre fixierten `sha256:`-Digests; erforderlich
  für stabile OpenClaw-Veröffentlichung
- `npm_dist_tag`: npm-Ziel-Tag für das OpenClaw-Paket
- `plugin_publish_scope`: standardmäßig `all-publishable`; verwenden Sie `selected` nur
  für fokussierte reine Plugin-Reparaturarbeit mit `publish_openclaw_npm=false`
- `plugins`: kommagetrennte `@openclaw/*`-Paketnamen, wenn
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standardmäßig `true`; setzen Sie `false` nur, wenn Sie den
  Workflow als reinen Plugin-Reparatur-Orchestrator verwenden
- `wait_for_clawhub`: standardmäßig `false`, damit die npm-Verfügbarkeit nicht durch
  den ClawHub-Sidecar blockiert wird; setzen Sie `true` nur, wenn der Workflow-Abschluss auch
  den ClawHub-Abschluss enthalten muss

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Eingaben:

- `ref`: Branch, Tag oder vollständiger Commit-SHA zur Validierung. Prüfungen mit Secrets
  erfordern, dass der aufgelöste Commit von einem OpenClaw-Branch oder
  Release-Tag erreichbar ist.
- `run_release_soak`: aktiviert umfassende Live-/E2E-, Docker-Release-Pfad- und
  Upgrade-Survivor-Soak-Prüfungen seit allen Versionen für Beta-Release-Prüfungen. Es wird durch
  `release_profile=stable` und `release_profile=full` erzwungen.

Regeln:

- Reguläre finale und Korrekturversionen unter Patch `33` dürfen entweder zu
  `beta` oder `latest` veröffentlicht werden. Finale Versionen ab Patch `33` müssen zu
  `extended-stable` veröffentlicht werden, und Versionen mit Korrektur-Suffix an dieser Grenze werden abgelehnt.
- Beta-Prerelease-Tags dürfen nur zu `beta` veröffentlicht werden
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur zulässig, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` und `Full Release Validation` sind immer
  nur validierend
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der während des Preflight verwendet wurde;
  der Workflow prüft, dass die Metadaten vor der Veröffentlichung weiterhin übereinstimmen

## Reguläre Beta-/Latest-Stable-Release-Sequenz

Diese Legacy-Sequenz gilt für das reguläre orchestrierte Release, das auch
Plugins, GitHub Release, Windows und andere Plattformarbeit besitzt. Sie ist nicht der
monatliche `.33+`-nur-npm-Extended-Stable-Pfad, der oben auf dieser Seite dokumentiert ist.

Beim Schneiden eines regulären orchestrierten stabilen Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit-SHA
     des Workflow-Branches für einen reinen Validierungs-Probelauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur,
   wenn Sie bewusst direkt eine stabile Veröffentlichung publizieren möchten
3. Führen Sie `Full Release Validation` auf dem Release-Branch, Release-Tag oder vollständigen
   Commit-SHA aus, wenn Sie normale CI plus Live-Prompt-Cache, Docker, QA Lab,
   Matrix und Telegram-Abdeckung aus einem manuellen Workflow wünschen
4. Wenn Sie bewusst nur den deterministischen normalen Testgraphen benötigen, führen Sie stattdessen den
   manuellen `CI`-Workflow auf dem Release-Ref aus
5. Wählen Sie den exakten Nicht-Prerelease-Release-Tag `openclaw/openclaw-windows-node`,
   dessen signierte x64- und ARM64-Installer ausgeliefert werden sollen. Speichern Sie ihn als
   `windows_node_tag` und speichern Sie deren validierte Digest-Map als
   `windows_node_installer_digests`. Der Release-Candidate-Helfer zeichnet beides auf
   und nimmt es in seinen generierten Publish-Befehl auf.
6. Speichern Sie die erfolgreichen `preflight_run_id` und `full_release_validation_run_id`
7. Führen Sie `OpenClaw Release Publish` mit demselben `tag`, demselben `npm_dist_tag`,
   dem ausgewählten `windows_node_tag`, dessen gespeicherten `windows_node_installer_digests`,
   der gespeicherten `preflight_run_id` und der gespeicherten `full_release_validation_run_id` aus;
   es veröffentlicht externalisierte Plugins auf npm und ClawHub, bevor das
   OpenClaw-npm-Paket promoted wird
8. Wenn das Release auf `beta` gelandet ist, verwenden Sie den
   Workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` nach `latest` zu promoten
9. Wenn das Release bewusst direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben Release-
   Workflow, um beide dist-tags auf die stabile Version zu setzen, oder lassen Sie dessen geplante
   Self-Healing-Synchronisierung `beta` später verschieben

Die dist-tag-Mutation liegt im Release-Ledger-Repository, weil sie weiterhin
`NPM_TOKEN` erfordert, während das Source-Repository OIDC-only Publish beibehält.

So bleiben sowohl der direkte Publish-Pfad als auch der Beta-zuerst-Promotion-Pfad
dokumentiert und für Operator sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückgreifen muss, führen Sie alle 1Password-
CLI-Befehle (`op`) nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op` nicht
direkt aus der Haupt-Agent-Shell auf; wenn es in tmux bleibt, sind Prompts,
Warnungen und OTP-Handling beobachtbar, und wiederholte Host-Warnungen werden verhindert.

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

Maintainer verwenden die privaten Release-Dokumente unter
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
für das eigentliche Runbook.

## Verwandt

- [Release-Kanäle](/de/install/development-channels)
