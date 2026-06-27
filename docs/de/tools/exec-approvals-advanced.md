---
read_when:
    - Sichere Bins oder benutzerdefinierte Safe-Bin-Profile konfigurieren
    - Genehmigungen an Slack/Discord/Telegram oder andere Chat-Kanäle weiterleiten
    - Implementieren eines nativen Genehmigungsclients für einen Kanal
summary: 'Erweiterte Exec-Genehmigungen: sichere Binaries, Interpreter-Bindung, Genehmigungsweiterleitung, native Zustellung'
title: Exec-Genehmigungen — erweitert
x-i18n:
    generated_at: "2026-06-27T18:17:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Fortgeschrittene Themen zu Exec-Genehmigungen: der `safeBins`-Fast-Path, Interpreter-/Runtime-Bindung und Genehmigungsweiterleitung an Chat-Kanäle (einschließlich nativer Zustellung). Den zentralen Richtlinien- und Genehmigungsablauf finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals).

## Safe Bins (nur stdin)

`tools.exec.safeBins` definiert eine kleine Liste von **nur-stdin**-Binärdateien (zum Beispiel `cut`), die im Allowlist-Modus **ohne** explizite Allowlist-Einträge ausgeführt werden können. Safe Bins lehnen positionale Dateiargumente und pfadähnliche Tokens ab, sodass sie nur mit dem eingehenden Stream arbeiten können. Behandeln Sie dies als engen Fast-Path für Stream-Filter, nicht als allgemeine Vertrauensliste.

