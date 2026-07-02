---
read_when:
    - Immer aktive Gruppen- oder Kanalräume konfigurieren
    - Sie möchten, dass der Agent Raumgespräche beobachtet, ohne automatisch finalen Text zu posten
    - Debugging von Eingaben und Token-Nutzung ohne sichtbare Raumnachricht
sidebarTitle: Ambient room events
summary: Lassen Sie unterstützte Gruppenräume stillen Kontext bereitstellen, sofern der Agent nicht mit dem Nachrichtentool sendet.
title: Raumereignisse im Hintergrund
x-i18n:
    generated_at: "2026-07-02T17:34:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Ambient-Raumereignisse ermöglichen OpenClaw, nicht erwähnte Gruppen- oder Kanalunterhaltungen als stillen Kontext zu verarbeiten. Der Agent kann Speicher und Sitzungsstatus aktualisieren, aber der Raum bleibt still, sofern der Agent nicht ausdrücklich das `message`-Tool aufruft.

Für dauerhaft aktive Gruppenchats ist dies der empfohlene Modus: Kombinieren Sie `messages.groupChat.unmentionedInbound: "room_event"` mit `messages.groupChat.visibleReplies: "message_tool"`. Verwenden Sie ihn, wenn der Agent zuhören, entscheiden soll, wann eine Antwort hilfreich ist, und das alte Prompt-Muster vermeiden soll, mit `NO_REPLY` zu antworten.

Heute unterstützt: Discord-Guild-Kanäle, Slack-Kanäle und private Kanäle, Slack-Mehrpersonen-DMs sowie Telegram-Gruppen oder Supergroups. Andere Gruppenkanäle behalten ihr bestehendes Gruppenverhalten bei, sofern ihre Kanalseite nicht angibt, dass sie Ambient-Raumereignisse unterstützen.

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

Konfigurieren Sie dann den Raum selbst als dauerhaft aktiv, indem Sie die Erwähnungsprüfung für diesen Raum deaktivieren. Der Kanal muss weiterhin durch seine normale `groupPolicy`, die Raum-Allowlist und die Absender-Allowlist erlaubt sein.

Nach dem Speichern der Konfiguration lädt der Gateway die `messages`-Einstellungen per Hot Reload neu. Starten Sie nur neu, wenn Dateiüberwachung oder Konfigurations-Neuladen deaktiviert ist.

## Was sich ändert

Mit `messages.groupChat.unmentionedInbound: "room_event"`:

- nicht erwähnte erlaubte Gruppen- oder Kanalnachrichten werden zu stillen Raumereignissen
- erwähnte Nachrichten bleiben Benutzeranfragen
- Textbefehle und native Befehle bleiben Benutzeranfragen
- Abbruch- oder Stoppanfragen bleiben Benutzeranfragen
- Direktnachrichten bleiben Benutzeranfragen

Raumereignisse verwenden strikt sichtbare Zustellung. Abschließender Assistant-Text ist privat. Der Agent muss `message(action=send)` aufrufen, um im Raum zu posten.

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

Verwenden Sie eine kanalbezogene Discord-Konfiguration, wenn nur ein Kanal ambient sein soll:

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

Slack-Kanal-Allowlists sind ID-first. Verwenden Sie Kanal-IDs wie `C12345678`, nicht `#channel-name`.

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

Für Telegram-Gruppen muss der Bot normale Gruppennachrichten sehen können. Wenn `requireMention: false` gesetzt ist, deaktivieren Sie den BotFather-Privatsphäremodus oder verwenden Sie eine andere Telegram-Einrichtung, die vollständigen Gruppenverkehr an den Bot liefert.

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

Telegram-Gruppen-IDs sind üblicherweise negative Zahlen wie `-1001234567890`. Lesen Sie `chat.id` aus `openclaw logs --follow`, leiten Sie eine Gruppennachricht an einen ID-Hilfsbot weiter oder prüfen Sie Bot API `getUpdates`.

