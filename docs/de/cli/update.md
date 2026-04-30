---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie müssen das Verhalten der Kurzschreibweise `--update` verstehen
summary: CLI-Referenz für `openclaw update` (weitgehend sichere Quellcode-Aktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-30T06:47:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aktualisieren Sie OpenClaw sicher und wechseln Sie zwischen Stable-, Beta- und Dev-Kanälen.

Wenn Sie die Installation über **npm/pnpm/bun** vorgenommen haben (globale Installation, keine Git-Metadaten),
erfolgen Aktualisierungen über den Paketmanager-Flow unter [Aktualisierung](/de/install/updating).

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

- `--no-restart`: Überspringt den Neustart des Gateway-Dienstes nach einer erfolgreichen Aktualisierung. Paketmanager-Aktualisierungen, die das Gateway neu starten, prüfen, ob der neu gestartete Dienst die erwartete aktualisierte Version meldet, bevor der Befehl erfolgreich beendet wird.
- `--channel <stable|beta|dev>`: Legt den Aktualisierungskanal fest (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: Überschreibt das Paketziel nur für diese Aktualisierung. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: Zeigt die geplanten Aktualisierungsaktionen (Kanal/Tag/Ziel/Neustartablauf) an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: Gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.integrityDrifts`, wenn während der Plugin-Synchronisierung
  nach der Aktualisierung eine Abweichung bei npm-Plugin-Artefakten erkannt wird.
- `--timeout <seconds>`: Zeitlimit pro Schritt (Standard ist 1800s).
- `--yes`: Überspringt Bestätigungsabfragen (zum Beispiel die Bestätigung eines Downgrades).

<Warning>
Downgrades erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.
</Warning>

## `update status`

Zeigt den aktiven Aktualisierungskanal + Git-Tag/Branch/SHA (bei Quellcode-Checkouts) sowie die Verfügbarkeit von Aktualisierungen an.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: Gibt maschinenlesbares Status-JSON aus.
- `--timeout <seconds>`: Zeitlimit für Prüfungen (Standard ist 3s).

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Aktualisierungskanals und zur Bestätigung, ob das Gateway
nach der Aktualisierung neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen,
wird angeboten, einen zu erstellen.

Optionen:

- `--timeout <seconds>`: Zeitlimit für jeden Aktualisierungsschritt (Standard `1800`)

## Was der Befehl macht

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode synchron:

- `dev` → stellt einen Git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert ihn und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt den npm-dist-tag `beta`, fällt aber auf `latest` zurück, wenn Beta
  fehlt oder älter als das aktuelle Stable-Release ist.

Der automatische Aktualisierer des Gateway-Kerns (wenn über die Konfiguration aktiviert) verwendet denselben Aktualisierungspfad erneut.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion
auf, bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestufte
Installation: OpenClaw installiert das neue Paket in einen temporären npm-Präfix, prüft
dort das paketierte `dist`-Inventar und tauscht dann diesen sauberen Paketbaum in den
echten globalen Präfix ein. Wenn die Prüfung fehlschlägt, werden Doctor nach der Aktualisierung,
Plugin-Synchronisierung und Neustartarbeit nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die installierte Version
bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation,
führt dann die Plugin-Synchronisierung, eine Aktualisierung der Kernbefehls-Vervollständigung und Neustartarbeit aus. Dadurch
bleiben paketierte Sidecars und kanalverwaltete Plugin-Datensätze mit dem
installierten OpenClaw-Build synchron, während vollständige Neuaufbauten der Plugin-Befehlsvervollständigung
expliziten `openclaw completion --write-state`-Ausführungen vorbehalten bleiben.

Wenn ein lokal verwalteter Gateway-Dienst installiert und Neustart aktiviert ist,
stoppen Paketmanager-Aktualisierungen den laufenden Dienst, bevor der Paketbaum ersetzt wird,
aktualisieren dann die Dienstmetadaten aus der aktualisierten Installation, starten den
Dienst neu und prüfen, ob das neu gestartete Gateway die erwartete Version meldet. Mit
`--no-restart` wird der Paketaustausch weiterhin ausgeführt, aber der verwaltete Dienst wird nicht
gestoppt oder neu gestartet, sodass das laufende Gateway alten Code weiterverwenden kann, bis Sie es
manuell neu starten.

## Ablauf für Git-Checkouts

### Kanalauswahl

- `stable`: Checkt das neueste Nicht-Beta-Tag aus, baut anschließend und führt Doctor aus.
- `beta`: Bevorzugt das neueste `-beta`-Tag, fällt aber auf das neueste Stable-Tag zurück, wenn Beta fehlt oder älter ist.
- `dev`: Checkt `main` aus, ruft dann Fetch ab und führt Rebase aus.

### Aktualisierungsschritte

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
    Führt Lint und TypeScript-Build in einem temporären Worktree aus. Wenn die Spitze fehlschlägt, geht der Prozess bis zu 10 Commits zurück, um den neuesten sauberen Build zu finden.
  </Step>
  <Step title="Rebase">
    Führt Rebase auf den ausgewählten Commit aus (nur Dev).
  </Step>
  <Step title="Install dependencies">
    Verwendet den Paketmanager des Repos. Bei pnpm-Checkouts bootstrappt der Aktualisierer `pnpm` bei Bedarf (zuerst über `corepack`, dann als Fallback mit einem temporären `npm install pnpm@10`), statt `npm run build` innerhalb eines pnpm-Workspace auszuführen.
  </Step>
  <Step title="Build Control UI">
    Baut das Gateway und die Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` wird als letzte sichere Aktualisierungsprüfung ausgeführt.
  </Step>
  <Step title="Sync plugins">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; Stable und Beta verwenden npm. Aktualisiert über npm installierte Plugins.
  </Step>
</Steps>

<Warning>
Wenn eine exakt gepinnte npm-Plugin-Aktualisierung zu einem Artefakt aufgelöst wird, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` diese Plugin-Artefaktaktualisierung ab, statt sie zu installieren. Installieren oder aktualisieren Sie das Plugin erst dann explizit, nachdem Sie geprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler bei der Plugin-Synchronisierung nach der Aktualisierung lassen das Aktualisierungsergebnis fehlschlagen und stoppen nachfolgende Neustartarbeit. Beheben Sie den Plugin-Installations- oder Aktualisierungsfehler und führen Sie dann `openclaw update` erneut aus.

Wenn das aktualisierte Gateway startet, werden die Laufzeitabhängigkeiten aktivierter gebündelter Plugins vor der Plugin-Aktivierung bereitgestellt. Durch Aktualisierungen ausgelöste Neustarts lassen alle aktiven Bereitstellungen von Laufzeitabhängigkeiten auslaufen, bevor das Gateway geschlossen wird, sodass Neustarts durch den Dienstmanager keine laufende npm-Installation unterbrechen.

Wenn der pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Aktualisierer frühzeitig mit einem paketmanager-spezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.
</Note>

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet bei Git-Checkouts an, zuerst eine Aktualisierung auszuführen)
- [Development-Kanäle](/de/install/development-channels)
- [Aktualisierung](/de/install/updating)
- [CLI-Referenz](/de/cli)
