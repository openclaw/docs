---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Telegram-Bot-Unterstützungsstatus, Funktionen und Konfiguration
title: Telegram
x-i18n:
    generated_at: "2026-04-26T11:24:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7d269b15bc2d377fa45f0516e435517ed366c0216d0bc31fe4f4bc080a6c726
    source_path: channels/telegram.md
    workflow: 15
---

Produktionsreif für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist pairing.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnellstart

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (prüfen Sie, dass der Handle exakt `@BotFather` ist).

    Führen Sie `/newbot` aus, folgen Sie den Anweisungen und speichern Sie das Token.

  </Step>

  <Step title="Token und DM-Richtlinie konfigurieren">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Fallback über Umgebungsvariable: `TELEGRAM_BOT_TOKEN=...` (nur Standardkonto).
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in config/env und starten Sie dann das Gateway.

  </Step>

  <Step title="Gateway starten und erste DM genehmigen">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kopplungscodes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Bot zu einer Gruppe hinzufügen">
    Fügen Sie den Bot zu Ihrer Gruppe hinzu und setzen Sie dann `channels.telegram.groups` und `groupPolicy` passend zu Ihrem Zugriffsmodell.
  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Werte aus der Konfiguration Vorrang vor dem Fallback über Umgebungsvariablen, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Einstellungen auf Telegram-Seite

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Datenschutzmodus**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, entweder:

    - deaktivieren Sie den Datenschutzmodus über `/setprivacy`, oder
    - machen Sie den Bot zu einem Gruppenadmin.

    Wenn Sie den Datenschutzmodus umschalten, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Admin-Status wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für ein ständig aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Nützliche BotFather-Umschalter">

    - `/setjoingroups`, um das Hinzufügen zu Gruppen zu erlauben/verbieten
    - `/setprivacy` für das Sichtbarkeitsverhalten in Gruppen

  </Accordion>
</AccordionGroup>

