---
read_when:
    - Sie möchten eine kurze Nebenfrage zur aktuellen Sitzung stellen
    - Sie implementieren oder debuggen BTW-Verhalten über verschiedene Clients hinweg
summary: Nebenbei gestellte flüchtige Fragen mit /btw
title: 'Übrigens: Zusatzfragen'
x-i18n:
    generated_at: "2026-06-27T18:16:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` ermöglicht Ihnen, eine kurze Nebenfrage zur **aktuellen Sitzung** zu stellen, ohne
diese Frage in den normalen Konversationsverlauf zu übernehmen. `/side` ist ein Alias.

Es ist dem `/btw`-Verhalten von Claude Code nachempfunden, aber an die Gateway- und
Mehrkanalarchitektur von OpenClaw angepasst.

## Was es tut

Wenn Sie Folgendes senden:

```text
/btw what changed?
```

OpenClaw:

1. erstellt einen Snapshot des aktuellen Sitzungskontexts,
2. führt eine separate, ephemere Nebenabfrage aus,
3. beantwortet nur die Nebenfrage,
4. lässt den Hauptlauf unverändert,
5. schreibt die BTW-Frage oder -Antwort **nicht** in den Sitzungsverlauf,
6. gibt die Antwort als **Live-Nebenergebnis** statt als normale Assistentennachricht aus.

Das wichtige mentale Modell ist:

- gleicher Sitzungskontext
- separate einmalige Nebenabfrage
- gleicher nativer Harness-Transport, wenn die Sitzung einen nativen Harness verwendet
- keine zukünftige Kontextverunreinigung
- keine Transcript-Persistenz

Für Codex-Harness-Sitzungen bleibt BTW innerhalb von Codex, indem der aktive
App-Server-Thread als ephemerer Neben-Thread geforkt wird. Dadurch bleiben Codex OAuth und das native
Thread-Verhalten intakt, während die Nebenantwort weiterhin vom übergeordneten
Transcript isoliert wird. Wie Codex `/side` behält der Neben-Thread die aktuellen Codex-
Berechtigungen und die native Tool-Oberfläche bei, mit Leitplanken, die dem Modell sagen, dass es
geerbte Arbeit aus dem übergeordneten Thread nicht als aktive Anweisungen behandeln soll.

Für CLI-Runtime-Aliase verwendet BTW das zuständige CLI-Backend im Nebenfragenmodus,
statt auf einen direkten Provider-Aufruf zurückzufallen. OpenClaw übernimmt bereinigten
Konversationskontext in einen frischen einmaligen CLI-Aufruf, deaktiviert OpenClaw MCP-
Tool-Bündelung und wiederverwendbaren CLI-Sitzungszustand für diesen Aufruf und lässt das
Backend alle CLI-nativen No-Resume- oder No-Tools-Flags hinzufügen, die es unterstützt. Direkte
Nicht-CLI-Runtimes behalten den direkten einmaligen Pfad bei.

## Was es nicht tut

`/btw` tut **nicht** Folgendes:

- eine neue dauerhafte Sitzung erstellen,
- die unvollendete Hauptaufgabe fortsetzen,
- BTW-Frage-/Antwortdaten in den Transcript-Verlauf schreiben,
- in `chat.history` erscheinen,
- einen Reload überstehen.

Es ist bewusst **ephemer**.

## Wie Kontext funktioniert

BTW verwendet die aktuelle Sitzung nur als **Hintergrundkontext**.

Wenn der Hauptlauf gerade aktiv ist, erstellt OpenClaw einen Snapshot des aktuellen Nachrichten-
zustands und schließt den laufenden Hauptprompt als Hintergrundkontext ein, während
dem Modell ausdrücklich mitgeteilt wird:

- nur die Nebenfrage beantworten,
- die unvollendete Hauptaufgabe nicht fortsetzen oder abschließen,
- die übergeordnete Konversation nicht steuern.

Dadurch bleibt BTW vom Hauptlauf isoliert und ist sich dennoch bewusst, worum es in
der Sitzung geht.

## Auslieferungsmodell

BTW wird **nicht** als normale Assistenten-Transcript-Nachricht ausgeliefert.

Auf Gateway-Protokollebene:

- normaler Assistenten-Chat verwendet das Ereignis `chat`
- BTW verwendet das Ereignis `chat.side_result`

Diese Trennung ist beabsichtigt. Wenn BTW den normalen Ereignispfad `chat` wiederverwenden würde,
würden Clients es wie regulären Konversationsverlauf behandeln.

Da BTW ein separates Live-Ereignis verwendet und nicht aus
`chat.history` erneut abgespielt wird, verschwindet es nach dem Neuladen.

## Oberflächenverhalten

### TUI

In der TUI wird BTW inline in der aktuellen Sitzungsansicht gerendert, bleibt aber
flüchtig:

- sichtbar von einer normalen Assistentenantwort unterscheidbar
- mit `Enter` oder `Esc` ausblendbar
- wird beim Neuladen nicht erneut abgespielt

### Externe Kanäle

In Kanälen wie Telegram, WhatsApp und Discord wird BTW als
klar gekennzeichnete einmalige Antwort zugestellt, da diese Oberflächen kein lokales
Konzept für flüchtige Overlays haben.

Die Antwort wird weiterhin als Nebenergebnis behandelt, nicht als normaler Sitzungsverlauf.

### Control UI / Web

Der Gateway gibt BTW korrekt als `chat.side_result` aus, und BTW ist nicht in
`chat.history` enthalten, daher ist der Persistenzvertrag für das Web bereits korrekt.

Die aktuelle Control UI benötigt noch einen dedizierten `chat.side_result`-Consumer, um
BTW live im Browser zu rendern. Bis diese clientseitige Unterstützung verfügbar ist, ist BTW ein
Gateway-Level-Feature mit vollständigem TUI- und externem Kanalverhalten, aber noch
keine vollständige Browser-UX.

## Wann BTW verwendet werden sollte

Verwenden Sie `/btw`, wenn Sie Folgendes möchten:

- eine kurze Klärung zur aktuellen Arbeit,
- eine sachliche Nebenantwort, während ein langer Lauf noch in Bearbeitung ist,
- eine temporäre Antwort, die nicht Teil des zukünftigen Sitzungskontexts werden soll.

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
Arbeitskontexts der Sitzung werden soll.

Stellen Sie die Frage in diesem Fall normal in der Hauptsitzung, anstatt BTW zu verwenden.

## Verwandt

<CardGroup cols={2}>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Nativer Befehlskatalog und Chat-Anweisungen.
  </Card>
  <Card title="Denkstufen" href="/de/tools/thinking" icon="brain">
    Reasoning-Effort-Stufen für den Modellaufruf der Nebenfrage.
  </Card>
  <Card title="Sitzung" href="/de/concepts/session" icon="comments">
    Sitzungsschlüssel, Verlauf und Persistenzsemantik.
  </Card>
  <Card title="Steuerungsbefehl" href="/de/tools/steer" icon="arrow-right">
    Eine Steuerungsnachricht in den aktiven Lauf einfügen, ohne ihn zu beenden.
  </Card>
</CardGroup>
