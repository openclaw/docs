---
read_when:
    - Sie möchten eine kurze Nebenfrage zur aktuellen Sitzung stellen
    - Sie implementieren oder debuggen das BTW-Verhalten clientübergreifend
summary: Kurzlebige Nebenfragen mit /btw
title: Übrigens, Nebenfragen
x-i18n:
    generated_at: "2026-07-24T04:44:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (Alias `/side`) stellt eine kurze Nebenfrage zur **aktuellen
Sitzung**, ohne sie zum Konversationsverlauf hinzuzufügen. Die Funktion ist
Claude Codes `/btw` nachempfunden und an die Gateway- und
Mehrkanalarchitektur von OpenClaw angepasst.

```text
/btw was hat sich geändert?
/side was bedeutet dieser Fehler?
```

## Funktionsweise

1. Erstellt einen Snapshot der aktuellen Sitzung als Hintergrundkontext (einschließlich eines
   Prompts des gegebenenfalls laufenden Hauptlaufs).
2. Führt eine separate, einmalige Nebenabfrage aus, die das Modell anweist, nur die
   Nebenfrage zu beantworten und die Hauptaufgabe weder fortzusetzen noch zu steuern.
3. Stellt die Antwort als Live-Nebenergebnis und nicht als normale Assistentennachricht bereit.
4. Schreibt weder die Frage noch die Antwort in den Sitzungsverlauf oder in `chat.history`.

Ein gegebenenfalls aktiver Hauptlauf bleibt unverändert.

Bei Codex-Harness-Sitzungen verzweigt BTW den aktiven Codex-App-Server-Thread
in einen kurzlebigen untergeordneten Thread, anstatt einen separaten
Provider-Aufruf auszuführen. Dadurch bleiben Codex OAuth sowie das native
Tool- und Thread-Verhalten erhalten, und der verzweigte Thread übernimmt die
aktuelle Genehmigungsrichtlinie, Sandbox und native Tool-Oberfläche des
übergeordneten Threads. Der verzweigte Thread erhält einen Abgrenzungsprompt,
der das Modell darauf hinweist, dass alles davor geerbter Referenzkontext und
keine aktiven Anweisungen sind und dass nur Nachrichten nach der Abgrenzung
aktuell sind. `/btw` erfordert einen vorhandenen Codex-Thread;
senden Sie zuerst eine normale Nachricht.

Bei CLI-Runtime-Aliasen ruft BTW das zuständige CLI-Backend im Modus für
einmalige Nebenfragen auf: Es speist bereinigten Konversationskontext in
einen neuen CLI-Aufruf ein, bei dem Tool-Bündelung und wiederverwendbarer
Sitzungsstatus deaktiviert sind, und fügt alle vom Backend unterstützten
Flags zum Verhindern der Fortsetzung und der Tool-Nutzung hinzu. Direkte
Runtimes (ohne CLI) verwenden stattdessen einen direkten einmaligen
Provider-Aufruf.

## Was die Funktion nicht tut

`/btw` erstellt keine dauerhafte Sitzung, setzt die noch nicht abgeschlossene
Hauptaufgabe nicht fort, speichert keine Frage-/Antwortdaten im
Transkriptverlauf und bleibt nach einem Neuladen nicht erhalten.

## Bereitstellungsmodell

Der normale Assistentenchat verwendet das Gateway-Ereignis `chat`.
BTW verwendet ein separates Ereignis `chat.side_result`, damit Clients es
nicht mit dem regulären Konversationsverlauf verwechseln können. Da es nicht
aus `chat.history` wiedergegeben wird, verschwindet es nach dem Neuladen.

## Verhalten der Oberflächen

| Oberfläche        | Verhalten                                                                                                                                                                                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Wird im Chatprotokoll inline dargestellt, ist deutlich von einer normalen Antwort unterscheidbar und kann mit `Enter` oder `Esc` geschlossen werden.                                                                                                                  |
| Externe Kanäle    | Wird als eindeutig gekennzeichnete einmalige Antwort bereitgestellt (Telegram, WhatsApp und Discord verfügen über keine lokale kurzlebige Einblendung).                                                                                                                                       |
| Control UI / Web  | Wird als schwebendes Panel „Nebenchat“ dargestellt, das am Thread angeheftet ist. Antworten sammeln sich als Gesprächsbeiträge an, und über ein Eingabefeld „Nachfrage“ kann die nächste Nebenfrage gestellt werden. Beim Schließen (`Esc` oder das X) bleibt die Konversation erhalten und wird bei der nächsten Antwort erneut geöffnet; die Papierkorb-Schaltfläche verwirft sie und beendet einen ausstehenden Lauf. |

## Auswahl-Popup (Control UI)

Wenn Text innerhalb einer Chatnachricht in der Control UI markiert wird,
öffnet sich ein kleines Auswahl-Popup mit zwei Aktionen:

- **Weitere Details** sendet sofort eine implizite `/btw`-Frage,
  die das Modell auffordert, den markierten Text im Kontext der aktuellen
  Sitzung zu erläutern. Die Antwort erscheint im schwebenden Nebenchat-Panel.
- **Im Nebenchat fragen** füllt das Eingabefeld mit einem `/btw`-Entwurf
  vor, der den markierten Text zitiert, sodass Sie Ihre eigene Frage dazu
  eingeben können.

Beide Aktionen folgen der normalen `/btw`-Semantik: Die Frage und
die Antwort werden nicht in den Sitzungsverlauf aufgenommen, und der
Hauptlauf bleibt unverändert.

## Verwendung

Verwenden Sie `/btw` für eine kurze Klärung, eine sachliche Nebenantwort,
während ein langer Lauf noch ausgeführt wird, oder eine temporäre Antwort,
die nicht in den zukünftigen Sitzungskontext aufgenommen werden soll.

```text
/btw welche Datei bearbeiten wir?
/btw fassen Sie die aktuelle Aufgabe in einem Satz zusammen
/btw was ist 17 * 19?
```

Wenn etwas Teil des zukünftigen Arbeitskontexts der Sitzung werden soll,
fragen Sie stattdessen wie gewohnt in der Hauptsitzung.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Nativer Befehlskatalog und Chat-Direktiven.
  </Card>
  <Card title="Denkstufen" href="/de/tools/thinking" icon="brain">
    Stufen des Denkaufwands für den Modellaufruf der Nebenfrage.
  </Card>
  <Card title="Sitzung" href="/de/concepts/session" icon="comments">
    Sitzungsschlüssel sowie Semantik von Verlauf und Persistenz.
  </Card>
  <Card title="Steuerungsbefehl" href="/de/tools/steer" icon="arrow-right">
    Fügt eine steuernde Nachricht in den aktiven Lauf ein, ohne ihn zu beenden.
  </Card>
</CardGroup>
