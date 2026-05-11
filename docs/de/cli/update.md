---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen das Verhalten der Kurzform `--update` verstehen
summary: CLI-Referenz für `openclaw update` (relativ sichere Quellaktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-11T20:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aktualisieren Sie OpenClaw sicher und wechseln Sie zwischen Stable-/Beta-/Dev-Kanälen.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Aktualisierungen über den Paketmanager-Ablauf unter [Aktualisieren](/de/install/updating).

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

- `--no-restart`: überspringt den Neustart des Gateway-Dienstes nach einer erfolgreichen Aktualisierung. Paketmanager-Aktualisierungen, die den Gateway neu starten, prüfen, ob der neu gestartete Dienst die erwartete aktualisierte Version meldet, bevor der Befehl erfolgreich abgeschlossen wird.
- `--channel <stable|beta|dev>`: legt den Update-Kanal fest (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: überschreibt das Paketziel nur für diese Aktualisierung. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: zeigt geplante Aktualisierungsaktionen (Kanal/Tag/Ziel/Neustart-Ablauf) an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.warnings`, wenn beschädigte oder nicht ladbare verwaltete Plugins
  nach erfolgreicher Kernaktualisierung repariert werden müssen, Details zum Plugin-Fallback
  im Beta-Kanal, wenn ein Plugin keine Beta-Version hat, und `postUpdate.plugins.integrityDrifts`,
  wenn während der Plugin-Synchronisierung nach der Aktualisierung Abweichungen bei npm-Plugin-Artefakten erkannt werden.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1800 s).
- `--yes`: überspringt Bestätigungsabfragen (zum Beispiel die Bestätigung eines Downgrades).

`openclaw update` hat kein `--verbose`-Flag. Verwenden Sie `--dry-run`, um
die geplanten Kanal-/Tag-/Installations-/Neustart-Aktionen vorab anzuzeigen,
`--json` für maschinenlesbare Ergebnisse und `openclaw update status --json`,
wenn Sie nur Kanal- und Verfügbarkeitsdetails benötigen. Wenn Sie Gateway-Logs
rund um eine Aktualisierung debuggen, sind Konsolenausführlichkeit und Datei-Log-Level
getrennt: Gateway `--verbose` wirkt sich auf Terminal-/WebSocket-Ausgabe aus,
während Datei-Logs `logging.level: "debug"` oder `"trace"` in der Konfiguration
erfordern. Siehe [Gateway-Protokollierung](/de/gateway/logging).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind verändernde `openclaw update`-Ausführungen deaktiviert. Aktualisieren Sie stattdessen die Nix-Quelle oder den Flake-Input für diese Installation; für nix-openclaw verwenden Sie den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` und `openclaw update --dry-run` bleiben schreibgeschützt.
</Note>

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
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3 s).

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Update-Kanals und zur Bestätigung, ob der Gateway
nach der Aktualisierung neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev`
ohne Git-Checkout auswählen, wird angeboten, einen zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Aktualisierungsschritt (Standard `1800`)

## Was es tut

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode abgestimmt:

- `dev` → stellt einen Git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert ihn und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt den npm-Dist-Tag `beta`, fällt aber auf `latest` zurück, wenn Beta
  fehlt oder älter als die aktuelle stabile Version ist.

Der automatische Aktualisierer des Gateway-Kerns (wenn über die Konfiguration aktiviert)
startet den CLI-Aktualisierungspfad außerhalb des laufenden Gateway-Request-Handlers.
Paketmanager-Aktualisierungen über die Kontrollebene `update.run` erzwingen nach dem
Pakettausch einen nicht verzögerten Aktualisierungsneustart ohne Cooldown, weil der alte
Gateway-Prozess möglicherweise noch In-Memory-Chunks hat, die auf Dateien zeigen, die
vom neuen Paket entfernt wurden.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion auf,
bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine
gestufte Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix,
prüft dort das gepackte `dist`-Inventar und tauscht dann diesen sauberen Paketbaum in
das echte globale Präfix. Wenn die Prüfung fehlschlägt, werden Post-Update-Doctor,
Plugin-Synchronisierung und Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt.
Auch wenn die installierte Version bereits dem Ziel entspricht, aktualisiert der Befehl
die globale Paketinstallation und führt dann Plugin-Synchronisierung, eine Aktualisierung
der Kernbefehls-Vervollständigung und Neustartarbeiten aus. Dadurch bleiben paketierte
Sidecars und kanalverwaltete Plugin-Datensätze mit dem installierten OpenClaw-Build
abgestimmt, während vollständige Neuaufbauten der Plugin-Befehlsvervollständigung
expliziten `openclaw completion --write-state`-Ausführungen vorbehalten bleiben.

Wenn ein lokaler verwalteter Gateway-Dienst installiert ist und der Neustart aktiviert ist,
stoppen Paketmanager-Aktualisierungen den laufenden Dienst, bevor der Paketbaum ersetzt
wird. Danach werden die Dienstmetadaten aus der aktualisierten Installation erneuert,
der Dienst wird neu gestartet, und es wird geprüft, ob der neu gestartete Gateway die
erwartete Version meldet, bevor Erfolg gemeldet wird. Unter macOS prüft der Post-Update-Check
außerdem, ob der LaunchAgent für das aktive Profil geladen/ausgeführt wird und der
konfigurierte Loopback-Port gesund ist. Wenn die plist installiert ist, launchd sie aber
nicht überwacht, bootstrapt OpenClaw den LaunchAgent automatisch erneut und führt dann die
Bereitschaftsprüfungen für Health/Version/Kanal erneut aus. Ein frischer Bootstrap lädt
den RunAtLoad-Job direkt, sodass die Update-Wiederherstellung den neu gestarteten Gateway
nicht sofort mit `kickstart -k` erneut anstößt. Wenn der Gateway weiterhin nicht gesund
wird, beendet sich der Befehl mit einem Fehlercode ungleich null und gibt den Pfad zum
Neustart-Log sowie explizite Anweisungen für Neustart, Neuinstallation und Paket-Rollback
aus. Mit `--no-restart` wird der Paketersatz weiterhin ausgeführt, aber der verwaltete
Dienst wird nicht gestoppt oder neu gestartet, sodass der laufende Gateway möglicherweise
alten Code weiterverwendet, bis Sie ihn manuell neu starten.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: checkt den neuesten Nicht-Beta-Tag aus, erstellt dann den Build und führt Doctor aus.
- `beta`: bevorzugt den neuesten `-beta`-Tag, fällt aber auf den neuesten stabilen Tag zurück, wenn Beta fehlt oder älter ist.
- `dev`: checkt `main` aus, führt dann Fetch und Rebase aus.

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
    Führt den TypeScript-Build in einem temporären Worktree aus. Wenn der Tip fehlschlägt, geht der Ablauf bis zu 10 Commits zurück, um den neuesten buildbaren Commit zu finden. Setzen Sie `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, um während dieses Preflights auch Lint auszuführen; Lint läuft in einem eingeschränkten seriellen Modus, weil Update-Hosts von Benutzern häufig kleiner als CI-Runner sind.
  </Step>
  <Step title="Rebase">
    Rebasiert auf den ausgewählten Commit (nur Dev).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repos. Bei pnpm-Checkouts bootstrapt der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann mit einem temporären Fallback `npm install pnpm@11`), statt `npm run build` innerhalb eines pnpm-Workspace auszuführen.
  </Step>
  <Step title="Control UI bauen">
    Baut den Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` läuft als abschließende Safe-Update-Prüfung.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; Stable und Beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

Im Beta-Update-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen,
die der Standard-/Latest-Linie folgen, zuerst eine Plugin-`@beta`-Version. Wenn das
Plugin keine Beta-Version hat, fällt OpenClaw auf die aufgezeichnete Standard-/Latest-Spezifikation
zurück und meldet dies als Warnung. Für npm-Plugins fällt OpenClaw auch zurück, wenn das
Beta-Paket existiert, aber die Installationsvalidierung fehlschlägt. Diese Plugin-Fallback-Warnungen
lassen die Kernaktualisierung nicht fehlschlagen. Exakte Versionen und explizite Tags werden
nicht umgeschrieben.

<Warning>
Wenn eine exakt gepinnte npm-Plugin-Aktualisierung auf ein Artefakt aufgelöst wird, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` diese Plugin-Artefakt-Aktualisierung ab, statt sie zu installieren. Installieren oder aktualisieren Sie das Plugin nur dann explizit erneut, nachdem Sie geprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler bei der Plugin-Synchronisierung nach der Aktualisierung, die auf ein verwaltetes Plugin beschränkt sind, werden nach erfolgreicher Kernaktualisierung als Warnungen gemeldet. Das JSON-Ergebnis behält den Top-Level-Update-`status: "ok"` bei und meldet `postUpdate.plugins.status: "warning"` mit Hinweisen zu `openclaw doctor --fix` und `openclaw plugins inspect <id> --runtime --json`. Unerwartete Updater- oder Synchronisierungs-Ausnahmen lassen das Update-Ergebnis weiterhin fehlschlagen. Beheben Sie den Plugin-Installations- oder Update-Fehler und führen Sie dann `openclaw doctor --fix` oder `openclaw update` erneut aus.

Wenn der aktualisierte Gateway startet, ist das Laden von Plugins nur eine Prüfung: Der Start führt keine Paketmanager aus und verändert keine Abhängigkeitsbäume. Paketmanager-Neustarts über `update.run` umgehen die normale Leerlaufverzögerung und den Neustart-Cooldown, nachdem der Paketbaum ausgetauscht wurde, sodass der alte Prozess entfernte Chunks nicht weiter lazy-loaden kann.

Wenn der pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater frühzeitig mit einem paketmanager-spezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.
</Note>

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandte Themen

- `openclaw doctor` (bietet an, auf Git-Checkouts zuerst ein Update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
