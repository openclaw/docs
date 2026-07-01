---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Debugging von Befehlsrouting oder Berechtigungen
    - Verstehen, wie Skill-Befehle registriert werden
sidebarTitle: Slash commands
summary: Alle verfügbaren Slash-Befehle, Direktiven und Inline-Kurzbefehle — Konfiguration, Routing und Verhalten pro Oberfläche.
title: Slash-Befehle
x-i18n:
    generated_at: "2026-07-01T20:17:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Der Gateway verarbeitet Befehle, die als eigenständige Nachrichten mit `/` am Anfang gesendet werden.
Nur-Host-Bash-Befehle verwenden `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung an eine ACP-Sitzung gebunden ist, wird normaler Text an das ACP-
Harness weitergeleitet. Gateway-Verwaltungsbefehle bleiben lokal: `/acp ...` erreicht immer
den OpenClaw-Befehlshandler, und `/status` sowie `/unfocus` bleiben lokal, wenn
die Befehlsverarbeitung für die Oberfläche aktiviert ist.

## Drei Befehlstypen

<CardGroup cols={3}>
  <Card title="Befehle" icon="terminal">
    Eigenständige `/...`-Nachrichten, die vom Gateway verarbeitet werden. Sie müssen als
    einziger Inhalt der Nachricht gesendet werden.
  </Card>
  <Card title="Direktiven" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — werden aus der Nachricht entfernt, bevor das Modell
    sie sieht. Sie speichern Sitzungseinstellungen dauerhaft, wenn sie allein gesendet werden;
    sie dienen als Inline-Hinweise, wenn sie mit anderem Text gesendet werden.
  </Card>
  <Card title="Inline-Kurzbefehle" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — werden sofort ausgeführt und
    entfernt, bevor das Modell den verbleibenden Text sieht. Nur autorisierte Absender.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Details zum Verhalten von Direktiven">
    - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
    - In Nachrichten, die **nur Direktiven** enthalten (die Nachricht besteht nur aus Direktiven),
      bleiben sie in der Sitzung gespeichert und antworten mit einer Bestätigung.
    - In **normalen Chat**-Nachrichten mit anderem Text wirken sie als Inline-Hinweise und
      speichern Sitzungseinstellungen **nicht** dauerhaft.
    - Direktiven gelten nur für **autorisierte Absender**. Wenn `commands.allowFrom`
      gesetzt ist, ist dies die einzige verwendete Allowlist; andernfalls ergibt sich die
      Autorisierung aus Channel-Allowlists/Kopplung plus `commands.useAccessGroups`. Nicht autorisierte
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
  Registriert native Befehle. Auto: ein für Discord/Telegram; aus für Slack;
  wird bei Providern ohne native Unterstützung ignoriert. Pro Channel überschreiben mit
  `channels.<provider>.commands.native`. Bei Discord überspringt `false` die Registrierung von Slash-Befehlen;
  zuvor registrierte Befehle können sichtbar bleiben, bis sie entfernt werden.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registriert Skill-Befehle nativ, wenn unterstützt. Auto: ein für
  Discord/Telegram; aus für Slack. Überschreiben mit
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Aktiviert `! <cmd>`, um Host-Shell-Befehle auszuführen (`/bash <cmd>`-Alias). Erfordert
  `tools.elevated`-Allowlists.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` sendet
  sofort in den Hintergrund).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Aktiviert `/config` (liest/schreibt `openclaw.json`). Nur für Owner.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`). Nur für Owner.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Aktiviert `/plugins` (Plugin-Erkennung/-Status plus Installieren und Aktivieren/Deaktivieren). Schreibzugriffe nur für Owner.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Aktiviert `/debug` (nur laufzeitbezogene Konfigurationsüberschreibungen). Nur für Owner.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` und Gateway-Neustart-Toolaktionen.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Explizite Owner-Allowlist für Befehlsoberflächen, die nur Owner verwenden dürfen. Getrennt von
  `commands.allowFrom` und DM-Kopplungszugriff.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Channel: erfordert Owner-Identität für Befehle, die nur Owner verwenden dürfen. Wenn `true`,
  muss der Absender `commands.ownerAllowFrom` entsprechen oder den internen `operator.admin`-
  Scope besitzen. Ein Wildcard-Eintrag in `allowFrom` ist **nicht** ausreichend.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Owner-IDs im System-Prompt angezeigt werden.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-Secret, das bei `commands.ownerDisplay: "hash"` verwendet wird.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Provider-spezifische Allowlist für Befehlsautorisierung. Wenn konfiguriert, ist sie die
  **einzige** Autorisierungsquelle für Befehle und Direktiven. Verwenden Sie `"*"` für einen
  globalen Standard; Provider-spezifische Schlüssel überschreiben ihn.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.
