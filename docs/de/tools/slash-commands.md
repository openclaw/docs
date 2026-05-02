---
read_when:
    - Chatbefehle verwenden oder konfigurieren
    - Fehlersuche beim Befehlsrouting oder bei Berechtigungen
sidebarTitle: Slash commands
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-05-02T21:04:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt. Der nur für den Host bestimmte Bash-Chatbefehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung oder ein Thread an eine ACP-Sitzung gebunden ist, wird normaler Folgetext an dieses ACP-Harness weitergeleitet. Gateway-Verwaltungsbefehle bleiben weiterhin lokal: `/acp ...` erreicht immer den OpenClaw-ACP-Befehlshandler, und `/status` sowie `/unfocus` bleiben lokal, wenn die Befehlsverarbeitung für die Oberfläche aktiviert ist.

Es gibt zwei verwandte Systeme:

<AccordionGroup>
  <Accordion title="Befehle">
    Eigenständige `/...`-Nachrichten.
  </Accordion>
  <Accordion title="Direktiven">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
    - In normalen Chatnachrichten (nicht nur Direktiven) werden sie als „Inline-Hinweise“ behandelt und speichern **keine** Sitzungseinstellungen dauerhaft.
    - In Nachrichten, die nur aus Direktiven bestehen (die Nachricht enthält nur Direktiven), werden sie in der Sitzung dauerhaft gespeichert und mit einer Bestätigung beantwortet.
    - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige verwendete Allowlist; andernfalls ergibt sich die Autorisierung aus Kanal-Allowlists/Kopplung plus `commands.useAccessGroups`. Bei nicht autorisierten Absendern werden Direktiven als normaler Text behandelt.

  </Accordion>
  <Accordion title="Inline-Kurzbefehle">
    Nur Absender auf der Allowlist/autorisierte Absender: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Sie werden sofort ausgeführt, entfernt, bevor das Modell die Nachricht sieht, und der verbleibende Text durchläuft den normalen Ablauf.

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
  Registriert native Befehle. Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); für Provider ohne native Unterstützung ignoriert. Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um dies pro Provider zu überschreiben (bool oder `"auto"`). `false` löscht zuvor registrierte Befehle auf Discord/Telegram beim Start. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
