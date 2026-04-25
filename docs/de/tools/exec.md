---
read_when:
    - Verwenden oder Ändern des Exec-Tools
    - Fehlerbehebung bei stdin- oder TTY-Verhalten
summary: Nutzung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Exec-Tool
x-i18n:
    generated_at: "2026-04-25T13:57:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

Shell-Befehle im Workspace ausführen. Unterstützt Vordergrund- und Hintergrundausführung über `process`.
Wenn `process` nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent abgegrenzt; `process` sieht nur Sitzungen desselben Agenten.

## Parameter

<ParamField path="command" type="string" required>
Auszuführender Shell-Befehl.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Arbeitsverzeichnis für den Befehl.
</ParamField>

<ParamField path="env" type="object">
Key/Value-Überschreibungen für Umgebungsvariablen, die zur geerbten Umgebung hinzugefügt werden.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Den Befehl nach dieser Verzögerung (ms) automatisch in den Hintergrund verschieben.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Den Befehl sofort in den Hintergrund verschieben, statt auf `yieldMs` zu warten.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Den Befehl nach dieser Anzahl von Sekunden beenden.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
In einem Pseudo-Terminal ausführen, wenn verfügbar. Verwenden Sie dies für rein TTY-basierte CLIs, Coding-Agenten und Terminal-UIs.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Wo ausgeführt werden soll. `auto` wird zu `sandbox` aufgelöst, wenn eine Sandbox-Laufzeit aktiv ist, andernfalls zu `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Erzwingungsmodus für die Ausführung auf `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Verhalten bei Genehmigungsaufforderungen für die Ausführung auf `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Node-ID/-Name, wenn `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Erhöhten Modus anfordern — die Sandbox verlassen und auf den konfigurierten Host-Pfad wechseln. `security=full` wird nur dann erzwungen, wenn `elevated` zu `full` aufgelöst wird.
</ParamField>

Hinweise:

