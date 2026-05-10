---
read_when:
    - exec-Tool verwenden oder ändern
    - Fehlersuche beim stdin- oder TTY-Verhalten
summary: Verwendung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Ausführungstool
x-i18n:
    generated_at: "2026-05-10T19:54:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 445b09c1c6cdc1998c1c2a6b1223fdef438011413d246c4de0de0436465b448f
    source_path: tools/exec.md
    workflow: 16
---

Shell-Befehle im Workspace ausführen. `exec` ist eine mutierende Shell-Oberfläche: Befehle können Dateien erstellen, bearbeiten oder löschen, soweit der ausgewählte Host oder das Sandbox-Dateisystem dies erlaubt. Das Deaktivieren von OpenClaw-Dateisystem-Tools wie `write`, `edit` oder `apply_patch` macht `exec` nicht schreibgeschützt.

Unterstützt Vordergrund- und Hintergrundausführung über `process`. Wenn `process` nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent abgegrenzt; `process` sieht nur Sitzungen desselben Agenten.

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
Den Befehl nach dieser Verzögerung automatisch in den Hintergrund verschieben (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Den Befehl sofort in den Hintergrund verschieben, statt auf `yieldMs` zu warten.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Die konfigurierte Exec-Zeitüberschreitung für diesen Aufruf überschreiben. Setzen Sie `timeout: 0` nur, wenn der Befehl ohne Exec-Prozess-Zeitüberschreitung laufen soll.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
In einem Pseudo-Terminal ausführen, wenn verfügbar. Für TTY-only-CLIs, Coding-Agenten und Terminal-UIs verwenden.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Wo ausgeführt werden soll. `auto` wird zu `sandbox`, wenn eine Sandbox-Laufzeit aktiv ist, andernfalls zu `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Durchsetzungsmodus für `gateway`- / `node`-Ausführung.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Verhalten der Genehmigungsabfrage für `gateway`- / `node`-Ausführung.
</ParamField>

<ParamField path="node" type="string">
Node-ID/-Name, wenn `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Erhöhten Modus anfordern — aus der Sandbox auf den konfigurierten Host-Pfad ausbrechen. `security=full` wird nur erzwungen, wenn erhöht zu `full` aufgelöst wird.
</ParamField>

Hinweise:

- `host` ist standardmäßig `auto`: Sandbox, wenn die Sandbox-Laufzeit für die Sitzung aktiv ist, andernfalls Gateway.
- `host` akzeptiert nur `auto`, `sandbox`, `gateway` oder `node`. Es ist kein Hostname-Selektor; hostnamenähnliche Werte werden abgewiesen, bevor der Befehl ausgeführt wird.
- `auto` ist die Standard-Routingstrategie, kein Platzhalter. Pro Aufruf ist `host=node` von `auto` aus erlaubt; pro Aufruf ist `host=gateway` nur erlaubt, wenn keine Sandbox-Laufzeit aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin einfach: keine Sandbox bedeutet, dass es zu `gateway` aufgelöst wird; eine aktive Sandbox bedeutet, dass es in der Sandbox bleibt.
- `elevated` bricht aus der Sandbox auf den konfigurierten Host-Pfad aus: standardmäßig `gateway`, oder `node`, wenn `tools.exec.host=node` (oder die Sitzungs-Voreinstellung `host=node` ist). Es ist nur verfügbar, wenn erhöhter Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- `gateway`-/`node`-Genehmigungen werden durch `~/.openclaw/exec-approvals.json` gesteuert.
- `node` erfordert eine gekoppelte Node (Begleit-App oder Headless-Node-Host).
- Wenn mehrere Nodes verfügbar sind, setzen Sie `exec.node` oder `tools.exec.node`, um eine auszuwählen.
- `exec host=node` ist der einzige Shell-Ausführungspfad für Nodes; der alte `nodes.run`-Wrapper wurde entfernt.
- `timeout` gilt für Vordergrund-, Hintergrund-, `yieldMs`-, Gateway-, Sandbox- und Node-`system.run`-Ausführung. Wenn es weggelassen wird, verwendet OpenClaw `tools.exec.timeoutSec`; explizites `timeout: 0` deaktiviert die Exec-Prozess-Zeitüberschreitung für diesen Aufruf.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn gesetzt; wenn `SHELL` `fish` ist, bevorzugt es `bash` (oder `sh`)
  aus `PATH`, um fish-inkompatible Skripte zu vermeiden, und fällt dann auf `SHELL` zurück, wenn keines davon existiert.
- Auf Windows-Hosts bevorzugt exec die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH),
  und fällt dann auf Windows PowerShell 5.1 zurück.
