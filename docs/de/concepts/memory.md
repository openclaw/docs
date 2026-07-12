---
read_when:
    - Sie möchten verstehen, wie der Speicher funktioniert.
    - Sie möchten wissen, welche Speicherdateien Sie schreiben sollen
summary: Wie OpenClaw sich sitzungsübergreifend an Dinge erinnert
title: Speicherübersicht
x-i18n:
    generated_at: "2026-07-12T01:32:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw merkt sich Dinge, indem es einfache Markdown-Dateien in den
Arbeitsbereich Ihres Agenten schreibt (standardmäßig `~/.openclaw/workspace`).
Das Modell erinnert sich nur an Inhalte, die auf der Festplatte gespeichert
werden; es gibt keinen verborgenen Zustand.

## Funktionsweise

Ihr Agent verfügt über drei gedächtnisbezogene Dateien:

- **`MEMORY.md`** — Langzeitgedächtnis. Dauerhafte Fakten, Präferenzen und
  Entscheidungen. Wird zu Beginn einer Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** (oder `memory/YYYY-MM-DD-<slug>.md`) — tägliche Notizen.
  Laufender Kontext und Beobachtungen. Die datierten Notizen von heute und
  gestern werden bei einem einfachen `/new` oder `/reset` automatisch geladen;
  Varianten mit Slug, beispielsweise solche, die vom mitgelieferten
  Sitzungsgedächtnis-Hook geschrieben werden, werden zusammen mit der Datei
  berücksichtigt, die nur das Datum enthält.
- **`DREAMS.md`** (optional) — Traumtagebuch und Zusammenfassungen der
  Dreaming-Durchläufe zur menschlichen Überprüfung, einschließlich fundierter
  historischer Nachträge.

<Tip>
Wenn Ihr Agent sich etwas merken soll, bitten Sie ihn einfach darum:
„Merken Sie sich, dass ich TypeScript bevorzuge.“ Er schreibt die Notiz in die
passende Datei.
</Tip>

## Welche Inhalte wohin gehören

`MEMORY.md` ist die kompakte, kuratierte Ebene: dauerhafte Fakten, Präferenzen,
fortbestehende Entscheidungen und kurze Zusammenfassungen, die zu Beginn einer
Sitzung verfügbar sein sollen. Sie ist weder ein Rohtranskript noch ein
Tagesprotokoll oder ein vollständiges Archiv.

`memory/YYYY-MM-DD.md`-Dateien bilden die Arbeitsebene: ausführliche tägliche
Notizen, Beobachtungen, Sitzungszusammenfassungen und Rohkontext, die später
noch nützlich sein können. Sie werden für `memory_search` und `memory_get`
indiziert, aber nicht bei jeder Interaktion in den Bootstrap-Prompt eingefügt.

Im Laufe der Zeit verdichtet der Agent nützliche Inhalte aus den täglichen
Notizen in `MEMORY.md` und entfernt veraltete Langzeiteinträge. Generierte
Arbeitsbereichsanweisungen und der Heartbeat-Ablauf erledigen dies regelmäßig;
Sie müssen `MEMORY.md` nicht für jedes Detail manuell bearbeiten.

Wenn `MEMORY.md` das Budget für Bootstrap-Dateien überschreitet, lässt OpenClaw
die Datei auf der Festplatte unverändert, kürzt jedoch die in den Kontext
eingefügte Kopie. Betrachten Sie dies als Hinweis, ausführliche Inhalte nach
`memory/*.md` zu verschieben, in `MEMORY.md` nur eine dauerhafte
Zusammenfassung beizubehalten oder die Bootstrap-Grenzwerte zu erhöhen, wenn
Sie mehr Prompt-Budget verwenden möchten. Verwenden Sie `/context list`,
`/context detail` oder `openclaw doctor`, um die Rohgröße, die eingefügte Größe
und den Kürzungsstatus anzuzeigen.

## Aktionsrelevante Erinnerungen

Die meisten Erinnerungen sind gewöhnliche Markdown-Notizen. Einige beeinflussen,
was der Agent später tun soll; halten Sie bei diesen nicht nur die Tatsache
selbst fest, sondern auch, wann auf Grundlage der Notiz sicher gehandelt werden
kann.

