---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Supportstatus, Funktionen und Konfiguration für Telegram-Bots
title: Telegram
x-i18n:
    generated_at: "2026-07-03T13:21:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsbereit für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Kopplung.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanalkonfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (stellen Sie sicher, dass der Handle genau `@BotFather` lautet).

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in Konfiguration/Env und starten Sie dann das Gateway.

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
    Fügen Sie den Bot Ihrer Gruppe hinzu und ermitteln Sie dann beide IDs, die der Gruppenzugriff benötigt:

    - Ihre Telegram-Benutzer-ID, verwendet in `allowFrom` / `groupAllowFrom`
    - die Telegram-Gruppenchat-ID, verwendet als Schlüssel unter `channels.telegram.groups`

    Für die erstmalige Einrichtung erhalten Sie die Gruppenchat-ID aus `openclaw logs --follow`, einem weitergeleiteten-ID-Bot oder der Bot API `getUpdates`. Nachdem die Gruppe erlaubt wurde, kann `/whoami@<bot_username>` die Benutzer- und Gruppen-IDs bestätigen.

    Negative Telegram-Supergruppen-IDs, die mit `-100` beginnen, sind Gruppenchat-IDs. Legen Sie sie unter `channels.telegram.groups` ab, nicht unter `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. Praktisch haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
Nach einem erfolgreichen Start speichert OpenClaw die Bot-Identität bis zu 24 Stunden im Zustandsverzeichnis zwischen, damit Neustarts einen zusätzlichen Telegram-`getMe`-Aufruf vermeiden können; das Ändern oder Entfernen des Tokens leert diesen Cache.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privacy Mode**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, tun Sie eines von beidem:

    - deaktivieren Sie den Datenschutzmodus über `/setprivacy`, oder
    - machen Sie den Bot zum Gruppenadmin.

    Wenn Sie den Datenschutzmodus umschalten, entfernen Sie den Bot in jeder Gruppe und fügen Sie ihn wieder hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Admin-Status wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots erhalten alle Gruppennachrichten, was für dauerhaft aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Umschalter">

    - `/setjoingroups`, um das Hinzufügen zu Gruppen zu erlauben/zu verweigern
    - `/setprivacy` für das Verhalten der Gruppensichtbarkeit

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

### Gruppen-Bot-Identität

In Telegram-Gruppen und Forumsthemen wird eine ausdrückliche Erwähnung des konfigurierten Bot-Handles (zum Beispiel `@my_bot`) so behandelt, als würde der ausgewählte OpenClaw-Agent angesprochen, selbst wenn der Persona-Name des Agents vom Telegram-Benutzernamen abweicht. Die Stummschaltungsrichtlinie der Gruppe gilt weiterhin für nicht zusammenhängenden Gruppenverkehr, aber der Bot-Handle selbst gilt nicht als „jemand anderes“.

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff per Direktnachricht:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` ermöglicht jedem Telegram-Konto, das den Bot-Benutzernamen findet oder errät, dem Bot Befehle zu geben. Verwenden Sie dies nur für bewusst öffentliche Bots mit streng eingeschränkten Tools; Bots mit einem Owner sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. `telegram:`- / `tg:`-Präfixe werden akzeptiert und normalisiert.
    In Mehrkontokonfigurationen wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: `allowFrom: ["*"]`-Einträge auf Kontoebene machen dieses Konto nicht öffentlich, solange die effektive Konto-Allowlist nach dem Zusammenführen keinen expliziten Platzhalter enthält.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie zuvor auf Allowlist-Dateien aus dem Kopplungsspeicher vertraut haben, kann `openclaw doctor --fix` Einträge in Allowlist-Flows nach `channels.telegram.allowFrom` wiederherstellen (zum Beispiel wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem Owner bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (statt von früheren Kopplungsgenehmigungen abzuhängen).

    Häufige Verwechslung: Eine DM-Kopplungsgenehmigung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Kopplung gewährt DM-Zugriff. Wenn noch kein Befehls-Owner existiert, setzt die erste genehmigte Kopplung außerdem `commands.ownerAllowFrom`, damit nur für Owner bestimmte Befehle und Exec-Genehmigungen ein explizites Betreiberkonto haben.
    Die Autorisierung von Gruppenabsendern stammt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten: „Ich bin einmal autorisiert und sowohl DMs als auch Gruppenbefehle funktionieren“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein; stellen Sie für nur für Owner bestimmte Befehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

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
    Zwei Kontrollen gelten gemeinsam:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: jede Gruppe kann Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn nicht gesetzt, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (`telegram:`- / `tg:`-Präfixe werden normalisiert).
    Legen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Authentifizierung von Gruppenabsendern übernimmt **keine** Genehmigungen aus dem DM-Kopplungsspeicher.
    Kopplung bleibt nur für DMs. Legen Sie für Gruppen `groupAllowFrom` oder gruppen-/themenspezifisches `allowFrom` fest.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Kopplungsspeicher.
    Praktisches Muster für Bots mit einem Owner: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Runtime standardmäßig das Fail-Closed-Verhalten `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht explizit gesetzt ist.

    Gruppeneinrichtung nur für Owner:

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

    Beispiel: jedes Mitglied in einer bestimmten Gruppe erlauben:

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

      - Legen Sie negative Telegram-Gruppen- oder Supergruppen-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie begrenzen möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn Sie möchten, dass jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen kann.

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

    Gruppenverlaufskontext ist für Gruppen immer aktiviert und durch
    `historyLimit` begrenzt. Setzen Sie `channels.telegram.historyLimit: 0`, um das
    Telegram-Gruppenverlaufsfenster zu deaktivieren. Der stillgelegte Schlüssel `includeGroupHistoryContext`
    wird durch `openclaw doctor --fix` entfernt.

    Gruppenchat-ID abrufen:

    - leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie Bot API `getUpdates`
    - nachdem die Gruppe erlaubt wurde, führen Sie `/whoami@<bot_username>` aus, wenn native Befehle aktiviert sind

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört zum Gateway-Prozess.
- Das Routing ist deterministisch: Eingehende Telegram-Antworten gehen zurück an Telegram (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Channel-Umschlag mit Antwortmetadaten, Medien-Platzhaltern und persistiertem Antwortkettenkontext für Telegram-Antworten normalisiert, die das Gateway beobachtet hat.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forumsthemen hängen `:topic:<threadId>` an, damit Themen isoliert bleiben.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw bewahrt sie für Antworten auf. DM-Themensitzungen werden nur aufgeteilt, wenn Telegram `getMe` für den Bot `has_topics_enabled: true` meldet; andernfalls bleiben DMs in der flachen Sitzung.
- Long Polling verwendet den grammY-Runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Concurrency verwendet `agents.defaults.maxConcurrent`.
- Der Start mehrerer Konten begrenzt gleichzeitige Telegram-`getMe`-Probes, damit große Bot-Flotten nicht alle Konto-Probes auf einmal auffächern.
- Long Polling ist innerhalb jedes Gateway-Prozesses abgesichert, sodass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderes OpenClaw-Gateway, Skript oder externer Poller dasselbe Token.
- Neustarts durch den Long-Polling-Watchdog werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung während lang laufender Arbeit weiterhin falsche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` zulässig; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

<Note>
  `channels.telegram.dm.threadReplies` und `channels.telegram.direct.<chatId>.threadReplies` wurden entfernt. Führen Sie nach dem Upgrade `openclaw doctor --fix` aus, wenn Ihre Konfiguration diese Schlüssel noch enthält. DM-Themenrouting folgt nun der Bot-Fähigkeit aus Telegram `getMe.has_topics_enabled`, die vom Threaded Mode in BotFather gesteuert wird: Bots mit aktivierten Themen verwenden threadbezogene DM-Sitzungen, wenn Telegram `message_thread_id` sendet; andere DMs bleiben in der flachen Sitzung.
</Note>

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Anforderung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - kurze initiale Antwortvorschauen werden entprellt und dann nach einer begrenzten Verzögerung materialisiert, wenn der Lauf noch aktiv ist
    - `progress` behält einen bearbeitbaren Statusentwurf für Tool-Fortschritt bei, zeigt die stabile Statusbezeichnung, wenn Antwortaktivität vor Tool-Fortschritt eintrifft, löscht ihn bei Abschluss und sendet die endgültige Antwort als normale Nachricht
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Ausführungsdetails in diesen Tool-Fortschrittszeilen: `raw` (Standard, bewahrt veröffentlichtes Verhalten) oder `status` (nur Tool-Bezeichnung)
    - `streaming.progress.commentary` (Standard: `false`) aktiviert Assistant-Kommentar-/Präambeltext im temporären Fortschrittsentwurf
    - das alte `channels.telegram.streamMode`, boolesche `streaming`-Werte und entfernte native Entwurfsvorschau-Schlüssel werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie zur aktuellen Streaming-Konfiguration zu migrieren

    Tool-Fortschrittsvorschau-Aktualisierungen sind die kurzen Statuszeilen, die angezeigt werden, während Tools laufen, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsaktualisierungen, Patch-Zusammenfassungen oder Codex-Präambel-/Kommentartext im Codex-App-Server-Modus. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` zu entsprechen.

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

    Verwenden Sie den Modus `progress`, wenn Sie sichtbaren Tool-Fortschritt wünschen, ohne die endgültige Antwort in dieselbe Nachricht zu bearbeiten. Legen Sie die Befehls-Text-Richtlinie unter `streaming.progress` ab:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich finale Zustellung wünschen: Telegram-Vorschau-Bearbeitungen sind deaktiviert und allgemeines Tool-/Fortschrittsrauschen wird unterdrückt, statt als eigenständige Statusnachrichten gesendet zu werden. Genehmigungsaufforderungen, Medien-Payloads und Fehler werden weiterhin über die normale finale Zustellung geroutet. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschau-Bearbeitungen beibehalten und gleichzeitig die Tool-Fortschrittsstatuszeilen ausblenden möchten.

    <Note>
      Ausgewählte Telegram-Zitatantworten sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die endgültige Antwort über Telegrams nativen Zitatantwortpfad, statt die Antwortvorschau zu bearbeiten; daher kann `streaming.preview.toolProgress` die kurzen Statuszeilen für diesen Durchlauf nicht anzeigen. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten weiterhin Vorschau-Streaming. Setzen Sie `replyToMode: "off"`, wenn die Sichtbarkeit des Tool-Fortschritts wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Trade-off anzuerkennen.
    </Note>

    Für reine Textantworten:

    - kurze DM-/Gruppen-/Themenvorschauen: OpenClaw behält dieselbe Vorschaunachricht bei und führt die finale Bearbeitung direkt darin aus
    - lange finale Texte, die in mehrere Telegram-Nachrichten aufgeteilt werden, verwenden die vorhandene Vorschau nach Möglichkeit als ersten finalen Abschnitt wieder und senden danach nur die verbleibenden Abschnitte
    - finale Antworten im Fortschrittsmodus löschen den Statusentwurf und verwenden normale finale Zustellung, statt den Entwurf in die Antwort zu bearbeiten
    - wenn die finale Bearbeitung fehlschlägt, bevor der abgeschlossene Text bestätigt wurde, verwendet OpenClaw normale finale Zustellung und bereinigt die veraltete Vorschau

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf normale finale Zustellung zurück und bereinigt anschließend die Vorschaunachricht.

    Vorschau-Streaming ist von Block-Streaming getrennt. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Verhalten des Reasoning-Streams:

    - `/reasoning stream` verwendet den Reasoning-Vorschaupfad eines unterstützten Kanals; auf Telegram streamt es Reasoning während der Generierung in die Live-Vorschau
    - die Reasoning-Vorschau wird nach der finalen Zustellung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
    - die finale Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Rich-Message-Formatierung">
    Ausgehender Text verwendet standardmäßig Telegram-HTML-Nachrichten, damit Antworten in aktuellen Telegram-Clients lesbar bleiben. Dieser Kompatibilitätsmodus unterstützt normales Fett, Kursiv, Links, Code, Spoiler und Zitate, aber keine reinen Rich-Blöcke aus Bot API 10.1 wie native Tabellen, Details, Rich Media und Formeln.

    Setzen Sie `channels.telegram.richMessages: true`, um Bot API 10.1 Rich Messages zu aktivieren:

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
    - Markdown-Text wird über OpenClaws Markdown-IR gerendert und als Telegram-Rich-HTML gesendet.
    - Explizite Rich-HTML-Payloads bewahren unterstützte Bot API 10.1-Tags wie Überschriften, Tabellen, Details, Rich Media und Formeln.
    - Medienbeschriftungen verwenden weiterhin Telegram-HTML-Beschriftungen, weil Rich Messages Beschriftungen nicht ersetzen.

    Dadurch bleibt Modelltext frei von Telegram-Rich-Markdown-Sigillen, sodass Währungsangaben wie `$400-600K` nicht als Mathematik geparst werden. Langer Rich Text wird automatisch über Telegrams Rich-Text- und Rich-Block-Grenzen hinweg aufgeteilt. Tabellen über Telegrams Spaltenlimit werden als Codeblöcke gesendet.

    Standard: aus, wegen Client-Kompatibilität. Rich Messages erfordern kompatible Telegram-Clients; einige aktuelle Desktop-, Web-, Android- und Drittanbieter-Clients zeigen akzeptierte Rich Messages als nicht unterstützt an. Lassen Sie diese Option deaktiviert, sofern nicht jeder mit dem Bot verwendete Client sie rendern kann. `/status` zeigt, ob Rich Messages für die aktuelle Telegram-Sitzung ein- oder ausgeschaltet sind.

    Link-Vorschauen sind standardmäßig aktiviert. `channels.telegram.linkPreview: false` überspringt die automatische Entitätserkennung für Rich Text.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` gehandhabt.

    Standardwerte für native Befehle:

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

    - Namen werden normalisiert (führendes `/` entfernen, Kleinschreibung)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skill-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden eingebaute Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen weiterhin übergelaufen ist; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlägt, während direkte Bot-API-curl-Befehle funktionieren, kann das bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur der Bot-API-Root sein, und `openclaw doctor --fix` entfernt ein versehentlich angehängtes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, daher wird dies nicht als Webhook-Bereinigungsfehler gemeldet.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Geräte-Kopplungsbefehle (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` generiert Einrichtungscode
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. die Anfrage genehmigen:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn nur eine ausstehende Anfrage vorhanden ist
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Der eingebaute Einrichtungscode-Bootstrap gibt ein dauerhaftes Node-Token mit `scopes: []` plus ein begrenztes Operator-Übergabetoken für vertrauenswürdiges mobiles Onboarding zurück. Dieses Operator-Token kann native Konfiguration zur Einrichtungszeit lesen, gewährt aber keine Kopplungs-Mutations-Scopes und kein `operator.admin`.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie vor der Genehmigung erneut `/pair pending` aus.

    Weitere Details: [Koppeln](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Das alte `capabilities: ["inlineButtons"]` wird `inlineButtons: "all"` zugeordnet.

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

    Callback-Klicks, die nicht von einem registrierten interaktiven Plugin-Handler
    beansprucht werden, werden als Text an den Agent weitergegeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agents und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` oder `caption`, optionale `presentation`-Inline-Schaltflächen; reine Schaltflächen-Bearbeitungen aktualisieren das Antwort-Markup)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Channel-Nachrichtenaktionen stellen ergonomische Aliasse bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gate-Steuerungen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Runtime-Sendevorgänge verwenden den aktiven Konfigurations-/Secrets-Snapshot (Start/Neuladen), daher führen Aktionspfade keine Ad-hoc-Neuauflösung von SecretRefs pro Sendevorgang aus.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Tags für Antwort-Threads">
    Telegram unterstützt explizite Tags für Antwort-Threads in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Behandlung:

    - `off` (Standard)
    - `first`
    - `all`

    Wenn Antwort-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, daher werden längere Nachrichten ab dem Anfang zitiert und auf eine einfache Antwort zurückgesetzt, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forum-Themen und Thread-Verhalten">
    Forum-Supergruppen:

    - Themensitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippen zielen auf den Themen-Thread
    - Themenkonfigurationspfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall „Allgemeines Thema“ (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` aus (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur themenbezogen und wird nicht von Gruppenstandards geerbt.
    `topics."*"` legt Standards für jedes Thema in dieser Gruppe fest; exakte Themen-IDs haben weiterhin Vorrang vor `"*"`.

    **Agent-Routing pro Thema**: Jedes Thema kann durch Setzen von `agentId` in der Themenkonfiguration an einen anderen Agent weitergeleitet werden. Dadurch erhält jedes Thema seinen eigenen isolierten Arbeitsbereich, Speicher und seine eigene Sitzung. Beispiel:

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

    **Persistente ACP-Themenbindung**: Forum-Themen können ACP-Harness-Sitzungen über typisierte ACP-Bindungen auf oberster Ebene anheften (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forum-Themen in Gruppen/Supergruppen beschränkt. Siehe [ACP-Agents](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgeaktionen werden direkt dorthin weitergeleitet. OpenClaw heftet die Spawn-Bestätigung im Thema an. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Der Vorlagenkontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten Antwortmetadaten; sie verwenden threadfähige Sitzungsschlüssel nur, wenn Telegram `getMe` für den Bot `has_topics_enabled: true` meldet.
    Die früheren Überschreibungen `dm.threadReplies` und `direct.*.threadReplies` wurden absichtlich außer Betrieb genommen; verwenden Sie den Thread-Modus von BotFather als einzige maßgebliche Quelle und führen Sie `openclaw doctor --fix` aus, um veraltete Konfigurationsschlüssel zu entfernen.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnotizen und Audiodateien.

    - Standard: Audiodatei-Verhalten
    - Tag `[[audio_as_voice]]` in der Agent-Antwort, um den Versand als Sprachnotiz zu erzwingen
    - Eingehende Sprachnotiz-Transkripte werden im Agent-Kontext als maschinell generierter,
      nicht vertrauenswürdiger Text eingerahmt; die Erwähnungserkennung verwendet weiterhin das rohe
      Transkript, sodass durch Erwähnungen gesteuerte Sprachnachrichten weiterhin funktionieren.

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

    - statisches WEBP: wird heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`)
    - animiertes TGS: wird übersprungen
    - Video-WEBM: wird übersprungen

    Sticker-Kontextfelder:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Sticker-Beschreibungen werden im OpenClaw-SQLite-Plugin-Status zwischengespeichert, um wiederholte Vision-Aufrufe zu reduzieren.

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

  <Accordion title="Reaction notifications">
    Telegram-Reaktionen treffen als `message_reaction`-Updates ein (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, stellt OpenClaw Systemereignisse wie diese in die Warteschlange:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best-Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffssteuerungen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktions-Updates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden an die Gruppenchatsitzung weitergeleitet
      - Forum-Gruppen werden an die allgemeine Themengruppe-Sitzung der Gruppe (`:topic:1`) weitergeleitet, nicht an das exakte Ursprungsthema

    `allowed_updates` für Polling/Webhook enthält automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet. `ackReactionScope` entscheidet, *wann* dieses Emoji tatsächlich gesendet wird.

    **Auflösungsreihenfolge für Emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Emoji der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

    **Geltungsbereich (`messages.ackReactionScope`):**

    Der Telegram-Provider liest den Geltungsbereich aus `messages.ackReactionScope` (Standard `"group-mentions"`). Es gibt derzeit keine Überschreibung auf Telegram-Konto- oder Telegram-Kanalebene.

    Werte: `"all"` (DMs + Gruppen), `"direct"` (nur DMs), `"group-all"` (jede Gruppennachricht, keine DMs), `"group-mentions"` (Gruppen, wenn der Bot erwähnt wird; **keine DMs** — dies ist der Standard), `"off"` / `"none"` (deaktiviert).

    <Note>
    Der Standardgeltungsbereich (`"group-mentions"`) löst in Direktnachrichten keine Bestätigungsreaktionen aus. Um eine Bestätigungsreaktion auf eingehende Telegram-DMs zu erhalten, setzen Sie `messages.ackReactionScope` auf `"direct"` oder `"all"`. Der Wert wird beim Start des Telegram-Providers gelesen, daher ist ein Gateway-Neustart erforderlich, damit die Änderung wirksam wird.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
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

  <Accordion title="Long polling vs webhook">
    Standard ist Long Polling. Für den Webhook-Modus legen Sie `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret` fest; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Im Long-Polling-Modus speichert OpenClaw seine Neustart-Watermark erst, nachdem ein Update erfolgreich dispatcht wurde. Wenn ein Handler fehlschlägt, bleibt dieses Update im selben Prozess wiederholbar und wird für die Deduplizierung bei Neustarts nicht als abgeschlossen geschrieben.

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress schalten Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen Sie bewusst `webhookHost: "0.0.0.0"`.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update anschließend asynchron über dieselben pro Chat/pro Thema verwendeten Bot-Lanes wie beim Long Polling, sodass langsame Agentendurchläufe die Zustellungsbestätigung von Telegram nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholungen und CLI-Ziele">
    - Standardwert für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor der Aufteilung nach Länge.
    - `channels.telegram.mediaMaxMb` (Standardwert 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standardwert 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht weiterleitet. Erhöhen Sie den Wert, wenn Albumteile spät eintreffen; verringern Sie ihn, um die Latenz von Albumantworten zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb der 60-Sekunden-Schutzgrenze für ausgehende Text-/Typing-Anfragen, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor OpenClaws Transportschutz und Fallback ausgeführt werden können. Long Polling verwendet weiterhin eine 45-Sekunden-Schutzgrenze für `getUpdates`-Anfragen, damit Leerlauf-Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert nur bei falsch-positiven Neustarts wegen Polling-Stillstand zwischen `30000` und `600000` an.
    - Der Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standardwert 50); `0` deaktiviert ihn.
    - Ergänzender Kontext aus Antworten/Zitaten/Weiterleitungen wird in ein ausgewähltes Gesprächskontextfenster normalisiert, wenn das Gateway die übergeordneten Nachrichten beobachtet hat; der Cache für beobachtete Nachrichten befindet sich im OpenClaw-SQLite-Plugin-Status, und `openclaw doctor --fix` importiert ältere Sidecars. Telegram enthält in Updates nur ein flaches `reply_to_message`, daher sind Ketten, die älter als der Cache sind, auf Telegrams aktuelle Update-Payload begrenzt.
    - Telegram-Allowlists steuern in erster Linie, wer den Agent auslösen kann, nicht eine vollständige Schwelle zur Schwärzung ergänzenden Kontexts.
    - DM-Verlaufssteuerung:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung endgültiger eingehender Antworten verwendet ebenfalls eine begrenzte Safe-Send-Wiederholung für Telegram-Fehler vor dem Verbindungsaufbau, wiederholt jedoch keine mehrdeutigen Netzwerkumschläge nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    CLI- und Nachrichtentool-Sendeziele können eine numerische Chat-ID, ein Benutzername oder ein Forumsthema-Ziel sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram-Polls verwenden `openclaw message poll` und unterstützen Forumsthemen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur für Telegram geltende Poll-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forumsthemen (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um eine angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder, GIFs und Videos als Dokumente statt als komprimierte Foto-, Animationsmedien- oder Video-Uploads zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Polls
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Polls, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Genehmiger-DMs und kann optional Aufforderungen im ursprünglichen Chat oder Thema posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (aktiviert sich automatisch, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Besitzer-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen darf und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Genehmiger. Die erste genehmigte DM-Kopplung initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehlsbesitzer existiert, sodass die Ein-Besitzer-Einrichtung weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Kanalzustellung zeigt den Befehlstext im Chat an; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn die Aufforderung in einem Forumsthema landet, behält OpenClaw das Thema für die Genehmigungsaufforderung und die Nachverfolgung bei. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) erlaubt. Genehmigungs-IDs mit Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn beim Agent ein Zustellungs- oder Provider-Fehler auftritt, steuert die Fehlerrichtlinie, ob Fehlermeldungen an den Telegram-Chat gesendet werden:

| Schlüssel                           | Werte                      | Standard        | Beschreibung                                                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — jede Fehlermeldung an den Chat senden. `once` — jede eindeutige Fehlermeldung einmal pro Cooldown-Fenster senden (wiederholte identische Fehler unterdrücken). `silent` — niemals Fehlermeldungen an den Chat senden.                 |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | Cooldown-Fenster für die `once`-Richtlinie. Nachdem ein Fehler gesendet wurde, wird dieselbe Fehlermeldung unterdrückt, bis dieses Intervall abgelaufen ist. Verhindert Fehlerspam während Ausfällen.                                            |

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
  <Accordion title="Bot antwortet nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false`, muss der Telegram-Privatsphäremodus vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Disable
      - dann den Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; Wildcard `"*"` kann nicht per Mitgliedschaftsprüfung geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - Wenn `channels.telegram.groups` existiert, muss die Gruppe aufgeführt sein (oder `"*"` enthalten).
    - Bot-Mitgliedschaft in der Gruppe verifizieren
    - Logs prüfen: `openclaw logs --follow` für Gründe fürs Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - Autorisieren Sie Ihre Senderidentität (Kopplung und/oder numerisches `allowFrom`).
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist.
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs.
    - `deleteMyCommands`-/`setMyCommands`-Startaufrufe und `sendChatAction`-Typing-Aufrufe sind begrenzt und werden bei Anfrage-Timeout einmal über Telegrams Transport-Fallback wiederholt. Anhaltende Netzwerk-/Fetch-Fehler weisen normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin.

  </Accordion>

  <Accordion title="Start meldet nicht autorisierten Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für den konfigurierten Bot-Token.
    - Kopieren oder generieren Sie den Bot-Token in BotFather erneut, und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; ihn als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler wegen ungültigem Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ plus benutzerdefiniertes Fetch/Proxy kann sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; defekter IPv6-Egress kann intermittierende Telegram-API-Fehler verursachen.
    - Wenn Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese nun als behebbare Netzwerkfehler.
    - Während des Polling-Starts verwendet OpenClaw die erfolgreiche Startprüfung `getMe` für grammY wieder, sodass der Runner kein zweites `getMe` vor dem ersten `getUpdates` benötigt.
    - Wenn `deleteWebhook` während des Polling-Starts mit einem vorübergehenden Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Control-Plane-Aufruf vor dem Polling auszuführen. Ein noch aktiver Webhook erscheint als `getUpdates`-Konflikt; OpenClaw baut dann den Telegram-Transport neu auf und wiederholt die Webhook-Bereinigung.
    - Wenn Telegram-Sockets in einem kurzen festen Takt neu aufgebaut werden, prüfen Sie auf einen niedrigen Wert für `channels.telegram.timeoutSeconds`; Bot-Clients begrenzen konfigurierte Werte unterhalb der Schutzgrenzen für ausgehende Anfragen und `getUpdates`, aber ältere Releases konnten jeden Poll oder jede Antwort abbrechen, wenn dieser Wert unterhalb dieser Schutzgrenzen gesetzt war.
    - Wenn Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport nach standardmäßig 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Startfrist `getUpdates` nicht abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Startfrist `setWebhook` nicht abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe fehlerfrei sind, Ihr Host aber weiterhin falsche Neustarts wegen Polling-Stillstand meldet. Anhaltende Stillstände weisen meist auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Telegram berücksichtigt außerdem Prozess-Proxy-Umgebungsvariablen für den Bot-API-Transport, einschließlich `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und deren Varianten in Kleinbuchstaben. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy über `OPENCLAW_PROXY_URL` für eine Serviceumgebung konfiguriert ist und keine Standard-Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie Telegram-API-Aufrufe auf VPS-Hosts mit instabilem direktem Egress/TLS über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2). Die Reihenfolge der Telegram-DNS-Ergebnisse berücksichtigt zuerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder`, dann den Prozessstandard wie `NODE_OPTIONS=--dns-result-order=ipv4first`; wenn nichts davon zutrifft, fällt Node 22+ auf `ipv4first` zurück.
    - Wenn Ihr Host WSL2 ist oder ausdrücklich besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind
      für Telegram-Mediendownloads bereits standardmäßig erlaubt. Wenn eine
      vertrauenswürdige Fake-IP oder ein transparenter Proxy `api.telegram.org`
      während Mediendownloads auf eine andere private/interne/Special-Use-Adresse
      umschreibt, können Sie den nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Opt-in-Option ist pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts zu `198.18.x.x` auflöst, lassen Sie das
      gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den
      RFC-2544-Benchmark-Bereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt die
      SSRF-Schutzmaßnahmen für Telegram-Medien. Verwenden Sie es nur für
      vertrauenswürdige, vom Betreiber kontrollierte Proxy-Umgebungen wie Clash-,
      Mihomo- oder Surge-Fake-IP-Routing, wenn diese private oder
      Special-Use-Antworten außerhalb des RFC-2544-Benchmark-Bereichs erzeugen.
      Lassen Sie es für normalen öffentlichen Internetzugriff auf Telegram deaktiviert.
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

Weitere Hilfe: [Kanal-Fehlerbehebung](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Telegram-Felder mit hoher Aussagekraft">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Themen-Standards: `groups.<chatId>.topics."*"` gilt für nicht übereinstimmende Forumthemen; exakte Themen-IDs überschreiben ihn
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehle/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`
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
Multi-Account-Priorität: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück, und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine `accounts.default.*`-Werte.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Allowlists für Gruppen und Themen.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Gruppen und Themen Agenten zuordnen.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen.
  </Card>
</CardGroup>
