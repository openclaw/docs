---
read_when:
    - Sichere Bins oder benutzerdefinierte Safe-Bin-Profile konfigurieren
    - Genehmigungen an Slack/Discord/Telegram oder andere Chat-Kanäle weiterleiten
    - Implementierung eines nativen Genehmigungsclients für einen Kanal
summary: 'Erweiterte Exec-Genehmigungen: sichere Bins, Interpreter-Bindung, Genehmigungsweiterleitung, native Zustellung'
title: Exec-Genehmigungen — erweitert
x-i18n:
    generated_at: "2026-05-07T01:54:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Fortgeschrittene Themen zu Exec-Freigaben: der `safeBins`-Schnellpfad, Interpreter-/Runtime-
Bindung und die Weiterleitung von Freigaben an Chat-Kanäle (einschließlich nativer Zustellung).
Die zentrale Richtlinie und den Freigabeablauf finden Sie unter [Exec-Freigaben](/de/tools/exec-approvals).

## Sichere Binaries (nur stdin)

`tools.exec.safeBins` definiert eine kleine Liste von **nur-stdin**-Binaries (zum
Beispiel `cut`), die im Allowlist-Modus **ohne** explizite Allowlist-
Einträge ausgeführt werden können. Sichere Binaries lehnen positionale Dateiargumente und pfadähnliche Tokens ab, sodass sie
nur mit dem eingehenden Stream arbeiten können. Behandeln Sie dies als engen Schnellpfad für
Stream-Filter, nicht als allgemeine Vertrauensliste.

<Warning>
Fügen Sie **keine** Interpreter- oder Runtime-Binaries (zum Beispiel `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu. Wenn ein Befehl Code auswerten,
Unterbefehle ausführen oder per Design Dateien lesen kann, bevorzugen Sie explizite Allowlist-Einträge
und lassen Sie Freigabeaufforderungen aktiviert. Benutzerdefinierte sichere Binaries müssen ein explizites
Profil in `tools.exec.safeBinProfiles.<bin>` definieren.
</Warning>

Standardmäßig sichere Binaries:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` sind nicht in der Standardliste enthalten. Wenn Sie sie aktivieren, behalten Sie explizite
Allowlist-Einträge für ihre Nicht-stdin-Workflows bei. Für `grep` im Modus für sichere Binaries
geben Sie das Muster mit `-e`/`--regexp` an; die positionale Musterform wird abgelehnt,
damit Dateioperanden nicht als mehrdeutige positionale Argumente eingeschleust werden können.

### Argv-Validierung und abgelehnte Flags

Die Validierung ist ausschließlich anhand der argv-Form deterministisch (keine Existenzprüfungen
im Host-Dateisystem), wodurch Datei-Existenz-Orakelverhalten durch Allow-/Deny-
Unterschiede verhindert wird. Dateiorientierte Optionen werden für standardmäßig sichere Binaries abgelehnt; lange
Optionen werden fail-closed validiert (unbekannte Flags und mehrdeutige Abkürzungen werden
abgelehnt).

Nach Profil für sichere Binaries abgelehnte Flags:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Sichere Binaries erzwingen außerdem, dass argv-Tokens zur Ausführungszeit als **literaler Text**
behandelt werden (kein Globbing und keine Erweiterung von `$VARS`) für nur-stdin-Segmente, sodass Muster
wie `*` oder `$HOME/...` nicht zum Einschleusen von Dateilesevorgängen verwendet werden können.

### Vertrauenswürdige Binary-Verzeichnisse

Sichere Binaries müssen aus vertrauenswürdigen Binary-Verzeichnissen aufgelöst werden (Systemstandardwerte plus
optional `tools.exec.safeBinTrustedDirs`). `PATH`-Einträge werden nie automatisch als vertrauenswürdig eingestuft.
Die standardmäßig vertrauenswürdigen Verzeichnisse sind absichtlich minimal: `/bin`, `/usr/bin`. Wenn
Ihre ausführbare sichere Binary in Paketmanager-/Benutzerpfaden liegt (zum Beispiel
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie diese
explizit zu `tools.exec.safeBinTrustedDirs` hinzu.

### Shell-Verkettung, Wrapper und Multiplexer

Shell-Verkettung (`&&`, `||`, `;`) ist erlaubt, wenn jedes Top-Level-Segment
die Allowlist erfüllt (einschließlich sicherer Binaries oder Skills-Auto-Allow). Umleitungen
bleiben im Allowlist-Modus nicht unterstützt. Befehlssubstitution (`$()` / Backticks) wird
beim Allowlist-Parsing abgelehnt, auch innerhalb doppelter Anführungszeichen; verwenden Sie einfache
Anführungszeichen, wenn Sie literalen `$()`-Text benötigen.

Bei Freigaben in der macOS-Companion-App wird roher Shell-Text, der Shell-Steuer- oder
Erweiterungssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), als
Allowlist-Fehltreffer behandelt, sofern die Shell-Binary selbst nicht auf der Allowlist steht.

Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene Env-Overrides
auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Bei `allow-always`-Entscheidungen im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) den inneren Pfad der ausführbaren Datei statt
des Wrapper-Pfads. Shell-Multiplexer (`busybox`, `toybox`) werden für
Shell-Applets (`sh`, `ash` usw.) auf die gleiche Weise entpackt. Wenn ein Wrapper oder Multiplexer
nicht sicher entpackt werden kann, wird kein Allowlist-Eintrag automatisch gespeichert.

