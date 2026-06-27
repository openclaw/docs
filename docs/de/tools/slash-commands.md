---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Debugging von Befehlsrouting oder Berechtigungen
    - Verstehen, wie Befehle für Skills registriert werden
sidebarTitle: Slash commands
summary: Alle verfügbaren Slash-Befehle, Direktiven und Inline-Kurzbefehle — Konfiguration, Routing und Verhalten pro Oberfläche.
title: Slash-Befehle
x-i18n:
    generated_at: "2026-06-27T18:21:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

Der Gateway verarbeitet Befehle, die als eigenständige Nachrichten gesendet werden und mit `/` beginnen.
Nur-Host-Bash-Befehle verwenden `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung an eine ACP-Sitzung gebunden ist, wird normaler Text an das ACP-Harness geleitet. Gateway-Verwaltungsbefehle bleiben lokal: `/acp ...` erreicht immer den OpenClaw-Befehlshandler, und `/status` sowie `/unfocus` bleiben lokal, wann immer die Befehlsverarbeitung für die Oberfläche aktiviert ist.

## Drei Befehlstypen

<CardGroup cols={3}>
  <Card title="Befehle" icon="terminal">
    Eigenständige `/...`-Nachrichten, die vom Gateway verarbeitet werden. Sie müssen als einziger Inhalt in der Nachricht gesendet werden.
  </Card>
  <Card title="Direktiven" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` — werden aus der Nachricht entfernt, bevor das Modell sie sieht. Speichern Sitzungseinstellungen dauerhaft, wenn sie allein gesendet werden; wirken als Inline-Hinweise, wenn sie mit anderem Text gesendet werden.
  </Card>
  <Card title="Inline-Kurzbefehle" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — werden sofort ausgeführt und entfernt, bevor das Modell den verbleibenden Text sieht. Nur autorisierte Absender.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Details zum Verhalten von Direktiven">
    - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
    - In **nur aus Direktiven bestehenden** Nachrichten (die Nachricht enthält nur Direktiven) werden sie in der Sitzung gespeichert und mit einer Bestätigung beantwortet.
    - In **normalen Chat**-Nachrichten mit anderem Text wirken sie als Inline-Hinweise und speichern Sitzungseinstellungen **nicht** dauerhaft.
    - Direktiven gelten nur für **autorisierte Absender**. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige verwendete Allowlist; andernfalls ergibt sich die Autorisierung aus Kanal-Allowlists/Kopplung plus `commands.useAccessGroups`. Bei nicht autorisierten Absendern werden Direktiven als normaler Text behandelt.
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
  Aktiviert das Parsen von `/...` in Chatnachrichten. Auf Oberflächen ohne native Befehle (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) funktionieren Textbefehle auch dann, wenn dies auf `false` gesetzt ist.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registriert native Befehle. Auto: ein für Discord/Telegram; aus für Slack; wird für Provider ohne native Unterstützung ignoriert. Überschreiben Sie dies pro Kanal mit `channels.<provider>.commands.native`. Bei Discord überspringt `false` die Registrierung von Slash-Befehlen; zuvor registrierte Befehle können sichtbar bleiben, bis sie entfernt werden.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registriert Skill-Befehle nativ, wenn unterstützt. Auto: ein für Discord/Telegram; aus für Slack. Überschreiben Sie dies mit `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Aktiviert `! <cmd>`, um Host-Shell-Befehle auszuführen (Alias `/bash <cmd>`). Erfordert `tools.elevated`-Allowlists.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` verschiebt sofort in den Hintergrund).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Aktiviert `/config` (liest/schreibt `openclaw.json`). Nur Owner.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`). Nur Owner.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Aktiviert `/plugins` (Plugin-Erkennung/-Status plus Installation und Aktivieren/Deaktivieren). Schreibzugriffe nur für Owner.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Aktiviert `/debug` (nur zur Laufzeit geltende Konfigurationsüberschreibungen). Nur Owner.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` und Tool-Aktionen zum Neustart des Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Explizite Owner-Allowlist für nur Ownern vorbehaltene Befehlsoberflächen. Getrennt von `commands.allowFrom` und DM-Kopplungszugriff.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Kanal: erfordert Owner-Identität für nur Ownern vorbehaltene Befehle. Wenn `true`, muss der Absender `commands.ownerAllowFrom` entsprechen oder den internen Scope `operator.admin` besitzen. Ein Wildcard-Eintrag in `allowFrom` reicht **nicht** aus.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Owner-IDs im System-Prompt erscheinen.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-Secret, das bei `commands.ownerDisplay: "hash"` verwendet wird.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Provider-spezifische Allowlist für Befehlsautorisierung. Wenn konfiguriert, ist sie die **einzige** Autorisierungsquelle für Befehle und Direktiven. Verwenden Sie `"*"` für einen globalen Standard; Provider-spezifische Schlüssel überschreiben ihn.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.
