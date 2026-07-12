---
read_when:
    - Von Bots verfasste Kanalnachrichten konfigurieren
    - Optimierung des Schutzes vor Bot-zu-Bot-Schleifen
sidebarTitle: Bot loop protection
summary: Standardwerte für den Schutz vor Bot-zu-Bot-Schleifen und kanalspezifische Überschreibungen
title: Schutz vor Bot-Schleifen
x-i18n:
    generated_at: "2026-07-12T14:59:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw kann Nachrichten akzeptieren, die von anderen Bots in Kanälen verfasst wurden, die `allowBots` unterstützen. Wenn dieser Pfad aktiviert ist, verhindert der Schutz vor Schleifen zwischen Bot-Paaren, dass zwei Bot-Identitäten einander unbegrenzt antworten.

Die Schutzvorrichtung wird vom zentralen Runner für eingehende Antworten durchgesetzt. Jeder unterstützende Kanal bildet sein eingehendes Ereignis auf generische Fakten ab: Konto oder Geltungsbereich, Konversations-ID, Bot-ID des Absenders und Bot-ID des Empfängers. Der Kern verfolgt das Teilnehmerpaar in beiden Richtungen (A zu B und B zu A gelten als dasselbe Paar), wendet ein Budget mit gleitendem Zeitfenster an und unterdrückt das Paar für eine Abklingzeit, nachdem das Budget überschritten wurde.

## Standardwerte

Der Schutz vor Schleifen zwischen Bot-Paaren ist immer aktiv, wenn ein Kanal zulässt, dass von Bots verfasste Nachrichten die Verteilung erreichen. Integrierte Standardwerte:

| Schlüssel             | Standardwert | Bedeutung                                                       |
| --------------------- | ------------ | --------------------------------------------------------------- |
| `enabled`             | `true`       | Schutz für unterstützende Kanäle aktiv.                          |
| `maxEventsPerWindow`  | `20`         | Ereignisse, die ein Bot-Paar innerhalb des Zeitfensters austauschen kann. |
| `windowSeconds`       | `60`         | Länge des gleitenden Zeitfensters.                               |
| `cooldownSeconds`     | `60`         | Unterdrückungsdauer, nachdem das Paar das Budget überschreitet.  |

Der Schutz wirkt sich nicht auf von Menschen verfasste Nachrichten, Bereitstellungen mit nur einem Bot, die Filterung eigener Nachrichten oder Bot-Antworten aus, die unter dem Budget bleiben.

## Gemeinsame Standardwerte konfigurieren

Legen Sie `channels.defaults.botLoopProtection` einmal fest, um allen unterstützenden Kanälen dieselbe Ausgangskonfiguration zu geben. Überschreibungen für Kanäle, Konten und Räume können einzelne Oberflächen weiterhin anpassen.

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

Legen Sie `enabled: false` nur fest, wenn Ihre Kanalrichtlinie Bot-zu-Bot-Konversationen ohne automatische Unterdrückung ausdrücklich zulässt.

## Nach Kanal, Konto oder Raum überschreiben

Unterstützende Kanäle legen ihre eigene Konfiguration Schlüssel für Schlüssel über den gemeinsamen Standardwert. Prioritätsreihenfolge, beginnend mit der spezifischsten Einstellung:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, wenn der Kanal Überschreibungen pro Konversation unterstützt
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

- Discord: native `author.bot`-Fakten, nach Discord-Konto, Kanal und Bot-Paar geschlüsselt.
- Google Chat: native `sender.type=BOT`-Fakten für akzeptierte, von Bots verfasste Nachrichten, nach Konto, Space und Bot-Paar geschlüsselt.
- Matrix: konfigurierte Matrix-Bot-Konten, nach Matrix-Konto, Raum und konfiguriertem Bot-Paar geschlüsselt.
- Slack: native `bot_id`-Fakten für akzeptierte, von Bots verfasste Nachrichten, nach Slack-Konto, Kanal und Bot-Paar geschlüsselt.

Kanäle, die keine zuverlässige Identität eingehender Bots bereitstellen, verwenden weiterhin ihre normalen Filter für eigene Nachrichten und Zugriffsrichtlinien. Sie sollten diesen Schutz erst aktivieren, wenn sie beide Teilnehmer des Bot-Paars identifizieren können.

Details zur Plugin-Implementierung finden Sie unter [SDK-Laufzeit](/de/plugins/sdk-runtime#reusable-runtime-utilities).