## Zugriffssteuerung und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Das Setup fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best-Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Allowlist-Dateien im pairing-Speicher verlassen haben, kann `openclaw doctor --fix` Einträge in `channels.telegram.allowFrom` für allowlist-Abläufe wiederherstellen (zum Beispiel wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem Eigentümer bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (statt von früheren Kopplungsgenehmigungen abzuhängen).

    Häufiges Missverständnis: Die Genehmigung einer DM-Kopplung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Die Kopplung gewährt nur DM-Zugriff. Die Autorisierung von Absendern in Gruppen kommt weiterhin aus expliziten Allowlists in der Konfiguration.
    Wenn Sie möchten, dass „ich einmal autorisiert bin und sowohl DMs als auch Gruppenbefehle funktionieren“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Senden Sie Ihrem Bot eine DM.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbietermethode (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerelemente greifen zusammen:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: jede Gruppe kann die Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen sind blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn es nicht gesetzt ist, greift Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Legen Sie Telegram-Gruppen- oder Supergroup-Chat-IDs nicht in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Authentifizierung von Gruppenabsendern übernimmt **nicht** Genehmigungen aus dem DM-pairing-Speicher.
    Die Kopplung bleibt nur für DMs. Für Gruppen setzen Sie `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Thema.
    Wenn `groupAllowFrom` nicht gesetzt ist, greift Telegram auf das Konfigurations-`allowFrom` zurück, nicht auf den pairing-Speicher.
    Praktisches Muster für Bots mit einem Eigentümer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwenden die Laufzeit-Standardeinstellungen fail-closed `groupPolicy="allowlist"`, außer `channels.defaults.groupPolicy` ist explizit gesetzt.

    Beispiel: beliebiges Mitglied in genau einer bestimmten Gruppe erlauben:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Beispiel: nur bestimmte Benutzer in genau einer bestimmten Gruppe erlauben:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Häufiger Fehler: `groupAllowFrom` ist keine Telegram-Gruppen-Allowlist.

      - Legen Sie negative Telegram-Gruppen- oder Supergroup-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie einschränken möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn Sie möchten, dass jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen kann.
    </Warning>

  </Tab>

  <Tab title="Mention-Verhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Eine Erwähnung kann erfolgen über:

    - eine native `@botusername`-Erwähnung, oder
    - Erwähnungsmuster in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Umschalter auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungszustand. Verwenden Sie für dauerhafte Einstellungen die Konfiguration.

    Beispiel für dauerhafte Konfiguration:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Die Gruppen-Chat-ID ermitteln:

    - leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie `getUpdates` der Bot API

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört dem Gateway-Prozess.
- Das Routing ist deterministisch: Eingehende Telegram-Antworten gehen an Telegram zurück (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanalumschlag mit Antwortmetadaten und Medien-Platzhaltern normalisiert.
- Gruppensitzungen sind nach Gruppen-ID isoliert. Forum-Themen hängen `:topic:<threadId>` an, damit Themen isoliert bleiben.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw routet sie mit threadbewussten Sitzungsschlüsseln und bewahrt die Thread-ID für Antworten.
- Long Polling verwendet den grammY runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Sink-Konkurrenz des runners verwendet `agents.defaults.maxConcurrent`.
- Long Polling ist innerhalb jedes Gateway-Prozesses geschützt, sodass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Wenn Sie dennoch `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderes OpenClaw-Gateway, Skript oder ein externer Poller dasselbe Token.
- Neustarts des Long-Polling-Watchdogs werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung weiterhin falsche Neustarts wegen Polling-Stillstand während lang laufender Arbeit sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` zulässig; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann teilweise Antworten in Echtzeit streamen:

    - Direktchats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` wird auf Telegram auf `partial` abgebildet (Kompatibilität mit kanalübergreifender Benennung)
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsupdates dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - veraltete Werte `channels.telegram.streamMode` und boolesche `streaming`-Werte werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie nach `channels.telegram.streaming.mode` zu migrieren

    Tool-Fortschritts-Vorschauaktualisierungen sind die kurzen „Working...“-Zeilen, die angezeigt werden, während Tools laufen, zum Beispiel bei Befehlsausführung, Dateilesevorgängen, Planungsaktualisierungen oder Patch-Zusammenfassungen. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` und später zu entsprechen. Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie Telegram-Vorschau-Bearbeitungen vollständig deaktivieren möchten. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur die Tool-Fortschrittsstatuszeilen deaktivieren möchten.

    Für reine Textantworten:

    - DM: OpenClaw behält dieselbe Vorschaunachricht bei und führt eine abschließende Bearbeitung an Ort und Stelle durch (keine zweite Nachricht)
    - Gruppe/Thema: OpenClaw behält dieselbe Vorschaunachricht bei und führt eine abschließende Bearbeitung an Ort und Stelle durch (keine zweite Nachricht)

    Für komplexe Antworten (zum Beispiel Medien-Nutzlasten) fällt OpenClaw auf die normale endgültige Zustellung zurück und bereinigt danach die Vorschaunachricht.

    Vorschau-Streaming ist vom Block-Streaming getrennt. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Wenn der native Entwurfs-Transport nicht verfügbar ist oder abgelehnt wird, fällt OpenClaw automatisch auf `sendMessage` + `editMessageText` zurück.

    Nur für Telegram verfügbarer Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die endgültige Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird in für Telegram sicheres HTML gerendert.
    - Rohes HTML aus dem Modell wird maskiert, um Telegram-Parsefehler zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Link-Vorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` durchgeführt.

    Standard für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Benutzerdefinierte Menüeinträge hinzufügen:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git-Backup" },
        { command: "generate", description: "Ein Bild erstellen" },
      ],
    },
  },
}
```

    Regeln:

    - Namen werden normalisiert (führendes `/` entfernen, kleinschreiben)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren Verhalten nicht automatisch
    - Plugin-/Skills-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü auch nach dem Kürzen noch überfüllt war; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet in der Regel, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Gerätekopplungsbefehle (Plugin `device-pair`)

    Wenn das Plugin `device-pair` installiert ist:

    1. `/pair` erzeugt einen Setup-Code
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. die Anfrage genehmigen:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die aktuellste

    Der Setup-Code enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scopes werden mit Rollenpräfixen geprüft, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Rollen, die keine Operatoren sind, benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie vor dem Genehmigen erneut `/pair pending` aus.

    Weitere Details: [Kopplung](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
    Bereich für Inline-Tastaturen konfigurieren:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Überschreibung pro Konto:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Bereiche:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Das ältere `capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Wählen Sie eine Option:",
  buttons: [
    [
      { text: "Ja", callback_data: "yes" },
      { text: "Nein", callback_data: "no" },
    ],
    [{ text: "Abbrechen", callback_data: "cancel" }],
  ],
}
```

    Callback-Klicks werden als Text an den Agent übergeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agents und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen stellen ergonomische Aliasse bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Steuerungsoptionen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten Umschalter `channels.telegram.actions.*`.
    Laufzeit-Sendevorgänge verwenden den aktiven Snapshot von Konfiguration/Secrets (Start/Reload), daher führen Aktionspfade keine ad-hoc-Neuauflösung von SecretRef pro Sendevorgang durch.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Tags für Antwort-Threading">
    Telegram unterstützt explizite Tags für Antwort-Threading in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Behandlung:

    - `off` (Standard)
    - `first`
    - `all`

    Wenn Antwort-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die Bildunterschrift verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, daher werden längere Nachrichten vom Anfang an zitiert und fallen auf eine einfache Antwort zurück, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite Tags `[[reply_to_*]]` werden weiterhin beachtet.

  </Accordion>

  <Accordion title="Forum-Themen und Thread-Verhalten">
    Forum-Supergroups:

    - Sitzungsschlüssel für Themen hängen `:topic:<threadId>` an
    - Antworten und Tippen zielen auf den Themen-Thread
    - Konfigurationspfad für Themen:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall „Allgemeines Thema“ (`threadId=1`):

    - beim Senden von Nachrichten wird `message_thread_id` weggelassen (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge übernehmen Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` gilt nur für Themen und wird nicht von Gruppenstandards übernommen.

    **Agent-Routing pro Thema**: Jedes Thema kann durch Setzen von `agentId` in der Themenkonfiguration an einen anderen Agent weitergeleitet werden. Dadurch erhält jedes Thema seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Allgemeines Thema → main-Agent
                "3": { agentId: "zu" },        // Dev-Thema → zu-Agent
                "5": { agentId: "coder" }      // Code-Review → coder-Agent
              }
            }
          }
        }
      }
    }
    ```

    Jedes Thema hat dann seinen eigenen Sitzungsschlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Themenbindung**: Forum-Themen können ACP-Harness-Sitzungen über ACP-Bindungen mit typisiertem obersten Level anheften (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forum-Themen in Gruppen/Supergroups beschränkt. Siehe [ACP Agents](/de/tools/acp-agents).

    **Thread-gebundener ACP-Start aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgeaktionen werden direkt dorthin geleitet. OpenClaw heftet die Spawn-Bestätigung im Thema an. Erfordert `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Der Vorlagenkontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten das DM-Routing bei, verwenden aber threadbewusste Sitzungsschlüssel.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnotizen und Audiodateien.

    - Standard: Verhalten als Audiodatei
    - Tag `[[audio_as_voice]]` in der Agent-Antwort erzwingt das Senden als Sprachnotiz
    - eingehende Transkripte von Sprachnotizen werden im Agent-Kontext als maschinell erzeugter,
      nicht vertrauenswürdiger Text eingerahmt; die Erkennung von Erwähnungen verwendet weiterhin das rohe
      Transkript, sodass per Erwähnung gesteuerte Sprachnachrichten weiter funktionieren.

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Videonachrichten

    Telegram unterscheidet zwischen Videodateien und Videonotizen.

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Videonotizen unterstützen keine Beschriftungen; bereitgestellter Nachrichtentext wird separat gesendet.

    ### Sticker

    Verarbeitung eingehender Sticker:

    - statisches WEBP: heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`)
    - animiertes TGS: übersprungen
    - Video-WEBM: übersprungen

    Sticker-Kontextfelder:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Sticker-Cache-Datei:

    - `~/.openclaw/telegram/sticker-cache.json`

    Sticker werden einmal beschrieben (wenn möglich) und zwischengespeichert, um wiederholte Vision-Aufrufe zu reduzieren.

    Sticker-Aktionen aktivieren:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Sticker-Aktion zum Senden:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Zwischengespeicherte Sticker durchsuchen:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "winkende Katze",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Telegram-Reaktionen kommen als `message_reaction`-Updates an (getrennt von Nachrichten-Nutzlasten).

    Wenn aktiviert, stellt OpenClaw Systemereignisse in die Warteschlange wie:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best-Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffssteuerungen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram liefert in Reaktionsupdates keine Thread-IDs.
      - Nicht-Forum-Gruppen werden an die Gruppenchatsitzung geleitet
      - Forum-Gruppen werden an die Gruppensitzung des allgemeinen Themas (`:topic:1`) geleitet, nicht an das genaue Ursprungsthema

    `allowed_updates` für Polling/Webhook enthalten automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Reihenfolge der Auflösung:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Agent-Identitäts-Emoji (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge in die Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

    Von Telegram ausgelöste Schreibvorgänge umfassen:

    - Gruppenmigrationsereignisse (`migrate_to_chat_id`) zum Aktualisieren von `channels.telegram.groups`
    - `/config set` und `/config unset` (erfordert aktivierte Befehle)

    Deaktivieren:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long Polling vs. Webhook">
    Standard ist Long Polling. Für den Webhook-Modus setzen Sie `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret`; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress setzen Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen absichtlich `webhookHost: "0.0.0.0"`.

    Der Webhook-Modus validiert Anfrage-Schutzmechanismen, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update dann asynchron über dieselben Bot-Lanes pro Chat/pro Thema wie beim Long Polling, sodass langsame Agent-Durchläufe das Zustellungs-ACK von Telegram nicht aufhalten.

  </Accordion>

  <Accordion title="Limits, Retry und CLI-Ziele">
    - Der Standardwert für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor dem Splitten nach Länge.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard).
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; optimieren Sie zwischen `30000` und `600000` nur bei falsch positiven Neustarts wegen Polling-Stillstand.
    - Der Verlauf des Gruppenkontexts verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext für Antworten/Zitate/Weiterleitungen wird derzeit so weitergegeben, wie er empfangen wurde.
    - Telegram-Allowlists steuern in erster Linie, wer den Agent auslösen kann, nicht eine vollständige Grenze zur Schwärzung ergänzender Kontexte.
    - Steuerelemente für den DM-Verlauf:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern.

    Das CLI-Sendeziel kann eine numerische Chat-ID oder ein Benutzername sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram-Umfragen verwenden `openclaw message poll` und unterstützen Forum-Themen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur für Telegram verfügbare Umfrage-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forum-Themen (oder ein Ziel mit `:topic:` verwenden)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies für die Zielfläche erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Fotos oder Uploads für animierte Medien zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Umfragen
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Umfragen, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Direktnachrichten an Genehmiger und kann optional Eingabeaufforderungen im ursprünglichen Chat oder Thema posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (wird automatisch aktiviert, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Eigentümer-IDs aus `allowFrom` / `defaultTo` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Die Zustellung im Kanal zeigt den Befehlstext im Chat; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn die Eingabeaufforderung in einem Forum-Thema landet, bewahrt OpenClaw das Thema für die Genehmigungsaufforderung und die Nachverfolgung. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zielfläche erlaubt (`dm`, `group` oder `all`). Genehmigungs-IDs mit Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec approvals](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerelemente für Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler stößt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                      |
| ----------------------------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine benutzerfreundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam bei Ausfällen.    |

Überschreibungen pro Konto, pro Gruppe und pro Thema werden unterstützt (gleiche Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // Fehler in dieser Gruppe unterdrücken
        },
      },
    },
  },
}
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bot antwortet nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false`, muss der Telegram-Datenschutzmodus volle Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - dann Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; für den Wildcard `"*"` kann keine Mitgliedschaft geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht Gruppennachrichten überhaupt nicht">

    - wenn `channels.telegram.groups` existiert, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - prüfen Sie die Bot-Mitgliedschaft in der Gruppe
    - prüfen Sie die Logs: `openclaw logs --follow` auf Gründe für das Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - autorisieren Sie Ihre Absenderidentität (Kopplung und/oder numerisches `allowFrom`)
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern weist in der Regel auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Polling- oder Netzwerk-Instabilität">

    - Node 22+ + benutzerdefinierter Fetch/Proxy kann sofortiges Abbruchverhalten auslösen, wenn `AbortSignal`-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst in IPv6 auf; defekter IPv6-Ausgang kann zu intermittierenden Telegram-API-Fehlern führen.
    - Wenn die Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese jetzt als behebbare Netzwerkfehler.
    - Wenn die Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und erstellt den Telegram-Transport standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, Ihr Host aber weiterhin falsch positive Neustarts wegen Polling-Stillstand meldet. Anhaltende Stillstände weisen normalerweise auf Probleme mit Proxy, DNS, IPv6 oder TLS-Ausgang zwischen dem Host und `api.telegram.org` hin.
    - Auf VPS-Hosts mit instabilem direktem Ausgang/TLS leiten Sie Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2) und `dnsResultOrder=ipv4first`.
    - Wenn Ihr Host WSL2 ist oder explizit besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem Benchmark-Bereich RFC 2544 (`198.18.0.0/15`) sind
      standardmäßig bereits für Telegram-Mediendownloads erlaubt. Wenn eine vertrauenswürdige Fake-IP oder ein
      transparenter Proxy `api.telegram.org` bei Mediendownloads auf eine andere
      private/interne/spezielle Adresse umschreibt, können Sie den nur für Telegram
      verfügbaren Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Aktivierung ist pro Konto verfügbar unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Wenn Ihr Proxy Telegram-Media-Hosts in `198.18.x.x` auflöst, lassen Sie das
      gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-
      Benchmark-Bereich standardmäßig bereits.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt den Telegram-
      SSRF-Schutz für Medien. Verwenden Sie dies nur in vertrauenswürdigen, vom Operator kontrollierten Proxy-
      Umgebungen wie Clash, Mihomo oder Surge mit Fake-IP-Routing, wenn sie
      private oder spezielle Antworten außerhalb des RFC-2544-Benchmark-
      Bereichs erzeugen. Lassen Sie es für normalen Telegram-Zugriff über das öffentliche Internet deaktiviert.
    </Warning>

    - Überschreibungen per Umgebungsvariable (temporär):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS-Antworten validieren:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Weitere Hilfe: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Configuration reference - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Telegram-Felder mit hohem Signalwert">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffssteuerung: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, oberstes `bindings[]` (`type: "acp"`)
- Exec-Genehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Funktionen: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder fügen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit festzulegen. Andernfalls greift OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten übernehmen `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine Werte aus `accounts.default.*`.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Einen Telegram-Benutzer mit dem Gateway koppeln.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Allowlist-Verhalten für Gruppen und Themen.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agents weiterleiten.
  </Card>
  <Card title="Security" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Gruppen und Themen Agents zuordnen.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose.
  </Card>
</CardGroup>
