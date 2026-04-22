---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-04-22T04:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: produktionsreif für Bot-DMs + Gruppen über grammY. Long Polling ist der Standardmodus; Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Pairing.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffne Telegram und chatte mit **@BotFather** (prüfe, dass der Handle genau `@BotFather` ist).

    Führe `/newbot` aus, folge den Eingabeaufforderungen und speichere das Token.

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

    Env-Fallback: `TELEGRAM_BOT_TOKEN=...` (nur Standardkonto).
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfiguriere das Token in config/env und starte dann das Gateway.

  </Step>

  <Step title="Gateway starten und erste DM freigeben">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing-Codes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Bot zu einer Gruppe hinzufügen">
    Füge den Bot zu deiner Gruppe hinzu und setze dann `channels.telegram.groups` und `groupPolicy` passend zu deinem Zugriffsmodell.
  </Step>
</Steps>

<Note>
Die Auflösungsreihenfolge für Tokens ist kontobewusst. In der Praxis haben Config-Werte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Einstellungen auf Telegram-Seite

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Datenschutzmodus**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, dann entweder:

    - Datenschutzmodus per `/setprivacy` deaktivieren, oder
    - den Bot zum Gruppenadministrator machen.

    Wenn du den Datenschutzmodus umschaltest, entferne den Bot in jeder Gruppe und füge ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Admin-Status wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für immer aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Nützliche BotFather-Umschalter">

    - `/setjoingroups`, um Gruppenhinzufügungen zu erlauben/zu verbieten
    - `/setprivacy` für das Sichtbarkeitsverhalten in Gruppen

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

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
    Wenn du ein Upgrade durchgeführt hast und deine Konfiguration `@username`-Einträge in der Allowlist enthält, führe `openclaw doctor --fix` aus, um sie aufzulösen (best effort; erfordert ein Telegram-Bot-Token).
    Wenn du dich zuvor auf Allowlist-Dateien aus dem Pairing-Store verlassen hast, kann `openclaw doctor --fix` Einträge in `channels.telegram.allowFrom` für Allowlist-Flows wiederherstellen (zum Beispiel wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem Eigentümer solltest du `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs bevorzugen, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (statt von früheren Pairing-Freigaben abzuhängen).

    Häufiges Missverständnis: Eine DM-Pairing-Freigabe bedeutet nicht „dieser Absender ist überall autorisiert“.
    Pairing gewährt nur DM-Zugriff. Die Autorisierung von Gruppensendern kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn du möchtest, dass „ich einmal autorisiert bin und sowohl DMs als auch Gruppenbefehle funktionieren“, trage deine numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein.

    ### Deine Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Sende deinem Bot eine DM.
    2. Führe `openclaw logs --follow` aus.
    3. Lies `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter-Methode (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen greifen zusammen:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - bei `groupPolicy: "open"`: jede Gruppe kann die Gruppen-ID-Prüfungen bestehen
         - bei `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis du `groups`-Einträge (oder `"*"`) hinzufügst
       - `groups` konfiguriert: fungiert als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppensendern verwendet. Wenn es nicht gesetzt ist, greift Telegram auf `allowFrom` zurück.
    Einträge in `groupAllowFrom` sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Lege keine Telegram-Gruppen- oder Supergroup-Chat-IDs in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Autorisierung von Gruppensendern übernimmt **keine** DM-Pairing-Store-Freigaben.
    Pairing bleibt nur für DMs. Für Gruppen setze `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Thema.
    Wenn `groupAllowFrom` nicht gesetzt ist, greift Telegram auf das konfigurierte `allowFrom` zurück, nicht auf den Pairing-Store.
    Praktisches Muster für Bots mit einem Eigentümer: setze deine Benutzer-ID in `channels.telegram.allowFrom`, lasse `groupAllowFrom` ungesetzt und erlaube die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, es sei denn, `channels.defaults.groupPolicy` ist explizit gesetzt.

    Beispiel: Beliebiges Mitglied in einer bestimmten Gruppe zulassen:

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

    Beispiel: Nur bestimmte Benutzer innerhalb einer bestimmten Gruppe zulassen:

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

      - Lege negative Telegram-Gruppen- oder Supergroup-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Lege Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn du einschränken willst, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen dürfen.
      - Verwende `groupAllowFrom: ["*"]` nur dann, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.
    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnung kann kommen von:

    - nativer `@botusername`-Erwähnung, oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschalter auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungsstatus. Verwende die Konfiguration für Persistenz.

    Beispiel für persistente Konfiguration:

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

    - leite eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lies `chat.id` aus `openclaw logs --follow`
    - oder prüfe Bot API `getUpdates`

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram wird vom Gateway-Prozess verwaltet.
- Das Routing ist deterministisch: Eingehende Antworten von Telegram gehen wieder an Telegram zurück (das Modell wählt die Kanäle nicht aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanal-Umschlag mit Antwort-Metadaten und Medien-Platzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forum-Themen fügen `:topic:<threadId>` an, damit Themen isoliert bleiben.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw routet sie mit threadbewussten Sitzungsschlüsseln und bewahrt die Thread-ID für Antworten.
- Long Polling verwendet grammY runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Sink-Konkurrenz des Runners verwendet `agents.defaults.maxConcurrent`.
- Neustarts des Long-Polling-Watchdogs werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhe `channels.telegram.pollingStallThresholdMs` nur, wenn deine Bereitstellung weiterhin falsche Polling-Stall-Neustarts bei lang laufender Arbeit sieht. Der Wert ist in Millisekunden und von `30000` bis `600000` zulässig; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann teilweise Antworten in Echtzeit streamen:

    - Direktchats: Vorschau-Nachricht + `editMessageText`
    - Gruppen/Themen: Vorschau-Nachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` wird auf Telegram auf `partial` abgebildet (Kompatibilität mit kanalübergreifender Benennung)
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschau-Nachricht wiederverwenden (Standard: `true`). Setze `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.
    - veraltete `channels.telegram.streamMode`- und boolesche `streaming`-Werte werden automatisch abgebildet

    Für reine Textantworten:

    - DM: OpenClaw behält dieselbe Vorschau-Nachricht bei und führt am Ende eine finale In-Place-Bearbeitung durch (keine zweite Nachricht)
    - Gruppe/Thema: OpenClaw behält dieselbe Vorschau-Nachricht bei und führt am Ende eine finale In-Place-Bearbeitung durch (keine zweite Nachricht)

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf normale finale Zustellung zurück und bereinigt danach die Vorschau-Nachricht.

    Vorschau-Streaming ist von Block-Streaming getrennt. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Wenn nativer Draft-Transport nicht verfügbar ist oder abgelehnt wird, fällt OpenClaw automatisch auf `sendMessage` + `editMessageText` zurück.

    Nur für Telegram verfügbarer Reasoning-Stream:

    - `/reasoning stream` sendet das Reasoning während der Generierung an die Live-Vorschau
    - die finale Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-artiger Text wird in Telegram-sicheres HTML gerendert.
    - Rohes HTML des Modells wird escaped, um Fehler beim Telegram-Parsing zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Link-Vorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` verarbeitet.

    Standardeinstellungen für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Eigene Befehlsmenüeinträge hinzufügen:

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

    - Namen werden normalisiert (führendes `/` entfernen, in Kleinbuchstaben)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - Benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skills-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden eingebaute Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich bei entsprechender Konfiguration weiterhin registrieren.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü auch nach dem Kürzen noch zu groß war; reduziere Plugin-/Skills-/benutzerdefinierte Befehle oder deaktiviere `channels.telegram.commands.native`.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Device-Pairing-Befehle (`device-pair` Plugin)

    Wenn das `device-pair` Plugin installiert ist:

    1. `/pair` erzeugt einen Setup-Code
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. Anfrage freigeben:
       - `/pair approve <requestId>` für explizite Freigabe
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste Anfrage

    Der Setup-Code enthält ein kurzlebiges Bootstrap-Token. Die eingebaute Bootstrap-Übergabe hält das primäre Node-Token auf `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Umfangsprüfungen sind rollenpräfixiert, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Rollen, die keine Operatoren sind, benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Auth-Details erneut versucht (zum Beispiel Rolle/Scopes/Public Key), wird die vorherige ausstehende Anfrage ersetzt, und die neue Anfrage verwendet eine andere `requestId`. Führe vor der Freigabe erneut `/pair pending` aus.

    Weitere Details: [Pairing](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Veraltetes `capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Wähle eine Option:",
  buttons: [
    [
      { text: "Ja", callback_data: "yes" },
      { text: "Nein", callback_data: "no" },
    ],
    [{ text: "Abbrechen", callback_data: "cancel" }],
  ],
}
```

    Callback-Klicks werden als Text an den Agenten übergeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen stellen ergonomische Aliasse bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-Steuerungen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Laufzeitsendungen verwenden den aktiven Snapshot von Konfiguration/Secrets (Start/Reload), daher führen Aktionspfade keine ad-hoc-`SecretRef`-Neuauflösung pro Sendung durch.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Reply-Threading-Tags">
    Telegram unterstützt explizite Reply-Threading-Tags in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Behandlung:

    - `off` (Standard)
    - `first`
    - `all`

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forum-Themen und Thread-Verhalten">
    Forum-Supergroups:

    - Sitzungsschlüssel für Themen hängen `:topic:<threadId>` an
    - Antworten und Schreibindikatoren zielen auf den Themen-Thread
    - Konfigurationspfad für Themen:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Spezialfall allgemeines Thema (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Schreibaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur themenspezifisch und wird nicht von Gruppenstandards geerbt.

    **Agent-Routing pro Thema**: Jedes Thema kann an einen anderen Agenten routen, indem `agentId` in der Themenkonfiguration gesetzt wird. Dadurch erhält jedes Thema seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Allgemeines Thema → Hauptagent
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

    **Persistente ACP-Themenbindung**: Forum-Themen können ACP-Harness-Sitzungen über typisierte ACP-Bindings auf oberster Ebene anheften:

    - `bindings[]` mit `type: "acp"` und `match.channel: "telegram"`

    Beispiel:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Dies ist derzeit auf Forum-Themen in Gruppen und Supergroups beschränkt.

    **Thread-gebundener ACP-Spawn aus dem Chat**:

    - `/acp spawn <agent> --thread here|auto` kann das aktuelle Telegram-Thema an eine neue ACP-Sitzung binden.
    - Nachfolgende Themennachrichten werden direkt an die gebundene ACP-Sitzung geroutet (kein `/acp steer` erforderlich).
    - OpenClaw pinnt nach erfolgreicher Bindung die Spawn-Bestätigungsnachricht im Thema.
    - Erfordert `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Der Template-Kontext enthält:

    - `MessageThreadId`
    - `IsForum`

    Verhalten von DM-Threads:

    - private Chats mit `message_thread_id` behalten DM-Routing bei, verwenden aber threadbewusste Sitzungsschlüssel/Antwortziele.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnotizen und Audiodateien.

    - Standard: Verhalten für Audiodatei
    - Tag `[[audio_as_voice]]` in der Agentenantwort, um das Senden als Sprachnotiz zu erzwingen

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

    Telegram unterscheidet zwischen Videodateien und Video-Notizen.

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

    Video-Notizen unterstützen keine Beschriftungen; bereitgestellter Nachrichtentext wird separat gesendet.

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

    Sticker-Aktion senden:

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
    Telegram-Reaktionen kommen als `message_reaction`-Updates an (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, reiht OpenClaw Systemereignisse wie diese ein:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (best effort über gesendeten Nachrichten-Cache).
    - Reaktionsereignisse respektieren weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram liefert in Reaktions-Updates keine Thread-IDs.
      - Nicht-Forum-Gruppen werden an die Gruppenchatsitzung geroutet
      - Forum-Gruppen werden an die allgemeine Themen-Sitzung der Gruppe (`:topic:1`) geroutet, nicht an das genaue Ursprungsthema

    `allowed_updates` für Polling/Webhook enthalten automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Agenten-Identitäts-Emoji (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwende `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Config-Schreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge in die Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

    Durch Telegram ausgelöste Schreibvorgänge umfassen:

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

  <Accordion title="Long Polling vs Webhook">
    Standard: Long Polling.

    Webhook-Modus:

    - `channels.telegram.webhookUrl` setzen
    - `channels.telegram.webhookSecret` setzen (erforderlich, wenn eine Webhook-URL gesetzt ist)
    - optional `channels.telegram.webhookPath` (Standard `/telegram-webhook`)
    - optional `channels.telegram.webhookHost` (Standard `127.0.0.1`)
    - optional `channels.telegram.webhookPort` (Standard `8787`)

    Der Standard-Local-Listener für den Webhook-Modus bindet an `127.0.0.1:8787`.

    Wenn sich dein öffentlicher Endpunkt unterscheidet, setze einen Reverse Proxy davor und verweise `webhookUrl` auf die öffentliche URL.
    Setze `webhookHost` (zum Beispiel `0.0.0.0`), wenn du bewusst externen Ingress benötigst.

  </Accordion>

  <Accordion title="Limits, Retry und CLI-Ziele">
    - `channels.telegram.textChunkLimit` ist standardmäßig 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor einer Aufteilung nach Länge.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard).
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passe nur zwischen `30000` und `600000` an, wenn falsche Neustarts wegen Polling-Stalls auftreten.
    - Der Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Ergänzender Antwort-/Zitat-/Weiterleitungs-Kontext wird derzeit wie empfangen weitergegeben.
    - Telegram-Allowlists steuern in erster Linie, wer den Agenten auslösen kann, und sind keine vollständige Schwärzungsgrenze für ergänzenden Kontext.
    - DM-Verlaufssteuerungen:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern.

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
    - `--thread-id` für Forum-Themen (oder ein `:topic:`-Ziel verwenden)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies für die Zieloberfläche erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Fotos oder Uploads animierter Medien zu senden

    Aktions-Gating:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Umfragen
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Umfragen, während normales Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Freigaben in Telegram">
    Telegram unterstützt Exec-Freigaben in Approver-DMs und kann Freigabeaufforderungen optional im ursprünglichen Chat oder Thema posten.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (optional; greift nach Möglichkeit auf numerische Eigentümer-IDs zurück, die aus `allowFrom` und direktem `defaultTo` abgeleitet werden)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`

    Approver müssen numerische Telegram-Benutzer-IDs sein. Telegram aktiviert native Exec-Freigaben automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Approver aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus der numerischen Eigentümerkonfiguration des Kontos (`allowFrom` und Direktnachrichten-`defaultTo`). Setze `enabled: false`, um Telegram explizit als nativen Freigabe-Client zu deaktivieren. Freigabeanfragen greifen sonst auf andere konfigurierte Freigaberouten oder auf die Fallback-Richtlinie für Exec-Freigaben zurück.

    Telegram rendert auch die gemeinsamen Freigabeschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Telegram-Adapter fügt hauptsächlich das Routing von Approver-DMs, Fanout für Kanal/Thema und Schreibindikatoren vor der Zustellung hinzu.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre Freigabe-UX; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur dann einschließen, wenn das Tool-Ergebnis sagt,
    dass Chat-Freigaben nicht verfügbar sind oder manuelle Freigabe der einzige Weg ist.

    Zustellungsregeln:

    - `target: "dm"` sendet Freigabeaufforderungen nur an aufgelöste Approver-DMs
    - `target: "channel"` sendet die Aufforderung zurück an den ursprünglichen Telegram-Chat bzw. das Thema
    - `target: "both"` sendet an Approver-DMs und den ursprünglichen Chat bzw. das Thema

    Nur aufgelöste Approver können freigeben oder ablehnen. Nicht-Approver können `/approve` nicht verwenden und auch keine Telegram-Freigabeschaltflächen benutzen.

    Verhalten bei der Freigabeauflösung:

    - IDs mit Präfix `plugin:` werden immer über Plugin-Freigaben aufgelöst.
    - Andere Freigabe-IDs versuchen zuerst `exec.approval.resolve`.
    - Wenn Telegram auch für Plugin-Freigaben autorisiert ist und das Gateway sagt,
      dass die Exec-Freigabe unbekannt/abgelaufen ist, versucht Telegram es einmal erneut über
      `plugin.approval.resolve`.
    - Echte Ablehnungen/Fehler bei Exec-Freigaben fallen nicht stillschweigend auf die
      Auflösung von Plugin-Freigaben zurück.

    Die Zustellung im Kanal zeigt den Befehlstext im Chat an, daher aktiviere `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn die Aufforderung in einem Forum-Thema landet, bewahrt OpenClaw das Thema sowohl für die Freigabeaufforderung als auch für die Nachverfolgung nach der Freigabe. Exec-Freigaben laufen standardmäßig nach 30 Minuten ab.

    Inline-Freigabeschaltflächen hängen außerdem davon ab, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche zulässt (`dm`, `group` oder `all`).

    Zugehörige Dokumentation: [Exec-Freigaben](/de/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Steuerungen für Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Providerfehler stößt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                   |
| ----------------------------------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine benutzerfreundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam bei Ausfällen. |

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
  <Accordion title="Bot antwortet nicht auf Gruppen-Nachrichten ohne Erwähnung">

    - Wenn `requireMention=false`, muss der Telegram-Datenschutzmodus volle Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - dann Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; Wildcard `"*"` kann nicht auf Mitgliedschaft geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht Gruppennachrichten überhaupt nicht">

    - wenn `channels.telegram.groups` existiert, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - Mitgliedschaft des Bots in der Gruppe prüfen
    - Logs prüfen: `openclaw logs --follow` für Gründe des Überspringens

  </Accordion>

  <Accordion title="Befehle funktionieren nur teilweise oder gar nicht">

    - deine Absenderidentität autorisieren (Pairing und/oder numerisches `allowFrom`)
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; Plugin-/Skills-/benutzerdefinierte Befehle reduzieren oder native Menüs deaktivieren
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern weist normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ + benutzerdefiniertes Fetch/Proxy kann sofortiges Abort-Verhalten auslösen, wenn `AbortSignal`-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; fehlerhafter IPv6-Egress kann zu intermittierenden Telegram-API-Fehlern führen.
    - Wenn die Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, versucht OpenClaw dies nun als behebbare Netzwerkfehler erneut.
    - Wenn die Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - Erhöhe `channels.telegram.pollingStallThresholdMs` nur dann, wenn lange laufende `getUpdates`-Aufrufe gesund sind, dein Host aber weiterhin falsche Neustarts wegen Polling-Stalls meldet. Anhaltende Stalls weisen normalerweise auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Auf VPS-Hosts mit instabilem direktem Egress/TLS leite Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2) und `dnsResultOrder=ipv4first`.
    - Wenn dein Host WSL2 ist oder explizit besser mit reinem IPv4-Verhalten funktioniert, erzwinge die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmarkbereich (`198.18.0.0/15`) sind
      für Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder
      transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere
      private/interne/spezielle Adresse umschreibt, kannst du die
      nur für Telegram geltende Umgehung aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Aktivierung ist pro Konto verfügbar unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Wenn dein Proxy Telegram-Media-Hosts in `198.18.x.x` auflöst, lasse das
      gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-
      Benchmarkbereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt den Telegram-
      Medien-SSRF-Schutz. Verwende es nur für vertrauenswürdige, operatorgesteuerte Proxy-
      Umgebungen wie Clash, Mihomo oder Surge-Fake-IP-Routing, wenn diese
      private oder spezielle Antworten außerhalb des RFC-2544-Benchmarkbereichs synthetisieren. Lass es für normalen öffentlichen Telegram-Internetzugriff deaktiviert.
    </Warning>

    - Umgebungsüberschreibungen (temporär):
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

## Verweise auf die Telegram-Konfigurationsreferenz

Primäre Referenz:

- `channels.telegram.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.telegram.botToken`: Bot-Token (BotFather).
- `channels.telegram.tokenFile`: Token aus einem regulären Dateipfad lesen. Symlinks werden abgelehnt.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.telegram.allowFrom`: DM-Allowlist (numerische Telegram-Benutzer-IDs). `allowlist` erfordert mindestens eine Absender-ID. `open` erfordert `"*"`. `openclaw doctor --fix` kann veraltete `@username`-Einträge in IDs auflösen und Allowlist-Einträge aus Pairing-Store-Dateien in Allowlist-Migrationsabläufen wiederherstellen.
- `channels.telegram.actions.poll`: Erstellung von Telegram-Umfragen aktivieren oder deaktivieren (standardmäßig aktiviert; erfordert weiterhin `sendMessage`).
- `channels.telegram.defaultTo`: Standard-Telegram-Ziel, das vom CLI-`--deliver` verwendet wird, wenn kein explizites `--reply-to` angegeben ist.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.telegram.groupAllowFrom`: Gruppen-Absender-Allowlist (numerische Telegram-Benutzer-IDs). `openclaw doctor --fix` kann veraltete `@username`-Einträge in IDs auflösen. Nicht numerische Einträge werden zur Auth-Zeit ignoriert. Gruppenauth verwendet keinen DM-Pairing-Store-Fallback (`2026.2.25+`).
- Vorrang bei mehreren Konten:
  - Wenn zwei oder mehr Konto-IDs konfiguriert sind, setze `channels.telegram.defaultAccount` (oder füge `channels.telegram.accounts.default` ein), um Standard-Routing explizit zu machen.
  - Wenn keines von beidem gesetzt ist, greift OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt.
  - `channels.telegram.accounts.default.allowFrom` und `channels.telegram.accounts.default.groupAllowFrom` gelten nur für das `default`-Konto.
  - Benannte Konten erben `channels.telegram.allowFrom` und `channels.telegram.groupAllowFrom`, wenn Werte auf Kontoebene nicht gesetzt sind.
  - Benannte Konten erben nicht `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: gruppenspezifische Standardwerte + Allowlist (verwende `"*"` für globale Standardwerte).
  - `channels.telegram.groups.<id>.groupPolicy`: gruppenspezifische Überschreibung für `groupPolicy` (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: Standard für Erwähnungs-Gating.
  - `channels.telegram.groups.<id>.skills`: Skills-Filter (weglassen = alle Skills, leer = keine).
  - `channels.telegram.groups.<id>.allowFrom`: gruppenspezifische Überschreibung der Absender-Allowlist.
  - `channels.telegram.groups.<id>.systemPrompt`: zusätzlicher System-Prompt für die Gruppe.
  - `channels.telegram.groups.<id>.enabled`: deaktiviert die Gruppe, wenn `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: Überschreibungen pro Thema (Gruppenfelder + themenspezifisches `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: dieses Thema an einen bestimmten Agenten routen (überschreibt Routing auf Gruppenebene und Binding-Routing).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: themenspezifische Überschreibung für `groupPolicy` (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: themenspezifische Überschreibung für Erwähnungs-Gating.
- `bindings[]` auf oberster Ebene mit `type: "acp"` und kanonischer Themen-ID `chatId:topic:topicId` in `match.peer.id`: Felder für persistente ACP-Themenbindung (siehe [ACP Agents](/de/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM-Themen an einen bestimmten Agenten routen (gleiches Verhalten wie bei Forum-Themen).
- `channels.telegram.execApprovals.enabled`: Telegram als chatbasierten Exec-Freigabe-Client für dieses Konto aktivieren.
- `channels.telegram.execApprovals.approvers`: Telegram-Benutzer-IDs, die Exec-Anfragen freigeben oder ablehnen dürfen. Optional, wenn `channels.telegram.allowFrom` oder ein direktes `channels.telegram.defaultTo` den Eigentümer bereits identifiziert.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (Standard: `dm`). `channel` und `both` bewahren das ursprüngliche Telegram-Thema, wenn vorhanden.
- `channels.telegram.execApprovals.agentFilter`: optionaler Agent-ID-Filter für weitergeleitete Freigabeaufforderungen.
- `channels.telegram.execApprovals.sessionFilter`: optionaler Sitzungsschlüssel-Filter (Teilzeichenfolge oder Regex) für weitergeleitete Freigabeaufforderungen.
- `channels.telegram.accounts.<account>.execApprovals`: Überschreibung pro Konto für Telegram-Exec-Freigabe-Routing und Approver-Autorisierung.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (Standard: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: Überschreibung pro Konto.
- `channels.telegram.commands.nativeSkills`: Telegram-native Skills-Befehle aktivieren/deaktivieren.
- `channels.telegram.replyToMode`: `off | first | all` (Standard: `off`).
- `channels.telegram.textChunkLimit`: Größe ausgehender Chunks (Zeichen).
- `channels.telegram.chunkMode`: `length` (Standard) oder `newline`, um vor der Aufteilung nach Länge an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.telegram.linkPreview`: Link-Vorschauen für ausgehende Nachrichten umschalten (Standard: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (Live-Stream-Vorschau; Standard: `partial`; `progress` wird auf `partial` abgebildet; `block` ist Kompatibilität für den veralteten Vorschau-Modus). Telegram-Vorschau-Streaming verwendet eine einzelne Vorschau-Nachricht, die direkt bearbeitet wird.
- `channels.telegram.streaming.preview.toolProgress`: die Live-Vorschau-Nachricht für Tool-/Fortschrittsaktualisierungen wiederverwenden, wenn Vorschau-Streaming aktiv ist (Standard: `true`). Setze `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.
- `channels.telegram.mediaMaxMb`: Telegram-Medienlimit für Ein- und Ausgang (MB, Standard: 100).
- `channels.telegram.retry`: Retry-Richtlinie für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern (Versuche, `minDelayMs`, `maxDelayMs`, Jitter).
- `channels.telegram.network.autoSelectFamily`: Node-`autoSelectFamily` überschreiben (true=aktivieren, false=deaktivieren). Standardmäßig auf Node 22+ aktiviert, bei WSL2 standardmäßig deaktiviert.
- `channels.telegram.network.dnsResultOrder`: DNS-Ergebnisreihenfolge überschreiben (`ipv4first` oder `verbatim`). Standardmäßig `ipv4first` auf Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: gefährliche Aktivierung für vertrauenswürdige Fake-IP- oder transparente Proxy-Umgebungen, in denen Telegram-Mediendownloads `api.telegram.org` auf private/interne/spezielle Adressen außerhalb der standardmäßigen RFC-2544-Benchmarkbereich-Ausnahme auflösen.
- `channels.telegram.proxy`: Proxy-URL für Bot-API-Aufrufe (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Webhook-Modus aktivieren (erfordert `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: Webhook-Secret (erforderlich, wenn `webhookUrl` gesetzt ist).
- `channels.telegram.webhookPath`: lokaler Webhook-Pfad (Standard `/telegram-webhook`).
- `channels.telegram.webhookHost`: lokaler Webhook-Bind-Host (Standard `127.0.0.1`).
- `channels.telegram.webhookPort`: lokaler Webhook-Bind-Port (Standard `8787`).
- `channels.telegram.actions.reactions`: Telegram-Tool-Reaktionen steuern.
- `channels.telegram.actions.sendMessage`: Telegram-Tool-Nachrichtensendungen steuern.
- `channels.telegram.actions.deleteMessage`: Telegram-Tool-Nachrichtenlöschungen steuern.
- `channels.telegram.actions.sticker`: Telegram-Sticker-Aktionen steuern — senden und suchen (Standard: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — steuert, welche Reaktionen Systemereignisse auslösen (standardmäßig `own`, wenn nicht gesetzt).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — steuert die Reaktionsfähigkeit des Agenten (standardmäßig `minimal`, wenn nicht gesetzt).
- `channels.telegram.errorPolicy`: `reply | silent` — steuert das Verhalten bei Fehlerantworten (Standard: `reply`). Überschreibungen pro Konto/Gruppe/Thema werden unterstützt.
- `channels.telegram.errorCooldownMs`: Mindestanzahl an ms zwischen Fehlerantworten an denselben Chat (Standard: `60000`). Verhindert Fehler-Spam bei Ausfällen.

- [Konfigurationsreferenz - Telegram](/de/gateway/configuration-reference#telegram)

Telegram-spezifische Felder mit hohem Signal:

- Start/Auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Exec-Freigaben: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Verwandt

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
