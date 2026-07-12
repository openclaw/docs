---
read_when:
    - Sie möchten eine kurze Nebenfrage zur aktuellen Sitzung stellen
    - Sie implementieren oder debuggen das BTW-Verhalten clientübergreifend
summary: Kurzlebige Nebenfragen mit /btw
title: Übrigens, Nebenfragen
x-i18n:
    generated_at: "2026-07-12T15:56:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (Alias `/side`) stellt eine kurze Nebenfrage zur **aktuellen
Sitzung**, ohne sie dem Gesprächsverlauf hinzuzufügen. Es ist an
Claude Codes `/btw` angelehnt und an die Gateway- und Mehrkanalarchitektur
von OpenClaw angepasst.

```text
/btw was hat sich geändert?
/side was bedeutet dieser Fehler?
```

## Funktionsweise

1. Erstellt eine Momentaufnahme der aktuellen Sitzung als Hintergrundkontext (einschließlich eines
   Prompts des aktuell laufenden Hauptlaufs).
2. Führt eine separate, einmalige Nebenabfrage aus und weist das Modell an, nur die
   Nebenfrage zu beantworten und die Hauptaufgabe weder fortzusetzen noch zu steuern.
3. Stellt die Antwort als Live-Nebenergebnis bereit, nicht als normale Assistentennachricht.
4. Schreibt weder die Frage noch die Antwort jemals in den Sitzungsverlauf oder in `chat.history`.

Der Hauptlauf bleibt unverändert, sofern einer aktiv ist.

Bei Codex-Harness-Sitzungen verzweigt BTW den aktiven Codex-App-Server-Thread in
einen kurzlebigen untergeordneten Thread, statt einen separaten Provider-Aufruf auszuführen. Dadurch
bleiben Codex OAuth sowie das native Tool- und Thread-Verhalten erhalten, und der verzweigte
Thread übernimmt die aktuelle Genehmigungsrichtlinie, Sandbox und native
Tool-Oberfläche des übergeordneten Threads. Der verzweigte Thread erhält einen Abgrenzungsprompt, der dem Modell mitteilt, dass
alles davor geerbter Referenzkontext und keine aktiven Anweisungen darstellt
und dass nur Nachrichten nach der Abgrenzung aktiv sind. `/btw` erfordert einen
vorhandenen Codex-Thread; senden Sie zuerst eine normale Nachricht.

Bei CLI-Laufzeit-Aliasen ruft BTW das zuständige CLI-Backend im einmaligen
Nebenfragenmodus auf: Es speist bereinigten Gesprächskontext in einen neuen CLI-
Aufruf ein, bei dem die Tool-Bündelung und der wiederverwendbare Sitzungsstatus deaktiviert sind, und fügt
alle vom Backend unterstützten Flags zur Verhinderung der Fortsetzung und Tool-Nutzung hinzu. Direkte Laufzeiten (ohne CLI)
verwenden stattdessen einen direkten einmaligen Provider-Aufruf.

## Was es nicht tut

`/btw` erstellt keine dauerhafte Sitzung, setzt die unvollendete Hauptaufgabe nicht fort,
speichert keine Frage-/Antwortdaten im Transkriptverlauf und übersteht kein Neuladen.

## Bereitstellungsmodell

Der normale Assistentenchat verwendet das Gateway-Ereignis `chat`. BTW verwendet ein separates
Ereignis `chat.side_result`, damit Clients es nicht mit dem regulären
Gesprächsverlauf verwechseln können. Da es nicht aus `chat.history` wiedergegeben wird,
verschwindet es nach dem Neuladen.

## Verhalten der Oberflächen

| Oberfläche        | Verhalten                                                                                                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Wird im Chatprotokoll eingebettet und deutlich von einer normalen Antwort unterscheidbar dargestellt; kann mit `Enter` oder `Esc` geschlossen werden.                                                                                                                               |
| Externe Kanäle    | Wird als eindeutig gekennzeichnete einmalige Antwort bereitgestellt (Telegram, WhatsApp und Discord verfügen über keine lokale kurzlebige Einblendung).                                                                                                                              |
| Control UI / Web  | Wird als schwebendes „Side chat“-Panel dargestellt, das am Thread angeheftet ist. Antworten sammeln sich als Gesprächsbeiträge an, und ein „Follow up“-Eingabefeld stellt die nächste Nebenfrage. Beim Schließen (`Esc` oder X) bleibt das Gespräch erhalten und wird bei der nächsten Antwort erneut geöffnet; die Papierkorb-Schaltfläche verwirft es und beendet einen ausstehenden Lauf. |

## Auswahl-Popup (Control UI)

Wenn Sie Text innerhalb einer Chatnachricht in der Control UI markieren, wird ein kleines
Auswahl-Popup mit zwei Aktionen geöffnet:

- **More details** sendet sofort eine implizite `/btw`-Frage, die das
  Modell auffordert, den markierten Text im Kontext der aktuellen
  Sitzung zu erklären. Die Antwort erscheint im schwebenden Side-Chat-Panel.
- **Ask in side chat** füllt den Editor mit einem `/btw`-Entwurf vor, der den
  markierten Text zitiert, damit Sie eine eigene Frage dazu eingeben können.

Beide Aktionen folgen der normalen `/btw`-Semantik: Frage und Antwort werden nicht
im Sitzungsverlauf gespeichert, und der Hauptlauf bleibt unverändert.

## Verwendung

Verwenden Sie `/btw` für eine kurze Klärung, eine sachliche Nebenfrage, während ein langer Lauf
noch ausgeführt wird, oder eine vorübergehende Antwort, die nicht in den zukünftigen
Sitzungskontext aufgenommen werden soll.

```text
/btw welche Datei bearbeiten wir?
/btw fasse die aktuelle Aufgabe in einem Satz zusammen
/btw was ist 17 * 19?
```

Alles, was Teil des zukünftigen Arbeitskontexts der Sitzung werden soll,
fragen Sie stattdessen normal in der Hauptsitzung.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Nativer Befehlskatalog und Chat-Direktiven.
  </Card>
  <Card title="Denkstufen" href="/de/tools/thinking" icon="brain">
    Stufen des Schlussfolgerungsaufwands für den Modellaufruf der Nebenfrage.
  </Card>
  <Card title="Sitzung" href="/de/concepts/session" icon="comments">
    Sitzungsschlüssel, Verlauf und Persistenzsemantik.
  </Card>
  <Card title="Steuerungsbefehl" href="/de/tools/steer" icon="arrow-right">
    Fügt eine steuernde Nachricht in den aktiven Lauf ein, ohne ihn zu beenden.
  </Card>
</CardGroup>
