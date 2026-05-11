---
read_when:
    - Verwenden oder Ändern des exec-Tools
    - Debuggen des stdin- oder TTY-Verhaltens
summary: Exec-Tool-Nutzung, stdin-Modi und TTY-Unterstützung
title: Ausführungstool
x-i18n:
    generated_at: "2026-05-11T20:37:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

Führen Sie Shell-Befehle im Arbeitsbereich aus. `exec` ist eine mutierende Shell-Oberfläche: Befehle können Dateien überall dort erstellen, bearbeiten oder löschen, wo das ausgewählte Host- oder Sandbox-Dateisystem dies erlaubt. Das Deaktivieren von OpenClaw-Dateisystemtools wie `write`, `edit` oder `apply_patch` macht `exec` nicht schreibgeschützt.

Unterstützt Vordergrund- und Hintergrundausführung über `process`. Wenn `process` nicht erlaubt ist, wird `exec` synchron ausgeführt und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent begrenzt; `process` sieht nur Sitzungen desselben Agenten.

## Parameter

<ParamField path="command" type="string" required>
Auszuführender Shell-Befehl.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Arbeitsverzeichnis für den Befehl.
</ParamField>

<ParamField path="env" type="object">
Schlüssel/Wert-Umgebungsüberschreibungen, die über die geerbte Umgebung gelegt werden.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Den Befehl nach dieser Verzögerung (ms) automatisch in den Hintergrund verschieben.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Den Befehl sofort in den Hintergrund verschieben, statt auf `yieldMs` zu warten.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Überschreibt das konfigurierte Exec-Timeout für diesen Aufruf. Setzen Sie `timeout: 0` nur, wenn der Befehl ohne Exec-Prozess-Timeout laufen soll.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Nach Möglichkeit in einem Pseudo-Terminal ausführen. Verwenden Sie dies für reine TTY-CLIs, Coding-Agents und Terminal-UIs.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Wo die Ausführung erfolgen soll. `auto` wird zu `sandbox` aufgelöst, wenn eine Sandbox-Laufzeit aktiv ist, andernfalls zu `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Wird für normale Tool-Aufrufe ignoriert. Die Sicherheit von `gateway` / `node` wird durch
`tools.exec.security` und `~/.openclaw/exec-approvals.json` gesteuert; der erhöhte Modus kann
`security=full` nur erzwingen, wenn der Operator ausdrücklich erhöhten Zugriff gewährt.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Verhalten der Genehmigungsabfrage für die Ausführung über `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Node-ID/-Name, wenn `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Erhöhten Modus anfordern — aus der Sandbox auf den konfigurierten Host-Pfad ausbrechen. `security=full` wird nur erzwungen, wenn `elevated` zu `full` aufgelöst wird.
</ParamField>

Hinweise:

- `host` ist standardmäßig `auto`: Sandbox, wenn die Sandbox-Laufzeit für die Sitzung aktiv ist, andernfalls Gateway.
- `host` akzeptiert nur `auto`, `sandbox`, `gateway` oder `node`. Es ist kein Hostname-Selektor; hostnameähnliche Werte werden abgelehnt, bevor der Befehl ausgeführt wird.
- `auto` ist die standardmäßige Routing-Strategie, kein Platzhalter. Pro Aufruf ist `host=node` von `auto` aus erlaubt; pro Aufruf ist `host=gateway` nur erlaubt, wenn keine Sandbox-Laufzeit aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin einfach: Keine Sandbox bedeutet, dass es zu `gateway` aufgelöst wird; eine aktive Sandbox bedeutet, dass es in der Sandbox bleibt.
- `elevated` bricht aus der Sandbox auf den konfigurierten Host-Pfad aus: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` gesetzt ist (oder die Sitzungs-Voreinstellung `host=node` ist). Es ist nur verfügbar, wenn erhöhter Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- Genehmigungen für `gateway`/`node` werden durch `~/.openclaw/exec-approvals.json` gesteuert.
- `node` erfordert einen gekoppelten Node (Companion-App oder Headless-Node-Host).
- Wenn mehrere Nodes verfügbar sind, setzen Sie `exec.node` oder `tools.exec.node`, um einen auszuwählen.
- `exec host=node` ist der einzige Shell-Ausführungspfad für Nodes; der alte Wrapper `nodes.run` wurde entfernt.
- `timeout` gilt für Vordergrund-, Hintergrund-, `yieldMs`-, Gateway-, Sandbox- und Node-`system.run`-Ausführung. Wenn es ausgelassen wird, verwendet OpenClaw `tools.exec.timeoutSec`; ein explizites `timeout: 0` deaktiviert das Exec-Prozess-Timeout für diesen Aufruf.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn gesetzt; wenn `SHELL` `fish` ist, bevorzugt es `bash` (oder `sh`)
  aus `PATH`, um fish-inkompatible Skripte zu vermeiden, und fällt dann auf `SHELL` zurück, wenn keines davon existiert.
