---
read_when:
    - Verwenden oder Ändern des exec-Tools
    - Debuggen des stdin- oder TTY-Verhaltens
summary: Nutzung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Ausführungswerkzeug
x-i18n:
    generated_at: "2026-07-24T04:12:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9c16b5122c527c069a4d1a0c1649726073339e95b9084100c1a0f45ebcae759d
    source_path: tools/exec.md
    workflow: 16
---

Shell-Befehle im Arbeitsbereich ausführen. `exec` ist eine verändernde Shell-Oberfläche: Befehle können überall dort Dateien erstellen, bearbeiten oder löschen, wo das Dateisystem des ausgewählten Hosts oder der Sandbox dies zulässt. Das Deaktivieren von OpenClaw-Dateisystemwerkzeugen wie `write`, `edit` oder `apply_patch` macht `exec` nicht schreibgeschützt.

Unterstützt Vordergrund- und Hintergrundausführung über `process`. Wenn `process` nicht zulässig ist, wird `exec` synchron ausgeführt und ignoriert `yieldMs`/`background`. Hintergrundsitzungen sind auf den jeweiligen Agenten beschränkt; `process` sieht nur Sitzungen desselben Agenten.

## Parameter

<ParamField path="command" type="string" required>
Auszuführender Shell-Befehl.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Arbeitsverzeichnis für den Befehl.
</ParamField>

<ParamField path="env" type="object">
Schlüssel/Wert-Umgebungsüberschreibungen, die mit Vorrang vor der geerbten Umgebung zusammengeführt werden.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Den Befehl nach dieser Verzögerung (ms) automatisch in den Hintergrund verschieben.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Den Befehl sofort im Hintergrund ausführen, statt auf `yieldMs` zu warten.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSeconds">
Das konfigurierte Zeitlimit für die Ausführung dieses Aufrufs in Sekunden überschreiben. Gilt für die Ausführung im Vordergrund, im Hintergrund, über `yieldMs`, Gateway, Sandbox und Node `system.run`. `timeout: 0` deaktiviert das Zeitlimit des Ausführungsprozesses für diesen Aufruf.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Wenn verfügbar, in einem Pseudoterminal ausführen. Für CLIs, die ausschließlich ein TTY unterstützen, Coding-Agenten und Terminal-Benutzeroberflächen verwenden.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Ausführungsort. `auto` wird bei aktiver Sandbox-Laufzeitumgebung zu `sandbox` aufgelöst, andernfalls zu `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Wird bei normalen Werkzeugaufrufen ignoriert. Die Sicherheit für `gateway`/`node` wird aus `tools.exec.mode` und der Host-Genehmigungsdatei abgeleitet; der erhöhte Modus kann vollständigen Zugriff nur erzwingen, wenn der Betreiber den erhöhten Zugriff ausdrücklich gewährt.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Der grundlegende Nachfragemodus wird aus `tools.exec.mode` und den Host-Genehmigungen abgeleitet. Bei Modellaufrufen, die von einem Kanal stammen, wird `ask` pro Aufruf ignoriert, wenn die wirksame Host-Nachfrageeinstellung `off` ist; andernfalls kann damit nur ein strengerer Modus erzwungen werden.
</ParamField>

<ParamField path="node" type="string">
Node-ID/-Name bei `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Erhöhten Modus anfordern: die Sandbox verlassen und zum konfigurierten Host-Pfad wechseln. `security=full` wird nur erzwungen, wenn „elevated“ zu `full` aufgelöst wird.
</ParamField>

Hinweise:

