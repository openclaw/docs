---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Routing oder Berechtigungen von Befehlen debuggen
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-25T13:58:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt.
Der nur auf dem Host verfügbare Bash-Chat-Befehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Es gibt zwei zusammenhängende Systeme:

- **Befehle**: eigenständige `/...`-Nachrichten.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
  - In normalen Chat-Nachrichten (nicht nur Direktiven) werden sie als „Inline-Hinweise“ behandelt und speichern keine Sitzungseinstellungen dauerhaft.
  - In Nachrichten, die nur aus Direktiven bestehen (die Nachricht enthält nur Direktiven), werden sie in der Sitzung dauerhaft gespeichert und antworten mit einer Bestätigung.
  - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige verwendete Allowlist; andernfalls stammt die Autorisierung aus Kanal-Allowlists/Pairing plus `commands.useAccessGroups`.
    Nicht autorisierte Absender sehen Direktiven als normalen Text behandelt.

Es gibt außerdem einige **Inline-Kurzbefehle** (nur für Absender auf der Allowlist/autorisierte Absender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Sie werden sofort ausgeführt, werden entfernt, bevor das Modell die Nachricht sieht, und der verbleibende Text läuft durch den normalen Ablauf weiter.

## Konfiguration

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (Standard `true`) aktiviert das Parsen von `/...` in Chat-Nachrichten.
  - Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle weiterhin, auch wenn Sie dies auf `false` setzen.
- `commands.native` (Standard `"auto"`) registriert native Befehle.
  - Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Anbieter ohne native Unterstützung.
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Anbieter zu überschreiben (bool oder `"auto"`).
  - `false` entfernt beim Start zuvor registrierte Befehle auf Discord/Telegram. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard `"auto"`) registriert **Skills** nativ, wenn unterstützt.
  - Auto: an für Discord/Telegram; aus für Slack (Slack erfordert das Erstellen eines Slash-Befehls pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Anbieter zu überschreiben (bool oder `"auto"`).
- `commands.bash` (Standard `false`) aktiviert `! <cmd>`, um Shell-Befehle auf dem Host auszuführen (`/bash <cmd>` ist ein Alias; erfordert Allowlists für `tools.elevated`).
- `commands.bashForegroundMs` (Standard `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` schickt sofort in den Hintergrund).
- `commands.config` (Standard `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard `false`) aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard `false`) aktiviert `/plugins` (Plugin-Erkennung/-Status sowie Steuerelemente für Installation + Aktivieren/Deaktivieren).
- `commands.debug` (Standard `false`) aktiviert `/debug` (nur Runtime-Überschreibungen).
- `commands.restart` (Standard `true`) aktiviert `/restart` sowie Tool-Aktionen zum Neustart des Gateways.
- `commands.ownerAllowFrom` (optional) setzt die explizite Owner-Allowlist für nur für Owner verfügbare Befehls-/Tool-Oberflächen. Dies ist getrennt von `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` pro Kanal (optional, Standard `false`) sorgt dafür, dass nur für Owner verfügbare Befehle auf dieser Oberfläche **Owner-Identität** erfordern. Wenn `true`, muss der Absender entweder mit einem aufgelösten Owner-Kandidaten übereinstimmen (zum Beispiel einem Eintrag in `commands.ownerAllowFrom` oder nativen Owner-Metadaten des Anbieters) oder internen Scope `operator.admin` auf einem internen Nachrichtenkanal besitzen. Ein Wildcard-Eintrag in `allowFrom` des Kanals oder eine leere/nicht auflösbare Liste von Owner-Kandidaten ist **nicht** ausreichend — nur für Owner verfügbare Befehle schlagen auf diesem Kanal standardmäßig fehl. Lassen Sie dies deaktiviert, wenn nur für Owner verfügbare Befehle nur durch `ownerAllowFrom` und die standardmäßigen Befehls-Allowlists geschützt werden sollen.
- `commands.ownerDisplay` steuert, wie Owner-IDs im System-Prompt erscheinen: `raw` oder `hash`.
- `commands.ownerDisplaySecret` setzt optional das HMAC-Secret, das verwendet wird, wenn `commands.ownerDisplay="hash"` gesetzt ist.
- `commands.allowFrom` (optional) setzt eine anbieterspezifische Allowlist für die Autorisierung von Befehlen. Wenn konfiguriert, ist dies die einzige Autorisierungsquelle für Befehle und Direktiven (Kanal-Allowlists/Pairing und `commands.useAccessGroups` werden ignoriert). Verwenden Sie `"*"` als globalen Standard; anbieterspezifische Schlüssel überschreiben ihn.
- `commands.useAccessGroups` (Standard `true`) erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Aktuelle Source of Truth:

- integrierte Kernbefehle stammen aus `src/auto-reply/commands-registry.shared.ts`
- generierte dock-Befehle stammen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle stammen aus `registerCommand()`-Aufrufen der Plugins
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurations-Flags, der Kanaloberfläche und installierten/aktivierten Plugins ab

### Integrierte Kernbefehle

Heute verfügbare integrierte Befehle:

- `/new [model]` startet eine neue Sitzung; `/reset` ist der Alias zum Zurücksetzen.
- `/reset soft [message]` behält das aktuelle Transkript bei, verwirft wiederverwendete Sitzungs-IDs von CLI-Backends und führt das Laden von Start-/System-Prompt direkt erneut aus.
- `/compact [instructions]` kompaktifiziert den Sitzungskontext. Siehe [/concepts/compaction](/de/concepts/compaction).
- `/stop` bricht die aktuelle Ausführung ab.
- `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten den Ablauf von Thread-Bindungen.
- `/think <level>` legt das Thinking-Level fest. Die Optionen stammen aus dem Anbieterprofil des aktiven Modells; gängige Levels sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Levels wie `xhigh`, `adaptive`, `max` oder binärem `on` nur dort, wo unterstützt. Aliasse: `/thinking`, `/t`.
- `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
- `/trace on|off` schaltet die Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
- `/fast [status|on|off]` zeigt den Schnellmodus an oder setzt ihn.
- `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
- `/elevated [on|off|ask|full]` schaltet den Elevated-Modus um. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt Exec-Standardeinstellungen an oder setzt sie.
- `/model [name|#|status]` zeigt das Modell an oder setzt es.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` listet Anbieter oder Modelle für einen Anbieter auf.
- `/queue <mode>` verwaltet das Queue-Verhalten (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) sowie Optionen wie `debounce:2s cap:25 drop:summarize`.
- `/help` zeigt die kurze Hilfsübersicht.
- `/commands` zeigt den generierten Befehlskatalog.
- `/tools [compact|verbose]` zeigt, was der aktuelle Agent gerade verwenden kann.
- `/status` zeigt den Ausführungs-/Runtime-Status, einschließlich der Labels `Execution`/`Runtime` sowie Anbieternutzung/Quota, falls verfügbar.
- `/crestodian <request>` führt den Crestodian-Helfer für Einrichtung und Reparatur aus einer Owner-DM aus.
- `/tasks` listet aktive/aktuelle Hintergrundaufgaben für die aktuelle Sitzung auf.
- `/context [list|detail|json]` erklärt, wie Kontext zusammengestellt wird.
- `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
- `/export-trajectory [path]` exportiert ein JSONL-[Trajectory-Bundle](/de/tools/trajectory) für die aktuelle Sitzung. Alias: `/trajectory`.
- `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
- `/skill <name> [input]` führt einen Skill anhand seines Namens aus.
- `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
- `/approve <id> <decision>` löst Genehmigungsabfragen für Exec auf.
- `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Siehe [/tools/btw](/de/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` verwaltet Sub-Agent-Ausführungen für die aktuelle Sitzung.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Runtime-Optionen.
- `/focus <target>` bindet den aktuellen Discord-Thread oder das aktuelle Telegram-Thema/die Konversation an ein Sitzungsziel.
- `/unfocus` entfernt die aktuelle Bindung.
- `/agents` listet threadgebundene Agents für die aktuelle Sitzung auf.
- `/kill <id|#|all>` bricht einen oder alle laufenden Sub-Agents ab.
- `/steer <id|#> <message>` sendet Steuerung an einen laufenden Sub-Agent. Alias: `/tell`.
- `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur für Owner. Erfordert `commands.config: true`.
- `/mcp show|get|set|unset` liest oder schreibt von OpenClaw verwaltete MCP-Server-Konfiguration unter `mcp.servers`. Nur für Owner. Erfordert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` prüft oder verändert den Plugin-Status. `/plugin` ist ein Alias. Schreibvorgänge nur für Owner. Erfordert `commands.plugins: true`.
- `/debug show|set|unset|reset` verwaltet nur für Runtime geltende Konfigurationsüberschreibungen. Nur für Owner. Erfordert `commands.debug: true`.
- `/usage off|tokens|full|cost` steuert die Usage-Fußzeile pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.
- `/tts on|off|status|provider|limit|summary|audio|help` steuert TTS. Siehe [/tools/tts](/de/tools/tts).
- `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- `/activation mention|always` legt den Gruppenaktivierungsmodus fest.
- `/send on|off|inherit` legt die Send-Richtlinie fest. Nur für Owner.
- `/bash <command>` führt einen Shell-Befehl auf dem Host aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` sowie Allowlists für `tools.elevated`.
- `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
- `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

### Generierte dock-Befehle

Dock-Befehle werden aus Kanal-Plugins mit Unterstützung für native Befehle generiert. Aktueller gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

### Gebündelte Plugin-Befehle

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory-Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet den Pairing-/Einrichtungsablauf für Geräte. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend risikoreiche Phone-Node-Befehle.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Sprachkonfiguration für Talk. Auf Discord lautet der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Voreinstellungen. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` prüft und steuert das gebündelte Codex-App-Server-Harness. Siehe [Codex Harness](/de/plugins/codex-harness).
- Nur QQBot-Befehle:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-Befehle

Von Benutzern aufrufbare Skills werden ebenfalls als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können auch als direkte Befehle wie `/prose` erscheinen, wenn der Skill/das Plugin sie registriert.
- Die Registrierung nativer Skill-Befehle wird durch `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modell-Alias, `provider/model` oder einen Anbieternamen (unscharfe Übereinstimmung); wenn es keine Übereinstimmung gibt, wird der Text als Nachrichteninhalt behandelt.
- Für die vollständige Nutzungsaufschlüsselung pro Anbieter verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt `configWrites` des Kanals.
- In Kanälen mit mehreren Accounts berücksichtigen konfigurationsbezogenes `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` auch `configWrites` des Ziel-Accounts.
- `/usage` steuert die Usage-Fußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
- `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und kann zu einem Neustart auffordern.
- Nur Discord nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (nicht als Text verfügbar). `join` erfordert eine Guild und einen ausgewählten Sprach-/Stage-Kanal. Erfordert `channels.discord.voice` und native Befehle.
- Discord-Befehle für Thread-Bindung (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindungen aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- Referenz zu ACP-Befehlen und Runtime-Verhalten: [ACP-Agents](/de/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Transparenz gedacht; lassen Sie es im normalen Gebrauch **aus**.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen an und lässt normale ausführliche Tool-Ausgaben aus.
- `/fast on|off` speichert eine Sitzungsüberschreibung dauerhaft. Verwenden Sie in der Sitzungsoberfläche die Option `inherit`, um diese zu löschen und auf die Standardwerte der Konfiguration zurückzufallen.
- `/fast` ist anbieterspezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich über OAuth authentifizierter Anfragen an `api.anthropic.com`, es `service_tier=auto` oder `standard_only` zuordnen. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
- Zusammenfassungen von Tool-Fehlern werden weiterhin angezeigt, wenn relevant, aber detaillierter Fehlertext wird nur aufgenommen, wenn `/verbose` auf `on` oder `full` steht.
- `/reasoning`, `/verbose` und `/trace` sind in Gruppeneinstellungen riskant: Sie können internes Reasoning, Tool-Ausgaben oder Plugin-Diagnosen offenlegen, die Sie nicht beabsichtigt offenzulegen. Lassen Sie sie vorzugsweise deaktiviert, insbesondere in Gruppenchats.
- `/model` speichert das neue Sitzungsmodell sofort dauerhaft.
- Wenn der Agent untätig ist, wird es direkt im nächsten Lauf verwendet.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen haben, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder dem nächsten Benutzer-Turn in der Warteschlange bleiben.
- In der lokalen TUI kehrt `/crestodian [request]` von der normalen Agent-TUI zu Crestodian zurück. Dies ist getrennt vom Rescue-Modus in Nachrichtenkanälen und gewährt keine entfernte Konfigurationsautorität.
- **Schneller Pfad:** Nur-Befehl-Nachrichten von Absendern auf der Allowlist werden sofort verarbeitet (umgehen Queue + Modell).
- **Erwähnungs-Gating in Gruppen:** Nur-Befehl-Nachrichten von Absendern auf der Allowlist umgehen Erwähnungsanforderungen.
- **Inline-Kurzbefehle (nur für Absender auf der Allowlist):** Bestimmte Befehle funktionieren auch, wenn sie in eine normale Nachricht eingebettet sind, und werden entfernt, bevor das Modell den verbleibenden Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft durch den normalen Ablauf weiter.
- Aktuell: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nur-Befehl-Nachrichten werden stillschweigend ignoriert, und Inline-`/...`-Token werden als normaler Text behandelt.
- **Skill-Befehle:** Vom Benutzer aufrufbare Skills werden als Slash-Befehle bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (maximal 32 Zeichen); bei Kollisionen werden numerische Suffixe angehängt (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill anhand seines Namens aus (nützlich, wenn native Befehlsgrenzen Befehle pro Skill verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu leiten (deterministisch, ohne Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
- **Argumente nativer Befehle:** Discord verwendet Autocomplete für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen. Dynamische Auswahlmöglichkeiten werden anhand des Modells der Zielsitzung aufgelöst, sodass modellspezifische Optionen wie `/think`-Levels der `/model`-Überschreibung dieser Sitzung folgen.

## `/tools`

`/tools` beantwortet eine Runtime-Frage, keine Konfigurationsfrage: **was dieser Agent gerade in
dieser Konversation verwenden kann**.

- Standardmäßig ist `/tools` kompakt und für schnelles Erfassen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, stellen denselben Moduswechsel als `compact|verbose` bereit.
- Ergebnisse gelten pro Sitzung, daher können Änderungen an Agent, Kanal, Thread, Absenderautorisierung oder Modell
  die Ausgabe verändern.
- `/tools` umfasst Tools, die zur Runtime tatsächlich erreichbar sind, einschließlich Kern-Tools, verbundener
  Plugin-Tools und kanaleigener Tools.

Für die Bearbeitung von Profilen und Überschreibungen verwenden Sie das Tools-Panel der Control UI oder Konfigurations-/Katalogoberflächen, anstatt `/tools` als statischen Katalog zu behandeln.

## Usage-Oberflächen (was wo angezeigt wird)

- **Anbieternutzung/Quota** (Beispiel: „Claude 80% left“) wird in `/status` für den aktuellen Modellanbieter angezeigt, wenn Usage-Tracking aktiviert ist. OpenClaw normalisiert Anbieterfenster auf `% left`; bei MiniMax werden Felder mit verbleibendem Prozentwert vor der Anzeige invertiert, und Antworten von `model_remains` bevorzugen den Chat-Modell-Eintrag plus ein modellmarkiertes Plan-Label.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Usage-Eintrag im Transkript zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und der Transkript-Fallback kann auch das aktive Runtime-Modell-Label plus eine größere, promptorientierte Gesamtsumme wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Ausführung vs. Runtime:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` dafür, wer die Sitzung tatsächlich ausführt: `OpenClaw Pi Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Tokens/Kosten pro Antwort** werden durch `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- `/model status` bezieht sich auf **Modelle/Auth/Endpunkte**, nicht auf Usage.

## Modellauswahl (`/model`)

`/model` ist als Direktive implementiert.

Beispiele:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Hinweise:

- `/model` und `/model list` zeigen eine kompakte, nummerierte Auswahl (Modellfamilie + verfügbare Anbieter).
- Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Dropdowns für Anbieter und Modell plus einem Schritt zum Absenden.
- `/model <#>` wählt aus dieser Auswahl aus (und bevorzugt nach Möglichkeit den aktuellen Anbieter).
- `/model status` zeigt die Detailansicht, einschließlich des konfigurierten Anbieter-Endpunkts (`baseUrl`) und des API-Modus (`api`), sofern verfügbar.

## Debug-Überschreibungen

Mit `/debug` können Sie **nur für Runtime geltende** Konfigurationsüberschreibungen setzen (im Speicher, nicht auf Festplatte). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.debug: true`.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Hinweise:

- Überschreibungen gelten sofort für neue Konfigurationszugriffe, schreiben aber **nicht** in `openclaw.json`.
- Verwenden Sie `/debug reset`, um alle Überschreibungen zu löschen und zur Konfiguration auf der Festplatte zurückzukehren.

## Plugin-Trace-Ausgabe

Mit `/trace` können Sie **sitzungsbezogene Trace-/Debug-Zeilen von Plugins** umschalten, ohne den vollständigen ausführlichen Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Hinweise:

- `/trace` ohne Argument zeigt den aktuellen Trace-Status der Sitzung.
- `/trace on` aktiviert Plugin-Trace-Zeilen für die aktuelle Sitzung.
- `/trace off` deaktiviert sie wieder.
- Plugin-Trace-Zeilen können in `/status` und als diagnostische Nachfolgenachricht nach der normalen Assistentenantwort erscheinen.
- `/trace` ersetzt `/debug` nicht; `/debug` verwaltet weiterhin nur für Runtime geltende Konfigurationsüberschreibungen.
- `/trace` ersetzt `/verbose` nicht; normale ausführliche Tool-/Status-Ausgabe gehört weiterhin zu `/verbose`.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf der Festplatte (`openclaw.json`). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.config: true`.

Beispiele:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Hinweise:

- Die Konfiguration wird vor dem Schreiben validiert; ungültige Änderungen werden abgelehnt.
- Aktualisierungen über `/config` bleiben über Neustarts hinweg erhalten.

## MCP-Aktualisierungen

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen.
- Runtime-Adapter entscheiden, welche Transports tatsächlich ausführbar sind.

## Plugin-Aktualisierungen

Mit `/plugins` können Operatoren erkannte Plugins prüfen und deren Aktivierung in der Konfiguration umschalten. Für schreibgeschützte Abläufe kann `/plugin` als Alias verwendet werden. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung gegen den aktuellen Arbeitsbereich plus Konfiguration auf der Festplatte.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden nicht installiert oder deinstalliert.
- Starten Sie nach Änderungen an Aktivieren/Deaktivieren das Gateway neu, damit sie angewendet werden.

## Hinweise zu Oberflächen

- **Textbefehle** werden in der normalen Chat-Sitzung ausgeführt (DMs teilen `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix über `channels.slack.slashCommand.sessionPrefix` konfigurierbar)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
- **`/stop`** zielt auf die aktive Chat-Sitzung, damit die aktuelle Ausführung abgebrochen werden kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie pro integriertem Befehl einen Slack-Slash-Befehl erstellen (mit denselben Namen wie `/help`). Argumentmenüs für Slack werden als temporäre Block-Kit-Buttons zugestellt.
  - Ausnahme für native Slack-Befehle: registrieren Sie `/agentstatus` (nicht `/status`), da Slack `/status` reserviert. Text-`/status` funktioniert in Slack-Nachrichten weiterhin.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Im Unterschied zum normalen Chat:

- verwendet es die aktuelle Sitzung als Hintergrundkontext,
- wird es als separater **einmaliger** Aufruf ohne Tools ausgeführt,
- ändert es den zukünftigen Sitzungskontext nicht,
- wird es nicht in den Transkriptverlauf geschrieben,
- wird es als Live-Nebenergebnis statt als normale Assistentennachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klärung möchten, während die Hauptaufgabe weiterläuft.

Beispiel:

```text
/btw what are we doing right now?
```

Siehe [BTW-Nebenfragen](/de/tools/btw) für das vollständige Verhalten und Details zur Client-UX.

## Verwandt

- [Skills](/de/tools/skills)
- [Skills config](/de/tools/skills-config)
- [Skills erstellen](/de/tools/creating-skills)
