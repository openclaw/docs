---
read_when:
    - Sie müssen etwas finden, das in einer früheren Sitzung besprochen wurde
    - Sie möchten den Datenschutz oder die Indizierung bei der Sitzungssuche verstehen
summary: Durchsuchen Sie frühere Sitzungstranskripte und öffnen Sie den passenden Kontext erneut
title: Sitzungssuche
x-i18n:
    generated_at: "2026-07-12T15:14:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# Sitzungssuche

`sessions_search` durchsucht den Text von Benutzern und Assistenten in Ihren eigenen früheren Sitzungen. Jedes Ergebnis
enthält einen `sessionKey`, einen Zeitstempel, eine Rolle und einen kurzen passenden Auszug. Übergeben Sie den zurückgegebenen
`sessionKey` an `sessions_history`, wenn Sie die umgebende Unterhaltung benötigen.

## Sichtbarkeit und Ausgabe

Die Suche verwendet dieselben Regeln für die Sitzungssichtbarkeit wie `sessions_history`. Ergebnisse außerhalb des für den Aufrufer
sichtbaren Sitzungsbaums werden entfernt, bevor Ergebnislimits angewendet werden. Sandboxed Agents bleiben
auf die von ihnen gestarteten Sitzungen beschränkt, wenn die Sichtbarkeit gestarteter Sitzungen aktiviert ist.

Auszüge werden geschwärzt, bevor sie an das Modell zurückgegeben werden. Ergebnisse sind außerdem hinsichtlich Anzahl, Auszugslänge
und Gesamtgröße der Antwort begrenzt.

## Lebenszyklus des Index

OpenClaw speichert in der SQLite-Datenbank jedes Agents neben den Transkriptzeilen einen Volltextindex.
Neue Benutzer- und Assistentennachrichten werden in derselben Transaktion indexiert, in der sie gespeichert werden, sodass der
Index nie hinter laufenden Unterhaltungen zurückbleibt; Tool-Ergebnisse, Reasoning-Blöcke und Bilder werden ausgeschlossen.
Nur der aktive Zweig des Transkripts ist durchsuchbar.

Transkripte, die älter als der Index sind (beispielsweise durch `openclaw doctor` importierte Sitzungen), und
Sitzungen, deren aktiver Zweig zurückgesetzt wurde, werden durch einen im Hintergrund ausgeführten Abgleich neu indexiert, der
mit der nächsten Suche beginnt. Eine Antwort mit `indexing: true` kann daher unvollständig sein; versuchen Sie es erneut, nachdem
die Indexierung abgeschlossen ist. Beim Löschen einer Sitzung werden ihre Indexeinträge in derselben Transaktion entfernt.

Die Suche verwendet derzeit den Unicode-Wort-Tokenizer von SQLite mit Entfernung diakritischer Zeichen. Die Trigramm-Tokenisierung
für die CJK-Teilzeichenfolgensuche ist eine zukünftige Verbesserung.

## Sitzungssuche im Vergleich zur Speichersuche

Verwenden Sie `sessions_search` für exakte Wörter oder Ausdrücke aus unverarbeiteten Sitzungstranskripten. Verwenden Sie
[`memory_search`](/de/concepts/memory-search) für dauerhafte Speicherdateien und semantischen Abruf. Der
experimentelle Sitzungsspeicher-Korpus ist die semantische Ergänzung zu dieser exakten Transkriptsuche.
