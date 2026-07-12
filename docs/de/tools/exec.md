---
read_when:
    - Das exec-Tool verwenden oder ändern
    - Fehlersuche beim Verhalten von stdin oder TTY
summary: Verwendung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Exec-Tool
x-i18n:
    generated_at: "2026-07-12T16:03:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Führen Sie Shell-Befehle im Arbeitsbereich aus. `exec` ist eine verändernde Shell-Oberfläche: Befehle können überall dort Dateien erstellen, bearbeiten oder löschen, wo das Dateisystem des ausgewählten Hosts oder der Sandbox dies zulässt. Das Deaktivieren von OpenClaw-Dateisystemwerkzeugen wie `write`, `edit` oder `apply_patch` macht `exec` nicht schreibgeschützt.

Unterstützt die Ausführung im Vorder- und Hintergrund über `process`. Wenn `process` nicht zulässig ist, wird `exec` synchron ausgeführt und ignoriert `yieldMs`/`background`. Hintergrundsitzungen sind auf den jeweiligen Agenten beschränkt; `process` sieht nur Sitzungen desselben Agenten.

## Parameter

<ParamField path="command" type="string" required>
Auszuführender Shell-Befehl.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Arbeitsverzeichnis für den Befehl.
</ParamField>

<ParamField path="env" type="object">
Schlüssel/Wert-Umgebungsüberschreibungen, die mit der geerbten Umgebung zusammengeführt werden.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Den Befehl nach dieser Verzögerung (ms) automatisch in den Hintergrund verschieben.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Den Befehl sofort im Hintergrund ausführen, statt auf `yieldMs` zu warten.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Das konfigurierte exec-Zeitlimit für diesen Aufruf in Sekunden überschreiben. Gilt für die Ausführung im Vordergrund, im Hintergrund, mit `yieldMs`, über Gateway, Sandbox und Node-`system.run`. `timeout: 0` deaktiviert das Zeitlimit des exec-Prozesses für diesen Aufruf.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Wenn verfügbar, in einem Pseudoterminal ausführen. Verwenden Sie dies für CLIs, die eine TTY erfordern, Coding-Agenten und Terminal-Benutzeroberflächen.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Ort der Ausführung. `auto` wird bei aktiver Sandbox-Laufzeitumgebung zu `sandbox` und andernfalls zu `gateway` aufgelöst.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Wird bei normalen Werkzeugaufrufen ignoriert. Die Sicherheit für `gateway`/`node` wird durch `tools.exec.security` und die Host-Genehmigungsdatei gesteuert; der erhöhte Modus kann `security=full` nur erzwingen, wenn der Betreiber den erhöhten Zugriff ausdrücklich gewährt.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Der grundlegende Abfragemodus stammt aus `tools.exec.ask` und den Host-Genehmigungen. Bei Modellaufrufen aus einem Kanal wird der aufrufspezifische Wert `ask` ignoriert, wenn die effektive Host-Abfrage `off` ist; andernfalls kann er nur auf einen strengeren Modus verschärft werden. Vertrauenswürdige interne/API-Aufrufer, die exec-Werkzeuge mit einem ausdrücklichen `ask`-Wert erstellen, bleiben unverändert.
</ParamField>

