---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Debugging von Befehlsrouting oder Berechtigungen
sidebarTitle: Slash commands
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-05-11T20:38:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt. Der host-only Bash-Chatbefehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung oder ein Thread an eine ACP-Sitzung gebunden ist, wird normaler Follow-up-Text an dieses ACP-Harness weitergeleitet. Gateway-Verwaltungsbefehle bleiben weiterhin lokal: `/acp ...` erreicht immer den OpenClaw-ACP-Befehlshandler, und `/status` sowie `/unfocus` bleiben lokal, wenn die Befehlsverarbeitung für die Oberfläche aktiviert ist.

Es gibt zwei verwandte Systeme:

<AccordionGroup>
  <Accordion title="Commands">
    Eigenständige `/...`-Nachrichten.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directives werden aus der Nachricht entfernt, bevor das Modell sie sieht.
    - In normalen Chatnachrichten (nicht nur Directives) werden sie als „Inline-Hinweise“ behandelt und speichern **keine** Sitzungseinstellungen dauerhaft.
    - In Nachrichten, die nur Directives enthalten (die Nachricht enthält ausschließlich Directives), werden sie in der Sitzung gespeichert und mit einer Bestätigung beantwortet.
    - Directives werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige verwendete Allowlist; andernfalls ergibt sich die Autorisierung aus Channel-Allowlists/Pairing plus `commands.useAccessGroups`. Nicht autorisierte Absender sehen Directives als einfachen Text behandelt.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Nur für Absender auf der Allowlist/autorisierte Absender: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Aktiviert das Parsen von `/...` in Chatnachrichten. Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle weiterhin, auch wenn Sie dies auf `false` setzen.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registriert native Befehle. Auto: aktiv für Discord/Telegram; inaktiv für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Provider ohne native Unterstützung. Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um dies pro Provider zu überschreiben (bool oder `"auto"`). Auf Discord überspringt `false` die Registrierung und Bereinigung von Slash-Befehlen beim Start; zuvor registrierte Befehle können sichtbar bleiben, bis Sie sie aus der Discord-App entfernen. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
