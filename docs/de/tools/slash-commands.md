---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Fehlerbehebung bei der Befehlsweiterleitung oder bei Berechtigungen
    - Verstehen, wie Skill-Befehle registriert werden
sidebarTitle: Slash commands
summary: Alle verfügbaren Slash-Befehle, Direktiven und Inline-Kurzbefehle – Konfiguration, Routing und Verhalten je Oberfläche.
title: Slash-Befehle
x-i18n:
    generated_at: "2026-07-24T04:46:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ee5ee5e46d632a54ea92dea7ca61046288bf1998d05b08396107bec90e646fff
    source_path: tools/slash-commands.md
    workflow: 16
---

Der Gateway verarbeitet Befehle, die als eigenständige Nachrichten gesendet werden und mit `/` beginnen.
Bash-Befehle, die nur auf dem Host ausgeführt werden, verwenden `! <cmd>` (mit `/bash <cmd>` als Alias).

Wenn eine Unterhaltung an eine ACP-Sitzung gebunden ist, wird normaler Text an das ACP-
Harness weitergeleitet. Gateway-Verwaltungsbefehle bleiben lokal: `/acp ...` erreicht immer
den OpenClaw-Befehlshandler, und `/status` sowie `/unfocus` bleiben lokal, sofern
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
    sie sieht. Wenn sie allein gesendet werden, bleiben die Sitzungseinstellungen erhalten; zusammen mit anderem Text
    dienen sie als Inline-Hinweise.
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
      für die Sitzung erhalten und werden mit einer Bestätigung beantwortet.
    - In Nachrichten eines **normalen Chats** mit anderem Text dienen sie als Inline-Hinweise und
      speichern **keine** Sitzungseinstellungen dauerhaft.
    - Direktiven gelten nur für **autorisierte Absender**. Wenn `commands.allowFrom`
      festgelegt ist, wird ausschließlich diese Zulassungsliste verwendet; andernfalls ergibt sich die Autorisierung aus
      Kanal-Zulassungslisten, Kopplung und der stets aktiven Durchsetzung von Zugriffsgruppen. Bei nicht autorisierten
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
  Aktiviert die Analyse von `/...` in Chatnachrichten. Auf Oberflächen ohne native Befehle
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) funktionieren Textbefehle
  auch dann, wenn die Einstellung `false` lautet.
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
  Aktiviert `! <cmd>`, um Shell-Befehle auf dem Host auszuführen (Alias `/bash <cmd>`). Erfordert
  `tools.elevated`-Zulassungslisten.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Legt fest, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` wechselt
  sofort in den Hintergrund).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Aktiviert `/config` (liest/schreibt `openclaw.json`). Nur für Eigentümer.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Aktiviert `/mcp` (liest/schreibt die von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`). Nur für Eigentümer.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Aktiviert `/plugins` (Plugin-Erkennung/-Status sowie Installation und Aktivierung/Deaktivierung). Schreibvorgänge sind nur für Eigentümer zulässig.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Aktiviert `/debug` (Konfigurationsüberschreibungen nur für die Laufzeit). Nur für Eigentümer.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Aktiviert `/restart` und externe Neustartanforderungen über `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Explizite Eigentümer-Zulassungsliste für Befehlsoberflächen, die nur Eigentümern vorbehalten sind. Unabhängig von
  `commands.allowFrom` und dem Kopplungszugriff für Direktnachrichten.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Pro Kanal: Erfordert für Befehle, die nur Eigentümern vorbehalten sind, eine Eigentümeridentität. Wenn `true`,
  muss der Absender mit `commands.ownerAllowFrom` übereinstimmen oder über den internen
  Geltungsbereich `operator.admin` verfügen. Ein Platzhaltereintrag `allowFrom` ist **nicht** ausreichend.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Steuert, wie Eigentümer-IDs im System-Prompt angezeigt werden.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-Geheimnis, das bei `commands.ownerDisplay: "hash"` verwendet wird.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Provider-spezifische Zulassungsliste für die Befehlsautorisierung. Wenn sie konfiguriert ist, stellt sie die
  **einzige** Autorisierungsquelle für Befehle und Direktiven dar. Verwenden Sie `"*"` als
  globalen Standard; Provider-spezifische Schlüssel überschreiben ihn.
</ParamField>

## Befehlsliste

Befehle stammen aus drei Quellen:

- **Integrierte Kernbefehle:** `src/auto-reply/commands-registry.shared.ts`
- **Generierte Dock-Befehle:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-Befehle:** Aufrufe von Plugin-`registerCommand()`

Die Verfügbarkeit hängt von Konfigurationsoptionen, der Kanaloberfläche und installierten/aktivierten
Plugins ab.

### Kernbefehle

<AccordionGroup>
  <Accordion title="Sitzungen und Ausführungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/new [model]` | Aktuelle Sitzung archivieren und eine neue starten |
    | `/reset [soft [message]]` | Aktuelle Sitzung an Ort und Stelle zurücksetzen. `soft` behält das Transkript bei, verwirft wiederverwendete Sitzungs-IDs des CLI-Backends und führt den Startvorgang erneut aus |
    | `/name <title>` | Aktuelle Sitzung benennen oder umbenennen. Lassen Sie den Titel weg, um den aktuellen Namen und einen Vorschlag anzuzeigen |
    | `/compact [instructions]` | Sitzungskontext komprimieren. Siehe [Compaction](/de/concepts/compaction) |
    | `/stop` | Aktuelle Ausführung abbrechen |
    | `/session idle <duration\|off>` | Ablauf nach Inaktivität für die Thread-Bindung verwalten |
    | `/session max-age <duration\|off>` | Ablauf nach maximalem Alter für die Thread-Bindung verwalten |
    | `/export-session [path]` | Nur für Eigentümer. Aktuelle Sitzung innerhalb des Arbeitsbereichs als HTML exportieren. Alias: `/export` |
    | `/export-trajectory [path]` | JSONL-Trajektorienpaket für die aktuelle Sitzung exportieren. Alias: `/trajectory` |

    Explizite `/export-session`-Pfade ersetzen vorhandene Dateien innerhalb des
    Arbeitsbereichs. Lassen Sie den Pfad weg, um einen kollisionssicheren Dateinamen zu erzeugen.

    <Note>
      Die Control UI fängt eingegebenes `/new` ab, um eine neue
      Dashboard-Sitzung zu erstellen und zu ihr zu wechseln, außer wenn `session.dmScope: "main"` konfiguriert ist
      und der aktuelle übergeordnete Kontext die Hauptsitzung des Agenten ist — in diesem Fall setzt `/new`
      die Hauptsitzung an Ort und Stelle zurück. Eingegebenes `/reset` führt weiterhin das Zurücksetzen
      des Gateways an Ort und Stelle aus. Verwenden Sie `/model default`, wenn Sie eine angeheftete
      Modellauswahl der Sitzung löschen möchten.
    </Note>

  </Accordion>

  <Accordion title="Modell- und Ausführungssteuerung">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/think <level\|default>` | Den Denkgrad festlegen oder die Sitzungsüberschreibung löschen. Aliase: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Ausführliche Ausgabe umschalten. Alias: `/v` |
    | `/trace on\|off` | Plugin-Trace-Ausgabe für die aktuelle Sitzung umschalten |
    | `/fast [status\|auto\|on\|off\|default]` | Schnellmodus anzeigen, festlegen oder löschen |
    | `/reasoning [on\|off\|stream]` | Sichtbarkeit der Schlussfolgerungen umschalten. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Erweiterten Modus umschalten. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Standardwerte für die Ausführung anzeigen oder festlegen |
    | `/login [codex\|openai\|openai-codex]` | Codex-/OpenAI-Anmeldung aus einem privaten Chat oder einer Web-UI-Sitzung koppeln. Nur für Eigentümer/Administratoren |
    | `/model [name\|#\|status]` | Modell anzeigen oder festlegen |
    | `/models [provider] [page] [limit=<n>\|all]` | Konfigurierte bzw. mit vorhandener Authentifizierung verfügbare Provider oder Modelle auflisten |
    | `/queue <mode>` | Verhalten der Warteschlange für aktive Ausführungen verwalten. Siehe [Warteschlange](/de/concepts/queue) und [Warteschlangensteuerung](/de/concepts/queue-steering) |
    | `/steer <message>` | Anweisungen in die aktive Ausführung einfügen. Alias: `/tell`. Siehe [Steuerung](/de/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sicherheit bei ausführlicher Ausgabe / Trace / Schnellmodus / Schlussfolgerungen">
        - `/verbose` dient der Fehlersuche — lassen Sie es bei normaler Verwendung **deaktiviert**.
        - `/trace` zeigt ausschließlich Plugin-eigene Trace-/Debug-Zeilen an; die normale ausführliche Ausgabe bleibt deaktiviert.
        - `/fast auto|on|off` speichert eine Sitzungsüberschreibung dauerhaft; verwenden Sie in der Sitzungs-UI die Option `inherit`, um sie zu löschen.
        - `/fast` ist Provider-spezifisch: OpenAI/Codex ordnen dies `service_tier=priority` zu; direkte Anthropic-Anfragen ordnen es `service_tier=auto` oder `standard_only` zu.
        - `/reasoning`, `/verbose` und `/trace` sind in Gruppenumgebungen riskant — sie können interne Schlussfolgerungen oder Plugin-Diagnosen offenlegen. Lassen Sie sie in Gruppenchats deaktiviert.

      </Accordion>
      <Accordion title="Details zum Modellwechsel">
        - `/model` speichert das neue Modell sofort dauerhaft in der Sitzung.
        - Wenn der Agent inaktiv ist, verwendet es die nächste Ausführung sofort.
        - Wenn eine Ausführung aktiv ist, wird der Wechsel als ausstehend markiert und am nächsten geeigneten Wiederholungspunkt angewendet.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Erkennung und Status">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/help` | Kurze Hilfeübersicht anzeigen |
    | `/commands` | Generierten Befehlskatalog anzeigen |
    | `/tools [compact\|verbose]` | Anzeigen, was der aktuelle Agent momentan verwenden kann |
    | `/status` | Ausführungs-/Laufzeitstatus, Betriebszeit von Gateway und System, Plugin-Zustand sowie Provider-Nutzung/-Kontingent anzeigen |
    | `/status plugins` | Detaillierten Plugin-Zustand anzeigen: Ladefehler, Quarantänen, Fehler von Kanal-Plugins, Abhängigkeitsprobleme und Kompatibilitätshinweise. Erfordert `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Dauerhaftes [Ziel](/de/tools/goal) der aktuellen Sitzung verwalten |
    | `/diagnostics [note]` | Supportbericht-Ablauf nur für Eigentümer. Fordert jedes Mal eine Ausführungsgenehmigung an |
    | `/openclaw <request>` | OpenClaw-Hilfe für Einrichtung und Reparatur aus einer Eigentümer-Direktnachricht ausführen |
    | `/tasks` | Aktive/kürzlich ausgeführte Hintergrundaufgaben der aktuellen Sitzung auflisten |
    | `/context [list\|detail\|map\|json]` | Erläutern, wie der Kontext zusammengestellt wird |
    | `/whoami` | Ihre Absender-ID anzeigen. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Nutzungsfußzeile pro Antwort steuern (`reset`/`inherit`/`clear`/`default` löscht die Sitzungsüberschreibung, sodass der konfigurierte Standard erneut übernommen wird) oder eine lokale Kostenübersicht ausgeben |
  </Accordion>

  <Accordion title="Skills, Positivlisten, Genehmigungen">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/skill <name> [input]` | Einen Skill nach Namen ausführen |
    | `/learn [request]` | Einen überprüfbaren Skill aus der aktuellen Unterhaltung oder aus benannten Quellen über den [Skill Workshop](/de/tools/skill-workshop) entwerfen |
    | `/allowlist [list\|add\|remove] ...` | Einträge der Positivliste verwalten. Nur Text |
    | `/approve <id> <decision>` | Genehmigungsaufforderungen für die Ausführung oder Plugins bearbeiten |
    | `/btw <question>` | Eine Nebenfrage stellen, ohne den Sitzungskontext zu ändern. Alias: `/side`. Siehe [BTW](/de/tools/btw) |
  </Accordion>

  <Accordion title="Unteragenten und ACP">
    | Befehl | Beschreibung |
    | --- | --- |
    | `/subagents list\|log\|info` | Ausführungen von Unteragenten für die aktuelle Sitzung prüfen |
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

### Dock-Befehle

Dock-Befehle stellen die Antwortweiterleitung der aktiven Sitzung auf einen anderen verknüpften Kanal um.
Informationen zur Einrichtung und Fehlerbehebung finden Sie unter [Kanal-Docking](/de/concepts/channel-docking).

Aus Kanal-Plugins mit Unterstützung für native Befehle generiert:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

Dock-Befehle erfordern `session.identityLinks`. Der Absender der Quelle und der Zielkontakt
müssen sich in derselben Identitätsgruppe befinden.

### Befehle gebündelter Plugins

| Befehl                                                 | Beschreibung                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Memory Dreaming umschalten (Eigentümer oder Gateway-Administrator). Siehe [Dreaming](/de/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gerätekopplung verwalten. Siehe [Kopplung](/de/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Befehle mit hohem Risiko auf Nodes vorübergehend freigeben (Kamera/Bildschirm/Computer/Schreibzugriffe). Siehe [Computernutzung](/de/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Sprachkonfiguration für Talk verwalten. Nativer Discord-Name: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Vorlagen für Rich Cards über LINE senden. Siehe [LINE](/de/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Das App-Server-Testsystem von Codex binden, steuern und prüfen (Status, Threads, Fortsetzen, Modell, Schnellmodus, Berechtigungen, Komprimieren, Überprüfung, MCP, Skills und mehr). Siehe [Codex-Testsystem](/de/plugins/codex-harness) |

Nur QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-Befehle

Von Benutzern aufrufbare Skills werden als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als allgemeiner Einstiegspunkt.
- Skills können als direkte Befehle registriert werden (z. B. `/prose` für OpenProse).
- Die Registrierung nativer Skill-Befehle wird durch `commands.nativeSkills` und
  `channels.<provider>.commands.nativeSkills` gesteuert.
- Namen werden zu `a-z0-9_` bereinigt (max. 32 Zeichen); bei Kollisionen werden numerische Suffixe angefügt.

<AccordionGroup>
  <Accordion title="Weiterleitung von Skill-Befehlen">
    Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.

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

`/tools` beantwortet eine Laufzeitfrage: **Was dieser Agent jetzt in dieser
Unterhaltung verwenden kann** — nicht einen statischen Konfigurationskatalog.

```text
/tools         # kompakte Ansicht
/tools verbose # mit kurzen Beschreibungen
```

Die Ergebnisse gelten für die jeweilige Sitzung. Ein Wechsel des Agenten, Kanals, Threads, der Absender-
autorisierung oder des Modells kann die Ausgabe ändern. Verwenden Sie zum Bearbeiten von Profilen und Überschreibungen
den Bereich „Tools“ in der Control UI oder die Konfigurationsoberflächen.

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
Modelle. Die Auswahl berücksichtigt `agents.defaults.modelPolicy.allow`,
einschließlich `provider/*`-Einträgen. Ohne eine ausdrückliche Positivliste beschränken Modelleinträge und
Aliasse die Auswahl nicht.

## `/config`: Schreiben der Konfiguration auf den Datenträger

<Note>
  Nur für Eigentümer. Standardmäßig deaktiviert — mit `commands.config: true` aktivieren.
</Note>

```text
/config show
/config show channels.whatsapp.responsePrefix
/config get channels.whatsapp.responsePrefix
/config set channels.whatsapp.responsePrefix="[openclaw]"
/config unset channels.whatsapp.responsePrefix
```

Die Konfiguration wird vor dem Schreiben validiert. Ungültige Änderungen werden abgelehnt. Aktualisierungen durch `/config`
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

`/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in den Projekteinstellungen eingebetteter Agenten.
`/mcp show` schwärzt Felder mit Anmeldedaten, Werte erkannter Anmeldedaten-Flags
und bekannte Argumente, deren Form auf Geheimnisse hindeutet. Bei der Ausführung aus einer Gruppe wird die
Konfiguration privat an den Eigentümer gesendet; wenn keine private Route zum Eigentümer
verfügbar ist, schlägt der Befehl sicher geschlossen fehl und fordert den Eigentümer auf, es in einem direkten
Chat erneut zu versuchen.

## `/debug`: Überschreibungen nur für die Laufzeit

<Note>
  Nur für Eigentümer. Standardmäßig deaktiviert — mit `commands.debug: true` aktivieren.
  Überschreibungen gelten sofort für neue Konfigurationslesevorgänge, werden jedoch **nicht** auf den Datenträger geschrieben.
</Note>

```text
/debug show
/debug set channels.whatsapp.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset channels.whatsapp.responsePrefix
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
und dem offiziellen Katalog benötigen keine zusätzliche Bestätigung. Beliebige Quellen aus npm,
git, Archiven, `npm-pack:` und lokalen Pfaden zeigen eine Herkunftswarnung an und
erfordern nach Ihrer Überprüfung des Quellcodes ein abschließendes `--force`. Dieses Flag bestätigt
die Quelle und erlaubt das Ersetzen einer vorhandenen Installation; es umgeht weder
`security.installPolicy` noch die Sicherheitsprüfungen des Installationsprogramms. ClawHub-Versionen mit
Risikowarnungen erfordern weiterhin das separate, ausschließlich in der Shell verfügbare
Flag `--acknowledge-clawhub-risk`. Installationen aus Marktplätzen sowie verknüpfte und angeheftete Installationen
bleiben ebenfalls ausschließlich in der Shell verfügbar.

## `/trace`: Plugin-Trace-Ausgabe

```text
/trace          # aktuellen Trace-Status anzeigen
/trace on
/trace off
```

`/trace` zeigt sitzungsbezogene Trace-/Debug-Zeilen von Plugins ohne den vollständigen ausführlichen
Modus an. Dies ersetzt weder `/debug` (Laufzeitüberschreibungen) noch `/verbose` (normale
Tool-Ausgabe).

## `/btw`: Nebenfragen

`/btw` ist eine kurze Nebenfrage zum aktuellen Sitzungskontext. Alias: `/side`.

```text
/btw was machen wir gerade?
/side was hat sich geändert, während der Hauptdurchlauf fortgesetzt wurde?
```

Im Gegensatz zu einer normalen Nachricht:

- Verwendet die aktuelle Sitzung als Hintergrundkontext.
- Wird in Sitzungen des Codex-Testsystems als kurzlebiger Codex-Nebenthread ausgeführt.
- Ändert den zukünftigen Sitzungskontext **nicht**.
- Wird nicht in den Transkriptverlauf geschrieben.

Das vollständige Verhalten finden Sie unter [BTW-Nebenfragen](/de/tools/btw).

## Hinweise zu Oberflächen

<AccordionGroup>
  <Accordion title="Sitzungsbereich je Oberfläche">
    - **Textbefehle:** werden in der normalen Chatsitzung ausgeführt (Direktnachrichten teilen `main`, Gruppen haben jeweils eine eigene Sitzung).
    - **Native Discord-Befehle:** `agent:<agentId>:discord:slash:<userId>`
    - **Native Slack-Befehle:** `agent:<agentId>:slack:slash:<userId>` (Präfix über `channels.slack.slashCommand.sessionPrefix` konfigurierbar)
    - **Native Telegram-Befehle:** `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chatsitzung)
    - **`/login codex`** sendet Gerätekopplungscodes nur über private Chats oder Antwortpfade der Web-UI. Bei Aufrufen in Telegram-Gruppen/-Themen wird der Eigentümer stattdessen aufgefordert, dem Bot eine Direktnachricht zu senden.
    - **`/stop`** zielt auf die aktive Chatsitzung, um den aktuellen Durchlauf abzubrechen.

  </Accordion>
  <Accordion title="Slack-spezifische Details">
    `channels.slack.slashCommand` unterstützt einen einzelnen Befehl im Stil von `/openclaw`.
    Erstellen Sie mit `commands.native: true` für jeden integrierten Befehl einen eigenen
    Slack-Slash-Befehl. Registrieren Sie `/agentstatus` (nicht `/status`), da Slack
    `/status` reserviert. Der Text `/status` funktioniert weiterhin in Slack-Nachrichten.
  </Accordion>
  <Accordion title="Schneller Pfad und Inline-Kurzbefehle">
    - Nachrichten, die ausschließlich Befehle enthalten und von Absendern auf der Zulassungsliste stammen, werden sofort verarbeitet (Warteschlange und Modell werden umgangen).
    - Inline-Kurzbefehle (`/help`, `/commands`, `/status`, `/whoami`) funktionieren auch eingebettet in normale Nachrichten und werden entfernt, bevor das Modell den verbleibenden Text sieht.
    - Nicht autorisierte Nachrichten, die ausschließlich Befehle enthalten, werden stillschweigend ignoriert; Inline-Token vom Typ `/...` werden als einfacher Text behandelt.

  </Accordion>
  <Accordion title="Hinweise zu Argumenten">
    - Befehle akzeptieren optional ein `:` zwischen dem Befehl und den Argumenten (`/think: high`, `/send: on`).
    - `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Provider-Namen (unscharfer Abgleich); wird keine Übereinstimmung gefunden, wird der Text als Nachrichtentext behandelt.
    - `/allowlist add|remove` erfordert `commands.config: true` und berücksichtigt den Kanal `configWrites`.

  </Accordion>
</AccordionGroup>

## Provider-Nutzung und Status

- **Provider-Nutzung/Kontingent** (z. B. „Claude: 80 % verbleibend“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn die Nutzungserfassung aktiviert ist.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungseintrag im Transkript zurückgreifen, wenn die Momentaufnahme der aktiven Sitzung nur wenige Daten enthält.
- **Ausführung und Laufzeit:** `/status` meldet `Execution` für den effektiven Sandbox-Pfad und `Runtime` dafür, wer die Sitzung ausführt: `OpenClaw Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend.
- **Token/Kosten pro Antwort:** gesteuert durch `/usage off|tokens|full`.
- `/model status` betrifft Modelle, Authentifizierung und Endpunkte, nicht die Nutzung.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills" href="/de/tools/skills" icon="puzzle-piece">
    So werden Slash-Befehle von Skills registriert und zugriffsbeschränkt.
  </Card>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellen Sie einen Skill, der seinen eigenen Slash-Befehl registriert.
  </Card>
  <Card title="Übrigens" href="/de/tools/btw" icon="comments">
    Nebenfragen, ohne den Sitzungskontext zu ändern.
  </Card>
  <Card title="Steuern" href="/de/tools/steer" icon="compass">
    Steuern Sie den Agenten während der Ausführung mit `/steer`.
  </Card>
</CardGroup>
