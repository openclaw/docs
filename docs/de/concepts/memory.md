---
read_when:
    - Sie möchten verstehen, wie der Speicher funktioniert
    - Sie möchten wissen, welche Speicherdateien Sie schreiben sollen
summary: Wie OpenClaw sich über Sitzungen hinweg an Dinge erinnert
title: Speicherübersicht
x-i18n:
    generated_at: "2026-05-10T19:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw merkt sich Dinge, indem es **einfache Markdown-Dateien** im Workspace Ihres Agenten
schreibt. Das Modell „erinnert“ sich nur an das, was auf der Festplatte gespeichert wird – es gibt keinen
verborgenen Zustand.

## Funktionsweise

Ihr Agent hat drei speicherbezogene Dateien:

- **`MEMORY.md`** – Langzeitspeicher. Dauerhafte Fakten, Präferenzen und
  Entscheidungen. Wird zu Beginn jeder DM-Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** – tägliche Notizen. Laufender Kontext und Beobachtungen.
  Die Notizen von heute und gestern werden automatisch geladen.
- **`DREAMS.md`** (optional) – Dream Diary und Zusammenfassungen von Dreaming-Durchläufen
  zur menschlichen Überprüfung, einschließlich fundierter historischer Backfill-Einträge.

Diese Dateien befinden sich im Agent-Workspace (Standard: `~/.openclaw/workspace`).

## Was wohin gehört

`MEMORY.md` ist die kompakte, kuratierte Ebene. Verwenden Sie sie für dauerhafte Fakten,
Präferenzen, bestehende Entscheidungen und kurze Zusammenfassungen, die zu Beginn
einer privaten Hauptsitzung verfügbar sein sollten. Sie ist nicht als Rohtranskript,
Tagesprotokoll oder vollständiges Archiv gedacht.

`memory/YYYY-MM-DD.md`-Dateien sind die Arbeitsebene. Verwenden Sie sie für detaillierte tägliche
Notizen, Beobachtungen, Sitzungszusammenfassungen und Rohkontext, der später noch nützlich
sein kann. Diese Dateien werden für `memory_search` und `memory_get` indiziert, aber sie werden
nicht bei jedem Turn in den normalen Bootstrap-Prompt eingefügt.

Mit der Zeit soll der Agent nützliches Material aus täglichen Notizen in
`MEMORY.md` destillieren und veraltete Langzeiteinträge entfernen. Die generierten Workspace-
Anweisungen und der Heartbeat-Ablauf können das regelmäßig erledigen; Sie müssen
`MEMORY.md` nicht für jedes gemerkte Detail manuell bearbeiten.

Wenn `MEMORY.md` das Bootstrap-Dateibudget überschreitet, lässt OpenClaw die Datei auf
der Festplatte intakt, kürzt aber die Kopie, die in den Modellkontext eingefügt wird. Betrachten Sie das als
Signal, detailliertes Material zurück nach `memory/*.md` zu verschieben, nur die
dauerhafte Zusammenfassung in `MEMORY.md` zu behalten oder die Bootstrap-Grenzen zu erhöhen, wenn Sie ausdrücklich
mehr Prompt-Budget dafür verwenden möchten. Verwenden Sie `/context list`, `/context detail` oder
`openclaw doctor`, um Roh- und eingefügte Größen sowie den Kürzungsstatus zu sehen.

<Tip>
Wenn Ihr Agent sich etwas merken soll, bitten Sie ihn einfach darum: „Merken Sie sich, dass ich
TypeScript bevorzuge.“ Er schreibt es in die passende Datei.
</Tip>

## Abgeleitete Verpflichtungen

Manche zukünftigen Follow-ups sind keine dauerhaften Fakten. Wenn Sie ein Vorstellungsgespräch
morgen erwähnen, kann die nützliche Erinnerung „nach dem Vorstellungsgespräch nachfragen“ sein, nicht „dies
für immer in `MEMORY.md` speichern“.

[Commitments](/de/concepts/commitments) sind optionale, kurzlebige Follow-up-Erinnerungen
für diesen Fall. OpenClaw leitet sie in einem verborgenen Hintergrunddurchlauf ab, begrenzt sie auf
denselben Agenten und Kanal und liefert fällige Nachfragen über Heartbeat aus.
Explizite Erinnerungen verwenden weiterhin [scheduled tasks](/de/automation/cron-jobs).

## Speicherwerkzeuge