<ParamField path="node" type="string">
Node-ID/-Name bei `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Erhöhten Modus anfordern: die Sandbox verlassen und zum konfigurierten Host-Pfad wechseln. `security=full` wird nur erzwungen, wenn der erhöhte Zugriff zu `full` aufgelöst wird.
</ParamField>

Hinweise:

- `host` akzeptiert nur `auto`, `sandbox`, `gateway` oder `node`. Es handelt sich nicht um eine Hostnamenauswahl; hostnamenähnliche Werte werden abgelehnt, bevor der Befehl ausgeführt wird.
- Der aufrufspezifische Wert `host=node` ist von `auto` aus zulässig; der aufrufspezifische Wert `host=gateway` ist nur zulässig, wenn keine Sandbox-Laufzeitumgebung aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin direkt: Ohne Sandbox wird es zu `gateway` aufgelöst; bei einer aktiven Sandbox bleibt es in der Sandbox.
- `elevated` verlässt die Sandbox und wechselt zum konfigurierten Host-Pfad: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` festgelegt ist (oder die Sitzung standardmäßig `host=node` verwendet). Dies ist nur verfügbar, wenn der erhöhte Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- Genehmigungen für `gateway`/`node` werden durch die Host-Genehmigungsdatei gesteuert.
- `node` erfordert einen gekoppelten Node (Begleit-App oder monitorlosen Node-Host). Wenn mehrere Nodes verfügbar sind, legen Sie `exec.node` oder `tools.exec.node` fest, um einen auszuwählen.
- `exec host=node` ist der einzige Pfad zur Shell-Ausführung für Nodes; der veraltete Wrapper `nodes.run` wurde entfernt.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn es gesetzt ist; wenn `SHELL` den Wert `fish` hat, wird `bash` (oder `sh`) aus `PATH` bevorzugt, um mit fish inkompatible Bash-Konstrukte zu vermeiden. Wenn keines davon vorhanden ist, wird auf `SHELL` zurückgegriffen.
- Auf Windows-Hosts bevorzugt exec bei der Erkennung PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH) und greift anschließend auf Windows PowerShell 5.1 zurück.
- Auf Nicht-Windows-Gateway-Hosts verwenden mit bash und zsh ausgeführte exec-Befehle eine Start-Snapshotdatei. OpenClaw erfasst einbindbare Aliasse/Funktionen und eine kleine, sichere Auswahl von Umgebungsvariablen aus den Shell-Startdateien unter `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` und bindet diesen Snapshot vor jedem exec-Befehl ein. Variablen, die wie Geheimnisse aussehen, werden ausgeschlossen; Sandbox- und Node-Ausführungen verwenden diesen Snapshot nicht. Setzen Sie `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in der Prozessumgebung des Gateways, um diesen Snapshot-Pfad zu deaktivieren.
- Die Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um das Kapern von Binärdateien oder eingeschleusten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Kontext des exec-Werkzeugs erkennen können.
- Bei Ausführungen aus einem Kanal stellt OpenClaw außerdem eine eng begrenzte JSON-Nutzlast zur Absender-/Chat-Identität in `OPENCLAW_CHANNEL_CONTEXT` bereit, wenn der Kanal diese IDs übermittelt hat.
- `exec` kann weder `openclaw channels login` noch `/approve` als Shell-Befehle ausführen: `openclaw channels login` ist ein interaktiver Ablauf zur Kanalauthentifizierung, und `/approve` muss über den Genehmigungsbefehlshandler statt über eine Shell erfolgen. Führen Sie die Kanalanmeldung in einem Terminal auf dem Gateway-Host aus oder verwenden Sie ein kanalspezifisches Anmeldewerkzeug für Agenten, sofern eines vorhanden ist (zum Beispiel `whatsapp_login`).
- Wichtig: Sandboxing ist **standardmäßig deaktiviert**. Wenn Sandboxing deaktiviert ist, wird das implizite `host=auto` zu `gateway` aufgelöst. Ein ausdrückliches `host=sandbox` schlägt weiterhin sicher fehl, statt den Befehl stillschweigend auf dem Gateway-Host auszuführen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Vorabprüfungen von Skripten (für häufige Python-/Node-Fehler in der Shell-Syntax) untersuchen nur Dateien innerhalb der effektiven `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird die Vorabprüfung für diese Datei übersprungen. Die Vorabprüfung wird außerdem vollständig übersprungen, wenn `host=gateway` gilt und die effektive Richtlinie `security=full` mit `ask=off` ist.
- Starten Sie lang laufende Arbeiten, die jetzt beginnen, einmal und verlassen Sie sich auf die automatische Benachrichtigung bei Abschluss, sofern sie aktiviert ist und der Befehl eine Ausgabe erzeugt oder fehlschlägt. Verwenden Sie `process` für Protokolle, Status, Eingaben oder Eingriffe; bilden Sie keine Zeitplanung mit sleep-Schleifen, Zeitüberschreitungsschleifen oder wiederholten Abfragen nach.
- Verwenden Sie für Arbeiten, die später oder nach einem Zeitplan erfolgen sollen, Cron anstelle von sleep-/Verzögerungsmustern mit `exec`.

## Konfiguration

