---
read_when:
    - Verwenden oder Ändern des Exec-Tools
    - Fehlerbehebung beim stdin- oder TTY-Verhalten
summary: Verwendung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Exec-Tool
x-i18n:
    generated_at: "2026-04-21T13:37:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Exec-Tool

Führen Sie Shell-Befehle im Workspace aus. Unterstützt Vordergrund- und Hintergrundausführung über `process`.
Wenn `process` nicht erlaubt ist, wird `exec` synchron ausgeführt und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent begrenzt; `process` sieht nur Sitzungen desselben Agenten.

## Parameter

- `command` (erforderlich)
- `workdir` (Standard ist cwd)
- `env` (Schlüssel-/Wert-Überschreibungen)
- `yieldMs` (Standard 10000): nach Verzögerung automatisch in den Hintergrund
- `background` (bool): sofort im Hintergrund ausführen
- `timeout` (Sekunden, Standard 1800): bei Ablauf beenden
- `pty` (bool): in einem Pseudo-Terminal ausführen, wenn verfügbar (nur-TTY-CLIs, Coding-Agents, Terminal-UIs)
- `host` (`auto | sandbox | gateway | node`): wo ausgeführt werden soll
- `security` (`deny | allowlist | full`): Erzwingungsmodus für `gateway`/`node`
- `ask` (`off | on-miss | always`): Freigabeaufforderungen für `gateway`/`node`
- `node` (string): Node-ID/-Name für `host=node`
- `elevated` (bool): erhöhten Modus anfordern (die Sandbox verlassen und auf dem konfigurierten Host-Pfad ausführen); `security=full` wird nur erzwungen, wenn `elevated` zu `full` aufgelöst wird

Hinweise:

