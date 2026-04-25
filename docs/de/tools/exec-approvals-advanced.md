---
read_when:
    - Konfigurieren sicherer Binaries oder benutzerdefinierter Profile für sichere Binaries
    - Weiterleiten von Genehmigungen an Slack/Discord/Telegram oder andere Chat-Kanäle
    - Implementieren eines nativen Approval-Clients für einen Kanal
summary: 'Erweiterte Exec-Genehmigungen: sichere Binaries, Interpreter-Bindung, Approval-Weiterleitung, native Zustellung'
title: Exec-Genehmigungen — erweitert
x-i18n:
    generated_at: "2026-04-25T13:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Erweiterte Themen zu Exec-Genehmigungen: der Schnellpfad `safeBins`, Interpreter-/Runtime-
Bindung und Weiterleitung von Genehmigungen an Chat-Kanäle (einschließlich nativer Zustellung).
Für die Kernrichtlinie und den Genehmigungsablauf siehe [Exec approvals](/de/tools/exec-approvals).

## Sichere Binaries (`safeBins`) (nur stdin)

`tools.exec.safeBins` definiert eine kleine Liste **nur stdin-basierter** Binaries (zum
Beispiel `cut`), die im Allowlist-Modus **ohne** explizite Allowlist-Einträge laufen können. Sichere Binaries lehnen positionale Dateiartefakte und pfadähnliche Tokens ab, sodass sie
nur auf dem eingehenden Stream arbeiten können. Behandeln Sie dies als schmalen Schnellpfad für
Stream-Filter, nicht als allgemeine Vertrauensliste.

<Warning>
Fügen Sie **keine** Interpreter- oder Runtime-Binaries (zum Beispiel `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu. Wenn ein Befehl Code auswerten,
Unterbefehle ausführen oder von Natur aus Dateien lesen kann, bevorzugen Sie explizite Allowlist-Einträge
und lassen Sie Genehmigungs-Prompts aktiviert. Benutzerdefinierte sichere Binaries müssen ein explizites
Profil in `tools.exec.safeBinProfiles.<bin>` definieren.
</Warning>

Standardmäßige sichere Binaries:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` stehen nicht in der Standardliste. Wenn Sie sich bewusst dafür entscheiden, behalten Sie explizite
Allowlist-Einträge für ihre Nicht-stdin-Workflows bei. Für `grep` im Safe-Bin-Modus
geben Sie das Muster mit `-e`/`--regexp` an; die positionale Musterform wird abgelehnt,
damit Dateiparameter nicht als mehrdeutige positionale Argumente eingeschleust werden können.

### Validierung von Argv und abgelehnte Flags

Die Validierung ist nur anhand der Form von argv deterministisch (keine Prüfungen auf Existenz im Host-Dateisystem),
was Oracle-Verhalten über die Dateiexistenz durch Unterschiede bei Allow/Deny verhindert. Dateiorientierte Optionen sind für standardmäßige sichere Binaries abgelehnt; lange
Optionen werden fail-closed validiert (unbekannte Flags und mehrdeutige Abkürzungen werden
abgelehnt).

Abgelehnte Flags nach Safe-Bin-Profil:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Sichere Binaries zwingen Argv-Tokens zur Ausführungszeit außerdem dazu, als **wörtlicher Text** behandelt zu werden
(kein Globbing und keine Expansion von `$VARS`) für stdin-only-Segmente, sodass Muster
wie `*` oder `$HOME/...` nicht verwendet werden können, um Dateizugriffe einzuschleusen.

### Vertrauenswürdige Binary-Verzeichnisse

Sichere Binaries müssen aus vertrauenswürdigen Binary-Verzeichnissen aufgelöst werden (Systemstandards plus
optionales `tools.exec.safeBinTrustedDirs`). Einträge in `PATH` werden niemals automatisch vertraut.
Die standardmäßigen vertrauenswürdigen Verzeichnisse sind absichtlich minimal: `/bin`, `/usr/bin`. Wenn
Ihr ausführbares sicheres Binary in Pfaden von Paketmanagern/Benutzern liegt (zum Beispiel
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie sie
explizit zu `tools.exec.safeBinTrustedDirs` hinzu.

### Shell-Chaining, Wrapper und Multiplexer

Shell-Chaining (`&&`, `||`, `;`) ist erlaubt, wenn jedes Segment der obersten Ebene
die Allowlist erfüllt (einschließlich sicherer Binaries oder automatischer Skill-Allow). Redirections
bleiben im Allowlist-Modus weiterhin nicht unterstützt. Command Substitution (`$()` / Backticks) wird
beim Parsen der Allowlist abgelehnt, auch innerhalb doppelter Anführungszeichen; verwenden Sie
einfache Anführungszeichen, wenn Sie literalen Text `$()` benötigen.

Bei Genehmigungen in der macOS-Begleit-App wird roher Shell-Text, der Shell-Steuer- oder
Erweiterungssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), als
Allowlist-Miss behandelt, sofern nicht das Shell-Binary selbst auf der Allowlist steht.

Bei Shell-Wrappern (`bash|sh|zsh ... -c/-lc`) werden umgebungsbezogene Overrides pro Anfrage auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Bei Entscheidungen `allow-always` im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) den Pfad des inneren ausführbaren Programms statt des
Wrapper-Pfads. Shell-Multiplexer (`busybox`, `toybox`) werden für Shell-Applets (`sh`, `ash` usw.) auf dieselbe Weise entpackt. Wenn ein Wrapper oder Multiplexer nicht sicher entpackt werden kann, wird automatisch kein Allowlist-Eintrag gespeichert.

