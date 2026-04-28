---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Routing oder Berechtigungen von Befehlen debuggen
sidebarTitle: Slash commands
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-26T11:41:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt. Der host-only-Bash-Chat-Befehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung oder ein Thread an eine ACP-Sitzung gebunden ist, wird normaler Folgetext an diese ACP-Harness weitergeleitet. Gateway-Verwaltungsbefehle bleiben jedoch lokal: `/acp ...` erreicht immer den OpenClaw-ACP-Befehlshandler, und `/status` plus `/unfocus` bleiben lokal, wann immer die Befehlsverarbeitung für die Oberfläche aktiviert ist.

Es gibt zwei verwandte Systeme:

<AccordionGroup>
  <Accordion title="Befehle">
    Eigenständige `/...`-Nachrichten.
  </Accordion>
  <Accordion title="Direktiven">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
    - In normalen Chat-Nachrichten (nicht nur Direktiven) werden sie als „Inline-Hinweise“ behandelt und persistieren keine Sitzungseinstellungen.
    - In Nachrichten, die nur aus Direktiven bestehen (die Nachricht enthält nur Direktiven), werden sie in der Sitzung persistiert und mit einer Bestätigung beantwortet.
    - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige verwendete Zulassungsliste; andernfalls stammt die Autorisierung aus Kanal-Zulassungslisten/Pairing plus `commands.useAccessGroups`. Nicht autorisierte Absender sehen Direktiven als normalen Text behandelt.

  </Accordion>
  <Accordion title="Inline-Kurzbefehle">
    Nur für erlaubte/autorisierte Absender: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Sie werden sofort ausgeführt, entfernt, bevor das Modell die Nachricht sieht, und der verbleibende Text läuft durch den normalen Ablauf weiter.

  </Accordion>
</AccordionGroup>

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