| Schlüssel                             | Standardwert                                           | Hinweise                                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`               | `1800`                                                 | Standardmäßiges exec-Zeitlimit pro Befehl in Sekunden. Der aufrufspezifische Wert `timeout` überschreibt es; `timeout: 0` deaktiviert das Zeitlimit des exec-Prozesses. |
| `tools.exec.host`                     | `auto`                                                 | Wird bei aktiver Sandbox-Laufzeitumgebung zu `sandbox` und andernfalls zu `gateway` aufgelöst.                                                                    |
| `tools.exec.security`                 | `deny` für Sandbox, `full` für Gateway/Node, falls nicht gesetzt |                                                                                                                                                                  |
| `tools.exec.ask`                      | `off`                                                  |                                                                                                                                                                  |
| `tools.exec.mode`                     | nicht gesetzt                                          | Normalisierter Richtlinienparameter. Siehe unten [Modi](#modes). Kann nicht mit `tools.exec.security`/`tools.exec.ask` kombiniert werden.                          |
| `tools.exec.reviewer.model`           | konfiguriertes primäres Agentenmodell                  | Optionale Provider-/Modellüberschreibung für die Prüfung mit `mode=auto`.                                                                                         |
| `tools.exec.reviewer.timeoutMs`       | `30000`                                                | Zeitlimit je Phase für die Vorbereitung und Fertigstellung durch das Prüfmodell vor dem Rückgriff auf einen Menschen.                                             |
| `tools.exec.node`                     | nicht gesetzt                                          |                                                                                                                                                                  |
| `tools.exec.notifyOnExit`             | `true`                                                 | Wenn wahr, stellen in den Hintergrund verschobene exec-Sitzungen beim Beenden ein Systemereignis in die Warteschlange und fordern einen Heartbeat an.             |
| `tools.exec.approvalRunningNoticeMs`  | `10000`                                                | Gibt eine einmalige Meldung „wird ausgeführt“ aus, wenn eine genehmigungspflichtige exec-Ausführung länger als dieser Wert dauert (`0` deaktiviert dies).          |
| `tools.exec.strictInlineEval`         | `false`                                                | Siehe [Inline-Auswertung](#inline-eval-strictinlineeval).                                                                                                         |
| `tools.exec.commandHighlighting`      | `false`                                                | Wenn wahr, können Genehmigungsaufforderungen vom Parser abgeleitete Befehlsspannen im Befehlstext hervorheben. Global oder je Agent festlegbar; ändert die Genehmigungsrichtlinie nicht. |
| `tools.exec.pathPrepend`              | nicht gesetzt                                          | Liste der Verzeichnisse, die bei exec-Ausführungen `PATH` vorangestellt werden (nur Gateway + Sandbox).                                                           |
| `tools.exec.safeBins`                 | nicht gesetzt                                          | Sichere Binärdateien nur für stdin, die ohne ausdrückliche Zulassungslisteneinträge ausgeführt werden können. Siehe [Sichere Binärdateien](/de/tools/exec-approvals-advanced#safe-bins-stdin-only). |
| `tools.exec.safeBinTrustedDirs`       | `/bin`, `/usr/bin`                                     | Zusätzliche ausdrückliche Verzeichnisse, denen bei Pfadprüfungen für `safeBins` vertraut wird. `PATH`-Einträgen wird nie automatisch vertraut.                     |
| `tools.exec.safeBinProfiles`          | nicht gesetzt                                          | Optionale benutzerdefinierte argv-Richtlinie je sicherer Binärdatei (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                       |

Die Host-Ausführung ohne Genehmigung ist der Standard für Gateway und Node (`security=full`, `ask=off`) – dies ergibt sich aus den Standardwerten der Host-Richtlinie, nicht aus `host=auto`. Wenn Sie Genehmigungen/Zulassungslistenverhalten wünschen, verschärfen Sie sowohl `tools.exec.*` als auch die Host-Genehmigungsdatei; siehe [Exec-Genehmigungen](/de/tools/exec-approvals#yolo-mode-no-approval). Um unabhängig vom Sandbox-Status eine Weiterleitung an Gateway oder Node zu erzwingen, legen Sie `tools.exec.host` fest oder verwenden Sie `/exec host=...`.

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

### Modi

`tools.exec.mode` ist der normalisierte Richtlinienparameter. Durch das Festlegen werden `security`/`ask` abgeleitet; er kann nicht mit ausdrücklich festgelegten Werten für `tools.exec.security`/`tools.exec.ask` kombiniert werden.

| Modus       | security    | ask       | Verhalten                                                                                                                                                 |
| ----------- | ----------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | `deny`      | `off`     | Exec wird verweigert.                                                                                                                                     |
| `allowlist` | `allowlist` | `off`     | Nur Befehle aus der Positivliste bzw. Safe-Bin-Befehle werden ausgeführt; für alle anderen erfolgt keine Nachfrage.                                      |
| `ask`       | `allowlist` | `on-miss` | Treffer in der Positivliste werden direkt ausgeführt; bei allen anderen wird ein Mensch gefragt.                                                         |
| `auto`      | `allowlist` | `on-miss` | Treffer in der Positivliste bzw. Safe-Bin-Treffer werden direkt ausgeführt; alle anderen werden zunächst an den nativen automatischen Reviewer von OpenClaw weitergeleitet, bevor ein Mensch gefragt wird. |
| `full`      | `full`      | `off`     | Keine Genehmigungssperre.                                                                                                                                 |

`ask`/`ask=always` fragt unabhängig vom Modus weiterhin jedes Mal einen Menschen.

Die Genehmigung durch die automatische Prüfung gilt nur einmal. Auf dem Gateway stellt OpenClaw dem Reviewer den aufgelösten Pfad der ausführbaren Datei bereit und bindet die Ausführung an genau diesen Pfad. Befehle, die sich nicht auf einen einzigen durchsetzbaren Ausführungsplan reduzieren lassen – etwa Heredocs, Shell-Erweiterungen oder nicht unterstützte Anführungszeichen in Wrappern – greifen auf die Genehmigung durch einen Menschen zurück, selbst wenn das Modell sie andernfalls erlauben würde.

Genehmigungen für Befehle des Codex-App-Servers, über die nicht bereits durch eine explizite Laufzeit- oder native Richtlinie entschieden wurde, verwenden den menschlichen Genehmigungsweg. OpenClaw führt für diese Anfragen nicht den konfigurierten Exec-Reviewer aus, da Codex keine durchsetzbare aufgelöste ausführbare Datei bereitstellt, mit der sich die Prüfentscheidung an den von Codex ausgeführten Befehl binden ließe.

### Inline-Auswertung (`strictInlineEval`)

Wenn `tools.exec.strictInlineEval` auf `true` gesetzt ist, erfordern Inline-Auswertungsformen von Interpretern eine Prüfung oder explizite Genehmigung: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` sowie ähnliche Formen bei anderen unterstützten Interpretern und Befehlsträgern (`awk`, `find -exec`, `make`, `sed`, `xargs` und weitere). Bei `mode=auto` kann der normale Exec-Genehmigungsweg dem nativen automatischen Reviewer erlauben, einen eindeutig risikoarmen einmaligen Befehl zu genehmigen; direkte `system.run`-Aufrufe auf dem Node-Host erfordern weiterhin eine explizite Genehmigung, da sie den Befehl nicht an einen menschlichen Genehmigungsweg übergeben können. Wenn der Reviewer nachfragt, wird die Anfrage an einen Menschen weitergeleitet. `allow-always` kann weiterhin unbedenkliche Interpreter-/Skriptaufrufe dauerhaft speichern, Inline-Auswertungsformen werden jedoch nicht zu dauerhaften Zulassungsregeln.

