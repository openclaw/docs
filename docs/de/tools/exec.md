---
read_when:
    - Verwenden oder Ändern des exec-Tools
    - Debuggen des stdin- oder TTY-Verhaltens
summary: Verwendung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Ausführungstool
x-i18n:
    generated_at: "2026-04-30T07:17:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

Shell-Befehle im Workspace ausführen. Unterstützt Vordergrund- und Hintergrundausführung über `process`.
Wenn `process` nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent scoped; `process` sieht nur Sitzungen desselben Agents.

## Parameter

<ParamField path="command" type="string" required>
Auszuführender Shell-Befehl.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Arbeitsverzeichnis für den Befehl.
</ParamField>

<ParamField path="env" type="object">
Key/value-Umgebungsüberschreibungen, die über die geerbte Umgebung gelegt werden.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Den Befehl nach dieser Verzögerung (ms) automatisch in den Hintergrund verschieben.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Den Befehl sofort in den Hintergrund verschieben, anstatt auf `yieldMs` zu warten.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Das konfigurierte exec-Timeout für diesen Aufruf überschreiben. Setzen Sie `timeout: 0` nur, wenn der Befehl ohne exec-Prozess-Timeout laufen soll.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Wenn verfügbar in einem Pseudo-Terminal ausführen. Für TTY-only-CLIs, Coding-Agents und Terminal-UIs verwenden.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Ausführungsort. `auto` wird zu `sandbox` aufgelöst, wenn eine Sandbox-Laufzeit aktiv ist, andernfalls zu `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Durchsetzungsmodus für die Ausführung über `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Verhalten der Genehmigungsabfrage für die Ausführung über `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Node-ID/-Name, wenn `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Elevated-Modus anfordern — die Sandbox auf den konfigurierten Host-Pfad verlassen. `security=full` wird nur erzwungen, wenn elevated zu `full` aufgelöst wird.
</ParamField>

Hinweise:

- `host` ist standardmäßig `auto`: Sandbox, wenn die Sandbox-Laufzeit für die Sitzung aktiv ist, andernfalls Gateway.
- `host` akzeptiert nur `auto`, `sandbox`, `gateway` oder `node`. Es ist kein Hostname-Selektor; hostnameartige Werte werden abgelehnt, bevor der Befehl ausgeführt wird.
- `auto` ist die standardmäßige Routingstrategie, kein Platzhalter. Pro Aufruf ist `host=node` aus `auto` erlaubt; pro Aufruf ist `host=gateway` nur erlaubt, wenn keine Sandbox-Laufzeit aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin einfach: Keine Sandbox bedeutet, dass es zu `gateway` aufgelöst wird; eine aktive Sandbox bedeutet, dass es in der Sandbox bleibt.
- `elevated` verlässt die Sandbox auf den konfigurierten Host-Pfad: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` (oder der Sitzungsstandard `host=node` ist). Es ist nur verfügbar, wenn elevated Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- Genehmigungen für `gateway`/`node` werden durch `~/.openclaw/exec-approvals.json` gesteuert.
- `node` erfordert einen gekoppelten Node (Companion-App oder headless Node-Host).
- Wenn mehrere Nodes verfügbar sind, legen Sie `exec.node` oder `tools.exec.node` fest, um einen auszuwählen.
- `exec host=node` ist der einzige Shell-Ausführungspfad für Nodes; der alte `nodes.run`-Wrapper wurde entfernt.
- `timeout` gilt für Vordergrund-, Hintergrund-, `yieldMs`-, Gateway-, Sandbox- und Node-`system.run`-Ausführung. Wenn es ausgelassen wird, verwendet OpenClaw `tools.exec.timeoutSec`; ein explizites `timeout: 0` deaktiviert das exec-Prozess-Timeout für diesen Aufruf.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn gesetzt; wenn `SHELL` `fish` ist, bevorzugt es `bash` (oder `sh`)
  aus `PATH`, um fish-inkompatible Skripte zu vermeiden, und fällt dann auf `SHELL` zurück, wenn keines davon existiert.
- Auf Windows-Hosts bevorzugt exec die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH)
  und fällt dann auf Windows PowerShell 5.1 zurück.
- Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um
  Binary-Hijacking oder injizierten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den exec-Tool-Kontext erkennen können.
- `openclaw channels login` wird von `exec` blockiert, weil es ein interaktiver Channel-Auth-Flow ist; führen Sie ihn in einem Terminal auf dem Gateway-Host aus oder verwenden Sie aus dem Chat das channel-native Login-Tool, sofern eines vorhanden ist.
- Wichtig: Sandboxing ist **standardmäßig deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin geschlossen fehl, statt stillschweigend
  auf dem Gateway-Host zu laufen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Skript-Preflight-Prüfungen (für häufige Python-/Node-Shell-Syntaxfehler) inspizieren nur Dateien innerhalb der
  effektiven `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird Preflight für
  diese Datei übersprungen.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf das automatische
  Abschluss-Wake, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingabe oder Eingriffe; emulieren Sie keine
  Planung mit Sleep-Schleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeit, die später oder nach Zeitplan stattfinden soll, verwenden Sie cron statt
  `exec`-Sleep-/Delay-Mustern.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): Wenn true, stellen in den Hintergrund verschobene exec-Sitzungen beim Beenden ein Systemereignis ein und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): Eine einzelne „running“-Benachrichtigung ausgeben, wenn ein genehmigungspflichtiger exec länger läuft als dieser Wert (0 deaktiviert).