- Host-Ausführung (`gateway`/`node`) weist `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) zurück, um
  Binary-Hijacking oder eingeschleusten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Exec-Tool-Kontext erkennen können.
- `openclaw channels login` wird von `exec` blockiert, weil es ein interaktiver Channel-Auth-Flow ist; führen Sie ihn in einem Terminal auf dem Gateway-Host aus, oder verwenden Sie das channel-native Login-Tool aus dem Chat, wenn eines existiert.
- Wichtig: Sandboxing ist **standardmäßig deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin geschlossen fehl, statt stillschweigend
  auf dem Gateway-Host zu laufen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Skript-Preflight-Prüfungen (für häufige Python-/Node-Shell-Syntaxfehler) prüfen nur Dateien innerhalb der
  effektiven `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird der Preflight für
  diese Datei übersprungen.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf automatisches
  Abschluss-Wecken, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingabe oder Eingriffe; emulieren Sie
  Planung nicht mit Sleep-Schleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeit, die später oder nach einem Zeitplan erfolgen soll, verwenden Sie Cron statt
  `exec`-Sleep-/Delay-Mustern.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): Wenn true, stellen in den Hintergrund verschobene Exec-Sitzungen beim Beenden ein Systemereignis in die Warteschlange und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): Eine einzelne „running“-Benachrichtigung ausgeben, wenn ein genehmigungsgesteuertes exec länger als dies läuft (0 deaktiviert).
- `tools.exec.timeoutSec` (Standard: 1800): Standardmäßige Exec-Zeitüberschreitung pro Befehl in Sekunden. Pro-Aufruf-`timeout` überschreibt sie; pro-Aufruf-`timeout: 0` deaktiviert die Exec-Prozess-Zeitüberschreitung.
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox` aufgelöst, wenn die Sandbox-Laufzeit aktiv ist, andernfalls zu `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Genehmigungsfreies Host-Exec ist die Standardeinstellung für Gateway + Node. Wenn Sie Genehmigungen/Allowlist-Verhalten möchten, verschärfen Sie sowohl `tools.exec.*` als auch die Host-`~/.openclaw/exec-approvals.json`; siehe [Exec-Genehmigungen](/de/tools/exec-approvals#yolo-mode-no-approval).
- YOLO stammt aus den Host-Policy-Standards (`security=full`, `ask=off`), nicht aus `host=auto`. Wenn Sie Gateway- oder Node-Routing erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- Im Modus `security=full` plus `ask=off` folgt Host-Exec direkt der konfigurierten Policy; es gibt keine zusätzliche heuristische Befehlsverschleierungs-Vorprüfung oder Skript-Preflight-Ablehnungsschicht.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): Wenn true, erfordern Inline-Interpreter-Eval-Formen wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` immer eine ausdrückliche Genehmigung. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, aber Inline-Eval-Formen fragen weiterhin jedes Mal nach.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die für Exec-Läufe vor `PATH` gesetzt werden (nur Gateway + Sandbox).
- `tools.exec.safeBins`: stdin-only sichere Binaries, die ohne ausdrückliche Allowlist-Einträge laufen können. Verhaltensdetails finden Sie unter [Sichere Binaries](/de/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: zusätzliche explizite Verzeichnisse, denen für `safeBins`-Pfadprüfungen vertraut wird. `PATH`-Einträge werden nie automatisch als vertrauenswürdig eingestuft. Eingebaute Standards sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: optionale benutzerdefinierte argv-Policy pro sicherem Binary (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: führt Ihren Login-Shell-`PATH` mit der Exec-Umgebung zusammen. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgewiesen. Der Daemon selbst läuft weiterhin mit einem minimalen `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: führt `sh -lc` (Login-Shell) innerhalb des Containers aus, sodass `/etc/profile` `PATH` zurücksetzen kann.
  OpenClaw stellt `env.PATH` nach dem Laden des Profils über eine interne Umgebungsvariable voran (keine Shell-Interpolation);
  `tools.exec.pathPrepend` gilt auch hier.
- `host=node`: Nur nicht blockierte Umgebungsüberschreibungen, die Sie übergeben, werden an die Node gesendet. `env.PATH`-Überschreibungen werden
  für Host-Ausführung abgewiesen und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einer Node benötigen,
  konfigurieren Sie die Umgebung des Node-Host-Dienstes (systemd/launchd) oder installieren Sie Tools an Standardorten.

