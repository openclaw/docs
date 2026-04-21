---
read_when:
    - Verwendung oder Konfiguration von Chat-Befehlen
    - Fehlerbehebung bei Befehlsrouting oder Berechtigungen
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-21T13:38:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: d90ddee54af7c05b7fdf486590561084581d750e42cd14674d43bbdc0984df5d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash-Befehle

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt.
Der nur auf dem Host verfügbare Bash-Chat-Befehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Es gibt zwei verwandte Systeme:

- **Befehle**: eigenständige `/...`-Nachrichten.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
  - In normalen Chat-Nachrichten (nicht nur Direktiven) werden sie als „Inline-Hinweise“ behandelt und **persistieren keine** Sitzungseinstellungen.
  - In Nachrichten, die nur Direktiven enthalten (die Nachricht enthält nur Direktiven), werden sie in der Sitzung persistiert und beantworten mit einer Bestätigung.
  - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige
    verwendete Zulassungsliste; andernfalls stammt die Autorisierung aus Kanal-Zulassungslisten/Pairing plus `commands.useAccessGroups`.
    Nicht autorisierte Absender sehen Direktiven als Klartext behandelt.

Es gibt außerdem einige **Inline-Kurzbefehle** (nur für zugelassene/autorisierte Absender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
  - Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle weiterhin, selbst wenn Sie dies auf `false` setzen.
- `commands.native` (Standard `"auto"`) registriert native Befehle.
  - Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Anbieter ohne native Unterstützung.
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Anbieter zu überschreiben (bool oder `"auto"`).
  - `false` löscht beim Start zuvor registrierte Befehle auf Discord/Telegram. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard `"auto"`) registriert **Skill**-Befehle nativ, wenn unterstützt.
  - Auto: an für Discord/Telegram; aus für Slack (Slack erfordert das Anlegen eines Slash-Befehls pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Anbieter zu überschreiben (bool oder `"auto"`).
- `commands.bash` (Standard `false`) aktiviert `! <cmd>` zum Ausführen von Host-Shell-Befehlen (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Zulassungslisten).
- `commands.bashForegroundMs` (Standard `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` schickt sofort in den Hintergrund).
- `commands.config` (Standard `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard `false`) aktiviert `/mcp` (liest/schreibt die von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard `false`) aktiviert `/plugins` (Plugin-Erkennung/Status plus Installations- und Aktivierungs-/Deaktivierungssteuerung).
- `commands.debug` (Standard `false`) aktiviert `/debug` (nur Laufzeit-Überschreibungen).
- `commands.restart` (Standard `true`) aktiviert `/restart` plus Gateway-Neustart-Tool-Aktionen.
- `commands.ownerAllowFrom` (optional) setzt die explizite Zulassungsliste der Eigentümer für nur-Eigentümer-Befehls-/Tool-Oberflächen. Dies ist getrennt von `commands.allowFrom`.
- `commands.ownerDisplay` steuert, wie Eigentümer-IDs im System-Prompt erscheinen: `raw` oder `hash`.
- `commands.ownerDisplaySecret` setzt optional das HMAC-Secret, das verwendet wird, wenn `commands.ownerDisplay="hash"` gesetzt ist.
- `commands.allowFrom` (optional) setzt eine anbieterbezogene Zulassungsliste für die Befehlsautorisierung. Wenn konfiguriert, ist sie die
  einzige Autorisierungsquelle für Befehle und Direktiven (Kanal-Zulassungslisten/Pairing und `commands.useAccessGroups`
  werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; anbieterbezogene Schlüssel überschreiben ihn.
- `commands.useAccessGroups` (Standard `true`) erzwingt Zulassungslisten/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Aktuelle Single Source of Truth:

- Kern-Integrationen stammen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle stammen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle stammen aus Plugin-Aufrufen von `registerCommand()`
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurationsflags, Kanaloberfläche und installierten/aktivierten Plugins ab

### Integrierte Kernbefehle

Heute verfügbare integrierte Befehle:

- `/new [model]` startet eine neue Sitzung; `/reset` ist der Alias zum Zurücksetzen.
- `/compact [instructions]` komprimiert den Sitzungskontext. Siehe [/concepts/compaction](/de/concepts/compaction).
- `/stop` bricht die aktuelle Ausführung ab.
- `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten das Ablaufen der Thread-Bindung.
- `/think <level>` setzt die Thinking-Stufe. Die Optionen stammen aus dem Anbieterprofil des aktiven Modells; gängige Stufen sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Stufen wie `xhigh`, `adaptive`, `max` oder binärem `on` nur dort, wo unterstützt. Aliasse: `/thinking`, `/t`.
- `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
- `/trace on|off` schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
- `/fast [status|on|off]` zeigt den Fast-Modus an oder setzt ihn.
- `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
- `/elevated [on|off|ask|full]` schaltet den Elevated-Modus um. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt die Exec-Standards an oder setzt sie.
- `/model [name|#|status]` zeigt das Modell an oder setzt es.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` listet Anbieter oder Modelle für einen Anbieter auf.
- `/queue <mode>` verwaltet Queue-Verhalten (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus Optionen wie `debounce:2s cap:25 drop:summarize`.
- `/help` zeigt die kurze Hilfezusammenfassung an.
- `/commands` zeigt den generierten Befehlskatalog an.
- `/tools [compact|verbose]` zeigt an, was der aktuelle Agent gerade verwenden kann.
- `/status` zeigt den Laufzeitstatus an, einschließlich Anbieternutzung/Kontingent, falls verfügbar.
- `/tasks` listet aktive/aktuelle Hintergrundaufgaben für die aktuelle Sitzung auf.
- `/context [list|detail|json]` erklärt, wie Kontext zusammengestellt wird.
- `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
- `/whoami` zeigt Ihre Absender-ID an. Alias: `/id`.
- `/skill <name> [input]` führt einen Skill nach Namen aus.
- `/allowlist [list|add|remove] ...` verwaltet Einträge in der Zulassungsliste. Nur Text.
- `/approve <id> <decision>` bearbeitet Exec-Genehmigungsabfragen.
- `/btw <question>` stellt eine Nebenfrage, ohne den künftigen Sitzungskontext zu ändern. Siehe [/tools/btw](/de/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` verwaltet Sub-Agent-Ausführungen für die aktuelle Sitzung.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
- `/focus <target>` bindet den aktuellen Discord-Thread oder das aktuelle Telegram-Thema/Gespräch an ein Sitzungsziel.
- `/unfocus` entfernt die aktuelle Bindung.
- `/agents` listet threadgebundene Agenten für die aktuelle Sitzung auf.
- `/kill <id|#|all>` bricht einen oder alle laufenden Sub-Agenten ab.
- `/steer <id|#> <message>` sendet Steuerung an einen laufenden Sub-Agenten. Alias: `/tell`.
- `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur Eigentümer. Erfordert `commands.config: true`.
- `/mcp show|get|set|unset` liest oder schreibt von OpenClaw verwaltete MCP-Server-Konfiguration unter `mcp.servers`. Nur Eigentümer. Erfordert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` untersucht oder ändert den Plugin-Status. `/plugin` ist ein Alias. Schreibvorgänge nur für Eigentümer. Erfordert `commands.plugins: true`.
- `/debug show|set|unset|reset` verwaltet nur zur Laufzeit geltende Konfigurationsüberschreibungen. Nur Eigentümer. Erfordert `commands.debug: true`.
- `/usage off|tokens|full|cost` steuert die Nutzungsfußzeile pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.
- `/tts on|off|status|provider|limit|summary|audio|help` steuert TTS. Siehe [/tools/tts](/de/tools/tts).
- `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- `/activation mention|always` setzt den Gruppenaktivierungsmodus.
- `/send on|off|inherit` setzt die Senderichtlinie. Nur Eigentümer.
- `/bash <command>` führt einen Host-Shell-Befehl aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus `tools.elevated`-Zulassungslisten.
- `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
- `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

### Generierte Dock-Befehle

Dock-Befehle werden aus Kanal-Plugins mit Unterstützung für native Befehle generiert. Aktueller gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

### Gebündelte Plugin-Befehle

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repository:

- `/dreaming [on|off|status|help]` schaltet Memory Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet den Ablauf für Geräte-Pairing/-Einrichtung. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend Hochrisiko-Befehle des Phone-Node.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Talk-Sprachkonfiguration. Auf Discord ist der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Voreinstellungen. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` untersucht und steuert den gebündelten Codex-App-Server-Harness. Siehe [Codex Harness](/de/plugins/codex-harness).
- Nur QQBot-Befehle:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-Befehle

Vom Benutzer aufrufbare Skills werden auch als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können auch als direkte Befehle wie `/prose` erscheinen, wenn der Skill/das Plugin sie registriert.
- Die Registrierung nativer Skill-Befehle wird über `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Anbieternamen (unscharfer Abgleich); wenn es keine Übereinstimmung gibt, wird der Text als Nachrichtentext behandelt.
- Für die vollständige Aufschlüsselung der Anbieternutzung verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und beachtet kanalbezogene `configWrites`.
- In Kanälen mit mehreren Konten beachten konfigurationsbezogenes `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` auch `configWrites` des Zielkontos.
- `/usage` steuert die Nutzungsfußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungsprotokollen aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
- `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und kann zu einem Neustart auffordern.
- Nur auf Discord verfügbarer nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (erfordert `channels.discord.voice` und native Befehle; nicht als Text verfügbar).
- Discord-Befehle zur Thread-Bindung (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindungen aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- ACP-Befehlsreferenz und Laufzeitverhalten: [ACP Agents](/de/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es im normalen Gebrauch **aus**.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur plugin-eigene Trace-/Debug-Zeilen an und lässt normales ausführliches Tool-Logging ausgeschaltet.
- `/fast on|off` persistiert eine Sitzungsüberschreibung. Verwenden Sie in der Sitzungs-UI die Option `inherit`, um sie zu löschen und auf Konfigurationsstandards zurückzufallen.
- `/fast` ist anbieterspezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich an `api.anthropic.com` gesendetem OAuth-authentifiziertem Datenverkehr, es `service_tier=auto` oder `standard_only` zuordnen. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
- Zusammenfassungen von Tool-Fehlern werden weiterhin angezeigt, wenn relevant, aber detaillierter Fehlertext wird nur eingeschlossen, wenn `/verbose` `on` oder `full` ist.
- `/reasoning`, `/verbose` und `/trace` sind in Gruppensettings riskant: Sie können internes Reasoning, Tool-Ausgaben oder Plugin-Diagnosen offenlegen, die Sie nicht beabsichtigt hatten. Lassen Sie sie bevorzugt deaktiviert, insbesondere in Gruppenchats.
- `/model` persistiert das neue Sitzungsmodell sofort.
- Wenn der Agent untätig ist, verwendet die nächste Ausführung es sofort.
- Wenn bereits eine Ausführung aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder dem nächsten Benutzerzug in der Warteschlange bleiben.
- **Schnellpfad:** Nur-Befehl-Nachrichten von zugelassenen Absendern werden sofort verarbeitet (umgehen Queue + Modell).
- **Gruppen-Erwähnungs-Gating:** Nur-Befehl-Nachrichten von zugelassenen Absendern umgehen Erwähnungsanforderungen.
- **Inline-Kurzbefehle (nur für zugelassene Absender):** Bestimmte Befehle funktionieren auch, wenn sie in eine normale Nachricht eingebettet sind, und werden entfernt, bevor das Modell den verbleibenden Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft durch den normalen Ablauf weiter.
- Aktuell: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nur-Befehl-Nachrichten werden stillschweigend ignoriert, und Inline-`/...`-Token werden als Klartext behandelt.
- **Skill-Befehle:** `user-invocable`-Skills werden als Slash-Befehle bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (maximal 32 Zeichen); bei Kollisionen werden numerische Suffixe angehängt (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill nach Namen aus (nützlich, wenn native Befehlsgrenzen Befehle pro Skill verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu routen (deterministisch, ohne Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
- **Argumente nativer Befehle:** Discord verwendet Autovervollständigung für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü an, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen.

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent jetzt gerade in
diesem Gespräch verwenden kann**.

- Standard-`/tools` ist kompakt und für schnelles Überfliegen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, bieten denselben Moduswechsel als `compact|verbose`.
- Ergebnisse sind sitzungsbezogen, daher kann das Ändern von Agent, Kanal, Thread, Absenderautorisierung oder Modell
  die Ausgabe ändern.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Kern-Tools, verbundener
  Plugin-Tools und kanalbezogener Tools.

Für das Bearbeiten von Profilen und Überschreibungen verwenden Sie das Tools-Panel der Control-UI oder Konfigurations-/Katalogoberflächen, statt
`/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Anbieternutzung/Kontingent** (Beispiel: „Claude 80% left“) erscheint in `/status` für den aktuellen Modellanbieter, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Anbieterfenster zu `% left`; bei MiniMax werden verbleibend-only-Prozentfelder vor der Anzeige invertiert, und Antworten mit `model_remains` bevorzugen den Chat-Modelleintrag plus ein modellmarkiertes Plan-Label.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungseintrag im Transkript zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Vorhandene von null verschiedene Live-Werte haben weiterhin Vorrang, und der Transkript-Fallback kann auch das aktive Laufzeitmodell-Label plus eine größere promptorientierte Gesamtsumme wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Tokens/Kosten pro Antwort** werden über `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- `/model status` betrifft **Modelle/Auth/Endpunkte**, nicht die Nutzung.

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

- `/model` und `/model list` zeigen eine kompakte, nummerierte Auswahl an (Modellfamilie + verfügbare Anbieter).
- Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Dropdowns für Anbieter und Modell plus einem Submit-Schritt.
- `/model <#>` wählt aus dieser Auswahl aus (und bevorzugt wenn möglich den aktuellen Anbieter).
- `/model status` zeigt die Detailansicht an, einschließlich konfiguriertem Anbieter-Endpunkt (`baseUrl`) und API-Modus (`api`), sofern verfügbar.

## Debug-Überschreibungen

`/debug` ermöglicht das Setzen von **nur zur Laufzeit gültigen** Konfigurationsüberschreibungen (Arbeitsspeicher, nicht Festplatte). Nur Eigentümer. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.

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
- Verwenden Sie `/debug reset`, um alle Überschreibungen zu löschen und zur Konfiguration auf Datenträger zurückzukehren.

## Plugin-Trace-Ausgabe

`/trace` ermöglicht das Umschalten **sitzungsbezogener pluginbezogener Trace-/Debug-Zeilen**, ohne den vollständigen ausführlichen Modus einzuschalten.

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
- Plugin-Trace-Zeilen können in `/status` und als diagnostische Folgemeldung nach der normalen Assistentenantwort erscheinen.
- `/trace` ersetzt `/debug` nicht; `/debug` verwaltet weiterhin nur zur Laufzeit gültige Konfigurationsüberschreibungen.
- `/trace` ersetzt `/verbose` nicht; normale ausführliche Tool-/Statusausgabe gehört weiterhin zu `/verbose`.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf Datenträger (`openclaw.json`). Nur Eigentümer. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.config: true`.

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
- Aktualisierungen durch `/config` bleiben über Neustarts hinweg erhalten.

## MCP-Aktualisierungen

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur Eigentümer. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen.
- Laufzeitadapter entscheiden, welche Transporte tatsächlich ausführbar sind.

## Plugin-Aktualisierungen

`/plugins` ermöglicht es Operatoren, erkannte Plugins zu prüfen und die Aktivierung in der Konfiguration umzuschalten. Nur-Lese-Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung gegen den aktuellen Workspace plus die Konfiguration auf Datenträger.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden nicht installiert oder deinstalliert.
- Starten Sie das Gateway nach Änderungen an Aktivieren/Deaktivieren neu, damit sie angewendet werden.

## Hinweise zu Oberflächen

- **Textbefehle** laufen in der normalen Chatsitzung (DMs teilen sich `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix über `channels.slack.slashCommand.sessionPrefix` konfigurierbar)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chatsitzung)
- **`/stop`** zielt auf die aktive Chatsitzung, damit die aktuelle Ausführung abgebrochen werden kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie einen Slack-Slash-Befehl pro integriertem Befehl anlegen (mit denselben Namen wie `/help`). Menüs für Befehlsargumente werden in Slack als ephemere Block-Kit-Buttons bereitgestellt.
  - Native Slack-Ausnahme: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert weiterhin in Slack-Nachrichten.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Anders als normaler Chat:

- verwendet es die aktuelle Sitzung als Hintergrundkontext,
- läuft es als separater **tool-loser** One-Shot-Aufruf,
- ändert es den zukünftigen Sitzungskontext nicht,
- wird es nicht in den Transkriptverlauf geschrieben,
- wird es als Live-Nebenergebnis statt als normale Assistentennachricht zugestellt.

Das macht `/btw` nützlich, wenn Sie eine vorübergehende Klärung möchten, während die Haupt-
aufgabe weiterläuft.

Beispiel:

```text
/btw was machen wir gerade?
```

Siehe [BTW Side Questions](/de/tools/btw) für das vollständige Verhalten und Details
zur Client-UX.
