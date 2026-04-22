---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Befehlsrouting oder Berechtigungen debuggen
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-22T04:28:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash-Befehle

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt.
Der nur für den Host verfügbare Bash-Chat-Befehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Es gibt zwei verwandte Systeme:

- **Befehle**: eigenständige `/...`-Nachrichten.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
  - In normalen Chat-Nachrichten (nicht nur-Direktiven) werden sie als „Inline-Hinweise“ behandelt und persistieren keine Sitzungseinstellungen.
  - In Nur-Direktiven-Nachrichten (die Nachricht enthält nur Direktiven) persistieren sie in der Sitzung und antworten mit einer Bestätigung.
  - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige
    Allowlist, die verwendet wird; andernfalls kommt die Autorisierung aus Channel-Allowlists/Pairing plus `commands.useAccessGroups`.
    Nicht autorisierte Absender sehen Direktiven als Klartext behandelt.

Es gibt außerdem einige **Inline-Kurzbefehle** (nur für allowlistete/autorisierte Absender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Sie werden sofort ausgeführt, werden entfernt, bevor das Modell die Nachricht sieht, und der restliche Text läuft normal weiter.

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
  - Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle weiterhin, selbst wenn Sie dies auf `false` setzen.
- `commands.native` (Standard `"auto"`) registriert native Befehle.
  - Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Provider ohne native Unterstützung.
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Provider zu überschreiben (boolesch oder `"auto"`).
  - `false` löscht beim Start zuvor registrierte Befehle auf Discord/Telegram. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard `"auto"`) registriert **Skills** nativ, wenn unterstützt.
  - Auto: an für Discord/Telegram; aus für Slack (Slack erfordert einen Slash-Befehl pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Provider zu überschreiben (boolesch oder `"auto"`).
- `commands.bash` (Standard `false`) aktiviert `! <cmd>`, um Shell-Befehle auf dem Host auszuführen (`/bash <cmd>` ist ein Alias; erfordert Allowlists für `tools.elevated`).
- `commands.bashForegroundMs` (Standard `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` verschiebt sofort in den Hintergrund).
- `commands.config` (Standard `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard `false`) aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard `false`) aktiviert `/plugins` (Plugin-Discovery/Status plus Installations- und Aktivierungs-/Deaktivierungssteuerung).
- `commands.debug` (Standard `false`) aktiviert `/debug` (nur-Laufzeit-Überschreibungen).
- `commands.restart` (Standard `true`) aktiviert `/restart` sowie Tool-Aktionen zum Gateway-Neustart.
- `commands.ownerAllowFrom` (optional) setzt die explizite Owner-Allowlist für nur dem Owner vorbehaltene Befehls-/Tool-Oberflächen. Dies ist getrennt von `commands.allowFrom`.
- Pro Kanal macht `channels.<channel>.commands.enforceOwnerForCommands` (optional, Standard `false`) owner-only-Befehle davon abhängig, dass **Owner-Identität** auf dieser Oberfläche vorhanden ist. Wenn `true`, muss der Absender entweder mit einem aufgelösten Owner-Kandidaten übereinstimmen (zum Beispiel einem Eintrag in `commands.ownerAllowFrom` oder provider-nativen Owner-Metadaten) oder internen Scope `operator.admin` auf einem internen Nachrichtenkanal besitzen. Ein Wildcard-Eintrag in `allowFrom` des Kanals oder eine leere/nicht aufgelöste Owner-Kandidatenliste ist **nicht** ausreichend — owner-only-Befehle schlagen auf diesem Kanal fail-closed fehl. Lassen Sie dies aus, wenn Sie möchten, dass owner-only-Befehle nur durch `ownerAllowFrom` und die Standard-Allowlists für Befehle begrenzt werden.
- `commands.ownerDisplay` steuert, wie Owner-IDs im System-Prompt erscheinen: `raw` oder `hash`.
- `commands.ownerDisplaySecret` setzt optional das HMAC-Secret, das verwendet wird, wenn `commands.ownerDisplay="hash"` gesetzt ist.
- `commands.allowFrom` (optional) setzt eine Allowlist pro Provider für die Befehlsautorisierung. Wenn konfiguriert, ist sie die
  einzige Autorisierungsquelle für Befehle und Direktiven (Channel-Allowlists/Pairing und `commands.useAccessGroups`
  werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; providerspezifische Schlüssel überschreiben ihn.
- `commands.useAccessGroups` (Standard `true`) erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Aktuelle Quelle der Wahrheit:

- eingebaute Core-Befehle kommen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle kommen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle kommen aus `registerCommand()`-Aufrufen von Plugins
- tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurationsflags, der Channel-Oberfläche und installierten/aktivierten Plugins ab

### Eingebaute Core-Befehle

Heute verfügbare eingebaute Befehle:

- `/new [model]` startet eine neue Sitzung; `/reset` ist der Alias zum Zurücksetzen.
- `/reset soft [message]` behält das aktuelle Transcript, verwirft wiederverwendete Sitzungs-IDs des CLI-Backends und führt Laden von Start/System-Prompt direkt erneut aus.
- `/compact [instructions]` komprimiert den Sitzungskontext. Siehe [/concepts/compaction](/de/concepts/compaction).
- `/stop` bricht den aktuellen Lauf ab.
- `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten das Ablaufen von Thread-Bindings.
- `/think <level>` setzt die Thinking-Stufe. Die Optionen kommen aus dem Provider-Profil des aktiven Modells; häufige Stufen sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Stufen wie `xhigh`, `adaptive`, `max` oder binärem `on` nur dort, wo unterstützt. Aliasse: `/thinking`, `/t`.
- `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
- `/trace on|off` schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
- `/fast [status|on|off]` zeigt den Fast-Modus an oder setzt ihn.
- `/reasoning [on|off|stream]` schaltet Sichtbarkeit von Reasoning um. Alias: `/reason`.
- `/elevated [on|off|ask|full]` schaltet Elevated-Modus um. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt Exec-Standards an oder setzt sie.
- `/model [name|#|status]` zeigt das Modell an oder setzt es.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` listet Provider oder Modelle für einen Provider auf.
- `/queue <mode>` verwaltet Queue-Verhalten (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus Optionen wie `debounce:2s cap:25 drop:summarize`.
- `/help` zeigt die kurze Hilfszusammenfassung.
- `/commands` zeigt den generierten Befehlskatalog.
- `/tools [compact|verbose]` zeigt, was der aktuelle Agent gerade verwenden kann.
- `/status` zeigt den Laufzeitstatus an, einschließlich Provider-Nutzung/Quote, wenn verfügbar.
- `/tasks` listet aktive/aktuelle Hintergrundaufgaben für die aktuelle Sitzung auf.
- `/context [list|detail|json]` erklärt, wie Kontext zusammengestellt wird.
- `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
- `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
- `/skill <name> [input]` führt einen Skill anhand des Namens aus.
- `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
- `/approve <id> <decision>` löst Aufforderungen zur Exec-Genehmigung auf.
- `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Siehe [/tools/btw](/de/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` verwaltet Sub-Agent-Läufe für die aktuelle Sitzung.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
- `/focus <target>` bindet den aktuellen Discord-Thread oder das aktuelle Telegram-Topic/die Unterhaltung an ein Sitzungsziel.
- `/unfocus` entfernt das aktuelle Binding.
- `/agents` listet an Threads gebundene Agenten für die aktuelle Sitzung auf.
- `/kill <id|#|all>` bricht einen oder alle laufenden Sub-Agenten ab.
- `/steer <id|#> <message>` sendet Steuerung an einen laufenden Sub-Agenten. Alias: `/tell`.
- `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur für den Owner. Erfordert `commands.config: true`.
- `/mcp show|get|set|unset` liest oder schreibt die von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`. Nur für den Owner. Erfordert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspiziert oder verändert Plugin-Status. `/plugin` ist ein Alias. Schreibvorgänge nur für den Owner. Erfordert `commands.plugins: true`.
- `/debug show|set|unset|reset` verwaltet nur-Laufzeit-Überschreibungen der Konfiguration. Nur für den Owner. Erfordert `commands.debug: true`.
- `/usage off|tokens|full|cost` steuert die Nutzungsfußzeile pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.
- `/tts on|off|status|provider|limit|summary|audio|help` steuert TTS. Siehe [/tools/tts](/de/tools/tts).
- `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- `/activation mention|always` setzt den Aktivierungsmodus für Gruppen.
- `/send on|off|inherit` setzt die Senderichtlinie. Nur für den Owner.
- `/bash <command>` führt einen Shell-Befehl auf dem Host aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus Allowlists für `tools.elevated`.
- `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
- `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

### Generierte Dock-Befehle

Dock-Befehle werden aus Channel Plugins mit Unterstützung für native Befehle generiert. Aktueller gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

### Befehle gebündelter Plugins

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet Geräte-Pairing-/Setup-Abläufe. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend risikoreiche Befehle für Phone-Nodes.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Talk-Sprachkonfiguration. Auf Discord lautet der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Voreinstellungen. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspiziert und steuert das gebündelte Codex-App-Server-Harness. Siehe [Codex Harness](/de/plugins/codex-harness).
- Nur QQBot-Befehle:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-Befehle

Vom Benutzer aufrufbare Skills werden ebenfalls als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können auch als direkte Befehle wie `/prose` erscheinen, wenn der Skill/das Plugin sie registriert.
- Die Registrierung nativer Skill-Befehle wird durch `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen dem Befehl und den Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Providernamen (unscharfer Abgleich); wenn es keine Übereinstimmung gibt, wird der Text als Nachrichtentext behandelt.
- Für die vollständige Aufschlüsselung der Providernutzung verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt `configWrites` des Kanals.
- In Mehrkonto-Kanälen berücksichtigen konfigurationsbezogene Aufrufe von `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` ebenfalls `configWrites` des Zielkontos.
- `/usage` steuert die Nutzungsfußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
- `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und fordert möglicherweise zu einem Neustart auf.
- Nur auf Discord verfügbarer nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (erfordert `channels.discord.voice` und native Befehle; nicht als Text verfügbar).
- Discord-Befehle für Thread-Bindings (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindings aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- ACP-Befehlsreferenz und Laufzeitverhalten: [ACP Agents](/de/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es im normalen Gebrauch **aus**.
- `/trace` ist enger als `/verbose`: Es zeigt nur plugin-eigene Trace-/Debug-Zeilen und lässt normale ausführliche Tool-Ausgaben aus.
- `/fast on|off` persistiert eine Sitzungsüberschreibung. Verwenden Sie in der Sessions-UI die Option `inherit`, um sie zu löschen und auf Konfigurationsstandardwerte zurückzufallen.
- `/fast` ist provider­spezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Verkehr an `api.anthropic.com`, es auf `service_tier=auto` oder `standard_only` abbilden. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
- Zusammenfassungen zu Tool-Fehlern werden weiterhin angezeigt, wenn relevant, aber detaillierter Fehlertext wird nur einbezogen, wenn `/verbose` auf `on` oder `full` steht.
- `/reasoning`, `/verbose` und `/trace` sind in Gruppeneinstellungen riskant: Sie können internes Reasoning, Tool-Ausgabe oder Plugin-Diagnosen offenlegen, die Sie nicht freigeben wollten. Lassen Sie sie bevorzugt aus, insbesondere in Gruppenchats.
- `/model` persistiert das neue Sitzungsmodell sofort.
- Wenn der Agent untätig ist, verwendet der nächste Lauf es sofort.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungszeitpunkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zum nächsten Benutzerturm in der Warteschlange bleiben.
- **Schnellpfad:** Nur-Befehl-Nachrichten von allowlisteten Absendern werden sofort verarbeitet (umgehen Warteschlange + Modell).
- **Gruppen-Mention-Gating:** Nur-Befehl-Nachrichten von allowlisteten Absendern umgehen Mention-Anforderungen.
- **Inline-Kurzbefehle (nur allowlistete Absender):** Bestimmte Befehle funktionieren auch eingebettet in einer normalen Nachricht und werden entfernt, bevor das Modell den restlichen Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der restliche Text läuft normal weiter.
- Derzeit: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nur-Befehl-Nachrichten werden stillschweigend ignoriert, und Inline-`/...`-Tokens werden als Klartext behandelt.
- **Skill-Befehle:** `user-invocable` Skills werden als Slash-Befehle bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); bei Kollisionen werden numerische Suffixe angehängt (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill nach Namen aus (nützlich, wenn Limits für native Befehle Befehle pro Skill verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu leiten (deterministisch, ohne Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
- **Argumente für native Befehle:** Discord verwendet Autovervollständigung für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen.

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent genau jetzt in
dieser Unterhaltung verwenden kann**.

- Standardmäßig ist `/tools` kompakt und für schnelles Überfliegen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, stellen denselben Moduswechsel als `compact|verbose` bereit.
- Ergebnisse sind sitzungsbezogen, daher können Änderungen an Agent, Kanal, Thread, Absenderautorisierung oder Modell
  die Ausgabe ändern.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Core-Tools, verbundener
  Plugin-Tools und kanalbezogener Tools.

Für das Bearbeiten von Profilen und Überschreibungen verwenden Sie das Tools-Panel der Control UI oder Konfigurations-/Katalogoberflächen,
statt `/tools` als statischen Katalog zu behandeln.

## Usage-Oberflächen (was wo angezeigt wird)

- **Provider-Nutzung/Quote** (Beispiel: „Claude 80% left“) wird in `/status` für den aktuellen Modellprovider angezeigt, wenn Usage-Tracking aktiviert ist. OpenClaw normalisiert Provider-Fenster auf `% left`; bei MiniMax werden Nur-Restprozentsätze vor der Anzeige invertiert, und Antworten von `model_remains` bevorzugen den Chat-Modell-Eintrag plus ein plangetagtes Label.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Usage-Eintrag im Transcript zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Vorhandene nicht nullige Live-Werte haben weiterhin Vorrang, und der Transcript-Fallback kann auch das aktive Laufzeitmodell-Label plus eine größere promptorientierte Gesamtsumme wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Tokens/Kosten pro Antwort** werden über `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- Bei `/model status` geht es um **Modelle/Auth/Endpunkte**, nicht um Usage.

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

- `/model` und `/model list` zeigen einen kompakten nummerierten Picker an (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Provider und Modell plus einem Schritt zum Absenden.
- `/model <#>` wählt aus diesem Picker aus (und bevorzugt nach Möglichkeit den aktuellen Provider).
- `/model status` zeigt die detaillierte Ansicht, einschließlich des konfigurierten Provider-Endpunkts (`baseUrl`) und des API-Modus (`api`), wenn verfügbar.

## Debug-Überschreibungen

Mit `/debug` können Sie **nur-Laufzeit-**Konfigurationsüberschreibungen setzen (im Speicher, nicht auf Datenträger). Nur für den Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Hinweise:

- Überschreibungen gelten sofort für neue Konfigurationslesevorgänge, schreiben aber **nicht** in `openclaw.json`.
- Verwenden Sie `/debug reset`, um alle Überschreibungen zu löschen und zur Konfiguration auf dem Datenträger zurückzukehren.

## Plugin-Trace-Ausgabe

Mit `/trace` können Sie **sitzungsbezogene Plugin-Trace-/Debug-Zeilen** umschalten, ohne den vollständigen Verbose-Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Hinweise:

- `/trace` ohne Argument zeigt den aktuellen Trace-Status der Sitzung an.
- `/trace on` aktiviert Plugin-Trace-Zeilen für die aktuelle Sitzung.
- `/trace off` deaktiviert sie wieder.
- Plugin-Trace-Zeilen können in `/status` und als nachfolgende Diagnosemeldung nach der normalen Assistant-Antwort erscheinen.
- `/trace` ersetzt nicht `/debug`; `/debug` verwaltet weiterhin nur-Laufzeit-Überschreibungen der Konfiguration.
- `/trace` ersetzt nicht `/verbose`; normale ausführliche Tool-/Statusausgabe gehört weiterhin zu `/verbose`.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf dem Datenträger (`openclaw.json`). Nur für den Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.config: true`.

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
- Aktualisierungen mit `/config` bleiben über Neustarts hinweg erhalten.

## MCP-Aktualisierungen

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur für den Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen.
- Laufzeit-Adapter entscheiden, welche Transporte tatsächlich ausführbar sind.

## Plugin-Aktualisierungen

Mit `/plugins` können Operatoren entdeckte Plugins inspizieren und Aktivierung in der Konfiguration umschalten. Nur-Lese-Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Discovery gegen den aktuellen Workspace plus Konfiguration auf dem Datenträger.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden dadurch nicht installiert oder deinstalliert.
- Starten Sie das Gateway nach Änderungen durch Aktivieren/Deaktivieren neu, damit sie wirksam werden.

## Hinweise zu Oberflächen

- **Textbefehle** laufen in der normalen Chat-Sitzung (DMs teilen `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
- **`/stop`** zielt auf die aktive Chat-Sitzung, damit es den aktuellen Lauf abbrechen kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie pro eingebautem Befehl einen Slack-Slash-Befehl erstellen (dieselben Namen wie `/help`). Menüs für Befehlsargumente in Slack werden als ephemere Block-Kit-Buttons ausgeliefert.
  - Native Ausnahme in Slack: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert in Slack-Nachrichten weiterhin.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Im Unterschied zu normalem Chat:

- verwendet es die aktuelle Sitzung als Hintergrundkontext,
- läuft es als separater **werkzeugloser** Einmalaufruf,
- verändert es den zukünftigen Sitzungskontext nicht,
- wird es nicht in die Transcript-Historie geschrieben,
- wird es als Live-Seitenergebnis statt als normale Assistant-Nachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klarstellung möchten, während die Haupt-
Aufgabe weiterläuft.

Beispiel:

```text
/btw was machen wir gerade?
```

Siehe [BTW Side Questions](/de/tools/btw) für das vollständige Verhalten und
Details zur Client-UX.
