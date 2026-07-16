---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Debugging von Befehlsrouting oder Berechtigungen
    - Grundlegendes zur Registrierung von Skill-Befehlen
sidebarTitle: Slash commands
summary: Alle verfügbaren Slash-Befehle, Direktiven und Inline-Kurzbefehle – Konfiguration, Routing und Verhalten je Oberfläche.
title: Slash-Befehle
x-i18n:
    generated_at: "2026-07-16T13:31:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Der Gateway verarbeitet Befehle, die als eigenständige Nachrichten gesendet werden und mit `/` beginnen.
Nur auf dem Host ausgeführte Bash-Befehle verwenden `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung an eine ACP-Sitzung gebunden ist, wird normaler Text an das ACP-
Harness weitergeleitet. Gateway-Verwaltungsbefehle bleiben lokal: `/acp ...` erreicht immer
den OpenClaw-Befehlshandler, und `/status` sowie `/unfocus` bleiben lokal, sobald
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
    sie sieht. Wenn sie allein gesendet werden, bleiben die Sitzungseinstellungen bestehen; wenn sie
    zusammen mit anderem Text gesendet werden, dienen sie als Inline-Hinweise.
  </Card>
  <Card title="Inline-Kurzbefehle" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — werden sofort ausgeführt und
    entfernt, bevor das Modell den verbleibenden Text sieht. Nur für autorisierte Absender.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Details zum Verhalten von Direktiven">
    - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
    - In Nachrichten, die **nur Direktiven** enthalten, bleiben sie
      für die Sitzung bestehen und werden mit einer Bestätigung beantwortet.
    - In **normalen Chatnachrichten** mit anderem Text dienen sie als Inline-Hinweise und
      speichern die Sitzungseinstellungen **nicht** dauerhaft.
    - Direktiven gelten nur für **autorisierte Absender**. Wenn `commands.allowFrom`
      festgelegt ist, wird ausschließlich diese Zulassungsliste verwendet; andernfalls ergibt sich die Autorisierung aus
      den Kanal-Zulassungslisten bzw. der Kopplung sowie `commands.useAccessGroups`. Bei nicht autorisierten
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
  Aktiviert die Verarbeitung von `/...` in Chatnachrichten. Auf Oberflächen ohne native Befehle
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) funktionieren Textbefehle
  auch dann, wenn die Option auf `false` gesetzt ist.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registriert native Befehle. Automatisch: für Discord/Telegram aktiviert, für Slack deaktiviert;
  bei Providern ohne native Unterstützung ignoriert. Kann pro Kanal mit
  `channels.<provider>.commands.native` überschrieben werden. Bei Discord überspringt `false` die Registrierung
  von Slash-Befehlen; zuvor registrierte Befehle können sichtbar bleiben, bis sie entfernt werden.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registriert Skill-Befehle nativ, sofern dies unterstützt wird. Automatisch: für
  Discord/Telegram aktiviert, für Slack deaktiviert. Kann mit
  `channels.<provider>.commands.nativeSkills` überschrieben werden.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Aktiviert `! <cmd>` zum Ausführen von Host-Shell-Befehlen (Alias: `/bash <cmd>`). Erfordert
  `tools.elevated`-Zulassungslisten.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Gibt an, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` wechselt
  sofort in den Hintergrund).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Aktiviert `/config` (liest/schreibt `openclaw.json`). Nur für den Eigentümer.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Aktiviert `/mcp` (liest/schreibt die von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`). Nur für den Eigentümer.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Aktiviert `/plugins` (Plugin-Erkennung und -Status sowie Installation und Aktivierung/Deaktivierung). Schreibvorgänge nur für den Eigentümer.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Aktiviert `/debug` (nur zur Laufzeit geltende Konfigurationsüberschreibungen). Nur für den Eigentümer.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` und externe Neustartanforderungen über `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Explizite Eigentümer-Zulassungsliste für Befehlsoberflächen, die nur dem Eigentümer zur Verfügung stehen. Unabhängig von
  `commands.allowFrom` und dem Zugriff über DM-Kopplung.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Kanal: Erfordert die Eigentümeridentität für Befehle, die nur dem Eigentümer zur Verfügung stehen. Wenn `true`,
  muss der Absender `commands.ownerAllowFrom` entsprechen oder über den internen Geltungsbereich `operator.admin`
  verfügen. Ein Platzhaltereintrag `allowFrom` ist **nicht** ausreichend.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Eigentümer-IDs im System-Prompt angezeigt werden.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-Secret, das bei `commands.ownerDisplay: "hash"` verwendet wird.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Provider-spezifische Zulassungsliste für die Befehlsautorisierung. Wenn sie konfiguriert ist, stellt sie die
  **einzige** Autorisierungsquelle für Befehle und Direktiven dar. Verwenden Sie `"*"` als
  globalen Standard; Provider-spezifische Schlüssel überschreiben ihn.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Erzwingt Zulassungslisten/Richtlinien für Befehle, wenn `commands.allowFrom` nicht festgelegt ist.
</ParamField>

## Befehlsliste

Befehle stammen aus drei Quellen:

- **Integrierte Kernbefehle:** `src/auto-reply/commands-registry.shared.ts`
- **Generierte Dock-Befehle:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-Befehle:** Aufrufe von Plugin-`registerCommand()`

Die Verfügbarkeit hängt von Konfigurationsoptionen, Kanaloberfläche und installierten/aktivierten
Plugins ab.

### Kernbefehle

<AccordionGroup>
  <Accordion title="Sitzungen und Ausführungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/new [model]` | Archiviert die aktuelle Sitzung und startet eine neue |
    | `/reset [soft [message]]` | Setzt die aktuelle Sitzung direkt zurück. `soft` behält das Transkript bei, verwirft wiederverwendete Sitzungs-IDs des CLI-Backends und führt den Startvorgang erneut aus |
    | `/name <title>` | Benennt die aktuelle Sitzung oder ändert ihren Namen. Lassen Sie den Titel weg, um den aktuellen Namen und einen Vorschlag anzuzeigen |
    | `/compact [instructions]` | Komprimiert den Sitzungskontext. Siehe [Compaction](/de/concepts/compaction) |
    | `/stop` | Bricht die aktuelle Ausführung ab |
    | `/session idle <duration\|off>` | Verwaltet den Ablauf der Thread-Bindung bei Inaktivität |
    | `/session max-age <duration\|off>` | Verwaltet den Ablauf der maximalen Gültigkeitsdauer der Thread-Bindung |
    | `/export-session [path]` | Nur für den Eigentümer. Exportiert die aktuelle Sitzung als HTML in den Workspace. Alias: `/export` |
    | `/export-trajectory [path]` | Exportiert ein JSONL-Trajektorienpaket für die aktuelle Sitzung. Alias: `/trajectory` |

    Explizite `/export-session`-Pfade ersetzen vorhandene Dateien im
    Workspace. Lassen Sie den Pfad weg, um einen kollisionssicheren Dateinamen zu erzeugen.

    <Note>
      Die Control UI fängt eingegebenes `/new` ab, um eine neue
      Dashboard-Sitzung zu erstellen und zu ihr zu wechseln, außer wenn `session.dmScope: "main"` konfiguriert ist
      und das aktuelle übergeordnete Element die Hauptsitzung des Agenten ist — in diesem Fall setzt `/new`
      die Hauptsitzung direkt zurück. Eingegebenes `/reset` führt weiterhin das direkte Zurücksetzen
      des Gateways aus. Verwenden Sie `/model default`, wenn Sie die angeheftete
      Modellauswahl einer Sitzung löschen möchten.
    </Note>

  </Accordion>

  <Accordion title="Modell- und Ausführungssteuerung">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/think <level\|default>` | Legt die Denkstufe fest oder löscht die Sitzungsüberschreibung. Aliase: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schaltet die ausführliche Ausgabe um. Alias: `/v` |
    | `/trace on\|off` | Schaltet die Plugin-Ablaufverfolgung für die aktuelle Sitzung um |
    | `/fast [status\|auto\|on\|off\|default]` | Zeigt den Schnellmodus an, legt ihn fest oder löscht ihn |
    | `/reasoning [on\|off\|stream]` | Schaltet die Sichtbarkeit der Schlussfolgerungen um. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schaltet den Modus mit erhöhten Berechtigungen um. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Zeigt die Ausführungsstandards an oder legt sie fest |
    | `/login [codex\|openai\|openai-codex]` | Koppelt die Codex-/OpenAI-Anmeldung aus einem privaten Chat oder einer Web-UI-Sitzung. Nur für Eigentümer/Administratoren |
    | `/model [name\|#\|status]` | Zeigt das Modell an oder legt es fest |
    | `/models [provider] [page] [limit=<n>\|all]` | Listet konfigurierte bzw. mit vorhandener Authentifizierung verfügbare Provider oder Modelle auf |
    | `/queue <mode>` | Verwaltet das Warteschlangenverhalten aktiver Ausführungen. Siehe [Warteschlange](/de/concepts/queue) und [Warteschlangensteuerung](/de/concepts/queue-steering) |
    | `/steer <message>` | Fügt der aktiven Ausführung Anweisungen hinzu. Alias: `/tell`. Siehe [Steuerung](/de/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sicherheit bei ausführlicher Ausgabe, Ablaufverfolgung, Schnellmodus und Schlussfolgerungen">
        - `/verbose` dient der Fehlerdiagnose — lassen Sie es bei normaler Verwendung **deaktiviert**.
        - `/trace` zeigt nur Plugin-eigene Ablaufverfolgungs-/Debugzeilen an; die normale ausführliche Ausgabe bleibt deaktiviert.
        - `/fast auto|on|off` speichert eine Sitzungsüberschreibung dauerhaft; verwenden Sie die Option `inherit` in der Sitzungs-UI, um sie zu löschen.
        - `/fast` ist Provider-spezifisch: OpenAI/Codex ordnen sie `service_tier=priority` zu; direkte Anthropic-Anfragen ordnen sie `service_tier=auto` oder `standard_only` zu.
        - `/reasoning`, `/verbose` und `/trace` sind in Gruppenumgebungen riskant — sie können interne Schlussfolgerungen oder Plugin-Diagnosedaten offenlegen. Lassen Sie sie in Gruppenchats deaktiviert.

      </Accordion>
      <Accordion title="Details zum Modellwechsel">
        - `/model` speichert das neue Modell sofort dauerhaft in der Sitzung.
        - Wenn der Agent inaktiv ist, wird es bei der nächsten Ausführung sofort verwendet.
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
    | `/status plugins` | Zeigt detaillierte Plugin-Zustandsinformationen an: Ladefehler, Quarantänen, Fehler von Kanal-Plugins, Abhängigkeitsprobleme und Kompatibilitätshinweise. Erfordert `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Verwaltet das dauerhafte [Ziel](/de/tools/goal) der aktuellen Sitzung |
    | `/diagnostics [note]` | Supportbericht-Ablauf nur für den Eigentümer. Fragt jedes Mal nach einer Ausführungsgenehmigung |
    | `/openclaw <request>` | Führt den OpenClaw-Einrichtungs- und Reparaturassistenten aus einer Eigentümer-DM aus |
    | `/tasks` | Listet aktive/kürzlich ausgeführte Hintergrundaufgaben der aktuellen Sitzung auf |
    | `/context [list\|detail\|map\|json]` | Erläutert, wie der Kontext zusammengestellt wird |
    | `/whoami` | Zeigt Ihre Absender-ID an. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Steuert die Nutzungsfußzeile pro Antwort (`reset`/`inherit`/`clear`/`default` löscht die Sitzungsüberschreibung, sodass wieder der konfigurierte Standard übernommen wird) oder gibt eine lokale Kostenübersicht aus |
  </Accordion>

  <Accordion title="Skills, Zulassungslisten, Genehmigungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/skill <name> [input]` | Einen Skill nach Namen ausführen |
    | `/learn [request]` | Einen überprüfbaren Skill aus der aktuellen Unterhaltung oder benannten Quellen über den [Skill Workshop](/de/tools/skill-workshop) entwerfen |
    | `/allowlist [list\|add\|remove] ...` | Einträge der Zulassungsliste verwalten. Nur Text |
    | `/approve <id> <decision>` | Genehmigungsanfragen für exec oder Plugins bearbeiten |
    | `/btw <question>` | Eine Nebenfrage stellen, ohne den Sitzungskontext zu ändern. Alias: `/side`. Siehe [BTW](/de/tools/btw) |
  </Accordion>

  <Accordion title="Subagenten und ACP">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/subagents list\|log\|info` | Ausführungen von Subagenten für die aktuelle Sitzung prüfen |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP-Sitzungen und Laufzeitoptionen verwalten. Laufzeitsteuerungen erfordern die Identität eines externen Eigentümers oder internen Gateway-Administrators |
    | `/focus <target>` | Den aktuellen Discord-Thread oder das aktuelle Telegram-Thema an ein Sitzungsziel binden |
    | `/unfocus` | Die aktuelle Thread-Bindung entfernen |
    | `/agents` | An Threads gebundene Agenten für die aktuelle Sitzung auflisten |
  </Accordion>

  <Accordion title="Schreibzugriffe nur für Eigentümer und Administration">
    | Befehl | Erfordert | Beschreibung |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` lesen oder schreiben. Nur für Eigentümer |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Von OpenClaw verwaltete MCP-Serverkonfiguration lesen oder schreiben. Nur für Eigentümer |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin-Status prüfen oder ändern. Schreibzugriffe nur für Eigentümer. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Konfigurationsüberschreibungen nur für die Laufzeit. Nur für Eigentümer |
    | `/restart` | `commands.restart: true` (Standard) | OpenClaw neu starten |
    | `/send on\|off\|inherit` | Eigentümer | Senderichtlinie festlegen |
  </Accordion>

  <Accordion title="Sprache, TTS, Kanalsteuerung">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS steuern. Siehe [TTS](/de/tools/tts) |
    | `/activation mention\|always` | Gruppenaktivierungsmodus festlegen |
    | `/bash <command>` | Einen Shell-Befehl auf dem Host ausführen. Alias: `! <command>`. Erfordert `commands.bash: true` |
    | `!poll [sessionId]` | Einen Bash-Hintergrundauftrag prüfen |
    | `!stop [sessionId]` | Einen Bash-Hintergrundauftrag beenden |
  </Accordion>
</AccordionGroup>

### Andockbefehle

Andockbefehle wechseln die Antwortroute der aktiven Sitzung zu einem anderen verknüpften Kanal.
Einrichtung und Fehlerbehebung finden Sie unter [Kanal-Andocken](/de/concepts/channel-docking).

Aus Kanal-Plugins mit Unterstützung für native Befehle generiert:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

Andockbefehle erfordern `session.identityLinks`. Der ursprüngliche Absender und der Zielteilnehmer
müssen derselben Identitätsgruppe angehören.

### Mitgelieferte Plugin-Befehle

| Befehl                                                 | Beschreibung                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Memory Dreaming umschalten (Eigentümer oder Gateway-Administrator). Siehe [Dreaming](/de/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gerätekopplung verwalten. Siehe [Kopplung](/de/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Hochriskante Node-Befehle vorübergehend freischalten (Kamera/Bildschirm/Computer/Schreibzugriffe). Siehe [Computernutzung](/de/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Talk-Sprachkonfiguration verwalten. Nativer Discord-Name: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Voreinstellungen für LINE-Rich-Cards senden. Siehe [LINE](/de/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Das Codex-App-Server-Harness binden, steuern und prüfen (Status, Threads, Fortsetzen, Modell, Schnellmodus, Berechtigungen, Komprimierung, Überprüfung, MCP, Skills und mehr). Siehe [Codex-Harness](/de/plugins/codex-harness) |

Nur QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-Befehle

Von Benutzern aufrufbare Skills werden als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert stets als allgemeiner Einstiegspunkt.
- Skills können als direkte Befehle registriert werden (z. B. `/prose` für OpenProse).
- Die Registrierung nativer Skill-Befehle wird durch `commands.nativeSkills` und
  `channels.<provider>.commands.nativeSkills` gesteuert.
- Namen werden in `a-z0-9_` bereinigt (max. 32 Zeichen); bei Kollisionen werden numerische Suffixe angehängt.

<AccordionGroup>
  <Accordion title="Weiterleitung von Skill-Befehlen">
    Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.

    Skills können `command-dispatch: tool` deklarieren, um direkt an ein Tool weiterzuleiten
    (deterministisch, ohne Beteiligung des Modells). Beispiel: `/prose` (OpenProse-Plugin)
    — siehe [OpenProse](/de/prose).

  </Accordion>
  <Accordion title="Argumente nativer Befehle">
    Discord verwendet die automatische Vervollständigung für dynamische Optionen und Schaltflächenmenüs, wenn erforderliche
    Argumente fehlen. Telegram und Slack zeigen für Befehle mit Auswahlmöglichkeiten ein
    Schaltflächenmenü an. Dynamische Auswahlmöglichkeiten werden anhand des Modells der Zielsitzung aufgelöst, sodass modell-
    spezifische Optionen wie `/think`-Stufen der `/model`-Überschreibung der Sitzung folgen.
  </Accordion>
</AccordionGroup>

## `/tools`: Was der Agent jetzt verwenden kann

`/tools` beantwortet eine Laufzeitfrage: **Was dieser Agent in dieser
Unterhaltung gerade verwenden kann** — kein statischer Konfigurationskatalog.

```text
/tools         # kompakte Ansicht
/tools verbose # mit kurzen Beschreibungen
```

Die Ergebnisse gelten für die jeweilige Sitzung. Ein Wechsel des Agenten, Kanals, Threads, der
Absenderautorisierung oder des Modells kann die Ausgabe ändern. Verwenden Sie zum Bearbeiten von Profilen und Überschreibungen
den Bereich „Tools“ der Control UI oder die Konfigurationsoberflächen.

## `/model`: Modellauswahl

```text
/model             # Modellauswahl anzeigen
/model list        # identisch
/model 3           # anhand der Nummer aus der Auswahl auswählen
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # Modellauswahl der Sitzung löschen
/model status      # detaillierte Ansicht mit Endpunkt und API-Modus
```

Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Dropdown-Menüs für Provider und
Modelle. Die Auswahl berücksichtigt `agents.defaults.models`, einschließlich
der Einträge unter `provider/*`.

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

Die Konfiguration wird vor dem Schreiben validiert. Ungültige Änderungen werden abgelehnt. Aktualisierungen mit `/config`
bleiben über Neustarts hinweg erhalten.

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
`/mcp show` schwärzt Felder mit Zugangsdaten, Werte erkannter
Zugangsdaten-Flags und bekannte Argumente, die wie Geheimnisse aufgebaut sind. Bei der Ausführung aus einer Gruppe wird die
Konfiguration dem Eigentümer privat gesendet. Ist keine private Route zum Eigentümer
verfügbar, schlägt der Befehl sicher fehl und fordert den Eigentümer auf, es in einem direkten
Chat erneut zu versuchen.

## `/debug`: Überschreibungen nur für die Laufzeit

<Note>
  Nur für Eigentümer. Standardmäßig deaktiviert — mit `commands.debug: true` aktivieren.
  Überschreibungen gelten sofort für neue Konfigurationslesevorgänge, werden jedoch **nicht** auf den Datenträger geschrieben.
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
  Schreibzugriffe nur für Eigentümer. Standardmäßig deaktiviert — mit `commands.plugins: true` aktivieren.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` aktualisiert die Plugin-Konfiguration und lädt die
Plugin-Laufzeit des Gateways für neue Agentendurchläufe im laufenden Betrieb neu. `/plugins install` startet verwaltete
Gateways automatisch neu, da sich die Plugin-Quellmodule geändert haben. Installationen aus vertrauenswürdigem ClawHub
und dem offiziellen Katalog benötigen keine zusätzliche Bestätigung. Beliebige npm-,
Git-, Archiv-, `npm-pack:`- und lokale Pfadquellen zeigen eine Herkunftswarnung an und
erfordern ein nachgestelltes `--force`, nachdem Sie die Quelle überprüft haben. Dieses Flag bestätigt
die Quelle und erlaubt das Ersetzen einer bestehenden Installation; es umgeht weder
`security.installPolicy` noch die Sicherheitsprüfungen des Installationsprogramms. ClawHub-Versionen mit
Risikowarnungen erfordern weiterhin das separate, ausschließlich in der Shell verfügbare
Flag `--acknowledge-clawhub-risk`. Marketplace-, verknüpfte und angeheftete Installationen
bleiben ebenfalls ausschließlich über die Shell verfügbar.

## `/trace`: Plugin-Trace-Ausgabe

```text
/trace          # aktuellen Trace-Status anzeigen
/trace on
/trace off
```

`/trace` zeigt sitzungsspezifische Plugin-Trace-/Debug-Zeilen ohne vollständigen ausführlichen
Modus an. Es ersetzt weder `/debug` (Laufzeitüberschreibungen) noch `/verbose` (normale
Tool-Ausgabe).

## `/btw`: Nebenfragen

`/btw` ist eine kurze Nebenfrage zum aktuellen Sitzungskontext. Alias: `/side`.

```text
/btw was tun wir gerade?
/side was hat sich geändert, während der Hauptdurchlauf fortgesetzt wurde?
```

Anders als eine normale Nachricht:

- Verwendet die aktuelle Sitzung als Hintergrundkontext.
- Wird in Codex-Harness-Sitzungen als temporärer Codex-Nebenthread ausgeführt.
- Ändert den künftigen Sitzungskontext **nicht**.
- Wird nicht in den Transkriptverlauf geschrieben.

Das vollständige Verhalten finden Sie unter [BTW-Nebenfragen](/de/tools/btw).

## Hinweise zu den Oberflächen

<AccordionGroup>
  <Accordion title="Sitzungsbereich je Oberfläche">
    - **Textbefehle:** werden in der normalen Chatsitzung ausgeführt (Direktnachrichten teilen sich `main`, Gruppen haben jeweils eine eigene Sitzung).
    - **Native Discord-Befehle:** `agent:<agentId>:discord:slash:<userId>`
    - **Native Slack-Befehle:** `agent:<agentId>:slack:slash:<userId>` (Präfix über `channels.slack.slashCommand.sessionPrefix` konfigurierbar)
    - **Native Telegram-Befehle:** `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chatsitzung)
    - **`/login codex`** sendet Gerätekopplungscodes ausschließlich über private Chats oder Web-UI-Antwortpfade. Bei Aufrufen in Telegram-Gruppen/-Themen wird der Eigentümer stattdessen aufgefordert, dem Bot eine Direktnachricht zu senden.
    - **`/stop`** zielt auf die aktive Chatsitzung, um den aktuellen Durchlauf abzubrechen.

  </Accordion>
  <Accordion title="Slack-spezifische Details">
    `channels.slack.slashCommand` unterstützt einen einzelnen Befehl im Stil von `/openclaw`.
    Mit `commands.native: true` erstellen Sie pro integriertem Befehl einen
    Slack-Slash-Befehl. Registrieren Sie `/agentstatus` (nicht `/status`), da Slack
    `/status` reserviert. Der Text `/status` funktioniert weiterhin in Slack-Nachrichten.
  </Accordion>
  <Accordion title="Schnellpfad und Inline-Kurzbefehle">
    - Nachrichten, die ausschließlich einen Befehl enthalten und von Absendern auf der Zulassungsliste stammen, werden sofort verarbeitet (Warteschlange und Modell werden umgangen).
    - Inline-Kurzbefehle (`/help`, `/commands`, `/status`, `/whoami`) funktionieren auch eingebettet in normalen Nachrichten und werden entfernt, bevor das Modell den verbleibenden Text sieht.
    - Nicht autorisierte Nachrichten, die ausschließlich einen Befehl enthalten, werden stillschweigend ignoriert; Inline-Token vom Typ `/...` werden als Klartext behandelt.

  </Accordion>
  <Accordion title="Hinweise zu Argumenten">
    - Befehle akzeptieren optional `:` zwischen dem Befehl und den Argumenten (`/think: high`, `/send: on`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Provider-Namen (unscharfer Abgleich); wird keine Übereinstimmung gefunden, wird der Text als Nachrichtentext behandelt.
    - `/allowlist add|remove` erfordert `commands.config: true` und berücksichtigt den Kanalwert `configWrites`.

  </Accordion>
</AccordionGroup>

## Provider-Nutzung und -Status

- **Provider-Nutzung/Kontingent** (z. B. „Claude: 80 % verbleibend“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn die Nutzungsverfolgung aktiviert ist.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungseintrag im Transkript zurückgreifen, wenn die aktuelle Sitzungsmomentaufnahme nur wenige Daten enthält.
- **Ausführung und Laufzeit:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` dafür, wer die Sitzung ausführt: `OpenClaw Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Token/Kosten pro Antwort:** gesteuert durch `/usage off|tokens|full`.
- Bei `/model status` geht es um Modelle/Authentifizierung/Endpunkte, nicht um die Nutzung.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills" href="/de/tools/skills" icon="puzzle-piece">
    So werden Slash-Befehle von Skills registriert und eingeschränkt.
  </Card>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellen Sie einen Skill, der einen eigenen Slash-Befehl registriert.
  </Card>
  <Card title="Übrigens" href="/de/tools/btw" icon="comments">
    Nebenfragen, ohne den Sitzungskontext zu ändern.
  </Card>
  <Card title="Steuern" href="/de/tools/steer" icon="compass">
    Steuern Sie den Agenten während der Ausführung mit `/steer`.
  </Card>
</CardGroup>
