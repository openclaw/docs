---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Debuggen der Befehlsweiterleitung oder Berechtigungen
    - Verstehen, wie Skill-Befehle registriert werden
sidebarTitle: Slash commands
summary: Alle verfügbaren Slash-Befehle, Direktiven und Inline-Kurzbefehle – Konfiguration, Routing und oberflächenspezifisches Verhalten.
title: Slash-Befehle
x-i18n:
    generated_at: "2026-07-12T16:06:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Der Gateway verarbeitet Befehle, die als eigenständige, mit `/` beginnende Nachrichten gesendet werden.
Bash-Befehle, die nur auf dem Host ausgeführt werden, verwenden `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung an eine ACP-Sitzung gebunden ist, wird normaler Text an das ACP-
Harness weitergeleitet. Gateway-Verwaltungsbefehle bleiben lokal: `/acp ...` erreicht
immer den OpenClaw-Befehlshandler, und `/status` sowie `/unfocus` bleiben lokal, wenn
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
    sie sieht. Wenn sie allein gesendet werden, bleiben die Sitzungseinstellungen erhalten; zusammen
    mit anderem Text dienen sie als Inline-Hinweise.
  </Card>
  <Card title="Inline-Kurzbefehle" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — werden sofort ausgeführt und
    entfernt, bevor das Modell den verbleibenden Text sieht. Nur für autorisierte Absender.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Details zum Verhalten von Direktiven">
    - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
    - Bei Nachrichten, die **nur Direktiven** enthalten, bleiben sie
      für die Sitzung erhalten und werden mit einer Bestätigung beantwortet.
    - In **normalen Chatnachrichten** mit anderem Text dienen sie als Inline-Hinweise und
      speichern die Sitzungseinstellungen **nicht** dauerhaft.
    - Direktiven gelten nur für **autorisierte Absender**. Wenn `commands.allowFrom`
      festgelegt ist, wird ausschließlich diese Positivliste verwendet; andernfalls ergibt sich die Autorisierung aus
      den Positivlisten bzw. der Kopplung des Kanals sowie `commands.useAccessGroups`. Bei nicht autorisierten
      Absendern werden Direktiven als Klartext behandelt.
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
  Aktiviert die Auswertung von `/...` in Chatnachrichten. Auf Oberflächen ohne native Befehle
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) funktionieren Textbefehle
  auch dann, wenn diese Option auf `false` gesetzt ist.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registriert native Befehle. Automatisch: aktiviert für Discord/Telegram; deaktiviert für Slack;
  bei Providern ohne native Unterstützung ignoriert. Kann pro Kanal mit
  `channels.<provider>.commands.native` überschrieben werden. Bei Discord überspringt `false` die
  Registrierung von Slash-Befehlen; zuvor registrierte Befehle können sichtbar bleiben, bis sie entfernt werden.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registriert Skill-Befehle nativ, sofern unterstützt. Automatisch: aktiviert für
  Discord/Telegram; deaktiviert für Slack. Kann mit
  `channels.<provider>.commands.nativeSkills` überschrieben werden.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Aktiviert `! <cmd>` zum Ausführen von Host-Shell-Befehlen (Alias `/bash <cmd>`). Erfordert
  Positivlisten unter `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Gibt an, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` wechselt
  sofort in den Hintergrund).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Aktiviert `/config` (liest/schreibt `openclaw.json`). Nur für Eigentümer.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Aktiviert `/mcp` (liest/schreibt die von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`). Nur für Eigentümer.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Aktiviert `/plugins` (Plugin-Erkennung/-Status sowie Installation und Aktivierung/Deaktivierung). Schreibzugriffe nur für Eigentümer.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Aktiviert `/debug` (nur zur Laufzeit geltende Konfigurationsüberschreibungen). Nur für Eigentümer.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` und Tool-Aktionen zum Neustarten des Gateways.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Explizite Eigentümer-Positivliste für Befehlsoberflächen, die nur Eigentümern zur Verfügung stehen. Unabhängig von
  `commands.allowFrom` und dem Zugriff über die Kopplung von Direktnachrichten.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Kanal: Erfordert für Eigentümerbefehle die Eigentümeridentität. Bei `true`
  muss der Absender `commands.ownerAllowFrom` entsprechen oder über den internen Geltungsbereich `operator.admin`
  verfügen. Ein Platzhaltereintrag in `allowFrom` ist **nicht** ausreichend.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Eigentümer-IDs im System-Prompt erscheinen.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-Geheimnis, das bei `commands.ownerDisplay: "hash"` verwendet wird.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Provider-spezifische Zulassungsliste für die Befehlsautorisierung. Wenn sie konfiguriert ist, stellt sie die
  **einzige** Autorisierungsquelle für Befehle und Direktiven dar. Verwenden Sie `"*"` als
  globale Vorgabe; Provider-spezifische Schlüssel überschreiben sie.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Erzwingt Zulassungslisten/Richtlinien für Befehle, wenn `commands.allowFrom` nicht festgelegt ist.
</ParamField>

## Befehlsliste

Befehle stammen aus drei Quellen:

- **Integrierte Kernbefehle:** `src/auto-reply/commands-registry.shared.ts`
- **Generierte Dock-Befehle:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-Befehle:** Aufrufe von `registerCommand()` durch Plugins

Die Verfügbarkeit hängt von Konfigurations-Flags, der Kanaloberfläche und installierten/aktivierten
Plugins ab.

### Kernbefehle

<AccordionGroup>
  <Accordion title="Sitzungen und Ausführungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/new [model]` | Archiviert die aktuelle Sitzung und startet eine neue |
    | `/reset [soft [message]]` | Setzt die aktuelle Sitzung an Ort und Stelle zurück. `soft` behält das Transkript bei, verwirft wiederverwendete Sitzungs-IDs des CLI-Backends und führt den Startvorgang erneut aus |
    | `/name <title>` | Benennt die aktuelle Sitzung oder benennt sie um. Lassen Sie den Titel weg, um den aktuellen Namen und einen Vorschlag anzuzeigen |
    | `/compact [instructions]` | Komprimiert den Sitzungskontext. Siehe [Compaction](/de/concepts/compaction) |
    | `/stop` | Bricht die aktuelle Ausführung ab |
    | `/session idle <duration\|off>` | Verwaltet den Ablauf der Thread-Bindung bei Inaktivität |
    | `/session max-age <duration\|off>` | Verwaltet den Ablauf der Thread-Bindung nach maximalem Alter |
    | `/export-session [path]` | Exportiert die aktuelle Sitzung als HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exportiert ein JSONL-Trajektorienpaket für die aktuelle Sitzung. Alias: `/trajectory` |

    <Note>
      Die Control UI fängt die Eingabe von `/new` ab, um eine neue
      Dashboard-Sitzung zu erstellen und zu ihr zu wechseln, außer wenn `session.dmScope: "main"` konfiguriert ist
      und das aktuelle übergeordnete Element die Hauptsitzung des Agenten ist — in diesem Fall setzt `/new`
      die Hauptsitzung an Ort und Stelle zurück. Die Eingabe von `/reset` führt weiterhin das Zurücksetzen
      des Gateways an Ort und Stelle aus. Verwenden Sie `/model default`, wenn Sie eine angeheftete
      Modellauswahl der Sitzung löschen möchten.
    </Note>

  </Accordion>

  <Accordion title="Modell- und Ausführungssteuerung">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/think <level\|default>` | Legt die Denkstufe fest oder löscht die Sitzungsüberschreibung. Aliase: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schaltet die ausführliche Ausgabe um. Alias: `/v` |
    | `/trace on\|off` | Schaltet die Plugin-Trace-Ausgabe für die aktuelle Sitzung um |
    | `/fast [status\|auto\|on\|off\|default]` | Zeigt den Schnellmodus an, legt ihn fest oder löscht ihn |
    | `/reasoning [on\|off\|stream]` | Schaltet die Sichtbarkeit der Schlussfolgerungen um. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schaltet den Modus mit erweiterten Berechtigungen um. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Zeigt die Ausführungsstandardwerte an oder legt sie fest |
    | `/login [codex\|openai\|openai-codex]` | Verknüpft die Codex-/OpenAI-Anmeldung aus einem privaten Chat oder einer Web-UI-Sitzung. Nur Eigentümer/Administratoren |
    | `/model [name\|#\|status]` | Zeigt das Modell an oder legt es fest |
    | `/models [provider] [page] [limit=<n>\|all]` | Listet konfigurierte bzw. aufgrund vorhandener Authentifizierung verfügbare Provider oder Modelle auf |
    | `/queue <mode>` | Verwaltet das Warteschlangenverhalten aktiver Ausführungen. Siehe [Warteschlange](/de/concepts/queue) und [Warteschlangensteuerung](/de/concepts/queue-steering) |
    | `/steer <message>` | Fügt der aktiven Ausführung Anweisungen hinzu. Alias: `/tell`. Siehe [Steuerung](/de/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sicherheit bei verbose / trace / fast / reasoning">
        - `/verbose` dient der Fehlerdiagnose — lassen Sie es bei normaler Verwendung **deaktiviert**.
        - `/trace` zeigt nur Plugin-eigene Trace-/Debug-Zeilen an; die normale ausführliche Ausgabe bleibt deaktiviert.
        - `/fast auto|on|off` speichert eine Sitzungsüberschreibung; verwenden Sie in der Sessions UI die Option `inherit`, um sie zu löschen.
        - `/fast` ist Provider-spezifisch: OpenAI/Codex ordnen es `service_tier=priority` zu; direkte Anthropic-Anfragen ordnen es `service_tier=auto` oder `standard_only` zu.
        - `/reasoning`, `/verbose` und `/trace` sind in Gruppenumgebungen riskant — sie können interne Schlussfolgerungen oder Plugin-Diagnosen offenlegen. Lassen Sie sie in Gruppenchats deaktiviert.

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
    | `/help` | Zeigt die kurze Hilfeübersicht an |
    | `/commands` | Zeigt den generierten Befehlskatalog an |
    | `/tools [compact\|verbose]` | Zeigt an, was der aktuelle Agent momentan verwenden kann |
    | `/status` | Zeigt den Ausführungs-/Laufzeitstatus, die Betriebszeit von Gateway und System, den Plugin-Zustand sowie Provider-Nutzung und -Kontingent an |
    | `/status plugins` | Zeigt einen detaillierten Plugin-Zustand an: Ladefehler, Quarantänen, Fehler von Kanal-Plugins, Abhängigkeitsprobleme und Kompatibilitätshinweise. Erfordert `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Verwaltet das dauerhafte [Ziel](/de/tools/goal) der aktuellen Sitzung |
    | `/diagnostics [note]` | Support-Berichtsablauf nur für Eigentümer. Fragt jedes Mal nach einer Ausführungsgenehmigung |
    | `/crestodian <request>` | Führt den Einrichtungs- und Reparaturhelfer Crestodian aus einer Eigentümer-Direktnachricht aus |
    | `/tasks` | Listet aktive/kürzlich ausgeführte Hintergrundaufgaben für die aktuelle Sitzung auf |
    | `/context [list\|detail\|map\|json]` | Erläutert, wie der Kontext zusammengestellt wird |
    | `/whoami` | Zeigt Ihre Absender-ID an. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Steuert die Nutzungsfußzeile pro Antwort (`reset`/`inherit`/`clear`/`default` löscht die Sitzungsüberschreibung, sodass der konfigurierte Standardwert erneut übernommen wird) oder gibt eine lokale Kostenübersicht aus |
  </Accordion>

  <Accordion title="Skills, Zulassungslisten, Genehmigungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/skill <name> [input]` | Führt einen Skill anhand seines Namens aus |
    | `/learn [request]` | Entwirft über den [Skill Workshop](/de/tools/skill-workshop) einen überprüfbaren Skill aus der aktuellen Unterhaltung oder benannten Quellen |
    | `/allowlist [list\|add\|remove] ...` | Verwaltet Einträge der Zulassungsliste. Nur Text |
    | `/approve <id> <decision>` | Bearbeitet Genehmigungsanfragen für Ausführungen oder Plugins |
    | `/btw <question>` | Stellt eine Nebenfrage, ohne den Sitzungskontext zu ändern. Alias: `/side`. Siehe [Nebenfrage](/de/tools/btw) |
  </Accordion>

  <Accordion title="Subagenten und ACP">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/subagents list\|log\|info` | Subagenten-Ausführungen für die aktuelle Sitzung prüfen |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP-Sitzungen und Laufzeitoptionen verwalten. Laufzeitsteuerungen erfordern eine externe Eigentümeridentität oder eine interne Gateway-Administratoridentität |
    | `/focus <target>` | Den aktuellen Discord-Thread oder das aktuelle Telegram-Thema an ein Sitzungsziel binden |
    | `/unfocus` | Die aktuelle Thread-Bindung entfernen |
    | `/agents` | An Threads gebundene Agenten für die aktuelle Sitzung auflisten |
  </Accordion>

  <Accordion title="Schreibvorgänge und Administration nur für Eigentümer">
    | Befehl | Voraussetzung | Beschreibung |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` lesen oder schreiben. Nur für Eigentümer |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Von OpenClaw verwaltete MCP-Serverkonfiguration lesen oder schreiben. Nur für Eigentümer |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin-Status prüfen oder ändern. Schreibvorgänge nur für Eigentümer. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Konfigurationsüberschreibungen nur für die Laufzeit. Nur für Eigentümer |
    | `/restart` | `commands.restart: true` (Standard) | OpenClaw neu starten |
    | `/send on\|off\|inherit` | Eigentümer | Senderichtlinie festlegen |
  </Accordion>

  <Accordion title="Sprache, TTS und Kanalsteuerung">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS steuern. Siehe [TTS](/de/tools/tts) |
    | `/activation mention\|always` | Gruppenaktivierungsmodus festlegen |
    | `/bash <command>` | Einen Host-Shell-Befehl ausführen. Alias: `! <command>`. Erfordert `commands.bash: true` |
    | `!poll [sessionId]` | Einen Bash-Hintergrundauftrag prüfen |
    | `!stop [sessionId]` | Einen Bash-Hintergrundauftrag beenden |
  </Accordion>
</AccordionGroup>

### Dock-Befehle

Dock-Befehle leiten die Antworten der aktiven Sitzung an einen anderen verknüpften Kanal weiter.
Einrichtung und Fehlerbehebung finden Sie unter [Kanal-Docking](/de/concepts/channel-docking).

Aus Kanal-Plugins mit Unterstützung für native Befehle generiert:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

Dock-Befehle erfordern `session.identityLinks`. Der Absender im Quellkanal und der Peer im Zielkanal
müssen derselben Identitätsgruppe angehören.

### Befehle gebündelter Plugins

| Befehl                                                 | Beschreibung                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Memory Dreaming aktivieren oder deaktivieren (Eigentümer oder Gateway-Administrator). Siehe [Dreaming](/de/concepts/dreaming)                                                                       |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gerätekopplung verwalten. Siehe [Kopplung](/de/channels/pairing)                                                                                                                                   |
| `/phone status\|arm ...\|disarm`                        | Hochriskante Node-Befehle vorübergehend freigeben (Kamera/Bildschirm/Computer/Schreibvorgänge). Siehe [Computernutzung](/nodes/computer-use)                                                     |
| `/voice status\|list\|set <voiceId>`                    | Talk-Sprachkonfiguration verwalten. Nativer Discord-Name: `/talkvoice`                                                                                                                          |
| `/card ...`                                             | Vorlagen für interaktive LINE-Karten senden. Siehe [LINE](/de/channels/line)                                                                                                                       |
| `/codex <action> ...`                                   | Das Codex-App-Server-Harness binden, steuern und prüfen (Status, Threads, Fortsetzen, Modell, Schnellmodus, Berechtigungen, Komprimierung, Review, MCP, Skills und mehr). Siehe [Codex-Harness](/de/plugins/codex-harness) |

Nur für QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-Befehle

Vom Benutzer aufrufbare Skills werden als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können als direkte Befehle registriert werden (z. B. `/prose` für OpenProse).
- Die Registrierung nativer Skill-Befehle wird durch `commands.nativeSkills` und
  `channels.<provider>.commands.nativeSkills` gesteuert.
- Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); bei Kollisionen werden numerische Suffixe angefügt.

<AccordionGroup>
  <Accordion title="Weiterleitung von Skill-Befehlen">
    Standardmäßig werden Skill-Befehle wie eine normale Anfrage an das Modell weitergeleitet.

    Skills können `command-dispatch: tool` deklarieren, um direkt an ein Tool weiterzuleiten
    (deterministisch, ohne Beteiligung des Modells). Beispiel: `/prose` (OpenProse-Plugin)
    — siehe [OpenProse](/de/prose).

  </Accordion>
  <Accordion title="Argumente nativer Befehle">
    Discord verwendet die automatische Vervollständigung für dynamische Optionen und bei Bedarf Schaltflächenmenüs,
    wenn erforderliche Argumente fehlen. Telegram und Slack zeigen für Befehle mit
    Auswahlmöglichkeiten ein Schaltflächenmenü an. Dynamische Auswahlmöglichkeiten werden anhand des Modells der Zielsitzung aufgelöst, sodass modell-
    spezifische Optionen wie `/think`-Stufen der `/model`-Überschreibung der Sitzung folgen.
  </Accordion>
</AccordionGroup>

## `/tools`: Was der Agent jetzt verwenden kann

`/tools` beantwortet eine Laufzeitfrage: **Was kann dieser Agent aktuell in dieser
Unterhaltung verwenden?** — nicht einen statischen Konfigurationskatalog.

```text
/tools         # kompakte Ansicht
/tools verbose # mit Kurzbeschreibungen
```

Die Ergebnisse gelten jeweils für eine Sitzung. Änderungen an Agent, Kanal, Thread, Absender-
autorisierung oder Modell können die Ausgabe verändern. Verwenden Sie zum Bearbeiten von Profilen und Überschreibungen
den Tools-Bereich der Control UI oder die Konfigurationsoberflächen.

## `/model`: Modellauswahl

```text
/model             # Modellauswahl anzeigen
/model list        # identisch
/model 3           # anhand der Nummer in der Auswahl auswählen
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # Modellauswahl der Sitzung löschen
/model status      # Detailansicht mit Endpunkt und API-Modus
```

Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Provider- und
Modell-Dropdowns. Die Auswahl berücksichtigt `agents.defaults.models`, einschließlich
`provider/*`-Einträgen.

## `/config`: Schreiben der Konfiguration auf den Datenträger

<Note>
  Nur für Eigentümer. Standardmäßig deaktiviert — mit `commands.config: true` aktivieren.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Die Konfiguration wird vor dem Schreiben validiert. Ungültige Änderungen werden abgelehnt. `/config`-
Aktualisierungen bleiben über Neustarts hinweg bestehen.

## `/mcp`: MCP-Serverkonfiguration

<Note>
  Nur für Eigentümer. Standardmäßig deaktiviert — mit `commands.mcp: true` aktivieren.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in den Projekteinstellungen des eingebetteten Agenten.
`/mcp show` schwärzt Felder, die Anmeldedaten enthalten, Werte erkannter Anmeldedaten-Flags
und bekannte geheimnisähnliche Argumente. Bei Ausführung aus einer Gruppe wird die
Konfiguration dem Eigentümer privat gesendet. Wenn kein privater Kommunikationsweg zum Eigentümer
verfügbar ist, schlägt der Befehl sicher fehl und fordert den Eigentümer auf, es in einem Direkt-
chat erneut zu versuchen.

## `/debug`: Überschreibungen nur für die Laufzeit

<Note>
  Nur für Eigentümer. Standardmäßig deaktiviert — mit `commands.debug: true` aktivieren.
  Überschreibungen werden bei neuen Konfigurationslesevorgängen sofort angewendet, aber **nicht** auf den Datenträger geschrieben.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: Plugin-Verwaltung

<Note>
  Schreibvorgänge nur für Eigentümer. Standardmäßig deaktiviert — mit `commands.plugins: true` aktivieren.
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
Plugin-Laufzeit für neue Agenteninteraktionen im laufenden Betrieb neu. `/plugins install` startet verwaltete
Gateways automatisch neu, da sich die Plugin-Quellmodule geändert haben.

## `/trace`: Plugin-Trace-Ausgabe

```text
/trace          # aktuellen Trace-Status anzeigen
/trace on
/trace off
```

`/trace` zeigt sitzungsbezogene Plugin-Trace-/Debug-Zeilen ohne vollständig ausführlichen
Modus an. Es ersetzt weder `/debug` (Laufzeitüberschreibungen) noch `/verbose` (normale
Tool-Ausgabe).

## `/btw`: Nebenfragen

`/btw` ist eine kurze Nebenfrage zum Kontext der aktuellen Sitzung. Alias: `/side`.

```text
/btw woran arbeiten wir gerade?
/side was hat sich geändert, während die Hauptausführung fortgesetzt wurde?
```

Im Gegensatz zu einer normalen Nachricht:

- Verwendet die aktuelle Sitzung als Hintergrundkontext.
- Wird in Codex-Harness-Sitzungen als temporärer Codex-Nebenthread ausgeführt.
- Ändert den zukünftigen Sitzungskontext **nicht**.
- Wird nicht in den Transkriptverlauf geschrieben.

Das vollständige Verhalten finden Sie unter [BTW-Nebenfragen](/de/tools/btw).

## Hinweise zu Oberflächen

<AccordionGroup>
  <Accordion title="Sitzungsbereich je Oberfläche">
    - **Textbefehle:** werden in der normalen Chatsitzung ausgeführt (Direktnachrichten teilen sich `main`, Gruppen haben eigene Sitzungen).
    - **Native Discord-Befehle:** `agent:<agentId>:discord:slash:<userId>`
    - **Native Slack-Befehle:** `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
    - **Native Telegram-Befehle:** `telegram:slash:<userId>` (zielen über `CommandTargetSessionKey` auf die Chatsitzung)
    - **`/login codex`** sendet Gerätekopplungscodes ausschließlich über private Chat- oder Web-UI-Antwortpfade. Bei Aufrufen in Telegram-Gruppen/-Themen wird der Eigentümer stattdessen aufgefordert, dem Bot eine Direktnachricht zu senden.
    - **`/stop`** zielt auf die aktive Chatsitzung, um die aktuelle Ausführung abzubrechen.

  </Accordion>
  <Accordion title="Slack-Besonderheiten">
    `channels.slack.slashCommand` unterstützt einen einzelnen Befehl im Stil von `/openclaw`.
    Erstellen Sie bei `commands.native: true` für jeden integrierten
    Befehl einen eigenen Slack-Slash-Befehl. Registrieren Sie `/agentstatus` (nicht `/status`), da Slack
    `/status` reserviert. Der Textbefehl `/status` funktioniert weiterhin in Slack-Nachrichten.
  </Accordion>
  <Accordion title="Schnellpfad und Inline-Kurzbefehle">
    - Nachrichten, die ausschließlich aus Befehlen bestehen und von Absendern auf der Zulassungsliste stammen, werden sofort verarbeitet (Warteschlange und Modell werden umgangen).
    - Inline-Kurzbefehle (`/help`, `/commands`, `/status`, `/whoami`) funktionieren auch eingebettet in normalen Nachrichten und werden entfernt, bevor das Modell den verbleibenden Text sieht.
    - Nicht autorisierte Nachrichten, die ausschließlich aus Befehlen bestehen, werden stillschweigend ignoriert; eingebettete `/...`-Tokens werden als Klartext behandelt.

  </Accordion>
  <Accordion title="Hinweise zu Argumenten">
    - Befehle akzeptieren optional einen `:` zwischen Befehl und Argumenten (`/think: high`, `/send: on`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Provider-Namen (unscharfe Übereinstimmung); wenn keine Übereinstimmung gefunden wird, wird der Text als Nachrichteninhalt behandelt.
    - `/allowlist add|remove` erfordert `commands.config: true` und berücksichtigt die kanalspezifische Einstellung `configWrites`.

  </Accordion>
</AccordionGroup>

## Provider-Nutzung und -Status

- **Provider-Nutzung/Kontingent** (z. B. „Claude 80 % verbleibend“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn die Nutzungserfassung aktiviert ist.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungseintrag im Transkript zurückgreifen, wenn die Momentaufnahme der laufenden Sitzung nur wenige Daten enthält.
- **Ausführung und Runtime:** `/status` gibt unter `Execution` den effektiven Sandbox-Pfad und unter `Runtime` an, wer die Sitzung ausführt: `OpenClaw Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Token/Kosten pro Antwort:** gesteuert durch `/usage off|tokens|full`.
- Bei `/model status` geht es um Modelle/Authentifizierung/Endpunkte, nicht um die Nutzung.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills" href="/de/tools/skills" icon="puzzle-piece">
    So werden Slash-Befehle von Skills registriert und zugriffsbeschränkt.
  </Card>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellen Sie einen Skill, der seinen eigenen Slash-Befehl registriert.
  </Card>
  <Card title="BTW" href="/de/tools/btw" icon="comments">
    Nebenfragen, ohne den Sitzungskontext zu ändern.
  </Card>
  <Card title="Steuerung" href="/de/tools/steer" icon="compass">
    Steuern Sie den Agenten während der Ausführung mit `/steer`.
  </Card>
</CardGroup>
