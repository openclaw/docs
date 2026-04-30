---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Fehlerbehebung beim Befehlsrouting oder bei Berechtigungen
sidebarTitle: Slash commands
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-30T07:19:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt. Der host-only bash-Chatbefehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung oder ein Thread an eine ACP-Sitzung gebunden ist, wird normaler Folgetext an dieses ACP-Harness weitergeleitet. Gateway-Verwaltungsbefehle bleiben weiterhin lokal: `/acp ...` erreicht immer den OpenClaw ACP-Befehlshandler, und `/status` sowie `/unfocus` bleiben lokal, wenn die Befehlsverarbeitung für die Oberfläche aktiviert ist.

Es gibt zwei verwandte Systeme:

<AccordionGroup>
  <Accordion title="Befehle">
    Eigenständige `/...`-Nachrichten.
  </Accordion>
  <Accordion title="Direktiven">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
    - In normalen Chatnachrichten (nicht nur Direktiven) werden sie als „Inline-Hinweise“ behandelt und speichern **keine** Sitzungseinstellungen dauerhaft.
    - In Nachrichten, die nur Direktiven enthalten (die Nachricht enthält ausschließlich Direktiven), werden sie dauerhaft in der Sitzung gespeichert und mit einer Bestätigung beantwortet.
    - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige verwendete Allowlist; andernfalls ergibt sich die Autorisierung aus Kanal-Allowlists/Pairing plus `commands.useAccessGroups`. Nicht autorisierte Absender sehen Direktiven als normalen Text behandelt.

  </Accordion>
  <Accordion title="Inline-Kurzbefehle">
    Nur für Absender in Allowlists/autorisierte Absender: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Aktiviert das Parsen von `/...` in Chatnachrichten. Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle weiterhin, selbst wenn Sie dies auf `false` setzen.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registriert native Befehle. Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Provider ohne native Unterstützung. Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um dies pro Provider zu überschreiben (bool oder `"auto"`). `false` löscht zuvor registrierte Befehle auf Discord/Telegram beim Start. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registriert **Skill**-Befehle nativ, wenn unterstützt. Auto: an für Discord/Telegram; aus für Slack (Slack erfordert das Erstellen eines Slash-Befehls pro Skill). Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um dies pro Provider zu überschreiben (bool oder `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Aktiviert `! <cmd>`, um Host-Shell-Befehle auszuführen (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Steuert, wie lange bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` verschiebt sofort in den Hintergrund).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Aktiviert `/config` (liest/schreibt `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Aktiviert `/plugins` (Plugin-Erkennung/-Status plus Installations- und Aktivieren/Deaktivieren-Steuerungen).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Aktiviert `/debug` (nur Laufzeit-Overrides).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` plus Gateway-Neustart-Toolaktionen.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Legt die explizite Owner-Allowlist für befehls-/toolbezogene Oberflächen fest, die nur dem Owner vorbehalten sind. Dies ist das menschliche Operator-Konto, das gefährliche Aktionen genehmigen und Befehle wie `/diagnostics`, `/export-trajectory` und `/config` ausführen kann. Es ist getrennt von `commands.allowFrom` und vom DM-Pairing-Zugriff.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Kanal: sorgt dafür, dass Owner-only-Befehle **Owner-Identität** erfordern, um auf dieser Oberfläche ausgeführt zu werden. Wenn `true`, muss der Absender entweder einem aufgelösten Owner-Kandidaten entsprechen (zum Beispiel einem Eintrag in `commands.ownerAllowFrom` oder provider-nativen Owner-Metadaten) oder auf einem internen Nachrichtenkanal den internen Scope `operator.admin` besitzen. Ein Wildcard-Eintrag in der Kanal-`allowFrom` oder eine leere/nicht aufgelöste Owner-Kandidatenliste ist **nicht** ausreichend — Owner-only-Befehle schlagen auf diesem Kanal geschlossen fehl. Lassen Sie dies deaktiviert, wenn Owner-only-Befehle nur durch `ownerAllowFrom` und die Standard-Befehls-Allowlists abgesichert werden sollen.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Owner-IDs im System-Prompt erscheinen.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Legt optional das HMAC-Secret fest, das verwendet wird, wenn `commands.ownerDisplay="hash"` ist.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Pro-Provider-Allowlist für Befehlsautorisierung. Wenn konfiguriert, ist sie die einzige Autorisierungsquelle für Befehle und Direktiven (Kanal-Allowlists/Pairing und `commands.useAccessGroups` werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; providerspezifische Schlüssel überschreiben ihn.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.
</ParamField>

## Befehlsliste

Aktuelle Source of Truth:

- Core-Built-ins stammen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle stammen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle stammen aus Plugin-`registerCommand()`-Aufrufen
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurationsflags, Kanaloberfläche und installierten/aktivierten Plugins ab

### Core-Built-in-Befehle

<AccordionGroup>
  <Accordion title="Sitzungen und Ausführungen">
    - `/new [model]` startet eine neue Sitzung; `/reset` ist der Reset-Alias.
    - `/reset soft [message]` behält das aktuelle Transkript, verwirft wiederverwendete CLI-Backend-Sitzungs-IDs und führt das Laden von Start/System-Prompt direkt erneut aus.
    - `/compact [instructions]` führt eine Compaction des Sitzungskontexts durch. Siehe [Compaction](/de/concepts/compaction).
    - `/stop` bricht die aktuelle Ausführung ab.
    - `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten den Ablauf von Thread-Bindungen.
    - `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
    - `/export-trajectory [path]` fordert eine exec-Genehmigung an und exportiert dann ein JSONL-[Trajectory-Bundle](/de/tools/trajectory) für die aktuelle Sitzung. Verwenden Sie dies, wenn Sie Prompt-, Tool- und Transkript-Zeitachse für eine OpenClaw-Sitzung benötigen. In Gruppenchats gehen Genehmigungs-Prompt und Exportergebnis privat an den Owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Modell- und Ausführungssteuerungen">
    - `/think <level>` legt die Denkstufe fest. Optionen stammen aus dem Provider-Profil des aktiven Modells; häufige Stufen sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Stufen wie `xhigh`, `adaptive`, `max` oder binärem `on` nur dort, wo unterstützt. Aliasse: `/thinking`, `/t`.
    - `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
    - `/trace on|off` schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
    - `/fast [status|on|off]` zeigt oder setzt den Schnellmodus.
    - `/reasoning [on|off|stream]` schaltet die Sichtbarkeit des Reasonings um. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` schaltet den erhöhten Modus um. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt oder setzt exec-Standardwerte.
    - `/model [name|#|status]` zeigt oder setzt das Modell.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` listet konfigurierte/authentifizierungsverfügbare Provider oder Modelle für einen Provider auf; fügen Sie `all` hinzu, um den vollständigen Katalog dieses Providers zu durchsuchen.
    - `/queue <mode>` verwaltet das Queue-Verhalten (`steer`, Legacy-`queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus Optionen wie `debounce:0.5s cap:25 drop:summarize`; `/queue default` oder `/queue reset` löscht den Sitzungs-Override. Siehe [Command queue](/de/concepts/queue) und [Steering queue](/de/concepts/queue-steering).

  </Accordion>
  <Accordion title="Erkennung und Status">
    - `/help` zeigt die kurze Hilfezusammenfassung.
    - `/commands` zeigt den generierten Befehlskatalog.
    - `/tools [compact|verbose]` zeigt, was der aktuelle Agent gerade verwenden kann.
    - `/status` zeigt Ausführungs-/Laufzeitstatus, einschließlich der Labels `Execution`/`Runtime` und Provider-Nutzung/-Kontingent, wenn verfügbar.
    - `/diagnostics [note]` ist der Owner-only-Supportbericht-Ablauf für Gateway-Fehler und Codex-Harness-Ausführungen. Er fordert jedes Mal explizite exec-Genehmigung an, bevor `openclaw gateway diagnostics export --json` ausgeführt wird; genehmigen Sie Diagnosen nicht mit einer Allow-all-Regel. Nach der Genehmigung sendet er einen einfügbaren Bericht mit lokalem Bundle-Pfad, Manifest-Zusammenfassung, Datenschutzhinweisen und relevanten Sitzungs-IDs. In Gruppenchats gehen Genehmigungs-Prompt und Bericht privat an den Owner. Wenn die aktive Sitzung das OpenAI Codex-Harness verwendet, sendet dieselbe Genehmigung auch relevantes Codex-Feedback an OpenAI-Server, und die abgeschlossene Antwort listet die OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und `codex resume <thread-id>`-Befehle auf. Siehe [Diagnostics Export](/de/gateway/diagnostics).
    - `/crestodian <request>` führt den Crestodian-Einrichtungs- und Reparaturhelfer aus einer Owner-DM aus.
    - `/tasks` listet aktive/kürzliche Hintergrundaufgaben für die aktuelle Sitzung auf.
    - `/context [list|detail|json]` erklärt, wie Kontext zusammengesetzt wird.
    - `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
    - `/usage off|tokens|full|cost` steuert die Nutzungsfußzeile pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.

  </Accordion>
  <Accordion title="Skills, Allowlists, Genehmigungen">
    - `/skill <name> [input]` führt einen Skill anhand des Namens aus.
    - `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
    - `/approve <id> <decision>` löst exec-Genehmigungs-Prompts auf.
    - `/btw <question>` stellt eine Nebenfrage, ohne zukünftigen Sitzungskontext zu ändern. Siehe [BTW](/de/tools/btw).

  </Accordion>
  <Accordion title="Subagents und ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` verwaltet Sub-Agent-Ausführungen für die aktuelle Sitzung.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
    - `/focus <target>` bindet den aktuellen Discord-Thread oder das Telegram-Thema/die Telegram-Unterhaltung an ein Sitzungsziel.
    - `/unfocus` entfernt die aktuelle Bindung.
    - `/agents` listet threadgebundene Agents für die aktuelle Sitzung auf.
    - `/kill <id|#|all>` bricht einen oder alle laufenden Sub-Agents ab.
    - `/steer <id|#> <message>` sendet Steuerung an einen laufenden Sub-Agent. Alias: `/tell`.

  </Accordion>
  <Accordion title="Nur Owner: Schreibzugriffe und Administration">
    - `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur Owner. Erfordert `commands.config: true`.
    - `/mcp show|get|set|unset` liest oder schreibt die von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`. Nur Owner. Erfordert `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` prüft oder ändert den Plugin-Status. `/plugin` ist ein Alias. Schreibzugriffe nur für Owner. Erfordert `commands.plugins: true`.
    - `/debug show|set|unset|reset` verwaltet rein laufzeitbezogene Konfigurationsüberschreibungen. Nur Owner. Erfordert `commands.debug: true`.
    - `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
    - `/send on|off|inherit` legt die Senderichtlinie fest. Nur Owner.

  </Accordion>
  <Accordion title="Sprache, TTS, Kanalsteuerung">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steuert TTS. Siehe [TTS](/de/tools/tts).
    - `/activation mention|always` legt den Aktivierungsmodus für Gruppen fest.
    - `/bash <command>` führt einen Host-Shell-Befehl aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus `tools.elevated`-Allowlists.
    - `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
    - `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

  </Accordion>
</AccordionGroup>

### Generierte Dock-Befehle

Dock-Befehle schalten die Antwortroute der aktuellen Sitzung auf einen anderen verknüpften
Kanal um. Siehe [Kanal-Docking](/de/concepts/channel-docking) für Einrichtung,
Beispiele und Fehlerbehebung.

Dock-Befehle werden aus Kanal-Plugins mit Unterstützung für native Befehle generiert. Aktuell gebündeltes Set:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

Verwenden Sie Dock-Befehle aus einem Direktchat, um die Antwortroute der aktuellen Sitzung auf einen anderen verknüpften Kanal umzuschalten. Der Agent behält denselben Sitzungskontext bei, aber zukünftige Antworten für diese Sitzung werden an den ausgewählten Kanal-Peer zugestellt.

Dock-Befehle erfordern `session.identityLinks`. Der Quellabsender und der Ziel-Peer müssen in derselben Identitätsgruppe sein, zum Beispiel `["telegram:123", "discord:456"]`. Wenn ein Telegram-Benutzer mit der ID `123` `/dock_discord` sendet, speichert OpenClaw `lastChannel: "discord"` und `lastTo: "456"` in der aktiven Sitzung. Wenn der Absender nicht mit einem Discord-Peer verknüpft ist, antwortet der Befehl mit einem Einrichtungshinweis, statt in den normalen Chat durchzufallen.

Docking ändert nur die aktive Sitzungsroute. Es erstellt keine Kanalkonten, gewährt keinen Zugriff, umgeht keine Kanal-Allowlists und verschiebt keinen Transkriptverlauf in eine andere Sitzung. Verwenden Sie `/dock-telegram`, `/dock-slack`, `/dock-mattermost` oder einen anderen generierten Dock-Befehl, um die Route erneut umzuschalten.

### Gebündelte Plugin-Befehle

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory-Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet den Ablauf für Gerätekopplung und Einrichtung. Siehe [Kopplung](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend risikoreiche Befehle für Phone-Nodes.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Talk-Sprachkonfiguration. Auf Discord lautet der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Vorlagen. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` prüft und steuert den gebündelten Codex-App-Server-Harness. Siehe [Codex-Harness](/de/plugins/codex-harness).
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
- Die Registrierung nativer Skill-Befehle wird über `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.

<AccordionGroup>
  <Accordion title="Hinweise zu Argumenten und Parser">
    - Befehle akzeptieren optional ein `:` zwischen dem Befehl und den Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Provider-Namen (Fuzzy-Match); wenn es keinen Treffer gibt, wird der Text als Nachrichtentext behandelt.
    - Für die vollständige Aufschlüsselung der Provider-Nutzung verwenden Sie `openclaw status --usage`.
    - `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt `configWrites` des Kanals.
    - In Kanälen mit mehreren Konten berücksichtigen konfigurationsbezogene `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` ebenfalls `configWrites` des Zielkontos.
    - `/usage` steuert die Nutzungsfußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenübersicht aus OpenClaw-Sitzungslogs aus.
    - `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
    - `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
    - `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und kann zu einem Neustart auffordern.

  </Accordion>
  <Accordion title="Kanalspezifisches Verhalten">
    - Nur Discord, nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (nicht als Text verfügbar). `join` erfordert eine Guild und einen ausgewählten Sprach-/Stage-Kanal. Erfordert `channels.discord.voice` und native Befehle.
    - Discord-Befehle für Thread-Bindungen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass wirksame Thread-Bindungen aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
    - ACP-Befehlsreferenz und Laufzeitverhalten: [ACP-Agenten](/de/tools/acp-agents).

  </Accordion>
  <Accordion title="Ausführlich / Trace / Schnell / Reasoning-Sicherheit">
    - `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es bei normaler Verwendung **aus**.
    - `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen und lässt normales ausführliches Tool-Rauschen ausgeschaltet.
    - `/fast on|off` speichert eine Sitzungsüberschreibung dauerhaft. Verwenden Sie in der Sitzungs-UI die Option `inherit`, um sie zu löschen und auf die Konfigurationsstandards zurückzufallen.
    - `/fast` ist Provider-spezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich per OAuth authentifiziertem Traffic an `api.anthropic.com`, es `service_tier=auto` oder `standard_only` zuordnen. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
    - Tool-Fehlerzusammenfassungen werden bei Relevanz weiterhin angezeigt, aber detaillierter Fehlertext wird nur aufgenommen, wenn `/verbose` `on` oder `full` ist.
    - `/reasoning`, `/verbose` und `/trace` sind in Gruppenumgebungen riskant: Sie können internes Reasoning, Tool-Ausgaben oder Plugin-Diagnosen offenlegen, die Sie nicht preisgeben wollten. Lassen Sie sie vorzugsweise ausgeschaltet, besonders in Gruppenchats.

  </Accordion>
  <Accordion title="Modellwechsel">
    - `/model` speichert das neue Sitzungsmodell sofort dauerhaft.
    - Wenn der Agent inaktiv ist, verwendet der nächste Lauf es sofort.
    - Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt mit dem neuen Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zum nächsten Benutzerzug warten.
    - In der lokalen TUI kehrt `/crestodian [request]` von der normalen Agent-TUI zu Crestodian zurück. Dies ist getrennt vom Rettungsmodus für Nachrichtenkanäle und gewährt keine entfernte Konfigurationsberechtigung.

  </Accordion>
  <Accordion title="Schneller Pfad und Inline-Kurzbefehle">
    - **Schneller Pfad:** Nachrichten, die nur aus Befehlen bestehen, von Absendern auf der Allowlist werden sofort verarbeitet (umgehen Warteschlange + Modell).
    - **Gruppenerwähnungs-Gating:** Nachrichten, die nur aus Befehlen bestehen, von Absendern auf der Allowlist umgehen Erwähnungsanforderungen.
    - **Inline-Kurzbefehle (nur Absender auf der Allowlist):** Bestimmte Befehle funktionieren auch eingebettet in einer normalen Nachricht und werden entfernt, bevor das Modell den verbleibenden Text sieht.
      - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft weiter durch den normalen Ablauf.
    - Derzeit: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nicht autorisierte Nachrichten, die nur aus Befehlen bestehen, werden stillschweigend ignoriert, und Inline-`/...`-Tokens werden als reiner Text behandelt.

  </Accordion>
  <Accordion title="Skill-Befehle und native Argumente">
    - **Skill-Befehle:** `user-invocable` Skills werden als Slash-Befehle bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); Kollisionen erhalten numerische Suffixe (z. B. `_2`).
      - `/skill <name> [input]` führt einen Skill nach Namen aus (nützlich, wenn native Befehlsgrenzen Befehle pro Skill verhindern).
      - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
      - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu routen (deterministisch, kein Modell).
      - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
    - **Native Befehlsargumente:** Discord verwendet Autovervollständigung für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente auslassen). Telegram und Slack zeigen ein Button-Menü, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument auslassen. Dynamische Auswahlmöglichkeiten werden gegen das Ziel-Sitzungsmodell aufgelöst, sodass modellspezifische Optionen wie `/think`-Stufen der `/model`-Überschreibung dieser Sitzung folgen.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent jetzt in dieser Unterhaltung verwenden kann**.

- Standard-`/tools` ist kompakt und für schnelles Scannen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Native Befehlsoberflächen, die Argumente unterstützen, stellen denselben Moduswechsel als `compact|verbose` bereit.
- Ergebnisse sind sitzungsbezogen, sodass ein Wechsel von Agent, Kanal, Thread, Absenderautorisierung oder Modell die Ausgabe ändern kann.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Kern-Tools, verbundener Plugin-Tools und kanaleigener Tools.

Für Profil- und Überschreibungsbearbeitung verwenden Sie das Tools-Panel der Control-UI oder Konfigurations-/Katalogoberflächen, statt `/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Provider-Nutzung/Kontingent** (Beispiel: "Claude 80% left") wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn Nutzungserfassung aktiviert ist. OpenClaw normalisiert Provider-Fenster auf `% left`; bei MiniMax werden Prozentfelder, die nur verbleibende Werte angeben, vor der Anzeige invertiert, und `model_remains`-Antworten bevorzugen den Chat-Modell-Eintrag plus ein modellgetaggtes Plan-Label.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Transkript-Nutzungseintrag zurückfallen, wenn der Live-Sitzungssnapshot spärlich ist. Vorhandene Live-Werte ungleich null gewinnen weiterhin, und der Transkript-Fallback kann außerdem das aktive Laufzeitmodell-Label plus eine größere promptorientierte Summe wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Ausführung vs. Laufzeit:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` dafür, wer die Sitzung tatsächlich ausführt: `OpenClaw Pi Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Token/Kosten pro Antwort** werden durch `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- `/model status` betrifft **Modelle/Auth/Endpunkte**, nicht Nutzung.

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

- `/model` und `/model list` zeigen eine kompakte, nummerierte Auswahl (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Provider- und Modell-Dropdowns plus einem Absenden-Schritt.
- `/model <#>` wählt aus dieser Auswahl aus (und bevorzugt den aktuellen Provider, wenn möglich).
- `/model status` zeigt die Detailansicht, einschließlich konfiguriertem Provider-Endpunkt (`baseUrl`) und API-Modus (`api`), sofern verfügbar.

## Debug-Überschreibungen

`/debug` erlaubt Ihnen, **nur zur Laufzeit geltende** Konfigurationsüberschreibungen festzulegen (Speicher, nicht Datenträger). Nur für Owner. Standardmäßig deaktiviert; mit `commands.debug: true` aktivieren.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Überschreibungen gelten sofort für neue Konfigurationslesevorgänge, schreiben aber **nicht** in `openclaw.json`. Verwenden Sie `/debug reset`, um alle Überschreibungen zu löschen und zur Konfiguration auf dem Datenträger zurückzukehren.
</Note>

## Plugin-Trace-Ausgabe

`/trace` erlaubt Ihnen, **sitzungsbezogene Plugin-Trace-/Debug-Zeilen** umzuschalten, ohne den vollständigen ausführlichen Modus zu aktivieren.

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
- Plugin-Trace-Zeilen können in `/status` und als nachfolgende Diagnosemeldung nach der normalen Assistentenantwort erscheinen.
- `/trace` ersetzt `/debug` nicht; `/debug` verwaltet weiterhin nur zur Laufzeit geltende Konfigurationsüberschreibungen.
- `/trace` ersetzt `/verbose` nicht; normale ausführliche Tool-/Statusausgaben gehören weiterhin zu `/verbose`.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf dem Datenträger (`openclaw.json`). Nur für Owner. Standardmäßig deaktiviert; mit `commands.config: true` aktivieren.

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

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur für Owner. Standardmäßig deaktiviert; mit `commands.mcp: true` aktivieren.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen. Laufzeitadapter entscheiden, welche Transporte tatsächlich ausführbar sind.
</Note>

## Plugin-Aktualisierungen

`/plugins` erlaubt Operatoren, erkannte Plugins zu prüfen und die Aktivierung in der Konfiguration umzuschalten. Schreibgeschützte Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; mit `commands.plugins: true` aktivieren.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung für den aktuellen Arbeitsbereich plus Konfiguration auf dem Datenträger.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden dadurch weder installiert noch deinstalliert.
- Starten Sie nach Aktivierungs-/Deaktivierungsänderungen den Gateway neu, damit sie angewendet werden.

</Note>

## Hinweise zu Oberflächen

<AccordionGroup>
  <Accordion title="Sitzungen pro Oberfläche">
    - **Textbefehle** laufen in der normalen Chatsitzung (DMs teilen sich `main`, Gruppen haben ihre eigene Sitzung).
    - **Native Befehle** verwenden isolierte Sitzungen:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chatsitzung)
    - **`/stop`** zielt auf die aktive Chatsitzung, damit der aktuelle Lauf abgebrochen werden kann.

  </Accordion>
  <Accordion title="Slack-Besonderheiten">
    `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie pro integriertem Befehl einen Slack-Slash-Befehl erstellen (dieselben Namen wie in `/help`). Befehlsargumentmenüs für Slack werden als flüchtige Block-Kit-Schaltflächen bereitgestellt.

    Ausnahme bei nativen Slack-Befehlen: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert weiterhin in Slack-Nachrichten.

  </Accordion>
</AccordionGroup>

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Im Gegensatz zum normalen Chat:

- verwendet sie die aktuelle Sitzung als Hintergrundkontext,
- läuft sie als separater **tool-loser** einmaliger Aufruf,
- ändert sie den zukünftigen Sitzungskontext nicht,
- wird sie nicht in den Transkriptverlauf geschrieben,
- wird sie als Live-Nebenergebnis statt als normale Assistentennachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klärung wünschen, während die Hauptaufgabe weiterläuft.

Beispiel:

```text
/btw what are we doing right now?
```

Vollständiges Verhalten und Details zur Client-UX finden Sie unter [BTW-Nebenfragen](/de/tools/btw).

## Verwandte Themen

- [Skills erstellen](/de/tools/creating-skills)
- [Skills](/de/tools/skills)
- [Skills-Konfiguration](/de/tools/skills-config)