- `tools.exec.timeoutSec` (Standard: 1800): Standardmäßiges exec-Timeout pro Befehl in Sekunden. `timeout` pro Aufruf überschreibt es; `timeout: 0` pro Aufruf deaktiviert das exec-Prozess-Timeout.
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox` aufgelöst, wenn die Sandbox-Laufzeit aktiv ist, andernfalls zu `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Host-exec ohne Genehmigung ist der Standard für Gateway + Node. Wenn Sie Genehmigungs-/Allowlist-Verhalten wünschen, verschärfen Sie sowohl `tools.exec.*` als auch die Host-Datei `~/.openclaw/exec-approvals.json`; siehe [Exec-Genehmigungen](/de/tools/exec-approvals#no-approval-yolo-mode).
- YOLO stammt aus den Host-Policy-Standards (`security=full`, `ask=off`), nicht aus `host=auto`. Wenn Sie Gateway- oder Node-Routing erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- Im Modus `security=full` plus `ask=off` folgt Host-exec direkt der konfigurierten Policy; es gibt keine zusätzliche heuristische Prefilter-Schicht für Befehlsverschleierung oder Skript-Preflight-Ablehnung.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): Wenn true, erfordern Inline-Interpreter-Eval-Formen wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` immer eine explizite Genehmigung. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, aber Inline-Eval-Formen fragen trotzdem jedes Mal nach.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die `PATH` für exec-Läufe vorangestellt werden (nur Gateway + Sandbox).
- `tools.exec.safeBins`: stdin-only sichere Binaries, die ohne explizite Allowlist-Einträge laufen können. Verhaltensdetails finden Sie unter [Sichere Binaries](/de/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: Zusätzliche explizite Verzeichnisse, denen für `safeBins`-Pfadprüfungen vertraut wird. `PATH`-Einträge werden nie automatisch als vertrauenswürdig eingestuft. Eingebaute Standards sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: Optionale benutzerdefinierte argv-Policy pro sicherem Binary (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

### PATH-Handhabung

- `host=gateway`: Führt Ihr Login-Shell-`PATH` mit der exec-Umgebung zusammen. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgelehnt. Der Daemon selbst läuft weiterhin mit einem minimalen `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: Führt `sh -lc` (Login-Shell) im Container aus, daher kann `/etc/profile` `PATH` zurücksetzen.
  OpenClaw stellt `env.PATH` nach dem Laden des Profils über eine interne Umgebungsvariable voran (keine Shell-Interpolation);
  `tools.exec.pathPrepend` gilt hier ebenfalls.
- `host=node`: Nur nicht blockierte env-Überschreibungen, die Sie übergeben, werden an den Node gesendet. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einem Node benötigen,
  konfigurieren Sie die Umgebung des Node-Host-Dienstes (systemd/launchd) oder installieren Sie Tools an Standardorten.

