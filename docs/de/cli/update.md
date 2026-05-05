---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen das Verhalten der Kurzschreibweise `--update` verstehen
summary: CLI-Referenz für `openclaw update` (relativ sichere Quellcodeaktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-05T01:44:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aktualisieren Sie OpenClaw sicher und wechseln Sie zwischen Stable-/Beta-/Dev-Kanälen.

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

- `--no-restart`: Überspringt den Neustart des Gateway-Dienstes nach einem erfolgreichen Update. Paketmanager-Updates, die das Gateway neu starten, prüfen vor dem erfolgreichen Abschluss des Befehls, ob der neu gestartete Dienst die erwartete aktualisierte Version meldet.
- `--channel <stable|beta|dev>`: Legt den Update-Kanal fest (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: Überschreibt das Paketziel nur für dieses Update. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: Zeigt die geplanten Update-Aktionen (Kanal/Tag/Ziel/Neustartablauf) als Vorschau an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: Gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.integrityDrifts`, wenn während der Plugin-Synchronisierung
  nach dem Update Drift bei npm-Plugin-Artefakten erkannt wird.
- `--timeout <seconds>`: Zeitlimit pro Schritt (Standard ist 1800s).
- `--yes`: Überspringt Bestätigungsaufforderungen (zum Beispiel die Bestätigung für ein Downgrade).

`openclaw update` hat kein `--verbose`-Flag. Verwenden Sie `--dry-run`, um eine Vorschau
der geplanten Kanal-/Tag-/Installations-/Neustartaktionen anzuzeigen, `--json` für maschinenlesbare
Ergebnisse und `openclaw update status --json`, wenn Sie nur Kanal- und
Verfügbarkeitsdetails benötigen. Wenn Sie Gateway-Protokolle rund um ein Update debuggen,
sind Konsolenausführlichkeit und Datei-Protokollstufe getrennt: Gateway `--verbose` beeinflusst
Terminal-/WebSocket-Ausgabe, während Datei-Protokolle `logging.level: "debug"` oder
`"trace"` in der Konfiguration erfordern. Siehe [Gateway-Protokollierung](/de/gateway/logging).

<Warning>
Downgrades erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.
</Warning>

## `update status`

Zeigt den aktiven Update-Kanal + Git-Tag/-Branch/-SHA (für Quellcode-Checkouts) sowie die Update-Verfügbarkeit an.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: Gibt maschinenlesbares Status-JSON aus.
- `--timeout <seconds>`: Zeitlimit für Prüfungen (Standard ist 3s).

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Update-Kanals und zur Bestätigung, ob das Gateway
nach der Aktualisierung neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen,
wird angeboten, einen zu erstellen.

Optionen:

- `--timeout <seconds>`: Zeitlimit für jeden Update-Schritt (Standard `1800`)

## Funktionsweise

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode synchron:

- `dev` → stellt einen Git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert ihn und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt den npm-Dist-Tag `beta`, fällt aber auf `latest` zurück, wenn Beta
  fehlt oder älter als die aktuelle Stable-Version ist.

Der automatische Updater des Gateway-Kerns (wenn per Konfiguration aktiviert) startet den CLI-Update-Pfad
außerhalb des Live-Gateway-Request-Handlers. Control-Plane-`update.run`-Paketmanager-
Updates erzwingen nach dem Pakettausch einen nicht verzögerten Update-Neustart ohne Abklingzeit,
weil der alte Gateway-Prozess möglicherweise noch In-Memory-Chunks enthält, die auf
Dateien zeigen, die durch das neue Paket entfernt wurden.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion
auf, bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestaffelte
Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix, prüft
dort das gepackte `dist`-Inventar und tauscht dann diesen sauberen Paketbaum in das
echte globale Präfix. Wenn die Prüfung fehlschlägt, werden Doctor nach dem Update, Plugin-Synchronisierung und
Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die installierte Version
bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation,
führt anschließend Plugin-Synchronisierung, eine Aktualisierung der Kernbefehlsvervollständigung und Neustartarbeiten aus. Dadurch
bleiben gepackte Sidecars und kanalverwaltete Plugin-Datensätze mit dem
installierten OpenClaw-Build synchron, während vollständige Neuaufbauten der Plugin-Befehlsvervollständigung
expliziten `openclaw completion --write-state`-Läufen vorbehalten bleiben.

Wenn ein lokal verwalteter Gateway-Dienst installiert und Neustart aktiviert ist,
stoppen Paketmanager-Updates den laufenden Dienst vor dem Ersetzen des Paketbaums,
aktualisieren dann die Dienstmetadaten aus der aktualisierten Installation, starten den
Dienst neu und prüfen, ob das neu gestartete Gateway die erwartete Version meldet, bevor
Erfolg gemeldet wird. Unter macOS prüft die Prüfung nach dem Update außerdem, ob der LaunchAgent
für das aktive Profil geladen/ausgeführt wird und der konfigurierte Loopback-Port
fehlerfrei ist. Wenn die plist installiert ist, aber nicht von launchd überwacht wird, bootstrapt OpenClaw
den LaunchAgent automatisch neu und führt anschließend die
Health-/Versions-/Kanal-Bereitschaftsprüfungen erneut aus. Ein frischer Bootstrap lädt den RunAtLoad-
Job direkt, sodass die Update-Wiederherstellung das neu
gestartete Gateway nicht sofort mit `kickstart -k` startet. Wenn das Gateway weiterhin nicht fehlerfrei wird, beendet sich der Befehl
mit einem Nicht-Null-Code und gibt den Pfad zum Neustartprotokoll sowie explizite Anweisungen für Neustart, Neuinstallation und
Paket-Rollback aus. Mit `--no-restart`
wird der Paketersatz weiterhin ausgeführt, aber der verwaltete Dienst wird nicht gestoppt oder
neu gestartet, sodass das laufende Gateway alten Code behalten kann, bis Sie es
manuell neu starten.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: Checkt das neueste Nicht-Beta-Tag aus, baut anschließend und führt Doctor aus.
- `beta`: Bevorzugt das neueste `-beta`-Tag, fällt aber auf das neueste Stable-Tag zurück, wenn Beta fehlt oder älter ist.
- `dev`: Checkt `main` aus, führt anschließend Fetch und Rebase aus.

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
    Führt Lint und TypeScript-Build in einem temporären Worktree aus. Wenn die Spitze fehlschlägt, geht der Ablauf bis zu 10 Commits zurück, um den neuesten sauberen Build zu finden.
  </Step>
  <Step title="Rebase">
    Führt einen Rebase auf den ausgewählten Commit aus (nur Dev).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repos. Bei pnpm-Checkouts bootstrapt der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann als Fallback ein temporäres `npm install pnpm@10`), anstatt `npm run build` innerhalb eines pnpm-Workspaces auszuführen.
  </Step>
  <Step title="Control UI bauen">
    Baut das Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` wird als finale Safe-Update-Prüfung ausgeführt.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; Stable und Beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

Auf dem Beta-Update-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der
Standard-/Latest-Linie folgen, zuerst eine Plugin-`@beta`-Version. Wenn das Plugin keine
Beta-Version hat, fällt OpenClaw auf die aufgezeichnete Standard-/Latest-Spezifikation zurück. Bei npm-
Plugins fällt OpenClaw auch zurück, wenn das Beta-Paket existiert, aber die Installationsvalidierung
fehlschlägt. Exakte Versionen und explizite Tags werden nicht umgeschrieben.

<Warning>
Wenn ein exakt gepinntes npm-Plugin-Update zu einem Artefakt aufgelöst wird, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` dieses Plugin-Artefakt-Update ab, statt es zu installieren. Installieren oder aktualisieren Sie das Plugin erst dann explizit, nachdem Sie geprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler bei der Plugin-Synchronisierung nach dem Update lassen das Update-Ergebnis fehlschlagen und stoppen die nachfolgenden Neustartarbeiten. Beheben Sie den Plugin-Installations- oder Update-Fehler und führen Sie anschließend `openclaw update` erneut aus.

Wenn das aktualisierte Gateway startet, ist das Laden von Plugins nur prüfend: Der Start führt keine Paketmanager aus und verändert keine Abhängigkeitsbäume. Paketmanager-`update.run`-Neustarts umgehen die normale Leerlaufverzögerung und Neustart-Abklingzeit, nachdem der Paketbaum getauscht wurde, sodass der alte Prozess entfernte Chunks nicht weiter lazy-loaden kann.

Wenn der pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater frühzeitig mit einem paketmanager-spezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.
</Note>

## `--update`-Kurzform

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandte Themen

- `openclaw doctor` (bietet bei Git-Checkouts an, zuerst ein Update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisierung](/de/install/updating)
- [CLI-Referenz](/de/cli)
