---
read_when:
    - Das exec-Tool verwenden oder ändern
    - Debugging des stdin- oder TTY-Verhaltens
summary: Nutzung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Ausführungswerkzeug
x-i18n:
    generated_at: "2026-05-02T22:22:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

Führen Sie Shell-Befehle im Arbeitsbereich aus. Unterstützt Vordergrund- und Hintergrundausführung über `process`.
Wenn `process` nicht zugelassen ist, führt `exec` synchron aus und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent begrenzt; `process` sieht nur Sitzungen desselben Agents.

## Parameter

<ParamField path="command" type="string" required>
Auszuführender Shell-Befehl.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Arbeitsverzeichnis für den Befehl.
</ParamField>

<ParamField path="env" type="object">
Schlüssel/Wert-Umgebungsüberschreibungen, die mit höherer Priorität mit der geerbten Umgebung zusammengeführt werden.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Den Befehl nach dieser Verzögerung (ms) automatisch in den Hintergrund verschieben.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Den Befehl sofort in den Hintergrund verschieben, statt auf `yieldMs` zu warten.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Überschreibt das konfigurierte Exec-Timeout für diesen Aufruf. Setzen Sie `timeout: 0` nur, wenn der Befehl ohne Exec-Prozess-Timeout ausgeführt werden soll.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Wenn verfügbar, in einem Pseudo-Terminal ausführen. Verwenden Sie dies für TTY-only CLIs, Coding-Agents und Terminal-UIs.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Ausführungsort. `auto` wird zu `sandbox` aufgelöst, wenn eine Sandbox-Runtime aktiv ist, andernfalls zu `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Erzwingungsmodus für `gateway`- / `node`-Ausführung.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Verhalten der Genehmigungsabfrage für `gateway`- / `node`-Ausführung.
</ParamField>

<ParamField path="node" type="string">
Node-ID/-Name, wenn `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Erhöhten Modus anfordern – die Sandbox auf den konfigurierten Host-Pfad verlassen. `security=full` wird nur erzwungen, wenn elevated zu `full` aufgelöst wird.
</ParamField>

Hinweise:

- `host` ist standardmäßig `auto`: Sandbox, wenn die Sandbox-Runtime für die Sitzung aktiv ist, andernfalls Gateway.
- `host` akzeptiert nur `auto`, `sandbox`, `gateway` oder `node`. Es ist kein Hostname-Selektor; hostnamenähnliche Werte werden abgelehnt, bevor der Befehl ausgeführt wird.
- `auto` ist die Standard-Routingstrategie, kein Platzhalter. Pro Aufruf ist `host=node` von `auto` aus erlaubt; pro Aufruf ist `host=gateway` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin einfach: Keine Sandbox bedeutet, dass es zu `gateway` aufgelöst wird; eine aktive Sandbox bedeutet, dass es in der Sandbox bleibt.
- `elevated` verlässt die Sandbox auf den konfigurierten Host-Pfad: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` (oder die Sitzungs-Standardeinstellung `host=node` ist). Dies ist nur verfügbar, wenn erhöhter Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- `gateway`/`node`-Genehmigungen werden durch `~/.openclaw/exec-approvals.json` gesteuert.
- `node` erfordert einen gekoppelten Node (Companion-App oder headless Node-Host).
- Wenn mehrere Nodes verfügbar sind, setzen Sie `exec.node` oder `tools.exec.node`, um einen auszuwählen.
- `exec host=node` ist der einzige Shell-Ausführungspfad für Nodes; der alte `nodes.run`-Wrapper wurde entfernt.
- `timeout` gilt für Vordergrund-, Hintergrund-, `yieldMs`-, Gateway-, Sandbox- und Node-`system.run`-Ausführung. Wenn es weggelassen wird, verwendet OpenClaw `tools.exec.timeoutSec`; explizites `timeout: 0` deaktiviert das Exec-Prozess-Timeout für diesen Aufruf.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn es gesetzt ist; wenn `SHELL` `fish` ist, bevorzugt es `bash` (oder `sh`)
  aus `PATH`, um fish-inkompatible Skripte zu vermeiden, und fällt dann auf `SHELL` zurück, wenn keines davon existiert.
- Auf Windows-Hosts bevorzugt exec die PowerShell-7-Erkennung (`pwsh`) (Program Files, ProgramW6432, dann PATH),
  und fällt dann auf Windows PowerShell 5.1 zurück.
- Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um
  Binary-Hijacking oder eingeschleusten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Exec-Tool-Kontext erkennen können.
- `openclaw channels login` wird von `exec` blockiert, weil es ein interaktiver Channel-Auth-Flow ist; führen Sie es in einem Terminal auf dem Gateway-Host aus, oder verwenden Sie das channel-native Login-Tool aus dem Chat, wenn eines existiert.
- Wichtig: Sandboxing ist **standardmäßig aus**. Wenn Sandboxing aus ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin geschlossen fehl, statt stillschweigend
  auf dem Gateway-Host ausgeführt zu werden. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Skript-Preflight-Prüfungen (für häufige Python-/Node-Shell-Syntaxfehler) prüfen nur Dateien innerhalb der
  effektiven `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird der Preflight für
  diese Datei übersprungen.
