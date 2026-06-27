---
read_when:
    - Sie möchten einen Source-Checkout sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen das Kurzschreibverhalten von `--update` verstehen
summary: CLI-Referenz für `openclaw update` (weitgehend sichere Quellcode-Aktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-06-27T17:21:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw sicher aktualisieren und zwischen Stable-/Beta-/Dev-Kanälen wechseln.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten), erfolgen Updates über den Paketmanager-Ablauf unter [Aktualisieren](/de/install/updating).

## Verwendung

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Optionen

- `--no-restart`: überspringt den Neustart des Gateway-Dienstes nach einem erfolgreichen Update. Paketmanager-Updates, die das Gateway neu starten, prüfen vor erfolgreichem Abschluss des Befehls, dass der neu gestartete Dienst die erwartete aktualisierte Version meldet.
- `--channel <stable|beta|dev>`: legt den Update-Kanal fest (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: überschreibt das Paketziel nur für dieses Update. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet; GitHub-/Git-Quellspezifikationen werden vor der gestuften globalen npm-Installation in einen temporären Tarball gepackt.
- `--dry-run`: zeigt die geplanten Update-Aktionen (Kanal/Tag/Ziel/Neustartablauf) an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.warnings`, wenn beschädigte oder nicht ladbare verwaltete Plugins
  nach erfolgreichem Core-Update repariert werden müssen, Details zum Plugin-Fallback
  im Beta-Kanal, wenn ein Plugin keine Beta-Veröffentlichung hat, und
  `postUpdate.plugins.integrityDrifts`, wenn während der Plugin-Synchronisierung nach dem Update
  Abweichungen bei npm-Plugin-Artefakten erkannt werden.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1800s).
- `--yes`: überspringt Bestätigungsabfragen (zum Beispiel Downgrade-Bestätigung).
- `--acknowledge-clawhub-risk`: nach Prüfung der Vertrauenswarnungen für Community-ClawHub
  kann die Plugin-Synchronisierung nach dem Update ohne interaktive Abfrage fortgesetzt werden.
  Ohne diese Option werden riskante Community-ClawHub-Plugin-Veröffentlichungen übersprungen und
  unverändert gelassen, wenn OpenClaw nicht nachfragen kann. Offizielle ClawHub-Pakete und
  gebündelte OpenClaw-Plugin-Quellen umgehen diese Release-Vertrauensabfrage.

`openclaw update` hat kein `--verbose`-Flag. Verwenden Sie `--dry-run`, um die geplanten
Kanal-/Tag-/Installations-/Neustartaktionen vorab anzuzeigen, `--json` für maschinenlesbare
Ergebnisse und `openclaw update status --json`, wenn Sie nur Kanal- und
Verfügbarkeitsdetails benötigen. Wenn Sie Gateway-Logs rund um ein Update debuggen,
sind Konsolenausführlichkeit und Datei-Log-Level getrennt: Gateway `--verbose` wirkt sich
auf Terminal-/WebSocket-Ausgaben aus, während Datei-Logs `logging.level: "debug"` oder
`"trace"` in der Konfiguration erfordern. Siehe [Gateway-Logging](/de/gateway/logging).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind verändernde `openclaw update`-Läufe deaktiviert. Aktualisieren Sie stattdessen die Nix-Quelle oder den Flake-Input für diese Installation; verwenden Sie für nix-openclaw den agent-first [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` und `openclaw update --dry-run` bleiben schreibgeschützt.
</Note>

<Warning>
Downgrades erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.
</Warning>

## `update status`

Zeigt den aktiven Update-Kanal + Git-Tag/-Branch/-SHA (für Quell-Checkouts) sowie die Update-Verfügbarkeit an.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: gibt maschinenlesbares Status-JSON aus.
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3s).

## `update repair`

Führt die Update-Finalisierung erneut aus, nachdem das Core-Paket bereits geändert wurde, spätere
Reparaturarbeiten aber nicht sauber abgeschlossen wurden. Dies ist der unterstützte Wiederherstellungspfad, wenn
`openclaw update` das neue Core-Paket installiert hat, aber Plugin-Synchronisierung nach dem Core-Update,
verwaltete npm-Plugin-Metadaten, Registry-Aktualisierung oder Doctor-Reparatur noch
konvergieren müssen.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Optionen:

- `--channel <stable|beta|dev>`: speichert den Update-Kanal vor der Reparatur und
  führt die Plugin-Konvergenz gegen diesen Kanal aus.