Wenn Sie Interpreter wie `python3` oder `node` auf die Allowlist setzen, bevorzugen Sie
`tools.exec.strictInlineEval=true`, damit Inline-Eval weiterhin eine explizite
Genehmigung erfordert. Im Strict Mode kann `allow-always` weiterhin harmlose
Interpreter-/Skript-Aufrufe speichern, aber Träger für Inline-Eval werden nicht
automatisch gespeichert.

### Sichere Binaries versus Allowlist

| Thema            | `tools.exec.safeBins`                                 | Allowlist (`exec-approvals.json`)                                                |
| ---------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Ziel             | Schmale stdin-Filter automatisch erlauben             | Bestimmten ausführbaren Programmen explizit vertrauen                            |
| Match-Typ        | Name des ausführbaren Programms + Argv-Richtlinie des sicheren Binaries | Glob für aufgelösten Pfad des ausführbaren Programms oder einfacher Glob für Befehlsnamen bei über PATH aufgerufenen Befehlen |
| Argumentbereich  | Durch Safe-Bin-Profil und Regeln für literale Tokens eingeschränkt | Nur Pfad-Match; für Argumente sind Sie ansonsten selbst verantwortlich            |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                          | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs                       |
| Beste Verwendung | Texttransformationen mit geringem Risiko in Pipelines | Jedes Tool mit breiterem Verhalten oder Nebenwirkungen                            |

Ort der Konfiguration:

- `safeBins` kommt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` kommt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` kommt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Profil-Schlüssel pro Agent überschreiben globale Schlüssel.
- Allowlist-Einträge liegen im hostlokalen `~/.openclaw/exec-approvals.json` unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Runtime-Binaries in `safeBins` ohne explizite Profile erscheinen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte Einträge `safeBinProfiles.<bin>` als `{}` erzeugen (anschließend prüfen und verschärfen). Interpreter-/Runtime-Binaries werden nicht automatisch erzeugt.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900000__
Wenn Sie `jq` explizit in `safeBins` aufnehmen, lehnt OpenClaw das Built-in `env` im Safe-Bin-
Modus weiterhin ab, sodass `jq -n env` die Prozessumgebung des Hosts nicht ohne expliziten Allowlist-Pfad
oder Genehmigungs-Prompt ausgeben kann.

## Interpreter-/Runtime-Befehle

Genehmigungsunterstützte Läufe von Interpretern/Runtime sind absichtlich konservativ:

- Exakter Kontext von argv/cwd/env ist immer gebunden.
- Direkte Shell-Skript- und direkte Runtime-Dateiformen werden best effort an genau
  einen konkreten lokalen Datei-Snapshot gebunden.
