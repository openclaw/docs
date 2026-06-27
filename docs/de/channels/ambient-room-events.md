---
read_when:
    - Immer aktive Gruppen- oder Kanalräume konfigurieren
    - Sie möchten, dass der Agent den Raum-Chat beobachtet, ohne automatisch finalen Text zu posten
    - Debuggen von Tippen und Token-Nutzung ohne sichtbare Raumnachricht
sidebarTitle: Ambient room events
summary: Unterstützte Gruppenräume sollen stillen Kontext bereitstellen, es sei denn, der Agent sendet mit dem Nachrichtentool
title: Ambient-Raumereignisse
x-i18n:
    generated_at: "2026-06-27T17:09:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Ambient Room Events ermöglichen es OpenClaw, nicht erwähnte Gruppen- oder Channel-Unterhaltungen als stillen Kontext zu verarbeiten. Der Agent kann Speicher und Sitzungsstatus aktualisieren, aber der Raum bleibt still, solange der Agent nicht ausdrücklich das Tool `message` aufruft.

Für Always-on-Gruppenchats ist dies der empfohlene Modus: Kombinieren Sie `messages.groupChat.unmentionedInbound: "room_event"` mit `messages.groupChat.visibleReplies: "message_tool"`. Verwenden Sie ihn, wenn der Agent zuhören, entscheiden soll, wann eine Antwort sinnvoll ist, und das alte Prompt-Muster vermeiden soll, mit `NO_REPLY` zu antworten.

Heute unterstützt: Discord-Guild-Channels, Slack-Channels und private Channels, Slack-Mehrpersonen-DMs sowie Telegram-Gruppen oder Supergruppen. Andere Gruppen-Channels behalten ihr bestehendes Gruppenverhalten bei, sofern ihre Channel-Seite nicht angibt, dass sie Ambient Room Events unterstützen.

## Empfohlene Einrichtung

Legen Sie das globale Gruppenchat-Verhalten fest:

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

Konfigurieren Sie dann den Raum selbst als Always-on, indem Sie Mention Gating für diesen Raum deaktivieren. Der Channel muss weiterhin durch seine normale `groupPolicy`, die Raum-Allowlist und die Absender-Allowlist zugelassen sein.

Nach dem Speichern der Konfiguration lädt der Gateway die `messages`-Einstellungen per Hot Reload neu. Starten Sie nur neu, wenn Dateiüberwachung oder Konfigurationsneuladung deaktiviert ist.

## Was sich ändert

Mit `messages.groupChat.unmentionedInbound: "room_event"`:

- nicht erwähnte zugelassene Gruppen- oder Channel-Nachrichten werden zu stillen Room Events
- erwähnte Nachrichten bleiben Benutzeranfragen
- Textbefehle und native Befehle bleiben Benutzeranfragen
- Abbruch- oder Stoppanfragen bleiben Benutzeranfragen
- Direktnachrichten bleiben Benutzeranfragen

Room Events verwenden strikt sichtbare Zustellung. Abschließender Assistententext ist privat. Der Agent muss `message(action=send)` aufrufen, um im Raum zu posten.

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

Verwenden Sie eine Channel-spezifische Discord-Konfiguration, wenn nur ein Channel ambient sein soll:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
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

Slack-Channel-Allowlists sind ID-first. Verwenden Sie Channel-IDs wie `C12345678`, nicht `#channel-name`.

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
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram-Beispiel

Für Telegram-Gruppen muss der Bot normale Gruppennachrichten sehen können. Wenn `requireMention: false`, deaktivieren Sie den Datenschutzmodus in BotFather oder verwenden Sie eine andere Telegram-Einrichtung, die den vollständigen Gruppenverkehr an den Bot übermittelt.

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

Telegram-Gruppen-IDs sind normalerweise negative Zahlen wie `-1001234567890`. Lesen Sie `chat.id` aus `openclaw logs --follow`, leiten Sie eine Gruppennachricht an einen ID-Hilfsbot weiter oder prüfen Sie `getUpdates` der Bot API.

