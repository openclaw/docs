---
read_when:
    - Von Bots verfasste Kanalnachrichten konfigurieren
    - Optimierung des Schutzes vor Bot-zu-Bot-Schleifen
sidebarTitle: Bot loop protection
summary: Standardeinstellungen für den Schutz vor Bot-zu-Bot-Schleifen und kanalspezifische Überschreibungen
title: Schutz vor Bot-Schleifen
x-i18n:
    generated_at: "2026-07-24T04:51:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d59d3b48dd5506e774282b880334df8970b05c4d001261ff7107e8e1678894db
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw kann Nachrichten annehmen, die von anderen Bots in Channels verfasst wurden, die `allowBots` unterstützen. Wenn dieser Pfad aktiviert ist, verhindert der Schutz vor Paar-Endlosschleifen, dass zwei Bot-Identitäten einander unbegrenzt antworten.

Der Schutz wird durch den zentralen Runner für eingehende Antworten durchgesetzt. Jeder unterstützende Channel ordnet sein eingehendes Ereignis generischen Fakten zu: Konto oder Geltungsbereich, Konversations-ID, ID des sendenden Bots und ID des empfangenden Bots. Der Core verfolgt das Teilnehmerpaar in beiden Richtungen (A zu B und B zu A gelten als dasselbe Paar), wendet ein Budget mit gleitendem Zeitfenster an und unterdrückt das Paar für eine Abkühlzeit, nachdem das Budget überschritten wurde.

## Standardwerte

Der Schutz vor Paar-Endlosschleifen ist immer aktiv, wenn ein Channel zulässt, dass von Bots verfasste Nachrichten die Weiterleitung erreichen. Integrierte Standardwerte:

| Schlüssel             | Standardwert | Bedeutung                                                   |
| -------------------- | ------- | --------------------------------------------------- |
| `enabled`            | `true`  | Schutz für Channels aktiv, die ihn unterstützen.            |
| `maxEventsPerWindow` | `20`    | Ereignisse, die ein Bot-Paar innerhalb des Zeitfensters austauschen kann. |
| `windowSeconds`      | `60`    | Länge des gleitenden Zeitfensters.                           |
| `cooldownSeconds`    | `60`    | Unterdrückungsdauer, nachdem das Paar das Budget überschreitet. |

Der Schutz wirkt sich nicht auf von Menschen verfasste Nachrichten, Bereitstellungen mit einem einzelnen Bot, die Filterung eigener Nachrichten oder Bot-Antworten aus, die unter dem Budget bleiben.

## Gemeinsame Standardwerte konfigurieren

Legen Sie `channels.defaults.botLoopProtection` einmal fest, um allen unterstützenden Channels dieselbe Ausgangskonfiguration zuzuweisen. Channels können außerdem spezifischere Überschreibungen bereitstellen; Feishu verwendet absichtlich nur diese gemeinsame Ausgangskonfiguration.

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

Legen Sie `enabled: false` nur fest, wenn Ihre Channel-Richtlinie Bot-zu-Bot-Konversationen absichtlich ohne automatische Unterdrückung zulässt.

## Nach Channel, Konto oder Raum überschreiben

Unterstützende Channels legen ihre eigene Konfiguration Schlüssel für Schlüssel über den gemeinsamen Standardwert. Rangfolge, beginnend mit der spezifischsten Einstellung:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, wenn der Channel Überschreibungen pro Konversation unterstützt
2. `channels.<channel>.accounts.<account>.botLoopProtection`, wenn der Channel Konten unterstützt
3. `channels.<channel>.botLoopProtection`, wenn der Channel Standardwerte auf oberster Ebene unterstützt
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
          allowBots: true,
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

## Channel-Unterstützung

- Discord: native `author.bot`-Fakten, nach Discord-Konto, Channel und Bot-Paar aufgeschlüsselt.
- Feishu: native `sender_type=bot`-Fakten für zugelassene, von Bots verfasste Gruppennachrichten, nach Feishu-Konto, Chat und Bot-Paar aufgeschlüsselt. Feishu verwendet nur `channels.defaults.botLoopProtection`.
- Google Chat: native `sender.type=BOT`-Fakten für akzeptierte, von Bots verfasste Nachrichten, nach Konto, Space und Bot-Paar aufgeschlüsselt.
- Matrix: konfigurierte Matrix-Bot-Konten, nach Matrix-Konto, Raum und konfiguriertem Bot-Paar aufgeschlüsselt.
- Slack: native `bot_id`-Fakten für akzeptierte, von Bots verfasste Nachrichten, nach Slack-Konto, Channel und Bot-Paar aufgeschlüsselt.

Channels, die keine zuverlässige Identität des eingehenden Bots bereitstellen, verwenden weiterhin ihre normalen Filter für eigene Nachrichten und Zugriffsrichtlinien. Sie sollten diesen Schutz erst aktivieren, wenn sie beide Teilnehmer des Bot-Paars identifizieren können.

Implementierungsdetails für Plugins finden Sie unter [SDK-Laufzeit](/de/plugins/sdk-runtime#reusable-runtime-utilities).