Wenn Sie Interpreter wie `python3` oder `node` auf die Allowlist setzen, bevorzugen Sie
`tools.exec.strictInlineEval=true`, damit Inline-Eval weiterhin eine explizite
Freigabe erfordert. Im strikten Modus kann `allow-always` weiterhin unbedenkliche
Interpreter-/Skriptaufrufe speichern, aber Inline-Eval-Träger werden nicht automatisch
gespeichert.

### Sichere Binaries gegenüber Allowlist

| Thema            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Ziel             | Enge stdin-Filter automatisch erlauben                 | Bestimmten ausführbaren Dateien explizit vertrauen                                 |
| Match-Typ        | Name der ausführbaren Datei + argv-Richtlinie für sichere Binaries | Aufgelöstes Pfad-Glob der ausführbaren Datei oder nacktes Befehlsnamen-Glob für über PATH aufgerufene Befehle |
| Argumentumfang   | Durch Profil für sichere Binaries und Literal-Token-Regeln eingeschränkt | Standardmäßig Pfad-Match; optionales `argPattern` kann geparstes argv einschränken |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                           | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs                         |
| Beste Verwendung | Texttransformationen mit geringem Risiko in Pipelines  | Jedes Tool mit breiterem Verhalten oder Seiteneffekten                             |

Konfigurationsort:

