---
read_when:
    - Von Bots verfasste Kanalnachrichten konfigurieren
    - Bot-zu-Bot-Schleifenschutz abstimmen
sidebarTitle: Bot loop protection
summary: Schleifenschutz-Standards für Bot-zu-Bot-Kommunikation und Kanalüberschreibungen
title: Bot-Loop-Schutz
x-i18n:
    generated_at: "2026-06-27T17:09:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Schutz vor Bot-Schleifen

OpenClaw kann Nachrichten akzeptieren, die von anderen Bots in Kanälen geschrieben wurden, die `allowBots` unterstützen.
Wenn dieser Pfad aktiviert ist, verhindert der Schutz vor Schleifen zwischen Paaren, dass zwei Bot-Identitäten
unbegrenzt aufeinander antworten.

Der Schutzmechanismus wird vom zentralen Runner für eingehende Antworten durchgesetzt. Jeder unterstützende Kanal
ordnet sein eigenes eingehendes Ereignis generischen Fakten zu: Konto oder Geltungsbereich, Konversations-ID,
Absender-Bot-ID und Empfänger-Bot-ID. Core verfolgt dann das Teilnehmerpaar in beide
Richtungen, wendet ein Budget mit gleitendem Zeitfenster an und unterdrückt das Paar während einer
Abkühlphase, nachdem das Budget überschritten wurde.

## Standardwerte

Der Schutz vor Schleifen zwischen Paaren ist aktiv, wenn ein Kanal botverfasste Nachrichten bis zum
Dispatch gelangen lässt. Die integrierten Standardwerte sind:

- `maxEventsPerWindow: 20` - ein Bot-Paar kann innerhalb des Fensters 20 Ereignisse austauschen
- `windowSeconds: 60` - Länge des gleitenden Fensters
- `cooldownSeconds: 60` - Unterdrückungszeit, nachdem das Paar das Budget überschritten hat

Der Schutzmechanismus betrifft keine normalen von Menschen verfassten Nachrichten, Einzel-Bot-Bereitstellungen,
Filterung eigener Nachrichten oder einmalige Bot-Antworten, die unter dem Budget bleiben.

## Gemeinsame Standardwerte konfigurieren

Setzen Sie `channels.defaults.botLoopProtection` einmal, um jedem unterstützenden Kanal
dieselbe Basis zu geben. Überschreibungen für Kanal und Konto können einzelne
Oberflächen weiterhin anpassen.

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

Setzen Sie `enabled: false` nur, wenn Ihre Kanalrichtlinie Bot-zu-Bot-Konversationen
ohne automatische Unterdrückung absichtlich erlaubt.

## Pro Kanal oder Konto überschreiben

Unterstützende Kanäle legen ihre eigene Konfiguration über den gemeinsamen Standard. Die Priorität ist:

- `channels.<channel>.<room-or-space>.botLoopProtection`, wenn der Kanal Überschreibungen pro Konversation unterstützt
- `channels.<channel>.accounts.<account>.botLoopProtection`, wenn der Kanal Konten unterstützt
- `channels.<channel>.botLoopProtection`, wenn der Kanal Standardwerte auf oberster Ebene unterstützt
- `channels.defaults.botLoopProtection`
- integrierte Standardwerte

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
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
  },
}
```

## Kanalunterstützung

- Discord: native `author.bot`-Fakten, nach Discord-Konto, Kanal und Bot-Paar verschlüsselt.
- Slack: native `bot_id`-Fakten für akzeptierte botverfasste Nachrichten, nach Slack-Konto, Kanal und Bot-Paar verschlüsselt.
- Matrix: konfigurierte Matrix-Bot-Konten, nach Matrix-Konto, Raum und konfiguriertem Bot-Paar verschlüsselt.
- Google Chat: native `sender.type=BOT`-Fakten für akzeptierte botverfasste Nachrichten, nach Konto, Space und Bot-Paar verschlüsselt.

Kanäle, die keine zuverlässige eingehende Bot-Identität offenlegen, verwenden weiterhin ihre
normalen Filter für eigene Nachrichten und Zugriffsrichtlinien. Sie sollten diesen
Schutzmechanismus erst aktivieren, wenn sie beide Teilnehmer im Bot-Paar identifizieren können.

Siehe [SDK-Laufzeit](/de/plugins/sdk-runtime#reusable-runtime-utilities) für Details zur
Plugin-Implementierung.