Erfassen Sie diese Handlungsgrenze, wenn eine Notiz Folgendes betrifft:

- Genehmigungs- oder Berechtigungsanforderungen,
- vorübergehende Einschränkungen,
- Übergaben an eine andere Sitzung, einen anderen Thread oder eine andere Person,
- Ablaufbedingungen,
- den Zeitpunkt, ab dem sicher gehandelt werden kann,
- die Autorität der Quelle oder des Verantwortlichen,
- Anweisungen, eine naheliegende Handlung zu vermeiden.

Eine nützliche aktionsrelevante Erinnerung verdeutlicht:

- was das zukünftige Verhalten ändert,
- wann oder unter welcher Bedingung sie gilt,
- wann sie abläuft oder wodurch eine Handlung freigegeben wird,
- welche Handlung der Agent vermeiden soll,
- wer die Quelle oder der Verantwortliche ist, falls dies Vertrauen oder
  Autorität beeinflusst.

Das Gedächtnis kann den Genehmigungskontext bewahren, setzt Richtlinien jedoch
nicht durch. Verwenden Sie für verbindliche operative Kontrollen die
Genehmigungseinstellungen von OpenClaw, Sandboxing und geplante Aufgaben.

Beispiel:

```md
Die API-Migration wird in einer anderen Sitzung entworfen. Zukünftige
Interaktionen dürfen die API-Implementierung nicht aus diesem Thread heraus
bearbeiten; verwenden Sie die Erkenntnisse hier nur als Entwurfsgrundlage, bis
der Migrationsplan umgesetzt ist.
```

Ein weiteres Beispiel:

```md
Ein Bericht aus einer nicht vertrauenswürdigen Quelle muss vor der Übernahme
geprüft werden. Zukünftige Interaktionen dürfen ihn nur als Beleg behandeln;
speichern Sie ihn erst dann als dauerhafte Erinnerung, wenn eine
vertrauenswürdige prüfende Person den Inhalt bestätigt hat.
```

Dies ist kein erforderliches Schema für jede Erinnerung; einfache Fakten können
knapp bleiben. Verwenden Sie aktionsrelevante Grenzen, wenn der Verlust von
Zeitpunkt, Autorität, Ablauf oder Kontext für sicheres Handeln dazu führen
könnte, dass der Agent später falsch handelt.

Verwenden Sie [Zusagen](/de/concepts/commitments) für abgeleitete, kurzlebige
Folgeaktionen. Verwenden Sie [geplante Aufgaben](/de/automation/cron-jobs) für
genaue Erinnerungen, zeitgesteuerte Prüfungen und wiederkehrende Arbeiten. Das
Gedächtnis kann den dauerhaften Kontext zu beiden Pfaden weiterhin
zusammenfassen.

## Abgeleitete Zusagen

Manche zukünftigen Folgeaktionen sind keine dauerhaften Fakten. Wenn Sie ein
Vorstellungsgespräch am nächsten Tag erwähnen, könnte die nützliche Erinnerung
„nach dem Vorstellungsgespräch nachfragen“ lauten, nicht „dies dauerhaft in
`MEMORY.md` speichern“.

[Zusagen](/de/concepts/commitments) sind optionale, kurzlebige Erinnerungen an
Folgeaktionen für diesen Fall. OpenClaw leitet sie in einem verborgenen
Hintergrunddurchlauf ab, beschränkt sie auf denselben Agenten und Kanal und
liefert fällige Rückfragen über Heartbeat aus. Explizite Erinnerungen verwenden
weiterhin [geplante Aufgaben](/de/automation/cron-jobs).

## Gedächtniswerkzeuge

Der Agent verfügt über zwei Werkzeuge für die Arbeit mit dem Gedächtnis:

- **`memory_search`** — findet relevante Notizen mithilfe semantischer Suche,
  selbst wenn die Formulierung vom Original abweicht.
- **`memory_get`** — liest eine bestimmte Gedächtnisdatei oder einen
  Zeilenbereich.

Beide Werkzeuge werden vom aktiven Gedächtnis-Plugin bereitgestellt
(standardmäßig `memory-core`).

## Gedächtnissuche

