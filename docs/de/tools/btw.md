---
read_when:
    - Sie möchten eine kurze Nebenfrage zur aktuellen Sitzung stellen
    - Sie implementieren oder debuggen clientübergreifendes BTW-Verhalten
summary: Temporäre Nebenfragen mit /btw
title: 'Übrigens: Nebenfragen'
x-i18n:
    generated_at: "2026-05-03T21:38:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` ermöglicht Ihnen, eine kurze Nebenfrage zur **aktuellen Sitzung** zu stellen, ohne
diese Frage in den normalen Konversationsverlauf aufzunehmen. `/side` ist ein Alias.

Es ist dem `/btw`-Verhalten von Claude Code nachempfunden, wurde aber an die
Gateway- und Mehrkanalarchitektur von OpenClaw angepasst.

## Was es tut

Wenn Sie Folgendes senden:

```text
/btw what changed?
```

OpenClaw:

1. erstellt einen Snapshot des aktuellen Sitzungskontexts,
2. führt einen separaten **tool-losen** Modellaufruf aus,
3. beantwortet nur die Nebenfrage,
4. lässt den Hauptlauf unangetastet,
5. schreibt die BTW-Frage oder -Antwort **nicht** in den Sitzungsverlauf,
6. gibt die Antwort als **Live-Nebenergebnis** statt als normale Assistentennachricht aus.

Das wichtige mentale Modell ist:

- gleicher Sitzungskontext
- separate einmalige Nebenabfrage
- keine Tool-Aufrufe
- keine Verunreinigung des zukünftigen Kontexts
- keine Persistenz im Transkript

## Was es nicht tut

`/btw` tut **nicht** Folgendes:

- eine neue dauerhafte Sitzung erstellen,
- die unfertige Hauptaufgabe fortsetzen,
- Tools oder Agent-Tool-Schleifen ausführen,
- BTW-Frage-/Antwortdaten in den Transkriptverlauf schreiben,
- in `chat.history` erscheinen,
- ein Neuladen überstehen.

Es ist absichtlich **flüchtig**.

## Wie der Kontext funktioniert

BTW verwendet die aktuelle Sitzung nur als **Hintergrundkontext**.

Wenn der Hauptlauf gerade aktiv ist, erstellt OpenClaw einen Snapshot des aktuellen Nachrichtenstands
und nimmt den laufenden Hauptprompt als Hintergrundkontext auf, während
dem Modell ausdrücklich mitgeteilt wird:

- nur die Nebenfrage beantworten,
- die unfertige Hauptaufgabe nicht fortsetzen oder abschließen,
- keine Tool-Aufrufe oder Pseudo-Tool-Aufrufe ausgeben.

So bleibt BTW vom Hauptlauf isoliert und weiß dennoch, worum es in der
Sitzung geht.

## Zustellungsmodell

BTW wird **nicht** als normale Assistentennachricht im Transkript zugestellt.

Auf Gateway-Protokollebene gilt:

- normaler Assistentenchat verwendet das `chat`-Ereignis
- BTW verwendet das `chat.side_result`-Ereignis

Diese Trennung ist beabsichtigt. Wenn BTW den normalen `chat`-Ereignispfad wiederverwenden würde,
würden Clients es wie regulären Konversationsverlauf behandeln.

Da BTW ein separates Live-Ereignis verwendet und nicht aus
`chat.history` erneut wiedergegeben wird, verschwindet es nach dem Neuladen.

## Verhalten in Oberflächen

### TUI

In der TUI wird BTW inline in der aktuellen Sitzungsansicht gerendert, bleibt aber
flüchtig:

- visuell von einer normalen Assistentenantwort unterscheidbar
- mit `Enter` oder `Esc` ausblendbar
- nach dem Neuladen nicht erneut wiedergegeben

### Externe Kanäle

In Kanälen wie Telegram, WhatsApp und Discord wird BTW als
klar gekennzeichnete einmalige Antwort zugestellt, da diese Oberflächen kein lokales
flüchtiges Overlay-Konzept haben.

Die Antwort wird weiterhin als Nebenergebnis behandelt, nicht als normaler Sitzungsverlauf.

### Control UI / Web

Das Gateway gibt BTW korrekt als `chat.side_result` aus, und BTW ist nicht in
`chat.history` enthalten, sodass der Persistenzvertrag für Web bereits korrekt ist.

Die aktuelle Control UI benötigt noch einen dedizierten `chat.side_result`-Consumer, um
BTW live im Browser zu rendern. Bis diese clientseitige Unterstützung bereitsteht, ist BTW ein
Gateway-Level-Feature mit vollständigem TUI- und externem Kanalverhalten, aber noch
keine vollständige Browser-UX.

## Wann Sie BTW verwenden sollten

Verwenden Sie `/btw`, wenn Sie Folgendes möchten:

- eine kurze Klärung zur aktuellen Arbeit,
- eine sachliche Nebenantwort, während ein langer Lauf noch läuft,
- eine temporäre Antwort, die nicht Teil des zukünftigen Sitzungskontexts werden soll.

Beispiele:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Wann Sie BTW nicht verwenden sollten

Verwenden Sie `/btw` nicht, wenn die Antwort Teil des zukünftigen
Arbeitskontexts der Sitzung werden soll.

Stellen Sie die Frage in diesem Fall stattdessen normal in der Hauptsitzung.

## Verwandte Themen

- [Slash-Befehle](/de/tools/slash-commands)
- [Thinking Levels](/de/tools/thinking)
- [Sitzung](/de/concepts/session)
