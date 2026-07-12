---
read_when:
    - Konfigurieren von dauerhaft aktiven Gruppen- oder Kanalräumen
    - Sie möchten, dass der Agent die Unterhaltung im Raum verfolgt, ohne automatisch abschließenden Text zu veröffentlichen
    - Fehlerbehebung bei Eingabeanzeige und Token-Nutzung ohne sichtbare Nachricht im Raum
sidebarTitle: Ambient room events
summary: Unterstützte Gruppenräume liefern stillen Kontext, sofern der Agent nicht über das Nachrichten-Tool sendet
title: Umgebungsereignisse im Raum
x-i18n:
    generated_at: "2026-07-12T14:59:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Umgebungsereignisse in Räumen ermöglichen es OpenClaw, nicht erwähnte Unterhaltungen in Gruppen oder Kanälen als stillen Kontext zu verarbeiten. Der Agent kann den Speicher und den Sitzungsstatus aktualisieren, aber der Raum bleibt still, sofern der Agent nicht ausdrücklich das `message`-Tool aufruft.

Kombinieren Sie für ständig aktive Gruppenchats `messages.groupChat.unmentionedInbound: "room_event"` mit `messages.groupChat.visibleReplies: "message_tool"`. Der Agent hört zu, entscheidet, wann eine Antwort sinnvoll ist, und benötigt nie das alte Prompt-Muster, mit `NO_REPLY` zu antworten.

Derzeit unterstützt: Discord-Serverkanäle, Slack-Kanäle und private Kanäle, Slack-Direktnachrichten mit mehreren Personen sowie Telegram-Gruppen oder -Supergruppen. Andere Gruppenkanäle behalten ihr bestehendes Gruppenverhalten bei, sofern auf ihrer Kanalseite nicht angegeben ist, dass sie Umgebungsereignisse in Räumen unterstützen.

## Empfohlene Einrichtung

Legen Sie das globale Verhalten für Gruppenchats fest:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Machen Sie den Raum anschließend ständig aktiv, indem Sie die Erwähnungsprüfung für diesen Raum deaktivieren. Der Raum muss weiterhin seine normale `groupPolicy`, Raum-Zulassungsliste und Absender-Zulassungsliste erfüllen.

Nach dem Speichern der Konfiguration übernimmt der Gateway die `messages`-Einstellungen dynamisch. Starten Sie ihn nur neu, wenn die Dateiüberwachung oder das Neuladen der Konfiguration deaktiviert ist (`gateway.reload.mode: "off"`).

## Was sich ändert

Mit `messages.groupChat.unmentionedInbound: "room_event"`:

- werden zulässige, nicht erwähnte Gruppen- oder Kanalnachrichten zu stillen Raumereignissen
- bleiben Nachrichten mit Erwähnungen Benutzeranfragen
- bleiben textbasierte Steuerbefehle und native Befehle Benutzeranfragen
- bleiben Abbruch- oder Stoppanfragen Benutzeranfragen
- bleiben Direktnachrichten Benutzeranfragen

Raumereignisse verwenden eine strikt kontrollierte sichtbare Zustellung. Der abschließende Assistententext bleibt privat. Der Agent muss `message(action=send)` aufrufen, um im Raum zu posten.

Reaktionen für Tipp- und Lebenszyklusstatus bleiben bei Raumereignissen unterdrückt. Die einzige ausdrückliche Ausnahme für Empfangsbestätigungen ist `messages.ackReactionScope: "all"`, wodurch die konfigurierte Bestätigungsreaktion gesendet wird. Verwenden Sie einen engeren Geltungsbereich oder `"off"`, wenn der Raum vollständig still bleiben muss.

## Discord-Beispiel

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Verwenden Sie eine kanalspezifische Discord-Konfiguration, wenn nur ein Kanal Umgebungsereignisse verarbeiten soll. Unter `groupPolicy: "allowlist"` wird der Kanal durch seine Auflistung zugelassen (`enabled: false` deaktiviert einen Eintrag):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Slack-Beispiel

Slack-Kanal-Zulassungslisten verwenden vorrangig IDs. Verwenden Sie Kanal-IDs wie `C12345678`, nicht `#channel-name`. Der Kanal wird durch seine Auflistung unter `channels.slack.channels` zugelassen (`enabled: false` deaktiviert einen Eintrag):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram-Beispiel

Bei Telegram-Gruppen muss der Bot normale Gruppennachrichten sehen können. Wenn `requireMention: false` gesetzt ist, deaktivieren Sie den Datenschutzmodus von BotFather oder verwenden Sie eine andere Telegram-Einrichtung, die den vollständigen Gruppenverkehr an den Bot übermittelt.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Telegram-Gruppen-IDs sind üblicherweise negative Zahlen wie `-1001234567890`. Lesen Sie `chat.id` aus `openclaw logs --follow`, leiten Sie eine Gruppennachricht an einen Hilfs-Bot zur ID-Ermittlung weiter oder prüfen Sie `getUpdates` der Bot API.

