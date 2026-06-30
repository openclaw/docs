---
read_when:
    - Chatbefehle verwenden oder konfigurieren
    - Debugging von Befehlsrouting oder Berechtigungen
    - Verstehen, wie Skill-Befehle registriert werden
sidebarTitle: Slash commands
summary: Alle verfügbaren Slash-Befehle, Direktiven und Inline-Shortcuts — Konfiguration, Routing und Verhalten pro Oberfläche.
title: Slash-Befehle
x-i18n:
    generated_at: "2026-06-30T13:55:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

The Gateway verarbeitet Befehle, die als eigenständige Nachrichten gesendet werden und mit `/` beginnen.
Nur-Host-Bash-Befehle verwenden `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung an eine ACP-Sitzung gebunden ist, wird normaler Text an das ACP-
Harness weitergeleitet. Gateway-Verwaltungsbefehle bleiben lokal: `/acp ...` erreicht immer
den OpenClaw-Befehlshandler, und `/status` sowie `/unfocus` bleiben lokal, wann immer
die Befehlsverarbeitung für die Oberfläche aktiviert ist.

## Drei Befehlstypen

<CardGroup cols={3}>
  <Card title="Befehle" icon="terminal">
    Eigenständige `/...`-Nachrichten, die vom Gateway verarbeitet werden. Müssen als
    einziger Inhalt in der Nachricht gesendet werden.
  </Card>
  <Card title="Direktiven" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — werden aus der Nachricht entfernt, bevor das Modell
    sie sieht. Behalten Sitzungseinstellungen bei, wenn sie allein gesendet werden; dienen als Inline-Hinweise,
    wenn sie zusammen mit anderem Text gesendet werden.
  </Card>
  <Card title="Inline-Kurzbefehle" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — werden sofort ausgeführt und
    entfernt, bevor das Modell den verbleibenden Text sieht. Nur autorisierte Absender.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Details zum Verhalten von Direktiven">
    - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
    - In Nachrichten mit **nur Direktiven** (die Nachricht besteht nur aus Direktiven) werden sie
      in der Sitzung gespeichert und mit einer Bestätigung beantwortet.
    - In **normalen Chat**-Nachrichten mit anderem Text dienen sie als Inline-Hinweise und
      speichern **keine** Sitzungseinstellungen dauerhaft.
    - Direktiven gelten nur für **autorisierte Absender**. Wenn `commands.allowFrom`
      gesetzt ist, ist dies die einzige verwendete Allowlist; andernfalls ergibt sich die Autorisierung aus
      Kanal-Allowlists/Pairing plus `commands.useAccessGroups`. Nicht autorisierte
      Absender sehen Direktiven als Klartext behandelt.
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
  Aktiviert das Parsen von `/...` in Chatnachrichten. Auf Oberflächen ohne native Befehle
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) funktionieren Textbefehle
  auch dann, wenn dies auf `false` gesetzt ist.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registriert native Befehle. Auto: aktiviert für Discord/Telegram; deaktiviert für Slack;
  ignoriert für Provider ohne native Unterstützung. Pro Kanal mit
  `channels.<provider>.commands.native` überschreiben. Bei Discord überspringt `false` die Slash-Befehl-
  Registrierung; zuvor registrierte Befehle können sichtbar bleiben, bis sie entfernt werden.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registriert Skill-Befehle nativ, wenn unterstützt. Auto: aktiviert für
  Discord/Telegram; deaktiviert für Slack. Mit
  `channels.<provider>.commands.nativeSkills` überschreiben.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Aktiviert `! <cmd>` zum Ausführen von Host-Shell-Befehlen (`/bash <cmd>`-Alias). Erfordert
  `tools.elevated`-Allowlists.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` setzt
  sofort in den Hintergrund).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Aktiviert `/config` (liest/schreibt `openclaw.json`). Nur für Eigentümer.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Aktiviert `/mcp` (liest/schreibt OpenClaw-verwaltete MCP-Konfiguration unter `mcp.servers`). Nur für Eigentümer.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Aktiviert `/plugins` (Plugin-Erkennung/-Status plus Installation + Aktivieren/Deaktivieren). Schreibzugriffe nur für Eigentümer.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Aktiviert `/debug` (nur zur Laufzeit geltende Konfigurationsüberschreibungen). Nur für Eigentümer.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` und Gateway-Neustart-Tool-Aktionen.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Explizite Eigentümer-Allowlist für nur für Eigentümer verfügbare Befehlsoberflächen. Getrennt von
  `commands.allowFrom` und DM-Pairing-Zugriff.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Kanal: erfordert die Eigentümeridentität für nur für Eigentümer verfügbare Befehle. Wenn `true`,
  muss der Absender `commands.ownerAllowFrom` entsprechen oder den internen `operator.admin`-
  Scope besitzen. Ein Wildcard-Eintrag in `allowFrom` reicht **nicht** aus.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Eigentümer-IDs im System-Prompt angezeigt werden.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-Secret, das bei `commands.ownerDisplay: "hash"` verwendet wird.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Provider-spezifische Allowlist für Befehlsautorisierung. Wenn konfiguriert, ist sie die
  **einzige** Autorisierungsquelle für Befehle und Direktiven. Verwenden Sie `"*"` für eine
  globale Voreinstellung; Provider-spezifische Schlüssel überschreiben sie.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.
</ParamField>

## Befehlsliste

Befehle stammen aus drei Quellen:

- **Core-Built-ins:** `src/auto-reply/commands-registry.shared.ts`
- **Generierte Dock-Befehle:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-Befehle:** Plugin-`registerCommand()`-Aufrufe

Verfügbarkeit hängt von Konfigurations-Flags, Kanaloberfläche und installierten/aktivierten
Plugins ab.

### Core-Befehle

<AccordionGroup>
  <Accordion title="Sitzungen und Ausführungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/new [model]` | Archiviert die aktuelle Sitzung und startet eine neue |
    | `/reset [soft [message]]` | Setzt die aktuelle Sitzung an Ort und Stelle zurück. `soft` behält das Transkript, verwirft wiederverwendete CLI-Backend-Sitzungs-IDs und führt den Start erneut aus |
    | `/name <title>` | Benennt die aktuelle Sitzung oder benennt sie um. Lassen Sie den Titel weg, um den aktuellen Namen und einen Vorschlag anzuzeigen |
    | `/compact [instructions]` | Komprimiert den Sitzungskontext. Siehe [Compaction](/de/concepts/compaction) |
    | `/stop` | Bricht die aktuelle Ausführung ab |
    | `/session idle <duration\|off>` | Verwaltet den Ablauf bei Inaktivität der Thread-Bindung |
    | `/session max-age <duration\|off>` | Verwaltet den Ablauf des Maximalalters der Thread-Bindung |
    | `/export-session [path]` | Exportiert die aktuelle Sitzung nach HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exportiert ein JSONL-Trajektorien-Bundle für die aktuelle Sitzung. Alias: `/trajectory` |

    <Note>
      Die Control UI fängt getipptes `/new` ab, um eine neue
      Dashboard-Sitzung zu erstellen und zu ihr zu wechseln, außer wenn `session.dmScope: "main"` konfiguriert ist
      und das aktuelle übergeordnete Element die Hauptsitzung des Agenten ist — in diesem Fall setzt `/new`
      die Hauptsitzung an Ort und Stelle zurück. Getipptes `/reset` führt weiterhin das
      In-Place-Reset des Gateway aus. Verwenden Sie `/model default`, wenn Sie eine angeheftete
      Modellauswahl der Sitzung löschen möchten.
    </Note>

  </Accordion>

  <Accordion title="Modell- und Ausführungssteuerungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/think <level\|default>` | Legt die Denkstufe fest oder löscht die Sitzungsüberschreibung. Aliasse: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schaltet ausführliche Ausgabe um. Alias: `/v` |
    | `/trace on\|off` | Schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um |
    | `/fast [status\|auto\|on\|off\|default]` | Zeigt den Schnellmodus an, setzt ihn oder löscht ihn |
    | `/reasoning [on\|off\|stream]` | Schaltet Sichtbarkeit von Reasoning um. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schaltet den erhöhten Modus um. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Zeigt Exec-Standardeinstellungen an oder legt sie fest |
    | `/model [name\|#\|status]` | Zeigt das Modell an oder legt es fest |
    | `/models [provider] [page] [limit=<n>\|all]` | Listet konfigurierte/auth-verfügbare Provider oder Modelle auf |
    | `/queue <mode>` | Verwaltet das Warteschlangenverhalten aktiver Ausführungen. Siehe [Queue](/de/concepts/queue) und [Queue steering](/de/concepts/queue-steering) |
    | `/steer <message>` | Fügt Anleitung in die aktive Ausführung ein. Alias: `/tell`. Siehe [Steer](/de/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sicherheit bei verbose / trace / fast / reasoning">
        - `/verbose` ist zum Debuggen gedacht — lassen Sie es im normalen Gebrauch **aus**.
        - `/trace` zeigt nur Plugin-eigene Trace-/Debug-Zeilen; normales ausführliches Rauschen bleibt aus.
        - `/fast auto|on|off` speichert eine Sitzungsüberschreibung; verwenden Sie die Option `inherit` in der Sessions UI, um sie zu löschen.
        - `/fast` ist Provider-spezifisch: OpenAI/Codex ordnen es `service_tier=priority` zu; direkte Anthropic-Anfragen ordnen es `service_tier=auto` oder `standard_only` zu.
        - `/reasoning`, `/verbose` und `/trace` sind in Gruppeneinstellungen riskant — sie können internes Reasoning oder Plugin-Diagnosen offenlegen. Lassen Sie sie in Gruppenchats ausgeschaltet.

      </Accordion>
      <Accordion title="Details zum Modellwechsel">
        - `/model` speichert das neue Modell sofort in der Sitzung.
        - Wenn der Agent inaktiv ist, verwendet die nächste Ausführung es sofort.
        - Wenn eine Ausführung aktiv ist, wird der Wechsel als ausstehend markiert und beim nächsten sauberen Wiederholungspunkt angewendet.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Erkennung und Status">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/help` | Zeigt die kurze Hilfezusammenfassung |
    | `/commands` | Zeigt den generierten Befehlskatalog |
    | `/tools [compact\|verbose]` | Zeigt, was der aktuelle Agent gerade verwenden kann |
    | `/status` | Zeigt Ausführungs-/Laufzeitstatus, Gateway- und System-Uptime, Plugin-Integrität sowie Provider-Nutzung/-Kontingent |
    | `/status plugins` | Zeigt detaillierte Plugin-Integrität: Ladefehler, Quarantänen, Kanalausfälle, Abhängigkeitsprobleme, Kompatibilitätshinweise |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Verwaltet das dauerhafte [Ziel](/de/tools/goal) der aktuellen Sitzung |
    | `/diagnostics [note]` | Supportbericht-Flow nur für Eigentümer. Fragt jedes Mal nach Exec-Genehmigung |
    | `/crestodian <request>` | Führt den Crestodian-Einrichtungs- und Reparaturhelfer aus einer Eigentümer-DM aus |
    | `/tasks` | Listet aktive/kürzliche Hintergrundaufgaben für die aktuelle Sitzung auf |
    | `/context [list\|detail\|map\|json]` | Erklärt, wie Kontext zusammengesetzt wird |
    | `/whoami` | Zeigt Ihre Absender-ID. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Steuert die Nutzungsfußzeile pro Antwort (`reset`/`inherit`/`clear`/`default` löscht die Sitzungsüberschreibung, um wieder die konfigurierte Voreinstellung zu übernehmen) oder gibt eine lokale Kostenzusammenfassung aus |
  </Accordion>

  <Accordion title="Skills, Allowlists, Genehmigungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/skill <name> [input]` | Führt einen Skill nach Namen aus |
    | `/allowlist [list\|add\|remove] ...` | Verwaltet Allowlist-Einträge. Nur Text |
    | `/approve <id> <decision>` | Löst Exec- oder Plugin-Genehmigungsaufforderungen auf |
    | `/btw <question>` | Stellt eine Nebenfrage, ohne den Sitzungskontext zu ändern. Alias: `/side`. Siehe [BTW](/de/tools/btw) |
  </Accordion>

  <Accordion title="Subagents und ACP">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/subagents list\|log\|info` | Subagent-Läufe für die aktuelle Sitzung prüfen |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP-Sitzungen und Laufzeitoptionen verwalten. Laufzeitsteuerungen erfordern einen externen Owner oder eine interne Gateway-Admin-Identität |
    | `/focus <target>` | Den aktuellen Discord-Thread oder das aktuelle Telegram-Thema an ein Sitzungsziel binden |
    | `/unfocus` | Die aktuelle Thread-Bindung entfernen |
    | `/agents` | Thread-gebundene Agents für die aktuelle Sitzung auflisten |
  </Accordion>

  <Accordion title="Nur Owner: Schreibvorgänge und Admin">
    | Befehl | Erfordert | Beschreibung |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` lesen oder schreiben. Nur Owner |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Von OpenClaw verwaltete MCP-Serverkonfiguration lesen oder schreiben. Nur Owner |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin-Zustand prüfen oder ändern. Schreibvorgänge nur für Owner. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Nur-Laufzeit-Konfigurationsüberschreibungen. Nur Owner |
    | `/restart` | `commands.restart: true` (Standard) | OpenClaw neu starten |
    | `/send on\|off\|inherit` | Owner | Senderichtlinie festlegen |
  </Accordion>

  <Accordion title="Sprache, TTS, Kanalsteuerung">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS steuern. Siehe [TTS](/de/tools/tts) |
    | `/activation mention\|always` | Gruppenaktivierungsmodus festlegen |
    | `/bash <command>` | Einen Host-Shell-Befehl ausführen. Alias: `! <command>`. Erfordert `commands.bash: true` |
    | `!poll [sessionId]` | Einen Bash-Hintergrundauftrag prüfen |
    | `!stop [sessionId]` | Einen Bash-Hintergrundauftrag stoppen |
  </Accordion>
</AccordionGroup>

### Dock-Befehle

Dock-Befehle schalten die Antwortroute der aktiven Sitzung auf einen anderen verknüpften Kanal um.
Siehe [Kanal-Docking](/de/concepts/channel-docking) für Einrichtung und Fehlerbehebung.

Generiert aus Kanal-Plugins mit Unterstützung für native Befehle:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

Dock-Befehle erfordern `session.identityLinks`. Der Quellabsender und der Ziel-Peer
müssen sich in derselben Identitätsgruppe befinden.

### Befehle gebündelter Plugins

| Befehl                                                                                       | Beschreibung                                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Memory Dreaming umschalten (Owner oder Gateway-Admin). Siehe [Dreaming](/de/concepts/dreaming)           |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Geräte-Pairing verwalten. Siehe [Pairing](/de/channels/pairing)                                          |
| `/phone status\|arm ...\|disarm`                                                             | Risikoreiche Phone-Node-Befehle vorübergehend aktivieren                                              |
| `/voice status\|list\|set <voiceId>`                                                         | Talk-Sprachkonfiguration verwalten. Nativer Discord-Name: `/talkvoice`                                |
| `/card ...`                                                                                  | LINE-Rich-Card-Voreinstellungen senden. Siehe [LINE](/de/channels/line)                                  |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Das Codex-App-Server-Harness steuern. Siehe [Codex-Harness](/de/plugins/codex-harness)                   |

Nur QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-Befehle

Vom Benutzer aufrufbare Skills werden als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können sich als direkte Befehle registrieren (z. B. `/prose` für OpenProse).
- Die Registrierung nativer Skill-Befehle wird durch `commands.nativeSkills` und
  `channels.<provider>.commands.nativeSkills` gesteuert.
- Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); Kollisionen erhalten numerische Suffixe.