- Auf Windows-Hosts bevorzugt exec die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH)
  und fällt dann auf Windows PowerShell 5.1 zurück.
- Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um
  Binary-Hijacking oder eingeschleusten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Exec-Tool-Kontext erkennen können.
- `openclaw channels login` ist in `exec` blockiert, weil es ein interaktiver Kanal-Authentifizierungsablauf ist; führen Sie ihn in einem Terminal auf dem Gateway-Host aus, oder verwenden Sie das kanaleigene Login-Tool aus dem Chat, sofern eines existiert.
- Wichtig: Sandboxing ist **standardmäßig deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin geschlossen fehl, statt stillschweigend
  auf dem Gateway-Host zu laufen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Skript-Preflight-Prüfungen (für häufige Python-/Node-Shell-Syntaxfehler) prüfen nur Dateien innerhalb der
  effektiven `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird der Preflight für
  diese Datei übersprungen.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf automatisches
  Abschluss-Wecken, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingabe oder Eingriffe; imitieren Sie keine
  Planung mit Sleep-Schleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeit, die später oder nach Zeitplan stattfinden soll, verwenden Sie Cron statt
  `exec`-Sleep-/Delay-Mustern.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): Wenn true, stellen in den Hintergrund verschobene Exec-Sitzungen beim Beenden ein Systemereignis in die Warteschlange und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): Gibt eine einzelne „running“-Benachrichtigung aus, wenn ein genehmigungspflichtiger Exec länger als dies läuft (0 deaktiviert).
- `tools.exec.timeoutSec` (Standard: 1800): Standardmäßiges Exec-Timeout pro Befehl in Sekunden. `timeout` pro Aufruf überschreibt es; `timeout: 0` pro Aufruf deaktiviert das Exec-Prozess-Timeout.
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox` aufgelöst, wenn die Sandbox-Laufzeit aktiv ist, andernfalls zu `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Genehmigungsfreies Host-Exec ist der Standard für Gateway + Node. Wenn Sie Genehmigungen/Allowlist-Verhalten wünschen, verschärfen Sie sowohl `tools.exec.*` als auch die Host-Datei `~/.openclaw/exec-approvals.json`; siehe [Exec-Genehmigungen](/de/tools/exec-approvals#yolo-mode-no-approval).
- YOLO stammt aus den Host-Policy-Standards (`security=full`, `ask=off`), nicht aus `host=auto`. Wenn Sie Gateway- oder Node-Routing erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- Im Modus `security=full` plus `ask=off` folgt Host-Exec direkt der konfigurierten Policy; es gibt keine zusätzliche heuristische Command-Obfuscation-Vorfilterung oder Skript-Preflight-Ablehnungsschicht.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): Wenn true, erfordern Inline-Interpreter-Eval-Formen wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` immer eine ausdrückliche Genehmigung. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, aber Inline-Eval-Formen fragen weiterhin jedes Mal nach.
- `tools.exec.commandHighlighting` (Standard: false): Wenn true, können Genehmigungsabfragen parserabgeleitete Befehlsspannen im Befehlstext hervorheben. Setzen Sie es global oder pro Agent auf `true`, um Befehlstext-Hervorhebung zu aktivieren, ohne die Exec-Genehmigungs-Policy zu ändern.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die für Exec-Läufe vor `PATH` gestellt werden (nur Gateway + Sandbox).
- `tools.exec.safeBins`: stdin-only sichere Binärdateien, die ohne explizite Allowlist-Einträge laufen können. Verhaltensdetails finden Sie unter [Safe bins](/de/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: Zusätzliche explizite Verzeichnisse, denen für `safeBins`-Pfadprüfungen vertraut wird. `PATH`-Einträge werden nie automatisch vertraut. Eingebaute Standards sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: Optionale benutzerdefinierte argv-Policy pro sicherer Binärdatei (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: Führt Ihr Login-Shell-`PATH` mit der Exec-Umgebung zusammen. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgelehnt. Der Daemon selbst läuft weiterhin mit einem minimalen `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: Führt `sh -lc` (Login-Shell) im Container aus, daher kann `/etc/profile` `PATH` zurücksetzen.
  OpenClaw stellt `env.PATH` nach dem Sourcing des Profils über eine interne Umgebungsvariable voran (keine Shell-Interpolation);
  `tools.exec.pathPrepend` gilt auch hier.
- `host=node`: Nur nicht blockierte Umgebungsüberschreibungen, die Sie übergeben, werden an den Node gesendet. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einem Node benötigen,
  konfigurieren Sie die Umgebung des Node-Host-Dienstes (systemd/launchd) oder installieren Sie Tools an Standardorten.

Node-Bindung pro Agent (verwenden Sie den Agent-Listenindex in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Steuerungs-UI: Der Tab „Nodes“ enthält ein kleines Panel „Exec node binding“ für dieselben Einstellungen.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **pro Sitzung** Standardwerte für `host`, `security`, `ask` und `node` festzulegen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Absender** berücksichtigt (Kanal-Allowlists/Kopplung plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungszustand** und schreibt keine Konfiguration. Um exec hart zu deaktivieren, verweigern Sie es über die Tool-
Policy (`tools.deny: ["exec"]` oder pro Agent). Host-Genehmigungen gelten weiterhin, sofern Sie nicht ausdrücklich
`security=full` und `ask=off` setzen.

## Exec-Genehmigungen (Companion-App / Node-Host)

Sandboxed Agents können eine Genehmigung pro Anfrage erfordern, bevor `exec` auf dem Gateway- oder Node-Host läuft.
Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für Policy, Allowlist und UI-Ablauf.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort
`status: "approval-pending"` und eine Genehmigungs-ID zurück. Nach der Genehmigung (oder Ablehnung / Zeitüberschreitung)
gibt der Gateway Systemereignisse aus (`Exec finished` / `Exec denied`). Wenn der Befehl nach
`tools.exec.approvalRunningNoticeMs` noch läuft, wird eine einzelne `Exec running`-Benachrichtigung ausgegeben.
Auf Kanälen mit nativen Genehmigungskarten/-Buttons sollte sich der Agent zuerst auf diese
native UI verlassen und nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-
Ergebnis ausdrücklich sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der
einzige Weg ist.

## Allowlist + sichere Binärdateien

Die manuelle Allowlist-Durchsetzung vergleicht aufgelöste Binärpfad-Globs und reine Befehlsnamen-
Globs. Reine Namen passen nur zu Befehlen, die über PATH aufgerufen werden, sodass `rg` zu
`/opt/homebrew/bin/rg` passen kann, wenn der Befehl `rg` ist, aber nicht zu `./rg` oder `/tmp/rg`.
Wenn `security=allowlist`, werden Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-
Segment auf der Allowlist steht oder eine sichere Binärdatei ist. Verkettung (`;`, `&&`, `||`) und Umleitungen
werden im Allowlist-Modus abgelehnt, sofern nicht jedes Top-Level-Segment die
Allowlist erfüllt (einschließlich sicherer Binärdateien). Umleitungen bleiben nicht unterstützt.
Dauerhaftes `allow-always`-Vertrauen umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Top-Level-Segment passt.

`autoAllowSkills` ist ein separater Komfortpfad in Exec-Genehmigungen. Er ist nicht dasselbe wie
manuelle Pfad-Allowlist-Einträge. Für strikt explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerelemente für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, nur stdin-basierte Stream-Filter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für Safe-Bin-Executable-Pfade.
- `tools.exec.safeBinProfiles`: explizite argv-Richtlinie für benutzerdefinierte Safe Bins.
- Zulassungsliste: explizites Vertrauen für Executable-Pfade.

Behandeln Sie `safeBins` nicht als generische Zulassungsliste, und fügen Sie keine Interpreter-/Runtime-Binärdateien hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Zulassungslisteneinträge und lassen Sie Genehmigungsaufforderungen aktiviert.
`openclaw security audit` warnt, wenn Interpreter-/Runtime-`safeBins`-Einträge keine expliziten Profile haben, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge als Gerüst anlegen.
`openclaw security audit` und `openclaw doctor` warnen außerdem, wenn Sie Bins mit breitem Verhalten wie `jq` explizit wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter explizit auf die Zulassungsliste setzen, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Code-Eval-Formen weiterhin eine neue Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals-advanced#safe-bins-stdin-only) und [Safe Bins im Vergleich zur Zulassungsliste](/de/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Beispiele

Vordergrund:

```json
{ "tool": "exec", "command": "ls -la" }
```

Hintergrund + Abfrage:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Abfragen sind für den Status bei Bedarf vorgesehen, nicht für Warteschleifen. Wenn automatisches Aufwecken bei Abschluss
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

Einfügen (standardmäßig geklammert):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Unter-Tool von `exec` für strukturierte Änderungen über mehrere Dateien hinweg.
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
- `deny: ["write"]` verweigert `apply_patch` nicht; verweigern Sie `apply_patch` explizit oder verwenden Sie `deny: ["group:fs"]`, wenn Patch-Schreibvorgänge ebenfalls blockiert werden sollen.
- Die Konfiguration befindet sich unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ist standardmäßig `true`; setzen Sie es auf `false`, um das Tool für OpenAI-Modelle zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Workspace beschränkt). Setzen Sie es nur dann auf `false`, wenn Sie absichtlich möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungssperren für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Ausführen von Befehlen in Sandbox-Umgebungen
- [Hintergrundprozess](/de/gateway/background-process) — lang laufendes Exec- und Process-Tool
- [Sicherheit](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