- Häufige Wrapper-Formen von Paketmanagern, die sich dennoch zu genau einer direkten lokalen Datei auflösen (zum Beispiel
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor der Bindung entpackt.
- Wenn OpenClaw für einen Interpreter-/Runtime-Befehl nicht genau eine konkrete lokale Datei identifizieren kann
  (zum Beispiel Paketskripte, Eval-Formen, Runtime-spezifische Loader-Ketten oder mehrdeutige Mehrdatei-
  Formen), wird genehmigungsunterstützte Ausführung abgelehnt, statt semantische Abdeckung zu behaupten,
  die sie nicht hat.
- Für diese Workflows bevorzugen Sie Sandboxing, eine separate Host-Grenze oder einen explizit vertrauenswürdigen
  Allowlist-/Full-Workflow, bei dem der Operator die breitere Runtime-Semantik akzeptiert.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort mit einer Approval-ID zurück. Verwenden Sie diese ID, um
spätere Systemereignisse (`Exec finished` / `Exec denied`) zu korrelieren. Wenn vor dem
Timeout keine Entscheidung eintrifft, wird die Anfrage als Approval-Timeout behandelt und als Grund für eine Ablehnung angezeigt.

### Verhalten bei der Zustellung von Follow-ups

Nachdem eine genehmigte asynchrone Exec-Ausführung abgeschlossen ist, sendet OpenClaw einen Follow-up-`agent`-Turn an dieselbe Sitzung.

- Wenn ein gültiges externes Zustellungsziel existiert (zustellbarer Kanal plus Ziel `to`), verwendet die Follow-up-Zustellung diesen Kanal.
- In WebChat-only- oder internen Sitzungsabläufen ohne externes Ziel bleibt die Follow-up-Zustellung nur sitzungsintern (`deliver: false`).
- Wenn ein Aufrufer explizit strikte externe Zustellung ohne auflösbaren externen Kanal anfordert, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung statt eines Fehlers auf nur sitzungsintern zurückgestuft.

## Weiterleitung von Genehmigungen an Chat-Kanäle

Sie können Prompts für Exec-Genehmigungen an jeden Chat-Kanal (einschließlich Plugin-Kanälen) weiterleiten und
sie mit `/approve` genehmigen. Dabei wird die normale Pipeline für Outbound-Delivery verwendet.

Konfiguration:
__OC_I18N_900001__
Antwort im Chat:
__OC_I18N_900002__
Der Befehl `/approve` verarbeitet sowohl Exec-Genehmigungen als auch Plugin-Genehmigungen. Wenn die ID nicht zu einer ausstehenden Exec-Genehmigung passt, prüft er automatisch stattdessen Plugin-Genehmigungen.

### Weiterleitung von Plugin-Genehmigungen

Die Weiterleitung von Plugin-Genehmigungen verwendet dieselbe Pipeline für die Zustellung wie Exec-Genehmigungen, hat aber eine eigene
unabhängige Konfiguration unter `approvals.plugin`. Das Aktivieren oder Deaktivieren des einen hat keinen Einfluss auf das andere.
__OC_I18N_900003__
Die Form der Konfiguration ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` und `targets` funktionieren auf dieselbe Weise.

Kanäle, die gemeinsame interaktive Antworten unterstützen, rendern dieselben Approval-Buttons für Exec- und
Plugin-Genehmigungen. Kanäle ohne gemeinsame interaktive UI fallen auf Klartext mit
Anweisungen für `/approve` zurück.

### Genehmigungen im selben Chat auf jedem Kanal

Wenn eine Anfrage für eine Exec- oder Plugin-Genehmigung von einer zustellbaren Chat-Oberfläche ausgeht, kann derselbe Chat
sie jetzt standardmäßig mit `/approve` genehmigen. Dies gilt für Kanäle wie Slack, Matrix und
Microsoft Teams zusätzlich zu den bestehenden Abläufen in Web UI und Terminal UI.

Dieser gemeinsame textbasierte Befehlsweg verwendet das normale Auth-Modell des Kanals für diese Unterhaltung. Wenn der
ursprüngliche Chat bereits Befehle senden und Antworten empfangen kann, benötigen Genehmigungsanfragen keinen
separaten nativen Delivery-Adapter mehr, nur um ausstehend zu bleiben.

Discord und Telegram unterstützen ebenfalls `/approve` im selben Chat, aber diese Kanäle verwenden weiterhin ihre
aufgelöste Liste von Genehmigern für die Autorisierung, auch wenn native Zustellung von Genehmigungen deaktiviert ist.

Für Telegram und andere native Approval-Clients, die das Gateway direkt aufrufen,
ist dieser Fallback absichtlich auf Fehler vom Typ „Approval nicht gefunden“ begrenzt. Ein echter
Exec-Ablehnungs-/Fehlerfall versucht nicht stillschweigend ein Retry als Plugin-Genehmigung.

### Native Zustellung von Genehmigungen

Einige Kanäle können auch als native Approval-Clients fungieren. Native Clients fügen Genehmiger-DMs, Fanout in den ursprünglichen Chat und kanalspezifische interaktive Approval-UX zusätzlich zum gemeinsamen Ablauf `/approve` im selben Chat hinzu.

Wenn native Approval-Cards/-Buttons verfügbar sind, ist diese native UI der primäre
agentenseitige Pfad. Der Agent sollte dann nicht zusätzlich einen doppelten Klartext-
Befehl `/approve` im Chat ausgeben, es sei denn, das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzig verbleibende Pfad ist.

Generisches Modell:

- Die Exec-Richtlinie des Hosts entscheidet weiterhin, ob eine Exec-Genehmigung erforderlich ist
- `approvals.exec` steuert das Weiterleiten von Genehmigungs-Prompts an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob dieser Kanal als nativer Approval-Client fungiert

Native Approval-Clients aktivieren automatisch DM-first-Zustellung, wenn all dies zutrifft:

- der Kanal unterstützt native Zustellung von Genehmigungen
- Genehmiger können aus expliziten `execApprovals.approvers` oder den
  dokumentierten Fallback-Quellen dieses Kanals aufgelöst werden
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`

Setzen Sie `enabled: false`, um einen nativen Approval-Client explizit zu deaktivieren. Setzen Sie `enabled: true`, um
ihn zu erzwingen, wenn Genehmiger aufgelöst werden. Öffentliche Zustellung an den ursprünglichen Chat bleibt explizit über
`channels.<channel>.execApprovals.target`.

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Diese nativen Approval-Clients fügen DM-Routing und optionales Fanout in Kanäle zusätzlich zum gemeinsamen
Ablauf `/approve` im selben Chat und zu gemeinsamen Approval-Buttons hinzu.

Gemeinsames Verhalten:

- Slack, Matrix, Microsoft Teams und ähnliche zustellbare Chats verwenden das normale Auth-Modell des Kanals
  für `/approve` im selben Chat
- wenn ein nativer Approval-Client automatisch aktiviert wird, ist das Standardziel für native Zustellung der DM des Genehmigers
- für Discord und Telegram können nur aufgelöste Genehmiger genehmigen oder ablehnen
- Discord-Genehmiger können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden
- Telegram-Genehmiger können explizit sein (`execApprovals.approvers`) oder aus bestehender Eigentümerkonfiguration abgeleitet werden (`allowFrom`, plus `defaultTo` für Direktnachrichten, sofern unterstützt)
- Slack-Genehmiger können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden
- Native Slack-Buttons bewahren die Art der Approval-ID, sodass `plugin:`-IDs Plugin-Genehmigungen
  ohne eine zweite Slack-lokale Fallback-Schicht auflösen können
- Native DM-/Kanal-Routing und Reaction-Shortcuts in Matrix verarbeiten sowohl Exec- als auch Plugin-Genehmigungen;
  die Autorisierung für Plugins stammt weiterhin aus `channels.matrix.dm.allowFrom`
- der Anfragesteller muss kein Genehmiger sein
- der ursprüngliche Chat kann direkt mit `/approve` genehmigen, wenn dieser Chat bereits Befehle und Antworten unterstützt
- native Discord-Approval-Buttons routen nach Art der Approval-ID: `plugin:`-IDs gehen
  direkt zu Plugin-Genehmigungen, alles andere zu Exec-Genehmigungen
- native Telegram-Approval-Buttons folgen demselben begrenzten Exec-zu-Plugin-Fallback wie `/approve`
- wenn `target` bei nativer Zustellung die Zustellung an den ursprünglichen Chat aktiviert, enthalten Approval-Prompts den Befehlstext
- ausstehende Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab
- wenn keine Operator-UI oder kein konfigurierter Approval-Client die Anfrage annehmen kann, fällt der Prompt auf `askFallback` zurück

Telegram verwendet standardmäßig DMs an Genehmiger (`target: "dm"`). Sie können auf `channel` oder `both` umschalten, wenn
Sie möchten, dass Approval-Prompts auch im ursprünglichen Telegram-Chat/-Topic erscheinen. Bei Telegram-Forum-
Topics behält OpenClaw das Topic für den Approval-Prompt und das Follow-up nach der Genehmigung bei.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS-IPC-Ablauf
__OC_I18N_900004__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token in `exec-approvals.json` gespeichert.
- Peer-Prüfung mit derselben UID.
- Challenge/Response (Nonce + HMAC-Token + Request-Hash) + kurze TTL.

## Verwandt

- [Exec approvals](/de/tools/exec-approvals) — Kernrichtlinie und Ablauf für Genehmigungen
- [Exec tool](/de/tools/exec)
- [Elevated mode](/de/tools/elevated)
- [Skills](/de/tools/skills) — auto-allow-Verhalten auf Basis von Skills