<AccordionGroup>
  <Accordion title="Weiterleitung von Skill-Befehlen">
    Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell geleitet.

    Skills können `command-dispatch: tool` deklarieren, um direkt an ein Tool
    weiterzuleiten (deterministisch, ohne Modellbeteiligung). Beispiel: `/prose` (OpenProse-Plugin)
    — siehe [OpenProse](/de/prose).

  </Accordion>
  <Accordion title="Argumente nativer Befehle">
    Discord verwendet Autovervollständigung für dynamische Optionen und Button-Menüs, wenn erforderliche
    Argumente ausgelassen werden. Telegram und Slack zeigen für Befehle mit
    Auswahlmöglichkeiten ein Button-Menü. Dynamische Auswahlmöglichkeiten werden gegen das Zielsitzungsmodell aufgelöst, sodass modell-
    spezifische Optionen wie `/think`-Stufen der `/model`-Überschreibung der Sitzung folgen.
  </Accordion>
</AccordionGroup>

## `/tools` — was der Agent jetzt verwenden kann

`/tools` beantwortet eine Laufzeitfrage: **was dieser Agent in dieser
Unterhaltung jetzt verwenden kann** — keinen statischen Konfigurationskatalog.

```text
/tools         # kompakte Ansicht
/tools verbose # mit kurzen Beschreibungen
```

