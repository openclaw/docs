---
read_when:
    - Verwenden oder Ändern des Exec-Tools
    - Debuggen des stdin- oder TTY-Verhaltens
summary: Verwendung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Exec-Tool
x-i18n:
    generated_at: "2026-04-06T03:13:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28388971c627292dba9bf65ae38d7af8cde49a33bb3b5fc8b20da4f0e350bedd
    source_path: tools/exec.md
    workflow: 15
---

# Exec-Tool

Führt Shell-Befehle im Workspace aus. Unterstützt Ausführung im Vordergrund und Hintergrund über `process`.
Wenn `process` nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent begrenzt; `process` sieht nur Sitzungen desselben Agents.

## Parameter

- `command` (erforderlich)
- `workdir` (Standard: cwd)
- `env` (Überschreibungen für Schlüssel/Wert)
- `yieldMs` (Standard 10000): automatischer Hintergrundmodus nach Verzögerung
- `background` (bool): sofort im Hintergrund ausführen
- `timeout` (Sekunden, Standard 1800): bei Ablauf beenden
- `pty` (bool): in einem Pseudo-Terminal ausführen, wenn verfügbar (TTY-only-CLIs, Coding-Agents, Terminal-UIs)
- `host` (`auto | sandbox | gateway | node`): wo ausgeführt werden soll
- `security` (`deny | allowlist | full`): Durchsetzungsmodus für `gateway`/`node`
- `ask` (`off | on-miss | always`): Genehmigungsaufforderungen für `gateway`/`node`
- `node` (string): Node-ID/-Name für `host=node`
- `elevated` (bool): erhöhten Modus anfordern (aus der Sandbox auf den konfigurierten Host-Pfad ausbrechen); `security=full` wird nur erzwungen, wenn `elevated` zu `full` aufgelöst wird

Hinweise:

- `host` verwendet standardmäßig `auto`: Sandbox, wenn die Sandbox-Laufzeit für die Sitzung aktiv ist, sonst Gateway.
- `auto` ist die Standard-Routing-Strategie, kein Wildcard. `host=node` pro Aufruf ist aus `auto` heraus erlaubt; `host=gateway` pro Aufruf ist nur erlaubt, wenn keine Sandbox-Laufzeit aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin einfach: keine Sandbox bedeutet Auflösung zu `gateway`; eine aktive Sandbox bedeutet, dass in der Sandbox geblieben wird.
- `elevated` verlässt die Sandbox auf den konfigurierten Host-Pfad: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` gesetzt ist (oder die Sitzungsstandardeinstellung `host=node` ist). Es ist nur verfügbar, wenn erhöhter Zugriff für die aktuelle Sitzung bzw. den aktuellen Provider aktiviert ist.
- Genehmigungen für `gateway`/`node` werden über `~/.openclaw/exec-approvals.json` gesteuert.
- `node` erfordert einen gekoppelten Node (Begleit-App oder headless Node-Host).
- Wenn mehrere Nodes verfügbar sind, setzen Sie `exec.node` oder `tools.exec.node`, um einen auszuwählen.
- `exec host=node` ist der einzige Shell-Ausführungspfad für Nodes; der Legacy-Wrapper `nodes.run` wurde entfernt.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn gesetzt; wenn `SHELL` auf `fish` gesetzt ist, wird `bash` (oder `sh`)
  aus `PATH` bevorzugt, um mit fish inkompatible Skripte zu vermeiden, und erst dann auf `SHELL` zurückgegriffen, wenn keines von beiden existiert.
- Auf Windows-Hosts bevorzugt exec die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH),
  und fällt dann auf Windows PowerShell 5.1 zurück.
- Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um
  Binary-Hijacking oder eingeschleusten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebungsvariablen des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Kontext des Exec-Tools erkennen können.
- Wichtig: Sandboxing ist standardmäßig **deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin geschlossen fehl, statt stillschweigend
  auf dem Gateway-Host zu laufen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Script-Preflight-Prüfungen (für häufige Python-/Node-Shell-Syntaxfehler) untersuchen nur Dateien innerhalb der
  effektiven `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird der Preflight für
  diese Datei übersprungen.