<ParamField path="commands.text" type="boolean" default="true">
  Aktiviert das Parsen von `/...` in Chat-Nachrichten. Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle weiterhin, selbst wenn Sie dies auf `false` setzen.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registriert native Befehle. Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Anbieter ohne native Unterstützung. Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Anbieter zu überschreiben (bool oder `"auto"`). `false` entfernt beim Start zuvor registrierte Befehle auf Discord/Telegram. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registriert **Skill**-Befehle nativ, wenn dies unterstützt wird. Auto: an für Discord/Telegram; aus für Slack (Slack erfordert die Erstellung eines Slash-Befehls pro Skill). Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Anbieter zu überschreiben (bool oder `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Aktiviert `! <cmd>` zum Ausführen von Shell-Befehlen auf dem Host (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Zulassungslisten).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` legt sofort in den Hintergrund).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Aktiviert `/config` (liest/schreibt `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Aktiviert `/plugins` (Plugin-Erkennung/-Status plus Installations- und Aktivierungs-/Deaktivierungssteuerung).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Aktiviert `/debug` (nur Laufzeit-Überschreibungen).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` sowie Tool-Aktionen zum Neustarten des Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Setzt die explizite Owner-Zulassungsliste für nur für Owner bestimmte Befehls-/Tool-Oberflächen. Getrennt von `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Kanal: macht nur für Owner bestimmte Befehle auf dieser Oberfläche nur mit **Owner-Identität** ausführbar. Wenn `true`, muss der Absender entweder mit einem aufgelösten Owner-Kandidaten übereinstimmen (zum Beispiel ein Eintrag in `commands.ownerAllowFrom` oder anbieternative Owner-Metadaten) oder auf einem internen Nachrichtenkanal den internen Scope `operator.admin` besitzen. Ein Wildcard-Eintrag in kanalbezogenem `allowFrom` oder eine leere/nicht aufgelöste Liste von Owner-Kandidaten ist **nicht** ausreichend — nur für Owner bestimmte Befehle schlagen auf diesem Kanal standardmäßig fehl. Lassen Sie dies deaktiviert, wenn nur für Owner bestimmte Befehle lediglich durch `ownerAllowFrom` und die standardmäßigen Befehls-Zulassungslisten geschützt werden sollen.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Owner-IDs im System-Prompt erscheinen.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Setzt optional das HMAC-Secret, das verwendet wird, wenn `commands.ownerDisplay="hash"` gesetzt ist.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Anbieterbezogene Zulassungsliste für die Befehlsautorisierung. Wenn konfiguriert, ist sie die einzige Autorisierungsquelle für Befehle und Direktiven (Kanal-Zulassungslisten/Pairing und `commands.useAccessGroups` werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; anbieterspezifische Schlüssel überschreiben diesen.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Erzwingt Zulassungslisten/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.
</ParamField>

## Befehlsliste

Aktuelle Quelle der Wahrheit:

- Core-Built-ins stammen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle stammen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle stammen aus Plugin-Aufrufen von `registerCommand()`
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurationsflags, der Kanaloberfläche und installierten/aktivierten Plugins ab

### Integrierte Core-Befehle

<AccordionGroup>
  <Accordion title="Sitzungen und Läufe">
    - `/new [model]` startet eine neue Sitzung; `/reset` ist der Reset-Alias.
    - `/reset soft [message]` behält das aktuelle Transkript, verwirft wiederverwendete CLI-Backend-Sitzungs-IDs und führt das Laden von Startup-/System-Prompt direkt erneut aus.
    - `/compact [instructions]` kompaktiert den Sitzungskontext. Siehe [Compaction](/de/concepts/compaction).
    - `/stop` bricht den aktuellen Lauf ab.
    - `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten den Ablauf der Thread-Bindung.
    - `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
    - `/export-trajectory [path]` exportiert ein JSONL-[Trajectory-Bundle](/de/tools/trajectory) für die aktuelle Sitzung. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Modell- und Laufsteuerung">
    - `/think <level>` setzt die Thinking-Stufe. Die Optionen stammen aus dem Anbieterprofil des aktiven Modells; gängige Stufen sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Stufen wie `xhigh`, `adaptive`, `max` oder binärem `on` nur dort, wo sie unterstützt werden. Aliasse: `/thinking`, `/t`.
    - `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
    - `/trace on|off` schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
    - `/fast [status|on|off]` zeigt den Fast-Modus an oder setzt ihn.
    - `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` schaltet den Elevated-Modus um. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt Exec-Standardwerte an oder setzt sie.
    - `/model [name|#|status]` zeigt das Modell an oder setzt es.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` listet Anbieter oder Modelle für einen Anbieter auf.
    - `/queue <mode>` verwaltet das Queue-Verhalten (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus Optionen wie `debounce:2s cap:25 drop:summarize`.

  </Accordion>
  <Accordion title="Erkennung und Status">
    - `/help` zeigt die kurze Hilfeübersicht an.
    - `/commands` zeigt den generierten Befehlskatalog an.
    - `/tools [compact|verbose]` zeigt, was der aktuelle Agent gerade verwenden kann.
    - `/status` zeigt Ausführungs-/Laufzeitstatus an, einschließlich der Bezeichnungen `Execution`/`Runtime` und Anbieter-Nutzung/Kontingent, falls verfügbar.
    - `/crestodian <request>` führt den Crestodian-Einrichtungs- und Reparaturhelfer aus einer Owner-DM aus.
    - `/tasks` listet aktive/aktuelle Hintergrundaufgaben für die aktuelle Sitzung auf.
    - `/context [list|detail|json]` erklärt, wie Kontext zusammengesetzt wird.
    - `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
    - `/usage off|tokens|full|cost` steuert die Nutzungsfußzeile pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.

  </Accordion>
  <Accordion title="Skills, Zulassungslisten, Freigaben">
    - `/skill <name> [input]` führt einen Skill nach Name aus.
    - `/allowlist [list|add|remove] ...` verwaltet Einträge in Zulassungslisten. Nur Text.
    - `/approve <id> <decision>` löst Exec-Freigabeaufforderungen auf.
    - `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Siehe [BTW](/de/tools/btw).

  </Accordion>
  <Accordion title="Unteragenten und ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` verwaltet Unteragent-Läufe für die aktuelle Sitzung.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
    - `/focus <target>` bindet den aktuellen Discord-Thread oder das aktuelle Telegram-Thema/Gespräch an ein Sitzungsziel.
    - `/unfocus` entfernt die aktuelle Bindung.
    - `/agents` listet threadgebundene Agenten für die aktuelle Sitzung auf.
    - `/kill <id|#|all>` bricht einen oder alle laufenden Unteragenten ab.
    - `/steer <id|#> <message>` sendet Steuerung an einen laufenden Unteragenten. Alias: `/tell`.

  </Accordion>
  <Accordion title="Nur für Owner bestimmte Schreibzugriffe und Administration">
    - `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur für Owner. Erfordert `commands.config: true`.
    - `/mcp show|get|set|unset` liest oder schreibt von OpenClaw verwaltete MCP-Server-Konfiguration unter `mcp.servers`. Nur für Owner. Erfordert `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` prüft oder verändert den Plugin-Status. `/plugin` ist ein Alias. Schreibzugriffe nur für Owner. Erfordert `commands.plugins: true`.
    - `/debug show|set|unset|reset` verwaltet nur Laufzeit-Konfigurationsüberschreibungen. Nur für Owner. Erfordert `commands.debug: true`.
    - `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um dies zu deaktivieren.
    - `/send on|off|inherit` setzt die Send-Richtlinie. Nur für Owner.

  </Accordion>
  <Accordion title="Sprache, TTS, Kanalsteuerung">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steuert TTS. Siehe [TTS](/de/tools/tts).
    - `/activation mention|always` setzt den Aktivierungsmodus für Gruppen.
    - `/bash <command>` führt einen Shell-Befehl auf dem Host aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus `tools.elevated`-Zulassungslisten.
    - `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
    - `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

  </Accordion>
</AccordionGroup>

### Generierte Dock-Befehle

Dock-Befehle werden aus Kanal-Plugins mit nativer Befehlsunterstützung generiert. Aktuell gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

### Befehle gebündelter Plugins

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet den Flow für Gerätepaarung/-einrichtung. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend risikoreiche Phone-Node-Befehle.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Konfiguration der Talk-Stimme. Auf Discord lautet der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Voreinstellungen. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` prüft und steuert die gebündelte Codex-App-Server-Harness. Siehe [Codex-Harness](/de/plugins/codex-harness).
- Nur für QQBot verfügbare Befehle:
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

<AccordionGroup>
  <Accordion title="Hinweise zu Argumenten und Parser">
    - Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Anbieternamen (unscharfer Abgleich); wenn nichts passt, wird der Text als Nachrichtentext behandelt.
    - Für die vollständige Aufschlüsselung der Anbieternutzung verwenden Sie `openclaw status --usage`.
    - `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt kanalbezogenes `configWrites`.
    - In Kanälen mit mehreren Konten berücksichtigen konfigurationsbezogenes `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` auch `configWrites` des Zielkontos.
    - `/usage` steuert die Nutzungsfußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs aus.
    - `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um ihn zu deaktivieren.
    - `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
    - `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und fordert möglicherweise zu einem Neustart auf.

  </Accordion>
  <Accordion title="Kanalspezifisches Verhalten">
    - Nur auf Discord verfügbarer nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (nicht als Text verfügbar). `join` erfordert eine Guild und einen ausgewählten Sprach-/Stage-Kanal. Erfordert `channels.discord.voice` und native Befehle.
    - Discord-Befehle für Thread-Bindung (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindungen aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
    - ACP-Befehlsreferenz und Laufzeitverhalten: [ACP-Agenten](/de/tools/acp-agents).

  </Accordion>
  <Accordion title="Sicherheit von Verbose / Trace / Fast / Reasoning">
    - `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es im normalen Gebrauch **ausgeschaltet**.
    - `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen und lässt normale ausführliche Tool-Ausgaben ausgeschaltet.
    - `/fast on|off` persistiert eine sitzungsbezogene Überschreibung. Verwenden Sie in der Sitzungs-UI die Option `inherit`, um sie zu entfernen und auf die Standardwerte der Konfiguration zurückzufallen.
    - `/fast` ist anbieterspezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Traffic an `api.anthropic.com`, es `service_tier=auto` oder `standard_only` zuordnen. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
    - Zusammenfassungen von Tool-Fehlern werden bei Relevanz weiterhin angezeigt, aber detaillierter Fehlertext wird nur aufgenommen, wenn `/verbose` auf `on` oder `full` steht.
    - `/reasoning`, `/verbose` und `/trace` sind in Gruppeneinstellungen riskant: Sie können internes Reasoning, Tool-Ausgaben oder Plugin-Diagnostik offenlegen, die Sie nicht beabsichtigt freizugeben. Lassen Sie sie bevorzugt ausgeschaltet, insbesondere in Gruppenchats.

  </Accordion>
  <Accordion title="Modellwechsel">
    - `/model` persistiert das neue Sitzungsmodell sofort.
    - Wenn der Agent inaktiv ist, verwendet der nächste Lauf es unmittelbar.
    - Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Retry-Punkt in das neue Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Retry-Gelegenheit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
    - Im lokalen TUI wechselt `/crestodian [request]` vom normalen Agent-TUI zurück zu Crestodian. Dies ist getrennt vom Rescue-Modus des Nachrichtenkanals und gewährt keine entfernte Konfigurationsautorität.

  </Accordion>
  <Accordion title="Fast Path und Inline-Kurzbefehle">
    - **Fast Path:** Nachrichten nur mit Befehlen von erlaubten Absendern werden sofort verarbeitet (Queue + Modell werden umgangen).
    - **Gruppen-Erwähnungs-Gating:** Nachrichten nur mit Befehlen von erlaubten Absendern umgehen die Anforderungen an Erwähnungen.
    - **Inline-Kurzbefehle (nur erlaubte Absender):** Bestimmte Befehle funktionieren auch eingebettet in einer normalen Nachricht und werden entfernt, bevor das Modell den verbleibenden Text sieht.
      - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft durch den normalen Ablauf weiter.
    - Aktuell: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nicht autorisierte Nachrichten nur mit Befehlen werden stillschweigend ignoriert, und Inline-Tokens `/...` werden als normaler Text behandelt.

  </Accordion>
  <Accordion title="Skill-Befehle und native Argumente">
    - **Skill-Befehle:** `user-invocable` Skills werden als Slash-Befehle bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (maximal 32 Zeichen); Kollisionen erhalten numerische Suffixe (z. B. `_2`).
      - `/skill <name> [input]` führt einen Skill nach Name aus (nützlich, wenn native Befehlsgrenzen Befehle pro Skill verhindern).
      - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
      - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu routen (deterministisch, kein Modell).
      - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
    - **Native Befehlsargumente:** Discord verwendet Autocomplete für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü an, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen. Dynamische Auswahlmöglichkeiten werden gegen das Ziel-Sitzungsmodell aufgelöst, sodass modellspezifische Optionen wie `/think`-Stufen der `/model`-Überschreibung dieser Sitzung folgen.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent genau jetzt in dieser Unterhaltung verwenden kann**.

- Standardmäßig ist `/tools` kompakt und für schnelles Scannen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, bieten denselben Moduswechsel als `compact|verbose`.
- Ergebnisse sind sitzungsbezogen, daher können Änderungen von Agent, Kanal, Thread, Absenderautorisierung oder Modell die Ausgabe verändern.
- `/tools` umfasst Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Core-Tools, verbundener Plugin-Tools und kanalbezogener Tools.

Für das Bearbeiten von Profilen und Überschreibungen verwenden Sie das Tools-Panel der Control UI oder Konfigurations-/Katalogoberflächen, anstatt `/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Anbieternutzung/-kontingent** (Beispiel: „Claude 80% left“) wird in `/status` für den aktuellen Modellanbieter angezeigt, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Anbieterfenster auf `% left`; bei MiniMax werden Prozentfelder mit nur verbleibendem Anteil vor der Anzeige invertiert, und Antworten mit `model_remains` bevorzugen den Eintrag des Chat-Modells plus eine mit dem Modell getaggte Planbezeichnung.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungseintrag im Transkript zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und der Fallback auf das Transkript kann auch die aktive Laufzeitmodellbezeichnung plus eine größere promptorientierte Gesamtsumme wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Ausführung vs. Laufzeit:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` für die Instanz, die die Sitzung tatsächlich ausführt: `OpenClaw Pi Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Tokens/Kosten pro Antwort** werden über `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- Bei `/model status` geht es um **Modelle/Auth/Endpunkte**, nicht um Nutzung.

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
- Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Dropdowns für Anbieter und Modell plus einem Absende-Schritt.
- `/model <#>` wählt aus dieser Auswahl aus (und bevorzugt wenn möglich den aktuellen Anbieter).
- `/model status` zeigt die Detailansicht, einschließlich des konfigurierten Anbieter-Endpunkts (`baseUrl`) und des API-Modus (`api`), sofern verfügbar.

## Debug-Überschreibungen

Mit `/debug` können Sie **nur Laufzeit-**Konfigurationsüberschreibungen setzen (Arbeitsspeicher, nicht Datenträger). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie sie mit `commands.debug: true`.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Überschreibungen werden sofort auf neue Konfigurationslesevorgänge angewendet, schreiben aber **nicht** in `openclaw.json`. Verwenden Sie `/debug reset`, um alle Überschreibungen zu löschen und zur Konfiguration auf dem Datenträger zurückzukehren.
</Note>

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
- Plugin-Trace-Zeilen können in `/status` und als diagnostische Folgemeldung nach der normalen Assistant-Antwort erscheinen.
- `/trace` ersetzt `/debug` nicht; `/debug` verwaltet weiterhin nur Laufzeit-Konfigurationsüberschreibungen.
- `/trace` ersetzt `/verbose` nicht; normale ausführliche Tool-/Statusausgaben gehören weiterhin zu `/verbose`.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf dem Datenträger (`openclaw.json`). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie sie mit `commands.config: true`.

Beispiele:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Die Konfiguration wird vor dem Schreiben validiert; ungültige Änderungen werden abgelehnt. `/config`-Aktualisierungen bleiben über Neustarts hinweg erhalten.
</Note>

## MCP-Aktualisierungen

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie sie mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` speichert Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen. Laufzeitadapter entscheiden, welche Transporte tatsächlich ausführbar sind.
</Note>

## Plugin-Aktualisierungen

Mit `/plugins` können Operatoren erkannte Plugins prüfen und ihre Aktivierung in der Konfiguration umschalten. Schreibgeschützte Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie sie mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung gegen den aktuellen Workspace plus die Konfiguration auf dem Datenträger.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden dadurch nicht installiert oder deinstalliert.
- Starten Sie nach Änderungen mit enable/disable das Gateway neu, um sie anzuwenden.

</Note>

## Hinweise zu Oberflächen

<AccordionGroup>
  <Accordion title="Sitzungen pro Oberfläche">
    - **Textbefehle** laufen in der normalen Chat-Sitzung (DMs teilen sich `main`, Gruppen haben ihre eigene Sitzung).
    - **Native Befehle** verwenden isolierte Sitzungen:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix über `channels.slack.slashCommand.sessionPrefix` konfigurierbar)
      - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
    - **`/stop`** zielt auf die aktive Chat-Sitzung, damit der aktuelle Lauf abgebrochen werden kann.

  </Accordion>
  <Accordion title="Slack-spezifische Hinweise">
    `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie pro integriertem Befehl einen Slack-Slash-Befehl erstellen (mit denselben Namen wie bei `/help`). Menüs für Befehlsargumente in Slack werden als ephemere Block-Kit-Buttons bereitgestellt.

    Native Slack-Ausnahme: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert in Slack-Nachrichten weiterhin.

  </Accordion>
</AccordionGroup>

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Anders als normaler Chat:

- verwendet es die aktuelle Sitzung als Hintergrundkontext,
- läuft es als separater **toolloser** One-Shot-Aufruf,
- ändert es nicht den zukünftigen Sitzungskontext,
- wird es nicht in die Transkript-History geschrieben,
- wird es als Live-Nebenergebnis statt als normale Assistant-Nachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klärung möchten, während die Hauptaufgabe weiterläuft.

Beispiel:

```text
/btw what are we doing right now?
```

Siehe [BTW-Nebenfragen](/de/tools/btw) für das vollständige Verhalten und Details zur Client-UX.

## Verwandt

- [Skills erstellen](/de/tools/creating-skills)
- [Skills](/de/tools/skills)
- [Skills-Konfiguration](/de/tools/skills-config)