- `host` akzeptiert nur `auto`, `sandbox`, `gateway` oder `node`. Es dient nicht zur Auswahl eines Hostnamens; hostnamenähnliche Werte werden abgelehnt, bevor der Befehl ausgeführt wird.
- `host=node` pro Aufruf ist bei `auto` zulässig; `host=gateway` pro Aufruf ist nur zulässig, wenn keine Sandbox-Laufzeitumgebung aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin problemlos: Ohne Sandbox wird es zu `gateway` aufgelöst; bei einer aktiven Sandbox verbleibt es in der Sandbox.
- `elevated` verlässt die Sandbox und wechselt zum konfigurierten Host-Pfad: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` (oder die Sitzungsvorgabe `host=node` ist). Dies ist nur verfügbar, wenn für die aktuelle Sitzung bzw. den aktuellen Provider erhöhter Zugriff aktiviert ist.
- Genehmigungen für `gateway`/`node` werden über die Host-Genehmigungsdatei gesteuert.
- `node` erfordert einen gekoppelten Node (Begleit-App oder monitorlosen Node-Host). Wenn mehrere Nodes verfügbar sind, legen Sie `exec.node` oder `tools.exec.node` fest, um einen auszuwählen.
- `exec host=node` ist der einzige Pfad zur Shell-Ausführung für Nodes; der veraltete Wrapper `nodes.run` wurde entfernt.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn es festgelegt ist; wenn `SHELL` den Wert `fish` hat, bevorzugt es `bash` (oder `sh`) aus `PATH`, um mit fish inkompatible Bash-Konstrukte zu vermeiden, und greift anschließend auf `SHELL` zurück, wenn keines von beiden vorhanden ist.
- Auf Windows-Hosts bevorzugt exec die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, anschließend PATH) und greift danach auf Windows PowerShell 5.1 zurück.
- Auf Nicht-Windows-Gateway-Hosts verwenden exec-Befehle für Bash und zsh eine Startmomentaufnahme. OpenClaw erfasst einbindbare Aliase/Funktionen sowie eine kleine Auswahl sicherer Umgebungswerte aus Shell-Startdateien in `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` und bindet diese Momentaufnahme vor jedem exec-Befehl ein. Variablen, die wie Geheimnisse aussehen, werden ausgeschlossen; Sandbox- und Node-Ausführungen verwenden diese Momentaufnahme nicht. Legen Sie `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in der Prozessumgebung des Gateways fest, um diesen Momentaufnahmepfad zu deaktivieren.
- Die Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um die Übernahme von Binärdateien oder eingeschleusten Code zu verhindern.
- OpenClaw legt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls fest (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Kontext des exec-Werkzeugs erkennen können.
- Bei Ausführungen, die von einem Kanal stammen, stellt OpenClaw außerdem eine eingeschränkte JSON-Nutzlast mit Absender-/Chat-Identität in `OPENCLAW_CHANNEL_CONTEXT` bereit, wenn der Kanal diese IDs übermittelt hat.
- `exec` kann die Shell-Befehle `openclaw channels login` oder `/approve` nicht ausführen: `openclaw channels login` ist ein interaktiver Ablauf zur Kanalauthentifizierung, und `/approve` muss über den Genehmigungsbefehlshandler und nicht über eine Shell ausgeführt werden. Führen Sie die Kanalanmeldung in einem Terminal auf dem Gateway-Host durch oder verwenden Sie ein kanalspezifisches Agentenwerkzeug zur Anmeldung, sofern eines vorhanden ist (beispielsweise `whatsapp_login`).
- Wichtig: Sandboxing ist **standardmäßig deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto` zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin sicher fehl, statt unbemerkt auf dem Gateway-Host ausgeführt zu werden. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Vorabprüfungen für Skripte (auf häufige Python-/Node-Fehler in der Shell-Syntax) untersuchen nur Dateien innerhalb der wirksamen `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird die Vorabprüfung für diese Datei übersprungen. Die Vorabprüfung wird außerdem vollständig übersprungen, wenn `host=gateway` und die wirksame Richtlinie `security=full` mit `ask=off` ist.
- Starten Sie länger laufende Arbeiten, die jetzt beginnen sollen, genau einmal und verlassen Sie sich auf die automatische Reaktivierung nach Abschluss, sofern sie aktiviert ist und der Befehl eine Ausgabe erzeugt oder fehlschlägt. Verwenden Sie `process` für Protokolle, Status, Eingaben oder Eingriffe; bilden Sie keine Zeitplanung mit Schlafschleifen, Zeitlimitschleifen oder wiederholten Abfragen nach.
- Von Agenten gestartete Hintergrundbefehle werden bis zu ihrem Abschluss in den Ansichten für Hintergrundaufgaben im Web sowie unter iOS und Android angezeigt. Das Aufgabenregister wird abgeschlossen, bevor der Heartbeat nach Abschluss den Agenten erneut aktiviert.
- Verwenden Sie für Arbeiten, die später oder nach einem Zeitplan erfolgen sollen, Cron anstelle von Schlaf-/Verzögerungsmustern mit `exec`.

## Konfiguration

| Schlüssel                              | Standardwert             | Hinweise                                                                                                                                                 |
| -------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSeconds`          | `1800`                   | Standardmäßiges Zeitlimit pro exec-Befehl in Sekunden. `timeout` pro Aufruf überschreibt es; `timeout: 0` pro Aufruf deaktiviert das Zeitlimit des Ausführungsprozesses. |
| `tools.exec.host`                    | `auto`                   | Wird bei aktiver Sandbox-Laufzeitumgebung zu `sandbox` aufgelöst, andernfalls zu `gateway`.                                                          |
| `tools.exec.mode`                    | vom Host abgeleitet      | Kanonische Richtlinieneinstellung. Siehe unten [Modi](#modes).                                                                                            |
| `tools.exec.reviewer.model`          | konfiguriertes primäres Agentenmodell | Optionale Provider-/Modellüberschreibung für die Überprüfung durch `mode=auto`.                                                         |
| `tools.exec.reviewer.timeoutMs`      | `30000`                  | Zeitlimit pro Phase für die Vorbereitung und Fertigstellung durch das Prüfermodell vor dem Rückgriff auf einen Menschen.                                  |
| `tools.exec.node`                    | nicht festgelegt         |                                                                                                                                                          |
| `tools.exec.notifyOnExit`            | `true`                   | Wenn wahr, stellen in den Hintergrund verschobene exec-Sitzungen beim Beenden ein Systemereignis in die Warteschlange und fordern einen Heartbeat an.     |
| `tools.exec.approvalRunningNoticeMs` | `10000`                  | Gibt einmalig einen Hinweis „wird ausgeführt“ aus, wenn eine genehmigungspflichtige exec-Ausführung länger als dieser Wert dauert (`0` deaktiviert dies). |
| `tools.exec.strictInlineEval`        | `false`                  | Siehe [Inline-Auswertung](#inline-eval-strictinlineeval).                                                                                                 |
| `tools.exec.commandHighlighting`     | `false`                  | Wenn wahr, können Genehmigungsaufforderungen vom Parser abgeleitete Befehlsspannen im Befehlstext hervorheben. Global oder pro Agent festlegen; ändert die Genehmigungsrichtlinie nicht. |
| `tools.exec.pathPrepend`             | nicht festgelegt         | Liste der Verzeichnisse, die bei exec-Ausführungen `PATH` vorangestellt werden sollen (nur Gateway und Sandbox).                                          |
| `tools.exec.safeBins`                | nicht festgelegt         | Nur über stdin verwendbare sichere Binärprogramme, die ohne ausdrückliche Einträge in der Zulassungsliste ausgeführt werden können. Siehe [Sichere Binärprogramme](/de/tools/exec-approvals-advanced#safe-bins-stdin-only). |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`       | Zusätzliche ausdrücklich vertrauenswürdige Verzeichnisse für `safeBins`-Pfadprüfungen. `PATH`-Einträgen wird nie automatisch vertraut.             |
| `tools.exec.safeBinProfiles`         | nicht festgelegt         | Optionale benutzerdefinierte argv-Richtlinie pro sicherem Binärprogramm (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).              |

Die Host-Ausführung ohne Genehmigung ist die Vorgabe für Gateway und Node (`mode=full`) – dies ergibt sich aus den Vorgaben der Host-Richtlinie und nicht aus `host=auto`. Wenn Sie Genehmigungen bzw. ein Verhalten mit Zulassungsliste wünschen, legen Sie `tools.exec.mode` fest und verschärfen Sie die Host-Genehmigungsdatei; siehe [Exec-Genehmigungen](/de/tools/exec-approvals#yolo-mode-no-approval). Um die Weiterleitung zum Gateway oder Node unabhängig vom Sandbox-Status zu erzwingen, legen Sie `tools.exec.host` fest oder verwenden Sie `/exec host=...`.

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

`tools.exec.mode` ist die kanonische persistierte Richtlinieneinstellung. Laufzeitsicherheit und Genehmigungsverhalten werden daraus abgeleitet.

| Modus        | Sicherheit    | Abfrage       | Verhalten                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Exec wird verweigert.                                                                                                                |
| `allowlist` | `allowlist` | `off`     | Nur Befehle aus der Zulassungsliste bzw. sichere Binärdateien werden ausgeführt; für alle anderen erfolgt keine Abfrage.                                                                 |
| `ask`       | `allowlist` | `on-miss` | Treffer in der Zulassungsliste werden direkt ausgeführt; bei allem anderen wird ein Mensch gefragt.                                                                  |
| `auto`      | `allowlist` | `on-miss` | Treffer in der Zulassungsliste bzw. bei sicheren Binärdateien werden direkt ausgeführt; alles andere wird durch den nativen automatischen Reviewer von OpenClaw geleitet, bevor ein Mensch gefragt wird. |
| `full`      | `full`      | `off`     | Keine Genehmigungssperre.                                                                                                              |

Die sitzungsbezogene Einstellung `/exec ask=always` fragt unabhängig vom gespeicherten Modus weiterhin jedes Mal einen Menschen.

Die Genehmigung durch automatische Überprüfung gilt nur einmal. Auf dem Gateway stellt OpenClaw dem Reviewer den aufgelösten Pfad der ausführbaren Datei bereit und bindet die Ausführung an genau diesen Pfad. Befehle, die sich nicht auf einen einzigen durchsetzbaren Ausführungsplan reduzieren lassen – etwa Heredocs, Shell-Erweiterungen oder nicht unterstützte Anführungszeichen in Wrappern –, greifen selbst dann auf eine menschliche Genehmigung zurück, wenn das Modell sie andernfalls zulassen würde.

Genehmigungen für Codex-App-Server-Befehle, über die nicht bereits durch eine explizite Laufzeit- oder native Richtlinie entschieden wurde, verwenden den menschlichen Genehmigungsweg. OpenClaw führt für diese Anfragen nicht den konfigurierten Exec-Reviewer aus, da Codex keine durchsetzbare aufgelöste ausführbare Datei bereitstellt, mit der die Prüfentscheidung an den von Codex ausgeführten Befehl gebunden werden kann.

### Inline-Auswertung (`strictInlineEval`)

Wenn `tools.exec.strictInlineEval` auf `true` gesetzt ist, erfordern Inline-Formen zur Interpreter-Auswertung eine Prüfung oder explizite Genehmigung: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` sowie ähnliche Formen bei anderen unterstützten Interpretern und Befehlsträgern (`awk`, `find -exec`, `make`, `sed`, `xargs` und weitere). In `mode=auto` kann der normale Exec-Genehmigungsweg dem nativen automatischen Reviewer erlauben, einen eindeutig risikoarmen einmaligen Befehl zuzulassen; direkte `system.run`-Aufrufe auf dem Node-Host erfordern weiterhin eine explizite Genehmigung, da sie den Befehl nicht an einen menschlichen Genehmigungsweg übergeben können. Wenn der Reviewer eine Genehmigung verlangt, wird die Anfrage an einen Menschen weitergeleitet. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, Inline-Auswertungsformen werden jedoch nicht zu dauerhaften Zulassungsregeln.

### PATH-Verarbeitung

- `host=gateway`: führt `PATH` aus Ihrer Anmelde-Shell mit der Exec-Umgebung zusammen. Überschreibungen von `env.PATH` werden bei der Host-Ausführung abgelehnt. Der Daemon selbst wird weiterhin mit einem minimalen `PATH` ausgeführt:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Um zu verhindern, dass die Shell-Konfiguration des Benutzers (etwa `~/.zshenv` oder `/etc/zshenv`) beim Start Pfade mit höherer Priorität überschreibt, werden `tools.exec.pathPrepend`-Einträge direkt vor der Ausführung innerhalb des Shell-Befehls sicher dem endgültigen `PATH` vorangestellt.
- `host=sandbox`: führt `sh -lc` (Anmelde-Shell) innerhalb des Containers aus, sodass `/etc/profile` möglicherweise `PATH` zurücksetzt. OpenClaw stellt `env.PATH` nach dem Laden des Profils über eine interne Umgebungsvariable voran (ohne Shell-Interpolation); `tools.exec.pathPrepend` gilt auch hier.
- `host=node`: Nur die von Ihnen übergebenen, nicht blockierten Umgebungsüberschreibungen werden an den Node gesendet. Überschreibungen von `env.PATH` werden bei der Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie auf einem Node zusätzliche PATH-Einträge benötigen, konfigurieren Sie die Umgebung des Node-Host-Dienstes (systemd/launchd) oder installieren Sie Werkzeuge an Standardspeicherorten.

Agentenspezifische Node-Bindung (verwenden Sie die Agent-ID als Schlüssel in der Konfiguration):

```bash
openclaw config get agents.entries
openclaw config set 'agents.entries.main.tools.exec.node' "node-id-or-name"
```

Control UI: Die Seite **Geräte** enthält für dieselben Einstellungen einen kleinen Bereich „Exec-Node-Bindung“.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **sitzungsbezogene** Standardwerte für `host`, `security`, `ask` und `node` festzulegen. Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` wird nur für **autorisierte Absender** über Kanal-Zulassungslisten/Kopplung und Zugriffsgruppen berücksichtigt. Die Durchsetzung von Zugriffsgruppen ist immer aktiviert. Die Einstellung aktualisiert **nur den Sitzungsstatus** und schreibt keine Konfiguration. Autorisierte Absender externer Kanäle dürfen diese Sitzungsstandardwerte festlegen. Interne Gateway-/Webchat-Clients benötigen `operator.admin`, um sie dauerhaft zu speichern.

Um Exec vollständig zu deaktivieren, verweigern Sie es über die Werkzeugrichtlinie (`tools.deny: ["exec"]` oder agentenspezifisch). Host-Genehmigungen gelten weiterhin, sofern Sie nicht ausdrücklich `security=full` und `ask=off` festlegen.

## Exec-Genehmigungen (Begleit-App/Node-Host)

Agenten in einer Sandbox können vor der Ausführung von `exec` auf dem Gateway oder Node-Host eine Genehmigung für jede einzelne Anfrage verlangen. Informationen zur Richtlinie, Zulassungsliste und zum UI-Ablauf finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals).

Wenn eine menschliche Genehmigung erforderlich ist, kehren Node-Host- und nicht native Gateway-Abläufe sofort mit `status: "approval-pending"` und einer Genehmigungs-ID zurück. Native Chat- und Web-UI-Gateway-Abläufe können stattdessen direkt warten und nach der Genehmigung das endgültige Befehlsergebnis zurückgeben. Ein Ergebnis vom Typ `approval-pending` bedeutet, dass der Befehl noch nicht gestartet wurde. Daher werden Warnungen zum Vordergrund-Fallback nur angezeigt, wenn der genehmigte Befehl tatsächlich direkt ausgeführt wird. Genehmigte asynchrone Ausführungen erzeugen Systemereignisse zum Fortschritt und Abschluss des Befehls (`Exec running` / `Exec finished`); abgelehnte oder abgelaufene Genehmigungen sind endgültig und reaktivieren die Agentensitzung nicht mit einem Systemereignis zur Ablehnung.

Auf Kanälen mit nativen Genehmigungskarten/-schaltflächen sollte sich der Agent zuerst auf diese native UI verlassen und einen manuellen `/approve`-Befehl nur aufnehmen, wenn das Werkzeugergebnis ausdrücklich angibt, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

## Zulassungsliste und sichere Binärdateien

Die manuelle Durchsetzung der Zulassungsliste gleicht Globs für aufgelöste Binärpfade und Globs für reine Befehlsnamen ab. Reine Namen stimmen nur mit über PATH aufgerufenen Befehlen überein. Daher kann `rg` mit `/opt/homebrew/bin/rg` übereinstimmen, wenn der Befehl `rg` lautet, nicht jedoch mit `./rg` oder `/tmp/rg`.

Bei `security=allowlist` werden Shell-Befehle nur dann automatisch zugelassen, wenn jedes Pipeline-Segment auf der Zulassungsliste steht oder eine sichere Binärdatei ist. Verkettungen (`;`, `&&`, `||`) und Umleitungen werden im Zulassungslistenmodus abgelehnt, sofern nicht jedes Segment der obersten Ebene die Zulassungsliste erfüllt (einschließlich sicherer Binärdateien). Umleitungen werden weiterhin nicht unterstützt. Dauerhaftes Vertrauen durch `allow-always` umgeht diese Regel nicht: Bei einem verketteten Befehl muss weiterhin jedes Segment der obersten Ebene übereinstimmen.

`autoAllowSkills` ist ein separater Komfortpfad in Exec-Genehmigungen und nicht mit manuellen Pfadeinträgen der Zulassungsliste identisch. Lassen Sie für strikt explizites Vertrauen `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerungen für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, ausschließlich stdin-basierte Datenstromfilter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für die ausführbaren Pfade sicherer Binärdateien.
- `tools.exec.safeBinProfiles`: explizite argv-Richtlinie für benutzerdefinierte sichere Binärdateien.
- Zulassungsliste: explizites Vertrauen für ausführbare Pfade.

Behandeln Sie `safeBins` nicht als generische Zulassungsliste und fügen Sie keine Interpreter-/Laufzeit-Binärdateien hinzu (beispielsweise `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Einträge in der Zulassungsliste und lassen Sie Genehmigungsabfragen aktiviert.

`openclaw security audit` warnt, wenn für Interpreter-/Laufzeit-Einträge in `safeBins` explizite Profile fehlen, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge vorbereiten. `openclaw security audit` und `openclaw doctor` warnen außerdem, wenn Sie Binärdateien mit weitreichendem Verhalten wie `jq` ausdrücklich wieder zu `safeBins` hinzufügen (`jq` kann Umgebungsdaten lesen und jq-Code aus Modulen oder Startdateien laden; bevorzugen Sie daher stattdessen explizite Einträge in der Zulassungsliste oder genehmigungspflichtige Ausführungen). `jq` wird selbst dann als sichere Binärdatei verweigert, wenn es ausdrücklich aufgeführt ist. Wenn Sie Interpreter ausdrücklich in die Zulassungsliste aufnehmen, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Code-Auswertungsformen weiterhin eine Prüfung oder explizite Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals-advanced#safe-bins-stdin-only) und [Sichere Binärdateien im Vergleich zur Zulassungsliste](/de/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Die Abfrage dient dem bedarfsgesteuerten Abrufen des Status, nicht Warteschleifen. Wenn die automatische Reaktivierung bei Abschluss aktiviert ist, kann der Befehl die Sitzung reaktivieren, sobald er eine Ausgabe erzeugt oder fehlschlägt.

Tasten senden (im tmux-Stil):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Übermitteln (nur CR senden):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Einfügen (standardmäßig geklammert):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Unterwerkzeug von `exec` für strukturierte Änderungen an mehreren Dateien. Es ist standardmäßig aktiviert und für jeden Modell-Provider verfügbar; `allowModels` kann seine Verfügbarkeit einschränken. Verwenden Sie die Konfiguration nur, wenn Sie es deaktivieren oder auf bestimmte Modelle beschränken möchten:

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

- Die Werkzeugrichtlinie gilt weiterhin; `allow: ["write"]` lässt `apply_patch` implizit zu.
- `deny: ["write"]` verweigert `apply_patch` nicht; verweigern Sie `apply_patch` ausdrücklich oder verwenden Sie `deny: ["group:fs"]`, wenn auch Patch-Schreibvorgänge blockiert werden sollen.
- Die Konfiguration befindet sich unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` verwendet standardmäßig `true`; setzen Sie es auf `false`, um das Werkzeug zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` verwendet standardmäßig `true` (auf den Arbeitsbereich beschränkt). Setzen Sie es nur dann auf `false`, wenn `apply_patch` absichtlich außerhalb des Arbeitsbereichsverzeichnisses schreiben/löschen können soll.
- `tools.exec.applyPatch.allowModels` ist eine optionale Zulassungsliste von Modell-IDs (unverarbeitet, wie `gpt-5.4`, oder vollständig, wie `openai/gpt-5.4`). Wenn sie festgelegt ist, erhalten nur übereinstimmende Modelle das Werkzeug; wenn sie nicht festgelegt ist, erhalten es alle Modelle.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungssperren für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Ausführen von Befehlen in Sandbox-Umgebungen
- [Hintergrundprozess](/de/gateway/background-process) — lang laufende Exec- und Prozesswerkzeuge
- [Sicherheit](/de/gateway/security) — Werkzeugrichtlinie und erweiterter Zugriff