- Für lang laufende Arbeiten, die jetzt starten, starten Sie sie einmal und verlassen Sie sich auf das automatische
  Completion-Wake, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingaben oder Eingriffe; emulieren Sie kein
  Scheduling mit Sleep-Schleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeiten, die später oder nach Zeitplan stattfinden sollen, verwenden Sie cron statt
  `exec`-Sleep-/Delay-Mustern.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): Wenn true, stellen im Hintergrund ausgeführte Exec-Sitzungen beim Beenden ein Systemereignis in die Queue und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): sendet einen einzelnen Hinweis „läuft“, wenn ein genehmigungspflichtiger Exec länger als diesen Wert läuft (0 deaktiviert).
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox` aufgelöst, wenn die Sandbox-Laufzeit aktiv ist, sonst zu `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Host-Exec ohne Genehmigung ist der Standard für Gateway + Node. Wenn Sie Genehmigungen/Allowlist-Verhalten möchten, verschärfen Sie sowohl `tools.exec.*` als auch die Host-`~/.openclaw/exec-approvals.json`; siehe [Exec approvals](/de/tools/exec-approvals#no-approval-yolo-mode).
- YOLO kommt von den Standardwerten der Host-Richtlinie (`security=full`, `ask=off`), nicht von `host=auto`. Wenn Sie Gateway- oder Node-Routing erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- Im Modus `security=full` plus `ask=off` folgt Host-Exec direkt der konfigurierten Richtlinie; es gibt keinen zusätzlichen heuristischen Vorfilter für Befehlsverschleierung.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): Wenn true, erfordern Inline-Interpreter-Eval-Formen wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` immer eine explizite Genehmigung. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, aber Inline-Eval-Formen fragen trotzdem jedes Mal nach.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die für Exec-Läufe an `PATH` vorangestellt werden (nur Gateway + Sandbox).
- `tools.exec.safeBins`: stdin-only sichere Binaries, die ohne explizite Allowlist-Einträge ausgeführt werden können. Details zum Verhalten finden Sie unter [Safe bins](/de/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: zusätzliche explizite Verzeichnisse, denen bei Pfadprüfungen für `safeBins` vertraut wird. `PATH`-Einträge werden niemals automatisch als vertrauenswürdig behandelt. Eingebaute Standardwerte sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: optionale benutzerdefinierte argv-Richtlinie pro Safe Bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Beispiel:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH-Behandlung

- `host=gateway`: führt Ihren `PATH` aus der Login-Shell mit der Exec-Umgebung zusammen. Überschreibungen von `env.PATH` werden
  für Host-Ausführung abgelehnt. Der Daemon selbst läuft weiterhin mit minimalem `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: führt `sh -lc` (Login-Shell) im Container aus, sodass `/etc/profile` `PATH` zurücksetzen kann.
  OpenClaw stellt `env.PATH` nach dem Laden des Profils über eine interne Umgebungsvariable voran (ohne Shell-Interpolation);
  `tools.exec.pathPrepend` gilt auch hier.
- `host=node`: Nur nicht blockierte env-Überschreibungen, die Sie übergeben, werden an den Node gesendet. Überschreibungen von `env.PATH` werden
  für Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einem Node benötigen,
  konfigurieren Sie die Service-Umgebung des Node-Hosts (systemd/launchd) oder installieren Sie Tools an Standardorten.