</ParamField>

## Befehlsliste

Befehle stammen aus drei Quellen:

- **Core-Built-ins:** `src/auto-reply/commands-registry.shared.ts`
- **Generierte Dock-Befehle:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-Befehle:** Plugin-`registerCommand()`-Aufrufe

Die Verfügbarkeit hängt von Konfigurationsflags, Channel-Oberfläche und installierten/aktivierten
Plugins ab.

### Core-Befehle

<AccordionGroup>
  <Accordion title="Sitzungen und Läufe">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/new [model]` | Archiviert die aktuelle Sitzung und startet eine neue |
    | `/reset [soft [message]]` | Setzt die aktuelle Sitzung an Ort und Stelle zurück. `soft` behält das Transkript, verwirft wiederverwendete CLI-Backend-Sitzungs-IDs und führt den Start erneut aus |
    | `/name <title>` | Benennt die aktuelle Sitzung oder ändert ihren Namen. Lassen Sie den Titel weg, um den aktuellen Namen und einen Vorschlag zu sehen |
    | `/compact [instructions]` | Komprimiert den Sitzungskontext. Siehe [Compaction](/de/concepts/compaction) |
    | `/stop` | Bricht den aktuellen Lauf ab |
    | `/session idle <duration\|off>` | Verwaltet den Idle-Ablauf der Thread-Bindung |
    | `/session max-age <duration\|off>` | Verwaltet den Max-Age-Ablauf der Thread-Bindung |
    | `/export-session [path]` | Exportiert die aktuelle Sitzung nach HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exportiert ein JSONL-Trajektorien-Bundle für die aktuelle Sitzung. Alias: `/trajectory` |

    <Note>
      Die Control UI fängt eingegebenes `/new` ab, um eine neue
      Dashboard-Sitzung zu erstellen und dorthin zu wechseln, außer wenn `session.dmScope: "main"` konfiguriert ist
      und das aktuelle übergeordnete Element die Hauptsitzung des Agenten ist — in diesem Fall setzt `/new`
      die Hauptsitzung an Ort und Stelle zurück. Eingegebenes `/reset` führt weiterhin den
      In-Place-Reset des Gateway aus. Verwenden Sie `/model default`, wenn Sie eine angeheftete
      Modellauswahl der Sitzung löschen möchten.
    </Note>

  </Accordion>

  <Accordion title="Modell- und Laufsteuerung">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/think <level\|default>` | Legt die Denkstufe fest oder löscht die Sitzungsüberschreibung. Aliasse: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schaltet ausführliche Ausgabe um. Alias: `/v` |
    | `/trace on\|off` | Schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um |
    | `/fast [status\|auto\|on\|off\|default]` | Zeigt Fast Mode an, setzt ihn oder löscht ihn |
    | `/reasoning [on\|off\|stream]` | Schaltet Sichtbarkeit von Reasoning um. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schaltet erhöhten Modus um. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Zeigt Exec-Standards an oder setzt sie |
    | `/login [codex\|openai\|openai-codex]` | Koppelt Codex/OpenAI-Login aus einem privaten Chat oder einer Web-UI-Sitzung. Nur Owner/Admin |
    | `/model [name\|#\|status]` | Zeigt das Modell an oder setzt es |
    | `/models [provider] [page] [limit=<n>\|all]` | Listet konfigurierte/auth-verfügbare Provider oder Modelle auf |
    | `/queue <mode>` | Verwaltet das Queue-Verhalten aktiver Läufe. Siehe [Queue](/de/concepts/queue) und [Queue-Steuerung](/de/concepts/queue-steering) |
    | `/steer <message>` | Fügt Anleitung in den aktiven Lauf ein. Alias: `/tell`. Siehe [Steer](/de/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sicherheit von verbose / trace / fast / reasoning">
        - `/verbose` ist für Debugging gedacht — lassen Sie es bei normaler Nutzung **aus**.
        - `/trace` zeigt nur Plugin-eigene Trace-/Debug-Zeilen; normales ausführliches Rauschen bleibt aus.
        - `/fast auto|on|off` speichert eine Sitzungsüberschreibung; verwenden Sie in der Sessions UI die Option `inherit`, um sie zu löschen.
        - `/fast` ist Provider-spezifisch: OpenAI/Codex ordnen es `service_tier=priority` zu; direkte Anthropic-Anfragen ordnen es `service_tier=auto` oder `standard_only` zu.
        - `/reasoning`, `/verbose` und `/trace` sind in Gruppenumgebungen riskant — sie können internes Reasoning oder Plugin-Diagnosen offenlegen. Lassen Sie sie in Gruppenchats aus.

      </Accordion>
      <Accordion title="Details zum Modellwechsel">
        - `/model` speichert das neue Modell sofort dauerhaft in der Sitzung.
        - Wenn der Agent im Leerlauf ist, verwendet der nächste Lauf es sofort.
        - Wenn ein Lauf aktiv ist, wird der Wechsel als ausstehend markiert und am nächsten sauberen Wiederholungspunkt angewendet.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Erkennung und Status">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/help` | Zeigt die kurze Hilfezusammenfassung |
    | `/commands` | Zeigt den generierten Befehlskatalog |
    | `/tools [compact\|verbose]` | Zeigt, was der aktuelle Agent jetzt verwenden kann |
    | `/status` | Zeigt Ausführungs-/Laufzeitstatus, Gateway- und System-Uptime, Plugin-Gesundheit sowie Provider-Nutzung/-Kontingent |
    | `/status plugins` | Zeigt detaillierte Plugin-Gesundheit: Ladefehler, Quarantänen, Channel-Fehler, Abhängigkeitsprobleme, Kompatibilitätshinweise |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Verwaltet das dauerhafte [Ziel](/de/tools/goal) der aktuellen Sitzung |
    | `/diagnostics [note]` | Supportbericht-Flow nur für Owner. Fragt jedes Mal nach Exec-Genehmigung |
    | `/crestodian <request>` | Führt den Crestodian-Einrichtungs- und Reparaturhelfer aus einer Owner-DM aus |
    | `/tasks` | Listet aktive/kürzliche Hintergrundaufgaben für die aktuelle Sitzung auf |
    | `/context [list\|detail\|map\|json]` | Erklärt, wie Kontext zusammengesetzt wird |
    | `/whoami` | Zeigt Ihre Absender-ID. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Steuert die Nutzungsfußzeile pro Antwort (`reset`/`inherit`/`clear`/`default` löscht die Sitzungsüberschreibung, sodass der konfigurierte Standard erneut geerbt wird) oder gibt eine lokale Kostenzusammenfassung aus |
  </Accordion>

  <Accordion title="Skills, Allowlists, Genehmigungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/skill <name> [input]` | Führt ein Skill nach Namen aus |
    | `/allowlist [list\|add\|remove] ...` | Verwaltet Allowlist-Einträge. Nur Text |
    | `/approve <id> <decision>` | Löst Exec- oder Plugin-Genehmigungsaufforderungen auf |
    | `/btw <question>` | Stellt eine Nebenfrage, ohne den Sitzungskontext zu ändern. Alias: `/side`. Siehe [BTW](/de/tools/btw) |
  </Accordion>

  <Accordion title="Subagenten und ACP">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/subagents list\|log\|info` | Subagenten-Läufe für die aktuelle Sitzung prüfen |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP-Sitzungen und Runtime-Optionen verwalten. Runtime-Steuerungen erfordern eine externe Owner- oder interne Gateway-Admin-Identität |
    | `/focus <target>` | Den aktuellen Discord-Thread oder das Telegram-Thema an ein Sitzungsziel binden |
    | `/unfocus` | Die aktuelle Thread-Bindung entfernen |
    | `/agents` | Thread-gebundene Agents für die aktuelle Sitzung auflisten |
  </Accordion>

  <Accordion title="Owner-only-Schreibzugriffe und Admin">
    | Befehl | Erfordert | Beschreibung |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` lesen oder schreiben. Nur Owner |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Von OpenClaw verwaltete MCP-Serverkonfiguration lesen oder schreiben. Nur Owner |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin-Status prüfen oder ändern. Schreibzugriffe nur für Owner. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Reine Runtime-Konfigurationsüberschreibungen. Nur Owner |
    | `/restart` | `commands.restart: true` (Standard) | OpenClaw neu starten |
    | `/send on\|off\|inherit` | Owner | Senderichtlinie festlegen |
  </Accordion>

  <Accordion title="Sprache, TTS, Kanalsteuerung">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS steuern. Siehe [TTS](/de/tools/tts) |
    | `/activation mention\|always` | Gruppenaktivierungsmodus festlegen |
    | `/bash <command>` | Einen Host-Shell-Befehl ausführen. Alias: `! <command>`. Erfordert `commands.bash: true` |
    | `!poll [sessionId]` | Einen Bash-Hintergrundjob prüfen |
    | `!stop [sessionId]` | Einen Bash-Hintergrundjob stoppen |
  </Accordion>
</AccordionGroup>

### Dock-Befehle

Dock-Befehle schalten die Antwort-Route der aktiven Sitzung auf einen anderen verknüpften Kanal um.
Siehe [Kanal-Docking](/de/concepts/channel-docking) für Einrichtung und Fehlerbehebung.

Generiert aus Kanal-Plugins mit Unterstützung für native Befehle:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

Dock-Befehle erfordern `session.identityLinks`. Der Quellabsender und der Ziel-Peer
müssen in derselben Identitätsgruppe sein.

### Gebündelte Plugin-Befehle

| Befehl                                                                                       | Beschreibung                                                                                 |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Memory-Dreaming umschalten (Owner oder Gateway-Admin). Siehe [Dreaming](/de/concepts/dreaming)  |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Gerätekopplung verwalten. Siehe [Kopplung](/de/channels/pairing)                                |
| `/phone status\|arm ...\|disarm`                                                             | Hochriskante Phone-Node-Befehle vorübergehend aktivieren                                     |
| `/voice status\|list\|set <voiceId>`                                                         | Talk-Sprachkonfiguration verwalten. Nativer Discord-Name: `/talkvoice`                       |
| `/card ...`                                                                                  | LINE-Rich-Card-Voreinstellungen senden. Siehe [LINE](/de/channels/line)                         |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Das Codex-App-Server-Harness steuern. Siehe [Codex-Harness](/de/plugins/codex-harness)          |

Nur QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-Befehle

Vom Benutzer aufrufbare Skills werden als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können sich als direkte Befehle registrieren (z. B. `/prose` für OpenProse).
- Die native Skill-Befehlsregistrierung wird durch `commands.nativeSkills` und
  `channels.<provider>.commands.nativeSkills` gesteuert.
- Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); Kollisionen erhalten numerische Suffixe.

