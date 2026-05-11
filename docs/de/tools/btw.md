---
read_when:
    - Sie möchten eine kurze Nebenfrage zur aktuellen Sitzung stellen
    - Sie implementieren oder debuggen BTW-Verhalten über Clients hinweg
summary: Temporäre Nebenfragen mit /btw
title: 'Übrigens: Nebenfragen'
x-i18n:
    generated_at: "2026-05-11T20:37:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` ermöglicht Ihnen, eine kurze Nebenfrage zur **aktuellen Sitzung** zu stellen, ohne
diese Frage in den normalen Gesprächsverlauf aufzunehmen. `/side` ist ein Alias.

Es ist an das `/btw`-Verhalten von Claude Code angelehnt, aber an die Gateway- und
Mehrkanalarchitektur von OpenClaw angepasst.

## Was es bewirkt

Wenn Sie Folgendes senden:

```text
/btw what changed?
```

führt OpenClaw Folgendes aus:

1. erstellt einen Snapshot des aktuellen Sitzungskontexts,
2. führt eine separate, ephemere Nebenabfrage aus,
3. beantwortet nur die Nebenfrage,
4. lässt den Hauptlauf unverändert,
5. schreibt die BTW-Frage oder -Antwort **nicht** in den Sitzungsverlauf,
6. gibt die Antwort als **Live-Nebenergebnis** statt als normale Assistentennachricht aus.

Das wichtige mentale Modell lautet:

- gleicher Sitzungskontext
- separate einmalige Nebenabfrage
- gleicher nativer Harness-Transport, wenn die Sitzung einen nativen Harness verwendet
- keine zukünftige Kontextverschmutzung
- keine Transcript-Persistenz

Für Codex-Harness-Sitzungen bleibt BTW innerhalb von Codex, indem der aktive
App-Server-Thread als ephemerer Nebenthread geforkt wird. Dadurch bleiben Codex-OAuth und natives
Thread-Verhalten intakt, während die Nebenantwort weiterhin vom übergeordneten
Transcript isoliert wird. Wie bei Codex `/side` behält der Nebenthread die aktuellen Codex-
Berechtigungen und die native Tool-Oberfläche bei, mit Guardrails, die dem Modell mitteilen, dass es
geerbte Arbeit aus dem übergeordneten Thread nicht als aktive Anweisungen behandeln soll. Nicht-Codex-Runtimes
verwenden weiterhin den älteren direkten Einmalpfad.

## Was es nicht bewirkt

`/btw` bewirkt **nicht**:

- eine neue dauerhafte Sitzung erstellen,
- die unvollendete Hauptaufgabe fortsetzen,
- BTW-Frage-/Antwortdaten in den Transcript-Verlauf schreiben,
- in `chat.history` erscheinen,
- einen Reload überstehen.

Es ist absichtlich **ephemer**.

## Wie Kontext funktioniert

BTW verwendet die aktuelle Sitzung nur als **Hintergrundkontext**.

Wenn der Hauptlauf derzeit aktiv ist, erstellt OpenClaw einen Snapshot des aktuellen Nachrichtenstands
und nimmt den laufenden Hauptprompt als Hintergrundkontext auf, während dem Modell ausdrücklich
mitgeteilt wird:

- nur die Nebenfrage beantworten,
- die unvollendete Hauptaufgabe nicht fortsetzen oder abschließen,
- das übergeordnete Gespräch nicht steuern.

Dadurch bleibt BTW vom Hauptlauf isoliert, weiß aber trotzdem, worum es in der
Sitzung geht.

## Bereitstellungsmodell

BTW wird **nicht** als normale Assistenten-Transcript-Nachricht bereitgestellt.

Auf Gateway-Protokollebene gilt:

- normaler Assistenten-Chat verwendet das `chat`-Event
- BTW verwendet das `chat.side_result`-Event

Diese Trennung ist beabsichtigt. Wenn BTW den normalen `chat`-Event-Pfad wiederverwenden würde,
würden Clients es wie regulären Gesprächsverlauf behandeln.

Da BTW ein separates Live-Event verwendet und nicht aus
`chat.history` wiedergegeben wird, verschwindet es nach einem Reload.

## Oberflächenverhalten

### TUI

In der TUI wird BTW inline in der aktuellen Sitzungsansicht gerendert, bleibt aber
ephemer:

- sichtbar von einer normalen Assistentenantwort unterscheidbar
- mit `Enter` oder `Esc` ausblendbar
- wird bei einem Reload nicht wiedergegeben

### Externe Kanäle

Auf Kanälen wie Telegram, WhatsApp und Discord wird BTW als
klar gekennzeichnete einmalige Antwort zugestellt, da diese Oberflächen kein lokales
ephemeres Overlay-Konzept haben.

Die Antwort wird weiterhin als Nebenergebnis behandelt, nicht als normaler Sitzungsverlauf.

### Control UI / Web

Der Gateway gibt BTW korrekt als `chat.side_result` aus, und BTW ist nicht in
`chat.history` enthalten, daher ist der Persistenzvertrag für Web bereits korrekt.

Die aktuelle Control UI benötigt noch einen dedizierten `chat.side_result`-Consumer, um
BTW live im Browser zu rendern. Bis diese clientseitige Unterstützung verfügbar ist, ist BTW ein
Feature auf Gateway-Ebene mit vollständigem TUI- und externem Kanalverhalten, aber noch keine
vollständige Browser-UX.

## Wann Sie BTW verwenden sollten

Verwenden Sie `/btw`, wenn Sie Folgendes möchten:

- eine kurze Klärung zur aktuellen Arbeit,
- eine faktische Nebenantwort, während ein langer Lauf noch läuft,
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

Verwenden Sie `/btw` nicht, wenn die Antwort Teil des zukünftigen Arbeitskontexts der
Sitzung werden soll.

Fragen Sie in diesem Fall stattdessen normal in der Hauptsitzung, anstatt BTW zu verwenden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Nativer Befehlskatalog und Chat-Direktiven.
  </Card>
  <Card title="Denkstufen" href="/de/tools/thinking" icon="brain">
    Reasoning-Aufwandsstufen für den Modellaufruf der Nebenfrage.
  </Card>
  <Card title="Sitzung" href="/de/concepts/session" icon="comments">
    Sitzungsschlüssel, Verlauf und Persistenzsemantik.
  </Card>
  <Card title="Steuerbefehl" href="/de/tools/steer" icon="arrow-right">
    Eine Steuerungsnachricht in den aktiven Lauf injizieren, ohne ihn zu beenden.
  </Card>
</CardGroup>
