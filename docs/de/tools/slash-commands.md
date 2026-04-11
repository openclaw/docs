---
read_when:
    - Verwenden oder Konfigurieren von Chat-Befehlen
    - Befehlsrouting oder Berechtigungen debuggen
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-11T02:48:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cc346361c3b1a63aae9ec0f28706f4cb0b866b6c858a3999101f6927b923b4a
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash-Befehle

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt.
Der nur auf dem Host verfügbare Bash-Chat-Befehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Es gibt zwei verwandte Systeme:

- **Befehle**: eigenständige `/...`-Nachrichten.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
  - In normalen Chat-Nachrichten (nicht nur Direktiven) werden sie als „Inline-Hinweise“ behandelt und persistieren die Sitzungseinstellungen **nicht**.
  - In Nur-Direktiven-Nachrichten (die Nachricht enthält nur Direktiven) werden sie in der Sitzung persistiert und mit einer Bestätigung beantwortet.
  - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige
    verwendete Allowlist; andernfalls kommt die Autorisierung aus Channel-Allowlists/Pairing plus `commands.useAccessGroups`.
    Nicht autorisierte Absender sehen Direktiven als normalen Text behandelt.

Es gibt außerdem einige **Inline-Kurzbefehle** (nur für per Allowlist/autorisierte Absender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Sie werden sofort ausgeführt, werden entfernt, bevor das Modell die Nachricht sieht, und der verbleibende Text läuft weiter durch den normalen Ablauf.

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
  - Auto: an für Discord/Telegram, aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Provider ohne native Unterstützung.
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Provider zu überschreiben (bool oder `"auto"`).
  - `false` löscht beim Start auf Discord/Telegram zuvor registrierte Befehle. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard `"auto"`) registriert **Skill**-Befehle nativ, wenn unterstützt.
  - Auto: an für Discord/Telegram, aus für Slack (Slack erfordert das Erstellen eines Slash-Befehls pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Provider zu überschreiben (bool oder `"auto"`).
- `commands.bash` (Standard `false`) aktiviert `! <cmd>`, um Host-Shell-Befehle auszuführen (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Allowlists).
- `commands.bashForegroundMs` (Standard `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` schickt sofort in den Hintergrund).
- `commands.config` (Standard `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard `false`) aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard `false`) aktiviert `/plugins` (Plugin-Erkennung/-Status plus Installations- und Aktivieren-/Deaktivieren-Steuerung).
- `commands.debug` (Standard `false`) aktiviert `/debug` (nur Runtime-Overrides).
- `commands.restart` (Standard `true`) aktiviert `/restart` plus Tool-Aktionen zum Neustarten des Gateways.
- `commands.ownerAllowFrom` (optional) setzt die explizite Owner-Allowlist für nur für Owner zugängliche Befehls-/Tool-Oberflächen. Dies ist getrennt von `commands.allowFrom`.
- `commands.ownerDisplay` steuert, wie Owner-IDs im System-Prompt erscheinen: `raw` oder `hash`.
- `commands.ownerDisplaySecret` setzt optional das HMAC-Secret, das verwendet wird, wenn `commands.ownerDisplay="hash"` gesetzt ist.
- `commands.allowFrom` (optional) setzt eine providerbezogene Allowlist für die Befehlsautorisierung. Wenn konfiguriert, ist sie die
  einzige Autorisierungsquelle für Befehle und Direktiven (Channel-Allowlists/Pairing und `commands.useAccessGroups`
  werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; providerspezifische Schlüssel überschreiben ihn.
- `commands.useAccessGroups` (Standard `true`) erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Aktuelle Source of Truth:

- integrierte Core-Befehle kommen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle kommen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle kommen aus `registerCommand()`-Aufrufen der Plugins
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurations-Flags, der Channel-Oberfläche und installierten/aktivierten Plugins ab

### Integrierte Core-Befehle

Heute verfügbare integrierte Befehle:

- `/new [model]` startet eine neue Sitzung; `/reset` ist der Reset-Alias.
- `/compact [instructions]` kompaktiert den Sitzungskontext. Siehe [/concepts/compaction](/de/concepts/compaction).
- `/stop` bricht die aktuelle Ausführung ab.
- `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten den Ablauf von Thread-Bindings.
- `/think <off|minimal|low|medium|high|xhigh>` setzt die Denkstufe. Aliasse: `/thinking`, `/t`.
- `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
- `/fast [status|on|off]` zeigt den Fast-Modus an oder setzt ihn.
- `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
- `/elevated [on|off|ask|full]` schaltet den Elevated-Modus um. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt Exec-Standards an oder setzt sie.
- `/model [name|#|status]` zeigt das Modell an oder setzt es.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` listet Provider oder Modelle für einen Provider auf.
- `/queue <mode>` verwaltet das Queue-Verhalten (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus Optionen wie `debounce:2s cap:25 drop:summarize`.
- `/help` zeigt die kurze Hilfe-Zusammenfassung.
- `/commands` zeigt den generierten Befehlskatalog.
- `/tools [compact|verbose]` zeigt, was der aktuelle Agent gerade verwenden kann.
- `/status` zeigt den Runtime-Status, einschließlich Provider-Nutzung/-Quota, wenn verfügbar.
- `/tasks` listet aktive/aktuelle Hintergrundaufgaben für die aktuelle Sitzung auf.
- `/context [list|detail|json]` erklärt, wie Kontext zusammengesetzt wird.
- `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
- `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
- `/skill <name> [input]` führt einen Skill anhand des Namens aus.
- `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
- `/approve <id> <decision>` löst Exec-Genehmigungsaufforderungen auf.
- `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Siehe [/tools/btw](/de/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` verwaltet Sub-Agent-Ausführungen für die aktuelle Sitzung.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Runtime-Optionen.
- `/focus <target>` bindet den aktuellen Discord-Thread oder das aktuelle Telegram-Thema/Gespräch an ein Sitzungsziel.
- `/unfocus` entfernt das aktuelle Binding.
- `/agents` listet threadgebundene Agents für die aktuelle Sitzung auf.
- `/kill <id|#|all>` bricht einen oder alle laufenden Sub-Agents ab.
- `/steer <id|#> <message>` sendet Steuerung an einen laufenden Sub-Agenten. Alias: `/tell`.
- `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur für Owner. Erfordert `commands.config: true`.
- `/mcp show|get|set|unset` liest oder schreibt von OpenClaw verwaltete MCP-Server-Konfiguration unter `mcp.servers`. Nur für Owner. Erfordert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` untersucht oder verändert den Plugin-Status. `/plugin` ist ein Alias. Schreibvorgänge nur für Owner. Erfordert `commands.plugins: true`.
- `/debug show|set|unset|reset` verwaltet nur-Runtime-Konfigurations-Overrides. Nur für Owner. Erfordert `commands.debug: true`.
- `/usage off|tokens|full|cost` steuert den Nutzungs-Footer pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.
- `/tts on|off|status|provider|limit|summary|audio|help` steuert TTS. Siehe [/tools/tts](/de/tools/tts).
- `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um ihn zu deaktivieren.
- `/activation mention|always` setzt den Gruppenaktivierungsmodus.
- `/send on|off|inherit` setzt die Senderichtlinie. Nur für Owner.
- `/bash <command>` führt einen Host-Shell-Befehl aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus `tools.elevated`-Allowlists.
- `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
- `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

### Generierte Dock-Befehle

Dock-Befehle werden aus Channel-Plugins mit nativer Befehlsunterstützung generiert. Aktueller gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

### Befehle gebündelter Plugins

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory-Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet den Ablauf für Geräte-Pairing/-Setup. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend Hochrisiko-Telefon-Node-Befehle.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Sprachkonfiguration von Talk. Auf Discord lautet der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Voreinstellungen. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` untersucht und steuert das gebündelte Codex-App-Server-Harness. Siehe [Codex Harness](/de/plugins/codex-harness).
- Nur für QQBot verfügbare Befehle:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-Befehle

Vom Benutzer aufrufbare Skills werden ebenfalls als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können auch als direkte Befehle wie `/prose` erscheinen, wenn der Skill/das Plugin sie registriert.
- Die native Registrierung von Skill-Befehlen wird durch `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen dem Befehl und den Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Providernamen (fuzzy match); gibt es keine Übereinstimmung, wird der Text als Nachrichtentext behandelt.
- Für die vollständige Aufschlüsselung der Provider-Nutzung verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt `configWrites` des Channels.
- In Multi-Account-Channels berücksichtigen das auf die Konfiguration zielende `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` auch `configWrites` des Ziel-Accounts.
- `/usage` steuert den Nutzungs-Footer pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um ihn zu deaktivieren.
- `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
- `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und kann zu einem Neustart auffordern.
- Nur auf Discord verfügbarer nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (erfordert `channels.discord.voice` und native Befehle; nicht als Text verfügbar).
- Discord-Thread-Binding-Befehle (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindings aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- ACP-Befehlsreferenz und Runtime-Verhalten: [ACP Agents](/de/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es im normalen Gebrauch **aus**.
- `/fast on|off` persistiert einen Sitzungs-Override. Verwenden Sie in der Sitzungs-UI die Option `inherit`, um ihn zu löschen und auf die Konfigurationsstandardwerte zurückzufallen.
- `/fast` ist provider-spezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Traffic an `api.anthropic.com`, es auf `service_tier=auto` oder `standard_only` abbilden. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
- Zusammenfassungen von Tool-Fehlschlägen werden weiterhin angezeigt, wenn relevant, aber ausführlicher Fehlertext wird nur aufgenommen, wenn `/verbose` auf `on` oder `full` steht.
- `/reasoning` (und `/verbose`) sind in Gruppensettings riskant: Sie können internes Reasoning oder Tool-Ausgaben offenlegen, die Sie nicht beabsichtigt freizugeben. Lassen Sie sie möglichst deaktiviert, besonders in Gruppenchats.
- `/model` persistiert das neue Sitzungsmodell sofort.
- Wenn der Agent untätig ist, verwendet die nächste Ausführung es sofort.
- Wenn bereits eine Ausführung aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Retry-Punkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen haben, kann der ausstehende Wechsel bis zu einer späteren Retry-Gelegenheit oder dem nächsten User-Turn in der Warteschlange bleiben.
- **Fast Path:** Nur-Befehls-Nachrichten von per Allowlist zugelassenen Absendern werden sofort verarbeitet (umgehen Queue + Modell).
- **Mention-Gating in Gruppen:** Nur-Befehls-Nachrichten von per Allowlist zugelassenen Absendern umgehen Mention-Anforderungen.
- **Inline-Kurzbefehle (nur für per Allowlist zugelassene Absender):** Bestimmte Befehle funktionieren auch, wenn sie in eine normale Nachricht eingebettet sind, und werden entfernt, bevor das Modell den restlichen Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der restliche Text läuft im normalen Ablauf weiter.
- Aktuell: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nur-Befehls-Nachrichten werden stillschweigend ignoriert, und Inline-`/...`-Token werden als normaler Text behandelt.
- **Skill-Befehle:** `user-invocable` Skills werden als Slash-Befehle bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); bei Kollisionen werden numerische Suffixe angehängt (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill anhand des Namens aus (nützlich, wenn native Befehlslimits pro-Skill-Befehle verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu routen (deterministisch, ohne Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
- **Native Befehlsargumente:** Discord verwendet Autovervollständigung für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen.

## `/tools`

`/tools` beantwortet eine Runtime-Frage, keine Konfigurationsfrage: **was dieser Agent gerade
in dieser Unterhaltung verwenden kann**.

- Standardmäßig ist `/tools` kompakt und auf schnelles Überfliegen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, stellen denselben Moduswechsel als `compact|verbose` bereit.
- Ergebnisse sind sitzungsbezogen; ein Wechsel von Agent, Channel, Thread, Absenderautorisierung oder Modell kann
  die Ausgabe ändern.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Core-Tools, verbundener
  Plugin-Tools und channel-eigener Tools.

Für das Bearbeiten von Profilen und Overrides verwenden Sie das Tools-Panel der Control UI oder Konfigurations-/Katalogoberflächen, anstatt
`/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Provider-Nutzung/-Quota** (Beispiel: „Claude 80% left“) erscheint in `/status` für den aktuellen Modell-Provider, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Provider-Fenster auf `% left`; bei MiniMax werden Prozentfelder mit nur Restwerten vor der Anzeige invertiert, und Antworten mit `model_remains` bevorzugen den Chat-Modell-Eintrag plus ein modellgetaggtes Plan-Label.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungs-Eintrag des Transkripts zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Bereits vorhandene nicht-null Live-Werte haben weiterhin Vorrang, und der Transkript-Fallback kann auch das aktive Runtime-Modell-Label sowie eine größere prompt-orientierte Gesamtsumme wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Tokens/Kosten pro Antwort** werden durch `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- `/model status` bezieht sich auf **Modelle/Auth/Endpunkte**, nicht auf Nutzung.

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

- `/model` und `/model list` zeigen einen kompakten nummerierten Picker (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Provider und Modell sowie einem Schritt zum Absenden.
- `/model <#>` wählt aus diesem Picker aus (und bevorzugt nach Möglichkeit den aktuellen Provider).
- `/model status` zeigt die Detailansicht, einschließlich des konfigurierten Provider-Endpunkts (`baseUrl`) und des API-Modus (`api`), wenn verfügbar.

## Debug-Overrides

`/debug` ermöglicht Ihnen das Setzen von **nur zur Laufzeit geltenden** Konfigurations-Overrides (im Speicher, nicht auf der Festplatte). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Hinweise:

- Overrides werden sofort auf neue Konfigurationslesevorgänge angewendet, schreiben aber **nicht** nach `openclaw.json`.
- Verwenden Sie `/debug reset`, um alle Overrides zu löschen und zur Konfiguration auf der Festplatte zurückzukehren.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf der Festplatte (`openclaw.json`). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.config: true`.

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
- `/config`-Aktualisierungen bleiben über Neustarts hinweg bestehen.

## MCP-Aktualisierungen

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen.
- Runtime-Adapter entscheiden, welche Transporte tatsächlich ausführbar sind.

## Plugin-Aktualisierungen

`/plugins` erlaubt Operatoren, erkannte Plugins zu prüfen und die Aktivierung in der Konfiguration umzuschalten. Schreibgeschützte Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung gegen den aktuellen Workspace plus die Konfiguration auf der Festplatte.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden nicht installiert oder deinstalliert.
- Nach Änderungen durch Aktivieren/Deaktivieren starten Sie das Gateway neu, damit sie angewendet werden.

## Hinweise zu Oberflächen

- **Textbefehle** laufen in der normalen Chatsitzung (DMs teilen `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chatsitzung)
- **`/stop`** zielt auf die aktive Chatsitzung, sodass die aktuelle Ausführung abgebrochen werden kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie für jeden integrierten Befehl einen Slack-Slash-Befehl erstellen (mit denselben Namen wie `/help`). Menüs für Befehlsargumente in Slack werden als ephemere Block-Kit-Buttons zugestellt.
  - Native Slack-Ausnahme: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert in Slack-Nachrichten weiterhin.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Anders als im normalen Chat:

- wird die aktuelle Sitzung als Hintergrundkontext verwendet,
- läuft sie als separater **tool-loser** Einmalaufruf,
- ändert sie den zukünftigen Sitzungskontext nicht,
- wird sie nicht in den Transkriptverlauf geschrieben,
- wird sie als Live-Nebenergebnis statt als normale Assistentennachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klärung möchten, während die Haupt-
aufgabe weiterläuft.

Beispiel:

```text
/btw was machen wir gerade?
```

Unter [BTW Side Questions](/de/tools/btw) finden Sie das vollständige Verhalten und Details
zur Client-UX.