### PATH-Handhabung

- `host=gateway`: Führt den `PATH` Ihrer Anmelde-Shell mit der Exec-Umgebung zusammen. Überschreibungen von `env.PATH` werden bei der Host-Ausführung abgelehnt. Der Daemon selbst wird weiterhin mit einem minimalen `PATH` ausgeführt:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Um zu verhindern, dass die Shell-Konfiguration des Benutzers (wie `~/.zshenv` oder `/etc/zshenv`) beim Start priorisierte Pfade überschreibt, werden Einträge aus `tools.exec.pathPrepend` unmittelbar vor der Ausführung innerhalb des Shell-Befehls sicher dem endgültigen `PATH` vorangestellt.
- `host=sandbox`: Führt `sh -lc` (Anmelde-Shell) innerhalb des Containers aus, sodass `/etc/profile` den `PATH` zurücksetzen kann. OpenClaw stellt `env.PATH` nach dem Einlesen des Profils über eine interne Umgebungsvariable voran (ohne Shell-Interpolation); `tools.exec.pathPrepend` gilt auch hier.
- `host=node`: Nur von Ihnen übergebene, nicht blockierte Umgebungsüberschreibungen werden an den Node gesendet. Überschreibungen von `env.PATH` werden bei der Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einem Node benötigen, konfigurieren Sie die Umgebung des Node-Host-Dienstes (systemd/launchd) oder installieren Sie Werkzeuge an Standardspeicherorten.