- `host` hat standardmäßig `auto`: `sandbox`, wenn die Sandbox-Runtime für die Sitzung aktiv ist, andernfalls `gateway`.
- `auto` ist die Standard-Routing-Strategie, kein Platzhalter. Pro Aufruf ist `host=node` von `auto` aus erlaubt; pro Aufruf ist `host=gateway` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin „einfach so“: ohne Sandbox wird es zu `gateway`; mit aktiver Sandbox bleibt es in der Sandbox.
- `elevated` verlässt die Sandbox auf den konfigurierten Host-Pfad: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` gesetzt ist (oder der Sitzungsstandard `host=node` ist). Es ist nur verfügbar, wenn erhöhter Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- `gateway`-/`node`-Freigaben werden über `~/.openclaw/exec-approvals.json` gesteuert.
- `node` erfordert einen gepairten Node (Companion-App oder Headless-Node-Host).
- Wenn mehrere Nodes verfügbar sind, setzen Sie `exec.node` oder `tools.exec.node`, um einen auszuwählen.
- `exec host=node` ist der einzige Shell-Ausführungspfad für Nodes; der Legacy-Wrapper `nodes.run` wurde entfernt.
- Auf Nicht-Windows-Hosts verwendet `exec` `SHELL`, wenn gesetzt; wenn `SHELL` `fish` ist, bevorzugt es `bash` (oder `sh`)
  aus `PATH`, um mit `fish` inkompatible Skripte zu vermeiden, und fällt dann auf `SHELL` zurück, wenn keines von beiden existiert.
- Auf Windows-Hosts bevorzugt `exec` die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH)
  und fällt danach auf Windows PowerShell 5.1 zurück.
- Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um
  Binary-Hijacking oder injizierten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Kontext des Exec-Tools erkennen können.
- Wichtig: Sandboxing ist standardmäßig **deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin geschlossen fehl, statt stillschweigend
  auf dem Gateway-Host auszuführen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Freigaben.
- Skript-Preflight-Prüfungen (für häufige Python-/Node-Shell-Syntaxfehler) prüfen nur Dateien innerhalb der
  wirksamen `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird die Preflight-Prüfung
  für diese Datei übersprungen.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf das automatische
  Abschluss-Wake-up, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingaben oder Eingriffe; emulieren Sie keine
  Planung mit Sleep-Schleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeit, die später oder nach Zeitplan erfolgen soll, verwenden Sie Cron statt
  `exec`-Sleep-/Delay-Mustern.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): wenn true, stellen in den Hintergrund verschobene Exec-Sitzungen beim Beenden ein Systemereignis in die Warteschlange und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): gibt genau einen Hinweis „running“ aus, wenn ein freigabegesteuerter Exec länger als dies läuft (0 deaktiviert).
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox` aufgelöst, wenn die Sandbox-Runtime aktiv ist, sonst zu `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Host-Exec ohne Freigabe ist der Standard für Gateway + Node. Wenn Sie Freigaben/Allowlist-Verhalten möchten, verschärfen Sie sowohl `tools.exec.*` als auch die Host-`~/.openclaw/exec-approvals.json`; siehe [Exec approvals](/de/tools/exec-approvals#no-approval-yolo-mode).
- YOLO kommt von den Host-Richtlinienstandards (`security=full`, `ask=off`), nicht von `host=auto`. Wenn Sie Gateway- oder Node-Routing erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- Im Modus `security=full` plus `ask=off` folgt Host-Exec direkt der konfigurierten Richtlinie; es gibt keine zusätzliche heuristische Vorfilterung zur Befehlsverschleierung oder zusätzliche Ablehnungsschicht für Skript-Preflight.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): wenn true, erfordern Inline-Interpreter-Eval-Formen wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` immer eine explizite Freigabe. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, aber Inline-Eval-Formen fordern trotzdem jedes Mal erneut eine Freigabe an.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die für Exec-Ausführungen an `PATH` vorangestellt werden sollen (nur Gateway + Sandbox).
- `tools.exec.safeBins`: nur-stdin-sichere Binaries, die ohne explizite Allowlist-Einträge ausgeführt werden können. Verhaltensdetails finden Sie unter [Safe bins](/de/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: zusätzliche explizite Verzeichnisse, denen bei Pfadprüfungen für `safeBins` vertraut wird. `PATH`-Einträge sind nie automatisch vertrauenswürdig. Eingebaute Standards sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: optionale benutzerdefinierte argv-Richtlinie pro safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: führt Ihr Login-Shell-`PATH` mit der Exec-Umgebung zusammen. `env.PATH`-Überschreibungen werden
  für die Host-Ausführung abgelehnt. Der Daemon selbst läuft weiterhin mit einem minimalen `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: führt `sh -lc` (Login-Shell) im Container aus, sodass `/etc/profile` `PATH` zurücksetzen kann.
  OpenClaw stellt `env.PATH` nach dem Laden des Profils über eine interne Umgebungsvariable voran (ohne Shell-Interpolation);
  `tools.exec.pathPrepend` gilt auch hier.
- `host=node`: nur nicht blockierte `env`-Überschreibungen, die Sie übergeben, werden an den Node gesendet. `env.PATH`-Überschreibungen werden
  für die Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einem Node benötigen,
  konfigurieren Sie die Dienstumgebung des Node-Hosts (systemd/launchd) oder installieren Sie Tools an Standardorten.