- `--json`: gibt maschinenlesbares Finalisierungs-JSON aus.
- `--timeout <seconds>`: Timeout für Reparaturschritte (Standard `1800`).
- `--yes`: überspringt Bestätigungsabfragen.
- `--acknowledge-clawhub-risk`: nach Prüfung der Vertrauenswarnungen für Community-ClawHub
  kann die Plugin-Konvergenz während der Reparatur ohne interaktive Abfrage fortgesetzt werden.
  Offizielle ClawHub-Pakete und gebündelte OpenClaw-Plugin-Quellen umgehen diese
  Release-Vertrauensabfrage.
- `--no-restart`: wird aus Gründen der Parität mit dem Update-Befehl akzeptiert; Repair startet das
  Gateway nie neu.

`openclaw update repair` führt `openclaw doctor --fix` aus, lädt die reparierte
Konfiguration und Installationsdatensätze neu, synchronisiert verfolgte Plugins für den aktiven Update-Kanal,
aktualisiert verwaltete npm-Plugin-Installationen, repariert fehlende konfigurierte Plugin-Payloads,
aktualisiert die Plugin-Registry und schreibt die konvergierten Installationsdatensatz-Metadaten.
Es installiert kein neues Core-Paket und startet das Gateway nicht neu.

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Update-Kanals und Bestätigung, ob das Gateway nach dem Update
neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen, wird
angeboten, einen zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Update-Schritt (Standard `1800`)

## Was es tut

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode synchron:

- `dev` → stellt einen Git-Checkout sicher (Standard: `~/openclaw` oder `$OPENCLAW_HOME/openclaw`, wenn
  `OPENCLAW_HOME` gesetzt ist; überschreiben mit `OPENCLAW_GIT_DIR`),
  aktualisiert ihn und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt das npm-dist-tag `beta`, fällt aber auf `latest` zurück, wenn Beta
  fehlt oder älter als die aktuelle Stable-Veröffentlichung ist.

Der Gateway-Core-Auto-Updater (wenn über die Konfiguration aktiviert) startet den CLI-Update-Pfad
außerhalb des laufenden Gateway-Request-Handlers. Control-Plane-`update.run`-
Paketmanager-Updates und überwachte Git-Checkout-Updates verwenden ebenfalls eine
Managed-Service-Übergabe, statt den Paketbaum zu ersetzen oder `dist/` im laufenden
Gateway-Prozess neu zu bauen. Das Gateway startet einen getrennten Helfer,
beendet sich, und der Helfer führt den normalen CLI-Pfad `openclaw update --yes --json`
außerhalb des Gateway-Prozessbaums aus. Wenn diese Übergabe nicht verfügbar ist,
gibt `update.run` eine strukturierte Antwort mit dem sicheren Shell-Befehl zurück, der
manuell auszuführen ist.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion auf,
bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestufte
Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix, prüft
dort das gepackte `dist`-Inventar und tauscht dann diesen sauberen Paketbaum in das
echte globale Präfix ein. Wenn die Prüfung fehlschlägt, werden Doctor nach dem Update,
Plugin-Synchronisierung und Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt.
Auch wenn die installierte Version bereits dem Ziel entspricht, aktualisiert der Befehl
die globale Paketinstallation, führt dann Plugin-Synchronisierung, eine Aktualisierung der
Core-Befehlsvervollständigung und Neustartarbeiten aus. Dadurch bleiben gepackte Sidecars und
kanaleigene Plugin-Datensätze mit dem installierten OpenClaw-Build synchron, während vollständige
Neuaufbauten der Plugin-Befehlsvervollständigung expliziten `openclaw completion --write-state`-Läufen
überlassen bleiben.

