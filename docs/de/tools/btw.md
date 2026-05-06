---
read_when:
    - Sie möchten eine kurze Zwischenfrage zur aktuellen Sitzung stellen
    - Sie implementieren oder debuggen BTW-Verhalten über verschiedene Clients hinweg
summary: Flüchtige Nebenfragen mit /btw
title: 'Übrigens: Nebenfragen'
x-i18n:
    generated_at: "2026-05-06T07:04:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` lässt Sie eine kurze Nebenfrage zur **aktuellen Session** stellen, ohne
diese Frage in den normalen Konversationsverlauf umzuwandeln. `/side` ist ein Alias.

Es ist an Claude Codes `/btw`-Verhalten angelehnt, aber an OpenClaws
Gateway- und Multi-Channel-Architektur angepasst.

## Was es tut

Wenn Sie Folgendes senden:

```text
/btw what changed?
```

OpenClaw:

1. erstellt einen Snapshot des aktuellen Session-Kontexts,
2. führt einen separaten **tool-losen** Modellaufruf aus,
3. beantwortet nur die Nebenfrage,
4. lässt den Hauptlauf unverändert,
5. schreibt die BTW-Frage oder -Antwort **nicht** in den Session-Verlauf,
6. gibt die Antwort als **Live-Seitenergebnis** aus, nicht als normale Assistant-Nachricht.

Das wichtige mentale Modell lautet:

- gleicher Session-Kontext
- separate einmalige Nebenabfrage
- keine Tool-Aufrufe
- keine zukünftige Kontextverschmutzung
- keine Transcript-Persistenz

## Was es nicht tut

`/btw` tut **nicht** Folgendes:

- eine neue dauerhafte Session erstellen,
- die unfertige Hauptaufgabe fortsetzen,
- Tools oder Agent-Tool-Schleifen ausführen,
- BTW-Frage-/Antwortdaten in den Transcript-Verlauf schreiben,
- in `chat.history` erscheinen,
- einen Reload überdauern.

Es ist absichtlich **ephemer**.

## Wie Kontext funktioniert

BTW verwendet die aktuelle Session nur als **Hintergrundkontext**.

Wenn der Hauptlauf gerade aktiv ist, erstellt OpenClaw einen Snapshot des aktuellen Nachrichtenstands
und nimmt den laufenden Haupt-Prompt als Hintergrundkontext auf, während
dem Modell ausdrücklich mitgeteilt wird:

- nur die Nebenfrage beantworten,
- die unfertige Hauptaufgabe nicht wiederaufnehmen oder abschließen,
- keine Tool-Aufrufe oder Pseudo-Tool-Aufrufe ausgeben.

Dadurch bleibt BTW vom Hauptlauf isoliert, während es dennoch weiß, worum es
in der Session geht.

## Auslieferungsmodell

BTW wird **nicht** als normale Assistant-Transcript-Nachricht ausgeliefert.

Auf Ebene des Gateway-Protokolls gilt:

- normaler Assistant-Chat verwendet das `chat`-Event
- BTW verwendet das `chat.side_result`-Event

Diese Trennung ist beabsichtigt. Wenn BTW den normalen `chat`-Event-Pfad wiederverwenden würde,
würden Clients es wie regulären Konversationsverlauf behandeln.

Da BTW ein separates Live-Event verwendet und nicht aus
`chat.history` erneut abgespielt wird, verschwindet es nach einem Reload.

## Verhalten auf Oberflächen

### TUI

In der TUI wird BTW inline in der aktuellen Session-Ansicht gerendert, bleibt aber
ephemer:

- sichtbar von einer normalen Assistant-Antwort unterscheidbar
- mit `Enter` oder `Esc` ausblendbar
- wird beim Reload nicht erneut abgespielt

### Externe Channels

Auf Channels wie Telegram, WhatsApp und Discord wird BTW als
klar gekennzeichnete einmalige Antwort ausgeliefert, weil diese Oberflächen kein lokales
ephemeres Overlay-Konzept haben.

Die Antwort wird weiterhin als Seitenergebnis behandelt, nicht als normaler Session-Verlauf.

### Control UI / Web

Das Gateway gibt BTW korrekt als `chat.side_result` aus, und BTW ist nicht in
`chat.history` enthalten, sodass der Persistenzvertrag für Web bereits korrekt ist.

Die aktuelle Control UI benötigt noch einen dedizierten `chat.side_result`-Consumer, um
BTW live im Browser zu rendern. Bis diese clientseitige Unterstützung verfügbar ist, ist BTW ein
Gateway-Level-Feature mit vollständigem TUI- und External-Channel-Verhalten, aber noch
keine vollständige Browser-UX.

## Wann BTW verwendet werden sollte

Verwenden Sie `/btw`, wenn Sie Folgendes möchten:

- eine kurze Klarstellung zur aktuellen Arbeit,
- eine sachliche Nebenantwort, während ein langer Lauf noch läuft,
- eine temporäre Antwort, die nicht Teil des zukünftigen Session-Kontexts werden soll.

Beispiele:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Wann BTW nicht verwendet werden sollte

Verwenden Sie `/btw` nicht, wenn die Antwort Teil des zukünftigen
Arbeitskontexts der Session werden soll.

Stellen Sie die Frage in diesem Fall normal in der Haupt-Session, statt BTW zu verwenden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Slash commands" href="/de/tools/slash-commands" icon="terminal">
    Nativer Befehlskatalog und Chat-Anweisungen.
  </Card>
  <Card title="Thinking levels" href="/de/tools/thinking" icon="brain">
    Reasoning-Aufwandsebenen für den Modellaufruf zur Nebenfrage.
  </Card>
  <Card title="Session" href="/de/concepts/session" icon="comments">
    Session-Schlüssel, Verlauf und Persistenzsemantik.
  </Card>
  <Card title="Steer command" href="/de/tools/steer" icon="arrow-right">
    Fügt eine Steuerungsnachricht in den aktiven Lauf ein, ohne ihn zu beenden.
  </Card>
</CardGroup>