<Warning>
Fügen Sie **keine** Interpreter- oder Runtime-Binärdateien (zum Beispiel `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu. Wenn ein Befehl Code auswerten, Unterbefehle ausführen oder konstruktionsbedingt Dateien lesen kann, bevorzugen Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsaufforderungen aktiviert. Benutzerdefinierte Safe Bins müssen ein explizites Profil in `tools.exec.safeBinProfiles.<bin>` definieren.
</Warning>

Standardmäßige Safe Bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` sind nicht in der Standardliste enthalten. Wenn Sie sie aktivieren, behalten Sie explizite Allowlist-Einträge für ihre Workflows ohne stdin bei. Für `grep` im Safe-Bin-Modus geben Sie das Muster mit `-e`/`--regexp` an; die positionale Musterform wird abgelehnt, damit Dateioperanden nicht als mehrdeutige positionale Argumente eingeschleust werden können.

### Argv-Validierung und abgelehnte Flags

Die Validierung ist ausschließlich anhand der argv-Form deterministisch (keine Existenzprüfungen im Host-Dateisystem), wodurch verhindert wird, dass Allow-/Deny-Unterschiede als Datei-Existenz-Orakel wirken. Dateiorientierte Optionen werden für standardmäßige Safe Bins abgelehnt; lange Optionen werden fail-closed validiert (unbekannte Flags und mehrdeutige Abkürzungen werden abgelehnt).

Abgelehnte Flags nach Safe-Bin-Profil:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe Bins erzwingen außerdem, dass argv-Tokens zur Ausführungszeit für nur-stdin-Segmente als **literaler Text** behandelt werden (kein Globbing und keine `$VARS`-Expansion), sodass Muster wie `*` oder `$HOME/...` nicht verwendet werden können, um Dateilesezugriffe einzuschleusen.

### Vertrauenswürdige Binärverzeichnisse

Safe Bins müssen aus vertrauenswürdigen Binärverzeichnissen aufgelöst werden (Systemstandards plus optional `tools.exec.safeBinTrustedDirs`). `PATH`-Einträge werden nie automatisch als vertrauenswürdig eingestuft. Standardmäßige vertrauenswürdige Verzeichnisse sind absichtlich minimal: `/bin`, `/usr/bin`. Wenn Ihre Safe-Bin-Ausführungsdatei in Paketmanager-/Benutzerpfaden liegt (zum Beispiel `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie diese explizit zu `tools.exec.safeBinTrustedDirs` hinzu.

### Shell-Verkettung, Wrapper und Multiplexer

Shell-Verkettung (`&&`, `||`, `;`) ist erlaubt, wenn jedes Top-Level-Segment die Allowlist erfüllt (einschließlich Safe Bins oder automatischer Skill-Zulassung). Umleitungen bleiben im Allowlist-Modus nicht unterstützt. Befehlssubstitution (`$()` / Backticks) wird während des Allowlist-Parsings abgelehnt, auch innerhalb doppelter Anführungszeichen; verwenden Sie einfache Anführungszeichen, wenn Sie literalen `$()`-Text benötigen.

Bei Genehmigungen für macOS-Companion-Apps wird roher Shell-Text, der Shell-Steuerungs- oder Expansionssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), als Allowlist-Fehlschlag behandelt, sofern nicht die Shell-Binärdatei selbst in der Allowlist steht.

Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anforderungsspezifische Env-Überschreibungen auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Bei `allow-always`-Entscheidungen im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) den Pfad der inneren Ausführungsdatei statt des Wrapper-Pfads. Shell-Multiplexer (`busybox`, `toybox`) werden für Shell-Applets (`sh`, `ash` usw.) auf dieselbe Weise entpackt. Wenn ein Wrapper oder Multiplexer nicht sicher entpackt werden kann, wird automatisch kein Allowlist-Eintrag gespeichert.

Wenn Sie Interpreter wie `python3` oder `node` in die Allowlist aufnehmen, bevorzugen Sie `tools.exec.strictInlineEval=true`, damit Inline-Eval weiterhin eine explizite Genehmigung erfordert. Im strikten Modus kann `allow-always` weiterhin harmlose Interpreter-/Skriptaufrufe speichern, aber Inline-Eval-Träger werden nicht automatisch gespeichert.

### Safe Bins versus Allowlist

| Thema | `tools.exec.safeBins` | Allowlist (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Ziel | Enge stdin-Filter automatisch zulassen | Bestimmten Ausführungsdateien explizit vertrauen |
| Abgleichstyp | Name der Ausführungsdatei + Safe-Bin-argv-Richtlinie | Glob für aufgelösten Ausführungsdateipfad oder bloßer Befehlsnamen-Glob für über PATH aufgerufene Befehle |
| Argumentumfang | Durch Safe-Bin-Profil und Literal-Token-Regeln eingeschränkt | Standardmäßig Pfadabgleich; optional kann `argPattern` geparstes argv einschränken |
| Typische Beispiele | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs |
| Beste Verwendung | Texttransformationen mit geringem Risiko in Pipelines | Jedes Tool mit breiterem Verhalten oder Nebenwirkungen |

Konfigurationsort:

- `safeBins` stammt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` stammt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` stammt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Profilschlüssel pro Agent überschreiben globale Schlüssel.
- Allowlist-Einträge liegen in der hostlokalen Genehmigungsdatei unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Runtime-Bins ohne explizite Profile in `safeBins` erscheinen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` erzeugen (anschließend prüfen und einschränken). Interpreter-/Runtime-Bins werden nicht automatisch erzeugt.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900000__
Wenn Sie `jq` explizit in `safeBins` aufnehmen, lehnt OpenClaw das `env`-Builtin im Safe-Bin-Modus trotzdem ab, sodass `jq -n env` die Host-Prozessumgebung nicht ohne expliziten Allowlist-Pfad oder Genehmigungsaufforderung ausgeben kann.

## Interpreter-/Runtime-Befehle

Genehmigungsgestützte Interpreter-/Runtime-Ausführungen sind absichtlich konservativ:

- Der genaue argv-/cwd-/env-Kontext ist immer gebunden.
- Direkte Shell-Skript- und direkte Runtime-Dateiformen werden bestmöglich an einen konkreten lokalen Datei-Snapshot gebunden.
- Gängige Paketmanager-Wrapper-Formen, die weiterhin auf eine direkte lokale Datei auflösen (zum Beispiel `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor der Bindung entpackt.
- Wenn OpenClaw für einen Interpreter-/Runtime-Befehl nicht genau eine konkrete lokale Datei identifizieren kann (zum Beispiel Paket-Skripte, Eval-Formen, runtime-spezifische Loader-Ketten oder mehrdeutige Mehrdatei-Formen), wird die genehmigungsgestützte Ausführung verweigert, statt eine semantische Abdeckung zu behaupten, die sie nicht hat.
- Für diese Workflows bevorzugen Sie Sandboxing, eine separate Host-Grenze oder einen explizit vertrauenswürdigen Allowlist-/vollständigen Workflow, bei dem der Operator die breitere Runtime-Semantik akzeptiert.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort eine Genehmigungs-ID zurück. Verwenden Sie diese ID, um später genehmigte Systemereignisse zur Ausführung zu korrelieren (`Exec finished` und `Exec running`, wenn konfiguriert). Wenn vor dem Timeout keine Entscheidung eintrifft, wird die Anforderung als Genehmigungs-Timeout behandelt und als terminale Host-Befehlsverweigerung angezeigt. Bei asynchronen Genehmigungen des Haupt-Agenten mit ursprünglicher Sitzung setzt OpenClaw diese Sitzung außerdem mit einem internen Follow-up fort, damit der Agent erkennt, dass der Befehl nicht ausgeführt wurde, statt später ein fehlendes Ergebnis zu reparieren.

### Verhalten bei Follow-up-Zustellung

Nachdem ein genehmigter asynchroner Exec abgeschlossen ist, sendet OpenClaw einen Follow-up-`agent`-Turn an dieselbe Sitzung. Abgelehnte asynchrone Genehmigungen verwenden denselben Hauptsitzungs-Follow-up-Pfad für den Ablehnungsstatus, registrieren aber keine erhöhten Runtime-Handoffs und führen den Befehl nicht aus. Ablehnungen ohne fortsetzbare Hauptsitzung werden entweder unterdrückt oder über eine sichere direkte Route gemeldet, wenn eine vorhanden ist.

- Wenn ein gültiges externes Zustellziel vorhanden ist (zustellbarer Kanal plus Ziel `to`), verwendet die Follow-up-Zustellung diesen Kanal.
- In reinem Webchat oder internen Sitzungsabläufen ohne externes Ziel bleibt die Follow-up-Zustellung nur sitzungsintern (`deliver: false`).
- Wenn ein Aufrufer explizit strikte externe Zustellung anfordert, aber kein externer Kanal auflösbar ist, schlägt die Anforderung mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung auf nur sitzungsintern herabgestuft, statt fehlzuschlagen.

## Genehmigungsweiterleitung an Chat-Kanäle

Sie können Exec-Genehmigungsaufforderungen an jeden Chat-Kanal weiterleiten (einschließlich Plugin-Kanälen) und sie mit `/approve` genehmigen. Dies verwendet die normale Pipeline für ausgehende Zustellung.

Konfiguration:
__OC_I18N_900001__
Antwort im Chat:
__OC_I18N_900002__
Der Befehl `/approve` verarbeitet sowohl Exec-Genehmigungen als auch Plugin-Genehmigungen. Wenn die ID keiner ausstehenden Exec-Genehmigung entspricht, prüft er stattdessen automatisch Plugin-Genehmigungen.

### Weiterleitung von Plugin-Genehmigungen

Die Weiterleitung von Plugin-Genehmigungen verwendet dieselbe Zustellpipeline wie Exec-Genehmigungen, hat aber eine eigene unabhängige Konfiguration unter `approvals.plugin`. Das Aktivieren oder Deaktivieren des einen beeinflusst das andere nicht. Informationen zum Verhalten beim Erstellen von Plugins, zu Anforderungsfeldern und zur Entscheidungssemantik finden Sie unter [Plugin-Berechtigungsanforderungen](/plugins/plugin-permission-requests).
__OC_I18N_900003__
Die Konfigurationsform ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` und `targets` funktionieren auf dieselbe Weise.

Kanäle, die gemeinsame interaktive Antworten unterstützen, rendern dieselben Genehmigungsschaltflächen für Exec- und Plugin-Genehmigungen. Kanäle ohne gemeinsame interaktive UI fallen auf Klartext mit `/approve`-Anweisungen zurück.
Plugin-Genehmigungsanforderungen können die verfügbaren Entscheidungen einschränken. Genehmigungsoberflächen verwenden den in der Anforderung deklarierten Entscheidungssatz, und der Gateway lehnt Versuche ab, eine nicht angebotene Entscheidung zu übermitteln.

### Genehmigungen im selben Chat auf jedem Kanal

Wenn eine Exec- oder Plugin-Genehmigungsanforderung von einer zustellbaren Chat-Oberfläche stammt, kann derselbe Chat sie jetzt standardmäßig mit `/approve` genehmigen. Dies gilt zusätzlich zu den bestehenden Web-UI- und Terminal-UI-Abläufen für Kanäle wie Slack, Matrix und Microsoft Teams.

Dieser gemeinsame Textbefehls-Pfad verwendet das normale Authentifizierungsmodell des Channels für diese Unterhaltung. Wenn der
ursprüngliche Chat bereits Befehle senden und Antworten empfangen kann, benötigen Genehmigungsanfragen keinen
separaten nativen Zustelladapter mehr, nur um ausstehend zu bleiben.

Discord und Telegram unterstützen ebenfalls `/approve` im selben Chat, aber diese Channels verwenden weiterhin ihre
aufgelöste Genehmigerliste für die Autorisierung, auch wenn die native Genehmigungszustellung deaktiviert ist.

Für Telegram und andere native Genehmigungsclients, die den Gateway direkt aufrufen,
ist dieser Fallback absichtlich auf Fehler vom Typ „Genehmigung nicht gefunden“ begrenzt. Eine echte
Exec-Genehmigungsverweigerung oder ein Fehler wird nicht stillschweigend erneut als Plugin-Genehmigung versucht.

### Native Genehmigungszustellung

Einige Channels können auch als native Genehmigungsclients fungieren. Native Clients ergänzen den gemeinsamen
`/approve`-Ablauf im selben Chat um Genehmiger-DMs, Fanout in den Ursprungs-Chat
und channelspezifische interaktive Genehmigungs-UX.

Wenn native Genehmigungskarten/-buttons verfügbar sind, ist diese native UI der primäre
agentenseitige Pfad. Der Agent sollte nicht zusätzlich einen doppelten einfachen Chat-Befehl
`/approve` ausgeben, es sei denn, das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige verbleibende Pfad ist.

Wenn ein nativer Genehmigungsclient konfiguriert ist, aber keine native Runtime für
den ursprünglichen Channel aktiv ist, lässt OpenClaw die lokale deterministische `/approve`-
Aufforderung sichtbar. Wenn die native Runtime aktiv ist und die Zustellung versucht, aber kein
Ziel die Karte erhält, sendet OpenClaw einen Fallback-Hinweis im selben Chat mit dem
exakten Befehl `/approve <id> <decision>`, damit die Anfrage weiterhin aufgelöst werden kann.

Generisches Modell:

- Die Host-Exec-Richtlinie entscheidet weiterhin, ob Exec-Genehmigung erforderlich ist
- `approvals.exec` steuert die Weiterleitung von Genehmigungsaufforderungen an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob Discord, Slack, Telegram und ähnliche
  channelspezifische native Clients aktiviert sind
- Slack-Plugin-Genehmigungen können Slacks nativen Genehmigungsclient verwenden, wenn die Anfrage aus Slack kommt
  und Slack-Plugin-Genehmiger aufgelöst werden; `approvals.plugin` kann Plugin-Genehmigungen auch an Slack-
  Sessions oder Ziele routen, selbst wenn Slack-Exec-Genehmigungen deaktiviert sind
- Native Genehmigungskarten in Google Chat verarbeiten Exec- und Plugin-Genehmigungen, die aus Google
  Chat-Bereichen oder -Threads stammen, wenn stabile `users/<id>`-Genehmiger aus `dm.allowFrom` oder
  `defaultTo` aufgelöst werden; sie verwenden keine Reaktionsereignisse für Entscheidungen
- Die Genehmigungszustellung per Reaktion in WhatsApp und Signal wird durch `approvals.exec` und
  `approvals.plugin` gesteuert; sie haben keine `channels.<channel>.execApprovals`-Blöcke

Native Genehmigungsclients aktivieren DM-zuerst-Zustellung automatisch, wenn all dies zutrifft:

- Der Channel unterstützt native Genehmigungszustellung
- Genehmiger können aus expliziten `execApprovals.approvers` oder der Besitzeridentität
  wie `commands.ownerAllowFrom` aufgelöst werden
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`

Setzen Sie `enabled: false`, um einen nativen Genehmigungsclient explizit zu deaktivieren. Setzen Sie `enabled: true`, um
ihn zu erzwingen, wenn Genehmiger aufgelöst werden. Öffentliche Zustellung in den Ursprungs-Chat bleibt über
`channels.<channel>.execApprovals.target` explizit.

FAQ: [Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: Konfigurieren Sie stabile Genehmiger mit `channels.googlechat.dm.allowFrom` oder
  `channels.googlechat.defaultTo`; kein `execApprovals`-Block ist erforderlich
- WhatsApp: Verwenden Sie `approvals.exec` und `approvals.plugin`, um Genehmigungsaufforderungen an WhatsApp zu routen
- Signal: Verwenden Sie `approvals.exec` und `approvals.plugin`, um Genehmigungsaufforderungen an Signal zu routen

Diese nativen Genehmigungsclients ergänzen den gemeinsamen `/approve`-Ablauf im selben Chat und die gemeinsamen
Genehmigungsbuttons um DM-Routing und optionalen Channel-Fanout.

Gemeinsames Verhalten:

- Slack, Matrix, Microsoft Teams und ähnliche zustellbare Chats verwenden das normale Channel-Auth-Modell
  für `/approve` im selben Chat
- Wenn sich ein nativer Genehmigungsclient automatisch aktiviert, ist das standardmäßige native Zustellziel Genehmiger-DMs
- Für Discord und Telegram können nur aufgelöste Genehmiger genehmigen oder ablehnen
- Discord-Genehmiger können explizit (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet sein
- Telegram-Genehmiger können explizit (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet sein
- Slack-Genehmiger können explizit (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet sein
- Slack-Plugin-Genehmigungs-DMs verwenden Slack-Plugin-Genehmiger aus `allowFrom` und Standard-
  Routing des Kontos, nicht Slack-Exec-Genehmiger
- Native Slack-Buttons bewahren die Art der Genehmigungs-ID, sodass `plugin:`-IDs Plugin-Genehmigungen
  ohne zweite Slack-lokale Fallback-Schicht auflösen können
- Native Google Chat-Karten bewahren den manuellen `/approve`-Fallback im Nachrichtentext, aber Kartenbutton-
  Callbacks tragen nur opake Aktionstokens; Genehmigungs-ID und Entscheidung werden aus serverseitigem
  ausstehendem Zustand wiederhergestellt
- WhatsApp-Emoji-Genehmigungen verarbeiten sowohl Exec- als auch Plugin-Aufforderungen nur, wenn die passende übergeordnete
  Weiterleitungsfamilie aktiviert ist und an WhatsApp routet; zielgebundene WhatsApp-Weiterleitung bleibt auf
  dem gemeinsamen Weiterleitungspfad, sofern sie nicht dasselbe native Ursprungsziel erfüllt
- Signal-Reaktionsgenehmigungen verarbeiten sowohl Exec- als auch Plugin-Aufforderungen nur, wenn die passende übergeordnete
  Weiterleitungsfamilie aktiviert ist und an Signal routet. Direkte Signal-Exec-Genehmigungen im selben Chat können
  den lokalen `/approve`-Fallback ohne explizite Genehmiger unterdrücken; die Signal-Reaktionsauflösung
  erfordert weiterhin explizite Signal-Genehmiger aus `channels.signal.allowFrom` oder `defaultTo`.
- Matrix-natives DM-/Channel-Routing und Reaktions-Shortcuts verarbeiten sowohl Exec- als auch Plugin-Genehmigungen;
  die Plugin-Autorisierung kommt weiterhin aus `channels.matrix.dm.allowFrom`
- Matrix-native Aufforderungen enthalten beim ersten Aufforderungsereignis benutzerdefinierten `com.openclaw.approval`-
  Ereignisinhalt, damit OpenClaw-fähige Matrix-Clients strukturierten Genehmigungszustand lesen können, während Standardclients
  den Klartext-`/approve`-Fallback behalten
- Der Anfragesteller muss kein Genehmiger sein
- Der ursprüngliche Chat kann direkt mit `/approve` genehmigen, wenn dieser Chat bereits Befehle und Antworten unterstützt
- Native Discord-Genehmigungsbuttons routen nach Art der Genehmigungs-ID: `plugin:`-IDs gehen
  direkt zu Plugin-Genehmigungen, alles andere geht zu Exec-Genehmigungen
- Native Telegram-Genehmigungsbuttons folgen demselben begrenzten Exec-zu-Plugin-Fallback wie `/approve`
- Wenn natives `target` die Zustellung in den Ursprungs-Chat aktiviert, enthalten Genehmigungsaufforderungen den Befehlstext
- Ausstehende Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab
- Wenn keine Operator-UI oder kein konfigurierter Genehmigungsclient die Anfrage annehmen kann, fällt die Aufforderung auf `askFallback` zurück

Sensible, nur für Besitzer bestimmte Gruppenbefehle wie `/diagnostics` und `/export-trajectory` verwenden privates
Besitzer-Routing für Genehmigungsaufforderungen und Endergebnisse. OpenClaw versucht zuerst eine private Route auf derselben
Oberfläche, auf der der Besitzer den Befehl ausgeführt hat. Wenn diese Oberfläche keine private Besitzerroute hat, fällt es
auf die erste verfügbare Besitzerroute aus `commands.ownerAllowFrom` zurück, sodass ein Discord-Gruppenbefehl
die Genehmigung und das Ergebnis weiterhin an die Telegram-DM des Besitzers senden kann, wenn Telegram als
primäre private Schnittstelle konfiguriert ist. Der Gruppenchat erhält nur eine kurze Bestätigung.

Telegram verwendet standardmäßig Genehmiger-DMs (`target: "dm"`). Sie können zu `channel` oder `both` wechseln, wenn
Genehmigungsaufforderungen auch im ursprünglichen Telegram-Chat/-Thema erscheinen sollen. Für Telegram-Forum-
Themen bewahrt OpenClaw das Thema für die Genehmigungsaufforderung und die Folgeantwort nach der Genehmigung.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS-IPC-Ablauf
__OC_I18N_900004__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token gespeichert in `exec-approvals.json`.
- Same-UID-Peer-Prüfung.
- Challenge/Response (Nonce + HMAC-Token + Anfrage-Hash) + kurze TTL.

## FAQ

### Wann würden `accountId` und `threadId` für ein Genehmigungsziel verwendet?

Verwenden Sie `accountId`, wenn der Channel mehrere konfigurierte Identitäten hat und die Genehmigungsaufforderung
über ein bestimmtes Konto gesendet werden muss. Verwenden Sie `threadId`, wenn das Ziel Themen oder
Threads unterstützt und die Aufforderung in diesem Thread bleiben soll statt im Chat auf oberster Ebene.

Ein konkreter Telegram-Fall ist eine Operations-Supergruppe mit Forum-Themen und zwei Telegram-Bot-
Konten. Der Wert `to` benennt die Supergruppe, `accountId` wählt das Bot-Konto aus und `threadId`
wählt das Forum-Thema aus:
__OC_I18N_900005__
Mit dieser Einrichtung werden weitergeleitete Exec-Genehmigungen vom Telegram-Konto `ops-bot` in Thema
`77` des Chats `-1001234567890` gepostet. Ein Ziel ohne `accountId` verwendet das Standardkonto des Channels, und
ein Ziel ohne `threadId` postet an das Ziel auf oberster Ebene.

### Wenn Genehmigungen an eine Session gesendet werden, kann sie dann jeder in dieser Session genehmigen?

Nein. Session-Zustellung steuert nur, wo die Aufforderung erscheint. Sie autorisiert nicht von sich aus jeden
Teilnehmer in diesem Chat zur Genehmigung.

Für generisches `/approve` im selben Chat muss der Absender bereits für Befehle in dieser
Channel-Session autorisiert sein. Wenn der Channel explizite Genehmiger freigibt, können diese Genehmiger
die `/approve`-Aktion autorisieren, auch wenn sie sonst in dieser Session nicht befehlsautorisiert sind.

Einige Channels sind strenger. Discord, Telegram, Matrix, native Slack-Genehmigungs-DMs und ähnliche
native Genehmigungsclients verwenden ihre aufgelösten Genehmigerlisten für die Genehmigungsautorisierung. Zum Beispiel
kann eine Telegram-Forum-Themen-Genehmigungsaufforderung für alle im Thema sichtbar sein, aber nur numerische
Telegram-Benutzer-IDs, die aus `channels.telegram.execApprovals.approvers` oder
`commands.ownerAllowFrom` aufgelöst wurden, können sie genehmigen oder ablehnen.

## Verwandt

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Kernrichtlinie und Genehmigungsablauf
- [Exec-Tool](/de/tools/exec)
- [Erhöhter Modus](/de/tools/elevated)
- [Skills](/de/tools/skills) — Skill-gestütztes Verhalten für automatische Erlaubnis
