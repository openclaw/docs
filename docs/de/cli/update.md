---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen das Verhalten der `--update`-Kurzschreibweise verstehen
summary: CLI-Referenz für `openclaw update` (relativ sichere Quellcode-Aktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-03T21:29:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aktualisieren Sie OpenClaw sicher und wechseln Sie zwischen Stable-, Beta- und Dev-Kanälen.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Updates über den Paketmanager-Ablauf in [Aktualisierung](/de/install/updating).

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

- `--no-restart`: Überspringt den Neustart des Gateway-Diensts nach einem erfolgreichen Update. Paketmanager-Updates, die den Gateway neu starten, prüfen, ob der neu gestartete Dienst die erwartete aktualisierte Version meldet, bevor der Befehl erfolgreich abgeschlossen wird.
- `--channel <stable|beta|dev>`: Legt den Update-Kanal fest (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: Überschreibt das Paketziel nur für dieses Update. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: Zeigt die geplanten Update-Aktionen (Kanal/Tag/Ziel/Neustart-Ablauf) an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: Gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.integrityDrifts`, wenn beim Plugin-Sync nach dem Update
  Abweichungen bei npm-Plugin-Artefakten erkannt werden.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1800 s).
- `--yes`: Überspringt Bestätigungsabfragen (zum Beispiel Downgrade-Bestätigung).

`openclaw update` hat kein `--verbose`-Flag. Verwenden Sie `--dry-run`, um die
geplanten Kanal-/Tag-/Installations-/Neustart-Aktionen vorab anzuzeigen,
`--json` für maschinenlesbare Ergebnisse und `openclaw update status --json`,
wenn Sie nur Kanal- und Verfügbarkeitsdetails benötigen. Wenn Sie Gateway-Logs
rund um ein Update debuggen, sind Konsolen-Ausführlichkeit und Datei-Log-Level
getrennt: Gateway `--verbose` beeinflusst Terminal-/WebSocket-Ausgaben,
während Datei-Logs `logging.level: "debug"` oder `"trace"` in der Konfiguration
erfordern. Siehe [Gateway-Logging](/de/gateway/logging).

<Warning>
Downgrades erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.
</Warning>

## `update status`

Zeigt den aktiven Update-Kanal + Git-Tag/Branch/SHA (bei Quell-Checkouts) sowie die Update-Verfügbarkeit an.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: Gibt maschinenlesbares Status-JSON aus.
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3 s).

## `update wizard`

Interaktiver Ablauf zum Auswählen eines Update-Kanals und zum Bestätigen, ob der Gateway
nach dem Update neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen,
wird angeboten, einen zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Update-Schritt (Standard `1800`)

## Was es macht

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode synchron:

- `dev` → stellt einen Git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert ihn und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt den npm-dist-tag `beta`, fällt aber auf `latest` zurück, wenn beta
  fehlt oder älter als die aktuelle Stable-Version ist.

Der automatische Updater des Gateway-Kerns (wenn per Konfiguration aktiviert) startet den CLI-Update-Pfad
außerhalb des Live-Gateway-Request-Handlers. Control-Plane-`update.run`-Paketmanager-
Updates erzwingen nach dem Pakettausch einen nicht aufgeschobenen Update-Neustart ohne Cooldown,
da der alte Gateway-Prozess möglicherweise noch In-Memory-Chunks hat, die auf
Dateien zeigen, die vom neuen Paket entfernt wurden.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion auf,
bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestaffelte
Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix, prüft
dort das paketierte `dist`-Inventar und tauscht dann diesen sauberen Paketbaum in das
echte globale Präfix ein. Wenn die Prüfung fehlschlägt, werden Doctor nach dem Update,
Plugin-Sync und Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die installierte Version
bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation,
führt dann Plugin-Sync, eine Aktualisierung der Core-Command-Completion und Neustartarbeiten aus. Dadurch
bleiben paketierte Sidecars und kanalverwaltete Plugin-Datensätze mit dem
installierten OpenClaw-Build synchron, während vollständige Neuaufbauten der Plugin-Command-Completion
expliziten `openclaw completion --write-state`-Läufen vorbehalten bleiben.

Wenn ein lokaler verwalteter Gateway-Dienst installiert und Neustart aktiviert ist,
stoppen Paketmanager-Updates den laufenden Dienst, bevor der Paketbaum ersetzt wird,
aktualisieren dann die Dienstmetadaten aus der aktualisierten Installation, starten den
Dienst neu und prüfen, ob der neu gestartete Gateway die erwartete Version meldet,
bevor Erfolg gemeldet wird. Unter macOS prüft die Nach-Update-Prüfung außerdem, ob der LaunchAgent
für das aktive Profil geladen/ausgeführt wird und der konfigurierte loopback-Port
funktionsfähig ist. Wenn die plist installiert ist, aber nicht von launchd überwacht wird, bootstrapt OpenClaw
den LaunchAgent automatisch neu und führt dann die
Bereitschaftsprüfungen für Zustand/Version/Kanal erneut aus. Ein frischer Bootstrap lädt den RunAtLoad-
Job direkt, daher führt die Update-Wiederherstellung nicht sofort `kickstart -k` für den neu
gestarteten Gateway aus. Wenn der Gateway weiterhin nicht gesund wird, beendet sich der Befehl
mit einem Fehlercode ungleich null und gibt den Neustart-Logpfad sowie explizite Anweisungen
für Neustart, Neuinstallation und Paket-Rollback aus. Mit `--no-restart`
läuft der Paketaustausch weiterhin, aber der verwaltete Dienst wird nicht gestoppt oder
neu gestartet, sodass der laufende Gateway alten Code behalten kann, bis Sie ihn
manuell neu starten.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: Checkt den neuesten Nicht-Beta-Tag aus, baut anschließend und führt Doctor aus.
- `beta`: Bevorzugt den neuesten `-beta`-Tag, fällt aber auf den neuesten Stable-Tag zurück, wenn beta fehlt oder älter ist.
- `dev`: Checkt `main` aus, führt dann Fetch und Rebase aus.

### Update-Schritte

<Steps>
  <Step title="Sauberen Worktree prüfen">
    Erfordert, dass keine nicht committeten Änderungen vorhanden sind.
  </Step>
  <Step title="Kanal wechseln">
    Wechselt zum ausgewählten Kanal (Tag oder Branch).
  </Step>
  <Step title="Upstream abrufen">
    Nur Dev.
  </Step>
  <Step title="Preflight-Build (nur Dev)">
    Führt Lint und TypeScript-Build in einem temporären Worktree aus. Wenn der Tip fehlschlägt, geht es bis zu 10 Commits zurück, um den neuesten sauberen Build zu finden.
  </Step>
  <Step title="Rebase">
    Führt einen Rebase auf den ausgewählten Commit aus (nur Dev).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repos. Bei pnpm-Checkouts bootstrapt der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann als Fallback über ein temporäres `npm install pnpm@10`), anstatt `npm run build` innerhalb eines pnpm-Workspaces auszuführen.
  </Step>
  <Step title="Control UI bauen">
    Baut den Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` läuft als abschließende Safe-Update-Prüfung.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; stable und beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

Im Beta-Update-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der
default/latest-Linie folgen, zuerst ein Plugin-Release `@beta`. Wenn das Plugin kein
Beta-Release hat, fällt OpenClaw auf die aufgezeichnete default/latest-Spezifikation zurück. Exakte
Versionen und explizite Tags werden nicht umgeschrieben.

<Warning>
Wenn ein exakt gepinntes npm-Plugin-Update zu einem Artefakt aufgelöst wird, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` dieses Plugin-Artefakt-Update ab, anstatt es zu installieren. Installieren oder aktualisieren Sie das Plugin nur dann explizit neu, nachdem Sie geprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler beim Plugin-Sync nach dem Update lassen das Update-Ergebnis fehlschlagen und stoppen nachgelagerte Neustartarbeiten. Beheben Sie den Plugin-Installations- oder Update-Fehler und führen Sie dann `openclaw update` erneut aus.

Wenn der aktualisierte Gateway startet, ist das Laden von Plugins nur eine Prüfung: Der Start führt keine Paketmanager aus und verändert keine Abhängigkeitsbäume. Paketmanager-`update.run`-Neustarts umgehen die normale Idle-Aufschiebung und den Neustart-Cooldown, nachdem der Paketbaum ausgetauscht wurde, sodass der alte Prozess entfernte Chunks nicht weiter per Lazy Loading laden kann.

Wenn der pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater früh mit einem paketmanager-spezifischen Fehler, anstatt `npm run build` innerhalb des Checkouts zu versuchen.
</Note>

## `--update`-Kurzform

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet bei Git-Checkouts an, zuerst update auszuführen)
- [Development-Kanäle](/de/install/development-channels)
- [Aktualisierung](/de/install/updating)
- [CLI-Referenz](/de/cli)