## Agent-spezifische Richtlinie

Verwenden Sie eine Agent-Überschreibung, wenn mehrere Agenten denselben Raum teilen, aber nur einer nicht erwähnte Unterhaltung als ambienten Kontext behandeln soll:

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

`messages.groupChat.visibleReplies` ist standardmäßig `"automatic"` für normale Gruppen-/Kanal-Benutzeranfragen. Behalten Sie diese Standardeinstellung bei, wenn abschließender Assistant-Text sichtbar gepostet werden soll, ohne dass ein expliziter Nachrichten-Tool-Aufruf erforderlich ist.

Für ambient dauerhaft aktive Räume wird `messages.groupChat.visibleReplies: "message_tool"` weiterhin empfohlen, besonders mit tool-zuverlässigen Modellen der neuesten Generation wie GPT 5.5. Dadurch kann der Agent entscheiden, wann er spricht, indem er das Nachrichten-Tool aufruft. Wenn das Modell abschließenden Text zurückgibt, ohne das Tool aufzurufen, hält OpenClaw diesen abschließenden Text privat und protokolliert Metadaten zur unterdrückten Zustellung.

Raumereignisse bleiben strikt, auch wenn andere Gruppenanfragen automatische Antworten verwenden. Nicht erwähnte ambient Raumereignisse erfordern weiterhin `message(action=send)` für sichtbare Ausgabe.

## Verlauf

`messages.groupChat.historyLimit` steuert den globalen Standard für Gruppenverlauf. Kanäle können ihn mit `channels.<channel>.historyLimit` überschreiben, und einige Kanäle unterstützen auch verlaufsbezogene Limits pro Konto.

Setzen Sie `historyLimit: 0`, um Gruppenverlaufskontext zu deaktivieren.

Unterstützte Raumereignis-Kanäle behalten aktuelle ambiente Raumnachrichten als Kontext. Telegram behält ein dauerhaft aktives rollierendes Fenster pro Gruppe, begrenzt durch `historyLimit`; Benutzeranfrage-Turns wählen Einträge nach der letzten aufgezeichneten Antwort des Bots aus, während Raumereignis-Turns das vollständige aktuelle Fenster erhalten, damit das Modell seine eigenen aktuellen Beiträge sehen kann. Der entfernte Telegram-Modusschlüssel `includeGroupHistoryContext` wird durch `openclaw doctor --fix` entfernt.

## Fehlerbehebung

Wenn der Raum Tippen oder Token-Nutzung anzeigt, aber keine sichtbare Nachricht:

1. Bestätigen Sie, dass der Raum durch die Kanal-Allowlist und Absender-Allowlist erlaubt ist.
2. Bestätigen Sie, dass `requireMention: false` auf der erwarteten Raumebene gesetzt ist.
3. Prüfen Sie, ob `messages.groupChat.unmentionedInbound` oder die Agent-Überschreibung `"room_event"` ist.
4. Prüfen Sie die Logs auf Metadaten zu unterdrückter finaler Nutzlast oder `didSendViaMessagingTool: false`.
5. Behalten Sie für normale Gruppenanfragen `messages.groupChat.visibleReplies: "automatic"` bei oder stellen Sie es wieder her, wenn finale Antworten automatisch gepostet werden sollen. Verwenden Sie für ambiente Räume mit `message_tool` ein Modell/eine Runtime, das bzw. die zuverlässig Tools aufruft.

Wenn ambiente Telegram-Räume gar nicht auslösen, prüfen Sie den BotFather-Privatsphäremodus und verifizieren Sie, dass der Gateway normale Gruppennachrichten empfängt.

Wenn ambiente Slack-Räume nicht auslösen, verifizieren Sie, dass der Kanalschlüssel die Slack-Kanal-ID ist und die App den erforderlichen Scope `channels:history` oder `groups:history` für diesen Raumtyp hat.

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Discord](/de/channels/discord)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
- [Referenz zur Kanalkonfiguration](/de/gateway/config-channels)