## Agentenspezifische Richtlinie

Verwenden Sie eine Agentenüberschreibung, wenn mehrere Agenten denselben Raum nutzen, aber nur einer nicht erwähnte Unterhaltungen als Umgebungskontext behandeln soll:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

Der agentenspezifische Wert `agents.list[].groupChat.unmentionedInbound` überschreibt `messages.groupChat.unmentionedInbound` für diesen Agenten.

## Modi für sichtbare Antworten

`messages.groupChat.visibleReplies` verwendet standardmäßig `"automatic"` für normale Benutzeranfragen in Gruppen oder Kanälen. Behalten Sie diese Voreinstellung bei, wenn der abschließende Assistententext ohne ausdrücklichen Aufruf des Nachrichten-Tools sichtbar gepostet werden soll.

Für ständig aktive Räume mit Umgebungsereignissen wird `messages.groupChat.visibleReplies: "message_tool"` weiterhin empfohlen, insbesondere mit Modellen der neuesten Generation, die Tools zuverlässig verwenden, wie GPT-5.6 Sol. Dadurch kann der Agent durch Aufruf des Nachrichten-Tools entscheiden, wann er antwortet. Wenn das Modell abschließenden Text zurückgibt, ohne das Tool aufzurufen, hält OpenClaw diesen Text privat und protokolliert Metadaten zur unterdrückten Zustellung.

Raumereignisse bleiben strikt, auch wenn andere Gruppenanfragen automatische Antworten verwenden. Nicht erwähnte Umgebungsereignisse in Räumen erfordern für eine sichtbare Ausgabe immer `message(action=send)`.

## Verlauf

`messages.groupChat.historyLimit` legt die globale Voreinstellung für den Gruppenverlauf fest (50, wenn nicht gesetzt; muss eine positive Ganzzahl sein). Kanäle können diesen Wert mit `channels.<channel>.historyLimit` überschreiben, und einige Kanäle unterstützen außerdem kontospezifische Verlaufslimits. Setzen Sie `historyLimit: 0` auf Kanalebene, um den Gruppenverlaufskontext für diesen Kanal zu deaktivieren.

Kanäle, die Raumereignisse unterstützen, behalten aktuelle Umgebungsnachrichten des Raums als Kontext bei. Telegram führt pro Gruppe ein ständig aktives, durch `historyLimit` begrenztes rollierendes Fenster. Bei Benutzeranfragen werden Einträge nach der letzten aufgezeichneten Antwort des Bots ausgewählt, während Raumereignisse das gesamte aktuelle Fenster erhalten, damit das Modell seine eigenen kürzlich veröffentlichten Beiträge sehen kann. Der eingestellte Telegram-Modusschlüssel `includeGroupHistoryContext` wird durch `openclaw doctor --fix` entfernt.

## Fehlerbehebung

Wenn im Raum Tippaktivität oder Token-Nutzung angezeigt wird, aber keine sichtbare Nachricht erscheint:

1. Vergewissern Sie sich, dass der Raum durch die Kanal-Zulassungsliste und die Absender-Zulassungsliste zugelassen ist.
2. Vergewissern Sie sich, dass `requireMention: false` auf der erwarteten Raumebene gesetzt ist.
3. Prüfen Sie, ob `messages.groupChat.unmentionedInbound` oder die Agentenüberschreibung auf `"room_event"` gesetzt ist.
4. Prüfen Sie die Protokolle auf Metadaten zu unterdrückten abschließenden Nutzdaten oder `didSendViaMessagingTool: false`.
5. Behalten Sie bei normalen Gruppenanfragen `messages.groupChat.visibleReplies: "automatic"` bei oder stellen Sie es wieder her, wenn abschließende Antworten automatisch gepostet werden sollen. Verwenden Sie für Räume mit Umgebungsereignissen und `message_tool` ein Modell beziehungsweise eine Laufzeit, die Tools zuverlässig aufruft.

Wenn Telegram-Räume mit Umgebungsereignissen überhaupt nicht ausgelöst werden, prüfen Sie den Datenschutzmodus von BotFather und vergewissern Sie sich, dass der Gateway normale Gruppennachrichten empfängt.

Wenn Slack-Räume mit Umgebungsereignissen nicht ausgelöst werden, vergewissern Sie sich, dass der Kanalschlüssel die Slack-Kanal-ID ist und die App über den Verlaufsbereich für diesen Raumtyp verfügt: `channels:history` (öffentlich), `groups:history` (privat) oder `mpim:history` (Direktnachrichten mit mehreren Personen).

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Discord](/de/channels/discord)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
- [Referenz zur Kanalkonfiguration](/de/gateway/config-channels)