Node-Bindung pro Agent (verwenden Sie den Agent-Listenindex in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Die Registerkarte „Nodes“ enthält ein kleines Panel „Exec node binding“ für dieselben Einstellungen.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **pro Sitzung** Standards für `host`, `security`, `ask` und `node` festzulegen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Absender** berücksichtigt (Channel-Allowlists/Pairing plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungsstatus** und schreibt keine Konfiguration. Um Exec hart zu deaktivieren, verweigern Sie es über die Tool-
Richtlinie (`tools.deny: ["exec"]` oder pro Agent). Host-Freigaben gelten weiterhin, es sei denn, Sie setzen explizit
`security=full` und `ask=off`.

## Exec approvals (Companion-App / Node-Host)

Sandboxed Agents können pro Anfrage eine Freigabe verlangen, bevor `exec` auf dem Gateway- oder Node-Host ausgeführt wird.
Siehe [Exec approvals](/de/tools/exec-approvals) für Richtlinie, Allowlist und UI-Ablauf.

Wenn Freigaben erforderlich sind, gibt das Exec-Tool sofort mit
`status: "approval-pending"` und einer Freigabe-ID zurück. Sobald freigegeben (oder abgelehnt / Timeout),
gibt das Gateway Systemereignisse aus (`Exec finished` / `Exec denied`). Wenn der Befehl nach
`tools.exec.approvalRunningNoticeMs` noch läuft, wird genau ein Hinweis `Exec running` ausgegeben.
Auf Channels mit nativen Freigabekarten/-buttons sollte sich der Agent zuerst auf diese
native UI verlassen und nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-
Ergebnis ausdrücklich sagt, dass Chat-Freigaben nicht verfügbar sind oder eine manuelle Freigabe
der einzige Weg ist.

## Allowlist + safe bins

Die manuelle Allowlist-Erzwingung gleicht nur **aufgelöste Binärpfade** ab (keine Basename-Abgleiche). Wenn
`security=allowlist` gesetzt ist, werden Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-Segment
auf der Allowlist steht oder ein safe bin ist. Verkettung (`;`, `&&`, `||`) und Umleitungen werden im
Allowlist-Modus abgelehnt, es sei denn, jedes Top-Level-Segment erfüllt die Allowlist (einschließlich safe bins).
Umleitungen bleiben nicht unterstützt.
Dauerhaftes `allow-always`-Vertrauen umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Top-Level-Segment übereinstimmt.

`autoAllowSkills` ist ein separater Komfortpfad in Exec-Freigaben. Es ist nicht dasselbe wie
manuelle Pfad-Allowlist-Einträge. Für striktes explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerelemente für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, nur-stdin-Stream-Filter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für Pfade ausführbarer safe bins.
- `tools.exec.safeBinProfiles`: explizite argv-Richtlinie für benutzerdefinierte safe bins.
- Allowlist: explizites Vertrauen für Pfade zu ausführbaren Dateien.

Behandeln Sie `safeBins` nicht als generische Allowlist und fügen Sie keine Interpreter-/Runtime-Binaries hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Allowlist-Einträge und lassen Sie Freigabeaufforderungen aktiviert.
`openclaw security audit` warnt, wenn bei Interpreter-/Runtime-`safeBins`-Einträgen explizite Profile fehlen, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge erzeugen.
`openclaw security audit` und `openclaw doctor` warnen auch, wenn Sie explizit Binaries mit breitem Verhalten wie `jq` wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter explizit auf die Allowlist setzen, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Code-Eval-Formen weiterhin eine neue Freigabe erfordern.

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

Polling ist für Status auf Abruf gedacht, nicht für Warteschleifen. Wenn das automatische Abschluss-Wake-up
aktiviert ist, kann der Befehl die Sitzung wecken, wenn er Ausgabe erzeugt oder fehlschlägt.

Tasten senden (tmux-Stil):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Absenden (nur CR senden):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Einfügen (standardmäßig in Klammern gesetzt):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Untertool von `exec` für strukturierte dateiübergreifende Bearbeitungen.
Es ist standardmäßig für OpenAI- und OpenAI-Codex-Modelle aktiviert. Verwenden Sie die Konfiguration nur,
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
- Die Tool-Richtlinie gilt weiterhin; `allow: ["write"]` erlaubt implizit auch `apply_patch`.
- Die Konfiguration befindet sich unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ist standardmäßig `true`; setzen Sie es auf `false`, um das Tool für OpenAI-Modelle zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Workspace beschränkt). Setzen Sie es nur dann auf `false`, wenn Sie ausdrücklich möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.

## Verwandt

- [Exec approvals](/de/tools/exec-approvals) — Freigabeschranken für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Ausführen von Befehlen in sandboxed Umgebungen
- [Background Process](/de/gateway/background-process) — lang laufendes `exec` und `process`-Tool
- [Security](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