Node-Bindung pro Agent (verwenden Sie den Agent-Listenindex in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Steuerungs-UI: Der Tab „Nodes“ enthält ein kleines Panel „Exec node binding“ für dieselben Einstellungen.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **sitzungsspezifische** Standards für `host`, `security`, `ask` und `node` zu setzen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Absender** berücksichtigt (Channel-Allowlists/Kopplung plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungsstatus** und schreibt keine Konfiguration. Um exec hart zu deaktivieren, verweigern Sie es über die Tool-
Policy (`tools.deny: ["exec"]` oder pro Agent). Host-Genehmigungen gelten weiterhin, sofern Sie nicht ausdrücklich
`security=full` und `ask=off` setzen.

## Exec-Genehmigungen (Begleit-App / Node-Host)

Sandbox-Agenten können eine Genehmigung pro Anfrage erfordern, bevor `exec` auf dem Gateway- oder Node-Host läuft.
Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für Policy, Allowlist und UI-Flow.

Wenn Genehmigungen erforderlich sind, gibt das exec-Tool sofort
`status: "approval-pending"` und eine Genehmigungs-ID zurück. Nach Genehmigung (oder Ablehnung / Zeitüberschreitung)
gibt der Gateway Systemereignisse aus (`Exec finished` / `Exec denied`). Wenn der Befehl nach
`tools.exec.approvalRunningNoticeMs` noch läuft, wird eine einzelne `Exec running`-Benachrichtigung ausgegeben.
Auf Channels mit nativen Genehmigungskarten/-buttons sollte sich der Agent zuerst auf diese
native UI verlassen und nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-
Ergebnis ausdrücklich sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der
einzige Weg ist.

## Allowlist + sichere Binaries

Manuelle Allowlist-Durchsetzung gleicht aufgelöste Binary-Pfad-Globs und einfache Befehlsnamen-
Globs ab. Einfache Namen passen nur zu Befehlen, die über PATH aufgerufen werden, sodass `rg` zu
`/opt/homebrew/bin/rg` passen kann, wenn der Befehl `rg` ist, aber nicht zu `./rg` oder `/tmp/rg`.
Wenn `security=allowlist`, werden Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-
Segment auf der Allowlist steht oder ein sicheres Binary ist. Verkettung (`;`, `&&`, `||`) und Umleitungen
werden im Allowlist-Modus abgewiesen, sofern nicht jedes Segment auf oberster Ebene die
Allowlist erfüllt (einschließlich sicherer Binaries). Umleitungen bleiben nicht unterstützt.
Dauerhaftes `allow-always`-Vertrauen umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Segment auf oberster Ebene übereinstimmt.

`autoAllowSkills` ist ein separater Komfortpfad in Exec-Genehmigungen. Es ist nicht dasselbe wie
manuelle Pfad-Allowlist-Einträge. Für streng explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerungen für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, stdin-only-Streamfilter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für ausführbare Pfade sicherer Binaries.
- `tools.exec.safeBinProfiles`: explizite argv-Policy für benutzerdefinierte sichere Binaries.
- allowlist: explizites Vertrauen für ausführbare Pfade.

Behandeln Sie `safeBins` nicht als generische Allowlist, und fügen Sie keine Interpreter-/Runtime-Binaries hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsaufforderungen aktiviert.
`openclaw security audit` warnt, wenn Interpreter-/Runtime-`safeBins`-Einträge keine expliziten Profile haben, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge vorbereiten.
`openclaw security audit` und `openclaw doctor` warnen außerdem, wenn Sie Bins mit breitem Verhalten wie `jq` explizit wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter explizit auf die Allowlist setzen, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Code-Eval-Formen weiterhin eine neue Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals-advanced#safe-bins-stdin-only) und [Safe Bins im Vergleich zur Allowlist](/de/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Polling dient dem Status bei Bedarf, nicht Warteschleifen. Wenn automatisches Aufwecken
bei Abschluss aktiviert ist, kann der Befehl die Sitzung aufwecken, wenn er Ausgaben erzeugt oder fehlschlägt.

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

`apply_patch` ist ein Unter-Tool von `exec` für strukturierte Bearbeitungen über mehrere Dateien hinweg.
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
- `deny: ["write"]` verbietet `apply_patch` nicht; verbieten Sie `apply_patch` explizit oder verwenden Sie `deny: ["group:fs"]`, wenn Patch-Schreibvorgänge ebenfalls blockiert werden sollen.
- Die Konfiguration befindet sich unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ist standardmäßig `true`; setzen Sie es auf `false`, um das Tool für OpenAI-Modelle zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Workspace beschränkt). Setzen Sie es nur dann auf `false`, wenn Sie ausdrücklich möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungsschranken für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Ausführen von Befehlen in Sandbox-Umgebungen
- [Hintergrundprozess](/de/gateway/background-process) — lang laufendes Exec und Prozess-Tool
- [Sicherheit](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