Ergebnisse sind sitzungsbezogen. Ein Wechsel von Agent, Kanal, Thread, Absender-
Autorisierung oder Modell kann die Ausgabe ändern. Verwenden Sie zum Bearbeiten von Profilen und Überschreibungen
das Control-UI-Tools-Panel oder Konfigurationsoberflächen.

## `/model` — Modellauswahl

```text
/model             # Modell-Picker anzeigen
/model list        # gleich
/model 3           # nach Nummer aus dem Picker auswählen
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # Modellauswahl der Sitzung löschen
/model status      # Detailansicht mit Endpunkt und API-Modus
```

Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Provider- und
Modell-Dropdowns. Der Picker berücksichtigt `agents.defaults.models`, einschließlich
`provider/*`-Einträgen.

## `/config` — Konfigurationsschreibvorgänge auf Datenträger

<Note>
  Nur Owner. Standardmäßig deaktiviert — mit `commands.config: true` aktivieren.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Die Konfiguration wird vor dem Schreiben validiert. Ungültige Änderungen werden abgelehnt. `/config`-
Aktualisierungen bleiben über Neustarts hinweg erhalten.

## `/mcp` — MCP-Serverkonfiguration

<Note>
  Nur Owner. Standardmäßig deaktiviert — mit `commands.mcp: true` aktivieren.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in eingebetteten Agent-Projekteinstellungen.