Node-Bindung pro Agent (verwenden Sie den Index der Agent-Liste in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: Die Seite **Geräte** enthält für dieselben Einstellungen einen kleinen Bereich „Exec-Node-Bindung“.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **sitzungsspezifische** Standardwerte für `host`, `security`, `ask` und `node` festzulegen. Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` wird nur für **autorisierte Absender** berücksichtigt (Kanal-Positivlisten/Kopplung sowie `commands.useAccessGroups`). Es aktualisiert **nur den Sitzungszustand** und schreibt keine Konfiguration. Autorisierte Absender externer Kanäle können diese Sitzungsstandardwerte festlegen. Interne Gateway-/Webchat-Clients benötigen `operator.admin`, um sie dauerhaft zu speichern.

Um Exec vollständig zu deaktivieren, verweigern Sie es über die Werkzeugrichtlinie (`tools.deny: ["exec"]` oder agentspezifisch). Host-Genehmigungen gelten weiterhin, sofern Sie nicht ausdrücklich `security=full` und `ask=off` festlegen.

## Exec-Genehmigungen (Begleit-App/Node-Host)

Sandbox-Agents können für jede Anfrage eine Genehmigung verlangen, bevor `exec` auf dem Gateway oder Node-Host ausgeführt wird. Informationen zu Richtlinie, Positivliste und UI-Ablauf finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals).

Wenn eine menschliche Genehmigung erforderlich ist, geben Node-Host- und nicht native Gateway-Abläufe sofort `status: "approval-pending"` sowie eine Genehmigungs-ID zurück. Native Chat- und Web-UI-Gateway-Abläufe können stattdessen inline warten und nach der Genehmigung das endgültige Befehlsergebnis zurückgeben. Ein Ergebnis mit `approval-pending` bedeutet, dass der Befehl noch nicht gestartet wurde. Warnungen zum Vordergrund-Fallback werden daher nur angezeigt, wenn der genehmigte Befehl tatsächlich inline ausgeführt wird. Genehmigte asynchrone Ausführungen geben Systemereignisse zu Befehlsfortschritt und -abschluss aus (`Exec running` / `Exec finished`); abgelehnte oder wegen Zeitüberschreitung verworfene Genehmigungen sind endgültig und wecken die Agent-Sitzung nicht mit einem Systemereignis zur Ablehnung auf.

Auf Kanälen mit nativen Genehmigungskarten/-schaltflächen sollte sich der Agent zunächst auf diese native UI verlassen und einen manuellen `/approve`-Befehl nur dann angeben, wenn das Werkzeugergebnis ausdrücklich meldet, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

## Positivliste und Safe Bins

Die manuelle Durchsetzung der Positivliste gleicht aufgelöste Pfad-Globs ausführbarer Dateien und Globs einfacher Befehlsnamen ab. Einfache Namen stimmen nur mit über PATH aufgerufenen Befehlen überein. Daher kann `rg` mit `/opt/homebrew/bin/rg` übereinstimmen, wenn der Befehl `rg` lautet, jedoch nicht mit `./rg` oder `/tmp/rg`.

Bei `security=allowlist` werden Shell-Befehle nur dann automatisch zugelassen, wenn jedes Pipeline-Segment in der Positivliste enthalten oder ein Safe Bin ist. Verkettungen (`;`, `&&`, `||`) und Umleitungen werden im Positivlistenmodus abgelehnt, sofern nicht jedes Segment der obersten Ebene die Positivliste erfüllt (einschließlich Safe Bins). Umleitungen werden weiterhin nicht unterstützt. Dauerhaftes Vertrauen durch `allow-always` umgeht diese Regel nicht: Bei einem verketteten Befehl muss weiterhin jedes Segment der obersten Ebene übereinstimmen.

`autoAllowSkills` ist ein separater Komfortweg innerhalb der Exec-Genehmigungen und nicht mit manuellen Pfadeinträgen in der Positivliste identisch. Für strikt explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerelemente für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, ausschließlich stdin-basierte Streamfilter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für die Pfade ausführbarer Safe-Bin-Dateien.
- `tools.exec.safeBinProfiles`: explizite argv-Richtlinie für benutzerdefinierte Safe Bins.
- Positivliste: explizites Vertrauen für Pfade ausführbarer Dateien.

Behandeln Sie `safeBins` nicht als generische Positivliste und fügen Sie keine Interpreter-/Laufzeitbinärdateien hinzu (beispielsweise `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Positivlisteneinträge und lassen Sie Genehmigungsabfragen aktiviert.

`openclaw security audit` warnt, wenn für Interpreter-/Laufzeiteinträge in `safeBins` explizite Profile fehlen, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge anlegen. `openclaw security audit` und `openclaw doctor` warnen außerdem, wenn Sie Bins mit weitreichendem Verhalten wie `jq` ausdrücklich wieder zu `safeBins` hinzufügen (`jq` kann Umgebungsdaten lesen und jq-Code aus Modulen oder Startdateien laden; bevorzugen Sie daher stattdessen explizite Positivlisteneinträge oder genehmigungspflichtige Ausführungen). `jq` wird als Safe Bin verweigert, selbst wenn es ausdrücklich aufgeführt ist. Wenn Sie Interpreter ausdrücklich in die Positivliste aufnehmen, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Codeauswertungen weiterhin eine Prüfung oder explizite Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals-advanced#safe-bins-stdin-only) und [Safe Bins im Vergleich zur Positivliste](/de/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Beispiele

Vordergrund:

```json
{ "tool": "exec", "command": "ls -la" }
```

Hintergrund und Abfrage:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Abfragen dienen der bedarfsgesteuerten Statusermittlung, nicht Warteschleifen. Wenn das automatische Wecken bei Abschluss aktiviert ist, kann der Befehl die Sitzung wecken, sobald er eine Ausgabe erzeugt oder fehlschlägt.

Tasten senden (im tmux-Stil):

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

`apply_patch` ist ein Unterwerkzeug von `exec` für strukturierte Änderungen an mehreren Dateien. Es ist standardmäßig aktiviert und für jeden Modell-Provider verfügbar; `allowModels` kann den Zugriff einschränken. Verwenden Sie die Konfiguration nur, wenn Sie es deaktivieren oder auf bestimmte Modelle beschränken möchten:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Hinweise:

- Die Werkzeugrichtlinie gilt weiterhin; `allow: ["write"]` erlaubt implizit `apply_patch`.
- `deny: ["write"]` verweigert `apply_patch` nicht; verweigern Sie `apply_patch` ausdrücklich oder verwenden Sie `deny: ["group:fs"]`, wenn Patch-Schreibvorgänge ebenfalls blockiert werden sollen.
- Die Konfiguration befindet sich unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ist standardmäßig auf `true` gesetzt; setzen Sie es auf `false`, um das Werkzeug zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig auf `true` gesetzt (auf den Arbeitsbereich beschränkt). Setzen Sie es nur dann auf `false`, wenn `apply_patch` absichtlich außerhalb des Arbeitsbereichsverzeichnisses schreiben oder löschen können soll.
- `tools.exec.applyPatch.allowModels` ist eine optionale Positivliste von Modell-IDs (unverarbeitet, wie `gpt-5.4`, oder vollständig, wie `openai/gpt-5.4`). Wenn sie festgelegt ist, erhalten nur übereinstimmende Modelle das Werkzeug; wenn sie nicht festgelegt ist, erhalten es alle Modelle.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungssperren für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Ausführen von Befehlen in Sandbox-Umgebungen
- [Hintergrundprozess](/de/gateway/background-process) — langlebiges Exec- und Prozesswerkzeug
- [Sicherheit](/de/gateway/security) — Werkzeugrichtlinie und erhöhte Zugriffsrechte
