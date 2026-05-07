---
read_when:
    - Sie möchten eine Quellcode-Arbeitskopie sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen das Verhalten der Kurzschreibweise `--update` verstehen
summary: CLI-Referenz für `openclaw update` (relativ sichere Quellcode-Aktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-07T13:15:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aktualisieren Sie OpenClaw sicher und wechseln Sie zwischen Stable-, Beta- und Dev-Kanälen.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Aktualisierungen über den Paketmanager-Ablauf in [Aktualisieren](/de/install/updating).

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

- `--no-restart`: Überspringt den Neustart des Gateway-Dienstes nach einer erfolgreichen Aktualisierung. Paketmanager-Aktualisierungen, die das Gateway neu starten, prüfen, ob der neu gestartete Dienst die erwartete aktualisierte Version meldet, bevor der Befehl erfolgreich abgeschlossen wird.
- `--channel <stable|beta|dev>`: Legt den Aktualisierungskanal fest (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: Überschreibt das Paketziel nur für diese Aktualisierung. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: Zeigt die geplanten Aktualisierungsaktionen (Kanal/Tag/Ziel/Neustartablauf) an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: Gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.warnings`, wenn beschädigte oder nicht ladbare verwaltete Plugins
  nach erfolgreicher Kernaktualisierung repariert werden müssen, und `postUpdate.plugins.integrityDrifts`,
  wenn während der Plugin-Synchronisierung nach der Aktualisierung eine Abweichung bei npm-Plugin-Artefakten erkannt wird.
- `--timeout <seconds>`: Zeitlimit pro Schritt (Standard ist 1800 s).
- `--yes`: Überspringt Bestätigungsabfragen (zum Beispiel die Bestätigung eines Downgrades).

`openclaw update` hat kein `--verbose`-Flag. Verwenden Sie `--dry-run`, um
die geplanten Kanal-/Tag-/Installations-/Neustartaktionen vorab anzuzeigen, `--json` für maschinenlesbare
Ergebnisse und `openclaw update status --json`, wenn Sie nur Kanal- und
Verfügbarkeitsdetails benötigen. Wenn Sie Gateway-Logs rund um eine Aktualisierung debuggen,
sind Konsolenausführlichkeit und Datei-Log-Level getrennt: Gateway `--verbose` wirkt sich auf
Terminal-/WebSocket-Ausgaben aus, während Datei-Logs `logging.level: "debug"` oder
`"trace"` in der Konfiguration erfordern. Siehe [Gateway-Logging](/de/gateway/logging).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind verändernde `openclaw update`-Ausführungen deaktiviert. Aktualisieren Sie stattdessen die Nix-Quelle oder die Flake-Eingabe für diese Installation; für nix-openclaw verwenden Sie den agent-first-[Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` und `openclaw update --dry-run` bleiben schreibgeschützt.
</Note>

<Warning>
Downgrades erfordern eine Bestätigung, weil ältere Versionen die Konfiguration beschädigen können.
</Warning>

## `update status`

Zeigt den aktiven Aktualisierungskanal + Git-Tag/-Branch/-SHA (für Quellcode-Checkouts) sowie die Verfügbarkeit von Aktualisierungen an.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: Gibt maschinenlesbares Status-JSON aus.
- `--timeout <seconds>`: Zeitlimit für Prüfungen (Standard ist 3 s).

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Aktualisierungskanals und zur Bestätigung, ob das Gateway
nach der Aktualisierung neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen,
wird angeboten, einen zu erstellen.

Optionen:

- `--timeout <seconds>`: Zeitlimit für jeden Aktualisierungsschritt (Standard `1800`)

## Funktionsweise

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode synchron:

- `dev` → stellt einen Git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert ihn und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt den npm-Dist-Tag `beta`, fällt aber auf `latest` zurück, wenn beta
  fehlt oder älter als das aktuelle Stable-Release ist.

Der automatische Gateway-Kern-Updater (wenn über die Konfiguration aktiviert) startet den CLI-Aktualisierungspfad
außerhalb des laufenden Gateway-Request-Handlers. Control-Plane-`update.run`-Paketmanager-
Aktualisierungen erzwingen nach dem Pakettausch einen nicht verzögerten Aktualisierungsneustart ohne Abklingzeit,
weil der alte Gateway-Prozess möglicherweise noch In-Memory-Chunks hat, die auf
Dateien zeigen, die durch das neue Paket entfernt wurden.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion auf,
bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestufte
Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix, prüft
dort das gepackte `dist`-Inventar und tauscht dann diesen sauberen Paketbaum in das
echte globale Präfix. Wenn die Prüfung fehlschlägt, werden Post-Update-Doctor, Plugin-Synchronisierung und
Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die installierte Version
bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation,
führt dann Plugin-Synchronisierung, eine Aktualisierung der Kernbefehlsvervollständigung und Neustartarbeiten aus. Dadurch
bleiben gepackte Sidecars und kanalverwaltete Plugin-Datensätze mit dem
installierten OpenClaw-Build synchron, während vollständige Neuaufbauten der Plugin-Befehlsvervollständigung
expliziten `openclaw completion --write-state`-Ausführungen überlassen bleiben.

Wenn ein lokaler verwalteter Gateway-Dienst installiert und Neustart aktiviert ist,
stoppen Paketmanager-Aktualisierungen den laufenden Dienst, bevor der Paketbaum ersetzt wird,
aktualisieren dann die Dienstmetadaten aus der aktualisierten Installation, starten den
Dienst neu und prüfen, ob das neu gestartete Gateway die erwartete Version meldet, bevor
Erfolg gemeldet wird. Unter macOS prüft die Post-Update-Prüfung außerdem, ob der LaunchAgent
für das aktive Profil geladen/ausgeführt wird und der konfigurierte Loopback-Port
fehlerfrei ist. Wenn die plist installiert ist, aber launchd sie nicht überwacht, führt OpenClaw
automatisch ein erneutes Bootstrap des LaunchAgent aus und wiederholt dann die
Health-/Versions-/Kanal-Bereitschaftsprüfungen. Ein frisches Bootstrap lädt den RunAtLoad-
Job direkt, sodass die Aktualisierungswiederherstellung das neu gestartete Gateway nicht sofort mit
`kickstart -k` anstößt. Wenn das Gateway weiterhin nicht fehlerfrei wird, beendet sich der Befehl
mit einem von null verschiedenen Status und gibt den Pfad zum Neustart-Log sowie explizite Anweisungen für Neustart, Neuinstallation und
Paket-Rollback aus. Mit `--no-restart`
läuft der Paketersatz trotzdem, aber der verwaltete Dienst wird nicht gestoppt oder
neu gestartet, sodass das laufende Gateway alten Code behalten kann, bis Sie es
manuell neu starten.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: Checkt den neuesten Nicht-Beta-Tag aus und führt dann Build und Doctor aus.
- `beta`: Bevorzugt den neuesten `-beta`-Tag, fällt aber auf den neuesten Stable-Tag zurück, wenn beta fehlt oder älter ist.
- `dev`: Checkt `main` aus, führt dann Fetch und Rebase aus.

### Aktualisierungsschritte

<Steps>
  <Step title="Sauberen Worktree prüfen">
    Erfordert keine nicht committeten Änderungen.
  </Step>
  <Step title="Kanal wechseln">
    Wechselt zum ausgewählten Kanal (Tag oder Branch).
  </Step>
  <Step title="Upstream abrufen">
    Nur Dev.
  </Step>
  <Step title="Preflight-Build (nur Dev)">
    Führt den TypeScript-Build in einem temporären Worktree aus. Wenn die Spitze fehlschlägt, geht der Updater bis zu 10 Commits zurück, um den neuesten buildbaren Commit zu finden. Setzen Sie `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, um während dieses Preflights auch Lint auszuführen; Lint läuft im eingeschränkten seriellen Modus, weil Aktualisierungs-Hosts von Benutzern oft kleiner als CI-Runner sind.
  </Step>
  <Step title="Rebase">
    Führt ein Rebase auf den ausgewählten Commit aus (nur Dev).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repos. Bei pnpm-Checkouts bootstrapped der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann als Fallback mit einem temporären `npm install pnpm@10`), statt `npm run build` in einem pnpm-Workspace auszuführen.
  </Step>
  <Step title="Control UI bauen">
    Baut das Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` läuft als abschließende Safe-Update-Prüfung.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; stable und beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

Auf dem Beta-Aktualisierungskanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der
default/latest-Linie folgen, zuerst ein Plugin-`@beta`-Release. Wenn das Plugin kein
Beta-Release hat, fällt OpenClaw auf die aufgezeichnete default/latest-Spezifikation zurück. Bei npm-
Plugins fällt OpenClaw auch zurück, wenn das Beta-Paket existiert, aber die Installationsvalidierung
fehlschlägt. Exakte Versionen und explizite Tags werden nicht umgeschrieben.

<Warning>
Wenn eine exakt gepinnte npm-Plugin-Aktualisierung zu einem Artefakt aufgelöst wird, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` diese Plugin-Artefakt-Aktualisierung ab, statt sie zu installieren. Installieren oder aktualisieren Sie das Plugin nur dann explizit neu, nachdem Sie geprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler bei der Plugin-Synchronisierung nach einer Aktualisierung, die auf ein verwaltetes Plugin begrenzt sind, werden nach erfolgreicher Kernaktualisierung als Warnungen gemeldet. Das JSON-Ergebnis behält für die Top-Level-Aktualisierung `status: "ok"` bei und meldet `postUpdate.plugins.status: "warning"` mit Hinweisen zu `openclaw doctor --fix` und `openclaw plugins inspect <id> --runtime --json`. Unerwartete Updater- oder Synchronisierungsausnahmen lassen das Aktualisierungsergebnis weiterhin fehlschlagen. Beheben Sie den Fehler bei der Plugin-Installation oder -Aktualisierung und führen Sie dann `openclaw doctor --fix` oder `openclaw update` erneut aus.

Wenn das aktualisierte Gateway startet, erfolgt das Laden von Plugins nur zur Prüfung: Der Start führt keine Paketmanager aus und verändert keine Abhängigkeitsbäume. Paketmanager-`update.run`-Neustarts umgehen die normale Leerlaufverzögerung und die Neustart-Abklingzeit, nachdem der Paketbaum ausgetauscht wurde, sodass der alte Prozess nicht weiter entfernte Chunks nachladen kann.

Wenn das pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater frühzeitig mit einem paketmanager-spezifischen Fehler, statt `npm run build` im Checkout zu versuchen.
</Note>

## `--update`-Kurzform

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet an, bei Git-Checkouts zuerst die Aktualisierung auszuführen)
- [Development-Kanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