Der Agent hat zwei Werkzeuge für die Arbeit mit Speicher:

- **`memory_search`** – findet relevante Notizen per semantischer Suche, auch wenn
  die Formulierung vom Original abweicht.
- **`memory_get`** – liest eine bestimmte Speicherdatei oder einen Zeilenbereich.

Beide Werkzeuge werden vom Active Memory-Plugin bereitgestellt (Standard: `memory-core`).

## Begleit-Plugin für Memory Wiki

Wenn Sie möchten, dass dauerhafter Speicher sich eher wie eine gepflegte Wissensdatenbank verhält
als nur wie rohe Notizen, verwenden Sie das gebündelte Plugin `memory-wiki`.

`memory-wiki` kompiliert dauerhaftes Wissen in einen Wiki-Tresor mit:

- deterministischer Seitenstruktur
- strukturierten Behauptungen und Belegen
- Verfolgung von Widersprüchen und Aktualität
- generierten Dashboards
- kompilierten Zusammenfassungen für Agent-/Runtime-Verbraucher
- wiki-nativen Werkzeugen wie `wiki_search`, `wiki_get`, `wiki_apply` und `wiki_lint`

Es ersetzt das Active Memory-Plugin nicht. Das Active Memory-Plugin bleibt weiterhin
für Abruf, Beförderung und Dreaming zuständig. `memory-wiki` fügt daneben eine
provenienzreiche Wissensebene hinzu.

Siehe [Memory Wiki](/de/plugins/memory-wiki).

## Speichersuche

Wenn ein Embedding-Provider konfiguriert ist, verwendet `memory_search` **hybride
Suche** – eine Kombination aus Vektorähnlichkeit (semantische Bedeutung) und Schlüsselwortabgleich
(exakte Begriffe wie IDs und Codesymbole). Das funktioniert sofort, sobald Sie
einen API-Schlüssel für einen unterstützten Provider haben.

<Info>
OpenClaw erkennt Ihren Embedding-Provider automatisch anhand verfügbarer API-Schlüssel. Wenn Sie
einen OpenAI-, Gemini-, Voyage- oder Mistral-Schlüssel konfiguriert haben, ist die Speichersuche
automatisch aktiviert.
</Info>

Details zur Funktionsweise der Suche, zu Tuning-Optionen und zur Provider-Einrichtung finden Sie unter
[Memory Search](/de/concepts/memory-search).

## Speicher-Backends

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/de/concepts/memory-builtin">
SQLite-basiert. Funktioniert sofort mit Schlüsselwortsuche, Vektorähnlichkeit und
hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/de/concepts/memory-qmd">
Local-first-Sidecar mit Reranking, Abfrageerweiterung und der Möglichkeit, Verzeichnisse
außerhalb des Workspace zu indizieren.
</Card>
<Card title="Honcho" icon="brain" href="/de/concepts/memory-honcho">
KI-nativer sitzungsübergreifender Speicher mit Benutzermodellierung, semantischer Suche und
Multi-Agent-Bewusstsein. Plugin-Installation.
</Card>
<Card title="LanceDB" icon="layers" href="/de/plugins/memory-lancedb">
Gebündelter LanceDB-gestützter Speicher mit OpenAI-kompatiblen Embeddings, Auto-Recall,
Auto-Capture und lokaler Ollama-Embedding-Unterstützung.
</Card>
</CardGroup>

## Wissens-Wiki-Ebene

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/de/plugins/memory-wiki">
Kompiliert dauerhaften Speicher in einen provenienzreichen Wiki-Tresor mit Behauptungen,
Dashboards, Bridge-Modus und Obsidian-freundlichen Workflows.
</Card>
</CardGroup>

## Automatischer Speicher-Flush

Bevor [Compaction](/de/concepts/compaction) Ihre Unterhaltung zusammenfasst, führt OpenClaw
einen stillen Turn aus, der den Agenten daran erinnert, wichtigen Kontext in Speicherdateien
zu speichern. Das ist standardmäßig aktiviert – Sie müssen nichts konfigurieren.

Um diesen Haushaltungs-Turn auf einem lokalen Modell auszuführen, setzen Sie ein exaktes Modell-
Override für den Speicher-Flush:

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

Das Override gilt nur für den Speicher-Flush-Turn und erbt nicht die
Fallback-Kette der aktiven Sitzung.

