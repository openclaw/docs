---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie untersuchen die Ausgabe oder Optionen von `openclaw update` auf Fehler
    - Sie müssen das Verhalten der `--update`-Kurzform verstehen
summary: CLI-Referenz für `openclaw update` (weitgehend sichere Quellaktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-07T01:52:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw sicher aktualisieren und zwischen Stable-/Beta-/Dev-Kanälen wechseln.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Updates über den Paketmanager-Ablauf in [Aktualisieren](/de/install/updating).

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

- `--no-restart`: überspringt den Neustart des Gateway-Dienstes nach einem erfolgreichen Update. Paketmanager-Updates, die das Gateway neu starten, prüfen, ob der neu gestartete Dienst die erwartete aktualisierte Version meldet, bevor der Befehl erfolgreich ist.
- `--channel <stable|beta|dev>`: legt den Update-Kanal fest (git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: überschreibt das Paketziel nur für dieses Update. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: zeigt die geplanten Update-Aktionen (Kanal/Tag/Ziel/Neustart-Ablauf) an, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: gibt maschinenlesbares `UpdateRunResult`-JSON aus, einschließlich
  `postUpdate.plugins.warnings`, wenn beschädigte oder nicht ladbare verwaltete Plugins
  nach erfolgreichem Core-Update repariert werden müssen, und `postUpdate.plugins.integrityDrifts`,
  wenn während der Plugin-Synchronisierung nach dem Update eine Abweichung bei npm-Plugin-Artefakten erkannt wird.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1800 s).
- `--yes`: überspringt Bestätigungsabfragen (zum Beispiel die Bestätigung für ein Downgrade).

`openclaw update` hat kein `--verbose`-Flag. Verwenden Sie `--dry-run`, um
die geplanten Aktionen für Kanal/Tag/Installation/Neustart anzuzeigen, `--json` für maschinenlesbare
Ergebnisse und `openclaw update status --json`, wenn Sie nur Kanal- und
Verfügbarkeitsdetails benötigen. Wenn Sie Gateway-Protokolle rund um ein Update debuggen,
sind Konsolen-Ausführlichkeit und Dateiprotokollebene getrennt: Gateway `--verbose` beeinflusst
Terminal-/WebSocket-Ausgaben, während Dateiprotokolle `logging.level: "debug"` oder
`"trace"` in der Konfiguration erfordern. Siehe [Gateway-Protokollierung](/de/gateway/logging).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind verändernde `openclaw update`-Läufe deaktiviert. Aktualisieren Sie stattdessen die Nix-Quelle oder die Flake-Eingabe für diese Installation; für nix-openclaw verwenden Sie den agent-first [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` und `openclaw update --dry-run` bleiben schreibgeschützt.
</Note>

<Warning>
Downgrades erfordern eine Bestätigung, weil ältere Versionen die Konfiguration beschädigen können.
</Warning>

## `update status`

Zeigt den aktiven Update-Kanal und Git-Tag/Branch/SHA (für Source-Checkouts) sowie die Update-Verfügbarkeit an.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: gibt maschinenlesbares Status-JSON aus.
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3 s).

## `update wizard`

Interaktiver Ablauf, um einen Update-Kanal auszuwählen und zu bestätigen, ob das Gateway
nach dem Update neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen,
wird angeboten, einen zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Update-Schritt (Standard `1800`)

## Was es tut

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode konsistent:

- `dev` → stellt einen Git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert ihn und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt das npm-Dist-Tag `beta`, fällt aber auf `latest` zurück, wenn beta
  fehlt oder älter als die aktuelle Stable-Version ist.

OpenClaw hat noch keinen LTS- oder monatlichen Support-Kanal. Wir arbeiten
auf monatliche Support-Linien hin, aber `--channel` akzeptiert derzeit nur
`stable`, `beta` und `dev`. Verwenden Sie `--tag <version-or-dist-tag>` für ein einmaliges
Ziel, wenn Sie ein bestimmtes Paketartefakt benötigen.

Der automatische Updater des Gateway-Cores (wenn über die Konfiguration aktiviert) startet den CLI-Update-Pfad
außerhalb des aktiven Gateway-Request-Handlers. Paketmanager-Updates über Control-Plane `update.run`
erzwingen nach dem Pakettausch einen nicht verzögerten Update-Neustart ohne Cooldown,
weil der alte Gateway-Prozess möglicherweise noch In-Memory-Chunks hat, die auf
Dateien zeigen, die durch das neue Paket entfernt wurden.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion auf,
bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestaffelte
Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix, prüft
dort das gepackte `dist`-Inventar und tauscht dann diesen sauberen Paketbaum in das
echte globale Präfix ein. Wenn die Prüfung fehlschlägt, werden Post-Update-Doctor,
Plugin-Synchronisierung und Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die installierte Version
bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation,
führt dann die Plugin-Synchronisierung, eine Aktualisierung der Core-Befehl-Vervollständigung und Neustartarbeiten aus. Dadurch
bleiben gepackte Sidecars und kanalverwaltete Plugin-Datensätze mit dem
installierten OpenClaw-Build abgestimmt, während vollständige Neuaufbauten der Plugin-Befehl-Vervollständigung
expliziten `openclaw completion --write-state`-Läufen vorbehalten bleiben.

Wenn ein lokaler verwalteter Gateway-Dienst installiert ist und Neustart aktiviert ist,
stoppen Paketmanager-Updates den laufenden Dienst, bevor der Paketbaum ersetzt wird,
aktualisieren dann die Dienstmetadaten aus der aktualisierten Installation, starten den
Dienst neu und prüfen, ob das neu gestartete Gateway die erwartete Version meldet,
bevor Erfolg gemeldet wird. Unter macOS prüft die Post-Update-Prüfung außerdem, ob der LaunchAgent
für das aktive Profil geladen/aktiv ist und der konfigurierte Loopback-Port
fehlerfrei ist. Wenn die plist installiert ist, aber launchd sie nicht überwacht, bootstrapt OpenClaw
den LaunchAgent automatisch erneut und führt dann die
Bereitschaftsprüfungen für Zustand/Version/Kanal erneut aus. Ein frischer Bootstrap lädt den RunAtLoad-
Job direkt, sodass die Update-Wiederherstellung das neu
gestartete Gateway nicht sofort mit `kickstart -k` neu startet. Wenn das Gateway weiterhin nicht fehlerfrei wird, beendet sich der Befehl
mit einem Fehlercode ungleich null und gibt den Neustart-Protokollpfad sowie ausdrückliche Anweisungen
für Neustart, Neuinstallation und Paket-Rollback aus. Mit `--no-restart`
wird der Paketaustausch weiterhin ausgeführt, aber der verwaltete Dienst wird nicht gestoppt oder
neu gestartet, sodass das laufende Gateway alten Code behalten kann, bis Sie es
manuell neu starten.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: checkt das neueste Nicht-Beta-Tag aus und führt dann Build und Doctor aus.
- `beta`: bevorzugt das neueste `-beta`-Tag, fällt aber auf das neueste Stable-Tag zurück, wenn beta fehlt oder älter ist.
- `dev`: checkt `main` aus und führt dann Fetch und Rebase aus.

### Update-Schritte

<Steps>
  <Step title="Verify clean worktree">
    Erfordert keine uncommitteten Änderungen.
  </Step>
  <Step title="Switch channel">
    Wechselt zum ausgewählten Kanal (Tag oder Branch).
  </Step>
  <Step title="Fetch upstream">
    Nur Dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Führt den TypeScript-Build in einem temporären Worktree aus. Wenn die Spitze fehlschlägt, geht es bis zu 10 Commits zurück, um den neuesten baubaren Commit zu finden. Setzen Sie `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, um während dieses Preflights auch Lint auszuführen; Lint läuft im eingeschränkten seriellen Modus, weil Update-Hosts von Benutzern oft kleiner sind als CI-Runner.
  </Step>
  <Step title="Rebase">
    Führt Rebase auf den ausgewählten Commit aus (nur Dev).
  </Step>
  <Step title="Install dependencies">
    Verwendet den Paketmanager des Repos. Bei pnpm-Checkouts bootstrapt der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann mit einem temporären Fallback über `npm install pnpm@10`), anstatt `npm run build` innerhalb eines pnpm-Workspace auszuführen.
  </Step>
  <Step title="Build Control UI">
    Baut das Gateway und die Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` läuft als abschließende Safe-Update-Prüfung.
  </Step>
  <Step title="Sync plugins">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; Stable und Beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

Auf dem Beta-Update-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der
Standard-/Latest-Linie folgen, zuerst eine Plugin-`@beta`-Version. Wenn das Plugin keine
Beta-Version hat, fällt OpenClaw auf die aufgezeichnete Standard-/Latest-Spezifikation zurück. Bei npm-
Plugins fällt OpenClaw auch zurück, wenn das Beta-Paket existiert, aber die Installationsvalidierung
fehlschlägt. Exakte Versionen und explizite Tags werden nicht umgeschrieben.

<Warning>
Wenn ein exakt gepinntes npm-Plugin-Update zu einem Artefakt aufgelöst wird, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` dieses Plugin-Artefakt-Update ab, statt es zu installieren. Installieren oder aktualisieren Sie das Plugin erst dann explizit neu, nachdem Sie geprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler bei der Post-Update-Plugin-Synchronisierung, die auf ein verwaltetes Plugin beschränkt sind, werden nach erfolgreichem Core-Update als Warnungen gemeldet. Das JSON-Ergebnis behält den Top-Level-Update-`status: "ok"` bei und meldet `postUpdate.plugins.status: "warning"` mit Hinweisen zu `openclaw doctor --fix` und `openclaw plugins inspect <id> --runtime --json`. Unerwartete Updater- oder Synchronisierungs-Ausnahmen führen weiterhin zu einem fehlgeschlagenen Update-Ergebnis. Beheben Sie den Plugin-Installations- oder Update-Fehler und führen Sie dann `openclaw doctor --fix` oder `openclaw update` erneut aus.

Wenn das aktualisierte Gateway startet, ist das Laden von Plugins nur eine Prüfung: Der Start führt keine Paketmanager aus und verändert keine Dependency-Bäume. Paketmanager-Neustarts über `update.run` umgehen die normale Leerlaufverzögerung und den Neustart-Cooldown, nachdem der Paketbaum ausgetauscht wurde, sodass der alte Prozess entfernte Chunks nicht weiterhin per Lazy Loading laden kann.

Wenn der pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater frühzeitig mit einem paketmanager-spezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.
</Note>

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet an, bei Git-Checkouts zuerst update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
