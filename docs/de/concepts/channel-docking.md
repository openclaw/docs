---
read_when:
    - Sie möchten, dass Antworten für eine aktive Sitzung von Telegram zu Discord, Slack, Mattermost oder einem anderen verknüpften Kanal wechseln
    - Sie konfigurieren session.identityLinks für kanalübergreifende Direktnachrichten
    - Ein /dock-Befehl meldet, dass der Absender nicht verknüpft ist oder keine aktive Sitzung existiert
summary: Die Antwort-Route einer einzelnen OpenClaw-Sitzung zwischen verknüpften Chat-Kanälen verschieben
title: Andocken von Kanälen
x-i18n:
    generated_at: "2026-04-30T06:48:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

Channel-Docking ist Anrufweiterleitung für eine OpenClaw-Sitzung.

Es behält denselben Unterhaltungskontext bei, ändert aber, wohin zukünftige Antworten für
diese Sitzung zugestellt werden.

## Beispiel

Alice kann OpenClaw über Telegram und Discord eine Nachricht senden:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Wenn Alice dies von Telegram sendet:

```text
/dock_discord
```

OpenClaw behält den aktuellen Sitzungskontext bei und ändert die Antwortroute:

| Vor dem Docking                 | Nach `/dock_discord`        |
| ------------------------------- | --------------------------- |
| Antworten gehen an Telegram `123` | Antworten gehen an Discord `456` |

Die Sitzung wird nicht neu erstellt. Der Transkriptverlauf bleibt an dieselbe
Sitzung angehängt.

## Warum verwenden

Verwenden Sie Docking, wenn eine Aufgabe in einer Chat-App beginnt, die nächsten Antworten
aber an einem anderen Ort ankommen sollen.

Typischer Ablauf:

1. Starten Sie eine Agent-Aufgabe von Telegram.
2. Wechseln Sie zu Discord, wo Sie die Arbeit koordinieren.
3. Senden Sie `/dock_discord` aus der Telegram-Sitzung.
4. Behalten Sie dieselbe OpenClaw-Sitzung bei, empfangen Sie zukünftige Antworten aber in Discord.

## Erforderliche Konfiguration

Docking erfordert `session.identityLinks`. Der Quellabsender und der Ziel-Peer
müssen sich in derselben Identitätsgruppe befinden:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Die Werte sind kanalpräfixierte Peer-IDs:

| Wert           | Bedeutung                    |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram-Absender-ID `123`   |
| `discord:456`  | Discord-Direkt-Peer-ID `456` |
| `slack:U123`   | Slack-Benutzer-ID `U123`     |

Der kanonische Schlüssel (`alice` oben) ist nur der gemeinsame Name der Identitätsgruppe. Dock-Befehle verwenden die kanalpräfixierten Werte, um nachzuweisen, dass der Quellabsender und
der Ziel-Peer dieselbe Person sind.

## Befehle

Dock-Befehle werden aus geladenen Kanal-Plugins generiert, die native
Befehle unterstützen. Aktuelle gebündelte Befehle:

| Zielkanal | Befehl             | Alias              |
| --------- | ------------------ | ------------------ |
| Discord   | `/dock-discord`    | `/dock_discord`    |
| Mattermost | `/dock-mattermost` | `/dock_mattermost` |
| Slack     | `/dock-slack`      | `/dock_slack`      |
| Telegram  | `/dock-telegram`   | `/dock_telegram`   |

Die Unterstrich-Aliasse sind auf nativen Befehlsoberflächen wie Telegram nützlich.

## Was sich ändert

Docking aktualisiert die Zustellfelder der aktiven Sitzung:

| Sitzungsfeld   | Beispiel nach `/dock_discord`           |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | das Zielkanal-Konto oder `default`       |

Diese Felder werden im Sitzungsspeicher persistiert und von der späteren Antwortzustellung
für diese Sitzung verwendet.

## Was sich nicht ändert

Docking bewirkt nicht Folgendes:

- Kanalkonten erstellen
- einen neuen Discord-, Telegram-, Slack- oder Mattermost-Bot verbinden
- einem Benutzer Zugriff gewähren
- Kanal-Allowlists oder DM-Richtlinien umgehen
- Transkriptverlauf in eine andere Sitzung verschieben
- dafür sorgen, dass nicht zusammengehörige Benutzer eine Sitzung teilen

Es ändert nur die Zustellroute für die aktuelle Sitzung.

## Fehlerbehebung

**Der Befehl meldet, dass der Absender nicht verknüpft ist.**

Fügen Sie sowohl den aktuellen Absender als auch den Ziel-Peer derselben
`session.identityLinks`-Gruppe hinzu. Wenn beispielsweise Telegram-Absender `123` zu
Discord-Peer `456` docken soll, nehmen Sie sowohl `telegram:123` als auch `discord:456` auf.

**Der Befehl meldet, dass keine aktive Sitzung vorhanden ist.**

Docken Sie aus einer bestehenden Direktchat-Sitzung. Der Befehl benötigt einen aktiven Sitzungseintrag,
damit er die neue Route persistieren kann.

**Antworten gehen weiterhin an den alten Kanal.**

Prüfen Sie, ob der Befehl mit einer Erfolgsmeldung geantwortet hat, und bestätigen Sie, dass die Ziel-Peer-ID mit der von diesem Kanal verwendeten ID übereinstimmt. Docking ändert nur die Route der aktiven
Sitzung; eine andere Sitzung kann weiterhin anderswohin routen.

**Ich muss zurückwechseln.**

Senden Sie den passenden Befehl für den ursprünglichen Kanal, z. B. `/dock_telegram` oder
`/dock-telegram`, von einem verknüpften Absender.
