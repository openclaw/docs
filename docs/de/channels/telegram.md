---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Fähigkeiten und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:15:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsreif für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Kopplung.
  </Card>
  <Card title="Channel-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Channel-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (bestätigen Sie, dass der Handle genau `@BotFather` lautet).

    Führen Sie `/newbot` aus, folgen Sie den Eingabeaufforderungen und speichern Sie das Token.

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in der Konfiguration/Env und starten Sie dann den Gateway.

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
    Fügen Sie den Bot zu Ihrer Gruppe hinzu und ermitteln Sie dann beide IDs, die der Gruppenzugriff benötigt:

    - Ihre Telegram-Benutzer-ID, verwendet in `allowFrom` / `groupAllowFrom`
    - die Telegram-Gruppen-Chat-ID, verwendet als Schlüssel unter `channels.telegram.groups`

    Für die erstmalige Einrichtung erhalten Sie die Gruppen-Chat-ID über `openclaw logs --follow`, einen Bot für weitergeleitete IDs oder Bot API `getUpdates`. Nachdem die Gruppe erlaubt wurde, kann `/whoami@<bot_username>` die Benutzer- und Gruppen-IDs bestätigen.

    Negative Telegram-Supergruppen-IDs, die mit `-100` beginnen, sind Gruppen-Chat-IDs. Legen Sie sie unter `channels.telegram.groups` ab, nicht unter `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
Nach einem erfolgreichen Start speichert OpenClaw die Bot-Identität bis zu 24 Stunden im State-Verzeichnis zwischen, sodass Neustarts einen zusätzlichen Telegram-`getMe`-Aufruf vermeiden können; das Ändern oder Entfernen des Tokens leert diesen Cache.
</Note>

## Einstellungen auf Telegram-Seite

<AccordionGroup>
  <Accordion title="Privacy Mode und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privacy Mode**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, entweder:

    - deaktivieren Sie den Privacy Mode über `/setprivacy`, oder
    - machen Sie den Bot zum Gruppenadmin.

    Wenn Sie den Privacy Mode umschalten, entfernen Sie den Bot in jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Admin-Status wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für dauerhaft aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Umschalter">

    - `/setjoingroups`, um das Hinzufügen zu Gruppen zu erlauben/zu verweigern
    - `/setprivacy` für das Verhalten der Gruppensichtbarkeit

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

### Gruppen-Bot-Identität

In Telegram-Gruppen und Forumsthemen wird eine ausdrückliche Erwähnung des konfigurierten Bot-Handles (zum Beispiel `@my_bot`) als Adressierung des ausgewählten OpenClaw-Agenten behandelt, auch wenn sich der Persona-Name des Agenten vom Telegram-Benutzernamen unterscheidet. Die Gruppen-Stummschaltungsrichtlinie gilt weiterhin für nicht zugehörigen Gruppenverkehr, aber der Bot-Handle selbst gilt nicht als „jemand anderes“.

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Sender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` ermöglicht jedem Telegram-Konto, das den Bot-Benutzernamen findet oder errät, dem Bot Befehle zu geben. Verwenden Sie dies nur für bewusst öffentliche Bots mit streng eingeschränkten Tools; Bots mit einem einzigen Besitzer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Mehrkonto-Konfigurationen wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: Kontobezogene `allowFrom: ["*"]`-Einträge machen dieses Konto nicht öffentlich, sofern die effektive Konto-Allowlist nach dem Zusammenführen nicht weiterhin einen ausdrücklichen Platzhalter enthält.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (nach bestem Bemühen; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Allowlist-Dateien aus dem Kopplungsspeicher verlassen haben, kann `openclaw doctor --fix` Einträge in Allowlist-Flows in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel wenn `dmPolicy: "allowlist"` noch keine ausdrücklichen IDs hat).

    Für Bots mit einem einzigen Besitzer bevorzugen Sie `dmPolicy: "allowlist"` mit ausdrücklichen numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration liegt (statt von früheren Kopplungsgenehmigungen abzuhängen).

    Häufiges Missverständnis: Die Genehmigung der DM-Kopplung bedeutet nicht „dieser Sender ist überall autorisiert“.
    Kopplung gewährt DM-Zugriff. Wenn noch kein Befehlsbesitzer existiert, setzt die erste genehmigte Kopplung auch `commands.ownerAllowFrom`, sodass nur für Besitzer bestimmte Befehle und Exec-Genehmigungen ein ausdrückliches Betreiberkonto haben.
    Die Autorisierung von Gruppensendern stammt weiterhin aus ausdrücklichen Konfigurations-Allowlists.
    Wenn Sie möchten: „Ich bin einmal autorisiert und sowohl DMs als auch Gruppenbefehle funktionieren“, legen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ab; stellen Sie für nur für Besitzer bestimmte Befehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

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

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen gelten gemeinsam:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: jede Gruppe kann Gruppen-ID-Prüfungen passieren
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: wirkt als Allowlist (ausdrückliche IDs oder `"*"`)

    2. **Welche Sender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Gruppensender-Filterung verwendet. Wenn nicht gesetzt, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Legen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Senderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Gruppensender-Auth erbt **keine** Genehmigungen aus dem DM-Kopplungsspeicher.
    Kopplung bleibt nur für DMs. Legen Sie für Gruppen `groupAllowFrom` oder gruppen-/themenspezifisches `allowFrom` fest.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Kopplungsspeicher.
    Praktisches Muster für Bots mit einem einzigen Besitzer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig das Fail-Closed-Verhalten `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht ausdrücklich gesetzt ist.

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

    Testen Sie es aus der Gruppe mit `@<bot_username> ping`. Einfache Gruppennachrichten lösen den Bot nicht aus, solange `requireMention: true` gilt.

    Beispiel: Beliebiges Mitglied in einer bestimmten Gruppe erlauben:

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

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnung kann stammen von:

    - nativer `@botusername`-Erwähnung, oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschalter auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungszustand. Verwenden Sie die Konfiguration für Persistenz.

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

    Der Kontext des Gruppenverlaufs verwendet standardmäßig `mention-only`: Frühere Gruppennachrichten werden
    nur einbezogen, wenn sie an den Bot adressiert waren, Antworten an den Bot sind
    oder eigene Nachrichten des Bots sind. Setzen Sie `includeGroupHistoryContext: "recent"`, um
    den jüngsten Raumverlauf für vertrauenswürdige Gruppen einzubeziehen. Setzen Sie
    `includeGroupHistoryContext: "none"`, um beim nächsten Turn keinen früheren Telegram-Gruppenverlauf
    zu senden.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Gruppen-Chat-ID erhalten:

    - leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie Bot API `getUpdates`
    - nachdem die Gruppe erlaubt wurde, führen Sie `/whoami@<bot_username>` aus, wenn native Befehle aktiviert sind

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört dem Gateway-Prozess.
- Das Routing ist deterministisch: Eingehende Telegram-Antworten gehen zurück an Telegram (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanal-Umschlag mit Antwortmetadaten, Medienplatzhaltern und persistiertem Antwortketten-Kontext für Telegram-Antworten normalisiert, die das Gateway beobachtet hat.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forumsthemen hängen `:topic:<threadId>` an, damit Themen isoliert bleiben.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw bewahrt sie für Antworten auf. DM-Themensitzungen werden nur aufgeteilt, wenn Telegram `getMe` für den Bot mit `has_topics_enabled: true` meldet; andernfalls bleiben DMs in der flachen Sitzung.
- Long Polling verwendet den grammY Runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Nebenläufigkeit verwendet `agents.defaults.maxConcurrent`.
- Der Start mit mehreren Konten begrenzt gleichzeitige Telegram-`getMe`-Abfragen, damit große Bot-Flotten nicht alle Kontoabfragen gleichzeitig ausfächern.
- Long Polling wird innerhalb jedes Gateway-Prozesses geschützt, sodass immer nur ein aktiver Poller ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderes OpenClaw-Gateway, Skript oder externer Poller dasselbe Token.
- Neustarts durch den Long-Polling-Watchdog werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung während lang laufender Arbeit weiterhin fälschliche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` zulässig; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

