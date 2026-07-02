---
read_when:
    - An Telegram-Funktionen oder Webhooks arbeiten
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:34:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsbereit für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Kopplung.
  </Card>
  <Card title="Channel-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Channel-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (stellen Sie sicher, dass der Handle genau `@BotFather` lautet).

    Führen Sie `/newbot` aus, folgen Sie den Aufforderungen und speichern Sie das Token.

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in der Konfiguration/Env und starten Sie dann das Gateway.

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
    - die Telegram-Gruppenchat-ID, verwendet als Schlüssel unter `channels.telegram.groups`

    Für die Ersteinrichtung erhalten Sie die Gruppenchat-ID aus `openclaw logs --follow`, einem Bot für weitergeleitete IDs oder Bot API `getUpdates`. Nachdem die Gruppe erlaubt wurde, kann `/whoami@<bot_username>` die Benutzer- und Gruppen-IDs bestätigen.

    Negative Telegram-Supergruppen-IDs, die mit `-100` beginnen, sind Gruppenchat-IDs. Tragen Sie sie unter `channels.telegram.groups` ein, nicht unter `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
Nach einem erfolgreichen Start speichert OpenClaw die Bot-Identität bis zu 24 Stunden im Statusverzeichnis zwischen, damit Neustarts einen zusätzlichen Telegram-`getMe`-Aufruf vermeiden können; wenn das Token geändert oder entfernt wird, wird dieser Cache gelöscht.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Privatsphäre-Modus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privatsphäre-Modus**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, tun Sie entweder Folgendes:

    - deaktivieren Sie den Privatsphäre-Modus über `/setprivacy`, oder
    - machen Sie den Bot zum Gruppenadmin.

    Wenn Sie den Privatsphäre-Modus umschalten, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Admin-Status wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für dauerhaft aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Schalter">

    - `/setjoingroups`, um das Hinzufügen zu Gruppen zu erlauben/zu verweigern
    - `/setprivacy` für das Verhalten der Gruppensichtbarkeit

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

### Gruppen-Bot-Identität

In Telegram-Gruppen und Forum-Themen wird eine ausdrückliche Erwähnung des konfigurierten Bot-Handles (zum Beispiel `@my_bot`) so behandelt, als würde der ausgewählte OpenClaw-Agent angesprochen, auch wenn sich der Name der Agent-Persona vom Telegram-Benutzernamen unterscheidet. Die Stummschaltungsrichtlinie der Gruppe gilt weiterhin für nicht zugehörigen Gruppenverkehr, aber der Bot-Handle selbst gilt nicht als „jemand anderes“.

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` erlaubt jedem Telegram-Konto, das den Bot-Benutzernamen findet oder errät, dem Bot Befehle zu geben. Verwenden Sie dies nur für absichtlich öffentliche Bots mit stark eingeschränkten Tools; Bots mit einem einzigen Besitzer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Mehrkonto-Konfigurationen wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: `allowFrom: ["*"]`-Einträge auf Kontoebene machen dieses Konto nicht öffentlich, sofern die effektive Konto-Allowlist nach dem Zusammenführen nicht weiterhin einen ausdrücklichen Platzhalter enthält.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (nach bestem Bemühen; erfordert ein Telegram-Bot-Token).
    Wenn Sie zuvor auf Allowlist-Dateien aus dem Kopplungsspeicher vertraut haben, kann `openclaw doctor --fix` Einträge in Allowlist-Abläufen in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine ausdrücklichen IDs enthält).

    Für Bots mit einem einzigen Besitzer bevorzugen Sie `dmPolicy: "allowlist"` mit ausdrücklichen numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration liegt (statt von früheren Kopplungsgenehmigungen abzuhängen).

    Häufige Verwirrung: Die Genehmigung einer DM-Kopplung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Die Kopplung gewährt DM-Zugriff. Wenn noch kein Befehlsbesitzer existiert, setzt die erste genehmigte Kopplung außerdem `commands.ownerAllowFrom`, damit besitzerexklusive Befehle und Exec-Genehmigungen ein ausdrückliches Operator-Konto haben.
    Die Absenderautorisierung in Gruppen stammt weiterhin aus ausdrücklichen Konfigurations-Allowlists.
    Wenn Sie möchten: „Ich bin einmal autorisiert und sowohl DMs als auch Gruppenbefehle funktionieren“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein; stellen Sie für besitzerexklusive Befehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

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
    Zwei Kontrollen gelten zusammen:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: Jede Gruppe kann Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: wirkt als Allowlist (ausdrückliche IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn es nicht gesetzt ist, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Tragen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom` ein. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Gruppenabsender-Authentifizierung übernimmt **keine** Genehmigungen aus dem DM-Kopplungsspeicher.
    Kopplung bleibt DM-exklusiv. Legen Sie für Gruppen `groupAllowFrom` oder gruppen-/themenspezifisches `allowFrom` fest.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Kopplungsspeicher.
    Praktisches Muster für Bots mit einem einzigen Besitzer: Tragen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom` ein, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig das fehlersichere `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht ausdrücklich gesetzt ist.

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

    Testen Sie es aus der Gruppe mit `@<bot_username> ping`. Normale Gruppennachrichten lösen den Bot nicht aus, solange `requireMention: true` gilt.

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

      - Tragen Sie negative Telegram-Gruppen- oder Supergruppen-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ein.
      - Tragen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ein, wenn Sie begrenzen möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
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

    Sitzungsbezogene Befehlsumschalter:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungsstatus. Verwenden Sie die Konfiguration für Persistenz.

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

    Der Gruppenverlaufskontext ist für Gruppen immer aktiviert und durch
    `historyLimit` begrenzt. Setzen Sie `channels.telegram.historyLimit: 0`, um das
    Telegram-Gruppenverlaufsfenster zu deaktivieren. Der entfernte Schlüssel
    `includeGroupHistoryContext` wird von `openclaw doctor --fix` entfernt.

    Gruppenchat-ID ermitteln:

    - Leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie Bot API `getUpdates`
    - nachdem die Gruppe erlaubt wurde, führen Sie `/whoami@<bot_username>` aus, wenn native Befehle aktiviert sind

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram wird vom Gateway-Prozess verwaltet.
- Das Routing ist deterministisch: Eingehende Telegram-Antworten werden zurück an Telegram geleitet (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Channel-Envelope mit Antwortmetadaten, Medien-Platzhaltern und persistiertem Kontext der Antwortkette für Telegram-Antworten normalisiert, die das Gateway beobachtet hat.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forumsthemen hängen `:topic:<threadId>` an, um Themen getrennt zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw bewahrt sie für Antworten auf. DM-Themensitzungen werden nur getrennt, wenn Telegram `getMe` für den Bot `has_topics_enabled: true` meldet; andernfalls bleiben DMs in der flachen Sitzung.
- Long Polling verwendet den grammY Runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Beim Start mit mehreren Konten wird die Anzahl gleichzeitiger Telegram-`getMe`-Probes begrenzt, damit große Bot-Flotten nicht alle Konto-Probes gleichzeitig ausfächern.
- Long Polling ist innerhalb jedes Gateway-Prozesses geschützt, sodass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderes OpenClaw-Gateway, ein Skript oder ein externer Poller dasselbe Token.
- Long-Polling-Watchdog-Neustarts werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung während lang laufender Arbeit weiterhin fälschliche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` zulässig; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

<Note>
  `channels.telegram.dm.threadReplies` und `channels.telegram.direct.<chatId>.threadReplies` wurden entfernt. Führen Sie nach dem Upgrade `openclaw doctor --fix` aus, wenn Ihre Konfiguration diese Schlüssel noch enthält. Das DM-Themenrouting folgt jetzt der Bot-Fähigkeit aus Telegram `getMe.has_topics_enabled`, die durch den Threaded-Modus von BotFather gesteuert wird: Bots mit aktivierten Themen verwenden threadbezogene DM-Sitzungen, wenn Telegram `message_thread_id` sendet; andere DMs bleiben in der flachen Sitzung.
</Note>

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - kurze anfängliche Antwortvorschauen werden entprellt und dann nach einer begrenzten Verzögerung materialisiert, wenn der Lauf noch aktiv ist
    - `progress` hält einen bearbeitbaren Statusentwurf für Tool-Fortschritt vor, zeigt das stabile Statuslabel an, wenn Antwortaktivität vor Tool-Fortschritt eintrifft, löscht ihn beim Abschluss und sendet die finale Antwort als normale Nachricht
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsupdates dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Ausführungsdetails in diesen Tool-Fortschrittszeilen: `raw` (Standard, bewahrt veröffentlichtes Verhalten) oder `status` (nur Tool-Label)
    - `streaming.progress.commentary` (Standard: `false`) aktiviert Assistant-Kommentar-/Präambeltext im temporären Fortschrittsentwurf
    - veraltete `channels.telegram.streamMode`, boolesche `streaming`-Werte und außer Kraft gesetzte native Entwurfsvorschau-Schlüssel werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie in die aktuelle Streaming-Konfiguration zu migrieren

    Tool-Fortschrittsvorschau-Updates sind die kurzen Statuszeilen, die während der Tool-Ausführung angezeigt werden, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsupdates, Patch-Zusammenfassungen oder Codex-Präambel-/Kommentartext im Codex-App-Server-Modus. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` zu entsprechen.

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

    Um Tool-Fortschritt sichtbar zu lassen, aber Befehls-/Ausführungstext auszublenden, legen Sie Folgendes fest:

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

    Verwenden Sie den `progress`-Modus, wenn Sie sichtbaren Tool-Fortschritt möchten, ohne die finale Antwort in dieselbe Nachricht zu bearbeiten. Platzieren Sie die Richtlinie für Befehlstext unter `streaming.progress`:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich finale Zustellung möchten: Telegram-Vorschaubearbeitungen sind deaktiviert, und generisches Tool-/Fortschrittsgerede wird unterdrückt, statt als eigenständige Statusnachrichten gesendet zu werden. Genehmigungsaufforderungen, Medien-Payloads und Fehler werden weiterhin über die normale finale Zustellung geroutet. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschau-Bearbeitungen beibehalten und gleichzeitig die Tool-Fortschrittsstatuszeilen ausblenden möchten.

    <Note>
      Ausgewählte Telegram-Zitatantworten sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die finale Antwort über Telegrams nativen Zitatantwortpfad, statt die Antwortvorschau zu bearbeiten, sodass `streaming.preview.toolProgress` die kurzen Statuszeilen für diesen Turn nicht anzeigen kann. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten das Vorschau-Streaming weiterhin bei. Setzen Sie `replyToMode: "off"`, wenn Sichtbarkeit des Tool-Fortschritts wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Kompromiss anzuerkennen.
    </Note>

    Für reine Textantworten:

    - kurze DM-/Gruppen-/Themenvorschauen: OpenClaw behält dieselbe Vorschaunachricht bei und führt die finale Bearbeitung direkt darin aus
    - lange finale Texte, die in mehrere Telegram-Nachrichten aufgeteilt werden, verwenden die vorhandene Vorschau nach Möglichkeit als ersten finalen Teil wieder und senden dann nur die verbleibenden Teile
    - finale Antworten im Fortschrittsmodus löschen den Statusentwurf und verwenden die normale finale Zustellung, statt den Entwurf in die Antwort zu bearbeiten
    - wenn die finale Bearbeitung fehlschlägt, bevor der abgeschlossene Text bestätigt wurde, verwendet OpenClaw die normale finale Zustellung und räumt die veraltete Vorschau auf

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf die normale finale Zustellung zurück und räumt anschließend die Vorschaunachricht auf.

    Vorschau-Streaming ist von Block-Streaming getrennt. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Verhalten des Reasoning-Streams:

    - `/reasoning stream` verwendet den Reasoning-Vorschaupfad eines unterstützten Kanals; auf Telegram streamt es Reasoning während der Generierung in die Live-Vorschau
    - die Reasoning-Vorschau wird nach der finalen Zustellung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
    - die finale Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Rich-Message-Formatierung">
    Ausgehender Text verwendet standardmäßig Telegram-HTML-Nachrichten, damit Antworten in aktuellen Telegram-Clients lesbar bleiben. Dieser Kompatibilitätsmodus unterstützt normale Fettschrift, Kursivschrift, Links, Code, Spoiler und Zitate, aber keine Rich-only-Blöcke der Bot API 10.1 wie native Tabellen, Details, Rich Media und Formeln.

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
    - Explizite Rich-HTML-Payloads bewahren unterstützte Tags der Bot API 10.1 wie Überschriften, Tabellen, Details, Rich Media und Formeln.
    - Medienbeschriftungen verwenden weiterhin Telegram-HTML-Beschriftungen, da Rich Messages Beschriftungen nicht ersetzen.

    Dadurch bleibt Modelltext von Telegram-Rich-Markdown-Sigils fern, sodass Währungen wie `$400-600K` nicht als Mathematik geparst werden. Langer Rich Text wird automatisch über Telegrams Rich-Text- und Rich-Block-Grenzen hinweg aufgeteilt. Tabellen über Telegrams Spaltenlimit werden als Codeblöcke gesendet.

    Standard: aus für Client-Kompatibilität. Rich Messages erfordern kompatible Telegram-Clients; einige aktuelle Desktop-, Web-, Android- und Drittanbieter-Clients zeigen akzeptierte Rich Messages als nicht unterstützt an. Lassen Sie diese Option deaktiviert, sofern nicht jeder mit dem Bot verwendete Client sie rendern kann. `/status` zeigt an, ob Rich Messages für die aktuelle Telegram-Sitzung ein- oder ausgeschaltet sind.

    Linkvorschauen sind standardmäßig aktiviert. `channels.telegram.linkPreview: false` überspringt die automatische Entitätserkennung für Rich Text.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` erledigt.

    Standardwerte für native Befehle:

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

    - Namen werden normalisiert (führendes `/` entfernen, Kleinschreibung)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren Verhalten nicht automatisch
    - Plugin-/Skill-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie im Telegram-Menü nicht angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen weiterhin übergelaufen ist; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlägt, während direkte Bot-API-curl-Befehle funktionieren, kann das bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur der Bot-API-Stamm sein, und `openclaw doctor --fix` entfernt ein versehentliches nachgestelltes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, sodass dies nicht als Webhook-Bereinigungsfehler gemeldet wird.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Befehle zur Gerätekopplung (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` generiert Einrichtungscode
    2. Code in der iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. die Anfrage genehmigen:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste

    Der Einrichtungscode trägt ein kurzlebiges Bootstrap-Token. Der integrierte Einrichtungscode-Bootstrap ist nur für Nodes: Die erste Verbindung erstellt eine ausstehende Node-Anfrage, und nach der Genehmigung gibt das Gateway ein dauerhaftes Node-Token mit `scopes: []` zurück. Es gibt kein übergebenes Operator-Token zurück; Operator-Zugriff erfordert eine separate genehmigte Operator-Kopplung oder einen separaten Token-Flow.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` erneut aus, bevor Sie genehmigen.

    Weitere Details: [Koppeln](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Scopes:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Legacy-`capabilities: ["inlineButtons"]` wird `inlineButtons: "all"` zugeordnet.

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

    Telegram-`web_app`-Buttons funktionieren nur in privaten Chats zwischen einem Nutzer und dem
    Bot.

    Callback-Klicks, die nicht von einem registrierten interaktiven Plugin-
    Handler übernommen werden, werden als Text an den Agenten übergeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` oder `caption`, optional `presentation` Inline-Buttons; reine Button-Bearbeitungen aktualisieren das Reply-Markup)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen stellen ergonomische Aliasse bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-Steuerelemente:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Toggles.
    Runtime-Sendungen verwenden den aktiven Config/Secrets-Snapshot (Start/Reload), daher führen Aktionspfade keine ad-hoc-Neuauflösung von SecretRef pro Sendung durch.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Reply-Threading-Tags">
    Telegram unterstützt explizite Reply-Threading-Tags in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Wenn Reply-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die Bildunterschrift verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, daher werden längere Nachrichten vom Anfang an zitiert und fallen auf eine einfache Antwort zurück, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.

  </Accordion>

  <Accordion title="Forumthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Themen-Session-Schlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippen zielen auf den Themen-Thread
    - Themen-Config-Pfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall Allgemeines Thema (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` aus (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur themenspezifisch und wird nicht von Gruppenstandards geerbt.
    `topics."*"` legt Standards für jedes Thema in dieser Gruppe fest; exakte Themen-IDs haben weiterhin Vorrang vor `"*"`.

    **Agenten-Routing pro Thema**: Jedes Thema kann an einen anderen Agenten weitergeleitet werden, indem `agentId` in der Themen-Config gesetzt wird. Dadurch erhält jedes Thema seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

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

    **Persistente ACP-Themenbindung**: Forumthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindings auf oberster Ebene fixieren (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forumthemen in Gruppen/Supergruppen beschränkt. Siehe [ACP-Agenten](/de/tools/acp-agents).

    **Threadgebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgebeiträge werden direkt dorthin geleitet. OpenClaw fixiert die Spawn-Bestätigung im Thema. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten Reply-Metadaten; sie verwenden threadfähige Sitzungsschlüssel nur, wenn Telegram `getMe` für den Bot `has_topics_enabled: true` meldet.
    Die früheren Überschreibungen `dm.threadReplies` und `direct.*.threadReplies` wurden absichtlich entfernt; verwenden Sie den Threaded Mode von BotFather als einzige Quelle der Wahrheit und führen Sie `openclaw doctor --fix` aus, um veraltete Config-Schlüssel zu entfernen.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnotizen von Audiodateien.

    - Standard: Audiodatei-Verhalten
    - Tag `[[audio_as_voice]]` in der Agentenantwort, um den Versand als Sprachnotiz zu erzwingen
    - Transkripte eingehender Sprachnotizen werden im Agentenkontext als maschinell generierter,
      nicht vertrauenswürdiger Text eingerahmt; die Erwähnungserkennung verwendet weiterhin das rohe
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

    Videonotizen unterstützen keine Bildunterschriften; bereitgestellter Nachrichtentext wird separat gesendet.

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
    Telegram-Reaktionen treffen als `message_reaction`-Updates ein (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, stellt OpenClaw Systemereignisse wie diese in die Warteschlange:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse respektieren weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktions-Updates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden an die Gruppenchat-Sitzung geleitet
      - Forum-Gruppen werden an die Sitzung des allgemeinen Gruppenthemas (`:topic:1`) geleitet, nicht an das genaue Ursprungsthema

    `allowed_updates` für Polling/Webhook enthält `message_reaction` automatisch.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet. `ackReactionScope` entscheidet, *wann* dieses Emoji tatsächlich gesendet wird.

    **Auflösungsreihenfolge für Emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Emoji der Agent-Identität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

    **Bereich (`messages.ackReactionScope`):**

    Der Telegram-Provider liest den Bereich aus `messages.ackReactionScope` (Standard `"group-mentions"`). Es gibt derzeit keine Überschreibung auf Telegram-Konto- oder Telegram-Kanalebene.

    Werte: `"all"` (DMs + Gruppen), `"direct"` (nur DMs), `"group-all"` (jede Gruppennachricht, keine DMs), `"group-mentions"` (Gruppen, wenn der Bot erwähnt wird; **keine DMs** — dies ist der Standard), `"off"` / `"none"` (deaktiviert).

    <Note>
    Der Standardbereich (`"group-mentions"`) löst in Direktnachrichten keine Ack-Reaktionen aus. Um bei eingehenden Telegram-DMs eine Ack-Reaktion zu erhalten, setzen Sie `messages.ackReactionScope` auf `"direct"` oder `"all"`. Der Wert wird beim Start des Telegram-Providers gelesen, daher ist ein Gateway-Neustart erforderlich, damit die Änderung wirksam wird.
    </Note>

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
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

  <Accordion title="Long Polling vs. Webhook">
    Standard ist Long Polling. Für den Webhook-Modus setzen Sie `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret`; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Im Long-Polling-Modus persistiert OpenClaw seine Neustart-Watermark erst, nachdem ein Update erfolgreich dispatcht wurde. Wenn ein Handler fehlschlägt, bleibt dieses Update im selben Prozess erneut versuchbar und wird für die Deduplizierung beim Neustart nicht als abgeschlossen geschrieben.

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress schalten Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen Sie `webhookHost: "0.0.0.0"` bewusst.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update anschließend asynchron über dieselben Bot-Lanes pro Chat/pro Thema, die auch Long Polling verwendet, sodass langsame Agent-Durchläufe das Zustellungs-ACK von Telegram nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholung und CLI-Ziele">
    - Der Standardwert von `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor der Aufteilung nach Länge.
    - `channels.telegram.mediaMaxMb` (Standardwert 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standardwert 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht weiterleitet. Erhöhen Sie den Wert, wenn Albumteile verspätet eintreffen; senken Sie ihn, um die Antwortlatenz für Alben zu verringern.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (falls nicht gesetzt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb des 60-Sekunden-Schutzes für ausgehende Text-/Tippen-Anfragen, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor OpenClaws Transportschutz und Fallback ausgeführt werden können. Long Polling verwendet weiterhin einen 45-Sekunden-Schutz für `getUpdates`-Anfragen, damit inaktive Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert nur bei falsch-positiven Neustarts wegen Polling-Stalls zwischen `30000` und `600000` an.
    - Der Kontextverlauf für Gruppen verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standardwert 50); `0` deaktiviert ihn.
    - Zusatzkontext aus Antworten/Zitaten/Weiterleitungen wird in ein ausgewähltes Gesprächskontextfenster normalisiert, wenn der Gateway die übergeordneten Nachrichten beobachtet hat; der Cache für beobachtete Nachrichten befindet sich im OpenClaw-SQLite-Plugin-Zustand, und `openclaw doctor --fix` importiert Legacy-Sidecars. Telegram enthält in Updates nur ein flaches `reply_to_message`, daher sind Ketten, die älter als der Cache sind, auf Telegrams aktuelle Update-Nutzlast beschränkt.
    - Telegram-Zulassungslisten steuern primär, wer den Agenten auslösen kann, und sind keine vollständige Redaktionsgrenze für Zusatzkontext.
    - DM-Verlaufssteuerungen:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei wiederherstellbaren ausgehenden API-Fehlern. Die Zustellung eingehender finaler Antworten verwendet ebenfalls eine begrenzte Safe-Send-Wiederholung für Telegram-Fehler vor dem Verbindungsaufbau, wiederholt jedoch keine mehrdeutigen Netzwerk-Umschläge nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    CLI- und Message-Tool-Sendeziele können numerische Chat-ID, Benutzername oder ein Forum-Topic-Ziel sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram-Polls verwenden `openclaw message poll` und unterstützen Forum-Topics:

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
    - `--thread-id` für Forum-Topics (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder, GIFs und Videos als Dokumente statt als komprimierte Foto-, Animationsmedien- oder Video-Uploads zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Polls
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Polls, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Genehmiger-DMs und kann Prompts optional im ursprünglichen Chat oder Topic posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (wird automatisch aktiviert, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Owner-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standardwert) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Genehmiger. Die erste genehmigte DM-Kopplung initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehls-Owner existiert, sodass die Einrichtung mit einem Owner weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Kanalzustellung zeigt den Befehlstext im Chat; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Topics. Wenn der Prompt in einem Forum-Topic landet, erhält OpenClaw das Topic für den Genehmigungs-Prompt und die Nachverfolgung bei. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsbuttons erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) erlaubt. Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Fehlerantwort-Steuerung

Wenn der Agent auf einen Zustell- oder Provider-Fehler stößt, steuert die Fehlerrichtlinie, ob Fehlermeldungen an den Telegram-Chat gesendet werden:

| Schlüssel                           | Werte                      | Standard        | Beschreibung                                                                                                                                                                                                                  |
| ----------------------------------- | -------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — jede Fehlermeldung an den Chat senden. `once` — jede eindeutige Fehlermeldung einmal pro Cooldown-Fenster senden (wiederholte identische Fehler unterdrücken). `silent` — niemals Fehlermeldungen an den Chat senden. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)                  | `14400000` (4h) | Cooldown-Fenster für die Richtlinie `once`. Nachdem ein Fehler gesendet wurde, wird dieselbe Fehlermeldung unterdrückt, bis dieses Intervall abgelaufen ist. Verhindert Fehler-Spam während Ausfällen.                         |

Überschreibungen pro Konto, pro Gruppe und pro Thema werden unterstützt (gleiche Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

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

    - Wenn `requireMention=false` ist, muss der Telegram-Datenschutzmodus vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - Entfernen Sie den Bot anschließend aus der Gruppe und fügen Sie ihn erneut hinzu
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; Wildcard `"*"` kann nicht per Mitgliedschaftsprüfung geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - Bot-Mitgliedschaft in der Gruppe prüfen
    - Logs prüfen: `openclaw logs --follow` für Gründe zum Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - Autorisieren Sie Ihre Absenderidentität (Pairing und/oder numerisches `allowFrom`)
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `deleteMyCommands`- / `setMyCommands`-Startaufrufe und `sendChatAction`-Tippen-Aufrufe sind begrenzt und werden bei Anfrage-Timeout einmal über Telegrams Transport-Fallback erneut versucht. Anhaltende Netzwerk-/Fetch-Fehler weisen normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Start meldet nicht autorisiertes Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für das konfigurierte Bot-Token.
    - Kopieren oder regenerieren Sie das Bot-Token in BotFather erneut und aktualisieren Sie anschließend `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; dies als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler durch ein ungültiges Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerk-Instabilität">

    - Node 22+ und benutzerdefiniertes Fetch/Proxy können sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; defekter IPv6-Egress kann zeitweilige Telegram-API-Fehler verursachen.
    - Wenn Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, versucht OpenClaw diese nun als wiederherstellbare Netzwerkfehler erneut.
    - Während des Polling-Starts verwendet OpenClaw die erfolgreiche `getMe`-Startprüfung für grammY wieder, sodass der Runner kein zweites `getMe` vor dem ersten `getUpdates` benötigt.
    - Wenn `deleteWebhook` während des Polling-Starts mit einem transienten Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, anstatt einen weiteren Control-Plane-Aufruf vor dem Polling auszuführen. Ein weiterhin aktiver Webhook erscheint als `getUpdates`-Konflikt; OpenClaw baut dann den Telegram-Transport neu auf und versucht die Webhook-Bereinigung erneut.
    - Wenn Telegram-Sockets in einem kurzen festen Takt neu erstellt werden, prüfen Sie auf einen niedrigen Wert für `channels.telegram.timeoutSeconds`; Bot-Clients begrenzen konfigurierte Werte unterhalb der ausgehenden und `getUpdates`-Anfrage-Guards, ältere Releases konnten jedoch jeden Poll oder jede Antwort abbrechen, wenn dieser Wert unter diesen Guards lag.
    - Wenn Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Startfrist `getUpdates` nicht abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Startfrist `setWebhook` nicht abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transport-Aktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, Ihr Host aber trotzdem fälschlicherweise Polling-Stall-Neustarts meldet. Anhaltende Stalls deuten normalerweise auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Telegram berücksichtigt für den Bot-API-Transport auch Prozess-Proxy-Umgebungsvariablen, darunter `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` sowie deren Varianten in Kleinschreibung. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy über `OPENCLAW_PROXY_URL` für eine Serviceumgebung konfiguriert ist und keine standardmäßige Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie Telegram-API-Aufrufe auf VPS-Hosts mit instabilem direktem Egress/TLS über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2). Die Reihenfolge der Telegram-DNS-Ergebnisse berücksichtigt zuerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder`, dann die Prozessvorgabe wie `NODE_OPTIONS=--dns-result-order=ipv4first`; wenn nichts davon zutrifft, fällt Node 22+ auf `ipv4first` zurück.
    - Wenn Ihr Host WSL2 ist oder ausdrücklich besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind
      für Telegram-Mediendownloads bereits standardmäßig erlaubt. Wenn eine vertrauenswürdige Fake-IP oder ein
      transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere
      private/interne/Sondernutzungsadresse umschreibt, können Sie sich
      für die nur für Telegram geltende Umgehung entscheiden:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Opt-in-Option ist pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts zu `198.18.x.x` auflöst, lassen Sie die
      gefährliche Option zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-
      Benchmark-Bereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt die SSRF-Schutzmaßnahmen für Telegram-
      Medien. Verwenden Sie es nur für vertrauenswürdige, vom Betreiber kontrollierte Proxy-
      Umgebungen wie Clash-, Mihomo- oder Surge-Fake-IP-Routing, wenn diese
      private oder Sondernutzungsantworten außerhalb des RFC-2544-Benchmark-
      Bereichs erzeugen. Lassen Sie es für normalen öffentlichen Internetzugriff auf Telegram deaktiviert.
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

<Accordion title="Telegram-Felder mit hoher Aussagekraft">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei verweisen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Themenvorgaben: `groups.<chatId>.topics."*"` gilt für nicht übereinstimmende Forumsthemen; exakte Themen-IDs überschreiben sie
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehle/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threads/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- benutzerdefinierter API-Root: `apiRoot` (nur Bot-API-Root; `/bot<TOKEN>` nicht einfügen)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine `accounts.default.*`-Werte.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppen- und Themen-Allowlists.
  </Card>
  <Card title="Channel-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Gruppen und Themen Agenten zu.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnose.
  </Card>
</CardGroup>
