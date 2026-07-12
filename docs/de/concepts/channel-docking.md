---
read_when:
    - Sie möchten Antworten für eine aktive Sitzung von Telegram zu Discord, Slack, Mattermost oder einem anderen verknüpften Kanal verschieben
    - Sie konfigurieren `session.identityLinks` für kanalübergreifende Direktnachrichten
    - Ein `/dock`-Befehl meldet, dass der Absender nicht verknüpft ist oder keine aktive Sitzung vorhanden ist.
summary: Antwortpfad einer OpenClaw-Sitzung zwischen verknüpften Chat-Kanälen verschieben
title: Channel-Andockung
x-i18n:
    generated_at: "2026-07-12T01:35:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

Channel-Docking ist eine Anrufweiterleitung für eine einzelne OpenClaw-Sitzung. Dabei bleibt derselbe
Konversationskontext erhalten, aber zukünftige Antworten für diese Sitzung werden
an einen anderen Ort zugestellt. Docking funktioniert nur aus einem Direktchat; in einem Gruppenchat
wird es nicht ausgeführt.

## Beispiel

Alice kann OpenClaw über Telegram und Discord Nachrichten senden:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Wenn Alice Folgendes aus einem Telegram-Direktchat sendet:

```text
/dock_discord
```

behält OpenClaw den aktuellen Sitzungskontext bei und ändert die Antwortroute:

| Vor dem Docking                 | Nach `/dock_discord`          |
| ------------------------------ | ----------------------------- |
| Antworten gehen an Telegram `123` | Antworten gehen an Discord `456` |

Die Sitzung wird nicht neu erstellt. Der Transkriptverlauf bleibt mit derselben
Sitzung verknüpft.

## Warum Sie es verwenden sollten

Verwenden Sie Docking, wenn eine Aufgabe in einer Chat-App beginnt, die nächsten Antworten aber
an einem anderen Ort eingehen sollen.

Typischer Ablauf:

1. Starten Sie eine Agentenaufgabe über Telegram.
2. Wechseln Sie zu Discord, wo Sie die Arbeit koordinieren.
3. Senden Sie `/dock_discord` aus dem Telegram-Direktchat.
4. Behalten Sie dieselbe OpenClaw-Sitzung bei, empfangen Sie zukünftige Antworten aber in Discord.

## Erforderliche Konfiguration

Docking erfordert `session.identityLinks`. Der Absender auf dem Quellkanal und der Zielkontakt
müssen derselben Identitätsgruppe angehören:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Die Werte sind Kontakt-IDs mit vorangestelltem Kanalpräfix:

| Wert           | Bedeutung                    |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram-Absender-ID `123`   |
| `discord:456`  | Discord-Direktkontakt-ID `456` |
| `slack:U123`   | Slack-Benutzer-ID `U123`     |

Der kanonische Schlüssel (oben `alice`) ist lediglich der gemeinsame Name der Identitätsgruppe. Docking-
Befehle verwenden die Werte mit Kanalpräfix, um nachzuweisen, dass der Absender auf dem Quellkanal und
der Zielkontakt dieselbe Person sind.

## Befehle

OpenClaw erzeugt für jedes geladene Kanal-Plugin, das native Befehle
unterstützt, einen `/dock-<channel>`-Befehl. Die Liste wächst daher, wenn Plugins hinzugefügt werden. Gebündelte
Plugins, die dies derzeit unterstützen:

| Zielkanal  | Befehl             | Alias              |
| ---------- | ------------------ | ------------------ |
| Discord    | `/dock-discord`    | `/dock_discord`    |
| Mattermost | `/dock-mattermost` | `/dock_mattermost` |
| Slack      | `/dock-slack`      | `/dock_slack`      |
| Telegram   | `/dock-telegram`   | `/dock_telegram`   |

Die Schreibweise mit Unterstrich ist zugleich der native Befehlsname auf Oberflächen wie Telegram,
die Slash-Befehle direkt bereitstellen.

## Was sich ändert

Docking aktualisiert die Zustellungsfelder der aktiven Sitzung:

| Sitzungsfeld    | Beispiel nach `/dock_discord`            |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | das Zielkanalkonto oder `default`        |

Diese Felder werden im Sitzungsspeicher dauerhaft gespeichert und für die spätere Zustellung von
Antworten dieser Sitzung verwendet.

## Was sich nicht ändert

Docking führt Folgendes nicht aus:

- Kanalkonten erstellen
- einen neuen Discord-, Telegram-, Slack- oder Mattermost-Bot verbinden
- einem Benutzer Zugriff gewähren
- Kanal-Zulassungslisten oder Direktnachrichtenrichtlinien umgehen
- den Transkriptverlauf in eine andere Sitzung verschieben
- dafür sorgen, dass nicht miteinander verbundene Benutzer eine Sitzung gemeinsam nutzen

Es ändert lediglich die Zustellungsroute der aktuellen Sitzung.

## Fehlerbehebung

**Der Befehl meldet, dass der Absender nicht verknüpft ist.**

Fügen Sie sowohl den aktuellen Absender als auch den Zielkontakt derselben
`session.identityLinks`-Gruppe hinzu. Wenn beispielsweise der Telegram-Absender `123` an den
Discord-Kontakt `456` andocken soll, schließen Sie sowohl `telegram:123` als auch `discord:456` ein.

**Der Befehl meldet, dass Docking nur aus Direktchats verfügbar ist.**

Senden Sie den Docking-Befehl aus einem Direktchat mit OpenClaw und nicht aus einem Gruppenchat.

**Der Befehl meldet, dass keine aktive Sitzung vorhanden ist.**

Docken Sie aus einer bestehenden Direktchat-Sitzung an. Der Befehl benötigt einen aktiven
Sitzungseintrag, damit er die neue Route dauerhaft speichern kann.

**Antworten gehen weiterhin an den alten Kanal.**

Prüfen Sie, ob der Befehl mit einer Erfolgsmeldung geantwortet hat, und bestätigen Sie, dass die ID des
Zielkontakts mit der von diesem Kanal verwendeten ID übereinstimmt. Docking ändert nur die Route der aktiven
Sitzung; eine andere Sitzung kann weiterhin an einen anderen Ort weiterleiten.

**Ich muss zurückwechseln.**

Senden Sie den passenden Befehl für den ursprünglichen Kanal, beispielsweise `/dock_telegram` oder
`/dock-telegram`, von einem verknüpften Absender.