<Note>
  `channels.telegram.dm.threadReplies` und `channels.telegram.direct.<chatId>.threadReplies` wurden entfernt. Führen Sie nach dem Upgrade `openclaw doctor --fix` aus, wenn Ihre Konfiguration diese Schlüssel noch enthält. Das DM-Themen-Routing folgt jetzt der Bot-Fähigkeit aus Telegram `getMe.has_topics_enabled`, die durch den BotFather-Thread-Modus gesteuert wird: Bots mit aktivierten Themen verwenden threadbezogene DM-Sitzungen, wenn Telegram `message_thread_id` sendet; andere DMs bleiben in der flachen Sitzung.
</Note>

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Anforderung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - kurze Vorschauen der ersten Antwort werden entprellt und dann nach einer begrenzten Verzögerung materialisiert, wenn der Lauf noch aktiv ist
    - `progress` behält einen bearbeitbaren Statusentwurf für Tool-Fortschritt bei, zeigt die stabile Statusbezeichnung an, wenn Antwortaktivität vor Tool-Fortschritt eintrifft, löscht ihn beim Abschluss und sendet die finale Antwort als normale Nachricht
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Exec-Details in diesen Tool-Fortschrittszeilen: `raw` (Standard, behält veröffentlichtes Verhalten bei) oder `status` (nur Tool-Bezeichnung)
    - `streaming.progress.commentary` (Standard: `false`) aktiviert Assistentenkommentar-/Präambeltext im temporären Fortschrittsentwurf
    - veraltete `channels.telegram.streamMode`, boolesche `streaming`-Werte und ausgemusterte native Entwurfsvorschau-Schlüssel werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie zur aktuellen Streaming-Konfiguration zu migrieren

    Tool-Fortschrittsvorschau-Aktualisierungen sind die kurzen Statuszeilen, die während der Ausführung von Tools angezeigt werden, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsaktualisierungen, Patch-Zusammenfassungen oder Codex-Präambel-/Kommentartext im Codex-App-Server-Modus. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` zu entsprechen.

    Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, legen Sie Folgendes fest:

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

    Um Tool-Fortschritt sichtbar zu lassen, aber Befehls-/Exec-Text auszublenden, legen Sie Folgendes fest:

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

    Verwenden Sie den Modus `progress`, wenn Sie sichtbaren Tool-Fortschritt möchten, ohne die finale Antwort in dieselbe Nachricht hineinzubearbeiten. Legen Sie die Befehls-Text-Richtlinie unter `streaming.progress` ab:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich finale Zustellung möchten: Telegram-Vorschaubearbeitungen sind deaktiviert, und generisches Tool-/Fortschrittsrauschen wird unterdrückt, statt als eigenständige Statusnachrichten gesendet zu werden. Genehmigungsaufforderungen, Medien-Payloads und Fehler werden weiterhin über die normale finale Zustellung geroutet. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschau-Bearbeitungen beibehalten und die Tool-Fortschrittsstatuszeilen ausblenden möchten.

    <Note>
      Ausgewählte Zitatantworten in Telegram sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die finale Antwort über Telegrams nativen Zitatantwort-Pfad, statt die Antwortvorschau zu bearbeiten. Daher kann `streaming.preview.toolProgress` die kurzen Statuszeilen für diesen Turn nicht anzeigen. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten weiterhin Vorschau-Streaming bei. Setzen Sie `replyToMode: "off"`, wenn die Sichtbarkeit von Tool-Fortschritt wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Kompromiss zu akzeptieren.
    </Note>

    Für reine Textantworten:

    - kurze DM-/Gruppen-/Themenvorschauen: OpenClaw behält dieselbe Vorschaunachricht bei und führt die finale Bearbeitung direkt darin aus
    - lange finale Texte, die in mehrere Telegram-Nachrichten aufgeteilt werden, verwenden die vorhandene Vorschau nach Möglichkeit als ersten finalen Abschnitt wieder und senden danach nur die verbleibenden Abschnitte
    - Finale Antworten im Fortschrittsmodus löschen den Statusentwurf und verwenden normale finale Zustellung, statt den Entwurf in die Antwort hineinzubearbeiten
    - wenn die finale Bearbeitung fehlschlägt, bevor der abgeschlossene Text bestätigt ist, verwendet OpenClaw normale finale Zustellung und räumt die veraltete Vorschau auf

    Bei komplexen Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf normale finale Zustellung zurück und räumt anschließend die Vorschaunachricht auf.

    Vorschau-Streaming ist von Block-Streaming getrennt. Wenn Block-Streaming für Telegram ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Verhalten des Reasoning-Streams:

    - `/reasoning stream` verwendet den Reasoning-Vorschaupfad eines unterstützten Kanals; in Telegram streamt es Reasoning während der Generierung in die Live-Vorschau
    - die Reasoning-Vorschau wird nach der finalen Zustellung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
    - die finale Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Rich-Message-Formatierung">
    Ausgehender Text verwendet standardmäßig normale Telegram-HTML-Nachrichten, damit Antworten in aktuellen Telegram-Clients lesbar bleiben. Dieser Kompatibilitätsmodus unterstützt normales Fett, Kursiv, Links, Code, Spoiler und Zitate, aber keine Rich-only-Blöcke der Bot API 10.1 wie native Tabellen, Details, Rich Media und Formeln.

    Setzen Sie `channels.telegram.richMessages: true`, um Rich Messages der Bot API 10.1 zu aktivieren:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Wenn aktiviert:

    - Dem Agenten wird mitgeteilt, dass Telegram Rich Messages für diesen Bot/dieses Konto verfügbar sind.
    - Markdown-Text wird über OpenClaws Markdown-IR gerendert und als Telegram Rich HTML gesendet.
    - Explizite Rich-HTML-Payloads bewahren unterstützte Bot-API-10.1-Tags wie Überschriften, Tabellen, Details, Rich Media und Formeln.
    - Medienunterschriften verwenden weiterhin Telegram-HTML-Unterschriften, da Rich Messages Unterschriften nicht ersetzen.

    Dadurch bleibt Modelltext von Telegram Rich Markdown-Sigillen fern, sodass Währungen wie `$400-600K` nicht als Mathematik geparst werden. Langer Rich Text wird automatisch über Telegrams Rich-Text- und Rich-Block-Grenzen hinweg aufgeteilt. Tabellen über Telegrams Spaltenlimit werden als Codeblöcke gesendet.

    Standard: aus Gründen der Client-Kompatibilität deaktiviert. Rich Messages erfordern kompatible Telegram-Clients; einige aktuelle Desktop-, Web-, Android- und Drittanbieter-Clients zeigen akzeptierte Rich Messages als nicht unterstützt an. Lassen Sie diese Option deaktiviert, sofern nicht jeder mit dem Bot verwendete Client sie rendern kann. `/status` zeigt an, ob Rich Messages für die aktuelle Telegram-Sitzung ein- oder ausgeschaltet sind.

    Link-Vorschauen sind standardmäßig aktiviert. `channels.telegram.linkPreview: false` überspringt die automatische Entitätserkennung für Rich Text.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` gehandhabt.

    Native Befehlsstandards:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Fügen Sie benutzerdefinierte Befehlsmenüeinträge hinzu:

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

    - Namen werden normalisiert (führendes `/` entfernen, Kleinbuchstaben)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skills-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie im Telegram-Menü nicht angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen weiterhin überläuft; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlägt, während direkte Bot-API-curl-Befehle funktionieren, kann das bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur der Bot-API-Root sein, und `openclaw doctor --fix` entfernt ein versehentliches nachgestelltes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, sodass dies nicht als Webhook-Bereinigungsfehler gemeldet wird.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Befehle zur Gerätekopplung (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` erzeugt Einrichtungscode
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. Anfrage genehmigen:
       - `/pair approve <requestId>` für ausdrückliche Genehmigung
       - `/pair approve`, wenn nur eine Anfrage aussteht
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Das integrierte Einrichtungscode-Bootstrap ist nur für Nodes: Die erste Verbindung erstellt eine ausstehende Node-Anfrage, und nach der Genehmigung gibt das Gateway ein dauerhaftes Node-Token mit `scopes: []` zurück. Es gibt kein übergebenes Operator-Token zurück; Operatorzugriff erfordert eine separate genehmigte Operator-Kopplung oder einen separaten Token-Flow.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt, und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` erneut aus, bevor Sie genehmigen.

    Weitere Details: [Kopplung](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Buttons">
    Inline-Tastaturumfang konfigurieren:

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

    Umfänge:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Das Legacy-Format `capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

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

    Beispiel für einen Mini-App-Button:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Telegram-Buttons vom Typ `web_app` funktionieren nur in privaten Chats zwischen einem Benutzer und dem
    Bot.

    Callback-Klicks, die nicht von einem registrierten interaktiven Handler eines Plugins
    beansprucht werden, werden als Text an den Agenten übergeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` oder `caption`, optional `presentation` Inline-Buttons; reine Button-Bearbeitungen aktualisieren das Reply-Markup)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Steuerungen für das Gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten Schalter unter `channels.telegram.actions.*`.
    Runtime-Sendevorgänge verwenden den aktiven Config-/Secrets-Snapshot (Start/Reload), sodass Aktionspfade keine Ad-hoc-Neuauflösung von SecretRef pro Sendevorgang durchführen.

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

    Wenn Antwort-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die ursprüngliche Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, daher werden längere Nachrichten vom Anfang an zitiert und fallen auf eine einfache Antwort zurück, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite Tags `[[reply_to_*]]` werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forumthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Themen-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippanzeigen zielen auf den Themen-Thread
    - Config-Pfad für Themen:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall Allgemeines Thema (`threadId=1`):

    - Nachrichtenversand lässt `message_thread_id` aus (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist themenspezifisch und wird nicht von Gruppenstandards geerbt.
    `topics."*"` legt Standardwerte für jedes Thema in dieser Gruppe fest; exakte Themen-IDs haben weiterhin Vorrang vor `"*"`.

    **Agent-Routing pro Thema**: Jedes Thema kann durch Setzen von `agentId` in der Themen-Config an einen anderen Agenten geroutet werden. Dadurch erhält jedes Thema seinen eigenen isolierten Arbeitsbereich, Speicher und seine eigene Sitzung. Beispiel:

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

    **Persistente ACP-Themenbindung**: Forumthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindings auf oberster Ebene anheften (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forumthemen in Gruppen/Supergruppen beschränkt. Siehe [ACP-Agenten](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgeinteraktionen werden direkt dorthin geroutet. OpenClaw heftet die Spawn-Bestätigung im Thema an. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten Antwortmetadaten; sie verwenden thread-fähige Sitzungsschlüssel nur, wenn Telegram `getMe` für den Bot `has_topics_enabled: true` meldet.
    Die früheren Überschreibungen `dm.threadReplies` und `direct.*.threadReplies` wurden absichtlich entfernt; verwenden Sie den Thread-Modus von BotFather als einzige Quelle der Wahrheit und führen Sie `openclaw doctor --fix` aus, um veraltete Config-Schlüssel zu entfernen.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnachrichten von Audiodateien.

    - Standard: Verhalten wie Audiodatei
    - Tag `[[audio_as_voice]]` in der Agentenantwort, um das Senden als Sprachnachricht zu erzwingen
    - eingehende Transkripte von Sprachnachrichten werden im Agentenkontext als maschinell generierter,
      nicht vertrauenswürdiger Text gerahmt; die Erwähnungserkennung verwendet weiterhin das rohe
      Transkript, sodass erwähnungsgesteuerte Sprachnachrichten weiterhin funktionieren.

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

    Sticker-Beschreibungen werden im OpenClaw SQLite Plugin-Zustand zwischengespeichert, um wiederholte Vision-Aufrufe zu reduzieren.

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

    Wenn aktiviert, stellt OpenClaw Systemereignisse wie diese in die Warteschlange:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktionsupdates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden an die Gruppenchat-Sitzung geleitet
      - Forum-Gruppen werden an die allgemeine Topic-Sitzung der Gruppe (`:topic:1`) geleitet, nicht an das genaue ursprüngliche Topic

    `allowed_updates` für Polling/Webhook enthält `message_reaction` automatisch.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet. `ackReactionScope` entscheidet, *wann* dieses Emoji tatsächlich gesendet wird.

    **Auflösungsreihenfolge für Emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Emoji der Agentenidentität (`agents.list[].identity.emoji`, andernfalls "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

    **Scope (`messages.ackReactionScope`):**

    Der Telegram-Provider liest den Scope aus `messages.ackReactionScope` (Standard `"group-mentions"`). Derzeit gibt es keine Überschreibung auf Telegram-Konto- oder Telegram-Kanalebene.

    Werte: `"all"` (DMs + Gruppen), `"direct"` (nur DMs), `"group-all"` (jede Gruppennachricht, keine DMs), `"group-mentions"` (Gruppen, wenn der Bot erwähnt wird; **keine DMs** — dies ist der Standard), `"off"` / `"none"` (deaktiviert).

    <Note>
    Der Standard-Scope (`"group-mentions"`) löst in Direktnachrichten keine Ack-Reaktionen aus. Um eine Ack-Reaktion auf eingehende Telegram-DMs zu erhalten, setzen Sie `messages.ackReactionScope` auf `"direct"` oder `"all"`. Der Wert wird beim Start des Telegram-Providers gelesen, daher ist ein Gateway-Neustart erforderlich, damit die Änderung wirksam wird.
    </Note>

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge für die Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

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

    Im Long-Polling-Modus persistiert OpenClaw sein Neustart-Watermark erst, nachdem ein Update erfolgreich weitergeleitet wurde. Wenn ein Handler fehlschlägt, bleibt dieses Update im selben Prozess erneut versuchbar und wird für die Deduplizierung beim Neustart nicht als abgeschlossen geschrieben.

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress schalten Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen `webhookHost: "0.0.0.0"` bewusst.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update anschließend asynchron über dieselben Bot-Lanes pro Chat/pro Topic, die auch Long Polling verwendet, sodass langsame Agentendurchläufe Telegrams Zustellungs-ACK nicht blockieren.

  </Accordion>

  <Accordion title="Grenzwerte, Wiederholungen und CLI-Ziele">
    - Der Standardwert für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen), bevor nach Länge aufgeteilt wird.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standard 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht weiterleitet. Erhöhen Sie den Wert, wenn Albumbestandteile spät eintreffen; verringern Sie ihn, um die Antwortlatenz für Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (falls nicht gesetzt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb der 60-Sekunden-Schutzgrenze für ausgehende Text-/Typing-Anfragen, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor der Transport-Schutzmechanismus und Fallback von OpenClaw ausgeführt werden können. Long Polling verwendet weiterhin eine 45-Sekunden-Schutzgrenze für `getUpdates`-Anfragen, damit inaktive Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert zwischen `30000` und `600000` nur bei falsch-positiven Neustarts wegen blockiertem Polling an.
    - Der Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Zusatzkontext aus Antworten/Zitaten/Weiterleitungen wird in ein ausgewähltes Kontextfenster der Unterhaltung normalisiert, wenn der Gateway die übergeordneten Nachrichten beobachtet hat; der Cache für beobachtete Nachrichten liegt im OpenClaw-SQLite-Plugin-Zustand, und `openclaw doctor --fix` importiert ältere Sidecar-Dateien. Telegram enthält in Updates nur ein flaches `reply_to_message`, daher sind Ketten, die älter als der Cache sind, auf Telegrams aktuelle Update-Nutzlast beschränkt.
    - Telegram-Zulassungslisten steuern hauptsächlich, wer den Agenten auslösen kann, und sind keine vollständige Schwelle für die Schwärzung von Zusatzkontext.
    - Steuerelemente für den DM-Verlauf:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung finaler eingehender Antworten verwendet ebenfalls einen begrenzten Safe-Send-Wiederholungsversuch für Telegram-Fehler vor dem Verbindungsaufbau, wiederholt aber keine mehrdeutigen Netzwerkhüllen nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    CLI- und Nachrichten-Tool-Sendeziele können eine numerische Chat-ID, ein Benutzername oder ein Forum-Themenziel sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram-Polls verwenden `openclaw message poll` und unterstützen Forum-Themen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur für Telegram gültige Poll-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forum-Themen (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder, GIFs und Videos als Dokumente statt als komprimierte Foto-, animierte Medien- oder Video-Uploads zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten einschließlich Polls
    - `channels.telegram.actions.poll=false` deaktiviert das Erstellen von Telegram-Polls, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Genehmiger-DMs und kann Prompts optional im ursprünglichen Chat oder Thema posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (aktiviert sich automatisch, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Owner-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Genehmiger. Die erste genehmigte DM-Kopplung initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehls-Owner vorhanden ist, sodass die Einrichtung mit einem Owner weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Kanalzustellung zeigt den Befehlstext im Chat an; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn der Prompt in einem Forum-Thema landet, bewahrt OpenClaw das Thema für den Genehmigungs-Prompt und die Folgeantwort. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsbuttons erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) erlaubt. Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerelemente für Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler stößt, steuert die Fehlerrichtlinie, ob Fehlermeldungen an den Telegram-Chat gesendet werden:

| Schlüssel                           | Werte                      | Standard        | Beschreibung                                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — jede Fehlermeldung an den Chat senden. `once` — jede eindeutige Fehlermeldung einmal pro Cooldown-Fenster senden (wiederholte identische Fehler unterdrücken). `silent` — niemals Fehlermeldungen an den Chat senden. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)                  | `14400000` (4h) | Cooldown-Fenster für die `once`-Richtlinie. Nachdem ein Fehler gesendet wurde, wird dieselbe Fehlermeldung unterdrückt, bis dieses Intervall abgelaufen ist. Verhindert Fehler-Spam während Ausfällen.                         |

Überschreibungen pro Konto, pro Gruppe und pro Thema werden unterstützt (dieselbe Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bot reagiert nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false`, muss der Telegram-Datenschutzmodus vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - Entfernen Sie dann den Bot aus der Gruppe und fügen Sie ihn erneut hinzu.
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; die Wildcard `"*"` kann nicht auf Mitgliedschaft geprüft werden.
    - Schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgelistet sein (oder `"*"` enthalten).
    - Prüfen Sie die Bot-Mitgliedschaft in der Gruppe.
    - Prüfen Sie Protokolle: `openclaw logs --follow` für Gründe zum Überspringen.

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - Autorisieren Sie Ihre Senderidentität (Kopplung und/oder numerisches `allowFrom`).
    - Die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist.
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs.
    - `deleteMyCommands`- / `setMyCommands`-Startaufrufe und `sendChatAction`-Typing-Aufrufe sind begrenzt und werden bei Anfrage-Timeout einmal über Telegrams Transport-Fallback wiederholt. Anhaltende Netzwerk-/Fetch-Fehler deuten normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin.

  </Accordion>

  <Accordion title="Start meldet nicht autorisierten Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für den konfigurierten Bot-Token.
    - Kopieren oder regenerieren Sie den Bot-Token in BotFather erneut und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; ihn als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler durch einen ungültigen Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ und benutzerdefiniertes Fetch/Proxy können sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; defekter IPv6-Egress kann sporadische Telegram-API-Fehler verursachen.
    - Wenn Protokolle `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese nun als behebbare Netzwerkfehler.
    - Während des Polling-Starts verwendet OpenClaw den erfolgreichen Start-`getMe`-Probe für grammY wieder, sodass der Runner vor dem ersten `getUpdates` kein zweites `getMe` benötigt.
    - Wenn `deleteWebhook` während des Polling-Starts mit einem vorübergehenden Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Kontrollflächenaufruf vor dem Polling auszuführen. Ein weiterhin aktiver Webhook erscheint als `getUpdates`-Konflikt; OpenClaw baut dann den Telegram-Transport neu auf und wiederholt die Webhook-Bereinigung.
    - Wenn Telegram-Sockets in einem kurzen festen Takt wiederverwendet werden, prüfen Sie auf ein niedriges `channels.telegram.timeoutSeconds`; Bot-Clients begrenzen konfigurierte Werte unterhalb der Schutzgrenzen für ausgehende Anfragen und `getUpdates`, aber ältere Releases konnten jeden Poll oder jede Antwort abbrechen, wenn dies unterhalb dieser Schutzgrenzen gesetzt war.
    - Wenn Protokolle `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Start-Nachfrist kein `getUpdates` abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Start-Nachfrist kein `setWebhook` abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe fehlerfrei sind, Ihr Host aber weiterhin falsch-positive Neustarts wegen blockiertem Polling meldet. Anhaltende Blockierungen deuten normalerweise auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Telegram beachtet außerdem Prozess-Proxy-Umgebungsvariablen für den Bot-API-Transport, einschließlich `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und ihrer Varianten in Kleinbuchstaben. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy über `OPENCLAW_PROXY_URL` für eine Service-Umgebung konfiguriert ist und keine Standard-Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie auf VPS-Hosts mit instabilem direktem Egress/TLS Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2). Die Reihenfolge der Telegram-DNS-Ergebnisse berücksichtigt zuerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder` und danach den Prozessstandard, zum Beispiel `NODE_OPTIONS=--dns-result-order=ipv4first`; wenn nichts davon greift, fällt Node 22+ auf `ipv4first` zurück.
    - Wenn Ihr Host WSL2 ist oder ausdrücklich besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Family-Auswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind für
      Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein
      vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org`
      während Mediendownloads auf eine andere private/interne/Sonderadresse
      umschreibt, können Sie den nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Opt-in-Option ist pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts zu `198.18.x.x` auflöst, lassen Sie
      das gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den
      RFC-2544-Benchmark-Bereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt die
      SSRF-Schutzmaßnahmen für Telegram-Medien. Verwenden Sie es nur für
      vertrauenswürdige, operatorgesteuerte Proxy-Umgebungen wie Clash, Mihomo
      oder Surge Fake-IP-Routing, wenn sie private oder Sonderadressen außerhalb
      des RFC-2544-Benchmark-Bereichs synthetisieren. Lassen Sie es für normalen
      öffentlichen Internetzugriff auf Telegram deaktiviert.
    </Warning>

    - Umgebungs-Overrides (temporär):
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

Weitere Hilfe: [Channel-Fehlerbehebung](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Telegram-Felder mit hohem Signalwert">

- Start/Auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Topic-Standards: `groups.<chatId>.topics."*"` gilt für nicht zugeordnete Forum-Topics; exakte Topic-IDs überschreiben es
- Exec-Genehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threads/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- benutzerdefinierter API-Root: `apiRoot` (nur Bot-API-Root; `/bot<TOKEN>` nicht einschließen)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine `accounts.default.*`-Werte.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Allowlist-Verhalten für Gruppen und Topics.
  </Card>
  <Card title="Channel-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten routen.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Gruppen und Topics Agenten zuordnen.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnose.
  </Card>
</CardGroup>