Wenn ein Embedding-Provider konfiguriert ist, verwendet `memory_search` eine
hybride Suche: Vektorähnlichkeit (semantische Bedeutung) kombiniert mit
Schlüsselwortabgleich (exakte Begriffe wie IDs und Codesymbole). Dies
funktioniert ohne weitere Einrichtung mit einem API-Schlüssel für jeden
unterstützten Provider.

<Info>
OpenClaw verwendet standardmäßig OpenAI-Embeddings. Legen Sie
`agents.defaults.memorySearch.provider` ausdrücklich fest, um Gemini, Voyage,
Mistral, Bedrock, DeepInfra, lokales GGUF, Ollama, LM Studio, GitHub Copilot
oder einen generischen OpenAI-kompatiblen Endpunkt zu verwenden.
</Info>

Unter [Gedächtnissuche](/de/concepts/memory-search) erfahren Sie, wie die Suche
funktioniert und welche Optimierungsoptionen und Einrichtungsschritte für
Provider verfügbar sind.

## Gedächtnis-Backends

<CardGroup cols={3}>
<Card title="Integriert (Standard)" icon="database" href="/de/concepts/memory-builtin">
SQLite-basiert. Funktioniert ohne weitere Einrichtung mit Schlüsselwortsuche,
Vektorähnlichkeit und hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/de/concepts/memory-qmd">
Auf lokale Nutzung ausgerichteter Sidecar mit Neugewichtung,
Abfrageerweiterung und der Möglichkeit, Verzeichnisse außerhalb des
Arbeitsbereichs zu indizieren.
</Card>
<Card title="Honcho" icon="brain" href="/de/concepts/memory-honcho">
KI-natives sitzungsübergreifendes Gedächtnis mit Benutzermodellierung,
semantischer Suche und Bewusstsein für mehrere Agenten. Installation als
Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/de/plugins/memory-lancedb">
LanceDB-gestütztes Gedächtnis mit OpenAI-kompatiblen Embeddings, automatischem
Abruf, automatischer Erfassung und Unterstützung lokaler Ollama-Embeddings.
Installation als Plugin.
</Card>
</CardGroup>

## Wissens-Wiki-Ebene