Wenn ein lokaler verwalteter Gateway-Dienst installiert und Neustart aktiviert ist,
stoppen Paketmanager- und Git-Checkout-Updates den laufenden Dienst, bevor
der Paketbaum ersetzt oder Checkout-/Build-Ausgaben verändert werden. Der Updater
aktualisiert dann die Dienstmetadaten aus der aktualisierten Installation, startet den
Dienst neu und prüft das neu gestartete Gateway, bevor
`Gateway: restarted and verified.` gemeldet wird. Paketmanager-Updates prüfen zusätzlich,
dass das neu gestartete Gateway die erwartete Paketversion meldet; Git-Checkout-Updates
prüfen Gateway-Zustand und Dienstbereitschaft nach dem Neuaufbau. Unter macOS prüft die
Prüfung nach dem Update außerdem, dass der LaunchAgent für das aktive
Profil geladen/ausgeführt wird und der konfigurierte loopback-Port gesund ist. Wenn die plist installiert ist,
launchd sie aber nicht überwacht, bootstrapt OpenClaw den LaunchAgent
automatisch erneut und führt dann die Health-/Versions-/Kanal-Bereitschaftsprüfungen erneut aus. Ein frischer
Bootstrap lädt den RunAtLoad-Job direkt, sodass die Update-Wiederherstellung das neu gestartete Gateway
nicht sofort mit `kickstart -k` anstößt. Wenn das Gateway weiterhin nicht
gesund wird, endet der Befehl mit einem Nicht-Null-Code und gibt den Neustart-Logpfad
sowie explizite Anweisungen zu Neustart, Neuinstallation und Paket-Rollback aus. Wenn der Neustart
nicht ausgeführt werden kann, gibt der Befehl `Gateway: restart skipped (...)` oder
`Gateway: restart failed: ...` mit einem Hinweis auf manuelles `openclaw gateway restart` aus.
Mit `--no-restart` wird der Paketaustausch oder Git-Neuaufbau weiterhin ausgeführt, aber der
verwaltete Dienst wird nicht gestoppt oder neu gestartet, sodass das laufende Gateway alten
Code behalten kann, bis Sie es manuell neu starten.

### Antwortformat der Control Plane

Wenn `update.run` über die Gateway-Control-Plane bei einer
Paketmanager-Installation oder einem überwachten Git-Checkout aufgerufen wird, meldet der Handler die
Initiierung der Übergabe getrennt vom CLI-Update, das nach dem Beenden des
Gateways fortgesetzt wird:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` und
  `handoff.status: "started"` bedeuten, dass das Gateway die Managed-Service-
  Übergabe erstellt und seinen eigenen Neustart geplant hat, damit der getrennte Helfer
  `openclaw update --yes --json` außerhalb des laufenden Dienstprozesses ausführen kann.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` und
  `handoff.status: "unavailable"` bedeuten, dass OpenClaw keine überwachende
  Dienstgrenze und dauerhafte Dienstidentität für eine sichere Übergabe finden konnte. Zum
  Beispiel erfordert die systemd-Übergabe die OpenClaw-Unit-Identität
  (`OPENCLAW_SYSTEMD_UNIT`), nicht nur umgebende systemd-Prozessmarker. Die
  Antwort enthält `handoff.command`, den Shell-Befehl, der außerhalb des
  Gateways auszuführen ist.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` bedeutet, dass das
  Gateway versucht hat, die Übergabe zu erstellen, den getrennten Helfer aber nicht starten konnte.

Die `sentinel`-Payload wird weiterhin geschrieben, bevor das Gateway beendet wird, und die CLI-
Übergabe aktualisiert denselben Neustart-Sentinel, nachdem die Health-Checks des
Managed-Service-Neustarts abgeschlossen sind. Während der Übergabe kann der Sentinel
`stats.reason: "restart-health-pending"` ohne Erfolgsfortsetzung tragen; das
neu gestartete Gateway pollt ihn weiter und löst die Fortsetzung erst aus, nachdem die CLI
die Dienstgesundheit verifiziert und den Sentinel mit dem finalen `ok`-
Ergebnis neu geschrieben hat. `openclaw status` und `openclaw status --all` zeigen eine Zeile `Update restart`,
während dieser Sentinel aussteht oder fehlgeschlagen ist, und `update.status` aktualisiert und
gibt den neuesten Sentinel zurück.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: den neuesten Nicht-Beta-Tag auschecken, dann bauen und Doctor ausführen.
- `beta`: den neuesten `-beta`-Tag bevorzugen, aber auf den neuesten Stable-Tag zurückfallen, wenn Beta fehlt oder älter ist.
- `dev`: `main` auschecken, dann fetchen und rebasen.

### Update-Schritte

<Steps>
  <Step title="Saubere Worktree prüfen">
    Erfordert, dass keine nicht committeten Änderungen vorhanden sind.
  </Step>
  <Step title="Kanal wechseln">
    Wechselt zum ausgewählten Kanal (Tag oder Branch).
  </Step>
  <Step title="Upstream abrufen">
    Nur für Entwicklung.
  </Step>
  <Step title="Preflight-Build (nur Entwicklung)">
    Führt den TypeScript-Build in einer temporären Worktree aus. Wenn die aktuelle Spitze fehlschlägt, geht der Prozess bis zu 10 Commits zurück, um den neuesten buildbaren Commit zu finden. Setzen Sie `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, um während dieses Preflight auch Lint auszuführen; Lint läuft im eingeschränkten seriellen Modus, weil Hosts für Benutzer-Updates oft kleiner sind als CI-Runner.
  </Step>
  <Step title="Rebase">
    Führt ein Rebase auf den ausgewählten Commit aus (nur Entwicklung).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repos. Bei pnpm-Checkouts bootstrapt der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann als temporärer Fallback mit `npm install pnpm@11`), statt `npm run build` innerhalb eines pnpm-Workspace auszuführen.
  </Step>
  <Step title="Control UI bauen">
    Baut den Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` wird als abschließende Prüfung für sichere Updates ausgeführt.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Entwicklung verwendet gebündelte Plugins; Stable und Beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

Im Beta-Update-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der
Standard-/Latest-Linie folgen, zuerst eine Plugin-`@beta`-Version. Wenn das Plugin keine
Beta-Version hat, fällt OpenClaw auf die aufgezeichnete Standard-/Latest-Spezifikation zurück und meldet
dies als Warnung. Bei npm-Plugins fällt OpenClaw auch dann zurück, wenn das Beta-
Paket existiert, aber die Installationsvalidierung fehlschlägt. Diese Plugin-Fallback-Warnungen lassen
das Core-Update nicht fehlschlagen. Exakte Versionen und explizite Tags werden nicht
umgeschrieben.

<Warning>
Wenn ein exakt gepinntes npm-Plugin-Update zu einem Artefakt aufgelöst wird, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` dieses Plugin-Artefakt-Update ab, statt es zu installieren. Installieren oder aktualisieren Sie das Plugin nur dann explizit neu, nachdem Sie verifiziert haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Plugin-Synchronisierungsfehler nach dem Update, die auf ein verwaltetes Plugin begrenzt sind und die der Synchronisierungspfad umgehen kann (z. B. eine nicht erreichbare npm-Registry für ein nicht essenzielles Plugin), werden als Warnungen gemeldet, nachdem das Core-Update erfolgreich war. Das JSON-Ergebnis behält für das Update auf oberster Ebene `status: "ok"` bei und meldet `postUpdate.plugins.status: "warning"` mit Hinweisen zu `openclaw update repair` und `openclaw plugins inspect <id> --runtime --json`. Unerwartete Updater- oder Synchronisierungsausnahmen lassen das Update-Ergebnis weiterhin fehlschlagen. Beheben Sie den Plugin-Installations- oder Update-Fehler und führen Sie dann `openclaw update repair` erneut aus.

