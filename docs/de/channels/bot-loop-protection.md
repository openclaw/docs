---
read_when:
    - Von Bots verfasste Kanalnachrichten konfigurieren
    - Abstimmung des Schutzes vor Bot-zu-Bot-Schleifen
sidebarTitle: Bot loop protection
summary: Standardeinstellungen für den Schutz vor Bot-zu-Bot-Schleifen und kanalspezifische Überschreibungen
title: Schutz vor Bot-Schleifen
x-i18n:
    generated_at: "2026-07-12T01:21:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw kann Nachrichten akzeptieren, die von anderen Bots in Kanälen verfasst wurden, die `allowBots` unterstützen. Wenn dieser Pfad aktiviert ist, verhindert der Schutz vor Paarschleifen, dass zwei Bot-Identitäten einander unbegrenzt antworten.

Der Schutz wird durch den zentralen Runner für eingehende Antworten durchgesetzt. Jeder unterstützende Kanal ordnet sein eingehendes Ereignis generischen Fakten zu: Konto oder Geltungsbereich, Konversations-ID, Bot-ID des Absenders und Bot-ID des Empfängers. Der Kern erfasst das Teilnehmerpaar in beiden Richtungen (A zu B und B zu A gelten als dasselbe Paar), wendet ein Budget innerhalb eines gleitenden Zeitfensters an und unterdrückt das Paar während einer Abkühlzeit, nachdem das Budget überschritten wurde.

## Standardwerte

Der Schutz vor Paarschleifen ist immer aktiv, wenn ein Kanal von Bots verfasste Nachrichten an die Verarbeitung weiterleitet. Integrierte Standardwerte:

| Schlüssel             | Standardwert | Bedeutung                                                   |
| --------------------- | ------------ | ----------------------------------------------------------- |
| `enabled`             | `true`       | Schutz für Kanäle aktiv, die ihn unterstützen.               |
| `maxEventsPerWindow`  | `20`         | Ereignisse, die ein Bot-Paar innerhalb des Fensters austauschen kann. |
| `windowSeconds`       | `60`         | Länge des gleitenden Zeitfensters.                           |
| `cooldownSeconds`     | `60`         | Unterdrückungsdauer, nachdem das Paar das Budget überschritten hat. |

Der Schutz wirkt sich nicht auf von Menschen verfasste Nachrichten, Bereitstellungen mit nur einem Bot, die Filterung eigener Nachrichten oder Bot-Antworten aus, die unter dem Budget bleiben.

## Gemeinsame Standardwerte konfigurieren

Legen Sie `channels.defaults.botLoopProtection` einmal fest, um jedem unterstützenden Kanal dieselbe Ausgangskonfiguration zu geben. Überschreibungen für Kanäle, Konten und Räume können einzelne Bereiche weiterhin individuell anpassen.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

Legen Sie `enabled: false` nur fest, wenn Ihre Kanalrichtlinie Bot-zu-Bot-Konversationen bewusst ohne automatische Unterdrückung zulässt.

## Pro Kanal, Konto oder Raum überschreiben

Unterstützende Kanäle legen ihre eigene Konfiguration Schlüssel für Schlüssel über den gemeinsamen Standardwert. Priorität, beginnend mit der spezifischsten Ebene:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, wenn der Kanal konversationsspezifische Überschreibungen unterstützt
2. `channels.<channel>.accounts.<account>.botLoopProtection`, wenn der Kanal Konten unterstützt
3. `channels.<channel>.botLoopProtection`, wenn der Kanal Standardwerte auf oberster Ebene unterstützt
4. `channels.defaults.botLoopProtection`
5. integrierte Standardwerte

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Kanalunterstützung

- Discord: native `author.bot`-Fakten, nach Discord-Konto, Kanal und Bot-Paar getrennt.
- Google Chat: native `sender.type=BOT`-Fakten für akzeptierte, von Bots verfasste Nachrichten, nach Konto, Bereich und Bot-Paar getrennt.
- Matrix: konfigurierte Matrix-Bot-Konten, nach Matrix-Konto, Raum und konfiguriertem Bot-Paar getrennt.
- Slack: native `bot_id`-Fakten für akzeptierte, von Bots verfasste Nachrichten, nach Slack-Konto, Kanal und Bot-Paar getrennt.

Kanäle, die keine zuverlässige eingehende Bot-Identität bereitstellen, verwenden weiterhin ihre normalen Filter für eigene Nachrichten und Zugriffsrichtlinien. Sie sollten diesen Schutz erst aktivieren, wenn sie beide Teilnehmer des Bot-Paars identifizieren können.

Implementierungsdetails für Plugins finden Sie unter [SDK-Laufzeit](/de/plugins/sdk-runtime#reusable-runtime-utilities).