<AccordionGroup>
  <Accordion title="Skill-Befehlsdispatch">
    Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.

    Skills können `command-dispatch: tool` deklarieren, um direkt an ein Tool
    weiterzuleiten (deterministisch, ohne Modellbeteiligung). Beispiel: `/prose` (OpenProse-Plugin)
    — siehe [OpenProse](/de/prose).

  </Accordion>
  <Accordion title="Argumente nativer Befehle">
    Discord verwendet Autovervollständigung für dynamische Optionen und Button-Menüs, wenn erforderliche
    Argumente fehlen. Telegram und Slack zeigen ein Button-Menü für Befehle mit
    Auswahlmöglichkeiten. Dynamische Auswahlmöglichkeiten werden gegen das Ziel-Sitzungsmodell aufgelöst, sodass modell-
    spezifische Optionen wie `/think`-Stufen der `/model`-Überschreibung der Sitzung folgen.
  </Accordion>
</AccordionGroup>

## `/tools` — was der Agent jetzt nutzen kann

`/tools` beantwortet eine Runtime-Frage: **was dieser Agent genau jetzt in dieser
Unterhaltung nutzen kann** — keinen statischen Konfigurationskatalog.

```text
/tools         # kompakte Ansicht
/tools verbose # mit kurzen Beschreibungen
```

