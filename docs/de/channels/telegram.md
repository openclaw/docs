---
read_when:
    - An Telegram-Funktionen oder Webhooks arbeiten
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:13:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsbereit für Bot-Direktnachrichten und Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die standardmäßige Direktnachrichten-Richtlinie für Telegram ist Kopplung.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanalkonfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (bestätigen Sie, dass der Handle genau `@BotFather` ist).

    Führen Sie `/newbot` aus, folgen Sie den Anweisungen und speichern Sie das Token.

  </Step>

  <Step title="Token und Direktnachrichten-Richtlinie konfigurieren">

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in Konfiguration/Env und starten Sie dann das Gateway.

  </Step>

  <Step title="Gateway starten und erste Direktnachricht genehmigen">

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
    - die Telegram-Gruppenchat-ID, verwendet als Schlüssel unter `channels.telegram.groups`

    Für die erstmalige Einrichtung erhalten Sie die Gruppenchat-ID aus `openclaw logs --follow`, einem Bot für weitergeleitete IDs oder über die Bot API `getUpdates`. Nachdem die Gruppe zugelassen wurde, kann `/whoami@<bot_username>` die Benutzer- und Gruppen-IDs bestätigen.

    Negative Telegram-Supergruppen-IDs, die mit `-100` beginnen, sind Gruppenchat-IDs. Legen Sie sie unter `channels.telegram.groups` ab, nicht unter `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
Nach einem erfolgreichen Start speichert OpenClaw die Bot-Identität bis zu 24 Stunden im Zustandsverzeichnis zwischen, damit Neustarts einen zusätzlichen Telegram-`getMe`-Aufruf vermeiden können; das Ändern oder Entfernen des Tokens leert diesen Cache.
</Note>

## Einstellungen auf Telegram-Seite

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Datenschutzmodus**, der einschränkt, welche Gruppennachrichten sie erhalten.

    Wenn der Bot alle Gruppennachrichten sehen muss, entweder:

    - deaktivieren Sie den Datenschutzmodus über `/setprivacy`, oder
    - machen Sie den Bot zu einem Gruppenadministrator.

    Wenn Sie den Datenschutzmodus umschalten, entfernen Sie den Bot in jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Administrator-Bots erhalten alle Gruppennachrichten, was für dauerhaft aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Umschalter">

    - `/setjoingroups`, um Gruppenzugänge zu erlauben/zu verweigern
    - `/setprivacy` für das Verhalten der Gruppensichtbarkeit

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

### Bot-Identität in Gruppen

In Telegram-Gruppen und Forumsthemen wird eine ausdrückliche Erwähnung des konfigurierten Bot-Handles (zum Beispiel `@my_bot`) so behandelt, als würde der ausgewählte OpenClaw-Agent angesprochen, auch wenn der Persona-Name des Agenten vom Telegram-Benutzernamen abweicht. Die Stummschaltungsrichtlinie der Gruppe gilt weiterhin für nicht zusammenhängenden Gruppenverkehr, aber der Bot-Handle selbst gilt nicht als „jemand anderes“.

<Tabs>
  <Tab title="Direktnachrichten-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` lässt jedes Telegram-Konto, das den Bot-Benutzernamen findet oder errät, dem Bot Befehle geben. Verwenden Sie dies nur für bewusst öffentliche Bots mit streng eingeschränkten Tools; Bots mit einem Besitzer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Die Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Mehrkonten-Konfigurationen wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: Kontospezifische `allowFrom: ["*"]`-Einträge machen dieses Konto nicht öffentlich, es sei denn, die wirksame Konto-Allowlist enthält nach dem Zusammenführen weiterhin einen ausdrücklichen Platzhalter.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle Direktnachrichten und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (nach bestem Aufwand; erfordert ein Telegram-Bot-Token).
    Wenn Sie zuvor Allowlist-Dateien aus dem Kopplungsspeicher verwendet haben, kann `openclaw doctor --fix` Einträge in Allowlist-Abläufen in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine ausdrücklichen IDs hat).

    Für Bots mit einem Besitzer bevorzugen Sie `dmPolicy: "allowlist"` mit ausdrücklichen numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration liegt (statt von früheren Kopplungsgenehmigungen abzuhängen).

    Häufige Verwirrung: Die Genehmigung der Direktnachrichten-Kopplung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Kopplung gewährt Direktnachrichten-Zugriff. Wenn noch kein Befehlsbesitzer vorhanden ist, setzt die erste genehmigte Kopplung außerdem `commands.ownerAllowFrom`, damit Befehle nur für Besitzer und Exec-Genehmigungen ein ausdrückliches Betreiberkonto haben.
    Die Autorisierung von Gruppenabsendern stammt weiterhin aus ausdrücklichen Konfigurations-Allowlists.
    Wenn Sie möchten: „Ich bin einmal autorisiert und sowohl Direktnachrichten als auch Gruppenbefehle funktionieren“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein; für Befehle nur für Besitzer stellen Sie sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Senden Sie Ihrem Bot eine Direktnachricht.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter-Methode (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen gelten zusammen:

    1. **Welche Gruppen zugelassen sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: Jede Gruppe kann Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Allowlist (ausdrückliche IDs oder `"*"`)

    2. **Welche Absender in Gruppen zugelassen sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn nicht gesetzt, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Legen Sie keine Telegram-Gruppen- oder Supergruppenchat-IDs in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Gruppenabsender-Authentifizierung erbt **keine** Genehmigungen aus dem Direktnachrichten-Kopplungsspeicher.
    Kopplung bleibt nur für Direktnachrichten. Setzen Sie für Gruppen `groupAllowFrom` oder gruppen-/themenspezifisches `allowFrom`.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Kopplungsspeicher.
    Praktisches Muster für Bots mit einem Besitzer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und lassen Sie die Zielgruppen unter `channels.telegram.groups` zu.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig ausfallsicher geschlossen `groupPolicy="allowlist"`, es sei denn, `channels.defaults.groupPolicy` ist ausdrücklich gesetzt.

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

    Beispiel: beliebige Mitglieder in einer bestimmten Gruppe erlauben:

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

    Beispiel: nur bestimmte Benutzer innerhalb einer bestimmten Gruppe erlauben:

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

      - Legen Sie negative Telegram-Gruppen- oder Supergruppenchat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie begrenzen möchten, welche Personen innerhalb einer zugelassenen Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn jedes Mitglied einer zugelassenen Gruppe mit dem Bot sprechen können soll.

    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Eine Erwähnung kann stammen von:

    - nativer `@botusername`-Erwähnung, oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Sitzungsbezogene Befehlsumschalter:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungszustand. Verwenden Sie für Persistenz die Konfiguration.

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

    Der Gruppenkontextverlauf ist standardmäßig `mention-only`: frühere Gruppennachrichten werden
    nur einbezogen, wenn sie an den Bot gerichtet waren, Antworten an den Bot sind
    oder eigene Nachrichten des Bots sind. Setzen Sie `includeGroupHistoryContext: "recent"`, um
    den jüngsten Raumverlauf für vertrauenswürdige Gruppen einzubeziehen. Setzen Sie
    `includeGroupHistoryContext: "none"`, um beim nächsten Turn keinen vorherigen Telegram-Gruppenverlauf
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

    Gruppenchat-ID abrufen:

    - eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiterleiten
    - oder `chat.id` aus `openclaw logs --follow` lesen
    - oder Bot API `getUpdates` prüfen
    - nachdem die Gruppe zugelassen wurde, `/whoami@<bot_username>` ausführen, wenn native Befehle aktiviert sind

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört dem Gateway-Prozess.
- Das Routing ist deterministisch: Eingehende Telegram-Antworten gehen zurück an Telegram (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanal-Envelope mit Antwortmetadaten, Medienplatzhaltern und persistiertem Antwortkettenkontext für Telegram-Antworten normalisiert, die das Gateway beobachtet hat.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forumsthemen hängen `:topic:<threadId>` an, um Themen isoliert zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw bewahrt sie für Antworten auf. DM-Themensitzungen werden nur aufgeteilt, wenn Telegram `getMe` für den Bot `has_topics_enabled: true` meldet; andernfalls bleiben DMs in der flachen Sitzung.
- Long Polling verwendet den grammY runner mit Sequenzierung pro Chat/pro Thread. Die gesamte runner-sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Der Multi-Account-Start begrenzt gleichzeitige Telegram-`getMe`-Prüfungen, damit große Bot-Flotten nicht alle Account-Prüfungen auf einmal auffächern.
- Long Polling wird innerhalb jedes Gateway-Prozesses geschützt, sodass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderes OpenClaw-Gateway, ein Skript oder ein externer Poller dasselbe Token.
- Long-Polling-Watchdog-Neustarts werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung während lang laufender Arbeit weiterhin fälschliche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` zulässig; Überschreibungen pro Account werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

<Note>
  `channels.telegram.dm.threadReplies` und `channels.telegram.direct.<chatId>.threadReplies` wurden entfernt. Führen Sie nach dem Upgrade `openclaw doctor --fix` aus, wenn Ihre Konfiguration diese Schlüssel noch enthält. Das DM-Themenrouting folgt jetzt der Bot-Fähigkeit aus Telegram `getMe.has_topics_enabled`, die durch den threaded mode von BotFather gesteuert wird: Bots mit aktivierten Themen verwenden thread-bezogene DM-Sitzungen, wenn Telegram `message_thread_id` sendet; andere DMs bleiben in der flachen Sitzung.
</Note>

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Livestream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - kurze anfängliche Antwortvorschauen werden entprellt und dann nach einer begrenzten Verzögerung materialisiert, wenn der Lauf noch aktiv ist
    - `progress` hält einen bearbeitbaren Statusentwurf für Tool-Fortschritt vor, zeigt das stabile Statuslabel an, wenn Antwortaktivität vor Tool-Fortschritt eintrifft, löscht ihn bei Abschluss und sendet die endgültige Antwort als normale Nachricht
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsupdates dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Exec-Details innerhalb dieser Tool-Fortschrittszeilen: `raw` (Standard, bewahrt veröffentlichtes Verhalten) oder `status` (nur Tool-Label)
    - `streaming.progress.commentary` (Standard: `false`) aktiviert Assistenten-Kommentare/Präambeltext im temporären Fortschrittsentwurf
    - veraltete `channels.telegram.streamMode`, boolesche `streaming`-Werte und außer Dienst gestellte native Entwurfsvorschau-Schlüssel werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie zur aktuellen Streaming-Konfiguration zu migrieren

    Tool-Fortschrittsvorschau-Updates sind die kurzen Statuszeilen, die angezeigt werden, während Tools laufen, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsupdates, Patch-Zusammenfassungen oder Codex-Präambel-/Kommentartext im Codex-App-Server-Modus. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` zu entsprechen.

    Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie:

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

    Um Tool-Fortschritt sichtbar zu halten, aber Befehls-/Exec-Text auszublenden, setzen Sie:

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

    Verwenden Sie den Modus `progress`, wenn sichtbarer Tool-Fortschritt gewünscht ist, ohne die endgültige Antwort in dieselbe Nachricht zu bearbeiten. Legen Sie die Befehls-Text-Richtlinie unter `streaming.progress` ab:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich endgültige Zustellung möchten: Telegram-Vorschau-Bearbeitungen sind deaktiviert und allgemeines Tool-/Fortschrittsrauschen wird unterdrückt, statt als eigenständige Statusnachrichten gesendet zu werden. Genehmigungsaufforderungen, Medien-Payloads und Fehler laufen weiterhin über die normale endgültige Zustellung. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschau-Bearbeitungen beibehalten und zugleich die Tool-Fortschrittsstatuszeilen ausblenden möchten.

    <Note>
      Ausgewählte Telegram-Zitatantworten sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die endgültige Antwort über Telegrams nativen Zitatantwort-Pfad, statt die Antwortvorschau zu bearbeiten, sodass `streaming.preview.toolProgress` die kurzen Statuszeilen für diesen Turn nicht anzeigen kann. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten weiterhin Vorschau-Streaming. Setzen Sie `replyToMode: "off"`, wenn die Sichtbarkeit des Tool-Fortschritts wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Trade-off anzuerkennen.
    </Note>

    Für reine Textantworten:

    - kurze DM-/Gruppen-/Themenvorschauen: OpenClaw behält dieselbe Vorschaunachricht bei und führt die endgültige Bearbeitung direkt darin aus
    - lange endgültige Texte, die in mehrere Telegram-Nachrichten aufgeteilt werden, verwenden die bestehende Vorschau wenn möglich als ersten endgültigen Abschnitt wieder und senden dann nur die verbleibenden Abschnitte
    - endgültige Antworten im Fortschrittsmodus löschen den Statusentwurf und verwenden normale endgültige Zustellung, statt den Entwurf in die Antwort zu bearbeiten
    - wenn die endgültige Bearbeitung fehlschlägt, bevor der abgeschlossene Text bestätigt ist, verwendet OpenClaw normale endgültige Zustellung und bereinigt die veraltete Vorschau

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf normale endgültige Zustellung zurück und bereinigt anschließend die Vorschaunachricht.

    Vorschau-Streaming ist von Block-Streaming getrennt. Wenn Block-Streaming für Telegram ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Verhalten des Reasoning-Streams:

    - `/reasoning stream` verwendet den Reasoning-Vorschaupfad eines unterstützten Kanals; in Telegram streamt es während der Generierung Reasoning in die Live-Vorschau
    - die Reasoning-Vorschau wird nach der endgültigen Zustellung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
    - die endgültige Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Rich-Message-Formatierung">
    Ausgehender Text verwendet standardmäßig reguläre Telegram-HTML-Nachrichten, damit Antworten in aktuellen Telegram-Clients lesbar bleiben. Dieser Kompatibilitätsmodus unterstützt normales Fett, Kursiv, Links, Code, Spoiler und Zitate, aber keine Rich-only-Blöcke der Bot API 10.1 wie native Tabellen, Details, Rich Media und Formeln.

    Setzen Sie `channels.telegram.richMessages: true`, um Bot-API-10.1-Rich-Messages zu aktivieren:

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

    - Dem Agenten wird mitgeteilt, dass Telegram-Rich-Messages für diesen Bot/dieses Konto verfügbar sind.
    - Markdown-Text wird über OpenClaws Markdown-IR gerendert und als Telegram-Rich-HTML gesendet.
    - Explizite Rich-HTML-Payloads bewahren unterstützte Bot-API-10.1-Tags wie Überschriften, Tabellen, Details, Rich Media und Formeln.
    - Medienbeschriftungen verwenden weiterhin Telegram-HTML-Beschriftungen, weil Rich-Messages Beschriftungen nicht ersetzen.

    Dadurch bleibt Modelltext von Telegram-Rich-Markdown-Sigils fern, sodass Beträge wie `$400-600K` nicht als Mathematik geparst werden. Langer Rich-Text wird automatisch über Telegrams Rich-Text- und Rich-Block-Limits hinweg aufgeteilt. Tabellen, die Telegrams Spaltenlimit überschreiten, werden als Codeblöcke gesendet.

    Standard: aus Gründen der Client-Kompatibilität deaktiviert. Rich-Messages erfordern kompatible Telegram-Clients; einige aktuelle Desktop-, Web-, Android- und Drittanbieter-Clients zeigen akzeptierte Rich-Messages als nicht unterstützt an. Lassen Sie diese Option deaktiviert, sofern nicht jeder mit dem Bot verwendete Client sie rendern kann. `/status` zeigt, ob Rich-Messages für die aktuelle Telegram-Sitzung aktiviert oder deaktiviert sind.

    Link-Vorschauen sind standardmäßig aktiviert. `channels.telegram.linkPreview: false` überspringt die automatische Entitätserkennung für Rich-Text.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` verarbeitet.

    Standards für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Benutzerdefinierte Einträge zum Befehlsmenü hinzufügen:

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

    - Namen werden normalisiert (führenden `/` entfernen, in Kleinbuchstaben umwandeln)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skill-Befehle können bei Eingabe weiterhin funktionieren, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können weiterhin registriert werden, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen immer noch übergelaufen ist; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Fehler bei `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found`, während direkte Bot-API-curl-Befehle funktionieren, können bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur die Bot-API-Root sein, und `openclaw doctor --fix` entfernt ein versehentlich angehängtes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, sodass dies nicht als Webhook-Bereinigungsfehler gemeldet wird.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Befehle zur Geräte-Kopplung (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` generiert Einrichtungscode
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/scopes)
    4. die Anfrage genehmigen:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Der integrierte Einrichtungscode-Bootstrap ist nur für Nodes: Die erste Verbindung erstellt eine ausstehende Node-Anfrage, und nach der Genehmigung gibt der Gateway ein dauerhaftes Node-Token mit `scopes: []` zurück. Er gibt kein übergebenes Operator-Token zurück; Operator-Zugriff erfordert eine separate genehmigte Operator-Kopplung oder einen separaten Token-Flow.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` vor der Genehmigung erneut aus.

    Weitere Details: [Kopplung](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
    Konfigurieren Sie den Geltungsbereich der Inline-Tastatur:

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

    Geltungsbereiche:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Das Legacy-Format `capabilities: ["inlineButtons"]` wird `inlineButtons: "all"` zugeordnet.

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

    Beispiel für eine Mini-App-Schaltfläche:

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

    Telegram-`web_app`-Schaltflächen funktionieren nur in privaten Chats zwischen einem Benutzer und dem
    Bot.

    Callback-Klicks werden als Text an den Agent übergeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agents und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` oder `caption`, optional `presentation`-Inline-Schaltflächen; reine Schaltflächen-Änderungen aktualisieren das Reply-Markup)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Channel-Nachrichtenaktionen stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Steuerungen für die Aktivierung:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Umschalter.
    Runtime-Sendevorgänge verwenden den aktiven Config-/Secrets-Snapshot (Startup/Reload), daher lösen Aktionspfade SecretRefs nicht ad hoc pro Sendevorgang erneut auf.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Antwort-Threading-Tags">
    Telegram unterstützt explizite Antwort-Threading-Tags in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Handhabung:

    - `off` (Standard)
    - `first`
    - `all`

    Wenn Antwort-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, daher werden längere Nachrichten vom Anfang an zitiert und fallen auf eine einfache Antwort zurück, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forum-Themen und Thread-Verhalten">
    Forum-Supergruppen:

    - Topic-Session-Keys hängen `:topic:<threadId>` an
    - Antworten und Tippanzeigen zielen auf den Topic-Thread
    - Topic-Config-Pfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall „Allgemeines Thema“ (`threadId=1`):

    - Nachrichten-Sendevorgänge lassen `message_thread_id` aus (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Topic-Vererbung: Topic-Einträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur Topic-spezifisch und erbt nicht von Gruppenstandards.
    `topics."*"` legt Standards für jedes Topic in dieser Gruppe fest; exakte Topic-IDs haben weiterhin Vorrang vor `"*"`.

    **Agent-Routing pro Topic**: Jedes Topic kann durch Setzen von `agentId` in der Topic-Config an einen anderen Agent weitergeleitet werden. Dadurch erhält jedes Topic einen eigenen isolierten Arbeitsbereich, Speicher und eine eigene Session. Beispiel:

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

    Jedes Topic hat dann seinen eigenen Session-Key: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Topic-Bindung**: Forum-Themen können ACP-Harness-Sessions über typisierte ACP-Bindungen auf oberster Ebene anheften (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer Topic-qualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forum-Themen in Gruppen/Supergruppen beschränkt. Siehe [ACP Agents](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Topic an eine neue ACP-Session; Folgeaktionen werden direkt dorthin weitergeleitet. OpenClaw heftet die Spawn-Bestätigung im Topic an. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten Antwortmetadaten bei; sie verwenden threadbewusste Session-Keys nur, wenn Telegram `getMe` für den Bot `has_topics_enabled: true` meldet.
    Die früheren Überschreibungen `dm.threadReplies` und `direct.*.threadReplies` wurden bewusst entfernt; verwenden Sie den Threaded-Modus von BotFather als einzige Quelle der Wahrheit und führen Sie `openclaw doctor --fix` aus, um veraltete Config-Schlüssel zu entfernen.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnachrichten von Audiodateien.

    - Standard: Audiodatei-Verhalten
    - Tag `[[audio_as_voice]]` in der Agent-Antwort, um das Senden als Sprachnachricht zu erzwingen
    - Transkripte eingehender Sprachnachrichten werden im Agent-Kontext als maschinell generierter,
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

    Telegram unterscheidet Videodateien von Videonotizen.

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

    Sticker-Beschreibungen werden im OpenClaw SQLite-Plugin-Zustand zwischengespeichert, um wiederholte Vision-Aufrufe zu reduzieren.

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

    Wenn aktiviert, reiht OpenClaw Systemereignisse wie dieses ein:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (nach bestem Aufwand über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktions-Updates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden an die Gruppenchat-Sitzung weitergeleitet
      - Forum-Gruppen werden an die allgemeine Themen-Sitzung der Gruppe (`:topic:1`) weitergeleitet, nicht an das genaue ursprüngliche Thema

    `allowed_updates` für Polling/Webhook enthält `message_reaction` automatisch.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet. `ackReactionScope` entscheidet, *wann* dieses Emoji tatsächlich gesendet wird.

    **Auflösungsreihenfolge für Emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder Account zu deaktivieren.

    **Geltungsbereich (`messages.ackReactionScope`):**

    Der Telegram-Provider liest den Geltungsbereich aus `messages.ackReactionScope` (Standard `"group-mentions"`). Heute gibt es keine Überschreibung auf Telegram-Account- oder Telegram-Kanal-Ebene.

    Werte: `"all"` (DMs + Gruppen), `"direct"` (nur DMs), `"group-all"` (jede Gruppennachricht, keine DMs), `"group-mentions"` (Gruppen, wenn der Bot erwähnt wird; **keine DMs** — dies ist der Standard), `"off"` / `"none"` (deaktiviert).

    <Note>
    Der Standardgeltungsbereich (`"group-mentions"`) löst in Direktnachrichten keine Ack-Reaktionen aus. Um eine Ack-Reaktion auf eingehende Telegram-DMs zu erhalten, setzen Sie `messages.ackReactionScope` auf `"direct"` oder `"all"`. Der Wert wird beim Start des Telegram-Providers gelesen, daher ist ein Gateway-Neustart erforderlich, damit die Änderung wirksam wird.
    </Note>

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge in der Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

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

    Im Long-Polling-Modus persistiert OpenClaw seine Neustart-Watermark erst, nachdem ein Update erfolgreich verteilt wurde. Wenn ein Handler fehlschlägt, bleibt dieses Update im selben Prozess erneut versuchbar und wird für die Deduplizierung beim Neustart nicht als abgeschlossen geschrieben.

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress setzen Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen `webhookHost: "0.0.0.0"` bewusst.

    Der Webhook-Modus validiert Request-Guards, das Telegram-Secret-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update anschließend asynchron über dieselben Bot-Lanes pro Chat/pro Thema, die auch Long Polling verwendet, sodass langsame Agentenläufe den Zustellungs-ACK von Telegram nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholungen und CLI-Ziele">
    - Der Standardwert für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor der Aufteilung nach Länge.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standard 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht weiterleitet. Erhöhen Sie den Wert, wenn Albenteile verspätet eintreffen; verringern Sie ihn, um die Antwortlatenz für Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht festgelegt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb des 60-Sekunden-Schutzes für ausgehende Text-/Typing-Anfragen, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor OpenClaws Transportschutz und Fallback greifen können. Long Polling verwendet weiterhin einen 45-Sekunden-Schutz für `getUpdates`-Anfragen, damit inaktive Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert nur bei falsch-positiven Neustarts wegen blockiertem Polling zwischen `30000` und `600000` an.
    - Der Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Ergänzender Kontext aus Antworten/Zitaten/Weiterleitungen wird in ein ausgewähltes Unterhaltungskontextfenster normalisiert, wenn der Gateway die übergeordneten Nachrichten beobachtet hat; der Cache für beobachtete Nachrichten liegt im SQLite-Plugin-Status von OpenClaw, und `openclaw doctor --fix` importiert Legacy-Sidecars. Telegram nimmt in Updates nur ein flaches `reply_to_message` auf, daher sind Ketten, die älter als der Cache sind, auf Telegrams aktuelle Update-Nutzlast beschränkt.
    - Telegram-Zulassungslisten steuern in erster Linie, wer den Agent auslösen kann, nicht eine vollständige Schwelle zur Redaktion von ergänzendem Kontext.
    - Steuerungen für den DM-Verlauf:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung der endgültigen eingehenden Antwort verwendet ebenfalls eine begrenzte Safe-Send-Wiederholung bei Telegram-Fehlern vor dem Verbindungsaufbau, wiederholt jedoch keine mehrdeutigen Netzwerk-Umschläge nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    CLI- und Nachrichtentool-Sendeziele können numerische Chat-ID, Benutzername oder ein Forum-Themenziel sein:

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

    Nur für Telegram verfügbare Poll-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forum-Themen (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder, GIFs und Videos als Dokumente statt als komprimierte Foto-, animierte Medien- oder Video-Uploads zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Polls
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Polls, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Genehmiger-DMs und kann Prompts optional im ursprünglichen Chat oder Thema posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (wird automatisch aktiviert, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Besitzer-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Genehmiger. Die erste genehmigte DM-Kopplung initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehlsbesitzer existiert, sodass die Einrichtung mit einem Besitzer weiterhin ohne doppelte IDs unter `execApprovals.approvers` funktioniert.

    Kanalzustellung zeigt den Befehlstext im Chat an; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn der Prompt in einem Forum-Thema landet, bewahrt OpenClaw das Thema für den Genehmigungs-Prompt und die Folgeaktion. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) erlaubt. Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerungen für Fehlerantworten

Wenn der Agent einen Zustellungs- oder Provider-Fehler feststellt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                              |
| ----------------------------------- | ----------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam während Ausfällen.         |

Überschreibungen pro Konto, pro Gruppe und pro Thema werden unterstützt (dieselbe Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
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
  <Accordion title="Bot antwortet nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false` ist, muss der Telegram-Datenschutzmodus vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - Entfernen Sie den Bot anschließend aus der Gruppe und fügen Sie ihn erneut hinzu.
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; der Platzhalter `"*"` kann nicht per Mitgliedschaftsprobe geprüft werden.
    - Schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht Gruppennachrichten überhaupt nicht">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten).
    - Prüfen Sie die Bot-Mitgliedschaft in der Gruppe.
    - Prüfen Sie die Logs mit `openclaw logs --follow` auf Gründe für Überspringen.

  </Accordion>

  <Accordion title="Befehle funktionieren nur teilweise oder gar nicht">

    - Autorisieren Sie Ihre Absenderidentität (Pairing und/oder numerisches `allowFrom`).
    - Die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist.
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs.
    - Die Startaufrufe `deleteMyCommands` / `setMyCommands` und die `sendChatAction`-Typing-Aufrufe sind begrenzt und werden bei einem Request-Timeout einmal über Telegrams Transport-Fallback erneut versucht. Anhaltende Netzwerk-/Fetch-Fehler deuten normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin.

  </Accordion>

  <Accordion title="Start meldet nicht autorisierten Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für den konfigurierten Bot-Token.
    - Kopieren oder generieren Sie den Bot-Token in BotFather erneut und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; ihn als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler durch einen ungültigen Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ und benutzerdefinierter Fetch/Proxy können sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; fehlerhafter IPv6-Egress kann zeitweise Telegram-API-Fehler verursachen.
    - Wenn Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese nun als wiederherstellbare Netzwerkfehler.
    - Während des Polling-Starts verwendet OpenClaw die erfolgreiche Startprobe `getMe` für grammY erneut, sodass der Runner vor dem ersten `getUpdates` kein zweites `getMe` benötigt.
    - Wenn `deleteWebhook` während des Polling-Starts mit einem vorübergehenden Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Control-Plane-Aufruf vor dem Polling auszuführen. Ein weiterhin aktiver Webhook erscheint als `getUpdates`-Konflikt; OpenClaw baut dann den Telegram-Transport neu auf und versucht die Webhook-Bereinigung erneut.
    - Wenn Telegram-Sockets in einem kurzen festen Rhythmus recycelt werden, prüfen Sie auf einen niedrigen Wert für `channels.telegram.timeoutSeconds`; Bot-Clients begrenzen konfigurierte Werte unterhalb der Schutzgrenzen für ausgehende Requests und `getUpdates`, ältere Releases konnten jedoch jeden Poll oder jede Antwort abbrechen, wenn dieser Wert unterhalb dieser Schutzgrenzen lag.
    - Wenn Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport nach standardmäßig 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Startfrist kein `getUpdates` abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Startfrist kein `setWebhook` abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, Ihr Host aber dennoch fälschliche Neustarts wegen Polling-Stalls meldet. Anhaltende Stalls deuten normalerweise auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Telegram berücksichtigt außerdem Prozess-Proxy-Umgebungsvariablen für den Bot-API-Transport, einschließlich `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und deren kleingeschriebene Varianten. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy über `OPENCLAW_PROXY_URL` für eine Service-Umgebung konfiguriert ist und keine Standard-Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie Telegram-API-Aufrufe auf VPS-Hosts mit instabilem direktem Egress/TLS über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2). Die Reihenfolge der Telegram-DNS-Ergebnisse berücksichtigt zuerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder` und anschließend den Prozessstandard wie `NODE_OPTIONS=--dns-result-order=ipv4first`; wenn nichts davon gilt, fällt Node 22+ auf `ipv4first` zurück.
    - Wenn Ihr Host WSL2 ist oder ausdrücklich besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Family-Auswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmarkbereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads standardmäßig bereits zugelassen. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere private/interne/Sondernutzungsadresse umschreibt, können Sie den nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Opt-in-Option ist pro Konto unter `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts nach `198.18.x.x` auflöst, lassen Sie das gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-Benchmarkbereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt die SSRF-Schutzmaßnahmen für Telegram-Medien. Verwenden Sie es nur für vertrauenswürdige, operatorgesteuerte Proxy-Umgebungen wie Clash-, Mihomo- oder Surge-Fake-IP-Routing, wenn diese private oder Sondernutzungsantworten außerhalb des RFC-2544-Benchmarkbereichs synthetisieren. Lassen Sie es für normalen öffentlichen Internetzugriff auf Telegram deaktiviert.
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

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Aussagekräftige Telegram-Felder">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, Top-Level-`bindings[]` (`type: "acp"`)
- Themenstandards: `groups.<chatId>.topics."*"` gilt für nicht zugeordnete Forenthemen; exakte Themen-IDs überschreiben dies
- Ausführungsfreigaben: `execApprovals`, `accounts.*.execApprovals`
- Befehle/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
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
Vorrang bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber nicht die Werte von `accounts.default.*`.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten der Zulassungsliste für Gruppen und Themen.
  </Card>
  <Card title="Kanalrouting" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Gruppen und Themen Agenten zu.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose.
  </Card>
</CardGroup>
