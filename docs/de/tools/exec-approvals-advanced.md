---
read_when:
    - Konfigurieren sicherer Bins oder benutzerdefinierter Profile für sichere Bins
    - Freigaben an Slack/Discord/Telegram oder andere Chat-Kanäle weiterleiten
    - Implementierung eines nativen Genehmigungsclients für einen Kanal
summary: 'Erweiterte exec-Genehmigungen: sichere Binaries, Interpreter-Bindung, Genehmigungsweiterleitung, native Zustellung'
title: Ausführungsgenehmigungen — erweitert
x-i18n:
    generated_at: "2026-05-06T07:05:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Erweiterte Themen zu Exec-Genehmigungen: der `safeBins`-Schnellpfad, Interpreter-/Runtime-Bindung und Genehmigungsweiterleitung an Chat-Kanäle (einschließlich nativer Zustellung). Die Kernrichtlinie und den Genehmigungsablauf finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals).

## Sichere Binaries (nur stdin)

`tools.exec.safeBins` definiert eine kleine Liste von **nur stdin** verwendenden Binärprogrammen (zum Beispiel `cut`), die im Allowlist-Modus **ohne** explizite Allowlist-Einträge ausgeführt werden können. Sichere Binaries lehnen positionale Dateiargumente und pfadähnliche Tokens ab, sodass sie nur auf dem eingehenden Stream arbeiten können. Behandeln Sie dies als engen Schnellpfad für Stream-Filter, nicht als allgemeine Vertrauensliste.