Node-Bindung pro Agent (verwenden Sie den Agent-Listenindex in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Der Nodes-Tab enthält ein kleines Panel „Exec node binding“ für dieselben Einstellungen.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **sitzungsbezogene** Standards für `host`, `security`, `ask` und `node` festzulegen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Sender** berücksichtigt (Channel-Allowlists/Kopplung plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungsstatus** und schreibt keine Konfiguration. Um exec hart zu deaktivieren, verweigern Sie es über die Tool-
Policy (`tools.deny: ["exec"]` oder pro Agent). Host-Genehmigungen gelten weiterhin, sofern Sie nicht explizit
`security=full` und `ask=off` festlegen.

## Exec-Genehmigungen (Companion-App / Node-Host)

Agents in einer Sandbox können eine Genehmigung pro Anfrage erfordern, bevor `exec` auf dem Gateway- oder Node-Host läuft.
Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für Policy, Allowlist und UI-Flow.

Wenn Genehmigungen erforderlich sind, gibt das exec-Tool sofort
`status: "approval-pending"` und eine Genehmigungs-ID zurück. Nach Genehmigung (oder Ablehnung / Timeout)
sendet der Gateway Systemereignisse (`Exec finished` / `Exec denied`). Wenn der Befehl nach
`tools.exec.approvalRunningNoticeMs` noch läuft, wird eine einzelne `Exec running`-Benachrichtigung ausgegeben.
Auf Channels mit nativen Genehmigungskarten/-Buttons sollte sich der Agent zuerst auf diese
native UI verlassen und nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-
Ergebnis ausdrücklich sagt, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der
einzige Pfad ist.

## Allowlist + sichere Binaries

Die manuelle Allowlist-Durchsetzung gleicht aufgelöste Binary-Pfadglobs und bloße Befehlsnamen-
Globs ab. Bloße Namen passen nur auf Befehle, die über PATH aufgerufen werden, sodass `rg` auf
`/opt/homebrew/bin/rg` passen kann, wenn der Befehl `rg` ist, aber nicht auf `./rg` oder `/tmp/rg`.
Wenn `security=allowlist` gilt, werden Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-
Segment auf der Allowlist steht oder ein sicheres Binary ist. Verkettung (`;`, `&&`, `||`) und Umleitungen
werden im Allowlist-Modus abgelehnt, sofern nicht jedes Top-Level-Segment die
Allowlist erfüllt (einschließlich sicherer Binaries). Umleitungen bleiben nicht unterstützt.
Dauerhaftes `allow-always`-Vertrauen umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Top-Level-Segment passt.

`autoAllowSkills` ist ein separater Komfortpfad in exec-Genehmigungen. Es ist nicht dasselbe wie
manuelle Pfad-Allowlist-Einträge. Für strikt explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerelemente für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine stdin-only-Streamfilter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für ausführbare Pfade sicherer Binaries.
- `tools.exec.safeBinProfiles`: explizite argv-Policy für benutzerdefinierte sichere Binaries.
- allowlist: explizites Vertrauen für ausführbare Pfade.

Behandeln Sie `safeBins` nicht als generische Allowlist, und fügen Sie keine Interpreter-/Runtime-Binaries hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsaufforderungen aktiviert.
`openclaw security audit` warnt, wenn Interpreter-/Runtime-`safeBins`-Einträge keine expliziten Profile haben, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge anlegen.
`openclaw security audit` und `openclaw doctor` warnen außerdem, wenn Sie Broad-Behavior-Bins wie `jq` explizit wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter explizit auf die Allowlist setzen, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Code-Eval-Formen weiterhin eine neue Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals-advanced#safe-bins-stdin-only) und [Safe bins versus Allowlist](/de/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Beispiele

Vordergrund:

```json
{ "tool": "exec", "command": "ls -la" }
```

Hintergrund + Abruf:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Abruf ist für Status bei Bedarf gedacht, nicht für Warteschleifen. Wenn automatische Abschluss-Wecksignale
aktiviert sind, kann der Befehl die Sitzung wecken, wenn er Ausgabe erzeugt oder fehlschlägt.

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

Einfügen (standardmäßig bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Untertool von `exec` für strukturierte Multi-Datei-Änderungen.
Es ist standardmäßig für OpenAI- und OpenAI Codex-Modelle aktiviert. Verwenden Sie die Konfiguration nur,
wenn Sie es deaktivieren oder auf bestimmte Modelle beschränken möchten:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Hinweise:

- Nur für OpenAI-/OpenAI Codex-Modelle verfügbar.
- Die Tool-Richtlinie gilt weiterhin; `allow: ["write"]` erlaubt implizit `apply_patch`.
- Die Konfiguration befindet sich unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ist standardmäßig `true`; setzen Sie es auf `false`, um das Tool für OpenAI-Modelle zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Workspace beschränkt). Setzen Sie es nur dann auf `false`, wenn Sie bewusst möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.

## Verwandt

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungs-Gates für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Ausführen von Befehlen in Sandbox-Umgebungen
- [Hintergrundprozess](/de/gateway/background-process) — lang laufendes Exec- und Process-Tool
- [Sicherheit](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
