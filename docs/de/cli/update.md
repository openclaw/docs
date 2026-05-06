---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen das Verhalten der Kurzschreibweise `--update` verstehen
summary: CLI-Referenz für `openclaw update` (weitgehend sichere Quellcode-Aktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-06T17:55:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw sicher aktualisieren und zwischen Stable-/Beta-/Dev-Kanälen wechseln.

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

- `--no-restart`: überspringt den Neustart des Gateway-Dienstes nach einem erfolgreichen Update. Paketmanager-Updates, die den Gateway neu starten, prüfen vor dem erfolgreichen Abschluss des Befehls, ob der neu gestartete Dienst die erwartete aktualisierte Version meldet.
- `--channel <stable|beta|dev>`: legt den Update-Kanal fest (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: überschreibt das Paketziel nur für dieses Update. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: zeigt die geplanten Update-Aktionen (Kanal/Tag/Ziel/Neustart-Ablauf) an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.warnings`, wenn beschädigte oder nicht ladbare verwaltete Plugins
  nach erfolgreichem Core-Update repariert werden müssen, und `postUpdate.plugins.integrityDrifts`,
  wenn während der Plugin-Synchronisierung nach dem Update eine Abweichung bei npm-Plugin-Artefakten erkannt wird.
- `--timeout <seconds>`: Zeitlimit pro Schritt (Standard ist 1800 s).
- `--yes`: überspringt Bestätigungsabfragen (zum Beispiel die Bestätigung eines Downgrades).

`openclaw update` hat kein `--verbose`-Flag. Verwenden Sie `--dry-run`, um die
geplanten Kanal-/Tag-/Installations-/Neustart-Aktionen anzuzeigen, `--json` für
maschinenlesbare Ergebnisse und `openclaw update status --json`, wenn Sie nur Kanal-
und Verfügbarkeitsdetails benötigen. Wenn Sie Gateway-Protokolle rund um ein Update
debuggen, sind Konsolenausführlichkeit und Dateiprotokollstufe getrennt: Gateway
`--verbose` beeinflusst Terminal-/WebSocket-Ausgaben, während Dateiprotokolle
`logging.level: "debug"` oder `"trace"` in der Konfiguration erfordern. Siehe
[Gateway-Protokollierung](/de/gateway/logging).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind verändernde `openclaw update`-Ausführungen deaktiviert. Aktualisieren Sie stattdessen die Nix-Quelle oder den Flake-Input für diese Installation; für nix-openclaw verwenden Sie den agent-first [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` und `openclaw update --dry-run` bleiben schreibgeschützt.
</Note>

<Warning>
Downgrades erfordern eine Bestätigung, weil ältere Versionen die Konfiguration beschädigen können.
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
- `--timeout <seconds>`: Zeitlimit für Prüfungen (Standard ist 3 s).

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Update-Kanals und zur Bestätigung, ob der Gateway
nach dem Update neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen,
wird angeboten, einen zu erstellen.

Optionen:

- `--timeout <seconds>`: Zeitlimit für jeden Update-Schritt (Standard `1800`)

## Was es macht

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode synchron:

- `dev` → stellt einen Git-Checkout sicher (Standard: `~/openclaw`, Überschreiben mit `OPENCLAW_GIT_DIR`),
  aktualisiert ihn und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt das npm-dist-tag `beta`, fällt aber auf `latest` zurück, wenn beta
  fehlt oder älter als die aktuelle Stable-Version ist.

Der automatische Core-Updater des Gateway (wenn über die Konfiguration aktiviert) startet den CLI-Update-Pfad
außerhalb des laufenden Gateway-Request-Handlers. Control-Plane-`update.run`-Paketmanager-Updates
erzwingen nach dem Pakettausch einen nicht verzögerten Update-Neustart ohne Cooldown,
weil der alte Gateway-Prozess noch In-Memory-Chunks haben kann, die auf
Dateien zeigen, die vom neuen Paket entfernt wurden.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion auf,
bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestufte
Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix, überprüft
dort das paketierte `dist`-Inventar und tauscht diesen sauberen Paketbaum anschließend in das
echte globale Präfix. Wenn die Überprüfung fehlschlägt, werden Doctor nach dem Update,
Plugin-Synchronisierung und Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die
installierte Version bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation
und führt anschließend Plugin-Synchronisierung, eine Aktualisierung der Core-Befehlsvervollständigung und Neustartarbeiten aus. Dadurch
bleiben paketierte Sidecars und kanalverwaltete Plugin-Datensätze mit dem
installierten OpenClaw-Build synchron, während vollständige Neuaufbauten der Plugin-Befehlsvervollständigung
expliziten `openclaw completion --write-state`-Ausführungen vorbehalten bleiben.

Wenn ein lokaler verwalteter Gateway-Dienst installiert und der Neustart aktiviert ist,
halten Paketmanager-Updates den laufenden Dienst an, bevor der Paketbaum ersetzt wird,
aktualisieren dann die Dienstmetadaten aus der aktualisierten Installation, starten den
Dienst neu und prüfen, ob der neu gestartete Gateway die erwartete Version meldet, bevor
Erfolg gemeldet wird. Unter macOS prüft die Prüfung nach dem Update außerdem, ob der LaunchAgent
für das aktive Profil geladen/ausgeführt wird und der konfigurierte loopback-Port
fehlerfrei ist. Wenn die plist installiert ist, aber launchd sie nicht überwacht, bootstrapt OpenClaw
den LaunchAgent automatisch erneut und führt anschließend die
Bereitschaftsprüfungen für Zustand/Version/Kanal erneut aus. Ein frischer Bootstrap lädt den RunAtLoad-Job
direkt, sodass die Update-Wiederherstellung nicht sofort `kickstart -k` für den neu
gestarteten Gateway ausführt. Wenn der Gateway weiterhin nicht fehlerfrei wird, beendet sich der Befehl
mit einem Wert ungleich null und gibt den Neustart-Protokollpfad sowie explizite Anweisungen für Neustart, Neuinstallation und
Paket-Rollback aus. Mit `--no-restart`
wird der Paketersatz weiterhin ausgeführt, aber der verwaltete Dienst wird nicht angehalten oder
neu gestartet, sodass der laufende Gateway alten Code behalten kann, bis Sie ihn
manuell neu starten.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: checkt das neueste Nicht-Beta-Tag aus, baut dann und führt Doctor aus.
- `beta`: bevorzugt das neueste `-beta`-Tag, fällt aber auf das neueste Stable-Tag zurück, wenn beta fehlt oder älter ist.
- `dev`: checkt `main` aus, führt dann Fetch und Rebase aus.

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
    Führt den TypeScript-Build in einem temporären Worktree aus. Wenn die Spitze fehlschlägt, geht er bis zu 10 Commits zurück, um den neuesten baubaren Commit zu finden. Setzen Sie `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, um während dieses Preflights zusätzlich Lint auszuführen; Lint läuft in eingeschränktem seriellem Modus, weil Update-Hosts von Benutzern oft kleiner als CI-Runner sind.
  </Step>
  <Step title="Rebase">
    Führt Rebase auf den ausgewählten Commit aus (nur Dev).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repos. Bei pnpm-Checkouts bootstrapt der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann als Fallback mit temporärem `npm install pnpm@10`), statt `npm run build` innerhalb eines pnpm-Workspaces auszuführen.
  </Step>
  <Step title="Control UI bauen">
    Baut den Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` wird als finale Safe-Update-Prüfung ausgeführt.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; stable und beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

Auf dem Beta-Update-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der
default/latest-Linie folgen, zuerst ein Plugin-`@beta`-Release. Wenn das Plugin kein
Beta-Release hat, fällt OpenClaw auf die aufgezeichnete default/latest-Spezifikation zurück. Bei npm-
Plugins fällt OpenClaw auch zurück, wenn das Beta-Paket existiert, aber die Installationsvalidierung
fehlschlägt. Exakte Versionen und explizite Tags werden nicht umgeschrieben.

<Warning>
Wenn ein exakt gepinntes npm-Plugin-Update auf ein Artefakt auflöst, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` dieses Plugin-Artefakt-Update ab, statt es zu installieren. Installieren oder aktualisieren Sie das Plugin erst dann explizit neu, nachdem Sie überprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Plugin-Synchronisierungsfehler nach dem Update, die auf ein verwaltetes Plugin beschränkt sind, werden nach erfolgreichem Core-Update als Warnungen gemeldet. Das JSON-Ergebnis behält den Top-Level-Update-`status: "ok"` bei und meldet `postUpdate.plugins.status: "warning"` mit Hinweisen zu `openclaw doctor --fix` und `openclaw plugins inspect <id> --runtime --json`. Unerwartete Updater- oder Synchronisierungsausnahmen lassen das Update-Ergebnis weiterhin fehlschlagen. Beheben Sie den Plugin-Installations- oder Update-Fehler und führen Sie anschließend `openclaw doctor --fix` oder `openclaw update` erneut aus.

Wenn der aktualisierte Gateway startet, ist das Laden von Plugins nur eine Überprüfung: Beim Start werden keine Paketmanager ausgeführt und keine Abhängigkeitsbäume verändert. Paketmanager-`update.run`-Neustarts umgehen die normale Leerlaufverzögerung und den Neustart-Cooldown, nachdem der Paketbaum ausgetauscht wurde, sodass der alte Prozess entfernte Chunks nicht weiter lazy-loaden kann.

Wenn der pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater frühzeitig mit einem paketmanagerspezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.
</Note>

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet bei Git-Checkouts an, zuerst Update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