Wenn sich das dauerhafte Gedächtnis eher wie eine gepflegte Wissensbasis als
wie Rohnotizen verhalten soll, verwenden Sie das mitgelieferte Plugin
`memory-wiki`. Es überführt dauerhaftes Wissen in einen Wiki-Tresor mit
deterministischer Seitenstruktur, strukturierten Aussagen und Belegen,
Nachverfolgung von Widersprüchen und Aktualität, generierten Übersichten,
kompilierten Zusammenfassungen und Wiki-nativen Werkzeugen (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` ersetzt das aktive Gedächtnis-Plugin nicht; das aktive
Gedächtnis-Plugin bleibt für Abruf, Übernahme und Dreaming verantwortlich.
`memory-wiki` ergänzt daneben eine wissensbasierte Ebene mit umfassenden
Herkunftsnachweisen.

<CardGroup cols={1}>
<Card title="Gedächtnis-Wiki" icon="book" href="/de/plugins/memory-wiki">
Überführt dauerhaftes Gedächtnis in einen Wiki-Tresor mit umfassenden
Herkunftsnachweisen, Aussagen, Übersichten, Brückenmodus und
Obsidian-freundlichen Arbeitsabläufen.
</Card>
</CardGroup>

## Automatische Gedächtnissicherung

Bevor [Compaction](/de/concepts/compaction) Ihre Unterhaltung zusammenfasst,
führt OpenClaw eine stille Interaktion aus, die den Agenten daran erinnert,
wichtigen Kontext in Gedächtnisdateien zu speichern. Dies ist standardmäßig
aktiviert; setzen Sie `agents.defaults.compaction.memoryFlush.enabled: false`,
um es zu deaktivieren.

Um diesen Verwaltungsdurchlauf auf einem lokalen Modell auszuführen, legen Sie
eine exakte Überschreibung fest, die ausschließlich für den
Gedächtnissicherungsdurchlauf gilt (sie übernimmt nicht die
Modell-Fallback-Kette der aktiven Sitzung):

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

<Tip>
Die Gedächtnissicherung verhindert Kontextverlust während der Compaction. Wenn
Ihre Unterhaltung wichtige Fakten enthält, die der Agent noch nicht in eine
Datei geschrieben hat, werden sie automatisch gespeichert, bevor die
Zusammenfassung erstellt wird.
</Tip>

## Dreaming

Dreaming ist ein optionaler Konsolidierungsdurchlauf für das Gedächtnis im
Hintergrund. Er sammelt kurzfristige Abrufsignale, bewertet Kandidaten und
übernimmt nur qualifizierte Elemente in das Langzeitgedächtnis (`MEMORY.md`):

- **Optional**: standardmäßig deaktiviert.
- **Geplant**: Wenn aktiviert, verwaltet `memory-core` automatisch einen
  wiederkehrenden Cron-Auftrag für einen vollständigen Dreaming-Durchlauf.
- **Schwellenwertbasiert**: Übernahmen müssen Schwellen für Bewertung,
  Abrufhäufigkeit und Abfragevielfalt passieren.
- **Überprüfbar**: Phasenzusammenfassungen und Tagebucheinträge werden zur
  menschlichen Überprüfung in `DREAMS.md` geschrieben.

Unter [Dreaming](/de/concepts/dreaming) finden Sie Einzelheiten zum
Phasenverhalten, zu Bewertungssignalen und zum Traumtagebuch.

## Fundierter Nachtrag und direkte Übernahme

Das Dreaming-System verfügt über zwei zusammenhängende Prüfpfade:

- **Direktes Dreaming** arbeitet mit dem kurzfristigen Dreaming-Speicher unter
  `memory/.dreams/` und wird von der normalen tiefen Phase verwendet, um zu
  entscheiden, was in `MEMORY.md` übernommen wird.
- **Fundierter Nachtrag** liest historische `memory/YYYY-MM-DD.md`-Notizen als
  eigenständige Tagesdateien und schreibt strukturierte Prüfergebnisse in
  `DREAMS.md`.

Der fundierte Nachtrag eignet sich dazu, ältere Notizen erneut zu verarbeiten
und zu prüfen, welche Inhalte das System als dauerhaft betrachtet, ohne
`MEMORY.md` manuell zu bearbeiten.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das Flag `--stage-short-term` überführt fundierte dauerhafte Kandidaten in
denselben kurzfristigen Dreaming-Speicher, den die normale tiefe Phase bereits
verwendet; es übernimmt sie nicht direkt. Daher gilt:

- `DREAMS.md` bleibt die Oberfläche zur menschlichen Überprüfung.
- Der kurzfristige Speicher bleibt die maschinenorientierte
  Bewertungsoberfläche.
- `MEMORY.md` wird weiterhin ausschließlich durch die tiefe Übernahme
  beschrieben.

So machen Sie eine erneute Verarbeitung rückgängig, ohne gewöhnliche
Tagebucheinträge oder den normalen Abrufzustand zu verändern:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Indexstatus und Provider prüfen
openclaw memory search "query"  # Über die Befehlszeile suchen
openclaw memory index --force   # Index neu erstellen
```

## Weiterführende Informationen

- [Gedächtnissuche](/de/concepts/memory-search): Suchpipeline, Provider und Optimierung.
- [Integrierte Gedächtnis-Engine](/de/concepts/memory-builtin): standardmäßiges SQLite-Backend.
- [QMD-Gedächtnis-Engine](/de/concepts/memory-qmd): fortgeschrittener, auf lokale Nutzung ausgerichteter Sidecar.
- [Honcho-Gedächtnis](/de/concepts/memory-honcho): KI-natives sitzungsübergreifendes Gedächtnis.
- [LanceDB-Gedächtnis](/de/plugins/memory-lancedb): LanceDB-gestütztes Plugin mit OpenAI-kompatiblen Embeddings.
- [Gedächtnis-Wiki](/de/plugins/memory-wiki): kompilierter Wissenstresor und Wiki-native Werkzeuge.
- [Dreaming](/de/concepts/dreaming): Übernahme aus dem kurzfristigen Abruf in das Langzeitgedächtnis im Hintergrund.
- [Referenz zur Gedächtniskonfiguration](/de/reference/memory-config): alle Konfigurationsoptionen.
- [Compaction](/de/concepts/compaction): Zusammenspiel von Compaction und Gedächtnis.
- [Active Memory](/de/concepts/active-memory): Gedächtnis von Unteragenten für interaktive Chatsitzungen.