- `safeBins` stammt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` stammt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` stammt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Profilschlüssel pro Agent überschreiben globale Schlüssel.
- Allowlist-Einträge liegen in der host-lokalen Datei `~/.openclaw/exec-approvals.json` unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Runtime-Binaries in `safeBins` ohne explizite Profile erscheinen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` anlegen (danach prüfen und enger fassen). Interpreter-/Runtime-Binaries werden nicht automatisch angelegt.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900000__
Wenn Sie `jq` explizit in `safeBins` aufnehmen, lehnt OpenClaw das `env`-Builtin im Modus für sichere Binaries
weiterhin ab, sodass `jq -n env` die Host-Prozessumgebung nicht ohne expliziten Allowlist-Pfad
oder Freigabeaufforderung ausgeben kann.

## Interpreter-/Runtime-Befehle

Freigabegestützte Interpreter-/Runtime-Ausführungen sind absichtlich konservativ:

- Exakter argv-/cwd-/env-Kontext ist immer gebunden.
- Direkte Shell-Skript- und direkte Runtime-Dateiformen werden bestmöglich an einen konkreten lokalen
  Datei-Snapshot gebunden.
- Gängige Paketmanager-Wrapper-Formen, die weiterhin zu einer direkten lokalen Datei auflösen (zum Beispiel
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor der Bindung entpackt.
- Wenn OpenClaw für einen Interpreter-/Runtime-Befehl nicht exakt eine konkrete lokale Datei
  identifizieren kann (zum Beispiel Paket-Skripte, Eval-Formen, runtime-spezifische Loader-Ketten oder mehrdeutige Multi-Datei-
  Formen), wird die freigabegestützte Ausführung abgelehnt, statt eine semantische Abdeckung zu behaupten, die sie nicht
  hat.
- Für diese Workflows bevorzugen Sie Sandboxing, eine separate Host-Grenze oder einen explizit vertrauenswürdigen
  Allowlist-/vollständigen Workflow, bei dem der Operator die breitere Runtime-Semantik akzeptiert.

Wenn Freigaben erforderlich sind, gibt das exec-Tool sofort eine Freigabe-ID zurück. Verwenden Sie diese ID, um
spätere Systemereignisse (`Exec finished` / `Exec denied`) zuzuordnen. Wenn vor Ablauf des
Timeouts keine Entscheidung eintrifft, wird die Anfrage als Freigabe-Timeout behandelt und als Ablehnungsgrund angezeigt.

### Verhalten der Follow-up-Zustellung

Nachdem ein genehmigter asynchroner Exec abgeschlossen ist, sendet OpenClaw einen Follow-up-`agent`-Turn an dieselbe Sitzung.

- Wenn ein gültiges externes Zustellziel vorhanden ist (zustellbarer Kanal plus Ziel `to`), verwendet die Follow-up-Zustellung diesen Kanal.
- In reinen Webchat- oder internen Sitzungsabläufen ohne externes Ziel bleibt die Follow-up-Zustellung nur sitzungsintern (`deliver: false`).
- Wenn ein Aufrufer explizit strikte externe Zustellung ohne auflösbaren externen Kanal anfordert, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung auf sitzungsintern herabgestuft, statt fehlzuschlagen.

## Weiterleitung von Freigaben an Chat-Kanäle

Sie können Exec-Freigabeaufforderungen an jeden Chat-Kanal weiterleiten (einschließlich Plugin-Kanälen) und sie
mit `/approve` genehmigen. Dies verwendet die normale Pipeline für ausgehende Zustellung.

Konfiguration:
__OC_I18N_900001__
Antworten Sie im Chat:
__OC_I18N_900002__
Der Befehl `/approve` verarbeitet sowohl Exec-Freigaben als auch Plugin-Freigaben. Wenn die ID keiner ausstehenden Exec-Freigabe entspricht, prüft er automatisch stattdessen Plugin-Freigaben.

### Weiterleitung von Plugin-Freigaben

Die Weiterleitung von Plugin-Freigaben verwendet dieselbe Zustellungspipeline wie Exec-Freigaben, hat aber ihre eigene
unabhängige Konfiguration unter `approvals.plugin`. Das Aktivieren oder Deaktivieren der einen wirkt sich nicht auf die andere aus.
__OC_I18N_900003__
Die Konfigurationsform ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` und `targets` funktionieren auf die gleiche Weise.

Kanäle, die gemeinsam genutzte interaktive Antworten unterstützen, zeigen dieselben Freigabe-Buttons für Exec- und
Plugin-Freigaben an. Kanäle ohne gemeinsam genutzte interaktive UI fallen auf Klartext mit `/approve`-
Anweisungen zurück.
Plugin-Freigabeanfragen können die verfügbaren Entscheidungen einschränken. Freigabeoberflächen verwenden die in der Anfrage
deklarierte Entscheidungsmenge, und der Gateway lehnt Versuche ab, eine Entscheidung einzureichen, die nicht angeboten wurde.

### Freigaben im selben Chat auf jedem Kanal

