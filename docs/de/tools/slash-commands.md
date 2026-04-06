---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Routing oder Berechtigungen von Befehlen debuggen
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-06T03:13:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 417e35b9ddd87f25f6c019111b55b741046ea11039dde89210948185ced5696d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash-Befehle

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt.
Der nur für den Host verfügbare Bash-Chat-Befehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Es gibt zwei verwandte Systeme:

- **Befehle**: eigenständige `/...`-Nachrichten.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
  - In normalen Chat-Nachrichten (nicht nur aus Direktiven bestehend) werden sie als „Inline-Hinweise“ behandelt und speichern keine Sitzungseinstellungen dauerhaft.
  - In Nachrichten, die nur aus Direktiven bestehen (die Nachricht enthält nur Direktiven), bleiben sie für die Sitzung erhalten und antworten mit einer Bestätigung.
  - Direktiven werden nur für **autorisierte Sender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige
    verwendete Allowlist; andernfalls kommt die Autorisierung aus Kanal-Allowlists/Kopplung sowie `commands.useAccessGroups`.
    Nicht autorisierte Sender sehen Direktiven als normalen Text behandelt.

Es gibt außerdem einige **Inline-Kurzbefehle** (nur für allowlistete/autorisierte Sender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Sie werden sofort ausgeführt, entfernt, bevor das Modell die Nachricht sieht, und der verbleibende Text läuft im normalen Ablauf weiter.

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
    restart: false,
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
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Provider zu überschreiben (bool oder `"auto"`).
  - `false` löscht beim Start zuvor registrierte Befehle auf Discord/Telegram. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard `"auto"`) registriert **Skills** nativ, wenn unterstützt.
  - Auto: an für Discord/Telegram; aus für Slack (Slack erfordert einen Slash-Befehl pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Provider zu überschreiben (bool oder `"auto"`).
- `commands.bash` (Standard `false`) aktiviert `! <cmd>`, um Shell-Befehle auf dem Host auszuführen (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Allowlists).
- `commands.bashForegroundMs` (Standard `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` schickt sofort in den Hintergrund).
- `commands.config` (Standard `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard `false`) aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard `false`) aktiviert `/plugins` (Plugin-Erkennung/-Status sowie Steuerelemente für Installation + Aktivierung/Deaktivierung).
- `commands.debug` (Standard `false`) aktiviert `/debug` (nur Runtime-Overrides).
- `commands.allowFrom` (optional) setzt eine providerbezogene Allowlist für die Autorisierung von Befehlen. Wenn konfiguriert, ist dies die
  einzige Autorisierungsquelle für Befehle und Direktiven (Kanal-Allowlists/Kopplung und `commands.useAccessGroups`
  werden ignoriert). Verwenden Sie `"*"` als globalen Standard; providerspezifische Schlüssel überschreiben ihn.
- `commands.useAccessGroups` (Standard `true`) erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Text + nativ (wenn aktiviert):

- `/help`
- `/commands`
- `/tools [compact|verbose]` (anzeigen, was der aktuelle Agent genau jetzt verwenden kann; `verbose` fügt Beschreibungen hinzu)
- `/skill <name> [input]` (einen Skill nach Name ausführen)
- `/status` (aktuellen Status anzeigen; enthält Nutzungs-/Quota-Informationen des Providers für den aktuellen Modell-Provider, wenn verfügbar)
- `/tasks` (Hintergrundaufgaben für die aktuelle Sitzung auflisten; zeigt aktive und aktuelle Aufgabendetails mit agent-lokalen Fallback-Zählwerten)
- `/allowlist` (Allowlist-Einträge auflisten/hinzufügen/entfernen)
- `/approve <id> <decision>` (Exec-Genehmigungsaufforderungen auflösen; verwenden Sie die ausstehende Genehmigungsnachricht für die verfügbaren Entscheidungen)
- `/context [list|detail|json]` („Kontext“ erklären; `detail` zeigt pro Datei + pro Tool + pro Skill + Größe des System-Prompts)
- `/btw <question>` (eine ephemere Nebenfrage zur aktuellen Sitzung stellen, ohne den zukünftigen Sitzungskontext zu ändern; siehe [/tools/btw](/de/tools/btw))
- `/export-session [path]` (Alias: `/export`) (aktuelle Sitzung als HTML mit vollständigem System-Prompt exportieren)
- `/whoami` (Ihre Sender-ID anzeigen; Alias: `/id`)
- `/session idle <duration|off>` (automatisches Entfokussieren bei Inaktivität für fokussierte Thread-Bindings verwalten)
- `/session max-age <duration|off>` (hartes Maximalalter für automatisches Entfokussieren für fokussierte Thread-Bindings verwalten)
- `/subagents list|kill|log|info|send|steer|spawn` (Sub-Agent-Läufe für die aktuelle Sitzung prüfen, steuern oder starten)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (ACP-Runtime-Sitzungen prüfen und steuern)
- `/agents` (an Threads gebundene Agenten für diese Sitzung auflisten)
- `/focus <target>` (Discord: diesen Thread oder einen neuen Thread an ein Sitzungs-/Subagent-Ziel binden)
- `/unfocus` (Discord: aktuelles Thread-Binding entfernen)
- `/kill <id|#|all>` (einen oder alle laufenden Sub-Agents für diese Sitzung sofort abbrechen; keine Bestätigungsnachricht)
- `/steer <id|#> <message>` (einen laufenden Sub-Agent sofort steuern: wenn möglich während des Laufs, andernfalls aktuelle Arbeit abbrechen und mit der Steuerungsnachricht neu starten)
- `/tell <id|#> <message>` (Alias für `/steer`)
- `/config show|get|set|unset` (Konfiguration auf Datenträger persistieren, nur owner; erfordert `commands.config: true`)
- `/mcp show|get|set|unset` (OpenClaw-MCP-Serverkonfiguration verwalten, nur owner; erfordert `commands.mcp: true`)
- `/plugins list|show|get|install|enable|disable` (erkannte Plugins prüfen, neue Plugins installieren und Aktivierung umschalten; Schreibvorgänge nur owner; erfordert `commands.plugins: true`)
  - `/plugin` ist ein Alias für `/plugins`.
  - `/plugin install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
  - Schreibvorgänge für Aktivieren/Deaktivieren antworten weiterhin mit einem Neustart-Hinweis. Bei einem überwachten Gateway im Vordergrund kann OpenClaw diesen Neustart direkt nach dem Schreibvorgang automatisch ausführen.
- `/debug show|set|unset|reset` (Runtime-Overrides, nur owner; erfordert `commands.debug: true`)
- `/usage off|tokens|full|cost` (Nutzungs-Footer pro Antwort oder lokale Kostenzusammenfassung)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (TTS steuern; siehe [/tts](/de/tools/tts))
  - Discord: nativer Befehl ist `/voice` (Discord reserviert `/tts`); Text-`/tts` funktioniert weiterhin.
- `/stop`
- `/restart`
- `/dock-telegram` (Alias: `/dock_telegram`) (Antworten auf Telegram umschalten)
- `/dock-discord` (Alias: `/dock_discord`) (Antworten auf Discord umschalten)
- `/dock-slack` (Alias: `/dock_slack`) (Antworten auf Slack umschalten)
- `/activation mention|always` (nur Gruppen)
- `/send on|off|inherit` (nur owner)
- `/reset` oder `/new [model]` (optionaler Modellhinweis; Rest wird durchgereicht)
- `/think <off|minimal|low|medium|high|xhigh>` (dynamische Auswahl je nach Modell/Provider; Aliasse: `/thinking`, `/t`)
- `/fast status|on|off` (wenn das Argument weggelassen wird, wird der aktuell wirksame Fast-Mode-Status angezeigt)
- `/verbose on|full|off` (Alias: `/v`)
- `/reasoning on|off|stream` (Alias: `/reason`; wenn an, wird eine separate Nachricht mit Präfix `Reasoning:` gesendet; `stream` = nur Telegram-Entwurf)
- `/elevated on|off|ask|full` (Alias: `/elev`; `full` überspringt Exec-Genehmigungen)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (senden Sie `/exec`, um den aktuellen Wert anzuzeigen)
- `/model <name>` (Alias: `/models`; oder `/<alias>` aus `agents.defaults.models.*.alias`)
- `/queue <mode>` (plus Optionen wie `debounce:2s cap:25 drop:summarize`; senden Sie `/queue`, um die aktuellen Einstellungen zu sehen)
- `/bash <command>` (nur Host; Alias für `! <command>`; erfordert `commands.bash: true` + `tools.elevated`-Allowlists)
- `/dreaming [on|off|status|help]` (globales Dreaming umschalten oder Status anzeigen; siehe [Dreaming](/concepts/dreaming))

Nur Text:

- `/compact [instructions]` (siehe [/concepts/compaction](/de/concepts/compaction))
- `! <command>` (nur Host; jeweils nur eins; verwenden Sie `!poll` + `!stop` für lang laufende Jobs)
- `!poll` (Ausgabe / Status prüfen; akzeptiert optional `sessionId`; `/bash poll` funktioniert ebenfalls)
- `!stop` (den laufenden Bash-Job stoppen; akzeptiert optional `sessionId`; `/bash stop` funktioniert ebenfalls)

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modell-Alias, `provider/model` oder einen Providernamen (unscharfer Abgleich); wenn es keine Übereinstimmung gibt, wird der Text als Nachrichtentext behandelt.
- Für eine vollständige Aufschlüsselung der Provider-Nutzung verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und beachtet kanalbezogene `configWrites`.
- In Kanälen mit mehreren Konten beachten auf Konfiguration zielende `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` ebenfalls `configWrites` des Zielkontos.
- `/usage` steuert den Nutzungs-Footer pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- Nur Discord nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (erfordert `channels.discord.voice` und native Befehle; nicht als Text verfügbar).
- Discord-Befehle für Thread-Binding (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindings aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- ACP-Befehlsreferenz und Runtime-Verhalten: [ACP Agents](/de/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es im normalen Gebrauch **aus**.
- `/fast on|off` speichert ein Sitzungs-Override. Verwenden Sie die Option `inherit` in der Sessions-UI, um es zu löschen und auf die Standardwerte der Konfiguration zurückzufallen.
- `/fast` ist providerspezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Traffic an `api.anthropic.com`, auf `service_tier=auto` oder `standard_only` abgebildet werden. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
- Zusammenfassungen von Tool-Fehlern werden weiterhin angezeigt, wenn relevant, aber detaillierter Fehlertext wird nur aufgenommen, wenn `/verbose` auf `on` oder `full` steht.
- `/reasoning` (und `/verbose`) sind in Gruppeneinstellungen riskant: Sie können internes Reasoning oder Tool-Ausgabe offenlegen, die Sie nicht beabsichtigt hatten preiszugeben. Lassen Sie sie vorzugsweise ausgeschaltet, besonders in Gruppenchats.
- `/model` speichert das neue Sitzungsmodell sofort.
- Wenn der Agent untätig ist, verwendet der nächste Lauf es sofort.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Retry-Punkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Retry-Gelegenheit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
- **Fast path:** Nur-Befehl-Nachrichten von allowlisteten Sendern werden sofort verarbeitet (Warteschlange + Modell werden umgangen).
- **Group mention gating:** Nur-Befehl-Nachrichten von allowlisteten Sendern umgehen Erwähnungsanforderungen.
- **Inline-Kurzbefehle (nur allowlistete Sender):** Bestimmte Befehle funktionieren auch, wenn sie in eine normale Nachricht eingebettet sind, und werden entfernt, bevor das Modell den verbleibenden Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft im normalen Ablauf weiter.
- Derzeit: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nur-Befehl-Nachrichten werden stillschweigend ignoriert, und Inline-`/...`-Tokens werden als normaler Text behandelt.
- **Skill-Befehle:** `user-invocable` Skills werden als Slash-Befehle verfügbar gemacht. Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); Kollisionen erhalten numerische Suffixe (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill nach Name aus (nützlich, wenn native Befehlslimits Befehle pro Skill verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu routen (deterministisch, ohne Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
- **Argumente nativer Befehle:** Discord verwendet Autocomplete für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen.

## `/tools`

`/tools` beantwortet eine Runtime-Frage, keine Konfigurationsfrage: **was dieser Agent genau jetzt in
dieser Konversation verwenden kann**.

- Standard-`/tools` ist kompakt und für schnelles Scannen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, bieten denselben Moduswechsel als `compact|verbose`.
- Ergebnisse sind sitzungsbezogen, daher können Änderungen von Agent, Kanal, Thread, Senderautorisierung oder Modell
  die Ausgabe ändern.
- `/tools` enthält Tools, die zur Runtime tatsächlich erreichbar sind, einschließlich Core-Tools, verbundener
  Plugin-Tools und kanaleigener Tools.

Für das Bearbeiten von Profilen und Overrides verwenden Sie das Tools-Panel der Control UI oder Konfigurations-/Katalogoberflächen,
anstatt `/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Provider usage/quota** (Beispiel: „Claude 80% left“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Provider-Fenster auf `% left`; bei MiniMax werden Prozentfelder mit nur Restwert vor der Anzeige invertiert, und `model_remains`-Antworten bevorzugen den Chat-Modell-Eintrag plus ein modellmarkiertes Plan-Label.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Usage-Eintrag des Transkripts zurückgreifen, wenn der Live-Sitzungs-Snapshot spärlich ist. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und der Transcript-Fallback kann auch das aktive Runtime-Modell-Label plus einen größeren promptorientierten Gesamtwert wiederherstellen, wenn gespeicherte Gesamtwerte fehlen oder kleiner sind.
- **Tokens/Kosten pro Antwort** werden mit `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
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

- `/model` und `/model list` zeigen einen kompakten, nummerierten Auswahlbereich (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` einen interaktiven Auswahlbereich mit Dropdowns für Provider und Modell plus einem Submit-Schritt.
- `/model <#>` wählt aus diesem Auswahlbereich aus (und bevorzugt nach Möglichkeit den aktuellen Provider).
- `/model status` zeigt die Detailansicht, einschließlich des konfigurierten Provider-Endpunkts (`baseUrl`) und des API-Modus (`api`), wenn verfügbar.

## Debug-Overrides

`/debug` ermöglicht das Setzen von **nur zur Runtime gültigen** Konfigurations-Overrides (im Speicher, nicht auf Datenträger). Nur owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Hinweise:

- Overrides gelten sofort für neue Konfigurationslesevorgänge, schreiben aber **nicht** in `openclaw.json`.
- Verwenden Sie `/debug reset`, um alle Overrides zu löschen und zur Konfiguration auf dem Datenträger zurückzukehren.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf dem Datenträger (`openclaw.json`). Nur owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.config: true`.

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
- `/config`-Aktualisierungen bleiben über Neustarts hinweg erhalten.

## MCP-Aktualisierungen

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen.
- Runtime-Adapter entscheiden, welche Transports tatsächlich ausführbar sind.

## Plugin-Aktualisierungen

`/plugins` ermöglicht es Operatoren, erkannte Plugins zu prüfen und die Aktivierung in der Konfiguration umzuschalten. Read-only-Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung gegen den aktuellen Workspace plus die Konfiguration auf dem Datenträger.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden dadurch nicht installiert oder deinstalliert.
- Starten Sie das Gateway nach Änderungen an Aktivierung/Deaktivierung neu, um sie anzuwenden.

## Hinweise zu Oberflächen

- **Textbefehle** laufen in der normalen Chatsitzung (DMs teilen sich `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chatsitzung)
- **`/stop`** zielt auf die aktive Chatsitzung, damit der aktuelle Lauf abgebrochen werden kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie einen Slack-Slash-Befehl pro integriertem Befehl erstellen (dieselben Namen wie `/help`). Menüs für Befehlsargumente in Slack werden als ephemere Block-Kit-Buttons ausgeliefert.
  - Native Ausnahme in Slack: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert in Slack-Nachrichten weiterhin.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Im Gegensatz zu normalem Chat:

- verwendet sie die aktuelle Sitzung als Hintergrundkontext,
- läuft sie als separater **tool-loser** One-shot-Aufruf,
- ändert sie den zukünftigen Sitzungskontext nicht,
- wird sie nicht in den Transkriptverlauf geschrieben,
- wird sie als Live-Nebenergebnis statt als normale Assistant-Nachricht ausgeliefert.

Das macht `/btw` nützlich, wenn Sie eine vorübergehende Klärung möchten, während die Hauptaufgabe weiterläuft.

Beispiel:

```text
/btw was machen wir gerade?
```

Siehe [BTW Side Questions](/de/tools/btw) für das vollständige Verhalten und
Details zur Client-UX.