Nach dem Synchronisierungsschritt pro Plugin führt `openclaw update` einen obligatorischen **Post-Core-Konvergenz**-Durchlauf aus, bevor der Gateway neu gestartet wird: Er repariert fehlende konfigurierte Plugin-Payloads, validiert jeden _aktiven_ nachverfolgten Installationsdatensatz auf der Festplatte und verifiziert statisch, dass dessen `package.json` parsebar ist (und dass ein explizit deklariertes `main` existiert). Fehler aus diesem Durchlauf — und ein ungültiger OpenClaw-Konfigurations-Snapshot — geben `postUpdate.plugins.status: "error"` zurück und setzen den Update-`status` auf oberster Ebene auf `"error"`, sodass `openclaw update` mit einem Nicht-Null-Code beendet wird und der Gateway _nicht_ mit einem unverifizierten Plugin-Set neu gestartet wird. Der Fehler enthält strukturierte `postUpdate.plugins.warnings[].guidance`-Zeilen, die für die Nachverfolgung auf `openclaw update repair` und `openclaw plugins inspect <id> --runtime --json` verweisen. Deaktivierte Plugin-Einträge und Datensätze, die keine mit vertrauenswürdiger Quelle verknüpften offiziellen Synchronisierungsziele sind, werden hier übersprungen. Das entspricht der `skipDisabledPlugins`-Policy, die von der Prüfung auf fehlende Payloads verwendet wird, sodass ein veralteter deaktivierter Plugin-Datensatz ein ansonsten gültiges Update nicht blockieren kann.

Wenn der aktualisierte Gateway startet, ist das Laden von Plugins nur verifizierend: Der Start führt keine
Paketmanager aus und verändert keine Abhängigkeitsbäume. Package-manager-`update.run`-
Neustarts werden an den von der CLI verwalteten Dienstpfad übergeben, sodass der Paketaustausch
außerhalb des alten Gateway-Prozesses erfolgt und die Dienst-Health-Checks entscheiden, ob das
Update als abgeschlossen gemeldet werden kann.

Wenn der pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater frühzeitig mit einem paketmanager-spezifischen Fehler, statt `npm run build` im Checkout zu versuchen.
</Note>

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet an, auf Git-Checkouts zuerst Update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisierung](/de/install/updating)
- [CLI-Referenz](/de/cli)