Ergebnisse sind sitzungsbezogen. Änderungen an Agent, Kanal, Thread, Absender-
Autorisierung oder Modell können die Ausgabe ändern. Verwenden Sie zum Bearbeiten von Profilen und Überschreibungen
das Tools-Panel der Control UI oder Konfigurationsoberflächen.

## `/model` — Modellauswahl

```text
/model             # Modellauswahl anzeigen
/model list        # identisch
/model 3           # nach Nummer aus der Auswahl wählen
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # Modellauswahl der Sitzung löschen
/model status      # Detailansicht mit Endpunkt und API-Modus
```

In Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Provider- und
Modell-Dropdowns. Die Auswahl berücksichtigt `agents.defaults.models`, einschließlich
`provider/*`-Einträge.

## `/config` — Konfigurationsschreibzugriffe auf Datenträger

<Note>
  Nur Owner. Standardmäßig deaktiviert — aktivieren mit `commands.config: true`.
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
  Nur Owner. Standardmäßig deaktiviert — aktivieren mit `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` speichert Konfiguration in der OpenClaw-Konfiguration, nicht in Projektsettings eingebetteter Agents.

## `/debug` — reine Runtime-Überschreibungen

<Note>
  Nur Owner. Standardmäßig deaktiviert — aktivieren mit `commands.debug: true`.
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
  Schreibzugriffe nur für Owner. Standardmäßig deaktiviert — aktivieren mit `commands.plugins: true`.
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
Plugin-Runtime für neue Agent-Durchläufe neu. `/plugins install` startet verwaltete
Gateways automatisch neu, weil sich Plugin-Quellmodule geändert haben.

