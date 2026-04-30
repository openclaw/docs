---
read_when:
    - Sichere Bins oder benutzerdefinierte Safe-Bin-Profile konfigurieren
    - Weiterleiten von Genehmigungen an Slack/Discord/Telegram oder andere Chat-Kanäle
    - Implementierung eines nativen Genehmigungsclients für einen Kanal
summary: 'Erweiterte Exec-Genehmigungen: sichere Binaries, Interpreter-Bindung, Genehmigungsweiterleitung, native Zustellung'
title: Exec-Genehmigungen — erweitert
x-i18n:
    generated_at: "2026-04-30T07:17:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Fortgeschrittene Themen zu exec-Genehmigungen: der `safeBins`-Fast-Path, Interpreter-/Runtime-Bindung und Genehmigungsweiterleitung an Chat-Kanäle (einschließlich nativer Zustellung). Die zentrale Richtlinie und den Genehmigungsablauf finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals).

## Safe Bins (nur stdin)

`tools.exec.safeBins` definiert eine kleine Liste von **nur-stdin**-Binärdateien (zum Beispiel `cut`), die im Allowlist-Modus **ohne** explizite Allowlist-Einträge ausgeführt werden können. Safe Bins lehnen positionale Dateiargumente und pfadähnliche Tokens ab, sodass sie nur mit dem eingehenden Stream arbeiten können. Behandeln Sie dies als engen Fast-Path für Stream-Filter, nicht als allgemeine Vertrauensliste.

