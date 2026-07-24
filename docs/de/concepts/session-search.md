---
read_when:
    - Sie müssen etwas finden, das in einer früheren Sitzung besprochen wurde
    - Sie möchten den Datenschutz oder die Indizierung bei der Sitzungssuche verstehen
summary: Frühere Sitzungstranskripte durchsuchen und den passenden Kontext erneut öffnen
title: Sitzungssuche
x-i18n:
    generated_at: "2026-07-24T03:47:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# Sitzungssuche

`sessions_search` durchsucht die Benutzer- und Assistententexte in Ihren eigenen vergangenen Sitzungen. Jedes Ergebnis
enthält eine `sessionKey`, einen Zeitstempel, eine Rolle und einen kurzen übereinstimmenden Auszug. Übergeben Sie die zurückgegebene
`sessionKey` an `sessions_history`, wenn Sie den umgebenden Gesprächsverlauf benötigen.

## Sichtbarkeit und Ausgabe

Die Suche verwendet dieselben Regeln für die Sitzungssichtbarkeit wie `sessions_history`. Ergebnisse außerhalb des für den Aufrufer
sichtbaren Sitzungsbaums werden entfernt, bevor Ergebnisgrenzen angewendet werden. Sandbox-Agenten bleiben auf
die von ihnen gestarteten Sitzungen beschränkt, wenn die Sichtbarkeit gestarteter Sitzungen aktiviert ist.

Auszüge werden geschwärzt, bevor sie an das Modell zurückgegeben werden. Ergebnisse sind außerdem hinsichtlich Anzahl, Auszugslänge
und Gesamtgröße der Antwort begrenzt.

## Lebenszyklus des Index

OpenClaw speichert einen Volltextindex neben den Transkriptzeilen in der SQLite-Datenbank jedes Agenten.
Neue Benutzer- und Assistentennachrichten werden in derselben Transaktion indexiert, in der sie gespeichert werden, sodass der
Index nie hinter laufenden Gesprächen zurückbleibt; Werkzeugergebnisse, Reasoning-Blöcke und Bilder sind ausgeschlossen.
Nur der aktive Zweig des Transkripts ist durchsuchbar.

Transkripte, die älter als der Index sind (zum Beispiel durch `openclaw doctor` importierte Sitzungen), und
Sitzungen, deren aktiver Zweig zurückgesetzt wurde, werden durch einen Hintergrundabgleich neu indexiert, der
mit der nächsten Suche beginnt. Eine Antwort mit `indexing: true` kann daher unvollständig sein; versuchen Sie es erneut, nachdem
die Indexierung abgeschlossen ist. Beim Löschen einer Sitzung werden ihre Indexeinträge in derselben Transaktion entfernt.

Die Suche verwendet derzeit den Unicode-Wort-Tokenizer von SQLite mit Entfernung diakritischer Zeichen. Die Trigramm-Tokenisierung
für die CJK-Teilzeichenfolgensuche ist eine zukünftige Verbesserung.

## Sitzungssuche und Speichersuche

Verwenden Sie `sessions_search` für exakte Wörter oder Phrasen aus unverarbeiteten Sitzungstranskripten. Verwenden Sie
[`memory_search`](/de/concepts/memory-search) für dauerhafte Speicherdateien und semantischen Abruf. Der
experimentelle Sitzungsspeicher-Korpus ist die semantische Ergänzung zu dieser exakten Transkriptsuche.