</ParamField>

## Befehlsliste

Befehle stammen aus drei Quellen:

- **Integrierte Kernbefehle:** `src/auto-reply/commands-registry.shared.ts`
- **Generierte Dock-Befehle:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-Befehle:** Plugin-Aufrufe von `registerCommand()`

Die Verfügbarkeit hängt von Konfigurationsflags, Kanaloberfläche und installierten/aktivierten Plugins ab.

### Kernbefehle

<AccordionGroup>
  <Accordion title="Sitzungen und Läufe">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/new [model]` | Archiviert die aktuelle Sitzung und startet eine neue |
    | `/reset [soft [message]]` | Setzt die aktuelle Sitzung direkt zurück. `soft` behält das Transkript, verwirft wiederverwendete CLI-Backend-Sitzungs-IDs und führt den Start erneut aus |
    | `/name <title>` | Benennt die aktuelle Sitzung oder benennt sie um. Lassen Sie den Titel weg, um den aktuellen Namen und einen Vorschlag zu sehen |
    | `/compact [instructions]` | Komprimiert den Sitzungskontext. Siehe [Compaction](/de/concepts/compaction) |
    | `/stop` | Bricht den aktuellen Lauf ab |
    | `/session idle <duration\|off>` | Verwaltet den Ablauf der Inaktivität für Thread-Bindungen |
    | `/session max-age <duration\|off>` | Verwaltet den Maximalalter-Ablauf für Thread-Bindungen |
    | `/export-session [path]` | Exportiert die aktuelle Sitzung nach HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exportiert ein JSONL-Trajektorienpaket für die aktuelle Sitzung. Alias: `/trajectory` |

    <Note>
      Die Control UI fängt eingegebenes `/new` ab, um eine neue Dashboard-Sitzung zu erstellen und zu ihr zu wechseln, außer wenn `session.dmScope: "main"` konfiguriert ist und das aktuelle Parent die Hauptsitzung des Agenten ist — in diesem Fall setzt `/new` die Hauptsitzung direkt zurück. Eingegebenes `/reset` führt weiterhin das direkte Zurücksetzen des Gateway aus. Verwenden Sie `/model default`, wenn Sie eine fixierte Modellauswahl der Sitzung löschen möchten.
    </Note>

  </Accordion>

  <Accordion title="Modell- und Laufsteuerung">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/think <level\|default>` | Legt die Denkstufe fest oder löscht die Sitzungsüberschreibung. Aliasse: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schaltet ausführliche Ausgabe um. Alias: `/v` |
    | `/trace on\|off` | Schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um |
    | `/fast [status\|auto\|on\|off\|default]` | Zeigt, setzt oder löscht den schnellen Modus |
    | `/reasoning [on\|off\|stream]` | Schaltet Sichtbarkeit von Reasoning um. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schaltet den erhöhten Modus um. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Zeigt oder setzt Exec-Standards |
    | `/model [name\|#\|status]` | Zeigt oder setzt das Modell |
    | `/models [provider] [page] [limit=<n>\|all]` | Listet konfigurierte/auth-verfügbare Provider oder Modelle auf |
    | `/queue <mode>` | Verwaltet das Warteschlangenverhalten aktiver Läufe. Siehe [Queue](/de/concepts/queue) und [Queue-Steuerung](/de/concepts/queue-steering) |
    | `/steer <message>` | Fügt Anleitung in den aktiven Lauf ein. Alias: `/tell`. Siehe [Steer](/de/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sicherheit bei verbose / trace / fast / reasoning">
        - `/verbose` ist für Debugging gedacht — lassen Sie es bei normaler Nutzung **aus**.
        - `/trace` zeigt nur Plugin-eigene Trace-/Debug-Zeilen; normales ausführliches Rauschen bleibt aus.
        - `/fast auto|on|off` speichert eine Sitzungsüberschreibung dauerhaft; verwenden Sie die Option `inherit` in der Sessions UI, um sie zu löschen.
        - `/fast` ist Provider-spezifisch: OpenAI/Codex ordnen es `service_tier=priority` zu; direkte Anthropic-Anfragen ordnen es `service_tier=auto` oder `standard_only` zu.
        - `/reasoning`, `/verbose` und `/trace` sind in Gruppenumgebungen riskant — sie können internes Reasoning oder Plugin-Diagnosen offenlegen. Lassen Sie sie in Gruppenchats aus.

      </Accordion>
      <Accordion title="Details zum Modellwechsel">
        - `/model` speichert das neue Modell sofort in der Sitzung.
        - Wenn der Agent inaktiv ist, verwendet der nächste Lauf es sofort.
        - Wenn ein Lauf aktiv ist, wird der Wechsel als ausstehend markiert und beim nächsten sauberen Wiederholungspunkt angewendet.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Erkennung und Status">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/help` | Zeigt die kurze Hilfezusammenfassung |
    | `/commands` | Zeigt den generierten Befehlskatalog |
    | `/tools [compact\|verbose]` | Zeigt, was der aktuelle Agent gerade verwenden kann |
    | `/status` | Zeigt Ausführungs-/Laufzeitstatus, Gateway- und System-Uptime, Plugin-Zustand sowie Provider-Nutzung/-Kontingent |
    | `/status plugins` | Zeigt detaillierten Plugin-Zustand: Ladefehler, Quarantänen, Kanalfehler, Abhängigkeitsprobleme, Kompatibilitätshinweise |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Verwaltet das dauerhafte [Ziel](/de/tools/goal) der aktuellen Sitzung |
    | `/diagnostics [note]` | Support-Berichtsablauf nur für Owner. Fragt jedes Mal nach Exec-Genehmigung |
    | `/crestodian <request>` | Führt den Crestodian-Einrichtungs- und Reparaturhelfer aus einer Owner-DM aus |
    | `/tasks` | Listet aktive/kürzliche Hintergrundaufgaben für die aktuelle Sitzung auf |
    | `/context [list\|detail\|map\|json]` | Erklärt, wie Kontext zusammengestellt wird |
    | `/whoami` | Zeigt Ihre Absender-ID. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Steuert die Nutzungsfußzeile pro Antwort (`reset`/`inherit`/`clear`/`default` löscht die Sitzungsüberschreibung, damit wieder der konfigurierte Standard geerbt wird) oder gibt eine lokale Kostenzusammenfassung aus |
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
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP-Sitzungen und Laufzeitoptionen verwalten |
    | `/focus <target>` | Den aktuellen Discord-Thread oder das Telegram-Thema an ein Sitzungsziel binden |
    | `/unfocus` | Die aktuelle Thread-Bindung entfernen |
    | `/agents` | Thread-gebundene Agents für die aktuelle Sitzung auflisten |
  </Accordion>

  <Accordion title="Nur-Owner-Schreibzugriffe und Administration">
    | Befehl | Erfordert | Beschreibung |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` lesen oder schreiben. Nur Owner |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Von OpenClaw verwaltete MCP-Server-Konfiguration lesen oder schreiben. Nur Owner |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin-Status prüfen oder ändern. Schreibzugriffe nur für Owner. Alias: `/plugin` |
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
    | `!poll [sessionId]` | Einen Hintergrund-bash-Job prüfen |
    | `!stop [sessionId]` | Einen Hintergrund-bash-Job stoppen |
  </Accordion>
</AccordionGroup>

### Dock-Befehle

Dock-Befehle schalten die Antwortroute der aktiven Sitzung auf einen anderen verknüpften Kanal um.
Siehe [Kanal-Docking](/de/concepts/channel-docking) für Einrichtung und Fehlerbehebung.

Aus Kanal-Plugins mit nativer Befehlsunterstützung generiert:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

Dock-Befehle erfordern `session.identityLinks`. Der Quellabsender und der Ziel-Peer
müssen in derselben Identitätsgruppe sein.

### Gebündelte Plugin-Befehle

| Befehl                                                                                       | Beschreibung                                                                      |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Memory-Dreaming umschalten. Siehe [Dreaming](/de/concepts/dreaming)                  |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Geräte-Pairing verwalten. Siehe [Pairing](/de/channels/pairing)                      |
| `/phone status\|arm ...\|disarm`                                                             | Hochriskante Telefonknoten-Befehle vorübergehend scharfschalten                   |
| `/voice status\|list\|set <voiceId>`                                                         | Talk-Sprachkonfiguration verwalten. Nativer Discord-Name: `/talkvoice`            |
| `/card ...`                                                                                  | LINE-Rich-Card-Voreinstellungen senden. Siehe [LINE](/de/channels/line)              |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Das Codex-App-Server-Harness steuern. Siehe [Codex-Harness](/de/plugins/codex-harness) |

Nur QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-Befehle

Von Benutzern aufrufbare Skills werden als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können sich als direkte Befehle registrieren (z. B. `/prose` für OpenProse).
- Native Skill-Befehlsregistrierung wird durch `commands.nativeSkills` und
  `channels.<provider>.commands.nativeSkills` gesteuert.
- Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); Kollisionen erhalten numerische Suffixe.

<AccordionGroup>
  <Accordion title="Skill-Befehlsverteilung">
    Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.

    Skills können `command-dispatch: tool` deklarieren, um direkt an ein Tool weiterzuleiten
    (deterministisch, ohne Modellbeteiligung). Beispiel: `/prose` (OpenProse-Plugin)
    — siehe [OpenProse](/de/prose).

  </Accordion>
  <Accordion title="Argumente für native Befehle">
    Discord verwendet Autovervollständigung für dynamische Optionen und Button-Menüs, wenn erforderliche
    Argumente weggelassen werden. Telegram und Slack zeigen ein Button-Menü für Befehle mit
    Auswahlmöglichkeiten. Dynamische Auswahlmöglichkeiten werden gegen das Zielsitzungsmodell aufgelöst, sodass modell-
    spezifische Optionen wie `/think`-Stufen der `/model`-Überschreibung der Sitzung folgen.
  </Accordion>
</AccordionGroup>

## `/tools` — was der Agent jetzt verwenden kann

`/tools` beantwortet eine Laufzeitfrage: **was dieser Agent gerade in dieser
Unterhaltung verwenden kann** — kein statischer Konfigurationskatalog.

```text
/tools         # kompakte Ansicht
/tools verbose # mit Kurzbeschreibungen
```

Ergebnisse sind sitzungsbezogen. Ein Wechsel von Agent, Kanal, Thread, Absender-
Autorisierung oder Modell kann die Ausgabe ändern. Zum Bearbeiten von Profilen und Überschreibungen
verwenden Sie das Tools-Panel der Control UI oder Konfigurationsoberflächen.

## `/model` — Modellauswahl

```text
/model             # Modellauswahl anzeigen
/model list        # identisch
/model 3           # nach Nummer aus der Auswahl auswählen
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # Modellauswahl der Sitzung löschen
/model status      # detaillierte Ansicht mit Endpunkt und API-Modus
```

Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Provider- und
Modell-Dropdowns. Die Auswahl berücksichtigt `agents.defaults.models`, einschließlich
`provider/*`-Einträgen.

## `/config` — Konfigurationsschreibzugriffe auf Datenträger

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

## `/mcp` — MCP-Server-Konfiguration

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
  Für Schreibzugriffe nur Owner. Standardmäßig deaktiviert — mit `commands.plugins: true` aktivieren.
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
Plugin-Laufzeit für neue Agent-Turns neu. `/plugins install` startet verwaltete
Gateways automatisch neu, weil sich Plugin-Quellmodule geändert haben.

## `/trace` — Plugin-Trace-Ausgabe

```text
/trace          # aktuellen Trace-Status anzeigen
/trace on
/trace off
```

`/trace` zeigt sitzungsbezogene Plugin-Trace-/Debug-Zeilen ohne vollständigen ausführlichen
Modus. Es ersetzt weder `/debug` (Laufzeitüberschreibungen) noch `/verbose` (normale
Tool-Ausgabe).

## `/btw` — Nebenfragen

`/btw` ist eine schnelle Nebenfrage zum aktuellen Sitzungskontext. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Anders als eine normale Nachricht:

- Verwendet die aktuelle Sitzung als Hintergrundkontext.
- Läuft in Codex-Harness-Sitzungen als flüchtiger Codex-Nebenthread.
- Ändert den zukünftigen Sitzungskontext **nicht**.
- Wird nicht in den Transkriptverlauf geschrieben.

Siehe [BTW-Nebenfragen](/de/tools/btw) für das vollständige Verhalten.

## Oberflächenhinweise

<AccordionGroup>
  <Accordion title="Sitzungsbereich pro Oberfläche">
    - **Textbefehle:** laufen in der normalen Chat-Sitzung (DMs teilen `main`, Gruppen haben ihre eigene Sitzung).
    - **Native Discord-Befehle:** `agent:<agentId>:discord:slash:<userId>`
    - **Native Slack-Befehle:** `agent:<agentId>:slack:slash:<userId>` (Präfix über `channels.slack.slashCommand.sessionPrefix` konfigurierbar)
    - **Native Telegram-Befehle:** `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
    - **`/stop`** zielt auf die aktive Chat-Sitzung, um den aktuellen Lauf abzubrechen.

  </Accordion>
  <Accordion title="Slack-Besonderheiten">
    `channels.slack.slashCommand` unterstützt einen einzelnen Befehl im Stil von `/openclaw`.
    Mit `commands.native: true` erstellen Sie pro integriertem Befehl einen Slack-Slash-Befehl.
    Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack
    `/status` reserviert. Text-`/status` funktioniert weiterhin in Slack-Nachrichten.
  </Accordion>
  <Accordion title="Schneller Pfad und Inline-Kurzbefehle">
    - Nur-Befehl-Nachrichten von Absendern auf der allowlist werden sofort verarbeitet (Queue + Modell werden umgangen).
    - Inline-Kurzbefehle (`/help`, `/commands`, `/status`, `/whoami`) funktionieren auch eingebettet in normale Nachrichten und werden entfernt, bevor das Modell den verbleibenden Text sieht.
    - Nicht autorisierte Nur-Befehl-Nachrichten werden still ignoriert; Inline-`/...`-Tokens werden als Klartext behandelt.

  </Accordion>
  <Accordion title="Argumenthinweise">
    - Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (`/think: high`, `/send: on`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Provider-Namen (Fuzzy-Match); wenn es keine Übereinstimmung gibt, wird der Text als Nachrichtentext behandelt.
    - `/allowlist add|remove` erfordert `commands.config: true` und berücksichtigt Kanal-`configWrites`.

  </Accordion>
</AccordionGroup>

## Provider-Nutzung und Status

- **Provider-Nutzung/-Kontingent** (z. B. "Claude 80% left") wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn Nutzungsverfolgung aktiviert ist.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Transkript-Nutzungseintrag zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist.
- **Ausführung vs. Laufzeit:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` dafür, wer die Sitzung ausführt: `OpenClaw Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Token/Kosten pro Antwort:** wird durch `/usage off|tokens|full` gesteuert.
- Bei `/model status` geht es um Modelle/Auth/Endpunkte, nicht um Nutzung.

## Verwandt

<CardGroup cols={2}>
  <Card title="Skills" href="/de/tools/skills" icon="puzzle-piece">
    Wie Skill-Slash-Befehle registriert und über Gates gesteuert werden.
  </Card>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellen Sie einen Skill, der seinen eigenen Slash-Befehl registriert.
  </Card>
  <Card title="BTW" href="/de/tools/btw" icon="comments">
    Nebenfragen, ohne den Sitzungskontext zu ändern.
  </Card>
  <Card title="Steer" href="/de/tools/steer" icon="compass">
    Den Agent mitten im Lauf mit `/steer` anleiten.
  </Card>
</CardGroup>
