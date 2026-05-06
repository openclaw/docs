---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen verstehen, wie sich die Kurzschreibweise `--update` verhält
summary: CLI-Referenz für `openclaw update` (relativ sichere Quellcode-Aktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-06T06:42:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aktualisieren Sie OpenClaw sicher und wechseln Sie zwischen den Kanälen stable/beta/dev.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Updates über den Paketmanager-Ablauf unter [Aktualisieren](/de/install/updating).

## Verwendung

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Optionen

- `--no-restart`: überspringt den Neustart des Gateway-Dienstes nach einem erfolgreichen Update. Paketmanager-Updates, die das Gateway neu starten, überprüfen, dass der neu gestartete Dienst die erwartete aktualisierte Version meldet, bevor der Befehl erfolgreich abgeschlossen wird.
- `--channel <stable|beta|dev>`: legt den Update-Kanal fest (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: überschreibt das Paketziel nur für dieses Update. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: zeigt geplante Update-Aktionen (Kanal/Tag/Ziel/Neustart-Ablauf) an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.warnings`, wenn beschädigte oder nicht ladbare verwaltete Plugins
  nach erfolgreichem Core-Update repariert werden müssen, und `postUpdate.plugins.integrityDrifts`,
  wenn beim Plugin-Sync nach dem Update Abweichungen bei npm-Plugin-Artefakten erkannt werden.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1800s).
- `--yes`: überspringt Bestätigungsabfragen (zum Beispiel Downgrade-Bestätigung).

`openclaw update` hat kein `--verbose`-Flag. Verwenden Sie `--dry-run`, um
die geplanten Kanal-/Tag-/Installations-/Neustart-Aktionen anzuzeigen, `--json` für maschinenlesbare
Ergebnisse und `openclaw update status --json`, wenn Sie nur Kanal- und
Verfügbarkeitsdetails benötigen. Wenn Sie Gateway-Logs rund um ein Update debuggen,
sind Konsolenausführlichkeit und Datei-Log-Level getrennt: Gateway `--verbose` wirkt sich auf
Terminal-/WebSocket-Ausgabe aus, während Datei-Logs `logging.level: "debug"` oder
`"trace"` in der Konfiguration erfordern. Siehe [Gateway-Logging](/de/gateway/logging).

<Warning>
Downgrades erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.
</Warning>

## `update status`

Zeigt den aktiven Update-Kanal + Git-Tag/-Branch/-SHA (für Source-Checkouts) sowie die Update-Verfügbarkeit an.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: gibt maschinenlesbares Status-JSON aus.
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3s).

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Update-Kanals und zur Bestätigung, ob das Gateway
nach dem Update neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen,
wird angeboten, einen zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Update-Schritt (Standard `1800`)

## Was es tut

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode abgestimmt:

- `dev` → stellt einen Git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert ihn und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt den npm-Dist-Tag `beta`, fällt aber auf `latest` zurück, wenn beta
  fehlt oder älter als die aktuelle stabile Version ist.

Der Gateway-Core-Auto-Updater (wenn über die Konfiguration aktiviert) startet den CLI-Update-Pfad
außerhalb des aktiven Gateway-Request-Handlers. Control-Plane-`update.run`-Paketmanager-
Updates erzwingen nach dem Pakettausch einen nicht aufgeschobenen Update-Neustart ohne Cooldown,
weil der alte Gateway-Prozess möglicherweise noch In-Memory-Chunks enthält, die auf
Dateien verweisen, die vom neuen Paket entfernt wurden.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion
auf, bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestufte
Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix, überprüft
dort das paketierte `dist`-Inventar und tauscht dann diesen sauberen Paketbaum in das
echte globale Präfix. Wenn die Überprüfung fehlschlägt, werden Doctor nach dem Update, Plugin-Sync und
Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die installierte Version
bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation,
führt dann Plugin-Sync, eine Aktualisierung der Core-Befehlsvervollständigung und Neustartarbeiten aus. Dadurch
bleiben paketierte Sidecars und kanalverwaltete Plugin-Datensätze mit dem
installierten OpenClaw-Build abgestimmt, während vollständige Neuaufbauten der Plugin-Befehlsvervollständigung
expliziten `openclaw completion --write-state`-Ausführungen vorbehalten bleiben.

Wenn ein lokaler verwalteter Gateway-Dienst installiert ist und Neustart aktiviert ist,
stoppen Paketmanager-Updates den laufenden Dienst vor dem Ersetzen des Paketbaums,
aktualisieren dann die Dienstmetadaten aus der aktualisierten Installation, starten den
Dienst neu und überprüfen, dass das neu gestartete Gateway die erwartete Version meldet, bevor
Erfolg gemeldet wird. Unter macOS überprüft die Prüfung nach dem Update außerdem, dass der LaunchAgent
für das aktive Profil geladen/ausgeführt wird und der konfigurierte Loopback-Port
gesund ist. Wenn die plist installiert ist, launchd sie aber nicht überwacht, bootstrapt OpenClaw
den LaunchAgent automatisch erneut und führt dann die
Bereitschaftsprüfungen für Zustand/Version/Kanal erneut aus. Ein frischer Bootstrap lädt den RunAtLoad-
Job direkt, sodass die Update-Wiederherstellung das neu
gestartete Gateway nicht sofort per `kickstart -k` neu startet. Wenn das Gateway weiterhin nicht gesund wird,
endet der Befehl mit einem Nicht-Null-Code und gibt den Neustart-Logpfad sowie explizite Anweisungen für Neustart,
Neuinstallation und Paket-Rollback aus. Mit `--no-restart`
wird der Paketersatz weiterhin ausgeführt, aber der verwaltete Dienst wird nicht gestoppt oder
neu gestartet, sodass das laufende Gateway alten Code beibehalten kann, bis Sie es
manuell neu starten.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: checkt den neuesten Nicht-Beta-Tag aus, baut und führt dann Doctor aus.
- `beta`: bevorzugt den neuesten `-beta`-Tag, fällt aber auf den neuesten stabilen Tag zurück, wenn beta fehlt oder älter ist.
- `dev`: checkt `main` aus, führt dann Fetch und Rebase aus.

### Update-Schritte

<Steps>
  <Step title="Sauberen Worktree überprüfen">
    Erfordert, dass keine nicht committeten Änderungen vorhanden sind.
  </Step>
  <Step title="Kanal wechseln">
    Wechselt zum ausgewählten Kanal (Tag oder Branch).
  </Step>
  <Step title="Upstream abrufen">
    Nur Dev.
  </Step>
  <Step title="Preflight-Build (nur dev)">
    Führt den TypeScript-Build in einem temporären Worktree aus. Wenn die Spitze fehlschlägt, geht es bis zu 10 Commits zurück, um den neuesten baubaren Commit zu finden. Setzen Sie `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, um während dieses Preflight auch Lint auszuführen; Lint läuft in einem eingeschränkten seriellen Modus, da Update-Hosts von Benutzern oft kleiner sind als CI-Runner.
  </Step>
  <Step title="Rebase">
    Rebast auf den ausgewählten Commit (nur dev).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repos. Bei pnpm-Checkouts bootstrapt der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann als Fallback mit temporärem `npm install pnpm@10`), statt `npm run build` innerhalb eines pnpm-Workspaces auszuführen.
  </Step>
  <Step title="Control UI bauen">
    Baut das Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` läuft als finale Prüfung für sichere Updates.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; stable und beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

Auf dem Beta-Update-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der
Default-/Latest-Linie folgen, zuerst ein Plugin-`@beta`-Release. Wenn das Plugin kein
Beta-Release hat, fällt OpenClaw auf die aufgezeichnete Default-/Latest-Spezifikation zurück. Bei npm-
Plugins fällt OpenClaw auch zurück, wenn das Beta-Paket existiert, aber die Installationsvalidierung
fehlschlägt. Exakte Versionen und explizite Tags werden nicht umgeschrieben.

<Warning>
Wenn ein exakt gepinntes npm-Plugin-Update auf ein Artefakt auflöst, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` dieses Plugin-Artefakt-Update ab, statt es zu installieren. Installieren oder aktualisieren Sie das Plugin nur dann explizit neu, nachdem Sie überprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Plugin-Sync-Fehler nach dem Update, die auf ein verwaltetes Plugin begrenzt sind, werden nach erfolgreichem Core-Update als Warnungen gemeldet. Das JSON-Ergebnis behält den Top-Level-Update-`status: "ok"` bei und meldet `postUpdate.plugins.status: "warning"` mit Hinweisen zu `openclaw doctor --fix` und `openclaw plugins inspect <id> --runtime --json`. Unerwartete Updater- oder Sync-Ausnahmen lassen das Update-Ergebnis weiterhin fehlschlagen. Beheben Sie den Plugin-Installations- oder Update-Fehler und führen Sie dann erneut `openclaw doctor --fix` oder `openclaw update` aus.

Wenn das aktualisierte Gateway startet, ist das Laden von Plugins nur verifizierend: Der Start führt keine Paketmanager aus und verändert keine Abhängigkeitsbäume. Paketmanager-`update.run`-Neustarts umgehen die normale Leerlaufaufschiebung und den Neustart-Cooldown, nachdem der Paketbaum ausgetauscht wurde, sodass der alte Prozess entfernte Chunks nicht weiter lazy laden kann.

Wenn der pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater früh mit einem paketmanager-spezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.
</Note>

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet an, auf Git-Checkouts zuerst ein Update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