</ParamField>
Auf Discord können native Befehlsspezifikationen `descriptionLocalizations` enthalten, die OpenClaw als Discord-`description_localizations` veröffentlicht und in Abgleichsvergleiche einbezieht.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registriert **Skill**-Befehle nativ, wenn unterstützt. Auto: an für Discord/Telegram; aus für Slack (Slack erfordert das Erstellen eines Slash-Befehls pro Skill). Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um dies pro Provider zu überschreiben (bool oder `"auto"`).
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
  Aktiviert `/plugins` (Plugin-Erkennung/-Status sowie Installations- und Aktivieren/Deaktivieren-Steuerungen).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Aktiviert `/debug` (nur Laufzeit-Überschreibungen).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` plus Gateway-Neustart-Toolaktionen.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Legt die explizite Owner-Allowlist für nur Ownern vorbehaltene Befehls-/Tool-Oberflächen fest. Dies ist das Konto des menschlichen Operators, das gefährliche Aktionen genehmigen und Befehle wie `/diagnostics`, `/export-trajectory` und `/config` ausführen kann. Es ist von `commands.allowFrom` und vom DM-Kopplungszugriff getrennt.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Kanal: Erzwingt, dass nur Ownern vorbehaltene Befehle eine **Owner-Identität** benötigen, um auf dieser Oberfläche ausgeführt zu werden. Wenn `true`, muss der Absender entweder einem aufgelösten Owner-Kandidaten entsprechen (zum Beispiel einem Eintrag in `commands.ownerAllowFrom` oder provider-nativen Owner-Metadaten) oder den internen Scope `operator.admin` auf einem internen Nachrichtenkanal besitzen. Ein Wildcard-Eintrag in der Kanal-`allowFrom` oder eine leere/nicht aufgelöste Owner-Kandidatenliste reicht **nicht** aus — nur Ownern vorbehaltene Befehle schlagen auf diesem Kanal geschlossen fehl. Lassen Sie dies deaktiviert, wenn nur Ownern vorbehaltene Befehle nur durch `ownerAllowFrom` und die standardmäßigen Befehls-Allowlists abgesichert werden sollen.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Owner-IDs im Systemprompt angezeigt werden.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Legt optional das HMAC-Secret fest, das verwendet wird, wenn `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Pro-Provider-Allowlist für Befehlsautorisierung. Wenn konfiguriert, ist sie die einzige Autorisierungsquelle für Befehle und Direktiven (Kanal-Allowlists/Kopplung und `commands.useAccessGroups` werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; provider-spezifische Schlüssel überschreiben ihn.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.
</ParamField>

## Befehlsliste

Aktuelle maßgebliche Quelle:

- zentrale integrierte Befehle stammen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle stammen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle stammen aus Plugin-`registerCommand()`-Aufrufen
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurationsflags, Kanaloberfläche und installierten/aktivierten Plugins ab

### Zentrale integrierte Befehle

<AccordionGroup>
  <Accordion title="Sitzungen und Ausführungen">
    - `/new [model]` startet eine neue Sitzung; `/reset` ist der Reset-Alias.
    - Control UI fängt eingegebene `/new`-Befehle ab, um eine neue Dashboard-Sitzung zu erstellen und zu ihr zu wechseln; eingegebenes `/reset` führt weiterhin den In-Place-Reset des Gateways aus.
    - `/reset soft [message]` behält das aktuelle Transkript, verwirft wiederverwendete CLI-Backend-Sitzungs-IDs und führt das Laden des Start-/Systemprompts in-place erneut aus.
    - `/compact [instructions]` komprimiert den Sitzungskontext. Siehe [Compaction](/de/concepts/compaction).
    - `/stop` bricht die aktuelle Ausführung ab.
    - `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten den Ablauf der Thread-Bindung.
    - `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
    - `/export-trajectory [path]` fordert Exec-Genehmigung an und exportiert dann ein JSONL-[Trajektorien-Bundle](/de/tools/trajectory) für die aktuelle Sitzung. Verwenden Sie dies, wenn Sie Prompt-, Tool- und Transkript-Zeitleiste für eine OpenClaw-Sitzung benötigen. In Gruppenchats gehen Genehmigungsaufforderung und Exportergebnis privat an den Owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Modell- und Ausführungssteuerungen">
    - `/think <level>` legt die Denkstufe fest. Optionen stammen aus dem Provider-Profil des aktiven Modells; übliche Stufen sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Stufen wie `xhigh`, `adaptive`, `max` oder binärem `on` nur dort, wo unterstützt. Aliasse: `/thinking`, `/t`.
    - `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
    - `/trace on|off` schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
    - `/fast [status|on|off]` zeigt den Schnellmodus an oder legt ihn fest.
    - `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` schaltet den erhöhten Modus um. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt Exec-Standardeinstellungen an oder legt sie fest.
    - `/model [name|#|status]` zeigt das Modell an oder legt es fest.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` listet konfigurierte/authentifizierungsverfügbare Provider oder Modelle für einen Provider auf; fügen Sie `all` hinzu, um den vollständigen Katalog dieses Providers zu durchsuchen.
    - `/queue <mode>` verwaltet das Warteschlangenverhalten (`steer`, Legacy-`queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus Optionen wie `debounce:0.5s cap:25 drop:summarize`; `/queue default` oder `/queue reset` löscht die Sitzungsüberschreibung. Siehe [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

  </Accordion>
  <Accordion title="Erkennung und Status">
    - `/help` zeigt die kurze Hilfezusammenfassung.
    - `/commands` zeigt den generierten Befehlskatalog.
    - `/tools [compact|verbose]` zeigt, was der aktuelle Agent jetzt verwenden kann.
    - `/status` zeigt Ausführungs-/Laufzeitstatus, einschließlich `Execution`/`Runtime`-Labels und Provider-Nutzung/-Kontingent, wenn verfügbar.
    - `/diagnostics [note]` ist der nur Ownern vorbehaltene Supportbericht-Ablauf für Gateway-Fehler und Codex-Harness-Ausführungen. Er fordert jedes Mal explizite Exec-Genehmigung an, bevor `openclaw gateway diagnostics export --json` ausgeführt wird; genehmigen Sie Diagnosen nicht mit einer Alles-erlauben-Regel. Nach Genehmigung sendet er einen einfügbaren Bericht mit lokalem Bundle-Pfad, Manifest-Zusammenfassung, Datenschutzhinweisen und relevanten Sitzungs-IDs. In Gruppenchats gehen Genehmigungsaufforderung und Bericht privat an den Owner. Wenn die aktive Sitzung das OpenAI-Codex-Harness verwendet, sendet dieselbe Genehmigung außerdem relevantes Codex-Feedback an OpenAI-Server, und die abgeschlossene Antwort listet die OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und `codex resume <thread-id>`-Befehle auf. Siehe [Diagnoseexport](/de/gateway/diagnostics).
    - `/crestodian <request>` führt den Crestodian-Einrichtungs- und Reparaturhelfer aus einer Owner-DM aus.
    - `/tasks` listet aktive/kürzliche Hintergrundaufgaben für die aktuelle Sitzung auf.
    - `/context [list|detail|json]` erklärt, wie Kontext zusammengestellt wird.
    - `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
    - `/usage off|tokens|full|cost` steuert die Nutzungsfußzeile pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.

  </Accordion>
  <Accordion title="Skills, Allowlists, Genehmigungen">
    - `/skill <name> [input]` führt einen Skill nach Namen aus.
    - `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
    - `/approve <id> <decision>` löst Exec-Genehmigungsaufforderungen auf.
    - `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Siehe [BTW](/de/tools/btw).

  </Accordion>
  <Accordion title="Subagents und ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` verwaltet Subagent-Ausführungen für die aktuelle Sitzung.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
    - `/focus <target>` bindet den aktuellen Discord-Thread oder das Telegram-Thema/die Telegram-Unterhaltung an ein Sitzungsziel.
    - `/unfocus` entfernt die aktuelle Bindung.
    - `/agents` listet threadgebundene Agenten für die aktuelle Sitzung auf.
    - `/kill <id|#|all>` bricht einen oder alle laufenden Subagents ab.
    - `/steer <id|#> <message>` sendet Steuerungsanweisungen an einen laufenden Subagent. Alias: `/tell`.

  </Accordion>
  <Accordion title="Schreibzugriffe nur für Eigentümer und Administration">
    - `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur für Eigentümer. Erfordert `commands.config: true`.
    - `/mcp show|get|set|unset` liest oder schreibt von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`. Nur für Eigentümer. Erfordert `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` prüft oder ändert den Plugin-Zustand. `/plugin` ist ein Alias. Schreibzugriffe nur für Eigentümer. Erfordert `commands.plugins: true`.
    - `/debug show|set|unset|reset` verwaltet reine Laufzeit-Konfigurationsüberschreibungen. Nur für Eigentümer. Erfordert `commands.debug: true`.
    - `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
    - `/send on|off|inherit` legt die Senderichtlinie fest. Nur für Eigentümer.

  </Accordion>
  <Accordion title="Sprache, TTS, Kanalsteuerung">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` steuert TTS. Siehe [TTS](/de/tools/tts).
    - `/activation mention|always` legt den Gruppenaktivierungsmodus fest.
    - `/bash <command>` führt einen Host-Shell-Befehl aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus `tools.elevated`-Allowlisten.
    - `!poll [sessionId]` prüft einen Bash-Hintergrundauftrag.
    - `!stop [sessionId]` stoppt einen Bash-Hintergrundauftrag.

  </Accordion>
</AccordionGroup>

### Generierte Dock-Befehle

Dock-Befehle schalten die Antwortroute der aktuellen Sitzung auf einen anderen verknüpften
Kanal um. Siehe [Kanal-Docking](/de/concepts/channel-docking) für Einrichtung,
Beispiele und Fehlerbehebung.

Dock-Befehle werden aus Kanal-Plugins mit Unterstützung für native Befehle generiert. Aktuell gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

Verwenden Sie Dock-Befehle aus einem Direktchat, um die Antwortroute der aktuellen Sitzung auf einen anderen verknüpften Kanal umzuschalten. Der Agent behält denselben Sitzungskontext, aber zukünftige Antworten für diese Sitzung werden an den ausgewählten Kanal-Peer zugestellt.

Dock-Befehle erfordern `session.identityLinks`. Der Quellabsender und der Ziel-Peer müssen in derselben Identitätsgruppe sein, zum Beispiel `["telegram:123", "discord:456"]`. Wenn ein Telegram-Benutzer mit der ID `123` `/dock_discord` sendet, speichert OpenClaw `lastChannel: "discord"` und `lastTo: "456"` in der aktiven Sitzung. Wenn der Absender nicht mit einem Discord-Peer verknüpft ist, antwortet der Befehl mit einem Einrichtungshinweis, statt in den normalen Chat durchzufallen.

Docking ändert nur die aktive Sitzungsroute. Es erstellt keine Kanalkonten, gewährt keinen Zugriff, umgeht keine Kanal-Allowlisten und verschiebt keinen Transkriptverlauf in eine andere Sitzung. Verwenden Sie `/dock-telegram`, `/dock-slack`, `/dock-mattermost` oder einen anderen generierten Dock-Befehl, um die Route erneut umzuschalten.

### Gebündelte Plugin-Befehle

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory-Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet den Geräte-Pairing-/Einrichtungsablauf. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend risikoreiche Telefon-Node-Befehle.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Talk-Sprachkonfiguration. Auf Discord lautet der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Voreinstellungen. Siehe [LINE](/de/channels/line).
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
- Die native Registrierung von Skill-Befehlen wird durch `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.
- Befehlsspezifikationen können `descriptionLocalizations` für native Oberflächen bereitstellen, die lokalisierte Beschreibungen unterstützen, einschließlich Discord.

<AccordionGroup>
  <Accordion title="Hinweise zu Argumenten und Parser">
    - Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Provider-Namen (unscharfe Suche); wenn keine Übereinstimmung gefunden wird, wird der Text als Nachrichtentext behandelt.
    - Für die vollständige Aufschlüsselung der Provider-Nutzung verwenden Sie `openclaw status --usage`.
    - `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt Kanal-`configWrites`.
    - In Kanälen mit mehreren Konten berücksichtigen konfigurationsbezogene `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` ebenfalls die `configWrites` des Zielkontos.
    - `/usage` steuert die Nutzungsfußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungsprotokollen aus.
    - `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
    - `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket, `git:<repo>` oder `clawhub:<pkg>` und fordert dann einen Gateway-Neustart an, weil sich Plugin-Quellmodule geändert haben.
    - `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und löst für neue Agent-Turns ein Neuladen der Gateway-Plugins aus.

  </Accordion>
  <Accordion title="Kanalspezifisches Verhalten">
    - Nur Discord-nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (nicht als Text verfügbar). `join` erfordert eine Guild und einen ausgewählten Sprach-/Stage-Kanal. Erfordert `channels.discord.voice` und native Befehle.
    - Discord-Thread-Bindungsbefehle (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass wirksame Thread-Bindungen aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
    - ACP-Befehlsreferenz und Laufzeitverhalten: [ACP-Agenten](/de/tools/acp-agents).

  </Accordion>
  <Accordion title="Ausführlich / Trace / schnell / Reasoning-Sicherheit">
    - `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es bei normaler Nutzung **aus**.
    - `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen an und hält normales ausführliches Tool-Rauschen aus.
    - `/fast on|off` speichert eine Sitzungsüberschreibung. Verwenden Sie in der Sitzungs-UI die Option `inherit`, um sie zu löschen und auf die Konfigurationsstandards zurückzufallen.
    - `/fast` ist Provider-spezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, es `service_tier=auto` oder `standard_only` zuordnen. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
    - Zusammenfassungen von Tool-Fehlern werden bei Relevanz weiterhin angezeigt, aber detaillierter Fehlertext ist nur enthalten, wenn `/verbose` `on` oder `full` ist.
    - `/reasoning`, `/verbose` und `/trace` sind in Gruppenumgebungen riskant: Sie können internes Reasoning, Tool-Ausgaben oder Plugin-Diagnosen offenlegen, die Sie nicht preisgeben wollten. Lassen Sie sie vorzugsweise ausgeschaltet, insbesondere in Gruppenchats.

  </Accordion>
  <Accordion title="Modellwechsel">
    - `/model` speichert das neue Sitzungsmodell sofort.
    - Wenn der Agent im Leerlauf ist, verwendet die nächste Ausführung es sofort.
    - Wenn bereits eine Ausführung aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt mit dem neuen Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsgelegenheit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
    - In der lokalen TUI kehrt `/crestodian [request]` von der normalen Agent-TUI zu Crestodian zurück. Dies ist vom Rettungsmodus für Nachrichtenkanäle getrennt und gewährt keine Remote-Konfigurationsberechtigung.

  </Accordion>
  <Accordion title="Schnellpfad und Inline-Kurzbefehle">
    - **Schnellpfad:** Nachrichten, die nur Befehle enthalten, von Absendern auf der Allowlist werden sofort verarbeitet (umgeht Warteschlange + Modell).
    - **Gruppenerwähnungs-Gating:** Nachrichten, die nur Befehle enthalten, von Absendern auf der Allowlist umgehen Erwähnungsanforderungen.
    - **Inline-Kurzbefehle (nur Absender auf der Allowlist):** Bestimmte Befehle funktionieren auch, wenn sie in eine normale Nachricht eingebettet sind, und werden entfernt, bevor das Modell den restlichen Text sieht.
      - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft weiter durch den normalen Ablauf.
    - Derzeit: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Nicht autorisierte Nachrichten, die nur Befehle enthalten, werden stillschweigend ignoriert, und Inline-`/...`-Tokens werden als Klartext behandelt.

  </Accordion>
  <Accordion title="Skill-Befehle und native Argumente">
    - **Skill-Befehle:** `user-invocable` Skills werden als Slash-Befehle bereitgestellt. Namen werden zu `a-z0-9_` bereinigt (max. 32 Zeichen); Kollisionen erhalten numerische Suffixe (z. B. `_2`).
      - `/skill <name> [input]` führt einen Skill nach Namen aus (nützlich, wenn native Befehlsgrenzen einzelne Skill-Befehle verhindern).
      - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
      - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool weiterzuleiten (deterministisch, kein Modell).
      - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
    - **Native Befehlsargumente:** Discord verwendet Autovervollständigung für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente auslassen). Telegram und Slack zeigen ein Button-Menü an, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument auslassen. Dynamische Auswahlmöglichkeiten werden gegen das Ziel-Sitzungsmodell aufgelöst, sodass modellspezifische Optionen wie `/think`-Stufen der `/model`-Überschreibung dieser Sitzung folgen.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent jetzt in dieser Unterhaltung verwenden kann**.

- Standard-`/tools` ist kompakt und für schnelles Scannen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, stellen denselben Moduswechsel wie `compact|verbose` bereit.
- Ergebnisse sind sitzungsbezogen; daher kann das Ändern von Agent, Kanal, Thread, Absenderautorisierung oder Modell die Ausgabe ändern.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Core-Tools, verbundener Plugin-Tools und kanaleigener Tools.

Verwenden Sie zum Bearbeiten von Profilen und Überschreibungen das Control-UI-Tools-Panel oder Konfigurations-/Katalogoberflächen, statt `/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Provider-Nutzung/Kontingent** (Beispiel: „Claude 80 % übrig“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Provider-Zeitfenster zu `% übrig`; bei MiniMax werden Prozentfelder, die nur den verbleibenden Anteil angeben, vor der Anzeige invertiert, und `model_remains`-Antworten bevorzugen den Chat-Modell-Eintrag plus eine mit Modell getaggte Planbezeichnung.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Transkript-Nutzungseintrag zurückfallen, wenn der Live-Sitzungssnapshot spärlich ist. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und der Transkript-Fallback kann außerdem die Bezeichnung des aktiven Runtime-Modells sowie eine größere, prompt-orientierte Gesamtsumme wiederherstellen, wenn gespeicherte Gesamtsummen fehlen oder kleiner sind.
- **Ausführung vs. Runtime:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` dafür, wer die Sitzung tatsächlich ausführt: `OpenClaw Pi Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Token/Kosten pro Antwort** wird über `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
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

- `/model` und `/model list` zeigen eine kompakte, nummerierte Auswahl (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Provider- und Modell-Dropdowns sowie einem Senden-Schritt.
- `/model <#>` wählt aus dieser Auswahl aus (und bevorzugt nach Möglichkeit den aktuellen Provider).
- `/model status` zeigt die Detailansicht, einschließlich konfiguriertem Provider-Endpunkt (`baseUrl`) und API-Modus (`api`), sofern verfügbar.

## Debug-Überschreibungen

Mit `/debug` können Sie **nur zur Runtime geltende** Konfigurationsüberschreibungen festlegen (Speicher, nicht Datenträger). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.debug: true`.

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

Mit `/trace` können Sie **sitzungsbezogene Plugin-Trace-/Debug-Zeilen** umschalten, ohne den vollständigen ausführlichen Modus zu aktivieren.

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
- Plugin-Trace-Zeilen können in `/status` und als nachfolgende Diagnosemeldung nach der normalen Assistentenantwort erscheinen.
- `/trace` ersetzt `/debug` nicht; `/debug` verwaltet weiterhin nur zur Runtime geltende Konfigurationsüberschreibungen.
- `/trace` ersetzt `/verbose` nicht; normale ausführliche Tool-/Statusausgaben gehören weiterhin zu `/verbose`.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf dem Datenträger (`openclaw.json`). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.config: true`.

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

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen. Runtime-Adapter entscheiden, welche Transporte tatsächlich ausführbar sind.
</Note>

## Plugin-Aktualisierungen

Mit `/plugins` können Betreiber erkannte Plugins prüfen und die Aktivierung in der Konfiguration umschalten. Schreibgeschützte Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie dies mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung gegen den aktuellen Arbeitsbereich plus Konfiguration auf dem Datenträger.
- `/plugins install` installiert aus ClawHub, npm, git, lokalen Verzeichnissen und Archiven.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; es installiert oder deinstalliert keine Plugins.
- Aktivierungs- und Deaktivierungsänderungen laden die Runtime-Oberflächen von Gateway-Plugins für neue Agentendurchläufe hot-reloaded neu; die Installation fordert einen Gateway-Neustart an, weil sich Plugin-Quellmodule geändert haben.

</Note>

## Hinweise zu Oberflächen

<AccordionGroup>
  <Accordion title="Sitzungen pro Oberfläche">
    - **Textbefehle** laufen in der normalen Chatsitzung (DMs teilen sich `main`, Gruppen haben ihre eigene Sitzung).
    - **Native Befehle** verwenden isolierte Sitzungen:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix über `channels.slack.slashCommand.sessionPrefix` konfigurierbar)
      - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chatsitzung)
    - **`/stop`** zielt auf die aktive Chatsitzung, damit der aktuelle Lauf abgebrochen werden kann.

  </Accordion>
  <Accordion title="Slack-Besonderheiten">
    `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie pro integriertem Befehl einen Slack-Slash-Befehl erstellen (dieselben Namen wie in `/help`). Befehlsargumentmenüs für Slack werden als flüchtige Block-Kit-Schaltflächen ausgeliefert.

    Slack-native Ausnahme: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert weiterhin in Slack-Nachrichten.

  </Accordion>
</AccordionGroup>

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Anders als normaler Chat:

- verwendet es die aktuelle Sitzung als Hintergrundkontext,
- läuft es als separater, **tool-loser** einmaliger Aufruf,
- ändert es den zukünftigen Sitzungskontext nicht,
- wird es nicht in den Transkriptverlauf geschrieben,
- wird es als Live-Nebenergebnis statt als normale Assistentennachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klärung wünschen, während die Hauptaufgabe weiterläuft.

Beispiel:

```text
/btw what are we doing right now?
```

Weitere Informationen zum vollständigen Verhalten und zu den UX-Details des Clients finden Sie unter [BTW-Nebenfragen](/de/tools/btw).

## Verwandte Themen

- [Skills erstellen](/de/tools/creating-skills)
- [Skills](/de/tools/skills)
- [Skills-Konfiguration](/de/tools/skills-config)