- Für länger laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf den automatischen
  Abschluss-Wake, wenn er aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingabe oder Eingriff; emulieren Sie
  Scheduling nicht mit Sleep-Schleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeit, die später oder nach einem Zeitplan stattfinden soll, verwenden Sie Cron statt
  `exec`-Sleep-/Delay-Mustern.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): Wenn true, stellen in den Hintergrund verschobene exec-Sitzungen beim Beenden ein Systemereignis in die Warteschlange und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): Gibt eine einzelne „running“-Benachrichtigung aus, wenn ein genehmigungspflichtiger exec länger als dies läuft (0 deaktiviert).
- `tools.exec.timeoutSec` (Standard: 1800): Standardmäßiges Exec-Timeout pro Befehl in Sekunden. `timeout` pro Aufruf überschreibt es; `timeout: 0` pro Aufruf deaktiviert das Exec-Prozess-Timeout.
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox` aufgelöst, wenn die Sandbox-Runtime aktiv ist, andernfalls zu `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Host-exec ohne Genehmigung ist der Standard für Gateway + Node. Wenn Sie Genehmigungen/Allowlist-Verhalten möchten, verschärfen Sie sowohl `tools.exec.*` als auch die Host-Datei `~/.openclaw/exec-approvals.json`; siehe [Exec-Genehmigungen](/de/tools/exec-approvals#yolo-mode-no-approval).
- YOLO stammt aus den Host-Policy-Standards (`security=full`, `ask=off`), nicht aus `host=auto`. Wenn Sie Gateway- oder Node-Routing erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- Im Modus `security=full` plus `ask=off` folgt Host-exec direkt der konfigurierten Policy; es gibt keinen zusätzlichen heuristischen Befehlsverschleierungs-Vorfilter und keine Skript-Preflight-Ablehnungsschicht.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): Wenn true, erfordern Inline-Interpreter-Eval-Formen wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` immer eine explizite Genehmigung. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, aber Inline-Eval-Formen fragen weiterhin jedes Mal nach.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die bei exec-Ausführungen vor `PATH` gestellt werden (nur Gateway + Sandbox).
- `tools.exec.safeBins`: nur stdin-sichere Binaries, die ohne explizite Allowlist-Einträge ausgeführt werden können. Verhaltensdetails finden Sie unter [Safe bins](/de/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: Zusätzliche explizite Verzeichnisse, denen für `safeBins`-Pfadprüfungen vertraut wird. `PATH`-Einträge werden nie automatisch als vertrauenswürdig behandelt. Eingebaute Standards sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: Optionale benutzerdefinierte argv-Policy pro sicherer Binary (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: Führt Ihr Login-Shell-`PATH` mit der exec-Umgebung zusammen. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgelehnt. Der Daemon selbst läuft weiterhin mit einem minimalen `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: Führt `sh -lc` (Login-Shell) innerhalb des Containers aus, sodass `/etc/profile` `PATH` zurücksetzen kann.
  OpenClaw stellt `env.PATH` nach dem Laden des Profils über eine interne Umgebungsvariable voran (keine Shell-Interpolation);
  `tools.exec.pathPrepend` gilt hier ebenfalls.
- `host=node`: Nur nicht blockierte Umgebungsüberschreibungen, die Sie übergeben, werden an den Node gesendet. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einem Node benötigen,
  konfigurieren Sie die Umgebung des Node-Host-Dienstes (systemd/launchd) oder installieren Sie Tools an Standardorten.