## `/trace` — Plugin-Trace-Ausgabe

```text
/trace          # aktuellen Trace-Status anzeigen
/trace on
/trace off
```

`/trace` zeigt sitzungsbezogene Plugin-Trace-/Debug-Zeilen ohne vollständigen Verbose-
Modus. Es ersetzt nicht `/debug` (Runtime-Überschreibungen) oder `/verbose` (normale
Tool-Ausgabe).

## `/btw` — Nebenfragen

`/btw` ist eine schnelle Nebenfrage zum aktuellen Sitzungskontext. Alias: `/side`.

```text
/btw was machen wir gerade?
/side was hat sich geändert, während der Hauptlauf weiterlief?
```

Anders als eine normale Nachricht:

- Nutzt die aktuelle Sitzung als Hintergrundkontext.
- Wird in Codex-Harness-Sitzungen als ephemerer Codex-Nebenthread ausgeführt.
- Ändert den künftigen Sitzungskontext **nicht**.
- Wird nicht in die Transkripthistorie geschrieben.

Siehe [BTW-Nebenfragen](/de/tools/btw) für das vollständige Verhalten.

## Oberflächenhinweise

<AccordionGroup>
  <Accordion title="Sitzungs-Scope pro Oberfläche">
    - **Textbefehle:** laufen in der normalen Chatsitzung (DMs teilen `main`, Gruppen haben ihre eigene Sitzung).
    - **Native Discord-Befehle:** `agent:<agentId>:discord:slash:<userId>`
    - **Native Slack-Befehle:** `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
    - **Native Telegram-Befehle:** `telegram:slash:<userId>` (zielen über `CommandTargetSessionKey` auf die Chatsitzung)
    - **`/login codex`** sendet Gerätekopplungscodes nur über private Chats oder Web-UI-Antwortpfade. Telegram-Gruppen-/Themenaufrufe bitten den Owner stattdessen, dem Bot per DM zu schreiben.
    - **`/stop`** zielt auf die aktive Chatsitzung, um den aktuellen Lauf abzubrechen.

  </Accordion>
  <Accordion title="Slack-Besonderheiten">
    `channels.slack.slashCommand` unterstützt einen einzelnen Befehl im Stil von `/openclaw`.
    Mit `commands.native: true` erstellen Sie einen Slack-Slash-Befehl pro integriertem
    Befehl. Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack
    `/status` reserviert. Text-`/status` funktioniert weiterhin in Slack-Nachrichten.
  </Accordion>
  <Accordion title="Schneller Pfad und Inline-Kurzbefehle">
    - Reine Befehlsnachrichten von allowlisted Absendern werden sofort verarbeitet (Queue + Modell werden umgangen).
    - Inline-Kurzbefehle (`/help`, `/commands`, `/status`, `/whoami`) funktionieren auch eingebettet in normalen Nachrichten und werden entfernt, bevor das Modell den verbleibenden Text sieht.
    - Nicht autorisierte reine Befehlsnachrichten werden still ignoriert; Inline-`/...`-Tokens werden als Klartext behandelt.

  </Accordion>
  <Accordion title="Argumenthinweise">
    - Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (`/think: high`, `/send: on`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Provider-Namen (Fuzzy-Match); wenn keine Übereinstimmung gefunden wird, wird der Text als Nachrichtentext behandelt.
    - `/allowlist add|remove` erfordert `commands.config: true` und berücksichtigt Kanal-`configWrites`.

  </Accordion>
</AccordionGroup>

## Provider-Nutzung und Status

- **Provider-Nutzung/-Kontingent** (z. B. „Claude 80 % übrig“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn Nutzungserfassung aktiviert ist.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungs-Eintrag im Transkript zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist.
- **Ausführung vs. Runtime:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` dafür, wer die Sitzung ausführt: `OpenClaw Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Tokens/Kosten pro Antwort:** gesteuert durch `/usage off|tokens|full`.
- `/model status` betrifft Modelle/Auth/Endpunkte, nicht Nutzung.

## Verwandt

<CardGroup cols={2}>
  <Card title="Skills" href="/de/tools/skills" icon="puzzle-piece">
    Wie Skill-Slash-Befehle registriert und gesteuert werden.
  </Card>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellen Sie einen Skill, der seinen eigenen Slash-Befehl registriert.
  </Card>
  <Card title="BTW" href="/de/tools/btw" icon="comments">
    Nebenfragen, ohne den Sitzungskontext zu ändern.
  </Card>
  <Card title="Steer" href="/de/tools/steer" icon="compass">
    Den Agent mitten im Lauf mit `/steer` steuern.
  </Card>
</CardGroup>