Wenn eine Exec- oder Plugin-Freigabeanfrage von einer zustellbaren Chat-Oberfläche stammt, kann derselbe Chat
sie jetzt standardmäßig mit `/approve` genehmigen. Dies gilt neben den bestehenden Web-UI- und Terminal-UI-Abläufen
auch für Kanäle wie Slack, Matrix und Microsoft Teams.

Dieser gemeinsame Textbefehlsweg verwendet das normale Kanal-Auth-Modell für diese Unterhaltung. Wenn der
ursprüngliche Chat bereits Befehle senden und Antworten empfangen kann, benötigen Freigabeanfragen keinen
separaten nativen Zustelladapter mehr, nur um ausstehend zu bleiben.

Discord und Telegram unterstützen ebenfalls `/approve` im selben Chat, aber diese Kanäle verwenden weiterhin ihre
aufgelöste Genehmigerliste für die Autorisierung, auch wenn die native Freigabezustellung deaktiviert ist.

Für Telegram und andere native Freigabeclients, die den Gateway direkt aufrufen,
ist dieser Fallback absichtlich auf Fehler vom Typ „Freigabe nicht gefunden“ begrenzt. Eine echte
Ablehnung/ein echter Fehler einer Exec-Freigabe versucht nicht stillschweigend erneut eine Plugin-Freigabe.

### Native Freigabezustellung

Einige Kanäle können auch als native Genehmigungs-Clients fungieren. Native Clients ergänzen den gemeinsamen `/approve`-Ablauf im selben Chat um DMs an Genehmiger, Fanout in den Ursprungs-Chat und kanalspezifische interaktive Genehmigungs-UX.

Wenn native Genehmigungskarten/-Buttons verfügbar sind, ist diese native UI der primäre agentenseitige Pfad. Der Agent sollte nicht zusätzlich einen doppelten einfachen Chat-Befehl `/approve` ausgeben, es sei denn, das Tool-Ergebnis meldet, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige verbleibende Pfad ist.

Wenn ein nativer Genehmigungs-Client konfiguriert ist, aber keine native Runtime für den Ursprungskanal aktiv ist, hält OpenClaw den lokalen deterministischen `/approve`-Prompt sichtbar. Wenn die native Runtime aktiv ist und die Zustellung versucht, aber kein Ziel die Karte empfängt, sendet OpenClaw eine Fallback-Benachrichtigung im selben Chat mit dem exakten Befehl `/approve <id> <decision>`, damit die Anfrage weiterhin aufgelöst werden kann.

Generisches Modell:

- Die Exec-Richtlinie des Hosts entscheidet weiterhin, ob eine Exec-Genehmigung erforderlich ist.
- `approvals.exec` steuert die Weiterleitung von Genehmigungs-Prompts an andere Chat-Ziele.
- `channels.<channel>.execApprovals` steuert, ob dieser Kanal als nativer Genehmigungs-Client agiert.

Native Genehmigungs-Clients aktivieren die DM-zuerst-Zustellung automatisch, wenn all dies zutrifft:

- Der Kanal unterstützt native Genehmigungszustellung.
- Genehmiger können aus expliziten `execApprovals.approvers` oder aus einer Eigentümeridentität wie `commands.ownerAllowFrom` aufgelöst werden.
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`.

Setzen Sie `enabled: false`, um einen nativen Genehmigungs-Client explizit zu deaktivieren. Setzen Sie `enabled: true`, um ihn zu erzwingen, wenn Genehmiger aufgelöst werden. Die öffentliche Zustellung im Ursprungs-Chat bleibt über `channels.<channel>.execApprovals.target` explizit.

FAQ: [Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Diese nativen Genehmigungs-Clients ergänzen den gemeinsamen `/approve`-Ablauf im selben Chat und die gemeinsamen Genehmigungs-Buttons um DM-Routing und optionalen Kanal-Fanout.

Gemeinsames Verhalten:

- Slack, Matrix, Microsoft Teams und ähnliche zustellbare Chats verwenden das normale Kanal-Auth-Modell für `/approve` im selben Chat.
- Wenn ein nativer Genehmigungs-Client automatisch aktiviert wird, ist das standardmäßige native Zustellungsziel DMs an Genehmiger.
- Für Discord und Telegram können nur aufgelöste Genehmiger genehmigen oder ablehnen.
- Discord-Genehmiger können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden.
- Telegram-Genehmiger können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden.
- Slack-Genehmiger können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden.
- Native Slack-Buttons bewahren die Art der Genehmigungs-ID, sodass `plugin:`-IDs Plugin-Genehmigungen ohne zweite Slack-lokale Fallback-Ebene auflösen können.
- Natives Matrix-DM-/Kanal-Routing und Reaktionskürzel verarbeiten sowohl Exec- als auch Plugin-Genehmigungen; die Plugin-Autorisierung stammt weiterhin aus `channels.matrix.dm.allowFrom`.
- Native Matrix-Prompts enthalten `com.openclaw.approval`-benutzerdefinierten Event-Inhalt im ersten Prompt-Event, sodass OpenClaw-fähige Matrix-Clients strukturierten Genehmigungsstatus lesen können, während Standard-Clients den Klartext-Fallback `/approve` behalten.
- Der Anfragende muss kein Genehmiger sein.
- Der Ursprungs-Chat kann direkt mit `/approve` genehmigen, wenn dieser Chat bereits Befehle und Antworten unterstützt.
- Native Discord-Genehmigungs-Buttons routen nach Art der Genehmigungs-ID: `plugin:`-IDs gehen direkt zu Plugin-Genehmigungen, alles andere geht zu Exec-Genehmigungen.
- Native Telegram-Genehmigungs-Buttons folgen demselben begrenzten Exec-zu-Plugin-Fallback wie `/approve`.
- Wenn das native `target` die Zustellung im Ursprungs-Chat aktiviert, enthalten Genehmigungs-Prompts den Befehlstext.
- Ausstehende Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.
- Wenn keine Bediener-UI und kein konfigurierter Genehmigungs-Client die Anfrage annehmen kann, fällt der Prompt auf `askFallback` zurück.

Sensible eigentümerexklusive Gruppenbefehle wie `/diagnostics` und `/export-trajectory` verwenden privates Eigentümer-Routing für Genehmigungs-Prompts und Endergebnisse. OpenClaw versucht zuerst eine private Route auf derselben Oberfläche, auf der der Eigentümer den Befehl ausgeführt hat. Wenn diese Oberfläche keine private Eigentümer-Route hat, fällt sie auf die erste verfügbare Eigentümer-Route aus `commands.ownerAllowFrom` zurück, sodass ein Discord-Gruppenbefehl die Genehmigung und das Ergebnis weiterhin an die Telegram-DM des Eigentümers senden kann, wenn Telegram als primäre private Schnittstelle konfiguriert ist. Der Gruppenchat erhält nur eine kurze Bestätigung.

Telegram verwendet standardmäßig Genehmiger-DMs (`target: "dm"`). Sie können zu `channel` oder `both` wechseln, wenn Genehmigungs-Prompts auch im ursprünglichen Telegram-Chat/-Thema erscheinen sollen. Für Telegram-Forumthemen bewahrt OpenClaw das Thema für den Genehmigungs-Prompt und die Nachverfolgung nach der Genehmigung.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS-IPC-Ablauf
__OC_I18N_900004__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token in `exec-approvals.json` gespeichert.
- Same-UID-Peer-Prüfung.
- Challenge/Response (Nonce + HMAC-Token + Anfrage-Hash) + kurze TTL.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Kernrichtlinie und Genehmigungsablauf
- [Exec-Tool](/de/tools/exec)
- [Erweiterter Modus](/de/tools/elevated)
- [Skills](/de/tools/skills) — Skill-gestütztes Auto-Allow-Verhalten