## Agentenspezifische Richtlinie

Verwenden Sie eine Agentenüberschreibung, wenn mehrere Agenten denselben Raum teilen, aber nur einer nicht erwähnte Unterhaltungen als ambienten Kontext behandeln soll:

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

Der Agent-spezifische Wert `agents.list[].groupChat.unmentionedInbound` überschreibt `messages.groupChat.unmentionedInbound` für diesen Agenten.

## Modi für sichtbare Antworten

`messages.groupChat.visibleReplies` ist für normale Gruppen-/Channel-Benutzeranfragen standardmäßig `"automatic"`. Behalten Sie diesen Standard bei, wenn abschließender Assistententext sichtbar gepostet werden soll, ohne dass ein ausdrücklicher message-tool-Aufruf erforderlich ist.

Für ambiente Always-on-Räume wird `messages.groupChat.visibleReplies: "message_tool"` weiterhin empfohlen, besonders mit Modellen der neuesten Generation, die Tools zuverlässig nutzen, wie GPT 5.5. Dadurch kann der Agent per Aufruf des Message Tools entscheiden, wann er spricht. Wenn das Modell abschließenden Text zurückgibt, ohne das Tool aufzurufen, hält OpenClaw diesen Abschlusstext privat und protokolliert Metadaten zur unterdrückten Zustellung.

Room Events bleiben strikt, selbst wenn andere Gruppenanfragen automatische Antworten verwenden. Nicht erwähnte ambiente Room Events benötigen weiterhin `message(action=send)` für sichtbare Ausgabe.

## Verlauf

`messages.groupChat.historyLimit` steuert den globalen Standard für Gruppenverlauf. Channels können ihn mit `channels.<channel>.historyLimit` überschreiben, und einige Channels unterstützen außerdem Verlaufslimits pro Konto.

Setzen Sie `historyLimit: 0`, um den Gruppenverlaufskontext zu deaktivieren.

Unterstützte Room-Event-Channels behalten aktuelle ambiente Raumnachrichten als Kontext. Discord behält den Room-Event-Verlauf bei, bis ein sichtbarer Discord-Sendevorgang erfolgreich ist, sodass stiller Kontext vor der Zustellung über das Message Tool nicht verloren geht.

## Fehlerbehebung

Wenn der Raum Tippen oder Token-Nutzung anzeigt, aber keine sichtbare Nachricht:

1. Bestätigen Sie, dass der Raum durch die Channel-Allowlist und Absender-Allowlist zugelassen ist.
2. Bestätigen Sie, dass `requireMention: false` auf der erwarteten Raumebene gesetzt ist.
3. Prüfen Sie, ob `messages.groupChat.unmentionedInbound` oder die Agentenüberschreibung `"room_event"` ist.
4. Prüfen Sie Logs auf Metadaten zu unterdrückten abschließenden Payloads oder `didSendViaMessagingTool: false`.
5. Für normale Gruppenanfragen behalten Sie `messages.groupChat.visibleReplies: "automatic"` bei oder stellen Sie es wieder her, wenn abschließende Antworten automatisch gepostet werden sollen. Für ambiente Räume mit `message_tool` verwenden Sie ein Modell/eine Runtime, das/die Tools zuverlässig aufruft.

Wenn ambiente Telegram-Räume überhaupt nicht auslösen, prüfen Sie den Datenschutzmodus in BotFather und verifizieren Sie, dass der Gateway normale Gruppennachrichten empfängt.

Wenn ambiente Slack-Räume nicht auslösen, verifizieren Sie, dass der Channel-Schlüssel die Slack-Channel-ID ist und die App den erforderlichen Scope `channels:history` oder `groups:history` für diesen Raumtyp hat.

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Discord](/de/channels/discord)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
- [Channel-Fehlerbehebung](/de/channels/troubleshooting)
- [Referenz zur Channel-Konfiguration](/de/gateway/config-channels)