<Warning>
Fügen Sie **keine** Interpreter- oder Runtime-Binärdateien (zum Beispiel `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu. Wenn ein Befehl Code auswerten, Unterbefehle ausführen oder konstruktionsbedingt Dateien lesen kann, bevorzugen Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsaufforderungen aktiviert. Benutzerdefinierte Safe Bins müssen ein explizites Profil in `tools.exec.safeBinProfiles.<bin>` definieren.
</Warning>

Standard-Safe-Bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` sind nicht in der Standardliste enthalten. Wenn Sie sie aktivieren, behalten Sie explizite Allowlist-Einträge für ihre Workflows ohne stdin bei. Für `grep` im Safe-Bin-Modus geben Sie das Muster mit `-e`/`--regexp` an; die positionale Musterform wird abgelehnt, damit Dateioperanden nicht als mehrdeutige Positionsargumente eingeschleust werden können.

### Argv-Validierung und abgelehnte Flags

Die Validierung ist ausschließlich anhand der argv-Form deterministisch (keine Existenzprüfungen im Host-Dateisystem), wodurch Datei-Existenz-Orakelverhalten durch Allow-/Deny-Unterschiede verhindert wird. Dateiorientierte Optionen werden für Standard-Safe-Bins abgelehnt; lange Optionen werden fail-closed validiert (unbekannte Flags und mehrdeutige Abkürzungen werden abgelehnt).

Abgelehnte Flags nach Safe-Bin-Profil:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe Bins erzwingen außerdem, dass argv-Tokens zur Ausführungszeit für nur-stdin-Segmente als **Literaltext** behandelt werden (kein Globbing und keine `$VARS`-Expansion), sodass Muster wie `*` oder `$HOME/...` nicht zum Einschleusen von Dateilesevorgängen verwendet werden können.

### Vertrauenswürdige Binärverzeichnisse

Safe Bins müssen aus vertrauenswürdigen Binärverzeichnissen aufgelöst werden (Systemstandards plus optional `tools.exec.safeBinTrustedDirs`). `PATH`-Einträge werden nie automatisch als vertrauenswürdig eingestuft. Die standardmäßig vertrauenswürdigen Verzeichnisse sind absichtlich minimal: `/bin`, `/usr/bin`. Wenn Ihre Safe-Bin-Executable in Paketmanager-/Benutzerpfaden liegt (zum Beispiel `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie diese explizit zu `tools.exec.safeBinTrustedDirs` hinzu.

### Shell-Verkettung, Wrapper und Multiplexer

Shell-Verkettung (`&&`, `||`, `;`) ist zulässig, wenn jedes Top-Level-Segment die Allowlist erfüllt (einschließlich Safe Bins oder Skill-Auto-Allow). Umleitungen bleiben im Allowlist-Modus nicht unterstützt. Befehlsersetzung (`$()` / Backticks) wird beim Allowlist-Parsing abgelehnt, auch innerhalb doppelter Anführungszeichen; verwenden Sie einfache Anführungszeichen, wenn Sie wörtlichen `$()`-Text benötigen.

Bei Genehmigungen über die macOS-Begleit-App wird roher Shell-Text, der Shell-Steuerungs- oder Expansionssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), als Allowlist-Fehltreffer behandelt, sofern die Shell-Binärdatei selbst nicht allowlisted ist.

Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragespezifische Env-Überschreibungen auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Bei `allow-always`-Entscheidungen im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) den Pfad der inneren Executable statt des Wrapper-Pfads. Shell-Multiplexer (`busybox`, `toybox`) werden für Shell-Applets (`sh`, `ash` usw.) auf dieselbe Weise entpackt. Wenn ein Wrapper oder Multiplexer nicht sicher entpackt werden kann, wird automatisch kein Allowlist-Eintrag gespeichert.

Wenn Sie Interpreter wie `python3` oder `node` allowlisten, bevorzugen Sie `tools.exec.strictInlineEval=true`, sodass Inline-Eval weiterhin eine explizite Genehmigung erfordert. Im strikten Modus kann `allow-always` weiterhin unbedenkliche Interpreter-/Skriptaufrufe speichern, Inline-Eval-Träger werden jedoch nicht automatisch gespeichert.

### Safe Bins versus Allowlist

| Thema            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Ziel             | Enge stdin-Filter automatisch erlauben                 | Bestimmten Executables explizit vertrauen                                          |
| Abgleichstyp     | Executable-Name + Safe-Bin-argv-Richtlinie             | Aufgelöster Executable-Pfad-Glob oder bloßer Befehlsnamen-Glob für über PATH aufgerufene Befehle |
| Argumentumfang   | Durch Safe-Bin-Profil und Literal-Token-Regeln eingeschränkt | Nur Pfadabgleich; Argumente liegen ansonsten in Ihrer Verantwortung                |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                           | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs                         |
| Beste Verwendung | Risikoarme Texttransformationen in Pipelines           | Jedes Tool mit breiterem Verhalten oder Nebenwirkungen                             |

Konfigurationsort:

- `safeBins` stammt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` stammt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` stammt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Profilschlüssel pro Agent überschreiben globale Schlüssel.
- Allowlist-Einträge liegen in der hostlokalen Datei `~/.openclaw/exec-approvals.json` unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Runtime-Bins ohne explizite Profile in `safeBins` erscheinen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` anlegen (danach prüfen und enger fassen). Interpreter-/Runtime-Bins werden nicht automatisch angelegt.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900000__
Wenn Sie `jq` explizit in `safeBins` aufnehmen, lehnt OpenClaw den `env`-Builtin im Safe-Bin-Modus weiterhin ab, sodass `jq -n env` die Host-Prozessumgebung nicht ohne expliziten Allowlist-Pfad oder Genehmigungsaufforderung ausgeben kann.

## Interpreter-/Runtime-Befehle

Genehmigungsgestützte Interpreter-/Runtime-Ausführungen sind absichtlich konservativ:

- Exakter argv-/cwd-/env-Kontext wird immer gebunden.
- Direkte Shell-Skript- und direkte Runtime-Dateiformen werden nach Best Effort an einen konkreten lokalen Datei-Snapshot gebunden.
- Gängige Paketmanager-Wrapper-Formen, die weiterhin auf eine direkte lokale Datei auflösen (zum Beispiel `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor der Bindung entpackt.
- Wenn OpenClaw für einen Interpreter-/Runtime-Befehl nicht genau eine konkrete lokale Datei identifizieren kann (zum Beispiel Paketskripte, Eval-Formen, runtime-spezifische Loader-Ketten oder mehrdeutige Mehrdatei-Formen), wird die genehmigungsgestützte Ausführung verweigert, statt semantische Abdeckung zu behaupten, die nicht besteht.
- Für diese Workflows bevorzugen Sie Sandboxing, eine separate Host-Grenze oder eine explizit vertrauenswürdige Allowlist/einen vollständigen Workflow, bei dem der Operator die breitere Runtime-Semantik akzeptiert.

Wenn Genehmigungen erforderlich sind, gibt das exec-Tool sofort eine Genehmigungs-ID zurück. Verwenden Sie diese ID, um spätere Systemereignisse (`Exec finished` / `Exec denied`) zu korrelieren. Wenn vor dem Timeout keine Entscheidung eintrifft, wird die Anfrage als Genehmigungs-Timeout behandelt und als Ablehnungsgrund ausgegeben.

### Verhalten bei Follow-up-Zustellung

Nachdem eine genehmigte asynchrone exec-Ausführung abgeschlossen ist, sendet OpenClaw einen Follow-up-`agent`-Turn an dieselbe Sitzung.

- Wenn ein gültiges externes Zustellziel vorhanden ist (zustellbarer Kanal plus Ziel `to`), nutzt die Follow-up-Zustellung diesen Kanal.
- In reinen Webchat- oder internen Sitzungsabläufen ohne externes Ziel bleibt die Follow-up-Zustellung sitzungsintern (`deliver: false`).
- Wenn ein Aufrufer explizit strikte externe Zustellung anfordert, aber kein externer Kanal auflösbar ist, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung auf sitzungsintern herabgestuft, statt fehlzuschlagen.

## Genehmigungsweiterleitung an Chat-Kanäle

Sie können exec-Genehmigungsaufforderungen an jeden Chat-Kanal (einschließlich Plugin-Kanälen) weiterleiten und sie mit `/approve` genehmigen. Dies verwendet die normale ausgehende Zustellpipeline.

Konfiguration:
__OC_I18N_900001__
Antwort im Chat:
__OC_I18N_900002__
Der Befehl `/approve` verarbeitet sowohl exec-Genehmigungen als auch Plugin-Genehmigungen. Wenn die ID keiner ausstehenden exec-Genehmigung entspricht, prüft er stattdessen automatisch Plugin-Genehmigungen.

### Plugin-Genehmigungsweiterleitung

Die Plugin-Genehmigungsweiterleitung verwendet dieselbe Zustellpipeline wie exec-Genehmigungen, hat jedoch ihre eigene unabhängige Konfiguration unter `approvals.plugin`. Das Aktivieren oder Deaktivieren der einen beeinflusst die andere nicht.
__OC_I18N_900003__
Die Konfigurationsform ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` und `targets` funktionieren auf dieselbe Weise.

Kanäle, die gemeinsame interaktive Antworten unterstützen, rendern dieselben Genehmigungsbuttons für exec- und Plugin-Genehmigungen. Kanäle ohne gemeinsame interaktive UI fallen auf Klartext mit `/approve`-Anweisungen zurück.

### Genehmigungen im selben Chat auf jedem Kanal

Wenn eine exec- oder Plugin-Genehmigungsanfrage von einer zustellbaren Chat-Oberfläche stammt, kann derselbe Chat sie jetzt standardmäßig mit `/approve` genehmigen. Dies gilt zusätzlich zu den bestehenden Web-UI- und Terminal-UI-Abläufen für Kanäle wie Slack, Matrix und Microsoft Teams.

Dieser gemeinsame Textbefehlsweg verwendet das normale Kanal-Auth-Modell für diese Unterhaltung. Wenn der ursprüngliche Chat bereits Befehle senden und Antworten empfangen kann, benötigen Genehmigungsanfragen keinen separaten nativen Zustelladapter mehr, nur um ausstehend zu bleiben.

Discord und Telegram unterstützen ebenfalls `/approve` im selben Chat, aber diese Kanäle verwenden weiterhin ihre aufgelöste Liste genehmigungsberechtigter Personen für die Autorisierung, selbst wenn native Genehmigungszustellung deaktiviert ist.

Für Telegram und andere native Genehmigungsclients, die das Gateway direkt aufrufen, ist dieser Fallback absichtlich auf „Genehmigung nicht gefunden“-Fehler begrenzt. Eine echte exec-Genehmigungsverweigerung/ein echter exec-Genehmigungsfehler wird nicht stillschweigend als Plugin-Genehmigung erneut versucht.

### Native Genehmigungszustellung

Einige Kanäle können auch als native Genehmigungsclients fungieren. Native Clients ergänzen den gemeinsamen `/approve`-Ablauf im selben Chat um genehmigungsberechtigte DMs, Origin-Chat-Fanout und kanalspezifische interaktive Genehmigungs-UX.

Wenn native Genehmigungskarten/-buttons verfügbar sind, ist diese native UI der primäre
agentenseitige Pfad. Der Agent sollte nicht zusätzlich einen doppelten einfachen Chat-Befehl
`/approve` ausgeben, es sei denn, das Tool-Ergebnis besagt, dass Chat-Genehmigungen nicht verfügbar sind oder
die manuelle Genehmigung der einzige verbleibende Pfad ist.

Wenn ein nativer Genehmigungsclient konfiguriert ist, aber keine native Laufzeitumgebung für
den Ursprungskanal aktiv ist, lässt OpenClaw die lokale deterministische `/approve`-
Eingabeaufforderung sichtbar. Wenn die native Laufzeitumgebung aktiv ist und eine Zustellung versucht, aber kein
Ziel die Karte empfängt, sendet OpenClaw einen Fallback-Hinweis im selben Chat mit dem
exakten Befehl `/approve <id> <decision>`, damit die Anfrage weiterhin aufgelöst werden kann.

Generisches Modell:

- die Host-Exec-Richtlinie entscheidet weiterhin, ob eine Exec-Genehmigung erforderlich ist
- `approvals.exec` steuert die Weiterleitung von Genehmigungsaufforderungen an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob dieser Kanal als nativer Genehmigungsclient fungiert

Native Genehmigungsclients aktivieren die DM-zuerst-Zustellung automatisch, wenn alle folgenden Bedingungen erfüllt sind:

- der Kanal unterstützt native Genehmigungszustellung
- Genehmigende können aus expliziten `execApprovals.approvers` oder der Besitzer-
  Identität wie `commands.ownerAllowFrom` aufgelöst werden
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`

Setzen Sie `enabled: false`, um einen nativen Genehmigungsclient explizit zu deaktivieren. Setzen Sie `enabled: true`, um
ihn zu erzwingen, wenn Genehmigende aufgelöst werden. Öffentliche Zustellung im Ursprungs-Chat bleibt über
`channels.<channel>.execApprovals.target` explizit.

FAQ: [Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Diese nativen Genehmigungsclients ergänzen den gemeinsamen
`/approve`-Flow im selben Chat und die gemeinsamen Genehmigungsbuttons um DM-Routing und optionales Kanal-Fanout.

Gemeinsames Verhalten:

- Slack, Matrix, Microsoft Teams und ähnliche zustellbare Chats verwenden das normale Kanal-Authentifizierungsmodell
  für `/approve` im selben Chat
- wenn ein nativer Genehmigungsclient automatisch aktiviert wird, sind Genehmigenden-DMs das standardmäßige native Zustellungsziel
- bei Discord und Telegram können nur aufgelöste Genehmigende genehmigen oder ablehnen
- Discord-Genehmigende können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden
- Telegram-Genehmigende können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden
- Slack-Genehmigende können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden
- native Slack-Buttons erhalten die Art der Genehmigungs-ID, sodass `plugin:`-IDs Plugin-Genehmigungen
  ohne eine zweite Slack-lokale Fallback-Ebene auflösen können
- natives Matrix-DM-/Kanal-Routing und Reaktionskürzel verarbeiten sowohl Exec- als auch Plugin-Genehmigungen;
  die Plugin-Autorisierung stammt weiterhin aus `channels.matrix.dm.allowFrom`
- native Matrix-Eingabeaufforderungen enthalten `com.openclaw.approval` als benutzerdefinierten Ereignisinhalt im ersten
  Eingabeaufforderungsereignis, sodass OpenClaw-fähige Matrix-Clients strukturierte Genehmigungszustände lesen können, während Standardclients
  den Klartext-Fallback `/approve` behalten
- der Anfragende muss kein Genehmigender sein
- der Ursprungs-Chat kann direkt mit `/approve` genehmigen, wenn dieser Chat bereits Befehle und Antworten unterstützt
- native Discord-Genehmigungsbuttons routen nach Art der Genehmigungs-ID: `plugin:`-IDs gehen
  direkt zu Plugin-Genehmigungen, alles andere geht zu Exec-Genehmigungen
- native Telegram-Genehmigungsbuttons folgen demselben begrenzten Exec-zu-Plugin-Fallback wie `/approve`
- wenn ein natives `target` die Zustellung im Ursprungs-Chat aktiviert, enthalten Genehmigungsaufforderungen den Befehlstext
- ausstehende Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab
- wenn keine Operator-UI oder kein konfigurierter Genehmigungsclient die Anfrage annehmen kann, fällt die Eingabeaufforderung auf `askFallback` zurück

Sensible gruppenbezogene Befehle nur für Besitzer wie `/diagnostics` und `/export-trajectory` verwenden privates
Besitzer-Routing für Genehmigungsaufforderungen und endgültige Ergebnisse. OpenClaw versucht zuerst eine private Route auf derselben
Oberfläche, auf der der Besitzer den Befehl ausgeführt hat. Wenn diese Oberfläche keine private Besitzer-Route hat, fällt es
auf die erste verfügbare Besitzer-Route aus `commands.ownerAllowFrom` zurück, sodass ein Discord-Gruppenbefehl
die Genehmigung und das Ergebnis weiterhin an die Telegram-DM des Besitzers senden kann, wenn Telegram als
primäre private Schnittstelle konfiguriert ist. Der Gruppenchat erhält nur eine kurze Bestätigung.

Telegram verwendet standardmäßig Genehmigenden-DMs (`target: "dm"`). Sie können zu `channel` oder `both` wechseln, wenn Sie
möchten, dass Genehmigungsaufforderungen auch im ursprünglichen Telegram-Chat/-Thema erscheinen. Bei Telegram-Forum-
Themen erhält OpenClaw das Thema für die Genehmigungsaufforderung und die Nachverfolgung nach der Genehmigung.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS-IPC-Flow
__OC_I18N_900004__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token gespeichert in `exec-approvals.json`.
- Peer-Prüfung mit gleicher UID.
- Challenge/Response (Nonce + HMAC-Token + Anfrage-Hash) + kurze TTL.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Kernrichtlinie und Genehmigungsflow
- [Exec-Tool](/de/tools/exec)
- [Erhöhter Modus](/de/tools/elevated)
- [Skills](/de/tools/skills) — durch Skills gestütztes Verhalten zum automatischen Zulassen
