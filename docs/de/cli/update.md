---
read_when:
    - Sie möchten eine Quellcode-Arbeitskopie sicher aktualisieren
    - Sie müssen das Verhalten der `--update`-Kurzschreibweise verstehen
summary: CLI-Referenz für `openclaw update` (relativ sichere Quellenaktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-02T20:45:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw sicher aktualisieren und zwischen Stable-, Beta- und Dev-Kanälen wechseln.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Updates über den Package-Manager-Ablauf unter [Aktualisieren](/de/install/updating).

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

- `--no-restart`: überspringt den Neustart des Gateway-Dienstes nach einem erfolgreichen Update. Package-Manager-Updates, die das Gateway neu starten, prüfen, dass der neu gestartete Dienst die erwartete aktualisierte Version meldet, bevor der Befehl erfolgreich abgeschlossen wird.
- `--channel <stable|beta|dev>`: legt den Update-Kanal fest (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: überschreibt das Paket-Ziel nur für dieses Update. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: zeigt die geplanten Update-Aktionen (Kanal/Tag/Ziel/Neustartablauf) an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.integrityDrifts`, wenn während der Plugin-Synchronisierung nach dem Update eine Drift bei npm-Plugin-Artefakten
  erkannt wird.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1800s).
- `--yes`: überspringt Bestätigungsabfragen (zum Beispiel die Bestätigung eines Downgrades).

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
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3s).

## `update wizard`

Interaktiver Ablauf, um einen Update-Kanal auszuwählen und zu bestätigen, ob das Gateway
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
- `beta` → bevorzugt das npm-dist-tag `beta`, fällt aber auf `latest` zurück, wenn Beta
  fehlt oder älter als das aktuelle Stable-Release ist.

Der automatische Core-Updater des Gateway (wenn per Konfiguration aktiviert) startet den CLI-Update-Pfad
außerhalb des laufenden Gateway-Request-Handlers. Control-Plane-`update.run`-Package-Manager-
Updates erzwingen nach dem Pakettausch einen nicht verzögerten Update-Neustart ohne Cooldown,
weil der alte Gateway-Prozess noch speicherinterne Chunks haben kann, die auf
Dateien verweisen, die vom neuen Paket entfernt wurden.

Bei Package-Manager-Installationen löst `openclaw update` die Zielpaketversion auf,
bevor der Package-Manager aufgerufen wird. Globale npm-Installationen verwenden eine gestaffelte
Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix, prüft
dort das paketierte `dist`-Inventar und tauscht dann diesen sauberen Paketbaum in das
reale globale Präfix ein. Wenn die Prüfung fehlschlägt, werden Doctor nach dem Update, Plugin-Synchronisierung und
Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die installierte Version
bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation,
führt anschließend die Plugin-Synchronisierung, eine Aktualisierung der Core-Befehlsvervollständigung und Neustartarbeiten aus. Dadurch
bleiben paketierte Sidecars und kanalverwaltete Plugin-Einträge mit dem
installierten OpenClaw-Build synchron, während vollständige Neuaufbauten der Plugin-Befehlsvervollständigung
expliziten `openclaw completion --write-state`-Ausführungen vorbehalten bleiben.

Wenn ein lokal verwalteter Gateway-Dienst installiert ist und Neustart aktiviert ist,
stoppen Package-Manager-Updates den laufenden Dienst, bevor der Paketbaum ersetzt wird,
aktualisieren dann die Dienstmetadaten aus der aktualisierten Installation, starten den
Dienst neu und prüfen, dass das neu gestartete Gateway die erwartete Version meldet. Mit
`--no-restart` wird die Paketersetzung trotzdem ausgeführt, aber der verwaltete Dienst wird nicht
gestoppt oder neu gestartet, sodass das laufende Gateway alten Code behalten kann, bis Sie
es manuell neu starten.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: checkt das neueste Nicht-Beta-Tag aus und führt dann Build und Doctor aus.
- `beta`: bevorzugt das neueste `-beta`-Tag, fällt aber auf das neueste Stable-Tag zurück, wenn Beta fehlt oder älter ist.
- `dev`: checkt `main` aus, führt dann Fetch und Rebase aus.

### Update-Schritte

<Steps>
  <Step title="Verify clean worktree">
    Erfordert keine nicht committeten Änderungen.
  </Step>
  <Step title="Switch channel">
    Wechselt zum ausgewählten Kanal (Tag oder Branch).
  </Step>
  <Step title="Fetch upstream">
    Nur Dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Führt Lint und TypeScript-Build in einem temporären Worktree aus. Wenn die Spitze fehlschlägt, wird bis zu 10 Commits zurückgegangen, um den neuesten sauberen Build zu finden.
  </Step>
  <Step title="Rebase">
    Führt einen Rebase auf den ausgewählten Commit aus (nur Dev).
  </Step>
  <Step title="Install dependencies">
    Verwendet den Package-Manager des Repos. Bei pnpm-Checkouts richtet der Updater `pnpm` bei Bedarf ein (zuerst über `corepack`, dann als Fallback ein temporäres `npm install pnpm@10`), statt `npm run build` innerhalb eines pnpm-Workspace auszuführen.
  </Step>
  <Step title="Build Control UI">
    Baut das Gateway und die Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` wird als abschließende sichere Update-Prüfung ausgeführt.
  </Step>
  <Step title="Sync plugins">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; Stable und Beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

Im Beta-Update-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der
Standard-/Latest-Linie folgen, zuerst ein Plugin-`@beta`-Release. Wenn das Plugin kein
Beta-Release hat, fällt OpenClaw auf die aufgezeichnete Standard-/Latest-Spezifikation zurück. Exakte
Versionen und explizite Tags werden nicht umgeschrieben.

<Warning>
Wenn ein exakt gepinntes npm-Plugin-Update auf ein Artefakt auflöst, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` dieses Plugin-Artefakt-Update ab, statt es zu installieren. Installieren oder aktualisieren Sie das Plugin nur dann explizit neu, nachdem Sie geprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler bei der Plugin-Synchronisierung nach dem Update lassen das Update-Ergebnis fehlschlagen und stoppen nachfolgende Neustartarbeiten. Beheben Sie den Plugin-Installations- oder Update-Fehler und führen Sie dann `openclaw update` erneut aus.

Wenn das aktualisierte Gateway startet, ist das Laden von Plugins nur eine Prüfung: Beim Start werden keine Package-Manager ausgeführt und keine Abhängigkeitsbäume verändert. Package-Manager-`update.run`-Neustarts umgehen die normale Leerlaufverzögerung und den Neustart-Cooldown, nachdem der Paketbaum ausgetauscht wurde, sodass der alte Prozess keine entfernten Chunks mehr lazy-loaden kann.

Wenn das pnpm-Bootstrapping weiterhin fehlschlägt, stoppt der Updater frühzeitig mit einem Package-Manager-spezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.
</Note>

## `--update`-Kurzform

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet an, bei Git-Checkouts zuerst Update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