<Tip>
Der Speicher-Flush verhindert Kontextverlust während der Compaction. Wenn Ihr Agent
wichtige Fakten in der Unterhaltung hat, die noch nicht in eine Datei geschrieben wurden, werden sie
automatisch gespeichert, bevor die Zusammenfassung erfolgt.
</Tip>

## Dreaming

Dreaming ist ein optionaler Hintergrund-Konsolidierungsdurchlauf für Speicher. Es sammelt
kurzfristige Signale, bewertet Kandidaten und befördert nur qualifizierte Elemente in den
Langzeitspeicher (`MEMORY.md`).

Es ist darauf ausgelegt, den Langzeitspeicher signalstark zu halten:

- **Optional**: standardmäßig deaktiviert.
- **Geplant**: wenn aktiviert, verwaltet `memory-core` automatisch einen wiederkehrenden Cron-Job
  für einen vollständigen Dreaming-Durchlauf.
- **Schwellenwertbasiert**: Beförderungen müssen Bewertungs-, Abrufhäufigkeits- und Abfrage-
  Diversitäts-Gates bestehen.
- **Überprüfbar**: Phasenzusammenfassungen und Tagebucheinträge werden zur menschlichen Überprüfung
  in `DREAMS.md` geschrieben.

Details zum Phasenverhalten, zu Bewertungssignalen und zum Dream Diary finden Sie unter
[Dreaming](/de/concepts/dreaming).

## Fundierter Backfill und Live-Beförderung

Das Dreaming-System hat jetzt zwei eng verwandte Prüfpfade:

- **Live-Dreaming** arbeitet aus dem kurzfristigen Dreaming-Speicher unter
  `memory/.dreams/` und wird von der normalen Deep-Phase verwendet, wenn entschieden wird, was
  in `MEMORY.md` aufsteigen kann.
- **Fundierter Backfill** liest historische `memory/YYYY-MM-DD.md`-Notizen als
  eigenständige Tagesdateien und schreibt strukturierte Prüfausgaben in `DREAMS.md`.

Fundierter Backfill ist nützlich, wenn Sie ältere Notizen erneut durchspielen und prüfen möchten, was
das System für dauerhaft hält, ohne `MEMORY.md` manuell zu bearbeiten.

Wenn Sie Folgendes verwenden:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

werden die fundierten dauerhaften Kandidaten nicht direkt befördert. Sie werden in
denselben kurzfristigen Dreaming-Speicher gestellt, den die normale Deep-Phase bereits verwendet. Das
bedeutet:

- `DREAMS.md` bleibt die Oberfläche für menschliche Überprüfung.
- der kurzfristige Speicher bleibt die maschinenseitige Ranking-Oberfläche.
- `MEMORY.md` wird weiterhin nur durch Deep-Beförderung geschrieben.

Wenn Sie entscheiden, dass die Wiederholung nicht nützlich war, können Sie die bereitgestellten Artefakte
entfernen, ohne gewöhnliche Tagebucheinträge oder den normalen Recall-Zustand anzutasten:

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

## Weitere Informationen

- [Builtin memory engine](/de/concepts/memory-builtin): Standard-SQLite-Backend.
- [QMD memory engine](/de/concepts/memory-qmd): fortgeschrittenes Local-first-Sidecar.
- [Honcho memory](/de/concepts/memory-honcho): KI-nativer sitzungsübergreifender Speicher.
- [Memory LanceDB](/de/plugins/memory-lancedb): LanceDB-gestütztes Plugin mit OpenAI-kompatiblen Embeddings.
- [Memory Wiki](/de/plugins/memory-wiki): kompilierter Wissenstresor und wiki-native Werkzeuge.
- [Memory search](/de/concepts/memory-search): Suchpipeline, Provider und Tuning.
- [Dreaming](/de/concepts/dreaming): Hintergrund-Beförderung von kurzfristigem Recall in den Langzeitspeicher.
- [Memory configuration reference](/de/reference/memory-config): alle Konfigurationsschalter.
- [Compaction](/de/concepts/compaction): wie Compaction mit Speicher interagiert.

## Verwandt

- [Active memory](/de/concepts/active-memory)
- [Memory search](/de/concepts/memory-search)
- [Builtin memory engine](/de/concepts/memory-builtin)
- [Honcho memory](/de/concepts/memory-honcho)
- [Memory LanceDB](/de/plugins/memory-lancedb)
- [Commitments](/de/concepts/commitments)