</ParamField>
Auf Discord können native Befehlsspezifikationen `descriptionLocalizations` enthalten, die OpenClaw als Discord-`description_localizations` veröffentlicht und in Abgleichvergleiche einbezieht.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registriert **Skill**-Befehle nativ, wenn unterstützt. Auto: aktiv für Discord/Telegram; inaktiv für Slack (Slack erfordert das Erstellen eines Slash-Befehls pro Skill). Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um dies pro Provider zu überschreiben (bool oder `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Aktiviert `! <cmd>`, um Host-Shell-Befehle auszuführen (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` verschiebt sofort in den Hintergrund).
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
  Aktiviert `/debug` (nur Laufzeit-Overrides).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` plus Gateway-Neustart-Tool-Aktionen.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Legt die explizite Owner-Allowlist für owner-only Befehls-/Tool-Oberflächen fest. Dies ist das menschliche Operator-Konto, das gefährliche Aktionen genehmigen und Befehle wie `/diagnostics`, `/export-trajectory` und `/config` ausführen kann. Es ist von `commands.allowFrom` und vom DM-Pairing-Zugriff getrennt.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Channel: sorgt dafür, dass owner-only Befehle eine **Owner-Identität** erfordern, um auf dieser Oberfläche ausgeführt zu werden. Wenn `true`, muss der Absender entweder einem aufgelösten Owner-Kandidaten entsprechen (zum Beispiel einem Eintrag in `commands.ownerAllowFrom` oder provider-nativen Owner-Metadaten) oder den internen `operator.admin`-Scope auf einem internen Nachrichten-Channel besitzen. Ein Wildcard-Eintrag in der Channel-`allowFrom` oder eine leere/nicht aufgelöste Owner-Kandidatenliste ist **nicht** ausreichend — owner-only Befehle schlagen auf diesem Channel geschlossen fehl. Lassen Sie dies deaktiviert, wenn Sie möchten, dass owner-only Befehle nur durch `ownerAllowFrom` und die Standard-Befehls-Allowlists geschützt werden.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Owner-IDs im System-Prompt erscheinen.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Legt optional das HMAC-Secret fest, das verwendet wird, wenn `commands.ownerDisplay="hash"` ist.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Pro-Provider-Allowlist für die Befehlsautorisierung. Wenn konfiguriert, ist sie die einzige Autorisierungsquelle für Befehle und Directives (Channel-Allowlists/Pairing und `commands.useAccessGroups` werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; provider-spezifische Schlüssel überschreiben ihn.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.
</ParamField>

## Befehlsliste

Aktuelle Source of Truth:

- Core-Built-ins stammen aus `src/auto-reply/commands-registry.shared.ts`
- Generierte Dock-Befehle stammen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle stammen aus Plugin-`registerCommand()`-Aufrufen
- Die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurations-Flags, Channel-Oberfläche und installierten/aktivierten Plugins ab

### Integrierte Core-Befehle

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` startet eine neue Sitzung; `/reset` ist der Reset-Alias.
    - Die Control-UI fängt eingegebenes `/new` ab, um eine frische Dashboard-Sitzung zu erstellen und zu ihr zu wechseln, außer wenn `session.dmScope: "main"` konfiguriert ist und der aktuelle Parent die Hauptsitzung des Agenten ist; in diesem Fall setzt `/new` die Hauptsitzung direkt zurück. Eingegebenes `/reset` führt weiterhin den In-place-Reset des Gateway aus.
    - `/reset soft [message]` behält das aktuelle Transcript bei, verwirft wiederverwendete CLI-Backend-Sitzungs-IDs und führt das Laden von Start-/System-Prompt direkt erneut aus.
    - `/compact [instructions]` komprimiert den Sitzungskontext. Siehe [Compaction](/de/concepts/compaction).
    - `/stop` bricht den aktuellen Lauf ab.
    - `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten den Ablauf von Thread-Bindings.
    - `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
    - `/export-trajectory [path]` fragt nach exec-Genehmigung und exportiert dann ein JSONL-[Trajectory-Bundle](/de/tools/trajectory) für die aktuelle Sitzung. Verwenden Sie es, wenn Sie die Prompt-, Tool- und Transcript-Zeitleiste für eine OpenClaw-Sitzung benötigen. In Gruppenchats gehen Genehmigungsaufforderung und Exportergebnis privat an den Owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level|default>` setzt die Denkstufe oder entfernt den Sitzungs-Override. Optionen stammen aus dem Provider-Profil des aktiven Modells; gängige Stufen sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Stufen wie `xhigh`, `adaptive`, `max` oder binärem `on` nur dort, wo sie unterstützt werden. Aliasse: `/thinking`, `/t`.
    - `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
    - `/trace on|off` schaltet die Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
    - `/fast [status|on|off|default]` zeigt, setzt oder entfernt den Fast Mode.
    - `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` schaltet den Elevated Mode um. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt oder setzt exec-Standards.
    - `/model [name|#|status]` zeigt oder setzt das Modell.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` listet konfigurierte/auth-verfügbare Provider oder Modelle für einen Provider auf; fügen Sie `all` hinzu, um den vollständigen Katalog dieses Providers zu durchsuchen. `provider/*`-Einträge in `agents.defaults.models` sorgen dafür, dass `/model` und `/models` erkannte Modelle nur für diese Provider anzeigen.
    - `/queue <mode>` verwaltet das Queue-Verhalten (`steer`, Legacy-`queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus Optionen wie `debounce:0.5s cap:25 drop:summarize`; `/queue default` oder `/queue reset` entfernt den Sitzungs-Override. Siehe [Befehls-Queue](/de/concepts/queue) und [Steering-Queue](/de/concepts/queue-steering).
    - `/steer <message>` injiziert Anweisungen in den aktiven Lauf für die aktuelle Sitzung, unabhängig vom `/queue`-Modus. Es startet keinen neuen Lauf, wenn die Sitzung im Leerlauf ist. Alias: `/tell`. Siehe [Steer](/de/tools/steer).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` zeigt die kurze Hilfezusammenfassung.
    - `/commands` zeigt den generierten Befehlskatalog.
    - `/tools [compact|verbose]` zeigt, was der aktuelle Agent genau jetzt verwenden kann.
    - `/status` zeigt Ausführungs-/Laufzeitstatus, Gateway- und System-Uptime sowie Provider-Nutzung/Quota, wenn verfügbar.
    - `/diagnostics [note]` ist der owner-only Support-Bericht-Ablauf für Gateway-Bugs und Codex-Harness-Läufe. Er fragt jedes Mal nach expliziter exec-Genehmigung, bevor `openclaw gateway diagnostics export --json` ausgeführt wird; genehmigen Sie Diagnosen nicht mit einer Allow-all-Regel. Nach der Genehmigung sendet er einen einfügbaren Bericht mit lokalem Bundle-Pfad, Manifest-Zusammenfassung, Datenschutzhinweisen und relevanten Sitzungs-IDs. In Gruppenchats gehen Genehmigungsaufforderung und Bericht privat an den Owner. Wenn die aktive Sitzung das OpenAI-Codex-Harness verwendet, sendet dieselbe Genehmigung auch relevantes Codex-Feedback an OpenAI-Server, und die abgeschlossene Antwort listet die OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und `codex resume <thread-id>`-Befehle auf. Siehe [Diagnoseexport](/de/gateway/diagnostics).
    - `/crestodian <request>` führt den Crestodian-Einrichtungs- und Reparaturhelfer aus einer Owner-DM aus.
    - `/tasks` listet aktive/kürzliche Hintergrundaufgaben für die aktuelle Sitzung auf.
    - `/context [list|detail|map|json]` erklärt, wie Kontext zusammengestellt wird. `map` sendet ein Treemap-Bild des aktuellen Sitzungskontexts.
    - `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
    - `/usage off|tokens|full|cost` steuert die Nutzungsfußzeile pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.

  </Accordion>
  <Accordion title="Skills, Allowlists, Genehmigungen">
    - `/skill <name> [input]` führt einen Skill nach Namen aus.
    - `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
    - `/approve <id> <decision>` löst Exec-Genehmigungsaufforderungen auf.
    - `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Alias: `/side`. Siehe [BTW](/de/tools/btw).

  </Accordion>
  <Accordion title="Subagents und ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` verwaltet Subagent-Ausführungen für die aktuelle Sitzung.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
    - `/focus <target>` bindet den aktuellen Discord-Thread oder das Telegram-Thema/die Konversation an ein Sitzungsziel.
    - `/unfocus` entfernt die aktuelle Bindung.
    - `/agents` listet Thread-gebundene Agents für die aktuelle Sitzung auf.
    - `/kill <id|#|all>` bricht einen oder alle laufenden Subagents ab.
    - `/subagents steer <id|#> <message>` sendet Steuerungsanweisungen an einen laufenden Subagent. Siehe [Steer](/de/tools/steer).

  </Accordion>
  <Accordion title="Schreibvorgänge und Administration nur für Owner">
    - `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur für Owner. Erfordert `commands.config: true`.
    - `/mcp show|get|set|unset` liest oder schreibt von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`. Nur für Owner. Erfordert `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` prüft oder ändert den Plugin-Zustand. `/plugin` ist ein Alias. Schreibvorgänge nur für Owner. Erfordert `commands.plugins: true`.
    - `/debug show|set|unset|reset` verwaltet reine Laufzeit-Konfigurationsüberschreibungen. Nur für Owner. Erfordert `commands.debug: true`.
    - `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um dies zu deaktivieren.
    - `/send on|off|inherit` legt die Senderichtlinie fest. Nur für Owner.

  </Accordion>
  <Accordion title="Voice, TTS, Kanalsteuerung">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steuert TTS. Siehe [TTS](/de/tools/tts).
    - `/activation mention|always` legt den Gruppenaktivierungsmodus fest.
    - `/bash <command>` führt einen Host-Shell-Befehl aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus `tools.elevated`-Allowlists.
    - `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
    - `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

  </Accordion>
</AccordionGroup>

### Generierte Dock-Befehle

Dock-Befehle schalten die Antwortroute der aktuellen Sitzung auf einen anderen verknüpften
Kanal um. Informationen zu Einrichtung, Beispielen und Fehlerbehebung finden Sie unter [Channel Docking](/de/concepts/channel-docking).

Dock-Befehle werden aus Kanal-Plugins mit Unterstützung für native Befehle generiert. Aktueller gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

Verwenden Sie Dock-Befehle aus einem Direktchat, um die Antwortroute der aktuellen Sitzung auf einen anderen verknüpften Kanal umzuschalten. Der Agent behält denselben Sitzungskontext bei, aber zukünftige Antworten für diese Sitzung werden an den ausgewählten Kanal-Peer zugestellt.

Dock-Befehle erfordern `session.identityLinks`. Der Quellabsender und der Ziel-Peer müssen sich in derselben Identitätsgruppe befinden, zum Beispiel `["telegram:123", "discord:456"]`. Wenn ein Telegram-Benutzer mit der ID `123` `/dock_discord` sendet, speichert OpenClaw `lastChannel: "discord"` und `lastTo: "456"` in der aktiven Sitzung. Wenn der Absender nicht mit einem Discord-Peer verknüpft ist, antwortet der Befehl mit einem Einrichtungshinweis, anstatt in den normalen Chat durchzufallen.

Docking ändert nur die aktive Sitzungsroute. Es erstellt keine Kanal-Accounts, gewährt keinen Zugriff, umgeht keine Kanal-Allowlists und verschiebt den Transkriptverlauf nicht in eine andere Sitzung. Verwenden Sie `/dock-telegram`, `/dock-slack`, `/dock-mattermost` oder einen anderen generierten Dock-Befehl, um die Route erneut umzuschalten.

### Gebündelte Plugin-Befehle

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Speicher-Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet den Ablauf für Geräte-Pairing/-Einrichtung. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` schaltet Befehle für risikoreiche Telefonknoten temporär scharf.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Talk-Voice-Konfiguration. In Discord lautet der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Vorlagen. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` prüft und steuert den gebündelten Codex-App-Server-Harness. Siehe [Codex Harness](/de/plugins/codex-harness).
- Nur QQBot-Befehle:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-Befehle

Vom Benutzer aufrufbare Skills werden auch als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können auch als direkte Befehle wie `/prose` erscheinen, wenn der Skill bzw. das Plugin sie registriert.
- Die native Skill-Befehlsregistrierung wird durch `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.
- Befehlsspezifikationen können `descriptionLocalizations` für native Oberflächen bereitstellen, die lokalisierte Beschreibungen unterstützen, einschließlich Discord.

<AccordionGroup>
  <Accordion title="Hinweise zu Argumenten und Parser">
    - Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Provider-Namen (unscharfe Übereinstimmung); falls keine Übereinstimmung vorliegt, wird der Text als Nachrichtentext behandelt.
    - Für eine vollständige Aufschlüsselung der Provider-Nutzung verwenden Sie `openclaw status --usage`.
    - `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt Kanal-`configWrites`.
    - In Kanälen mit mehreren Accounts berücksichtigen konfigurationsbezogene `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` auch die `configWrites` des Ziel-Accounts.
    - `/usage` steuert die Nutzungsfußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungsprotokollen aus.
    - `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um dies zu deaktivieren.
    - `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket, `git:<repo>` oder `clawhub:<pkg>` und fordert dann einen Gateway-Neustart an, da sich Plugin-Quellmodule geändert haben.
    - `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und löst für neue Agent-Turns ein Neuladen der Gateway-Plugins aus.

  </Accordion>
  <Accordion title="Kanalspezifisches Verhalten">
    - Nur-Discord-nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (nicht als Text verfügbar). `join` erfordert einen Server und einen ausgewählten Sprach-/Stage-Kanal. Erfordert `channels.discord.voice` und native Befehle.
    - Discord-Thread-Bindungsbefehle (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass wirksame Thread-Bindungen aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
    - ACP-Befehlsreferenz und Laufzeitverhalten: [ACP Agents](/de/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / Trace / Fast / Reasoning-Sicherheit">
    - `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es bei normaler Nutzung **aus**.
    - `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Trace-/Debug-Zeilen im Besitz von Plugins an und hält normales ausführliches Tool-Geplauder ausgeschaltet.
    - `/fast on|off` speichert eine Sitzungsüberschreibung dauerhaft. Verwenden Sie in der Sessions-UI die Option `inherit`, um sie zu löschen und zu den Konfigurationsstandards zurückzukehren.
    - `/fast` ist Provider-spezifisch: OpenAI/OpenAI Codex ordnen es bei nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Traffic an `api.anthropic.com`, es `service_tier=auto` oder `standard_only` zuordnen. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
    - Zusammenfassungen von Tool-Fehlern werden weiterhin angezeigt, wenn sie relevant sind, aber detaillierter Fehlertext wird nur einbezogen, wenn `/verbose` `on` oder `full` ist.
    - `/reasoning`, `/verbose` und `/trace` sind in Gruppenumgebungen riskant: Sie können internes Reasoning, Tool-Ausgaben oder Plugin-Diagnosen offenlegen, die Sie nicht preisgeben wollten. Lassen Sie sie vorzugsweise ausgeschaltet, insbesondere in Gruppenchats.

  </Accordion>
  <Accordion title="Modellwechsel">
    - `/model` speichert das neue Sitzungsmodell sofort dauerhaft.
    - Wenn der Agent inaktiv ist, verwendet der nächste Durchlauf es sofort.
    - Wenn bereits ein Durchlauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt mit dem neuen Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsgelegenheit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
    - In der lokalen TUI kehrt `/crestodian [request]` von der normalen Agent-TUI zu Crestodian zurück. Dies ist vom Rescue-Modus für Nachrichtenkanäle getrennt und gewährt keine Remote-Konfigurationsberechtigung.

  </Accordion>
  <Accordion title="Fast Path und Inline-Kurzbefehle">
    - **Fast Path:** Nachrichten, die nur Befehle enthalten, von Absendern auf der Allowlist werden sofort verarbeitet (umgehen Warteschlange + Modell).
    - **Gruppenerwähnungs-Gating:** Nachrichten, die nur Befehle enthalten, von Absendern auf der Allowlist umgehen Erwähnungsanforderungen.
    - **Inline-Kurzbefehle (nur Absender auf der Allowlist):** Bestimmte Befehle funktionieren auch, wenn sie in eine normale Nachricht eingebettet sind, und werden entfernt, bevor das Modell den verbleibenden Text sieht.
      - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft durch den normalen Ablauf weiter.
    - Derzeit: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nicht autorisierte Nachrichten, die nur Befehle enthalten, werden stillschweigend ignoriert, und Inline-`/...`-Tokens werden als reiner Text behandelt.

  </Accordion>
  <Accordion title="Skill-Befehle und native Argumente">
    - **Skill-Befehle:** `user-invocable`-Skills werden als Slash-Befehle bereitgestellt. Namen werden zu `a-z0-9_` bereinigt (max. 32 Zeichen); Kollisionen erhalten numerische Suffixe (z. B. `_2`).
      - `/skill <name> [input]` führt einen Skill nach Namen aus (nützlich, wenn native Befehlslimits befehlsbezogene Befehle pro Skill verhindern).
      - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
      - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool weiterzuleiten (deterministisch, ohne Modell).
      - Beispiel: `/prose` (OpenProse-Plugin) – siehe [OpenProse](/de/prose).
    - **Native Befehlsargumente:** Discord verwendet Autocomplete für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü an, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen. Dynamische Auswahlmöglichkeiten werden gegen das Ziel-Sitzungsmodell aufgelöst, sodass modellspezifische Optionen wie `/think`-Stufen der `/model`-Überschreibung dieser Sitzung folgen.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent jetzt in dieser Unterhaltung verwenden kann**.

- Standard-`/tools` ist kompakt und für schnelles Scannen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Native Befehlsoberflächen, die Argumente unterstützen, stellen denselben Modus-Schalter wie `compact|verbose` bereit.
- Ergebnisse sind sitzungsbezogen, daher kann eine Änderung von Agent, Kanal, Thread, Absenderautorisierung oder Modell die Ausgabe ändern.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Core-Tools, verbundener Plugin-Tools und kanalbezogener Tools.

Verwenden Sie zum Bearbeiten von Profilen und Überschreibungen das Control-UI-Tools-Panel oder Konfigurations-/Katalogoberflächen, anstatt `/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Provider-Nutzung/Kontingent** (Beispiel: "Claude 80 % übrig") erscheint in `/status` für den aktuellen Modell-Provider, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Provider-Fenster auf `% left`; bei MiniMax werden reine Rest-Prozentfelder vor der Anzeige invertiert, und `model_remains`-Antworten bevorzugen den Chat-Modell-Eintrag plus ein mit dem Modell markiertes Plan-Label.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Transkript-Nutzungseintrag zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Vorhandene von null verschiedene Live-Werte haben weiterhin Vorrang, und der Transkript-Fallback kann außerdem das aktive Runtime-Modell-Label sowie eine größere prompt-orientierte Gesamtsumme wiederherstellen, wenn gespeicherte Gesamtsummen fehlen oder kleiner sind.
- **Ausführung vs. Runtime:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` dafür, wer die Sitzung tatsächlich ausführt: `OpenClaw Pi Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
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
- In Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Provider- und Modell-Dropdowns sowie einem Absenden-Schritt. Die Auswahl berücksichtigt `agents.defaults.models`, einschließlich `provider/*`-Einträgen, sodass Provider-bezogene Discovery die Auswahl unter Discords Komponentenlimit von 25 Optionen halten kann.
- `/model <#>` wählt aus dieser Auswahl aus (und bevorzugt nach Möglichkeit den aktuellen Provider).
- `/model status` zeigt die Detailansicht, einschließlich konfiguriertem Provider-Endpunkt (`baseUrl`) und API-Modus (`api`), sofern verfügbar.

## Debug-Overrides

Mit `/debug` können Sie **nur zur Runtime geltende** Konfigurations-Overrides setzen (Speicher, nicht Festplatte). Nur Owner. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.debug: true`.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Overrides gelten sofort für neue Konfigurationslesevorgänge, schreiben aber **nicht** in `openclaw.json`. Verwenden Sie `/debug reset`, um alle Overrides zu löschen und zur Konfiguration auf der Festplatte zurückzukehren.
</Note>

## Plugin-Trace-Ausgabe

Mit `/trace` können Sie **sitzungsbezogene Plugin-Trace-/Debug-Zeilen** umschalten, ohne den vollständigen ausführlichen Modus zu aktivieren.

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
- `/trace` ersetzt `/debug` nicht; `/debug` verwaltet weiterhin nur zur Runtime geltende Konfigurations-Overrides.
- `/trace` ersetzt `/verbose` nicht; normale ausführliche Tool-/Statusausgaben gehören weiterhin zu `/verbose`.

## Konfigurationsupdates

`/config` schreibt in Ihre Konfiguration auf der Festplatte (`openclaw.json`). Nur Owner. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.config: true`.

Beispiele:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Die Konfiguration wird vor dem Schreiben validiert; ungültige Änderungen werden abgelehnt. `/config`-Updates bleiben über Neustarts hinweg erhalten.
</Note>

## MCP-Updates

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur Owner. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen. Runtime-Adapter entscheiden, welche Transports tatsächlich ausführbar sind.
</Note>

## Plugin-Updates

Mit `/plugins` können Operatoren entdeckte Plugins prüfen und die Aktivierung in der Konfiguration umschalten. Schreibgeschützte Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` und `/plugins show` verwenden echte Plugin-Discovery für den aktuellen Workspace plus Konfiguration auf der Festplatte.
- `/plugins install` installiert aus ClawHub, npm, Git, lokalen Verzeichnissen und Archiven.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; es installiert oder deinstalliert keine Plugins.
- Aktivierungs- und Deaktivierungsänderungen laden die Gateway-Plugin-Runtime-Oberflächen für neue Agent-Turns per Hot Reload neu; Installation fordert einen Gateway-Neustart an, weil sich Plugin-Quellmodule geändert haben.

</Note>

## Hinweise zu Oberflächen

<AccordionGroup>
  <Accordion title="Sitzungen pro Oberfläche">
    - **Textbefehle** laufen in der normalen Chat-Sitzung (DMs teilen sich `main`, Gruppen haben ihre eigene Sitzung).
    - **Native Befehle** verwenden isolierte Sitzungen:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
    - **`/stop`** zielt auf die aktive Chat-Sitzung, sodass der aktuelle Lauf abgebrochen werden kann.

  </Accordion>
  <Accordion title="Slack-Besonderheiten">
    `channels.slack.slashCommand` wird weiterhin für einen einzelnen `/openclaw`-artigen Befehl unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie pro integriertem Befehl einen Slack-Slash-Befehl erstellen (dieselben Namen wie in `/help`). Befehlsargument-Menüs für Slack werden als ephemere Block-Kit-Buttons zugestellt.

    Slack-native Ausnahme: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert weiterhin in Slack-Nachrichten.

  </Accordion>
</AccordionGroup>

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung. `/side` ist ein Alias.

Anders als normaler Chat:

- verwendet es die aktuelle Sitzung als Hintergrundkontext,
- in Codex-Harness-Sitzungen läuft es als ephemerer Codex-Nebenthread mit den
  aktuellen Codex-Berechtigungen und der nativen Tool-Oberfläche,
- in Nicht-Codex-Sitzungen behält es das ältere direkte One-Shot-Side-Call-Verhalten bei,
- ändert es den zukünftigen Sitzungskontext nicht,
- wird es nicht in die Transkript-Historie geschrieben,
- wird es als Live-Nebenergebnis statt als normale Assistentennachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klärung wünschen, während die Hauptaufgabe weiterläuft.

Beispiel:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Siehe [BTW-Nebenfragen](/de/tools/btw) für das vollständige Verhalten und Details zur Client-UX.

## Verwandt

- [Skills erstellen](/de/tools/creating-skills)
- [Skills](/de/tools/skills)
- [Skills-Konfiguration](/de/tools/skills-config)