- `host` ist standardmäßig `auto`: Sandbox, wenn für die Sitzung eine Sandbox-Laufzeit aktiv ist, andernfalls Gateway.
- `auto` ist die Standard-Routing-Strategie, kein Wildcard. Pro Aufruf ist `host=node` von `auto` aus erlaubt; pro Aufruf ist `host=gateway` nur erlaubt, wenn keine Sandbox-Laufzeit aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin „einfach so“: ohne Sandbox wird es zu `gateway` aufgelöst; bei aktiver Sandbox bleibt es in der Sandbox.
- `elevated` verlässt die Sandbox und wechselt auf den konfigurierten Host-Pfad: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` gesetzt ist (oder der Sitzungsstandard `host=node` ist). Es ist nur verfügbar, wenn erhöhter Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- Genehmigungen für `gateway`/`node` werden über `~/.openclaw/exec-approvals.json` gesteuert.
- `node` erfordert eine gekoppelte Node (Companion-App oder Headless-Node-Host).
- Wenn mehrere Nodes verfügbar sind, setzen Sie `exec.node` oder `tools.exec.node`, um eine auszuwählen.
- `exec host=node` ist der einzige Shell-Ausführungspfad für Nodes; der veraltete Wrapper `nodes.run` wurde entfernt.
- Auf Hosts, die nicht Windows sind, verwendet `exec` `SHELL`, wenn es gesetzt ist; wenn `SHELL` `fish` ist, wird `bash` (oder `sh`)
  aus `PATH` bevorzugt, um mit `fish` inkompatible Skripte zu vermeiden; erst dann wird auf `SHELL` zurückgefallen, wenn keines von beiden existiert.
- Auf Windows-Hosts bevorzugt `exec` die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH),
  und fällt dann auf Windows PowerShell 5.1 zurück.
- Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Overrides (`LD_*`/`DYLD_*`) ab, um
  Binär-Hijacking oder injizierten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Kontext des Exec-Tools erkennen können.
- Wichtig: Sandboxing ist standardmäßig **deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin fail-closed fehl, statt stillschweigend
  auf dem Gateway-Host zu laufen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Preflight-Prüfungen für Skripte (bei häufigen Python-/Node-Fehlern in der Shell-Syntax) untersuchen nur Dateien innerhalb
  der effektiven Grenze von `workdir`. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird Preflight für
  diese Datei übersprungen.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf
  das automatische Aufwecken bei Abschluss, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingaben oder Eingriffe; emulieren Sie keine
  Zeitplanung mit Sleep-Schleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeit, die später oder nach einem Zeitplan erfolgen soll, verwenden Sie Cron statt
  `exec`-Muster mit Sleep/Verzögerungen.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): Wenn true, stellen im Hintergrund ausgeführte Exec-Sitzungen beim Beenden ein Systemereignis in die Queue und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): gibt einen einzelnen „running“-Hinweis aus, wenn ein genehmigungspflichtiger Exec länger als dieser Wert läuft (0 deaktiviert).
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox` aufgelöst, wenn eine Sandbox-Laufzeit aktiv ist, andernfalls `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Host-Exec ohne Genehmigung ist der Standard für Gateway + Node. Wenn Sie Verhalten mit Genehmigungen/Allowlist möchten, verschärfen Sie sowohl `tools.exec.*` als auch die Host-Richtlinie `~/.openclaw/exec-approvals.json`; siehe [Exec approvals](/de/tools/exec-approvals#no-approval-yolo-mode).
- YOLO stammt aus den Standardwerten der Host-Richtlinie (`security=full`, `ask=off`), nicht aus `host=auto`. Wenn Sie Gateway- oder Node-Routing erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- Im Modus `security=full` plus `ask=off` folgt Host-Exec direkt der konfigurierten Richtlinie; es gibt keine zusätzliche heuristische Vorfilterung verschleierter Befehle oder Preflight-Ablehnung von Skripten.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): Wenn true, erfordern Inline-Eval-Formen von Interpretern wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` immer eine explizite Genehmigung. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, aber Inline-Eval-Formen fragen trotzdem jedes Mal nach.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die `PATH` für Exec-Läufe vorangestellt werden (nur Gateway + Sandbox).
- `tools.exec.safeBins`: stdin-only sichere Binärdateien, die ohne explizite Allowlist-Einträge ausgeführt werden können. Details zum Verhalten finden Sie unter [Safe bins](/de/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: zusätzliche explizite Verzeichnisse, denen für Pfadprüfungen von `safeBins` vertraut wird. `PATH`-Einträge werden nie automatisch als vertrauenswürdig behandelt. Eingebaute Standards sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: optionale benutzerdefinierte argv-Richtlinien pro sicherer Binärdatei (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: führt Ihren `PATH` der Login-Shell mit der Exec-Umgebung zusammen. Overrides für
  `env.PATH` werden für Host-Ausführung abgelehnt. Der Daemon selbst läuft weiterhin mit einem minimalen `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: führt `sh -lc` (Login-Shell) innerhalb des Containers aus, sodass `/etc/profile` `PATH` zurücksetzen kann.
  OpenClaw stellt `env.PATH` nach dem Laden des Profils über eine interne Umgebungsvariable voran (ohne Shell-Interpolation);
  `tools.exec.pathPrepend` gilt hier ebenfalls.
- `host=node`: nur nicht blockierte Env-Overrides, die Sie übergeben, werden an die Node gesendet. Overrides für `env.PATH` werden
  für Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einer Node benötigen,
  konfigurieren Sie die Dienstumgebung des Node-Hosts (systemd/launchd) oder installieren Sie Tools an Standardorten.

Node-Bindung pro Agent (verwenden Sie den Index der Agentenliste in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Der Tab „Nodes“ enthält ein kleines Panel „Exec node binding“ für dieselben Einstellungen.

## Sitzungs-Overrides (`/exec`)

Verwenden Sie `/exec`, um **pro Sitzung** Standardwerte für `host`, `security`, `ask` und `node` zu setzen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Absender** berücksichtigt (Channel-Allowlists/Kopplung plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungsstatus** und schreibt keine Konfiguration. Um Exec hart zu deaktivieren, verbieten Sie es über die Tool-
Richtlinie (`tools.deny: ["exec"]` oder pro Agent). Host-Genehmigungen gelten weiterhin, sofern Sie nicht explizit `security=full` und `ask=off` setzen.

## Exec-Genehmigungen (Companion-App / Node-Host)

Sandboxed Agents können pro Anfrage eine Genehmigung verlangen, bevor `exec` auf dem Gateway oder Node-Host ausgeführt wird.
Siehe [Exec approvals](/de/tools/exec-approvals) für Richtlinie, Allowlist und UI-Ablauf.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort mit
`status: "approval-pending"` und einer Genehmigungs-ID zurück. Sobald genehmigt (oder abgelehnt / per Timeout beendet),
gibt das Gateway Systemereignisse aus (`Exec finished` / `Exec denied`). Wenn der Befehl weiterhin
nach `tools.exec.approvalRunningNoticeMs` läuft, wird ein einzelner Hinweis `Exec running` ausgegeben.
Auf Kanälen mit nativen Genehmigungskarten/-buttons sollte sich der Agent zuerst auf diese
native UI verlassen und nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-
Ergebnis explizit sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der
einzige Weg ist.

## Allowlist + Safe Bins

Die manuelle Durchsetzung der Allowlist vergleicht Globs für aufgelöste Binärpfade und Globs für nackte Befehlsnamen.
Nackte Namen passen nur zu Befehlen, die über PATH aufgerufen werden, sodass `rg` zu
`/opt/homebrew/bin/rg` passen kann, wenn der Befehl `rg` ist, aber nicht zu `./rg` oder `/tmp/rg`.
Wenn `security=allowlist` gesetzt ist, werden Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-
Segment auf der Allowlist steht oder eine sichere Binärdatei ist. Verkettung (`;`, `&&`, `||`) und Umleitungen
werden im Allowlist-Modus abgelehnt, sofern nicht jedes Top-Level-Segment die
Allowlist erfüllt (einschließlich sicherer Binärdateien). Umleitungen bleiben nicht unterstützt.
Dauerhaftes Vertrauen über `allow-always` umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Top-Level-Segment passt.

`autoAllowSkills` ist ein separater Komfortpfad in Exec-Genehmigungen. Es ist nicht dasselbe wie
manuelle Allowlist-Einträge für Pfade. Für strikt explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerungen für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, stdin-only Stream-Filter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für Pfade ausführbarer Safe-Bin-Dateien.
- `tools.exec.safeBinProfiles`: explizite argv-Richtlinie für benutzerdefinierte Safe Bins.
- Allowlist: explizites Vertrauen für ausführbare Pfade.

Behandeln Sie `safeBins` nicht als generische Allowlist und fügen Sie keine Interpreter-/Runtime-Binärdateien hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsaufforderungen aktiviert.
`openclaw security audit` warnt, wenn für Einträge von Interpreter-/Runtime-`safeBins` explizite Profile fehlen, und `openclaw doctor --fix` kann fehlende benutzerdefinierte Einträge für `safeBinProfiles` erzeugen.
`openclaw security audit` und `openclaw doctor` warnen außerdem, wenn Sie bewusst Binärdateien mit breitem Verhalten wie `jq` wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter explizit auf die Allowlist setzen, aktivieren Sie `tools.exec.strictInlineEval`, damit Formen mit Inline-Code-Eval weiterhin eine frische Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec approvals](/de/tools/exec-approvals-advanced#safe-bins-stdin-only) und [Safe bins versus allowlist](/de/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Polling ist für bedarfsabhängigen Status gedacht, nicht für Warteschleifen. Wenn automatisches Aufwecken bei Abschluss
aktiviert ist, kann der Befehl die Sitzung aufwecken, wenn er Ausgabe erzeugt oder fehlschlägt.

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

Einfügen (standardmäßig in Klammern):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Untertool von `exec` für strukturierte Bearbeitungen über mehrere Dateien.
Es ist standardmäßig für OpenAI- und OpenAI-Codex-Modelle aktiviert. Verwenden Sie Konfiguration nur dann,
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

- Nur für OpenAI-/OpenAI-Codex-Modelle verfügbar.
- Die Tool-Richtlinie gilt weiterhin; `allow: ["write"]` erlaubt implizit auch `apply_patch`.
- Die Konfiguration liegt unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ist standardmäßig `true`; setzen Sie es auf `false`, um das Tool für OpenAI-Modelle zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Workspace beschränkt). Setzen Sie es nur dann auf `false`, wenn Sie absichtlich möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.

## Verwandt

- [Exec Approvals](/de/tools/exec-approvals) — Genehmigungsschranken für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Befehle in Sandbox-Umgebungen ausführen
- [Background Process](/de/gateway/background-process) — lang laufendes Exec und Process Tool
- [Security](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
