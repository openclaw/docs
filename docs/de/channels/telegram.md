---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Supportstatus, Funktionen und Konfiguration des Telegram-Bots
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:21:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsreif für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanal-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="Create the bot token in BotFather">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (bestätigen Sie, dass der Handle genau `@BotFather` lautet).

    Führen Sie `/newbot` aus, folgen Sie den Eingabeaufforderungen und speichern Sie den Token.

  </Step>

  <Step title="Configure token and DM policy">

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie den Token in config/env und starten Sie dann den Gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing-Codes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Add the bot to a group">
    Fügen Sie den Bot Ihrer Gruppe hinzu und ermitteln Sie dann beide IDs, die der Gruppenzugriff benötigt:

    - Ihre Telegram-Benutzer-ID, verwendet in `allowFrom` / `groupAllowFrom`
    - die Telegram-Gruppen-Chat-ID, verwendet als Schlüssel unter `channels.telegram.groups`

    Für die Ersteinrichtung erhalten Sie die Gruppen-Chat-ID aus `openclaw logs --follow`, einem Bot für weitergeleitete IDs oder über die Bot API `getUpdates`. Nachdem die Gruppe erlaubt wurde, kann `/whoami@<bot_username>` die Benutzer- und Gruppen-IDs bestätigen.

    Negative Telegram-Supergruppen-IDs, die mit `-100` beginnen, sind Gruppen-Chat-IDs. Legen Sie sie unter `channels.telegram.groups` ab, nicht unter `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor Env-Fallbacks, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram-Bots verwenden standardmäßig den **Privacy Mode**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, gehen Sie wie folgt vor:

    - deaktivieren Sie den Privacy Mode über `/setprivacy`, oder
    - machen Sie den Bot zum Gruppenadministrator.

    Wenn Sie den Privacy Mode umschalten, entfernen Sie den Bot in jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Group permissions">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Administrator-Bots empfangen alle Gruppennachrichten, was für dauerhaft aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups`, um das Hinzufügen zu Gruppen zu erlauben/zu verweigern
    - `/setprivacy` für das Verhalten der Gruppensichtbarkeit

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` erlaubt jedem Telegram-Konto, das den Bot-Benutzernamen findet oder errät, dem Bot Befehle zu geben. Verwenden Sie dies nur für bewusst öffentliche Bots mit streng eingeschränkten Tools; Bots mit einem Besitzer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Konfigurationen mit mehreren Konten wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: `allowFrom: ["*"]`-Einträge auf Kontoebene machen dieses Konto nicht öffentlich, es sei denn, die effektive Konto-Allowlist enthält nach dem Zusammenführen weiterhin einen expliziten Platzhalter.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (nach bestem Aufwand; erfordert einen Telegram-Bot-Token).
    Wenn Sie zuvor Allowlist-Dateien aus dem Pairing-Speicher verwendet haben, kann `openclaw doctor --fix` Einträge in Allowlist-Flows in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem Besitzer bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration liegt (statt von früheren Pairing-Genehmigungen abzuhängen).

    Häufige Verwechslung: DM-Pairing-Genehmigung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Pairing gewährt DM-Zugriff. Wenn noch kein Befehlsbesitzer existiert, setzt das erste genehmigte Pairing auch `commands.ownerAllowFrom`, sodass nur für Besitzer vorgesehene Befehle und exec-Genehmigungen ein explizites Betreiberkonto haben.
    Gruppenabsender-Autorisierung kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten: „Ich bin einmal autorisiert und sowohl DMs als auch Gruppenbefehle funktionieren“, setzen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom`; stellen Sie für nur für Besitzer vorgesehene Befehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Senden Sie Ihrem Bot eine DM.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter-Methode (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    Zwei Steuerungen greifen gemeinsam:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: Jede Gruppe kann Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn nicht gesetzt, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Legen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Gruppenabsender-Authentifizierung übernimmt **keine** DM-Genehmigungen aus dem Pairing-Speicher.
    Pairing bleibt nur für DMs. Legen Sie für Gruppen `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Thema fest.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Pairing-Speicher.
    Praktisches Muster für Bots mit einem Besitzer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig ein fehlerschließendens `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht explizit gesetzt ist.

    Gruppeneinrichtung nur für Besitzer:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Testen Sie es aus der Gruppe mit `@<bot_username> ping`. Einfache Gruppennachrichten lösen den Bot nicht aus, solange `requireMention: true` gesetzt ist.

    Beispiel: Jedes Mitglied in einer bestimmten Gruppe erlauben:

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

    Beispiel: Nur bestimmte Benutzer innerhalb einer bestimmten Gruppe erlauben:

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

      - Legen Sie negative Telegram-Gruppen- oder Supergruppen-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie einschränken möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Eine Erwähnung kann kommen von:

    - nativer `@botusername`-Erwähnung, oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschaltungen auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungszustand. Verwenden Sie Konfiguration für Persistenz.

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

    Die Gruppen-Chat-ID abrufen:

    - eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiterleiten
    - oder `chat.id` aus `openclaw logs --follow` lesen
    - oder Bot API `getUpdates` prüfen
    - nachdem die Gruppe erlaubt wurde, führen Sie `/whoami@<bot_username>` aus, wenn native Befehle aktiviert sind

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram wird vom Gateway-Prozess verwaltet.
- Routing ist deterministisch: Eingehende Telegram-Nachrichten werden zurück an Telegram beantwortet (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanalumschlag normalisiert, mit Antwortmetadaten, Medienplatzhaltern und persistiertem Antwortkettenkontext für Telegram-Antworten, die der Gateway beobachtet hat.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forumthemen hängen `:topic:<threadId>` an, um Themen isoliert zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw bewahrt die Thread-ID für Antworten, belässt DMs aber standardmäßig in der flachen Sitzung. Konfigurieren Sie `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` oder eine passende Themenkonfiguration, wenn Sie DM-Themensitzungsisolation bewusst möchten.
- Long Polling verwendet den grammY-Runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Nebenläufigkeit verwendet `agents.defaults.maxConcurrent`.
- Long Polling wird innerhalb jedes Gateway-Prozesses geschützt, sodass jeweils nur ein aktiver Poller einen Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderer OpenClaw-Gateway, ein Skript oder ein externer Poller denselben Token.
- Long-Polling-Watchdog-Neustarts werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung während lang laufender Arbeiten weiterhin fälschliche Neustarts wegen Polling-Stalls sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` erlaubt; kontoabhängige Overrides werden unterstützt.
- Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Anforderung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` behält einen bearbeitbaren Statusentwurf für Tool-Fortschritt bei, löscht ihn nach Abschluss und sendet die endgültige Antwort als normale Nachricht
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Ausführungsdetails innerhalb dieser Tool-Fortschrittszeilen: `raw` (Standard, bewahrt das veröffentlichte Verhalten) oder `status` (nur Tool-Label)
    - veraltete Werte für `channels.telegram.streamMode` und boolesche `streaming`-Werte werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie zu `channels.telegram.streaming.mode` zu migrieren

    Tool-Fortschrittsaktualisierungen in der Vorschau sind die kurzen Statuszeilen, die angezeigt werden, während Tools laufen, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsaktualisierungen oder Patch-Zusammenfassungen. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` und später zu entsprechen. Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie:

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

    Um Tool-Fortschritt sichtbar zu halten, aber Befehls-/Ausführungstext auszublenden, setzen Sie:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Verwenden Sie den Modus `progress`, wenn Sie sichtbaren Tool-Fortschritt möchten, ohne die endgültige Antwort in dieselbe Nachricht zu bearbeiten. Legen Sie die Befehls-Text-Richtlinie unter `streaming.progress` ab:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich endgültige Zustellung wünschen: Telegram-Vorschauänderungen sind deaktiviert, und allgemeines Tool-/Fortschrittsrauschen wird unterdrückt, statt als eigenständige Statusmeldungen gesendet zu werden. Genehmigungsaufforderungen, Medien-Payloads und Fehler laufen weiterhin über die normale endgültige Zustellung. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschauänderungen beibehalten und gleichzeitig die Tool-Fortschrittsstatuszeilen ausblenden möchten.

    <Note>
      Ausgewählte Telegram-Zitatantworten sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die endgültige Antwort über Telegrams nativen Zitatantwortpfad, statt die Antwortvorschau zu bearbeiten. Daher kann `streaming.preview.toolProgress` die kurzen Statuszeilen für diesen Durchlauf nicht anzeigen. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten weiterhin Vorschau-Streaming bei. Setzen Sie `replyToMode: "off"`, wenn Sichtbarkeit des Tool-Fortschritts wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Kompromiss anzuerkennen.
    </Note>

    Für reine Textantworten:

    - kurze Vorschauen in DMs/Gruppen/Themen: OpenClaw behält dieselbe Vorschaunachricht bei und führt die abschließende Bearbeitung direkt darin aus
    - lange endgültige Textantworten, die in mehrere Telegram-Nachrichten aufgeteilt werden, verwenden die vorhandene Vorschau nach Möglichkeit als ersten endgültigen Abschnitt wieder und senden danach nur die verbleibenden Abschnitte
    - endgültige Antworten im Fortschrittsmodus löschen den Statusentwurf und verwenden normale endgültige Zustellung, statt den Entwurf in die Antwort zu bearbeiten
    - wenn die abschließende Bearbeitung fehlschlägt, bevor der fertige Text bestätigt ist, verwendet OpenClaw normale endgültige Zustellung und räumt die veraltete Vorschau auf

    Bei komplexen Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf normale endgültige Zustellung zurück und räumt anschließend die Vorschaunachricht auf.

    Vorschau-Streaming ist von Block-Streaming getrennt. Wenn Block-Streaming für Telegram ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Nur-Telegram-Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die Reasoning-Vorschau wird nach der endgültigen Zustellung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
    - die endgültige Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird in Telegram-sicheres HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parsing-Fehler zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Linkvorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` verarbeitet.

    Standardwerte für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Benutzerdefinierte Befehlsmenüeinträge hinzufügen:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Regeln:

    - Namen werden normalisiert (führendes `/` entfernen, Kleinschreibung)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren Verhalten nicht automatisch
    - Plugin-/Skill-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü auch nach dem Kürzen noch überfüllt war; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Fehler bei `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found`, während direkte Bot-API-curl-Befehle funktionieren, können bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur die Bot-API-Wurzel sein, und `openclaw doctor --fix` entfernt ein versehentliches abschließendes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, daher wird dies nicht als Webhook-Bereinigungsfehler gemeldet.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Befehle für Gerätekopplung (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` generiert Einrichtungscode
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. Anfrage genehmigen:
       - `/pair approve <requestId>` für ausdrückliche Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste

    Der Einrichtungscode trägt ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe belässt das Token des primären Node bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scope-Prüfungen sind rollenpräfixiert, daher erfüllt diese Operator-Allowlist nur Operator-Anfragen; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` vor der Genehmigung erneut aus.

    Weitere Details: [Pairing](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Buttons">
    Inline-Keyboard-Scope konfigurieren:

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

    Override pro Konto:

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

    Scopes:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Veraltetes `capabilities: ["inlineButtons"]` wird `inlineButtons: "all"` zugeordnet.

    Beispiel für eine Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
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

    Kanal-Nachrichtenaktionen stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-Steuerungen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Runtime-Sends verwenden den aktiven Config-/Secrets-Snapshot (Start/Reload), daher führen Aktionspfade keine Ad-hoc-Neuauflösung von SecretRef pro Send aus.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Tags für Antwort-Threads">
    Telegram unterstützt explizite Tags für Antwort-Threads in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Wenn Antwort-Threads aktiviert sind und der ursprüngliche Telegram-Text oder die ursprüngliche Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, daher werden längere Nachrichten vom Anfang an zitiert und fallen auf eine einfache Antwort zurück, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizite Antwort-Threads. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.

  </Accordion>

  <Accordion title="Forenthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Themen-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippen zielen auf den Themen-Thread
    - Themen-Config-Pfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall Allgemeines Thema (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur themenspezifisch und wird nicht von Gruppenstandards geerbt.

    **Agent-Routing pro Thema**: Jedes Thema kann durch Setzen von `agentId` in der Themen-Config an einen anderen Agent weiterleiten. Dadurch erhält jedes Thema seinen eigenen isolierten Workspace, Speicher und eine eigene Sitzung. Beispiel:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Jedes Thema hat dann seinen eigenen Sitzungsschlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Themenbindung**: Forumthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindungen auf oberster Ebene anheften (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forumthemen in Gruppen/Supergruppen beschränkt. Siehe [ACP-Agenten](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgebeiträge werden direkt dorthin geleitet. OpenClaw heftet die Spawn-Bestätigung im Thema an. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Der Vorlagenkontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten standardmäßig DM-Routing und Antwortmetadaten in flachen Sitzungen bei; threadfähige Sitzungsschlüssel werden nur verwendet, wenn sie mit `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` oder einer passenden Themenkonfiguration konfiguriert sind. Verwenden Sie `channels.telegram.dm.threadReplies` auf oberster Ebene für die Kontovorgabe oder `direct.<chatId>.threadReplies` für eine einzelne DM.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnachrichten von Audiodateien.

    - Standard: Audiodateiverhalten
    - Tag `[[audio_as_voice]]` in der Agentenantwort, um das Senden als Sprachnachricht zu erzwingen
    - Eingehende Transkripte von Sprachnachrichten werden im Agentenkontext als maschinell erzeugter,
      nicht vertrauenswürdiger Text gerahmt; die Erwähnungserkennung verwendet weiterhin das rohe
      Transkript, damit erwähnungsgesteuerte Sprachnachrichten weiter funktionieren.

    Beispiel für eine Nachrichtenaktion:

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

    Telegram unterscheidet Videodateien von Videonachrichten.

    Beispiel für eine Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Videonachrichten unterstützen keine Beschriftungen; bereitgestellter Nachrichtentext wird separat gesendet.

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

    Zwischengespeicherte Sticker suchen:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Telegram-Reaktionen kommen als `message_reaction`-Updates an (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, stellt OpenClaw Systemereignisse wie dieses in die Warteschlange:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best-Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktions-Updates keine Thread-IDs bereit.
      - Nicht-Forumgruppen werden zur Gruppenchat-Sitzung geleitet
      - Forumgruppen werden zur Sitzung des allgemeinen Themas der Gruppe (`:topic:1`) geleitet, nicht zum genauen Ursprungsthema

    `allowed_updates` für Polling/Webhook enthält automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, andernfalls "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge für die Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

    Durch Telegram ausgelöste Schreibvorgänge umfassen:

    - Gruppenmigrationereignisse (`migrate_to_chat_id`) zum Aktualisieren von `channels.telegram.groups`
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

    Im Long-Polling-Modus persistiert OpenClaw seine Neustart-Watermark erst, nachdem ein Update erfolgreich ausgeliefert wurde. Wenn ein Handler fehlschlägt, bleibt dieses Update im selben Prozess wiederholbar und wird für die Neustart-Deduplizierung nicht als abgeschlossen geschrieben.

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress schalten Sie entweder einen Reverse-Proxy vor den lokalen Port oder setzen `webhookHost: "0.0.0.0"` bewusst.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update anschließend asynchron über dieselben Bot-Lanes pro Chat/pro Thema, die auch Long Polling verwendet, sodass langsame Agenten-Turns das Zustellungs-ACK von Telegram nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholung und CLI-Ziele">
    - Der Standardwert für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor Längenteilung.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standard 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht ausliefert. Erhöhen Sie den Wert, wenn Albenteile spät eintreffen; senken Sie ihn, um die Antwortlatenz für Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb des 60-Sekunden-Request-Guards für ausgehenden Text/Typing, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor OpenClaws Transport-Guard und Fallback ausgeführt werden können. Long Polling verwendet weiterhin einen 45-Sekunden-Request-Guard für `getUpdates`, damit inaktive Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert nur bei falsch-positiven Neustarts wegen Polling-Stalls zwischen `30000` und `600000` an.
    - Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Ergänzender Kontext für Antworten/Zitate/Weiterleitungen wird in ein ausgewähltes Gesprächskontextfenster normalisiert, wenn das Gateway die übergeordneten Nachrichten beobachtet hat; der Cache beobachteter Nachrichten wird neben dem Sitzungsspeicher persistiert. Telegram enthält in Updates nur ein flaches `reply_to_message`, daher sind Ketten, die älter als der Cache sind, auf Telegrams aktuellen Update-Payload begrenzt.
    - Telegram-Allowlists steuern primär, wer den Agenten auslösen kann, und sind keine vollständige Grenze zur Schwärzung ergänzenden Kontexts.
    - DM-Verlaufssteuerungen:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung abschließender eingehender Antworten verwendet ebenfalls eine begrenzte Safe-Send-Wiederholung für Telegram-Fehler vor der Verbindung, wiederholt aber keine mehrdeutigen Netzwerkumschläge nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    Sendeziele der CLI und des Nachrichten-Tools können numerische Chat-ID, Benutzername oder ein Forumthemenziel sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram-Polls verwenden `openclaw message poll` und unterstützen Forumthemen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur-Telegram-Poll-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forumthemen (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Send unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Keyboards, wenn `channels.telegram.capabilities.inlineButtons` dies erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder, GIFs und Videos als Dokumente statt als komprimierte Foto-, animierte Medien- oder Video-Uploads zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Polls
    - `channels.telegram.actions.poll=false` deaktiviert das Erstellen von Telegram-Polls, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Genehmiger-DMs und kann Prompts optional im ursprünglichen Chat oder Thema posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (aktiviert sich automatisch, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Besitzer-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Genehmiger. Die erste genehmigte DM-Kopplung initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehlsbesitzer existiert, sodass die Einrichtung mit einem Besitzer weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Die Kanalzustellung zeigt den Befehlstext im Chat an; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn der Prompt in einem Forumthema landet, behält OpenClaw das Thema für den Genehmigungs-Prompt und die Folgeaktion bei. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) erlaubt. Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Fehlerantwort-Steuerung

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler stößt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                       |
| ----------------------------------- | ----------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehlerspam während Ausfällen.   |

Überschreibungen pro Konto, pro Gruppe und pro Thema werden unterstützt (dieselbe Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

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
  <Accordion title="Bot reagiert nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false` ist, muss der Telegram-Privatsphärenmodus vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - Entfernen Sie den Bot danach aus der Gruppe und fügen Sie ihn erneut hinzu.
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; die Platzhalterangabe `"*"` kann nicht per Mitgliedschaftsprüfung geprüft werden.
    - Schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten).
    - Prüfen Sie die Bot-Mitgliedschaft in der Gruppe.
    - Prüfen Sie die Protokolle mit `openclaw logs --follow` auf Gründe für das Überspringen.

  </Accordion>

  <Accordion title="Befehle funktionieren nur teilweise oder gar nicht">

    - Autorisieren Sie Ihre Senderidentität (Pairing und/oder numerisches `allowFrom`).
    - Die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist.
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs.
    - `deleteMyCommands`- / `setMyCommands`-Startaufrufe und `sendChatAction`-Tippaufrufe sind begrenzt und werden bei Anfrage-Timeout einmal über Telegrams Transport-Fallback wiederholt. Dauerhafte Netzwerk-/Fetch-Fehler deuten in der Regel auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin.

  </Accordion>

  <Accordion title="Start meldet nicht autorisierten Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für den konfigurierten Bot-Token.
    - Kopieren oder regenerieren Sie den Bot-Token in BotFather erneut und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; ihn als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler durch einen ungültigen Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ und benutzerdefinierter Fetch/Proxy können sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; fehlerhafter IPv6-Ausgang kann zeitweilige Telegram-API-Fehler verursachen.
    - Wenn Protokolle `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese jetzt als behebbare Netzwerkfehler.
    - Während des Polling-Starts verwendet OpenClaw die erfolgreiche Startprüfung `getMe` für grammY wieder, damit der Runner vor dem ersten `getUpdates` kein zweites `getMe` benötigt.
    - Wenn `deleteWebhook` während des Polling-Starts mit einem vorübergehenden Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Control-Plane-Aufruf vor dem Polling auszuführen. Ein noch aktiver Webhook erscheint als `getUpdates`-Konflikt; OpenClaw baut dann den Telegram-Transport neu auf und wiederholt die Webhook-Bereinigung.
    - Wenn Telegram-Sockets in einem kurzen festen Takt recycelt werden, prüfen Sie auf einen niedrigen Wert für `channels.telegram.timeoutSeconds`; Bot-Clients begrenzen konfigurierte Werte unterhalb der ausgehenden Anfrage- und `getUpdates`-Schutzwerte, aber ältere Versionen konnten jeden Polling- oder Antwortvorgang abbrechen, wenn dies unterhalb dieser Schutzwerte gesetzt war.
    - Wenn Protokolle `Polling stall detected` enthalten, startet OpenClaw standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Liveness das Polling neu und baut den Telegram-Transport neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Startfrist kein `getUpdates` abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Startfrist kein `setWebhook` abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe fehlerfrei sind, Ihr Host aber weiterhin falsche Polling-Stall-Neustarts meldet. Dauerhafte Stalls deuten in der Regel auf Proxy-, DNS-, IPv6- oder TLS-Ausgangsprobleme zwischen Host und `api.telegram.org` hin.
    - Telegram berücksichtigt außerdem Prozess-Proxy-Umgebungsvariablen für den Bot-API-Transport, einschließlich `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` sowie deren kleingeschriebene Varianten. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy über `OPENCLAW_PROXY_URL` für eine Dienstumgebung konfiguriert ist und keine Standard-Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie auf VPS-Hosts mit instabilem direktem Ausgang/TLS Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2). Die Telegram-DNS-Ergebnisreihenfolge berücksichtigt zuerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder`, dann den Prozessstandard wie `NODE_OPTIONS=--dns-result-order=ipv4first`; wenn nichts davon greift, fällt Node 22+ auf `ipv4first` zurück.
    - Wenn Ihr Host WSL2 ist oder explizit besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmarkbereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere private/interne/Special-Use-Adresse umschreibt, können Sie den nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Aktivierung ist pro Konto unter `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts zu `198.18.x.x` auflöst, lassen Sie das gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-Benchmarkbereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt Telegram-Medien-SSRF-Schutzmaßnahmen. Verwenden Sie es nur für vertrauenswürdige, betreibergesteuerte Proxy-Umgebungen wie Clash-, Mihomo- oder Surge-Fake-IP-Routing, wenn diese private oder Special-Use-Antworten außerhalb des RFC-2544-Benchmarkbereichs erzeugen. Lassen Sie es für normalen öffentlichen Internetzugriff auf Telegram deaktiviert.
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

Weitere Hilfe: [Kanal-Fehlerbehebung](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Aussagekräftige Telegram-Felder">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threads/Antworten: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Benutzerdefinierter API-Root: `apiRoot` (nur Bot-API-Root; `/bot<TOKEN>` nicht einschließen)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standardrouting explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine `accounts.default.*`-Werte.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppen- und Themen-Allowlist.
  </Card>
  <Card title="Kanalrouting" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Gruppen und Themen Agenten zuordnen.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose.
  </Card>
</CardGroup>