<Warning>
Fügen Sie **keine** Interpreter- oder Runtime-Binärprogramme (zum Beispiel `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu. Wenn ein Befehl Code auswerten, Unterbefehle ausführen oder konstruktionsbedingt Dateien lesen kann, bevorzugen Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsabfragen aktiviert. Benutzerdefinierte sichere Binaries müssen ein explizites Profil in `tools.exec.safeBinProfiles.<bin>` definieren.
</Warning>

Standardmäßige sichere Binaries:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` stehen nicht in der Standardliste. Wenn Sie sie aktivieren, behalten Sie explizite Allowlist-Einträge für ihre Workflows ohne stdin bei. Geben Sie für `grep` im Safe-Bin-Modus das Muster mit `-e`/`--regexp` an; die positionale Musterform wird abgelehnt, damit Dateioperanden nicht als mehrdeutige positionale Argumente eingeschleust werden können.

### Argv-Validierung und verweigerte Flags

Die Validierung ist allein anhand der argv-Form deterministisch (keine Existenzprüfungen im Host-Dateisystem), wodurch Datei-Existenz-Orakelverhalten aus Unterschieden zwischen Zulassen und Verweigern verhindert wird. Dateiorientierte Optionen werden für standardmäßige sichere Binaries verweigert; lange Optionen werden fail-closed validiert (unbekannte Flags und mehrdeutige Abkürzungen werden abgelehnt).

Verweigerte Flags nach Safe-Bin-Profil:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Sichere Binaries erzwingen außerdem, dass argv-Tokens zur Ausführungszeit für nur-stdin-Segmente als **literal text** behandelt werden (kein Globbing und keine `$VARS`-Expansion), sodass Muster wie `*` oder `$HOME/...` nicht zum Einschleusen von Dateilesevorgängen verwendet werden können.

### Vertrauenswürdige Binary-Verzeichnisse

Sichere Binaries müssen aus vertrauenswürdigen Binary-Verzeichnissen aufgelöst werden (Systemstandards plus optional `tools.exec.safeBinTrustedDirs`). `PATH`-Einträge werden nie automatisch als vertrauenswürdig eingestuft. Die standardmäßig vertrauenswürdigen Verzeichnisse sind absichtlich minimal: `/bin`, `/usr/bin`. Wenn sich Ihr Safe-Bin-Executable in Paketmanager-/Benutzerpfaden befindet (zum Beispiel `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie diese explizit zu `tools.exec.safeBinTrustedDirs` hinzu.

### Shell-Verkettung, Wrapper und Multiplexer

Shell-Verkettung (`&&`, `||`, `;`) ist erlaubt, wenn jedes Top-Level-Segment die Allowlist erfüllt (einschließlich sicherer Binaries oder automatischer Skill-Zulassung). Umleitungen werden im Allowlist-Modus weiterhin nicht unterstützt. Befehlsersetzung (`$()` / Backticks) wird beim Allowlist-Parsing abgelehnt, auch innerhalb doppelter Anführungszeichen; verwenden Sie einfache Anführungszeichen, wenn Sie literal `$()`-Text benötigen.

Bei Genehmigungen über die macOS-Begleit-App wird roher Shell-Text, der Shell-Steuer- oder Expansionssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), als Allowlist-Fehltreffer behandelt, sofern nicht das Shell-Binärprogramm selbst auf der Allowlist steht.

Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden request-scoped Env-Overrides auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Bei `allow-always`-Entscheidungen im Allowlist-Modus persistieren bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) den Pfad des inneren Executables statt des Wrapper-Pfads. Shell-Multiplexer (`busybox`, `toybox`) werden für Shell-Applets (`sh`, `ash` usw.) auf dieselbe Weise entpackt. Wenn ein Wrapper oder Multiplexer nicht sicher entpackt werden kann, wird automatisch kein Allowlist-Eintrag persistiert.

Wenn Sie Interpreter wie `python3` oder `node` auf die Allowlist setzen, bevorzugen Sie `tools.exec.strictInlineEval=true`, damit Inline-Eval weiterhin eine explizite Genehmigung erfordert. Im strikten Modus kann `allow-always` weiterhin unbedenkliche Interpreter-/Skriptaufrufe persistieren, Inline-Eval-Träger werden jedoch nicht automatisch persistiert.

### Sichere Binaries gegenüber Allowlist

| Thema            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Ziel             | Enge stdin-Filter automatisch zulassen                 | Bestimmten Executables explizit vertrauen                                          |
| Match-Typ        | Executable-Name + Safe-Bin-argv-Richtlinie             | Aufgelöstes Executable-Pfad-Glob oder nacktes Befehlsnamen-Glob für über PATH aufgerufene Befehle |
| Argumentbereich  | Durch Safe-Bin-Profil und Literal-Token-Regeln eingeschränkt | Standardmäßig Pfad-Match; optional kann `argPattern` das geparste argv einschränken |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                           | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs                         |
| Beste Verwendung | Texttransformationen mit geringem Risiko in Pipelines  | Jedes Tool mit breiterem Verhalten oder Seiteneffekten                             |

Konfigurationsort:

- `safeBins` stammt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` stammt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` stammt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Profil-Schlüssel pro Agent überschreiben globale Schlüssel.
- Allowlist-Einträge liegen host-lokal in `~/.openclaw/exec-approvals.json` unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Runtime-Binaries ohne explizite Profile in `safeBins` erscheinen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` anlegen (anschließend prüfen und enger fassen). Interpreter-/Runtime-Binaries werden nicht automatisch angelegt.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900000__
Wenn Sie `jq` explizit in `safeBins` aufnehmen, lehnt OpenClaw das Builtin `env` im Safe-Bin-Modus weiterhin ab, sodass `jq -n env` die Host-Prozessumgebung nicht ohne expliziten Allowlist-Pfad oder Genehmigungsabfrage ausgeben kann.

## Interpreter-/Runtime-Befehle

Genehmigungsgestützte Interpreter-/Runtime-Ausführungen sind absichtlich konservativ:

- Der exakte argv-/cwd-/env-Kontext wird immer gebunden.
- Direkte Shell-Skript- und direkte Runtime-Dateiformen werden bestmöglich an einen konkreten lokalen Datei-Snapshot gebunden.
- Gängige Paketmanager-Wrapper-Formen, die weiterhin zu genau einer direkten lokalen Datei auflösen (zum Beispiel `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor der Bindung entpackt.
- Wenn OpenClaw nicht genau eine konkrete lokale Datei für einen Interpreter-/Runtime-Befehl identifizieren kann (zum Beispiel Paketskripte, Eval-Formen, runtime-spezifische Loader-Ketten oder mehrdeutige Mehrdatei-Formen), wird genehmigungsgestützte Ausführung verweigert, statt eine semantische Abdeckung zu behaupten, die sie nicht hat.
- Bevorzugen Sie für diese Workflows Sandboxing, eine separate Host-Grenze oder eine explizit vertrauenswürdige Allowlist bzw. einen vollständigen Workflow, bei dem der Operator die breitere Runtime-Semantik akzeptiert.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort eine Genehmigungs-ID zurück. Verwenden Sie diese ID, um spätere Systemereignisse (`Exec finished` / `Exec denied`) zu korrelieren. Wenn vor dem Timeout keine Entscheidung eintrifft, wird die Anfrage als Genehmigungs-Timeout behandelt und als Verweigerungsgrund angezeigt.

### Verhalten bei Follow-up-Zustellung

Nachdem ein genehmigter asynchroner Exec abgeschlossen ist, sendet OpenClaw einen Follow-up-`agent`-Turn an dieselbe Sitzung.

- Wenn ein gültiges externes Zustellziel existiert (zustellbarer Kanal plus Ziel `to`), verwendet die Follow-up-Zustellung diesen Kanal.
- In reinen Webchat- oder internen Sitzungsabläufen ohne externes Ziel bleibt die Follow-up-Zustellung nur sitzungsintern (`deliver: false`).
- Wenn ein Aufrufer ausdrücklich strikte externe Zustellung ohne auflösbaren externen Kanal anfordert, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung auf nur sitzungsintern herabgestuft, statt fehlzuschlagen.

## Genehmigungsweiterleitung an Chat-Kanäle

Sie können Exec-Genehmigungsabfragen an jeden Chat-Kanal (einschließlich Plugin-Kanälen) weiterleiten und sie mit `/approve` genehmigen. Dies verwendet die normale Pipeline für ausgehende Zustellung.

Konfiguration:
__OC_I18N_900001__
Im Chat antworten:
__OC_I18N_900002__
Der Befehl `/approve` verarbeitet sowohl Exec-Genehmigungen als auch Plugin-Genehmigungen. Wenn die ID keiner ausstehenden Exec-Genehmigung entspricht, prüft er automatisch stattdessen Plugin-Genehmigungen.

### Weiterleitung von Plugin-Genehmigungen

Die Weiterleitung von Plugin-Genehmigungen verwendet dieselbe Zustellungspipeline wie Exec-Genehmigungen, hat aber eine eigene unabhängige Konfiguration unter `approvals.plugin`. Das Aktivieren oder Deaktivieren des einen beeinflusst das andere nicht.
__OC_I18N_900003__
Die Konfigurationsform ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` und `targets` funktionieren auf dieselbe Weise.

Kanäle, die gemeinsame interaktive Antworten unterstützen, rendern dieselben Genehmigungsbuttons für Exec- und Plugin-Genehmigungen. Kanäle ohne gemeinsame interaktive UI fallen auf Klartext mit `/approve`-Anweisungen zurück.

### Genehmigungen im selben Chat auf jedem Kanal

Wenn eine Exec- oder Plugin-Genehmigungsanfrage von einer zustellbaren Chat-Oberfläche stammt, kann derselbe Chat sie jetzt standardmäßig mit `/approve` genehmigen. Dies gilt zusätzlich zu den bestehenden Web-UI- und Terminal-UI-Abläufen auch für Kanäle wie Slack, Matrix und Microsoft Teams.

Dieser gemeinsame Textbefehlsweg verwendet das normale Kanal-Auth-Modell für diese Unterhaltung. Wenn der Ursprungs-Chat bereits Befehle senden und Antworten empfangen kann, benötigen Genehmigungsanfragen keinen separaten nativen Zustelladapter mehr, nur um ausstehend zu bleiben.

Discord und Telegram unterstützen ebenfalls `/approve` im selben Chat, aber diese Kanäle verwenden weiterhin ihre aufgelöste Liste genehmigender Personen für die Autorisierung, selbst wenn die native Genehmigungszustellung deaktiviert ist.

Für Telegram und andere native Genehmigungsclients, die das Gateway direkt aufrufen, ist dieser Fallback absichtlich auf „Genehmigung nicht gefunden“-Fehler begrenzt. Eine echte Exec-Genehmigungsverweigerung oder ein echter Exec-Genehmigungsfehler versucht nicht stillschweigend erneut eine Plugin-Genehmigung.

### Native Genehmigungszustellung

Einige Kanäle können auch als native Genehmigungsclients fungieren. Native Clients ergänzen den gemeinsamen `/approve`-Ablauf im selben Chat um DMs an genehmigende Personen, Fanout in den Ursprungs-Chat und kanalspezifische interaktive Genehmigungs-UX.

Wenn native Genehmigungskarten/-schaltflächen verfügbar sind, ist diese native UI der primäre
agentenseitige Pfad. Der Agent sollte nicht zusätzlich einen doppelten einfachen Chat-Befehl
`/approve` wiederholen, außer das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
die manuelle Genehmigung der einzige verbleibende Weg ist.

Wenn ein nativer Genehmigungs-Client konfiguriert ist, aber keine native Laufzeit für
den Ursprungskanal aktiv ist, hält OpenClaw die lokale deterministische `/approve`-
Aufforderung sichtbar. Wenn die native Laufzeit aktiv ist und die Zustellung versucht, aber kein
Ziel die Karte empfängt, sendet OpenClaw einen Fallback-Hinweis im selben Chat mit dem
exakten Befehl `/approve <id> <decision>`, damit die Anfrage trotzdem entschieden werden kann.

Generisches Modell:

- Die Host-Ausführungsrichtlinie entscheidet weiterhin, ob eine Exec-Genehmigung erforderlich ist
- `approvals.exec` steuert die Weiterleitung von Genehmigungsaufforderungen an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob dieser Kanal als nativer Genehmigungs-Client fungiert

Native Genehmigungs-Clients aktivieren DM-zuerst-Zustellung automatisch, wenn all dies zutrifft:

- Der Kanal unterstützt native Genehmigungszustellung
- Genehmigende Personen können aus expliziten `execApprovals.approvers` oder der Besitzer-
  Identität wie `commands.ownerAllowFrom` aufgelöst werden
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`

Setzen Sie `enabled: false`, um einen nativen Genehmigungs-Client explizit zu deaktivieren. Setzen Sie `enabled: true`, um
ihn zu erzwingen, wenn Genehmigende aufgelöst werden. Öffentliche Zustellung im Ursprungs-Chat bleibt explizit über
`channels.<channel>.execApprovals.target`.

FAQ: [Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Diese nativen Genehmigungs-Clients ergänzen den gemeinsamen
`/approve`-Ablauf im selben Chat und gemeinsame Genehmigungsschaltflächen um DM-Routing und optionales Kanal-Fanout.

Gemeinsames Verhalten:

- Slack, Matrix, Microsoft Teams und ähnliche zustellbare Chats verwenden das normale Kanal-Authentifizierungsmodell
  für `/approve` im selben Chat
- Wenn ein nativer Genehmigungs-Client automatisch aktiviert wird, ist das standardmäßige native Zustellungsziel Genehmigenden-DMs
- Für Discord und Telegram können nur aufgelöste Genehmigende genehmigen oder ablehnen
- Discord-Genehmigende können explizit (`execApprovals.approvers`) sein oder aus `commands.ownerAllowFrom` abgeleitet werden
- Telegram-Genehmigende können explizit (`execApprovals.approvers`) sein oder aus `commands.ownerAllowFrom` abgeleitet werden
- Slack-Genehmigende können explizit (`execApprovals.approvers`) sein oder aus `commands.ownerAllowFrom` abgeleitet werden
- Native Slack-Schaltflächen behalten die Art der Genehmigungs-ID bei, sodass `plugin:`-IDs Plugin-Genehmigungen auflösen können,
  ohne eine zweite Slack-lokale Fallback-Schicht
- Natives Matrix-DM-/Kanal-Routing und Reaktionskürzel verarbeiten sowohl Exec- als auch Plugin-Genehmigungen;
  die Plugin-Autorisierung kommt weiterhin aus `channels.matrix.dm.allowFrom`
- Native Matrix-Aufforderungen enthalten `com.openclaw.approval` als benutzerdefinierten Ereignisinhalt im ersten Aufforderungs-
  Ereignis, damit OpenClaw-fähige Matrix-Clients strukturierte Genehmigungszustände lesen können, während Standard-Clients
  den Klartext-Fallback `/approve` behalten
- Die anfragende Person muss keine genehmigende Person sein
- Der Ursprungs-Chat kann direkt mit `/approve` genehmigen, wenn dieser Chat bereits Befehle und Antworten unterstützt
- Native Discord-Genehmigungsschaltflächen routen nach Art der Genehmigungs-ID: `plugin:`-IDs gehen
  direkt an Plugin-Genehmigungen, alles andere geht an Exec-Genehmigungen
- Native Telegram-Genehmigungsschaltflächen folgen demselben begrenzten Exec-zu-Plugin-Fallback wie `/approve`
- Wenn native `target`-Konfiguration Zustellung im Ursprungs-Chat aktiviert, enthalten Genehmigungsaufforderungen den Befehlstext
- Ausstehende Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab
- Wenn keine Operator-UI oder kein konfigurierter Genehmigungs-Client die Anfrage annehmen kann, fällt die Aufforderung auf `askFallback` zurück

Sensible Gruppenbefehle nur für Besitzer wie `/diagnostics` und `/export-trajectory` verwenden privates
Besitzer-Routing für Genehmigungsaufforderungen und endgültige Ergebnisse. OpenClaw versucht zuerst eine private Route auf
derselben Oberfläche, auf der der Besitzer den Befehl ausgeführt hat. Wenn diese Oberfläche keine private Besitzer-Route hat, fällt es
auf die erste verfügbare Besitzer-Route aus `commands.ownerAllowFrom` zurück, sodass ein Discord-Gruppenbefehl
die Genehmigung und das Ergebnis trotzdem an die Telegram-DM des Besitzers senden kann, wenn Telegram als
primäre private Oberfläche konfiguriert ist. Der Gruppenchat erhält nur eine kurze Bestätigung.

Telegram verwendet standardmäßig Genehmigenden-DMs (`target: "dm"`). Sie können zu `channel` oder `both` wechseln, wenn Sie
möchten, dass Genehmigungsaufforderungen auch im ursprünglichen Telegram-Chat/-Thema erscheinen. Für Telegram-Forum-
Themen behält OpenClaw das Thema für die Genehmigungsaufforderung und die Nachverfolgung nach der Genehmigung bei.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS-IPC-Ablauf
__OC_I18N_900004__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token gespeichert in `exec-approvals.json`.
- Peer-Prüfung mit derselben UID.
- Challenge/Response (Nonce + HMAC-Token + Request-Hash) + kurze TTL.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Kernrichtlinie und Genehmigungsablauf
- [Exec-Tool](/de/tools/exec)
- [Erweiterter Modus](/de/tools/elevated)
- [Skills](/de/tools/skills) — Skill-gestütztes automatisches Zulassungsverhalten