Node-Bindung pro Agent (verwenden Sie den Index der Agentenliste in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Der Nodes-Tab enthält ein kleines Panel „Exec node binding“ für dieselben Einstellungen.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **sitzungsspezifische** Standards für `host`, `security`, `ask` und `node` festzulegen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Absender** berücksichtigt (Channel-Allowlists/Kopplung plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungszustand** und schreibt keine Konfiguration. Um exec hart zu deaktivieren, verweigern Sie es über die Tool-
Policy (`tools.deny: ["exec"]` oder pro Agent). Host-Genehmigungen gelten weiterhin, sofern Sie nicht explizit
`security=full` und `ask=off` setzen.

## Exec-Genehmigungen (Companion-App / Node-Host)

Sandbox-Agents können vor der Ausführung von `exec` auf dem Gateway- oder Node-Host eine Genehmigung pro Anfrage verlangen.
Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für Policy, Allowlist und UI-Ablauf.

Wenn Genehmigungen erforderlich sind, gibt das exec-Tool sofort
`status: "approval-pending"` und eine Genehmigungs-ID zurück. Nach Genehmigung (oder Ablehnung / Zeitüberschreitung)
gibt der Gateway Systemereignisse aus (`Exec finished` / `Exec denied`). Wenn der Befehl nach
`tools.exec.approvalRunningNoticeMs` noch ausgeführt wird, wird eine einzelne `Exec running`-Benachrichtigung ausgegeben.
In Channels mit nativen Genehmigungskarten/-buttons sollte sich der Agent zuerst auf diese
native UI verlassen und nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-
Ergebnis explizit sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der
einzige Weg ist.

## Allowlist + Safe bins

Manuelle Allowlist-Erzwingung gleicht aufgelöste Binary-Pfad-Globs und reine Befehlsnamen-
Globs ab. Reine Namen passen nur auf Befehle, die über PATH aufgerufen werden, sodass `rg` auf
`/opt/homebrew/bin/rg` passen kann, wenn der Befehl `rg` ist, aber nicht auf `./rg` oder `/tmp/rg`.
Wenn `security=allowlist`, werden Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-
Segment in der Allowlist enthalten oder eine sichere Binary ist. Verkettung (`;`, `&&`, `||`) und Umleitungen
werden im Allowlist-Modus abgelehnt, sofern nicht jedes Segment der obersten Ebene die
Allowlist erfüllt (einschließlich Safe bins). Umleitungen bleiben nicht unterstützt.
Dauerhaftes `allow-always`-Vertrauen umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Segment der obersten Ebene passt.

`autoAllowSkills` ist ein separater Komfortpfad in exec-Genehmigungen. Es ist nicht dasselbe wie
manuelle Pfad-Allowlist-Einträge. Für strikt explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerungen für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, stdin-only Stream-Filter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für ausführbare Safe-bin-Pfade.
- `tools.exec.safeBinProfiles`: explizite argv-Policy für benutzerdefinierte Safe bins.
- Allowlist: explizites Vertrauen für ausführbare Pfade.

Behandeln Sie `safeBins` nicht als generische Allowlist, und fügen Sie keine Interpreter-/Runtime-Binärdateien hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsabfragen aktiviert.
`openclaw security audit` warnt, wenn Interpreter-/Runtime-`safeBins`-Einträge keine expliziten Profile haben, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge erstellen.
`openclaw security audit` und `openclaw doctor` warnen außerdem, wenn Sie ausdrücklich Bins mit breitem Verhalten wie `jq` wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter ausdrücklich in die Allowlist aufnehmen, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Code-Eval-Formen weiterhin eine neue Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals-advanced#safe-bins-stdin-only) und [Safe bins gegenüber Allowlist](/de/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Beispiele

Vordergrund:

```json
{ "tool": "exec", "command": "ls -la" }
```

Hintergrund + Polling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling ist für Statusabfragen bei Bedarf gedacht, nicht für Warteschleifen. Wenn automatisches Aufwecken bei Abschluss
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

Einfügen (standardmäßig bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Subtool von `exec` für strukturierte Bearbeitungen über mehrere Dateien hinweg.
Es ist für OpenAI- und OpenAI Codex-Modelle standardmäßig aktiviert. Verwenden Sie Konfiguration nur,
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
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Arbeitsbereich beschränkt). Setzen Sie es nur dann auf `false`, wenn Sie `apply_patch` bewusst außerhalb des Arbeitsbereichsverzeichnisses schreiben/löschen lassen möchten.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungs-Gates für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Ausführen von Befehlen in Sandbox-Umgebungen
- [Hintergrundprozess](/de/gateway/background-process) — lang laufendes Exec- und Process-Tool
- [Sicherheit](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