Node-Binding pro Agent (verwenden Sie den Index der Agent-Liste in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Die Registerkarte Nodes enthält ein kleines Panel „Exec node binding“ für dieselben Einstellungen.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **pro Sitzung** Standardwerte für `host`, `security`, `ask` und `node` festzulegen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Sender** berücksichtigt (Kanal-Allowlists/Pairing plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungsstatus** und schreibt keine Konfiguration. Um exec vollständig zu deaktivieren, sperren Sie es per Tool-
Richtlinie (`tools.deny: ["exec"]` oder pro Agent). Host-Genehmigungen gelten weiterhin, es sei denn, Sie setzen explizit
`security=full` und `ask=off`.

## Exec-Genehmigungen (Begleit-App / Node-Host)

Sandboxed Agents können pro Anfrage eine Genehmigung verlangen, bevor `exec` auf dem Gateway- oder Node-Host ausgeführt wird.
Siehe [Exec approvals](/de/tools/exec-approvals) für Richtlinie, Allowlist und UI-Ablauf.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort mit
`status: "approval-pending"` und einer Genehmigungs-ID zurück. Sobald genehmigt (oder abgelehnt / mit Timeout beendet),
sendet das Gateway Systemereignisse (`Exec finished` / `Exec denied`). Wenn der Befehl nach `tools.exec.approvalRunningNoticeMs`
noch läuft, wird ein einzelner Hinweis `Exec running` ausgegeben.
Auf Kanälen mit nativen Genehmigungskarten/-Buttons sollte sich der Agent zuerst auf diese
native UI verlassen und einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Tool-
Ergebnis ausdrücklich sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der
einzige Weg ist.

## Allowlist + Safe Bins

Die manuelle Durchsetzung der Allowlist gleicht nur **aufgelöste Binary-Pfade** ab (keine Basename-Treffer). Wenn
`security=allowlist`, werden Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-Segment
allowgelistet oder ein Safe Bin ist. Verkettungen (`;`, `&&`, `||`) und Umleitungen werden im
Allowlist-Modus abgelehnt, es sei denn, jedes Top-Level-Segment erfüllt die Allowlist (einschließlich Safe Bins).
Umleitungen bleiben nicht unterstützt.
Dauerhaftes Vertrauen per `allow-always` umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Top-Level-Segment übereinstimmt.

`autoAllowSkills` ist ein separater Komfortpfad in den Exec-Genehmigungen. Er ist nicht dasselbe wie
manuelle Pfad-Allowlist-Einträge. Für strikt explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerelemente für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, stdin-only Stream-Filter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für ausführbare Safe-Bin-Pfade.
- `tools.exec.safeBinProfiles`: explizite argv-Richtlinie für benutzerdefinierte Safe Bins.
- Allowlist: explizites Vertrauen für Pfade zu ausführbaren Dateien.

Behandeln Sie `safeBins` nicht als generische Allowlist, und fügen Sie keine Interpreter-/Laufzeit-Binaries hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsaufforderungen aktiviert.
`openclaw security audit` warnt, wenn bei Einträgen für Interpreter-/Laufzeit-`safeBins` explizite Profile fehlen, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge erzeugen.
`openclaw security audit` und `openclaw doctor` warnen auch, wenn Sie explizit Binaries mit breitem Verhalten wie `jq` wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter explizit allowlisten, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Code-Eval-Formen weiterhin eine neue Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec approvals](/de/tools/exec-approvals#safe-bins-stdin-only) und [Safe bins versus allowlist](/de/tools/exec-approvals#safe-bins-versus-allowlist).

## Beispiele

Vordergrund:

```json
{ "tool": "exec", "command": "ls -la" }
```

Hintergrund + Poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling dient zur bedarfsgesteuerten Statusabfrage, nicht für Warteschleifen. Wenn automatisches Completion-Wake
aktiviert ist, kann der Befehl die Sitzung wecken, wenn er Ausgabe erzeugt oder fehlschlägt.

Tasten senden (tmux-Stil):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (nur CR senden):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (standardmäßig mit Klammerung):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Untertool von `exec` für strukturierte Bearbeitungen über mehrere Dateien hinweg.
Es ist standardmäßig für OpenAI- und OpenAI-Codex-Modelle aktiviert. Verwenden Sie Konfiguration nur,
wenn Sie es deaktivieren oder auf bestimmte Modelle beschränken möchten:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Hinweise:

- Nur für OpenAI-/OpenAI-Codex-Modelle verfügbar.
- Die Tool-Richtlinie gilt weiterhin; `allow: ["write"]` erlaubt implizit `apply_patch`.
- Die Konfiguration liegt unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ist standardmäßig `true`; setzen Sie es auf `false`, um das Tool für OpenAI-Modelle zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (innerhalb des Workspace begrenzt). Setzen Sie es nur dann auf `false`, wenn Sie ausdrücklich möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.

## Verwandt

- [Exec Approvals](/de/tools/exec-approvals) — Genehmigungsschranken für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Ausführen von Befehlen in sandboxed Umgebungen
- [Background Process](/de/gateway/background-process) — lang laufendes exec- und process-Tool
- [Security](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
