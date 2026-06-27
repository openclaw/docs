---
read_when:
    - Das exec-Tool verwenden oder ändern
    - Debugging von stdin- oder TTY-Verhalten
summary: Exec-Tool-Nutzung, stdin-Modi und TTY-Unterstützung
title: Exec-Tool
x-i18n:
    generated_at: "2026-06-27T18:18:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Führen Sie Shell-Befehle im Workspace aus. `exec` ist eine mutierende Shell-Oberfläche: Befehle können Dateien überall dort erstellen, bearbeiten oder löschen, wo der ausgewählte Host oder das Sandbox-Dateisystem dies erlaubt. Das Deaktivieren von OpenClaw-Dateisystemtools wie `write`, `edit` oder `apply_patch` macht `exec` nicht schreibgeschützt.

Unterstützt Vordergrund- und Hintergrundausführung über `process`. Wenn `process` nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent begrenzt; `process` sieht nur Sitzungen desselben Agents.

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
Überschreibt das konfigurierte exec-Timeout für diesen Aufruf. Setzen Sie `timeout: 0` nur, wenn der Befehl ohne exec-Prozess-Timeout laufen soll.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Wenn verfügbar, in einem Pseudo-Terminal ausführen. Verwenden Sie dies für TTY-only-CLIs, Coding Agents und Terminal-UIs.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Ausführungsort. `auto` wird zu `sandbox` aufgelöst, wenn eine Sandbox-Runtime aktiv ist, andernfalls zu `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Wird für normale Tool-Aufrufe ignoriert. `gateway`- / `node`-Sicherheit wird durch
`tools.exec.security` und die Host-Genehmigungsdatei gesteuert; der erhöhte Modus kann
`security=full` nur erzwingen, wenn der Operator erhöhten Zugriff ausdrücklich gewährt.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Der grundlegende Abfragemodus stammt aus `tools.exec.ask` und den Host-Genehmigungen.
Bei kanalbasierten Modellaufrufen wird `ask` pro Aufruf ignoriert, wenn die
effektive Host-Abfrage `off` ist; andernfalls kann sie nur auf einen strengeren
Modus verschärft werden. Vertrauenswürdige interne/API-Aufrufer, die exec-Tools mit einem
expliziten `ask`-Wert konstruieren, bleiben unverändert.
</ParamField>

<ParamField path="node" type="string">
Node-ID/-Name, wenn `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Erhöhten Modus anfordern — die Sandbox auf den konfigurierten Host-Pfad verlassen. `security=full` wird nur erzwungen, wenn `elevated` zu `full` aufgelöst wird.
</ParamField>

Hinweise:

- `host` ist standardmäßig `auto`: Sandbox, wenn die Sandbox-Runtime für die Sitzung aktiv ist, andernfalls Gateway.
- `host` akzeptiert nur `auto`, `sandbox`, `gateway` oder `node`. Es ist kein Hostnamen-Selektor; hostnamenartige Werte werden abgelehnt, bevor der Befehl ausgeführt wird.
- `auto` ist die Standard-Routingstrategie, kein Platzhalter. Pro Aufruf ist `host=node` aus `auto` erlaubt; `host=gateway` pro Aufruf ist nur erlaubt, wenn keine Sandbox-Runtime aktiv ist.
- `tools.exec.mode` ist der normalisierte Richtlinienregler. Werte sind `deny`, `allowlist`, `ask`, `auto` und `full`. `auto` führt deterministische Allowlist-/Safe-Bin-Treffer direkt aus und leitet jeden verbleibenden exec-Genehmigungsfall durch den nativen Auto-Reviewer von OpenClaw, bevor ein Mensch gefragt wird. `ask` / `ask=always` fragt weiterhin jedes Mal einen Menschen.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin einfach: keine Sandbox bedeutet, dass es zu `gateway` aufgelöst wird; eine laufende Sandbox bedeutet, dass es in der Sandbox bleibt.
- `elevated` verlässt die Sandbox auf den konfigurierten Host-Pfad: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` (oder der Sitzungsstandard `host=node` ist). Es ist nur verfügbar, wenn erhöhter Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- `gateway`/`node`-Genehmigungen werden durch die Host-Genehmigungsdatei gesteuert.
- `node` erfordert einen gekoppelten Node (Companion-App oder Headless-Node-Host).
- Wenn mehrere Nodes verfügbar sind, setzen Sie `exec.node` oder `tools.exec.node`, um einen auszuwählen.
- `exec host=node` ist der einzige Shell-Ausführungspfad für Nodes; der alte `nodes.run`-Wrapper wurde entfernt.
- `timeout` gilt für Vordergrund, Hintergrund, `yieldMs`, Gateway, Sandbox und Node-`system.run`-Ausführung. Wenn ausgelassen, verwendet OpenClaw `tools.exec.timeoutSec`; ein explizites `timeout: 0` deaktiviert das exec-Prozess-Timeout für diesen Aufruf.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn gesetzt; wenn `SHELL` `fish` ist, bevorzugt es `bash` (oder `sh`)
  aus `PATH`, um fish-inkompatible Skripte zu vermeiden, und fällt dann auf `SHELL` zurück, wenn keines davon existiert.
- Auf Windows-Hosts bevorzugt exec die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH)
  und fällt dann auf Windows PowerShell 5.1 zurück.
- Auf Nicht-Windows-Gateway-Hosts verwenden bash- und zsh-exec-Befehle einen Start-Snapshot. OpenClaw erfasst sourcebare
  Aliasse/Funktionen und einen kleinen sicheren Umgebungssatz aus Shell-Startdateien in
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` und sourct diesen Snapshot dann vor jedem exec-Befehl.
  Geheimnisartig wirkende Variablen werden ausgeschlossen; Sandbox- und Node-exec verwenden diesen Snapshot nicht. Setzen Sie
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in der Gateway-Prozessumgebung, um diesen Snapshot-Pfad zu deaktivieren.
- Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um
  Binary-Hijacking oder injizierten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der erzeugten Befehlsumgebung (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den exec-Tool-Kontext erkennen können.
- Bei kanalbasierten Ausführungen stellt OpenClaw außerdem eine schmale JSON-Nutzlast mit Sender-/Chat-Identität in
  `OPENCLAW_CHANNEL_CONTEXT` bereit, wenn der Kanal diese IDs geliefert hat.
- `openclaw channels login` ist aus `exec` heraus blockiert, da es ein interaktiver Kanal-Authentifizierungsablauf ist; führen Sie es in einem Terminal auf dem Gateway-Host aus oder verwenden Sie das kanalnative Login-Tool aus dem Chat, wenn eines existiert.
- Wichtig: Sandboxing ist **standardmäßig deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin geschlossen fehl, statt stillschweigend
  auf dem Gateway-Host zu laufen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Skript-Preflight-Prüfungen (für häufige Python-/Node-Shell-Syntaxfehler) prüfen nur Dateien innerhalb der
  effektiven `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird Preflight für
  diese Datei übersprungen.
- Starten Sie lang laufende Arbeiten, die jetzt beginnen, einmal und verlassen Sie sich auf automatisches
  Abschluss-Wecken, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingabe oder Eingriffe; emulieren Sie
  Scheduling nicht mit Sleep-Schleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeiten, die später oder nach Zeitplan erfolgen sollen, verwenden Sie Cron statt
  `exec`-Sleep-/Delay-Muster.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): Wenn true, reihen in den Hintergrund verschobene exec-Sitzungen beim Beenden ein Systemereignis ein und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): Gibt eine einzelne „läuft“-Meldung aus, wenn eine genehmigungspflichtige exec-Ausführung länger als diese Zeit dauert (0 deaktiviert).
- `tools.exec.timeoutSec` (Standard: 1800): Standard-exec-Timeout pro Befehl in Sekunden. `timeout` pro Aufruf überschreibt dies; `timeout: 0` pro Aufruf deaktiviert das exec-Prozess-Timeout.
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox` aufgelöst, wenn die Sandbox-Runtime aktiv ist, andernfalls zu `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Host-exec ohne Genehmigung ist der Standard für Gateway + Node. Wenn Sie Genehmigungs-/Allowlist-Verhalten möchten, verschärfen Sie sowohl `tools.exec.*` als auch die Host-Genehmigungsdatei; siehe [Exec-Genehmigungen](/de/tools/exec-approvals#yolo-mode-no-approval).
- YOLO stammt aus den Host-Richtlinienstandards (`security=full`, `ask=off`), nicht aus `host=auto`. Wenn Sie Gateway- oder Node-Routing erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- Im Modus `security=full` plus `ask=off` folgt Host-exec direkt der konfigurierten Richtlinie; es gibt keine zusätzliche heuristische Vorfilterung auf Befehlsverschleierung und keine Skript-Preflight-Ablehnungsschicht.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): Wenn true, erfordern Inline-Interpreter-Eval-Formen wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` Reviewer- oder explizite Genehmigung. In `mode=auto` kann der normale exec-Genehmigungspfad es dem nativen Auto-Reviewer erlauben, einen eindeutig risikoarmen Einmalbefehl zuzulassen; direkte Node-Host-`system.run`-Aufrufe erfordern weiterhin eine explizite Genehmigung, da sie den Befehl nicht an eine menschliche Genehmigungsroute übergeben können. Wenn der Reviewer fragt, geht die Anfrage an einen Menschen. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, aber Inline-Eval-Formen werden nicht zu dauerhaften Erlaubnisregeln.
- `tools.exec.commandHighlighting` (Standard: false): Wenn true, können Genehmigungsaufforderungen parserabgeleitete Befehlsspannen im Befehlstext hervorheben. Setzen Sie es global oder pro Agent auf `true`, um Befehlstext-Hervorhebung zu aktivieren, ohne die exec-Genehmigungsrichtlinie zu ändern.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die `PATH` für exec-Ausführungen vorangestellt werden (nur Gateway + Sandbox).
- `tools.exec.safeBins`: nur-stdin sichere Binaries, die ohne explizite Allowlist-Einträge laufen können. Verhaltensdetails finden Sie unter [Sichere Binaries](/de/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: zusätzliche explizite Verzeichnisse, denen für `safeBins`-Pfadprüfungen vertraut wird. `PATH`-Einträge werden nie automatisch als vertrauenswürdig eingestuft. Eingebaute Standards sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: optionale benutzerdefinierte argv-Richtlinie pro sicherem Binary (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: Führt den `PATH` Ihrer Login-Shell mit der exec-Umgebung zusammen. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgelehnt. Der Daemon selbst läuft weiterhin mit einem minimalen `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - Um zu verhindern, dass Benutzer-Shell-Konfiguration (wie `~/.zshenv` oder `/etc/zshenv`) beim Start Prioritätspfade überschreibt, werden `tools.exec.pathPrepend`-Einträge direkt vor der Ausführung sicher dem finalen `PATH` innerhalb des Shell-Befehls vorangestellt.
- `host=sandbox`: Führt `sh -lc` (Login-Shell) im Container aus, sodass `/etc/profile` `PATH` zurücksetzen kann.
  OpenClaw stellt `env.PATH` nach dem Sourcen des Profils über eine interne Umgebungsvariable voran (keine Shell-Interpolation);
  `tools.exec.pathPrepend` gilt auch hier.
- `host=node`: Nur nicht blockierte Umgebungsüberschreibungen, die Sie übergeben, werden an den Node gesendet. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einem Node benötigen,
  konfigurieren Sie die Umgebung des Node-Host-Dienstes (systemd/launchd) oder installieren Sie Tools an Standardorten.

Node-Bindung pro Agent (verwenden Sie den Agent-Listenindex in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: Der Nodes-Tab enthält ein kleines Panel „Exec-Node-Bindung“ für dieselben Einstellungen.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **sitzungsbezogene** Standards für `host`, `security`, `ask` und `node` festzulegen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Absender** berücksichtigt (Channel-Allowlists/Pairing plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungsstatus** und schreibt keine Konfiguration. Autorisierte Absender externer Channels können
diese Sitzungsstandards setzen. Interne Gateway-/Webchat-Clients benötigen `operator.admin`, um sie dauerhaft zu speichern.
Um exec hart zu deaktivieren, verweigern Sie es über die Tool-Richtlinie (`tools.deny: ["exec"]` oder pro Agent). Host-Genehmigungen
gelten weiterhin, sofern Sie nicht explizit `security=full` und `ask=off` setzen.

## Exec-Genehmigungen (Begleit-App / Node-Host)

Sandboxed Agents können eine Genehmigung pro Anfrage erfordern, bevor `exec` auf dem Gateway oder Node-Host ausgeführt wird.
Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für Richtlinie, Allowlist und UI-Ablauf.

Wenn Genehmigungen erforderlich sind, gibt das exec-Tool sofort
`status: "approval-pending"` und eine Genehmigungs-ID zurück. Nach Genehmigung (oder Ablehnung / Timeout)
sendet das Gateway Befehlsfortschritts- und Abschlusssystemereignisse nur für genehmigte Ausführungen
(`Exec running` / `Exec finished`). Abgelehnte oder wegen Timeout abgelaufene Genehmigungen sind terminal und
wecken die Agent-Sitzung nicht mit einem Ablehnungs-Systemereignis.
Auf Channels mit nativen Genehmigungskarten/-buttons sollte sich der Agent zuerst auf diese
native UI verlassen und nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-
Ergebnis ausdrücklich sagt, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der
einzige Weg ist.

## Allowlist + sichere Binaries

Die manuelle Allowlist-Durchsetzung gleicht aufgelöste Binärpfad-Globs und reine Befehlsnamen-
Globs ab. Reine Namen passen nur auf Befehle, die über PATH aufgerufen werden, sodass `rg` auf
`/opt/homebrew/bin/rg` passen kann, wenn der Befehl `rg` ist, aber nicht auf `./rg` oder `/tmp/rg`.
Wenn `security=allowlist` gilt, werden Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-
Segment auf der Allowlist steht oder ein sicheres Binary ist. Verkettung (`;`, `&&`, `||`) und Umleitungen
werden im Allowlist-Modus abgelehnt, es sei denn, jedes Top-Level-Segment erfüllt die
Allowlist (einschließlich sicherer Binaries). Umleitungen werden weiterhin nicht unterstützt.
Dauerhaftes `allow-always`-Vertrauen umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Top-Level-Segment passt.

`autoAllowSkills` ist ein separater Komfortpfad in exec-Genehmigungen. Er ist nicht dasselbe wie
manuelle Pfad-Allowlist-Einträge. Für strikt explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerungen für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, nur stdin-basierte Stream-Filter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für ausführbare Safe-Bin-Pfade.
- `tools.exec.safeBinProfiles`: explizite argv-Richtlinie für benutzerdefinierte sichere Binaries.
- Allowlist: explizites Vertrauen für ausführbare Pfade.

Behandeln Sie `safeBins` nicht als generische Allowlist, und fügen Sie keine Interpreter-/Runtime-Binaries hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsabfragen aktiviert.
`openclaw security audit` warnt, wenn Interpreter-/Runtime-`safeBins`-Einträge keine expliziten Profile haben, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge scaffolden.
`openclaw security audit` und `openclaw doctor` warnen außerdem, wenn Sie Binaries mit breitem Verhalten wie `jq` explizit wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter explizit auf die Allowlist setzen, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Code-Eval-Formen weiterhin eine Prüfung oder explizite Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals-advanced#safe-bins-stdin-only) und [Sichere Binaries im Vergleich zur Allowlist](/de/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Polling ist für Status auf Abruf gedacht, nicht für Warteschleifen. Wenn automatisches Wecken bei Abschluss
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

Einfügen (standardmäßig bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Subtool von `exec` für strukturierte Bearbeitungen mehrerer Dateien.
Es ist standardmäßig für OpenAI- und OpenAI Codex-Modelle aktiviert. Verwenden Sie Konfiguration nur,
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
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Workspace beschränkt). Setzen Sie es nur dann auf `false`, wenn Sie bewusst möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungsgates für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Ausführen von Befehlen in sandboxed Umgebungen
- [Hintergrundprozess](/de/gateway/background-process) — lang laufendes exec- und process-Tool
- [Sicherheit](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