## `/debug` — Nur-Laufzeit-Überschreibungen

<Note>
  Nur Owner. Standardmäßig deaktiviert — mit `commands.debug: true` aktivieren.
  Überschreibungen gelten sofort für neue Konfigurationslesevorgänge, schreiben aber **nicht** auf den Datenträger.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — Plugin-Verwaltung

<Note>
  Schreibvorgänge nur für Owner. Standardmäßig deaktiviert — mit `commands.plugins: true` aktivieren.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` aktualisiert die Plugin-Konfiguration und lädt die Gateway-
Plugin-Laufzeit für neue Agent-Durchläufe per Hot-Reload neu. `/plugins install` startet verwaltete
Gateways automatisch neu, weil sich Plugin-Quellmodule geändert haben.

## `/trace` — Plugin-Trace-Ausgabe

```text
/trace          # aktuellen Trace-Zustand anzeigen
/trace on
/trace off
```

`/trace` zeigt sitzungsbezogene Plugin-Trace-/Debug-Zeilen ohne vollständigen ausführlichen
Modus. Es ersetzt nicht `/debug` (Laufzeitüberschreibungen) oder `/verbose` (normale
Tool-Ausgabe).

## `/btw` — Nebenfragen

`/btw` ist eine kurze Nebenfrage zum aktuellen Sitzungskontext. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Anders als eine normale Nachricht:

- Verwendet die aktuelle Sitzung als Hintergrundkontext.
- Wird in Codex-Harness-Sitzungen als flüchtiger Codex-Nebenthread ausgeführt.
- Ändert den zukünftigen Sitzungskontext **nicht**.
- Wird nicht in den Transkriptverlauf geschrieben.

Siehe [BTW-Nebenfragen](/de/tools/btw) für das vollständige Verhalten.

## Oberflächenhinweise

<AccordionGroup>
  <Accordion title="Sitzungsbereich je Oberfläche">
    - **Textbefehle:** werden in der normalen Chat-Sitzung ausgeführt (DMs teilen `main`, Gruppen haben ihre eigene Sitzung).
    - **Native Discord-Befehle:** `agent:<agentId>:discord:slash:<userId>`
    - **Native Slack-Befehle:** `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
    - **Native Telegram-Befehle:** `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
    - **`/stop`** zielt auf die aktive Chat-Sitzung, um den aktuellen Lauf abzubrechen.

  </Accordion>
  <Accordion title="Slack-spezifisch">
    `channels.slack.slashCommand` unterstützt einen einzelnen Befehl im Stil von `/openclaw`.
    Erstellen Sie mit `commands.native: true` einen Slack-Slash-Befehl pro integriertem
    Befehl. Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack
    `/status` reserviert. Text-`/status` funktioniert weiterhin in Slack-Nachrichten.
  </Accordion>
  <Accordion title="Schneller Pfad und Inline-Kurzbefehle">
    - Nur-Befehl-Nachrichten von erlaubten Absendern werden sofort verarbeitet (umgeht Warteschlange + Modell).
    - Inline-Kurzbefehle (`/help`, `/commands`, `/status`, `/whoami`) funktionieren auch eingebettet in normalen Nachrichten und werden entfernt, bevor das Modell den verbleibenden Text sieht.
    - Nicht autorisierte Nur-Befehl-Nachrichten werden stillschweigend ignoriert; Inline-`/...`-Tokens werden als Klartext behandelt.

  </Accordion>
  <Accordion title="Hinweise zu Argumenten">
    - Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (`/think: high`, `/send: on`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Provider-Namen (unscharfe Übereinstimmung); wenn keine Übereinstimmung vorhanden ist, wird der Text als Nachrichtentext behandelt.
    - `/allowlist add|remove` erfordert `commands.config: true` und berücksichtigt Kanal-`configWrites`.

  </Accordion>
</AccordionGroup>

## Provider-Nutzung und Status

- **Provider-Nutzung/-Kontingent** (z. B. „Claude 80 % übrig“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn Nutzungsverfolgung aktiviert ist.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Transkript-Nutzungseintrag zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist.
- **Ausführung vs. Laufzeit:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` dafür, wer die Sitzung ausführt: `OpenClaw Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Tokens/Kosten pro Antwort:** gesteuert durch `/usage off|tokens|full`.
- Bei `/model status` geht es um Modelle/Auth/Endpunkte, nicht um Nutzung.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills" href="/de/tools/skills" icon="puzzle-piece">
    Wie Skill-Slash-Befehle registriert und gesteuert werden.
  </Card>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Einen Skill erstellen, der seinen eigenen Slash-Befehl registriert.
  </Card>
  <Card title="BTW" href="/de/tools/btw" icon="comments">
    Nebenfragen, ohne den Sitzungskontext zu ändern.
  </Card>
  <Card title="Steer" href="/de/tools/steer" icon="compass">
    Den Agent während eines Laufs mit `/steer` anleiten.
  </Card>
</CardGroup>
