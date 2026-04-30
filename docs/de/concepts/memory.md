---
read_when:
    - Sie möchten verstehen, wie Speicher funktioniert
    - Sie möchten wissen, welche Speicherdateien Sie schreiben sollen
summary: Wie OpenClaw sich Informationen sitzungsübergreifend merkt
title: Speicherübersicht
x-i18n:
    generated_at: "2026-04-30T06:49:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw merkt sich Dinge, indem es **einfache Markdown-Dateien** im Arbeitsbereich Ihres Agenten schreibt. Das Modell „erinnert“ sich nur an das, was auf der Festplatte gespeichert wird – es gibt keinen versteckten Zustand.

## Funktionsweise

Ihr Agent hat drei speicherbezogene Dateien:

- **`MEMORY.md`** – Langzeitgedächtnis. Dauerhafte Fakten, Präferenzen und Entscheidungen. Wird zu Beginn jeder DM-Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** – tägliche Notizen. Laufender Kontext und Beobachtungen. Die Notizen von heute und gestern werden automatisch geladen.
- **`DREAMS.md`** (optional) – Dream Diary und Dreaming-Durchlaufzusammenfassungen zur menschlichen Prüfung, einschließlich belegter historischer Backfill-Einträge.

Diese Dateien befinden sich im Arbeitsbereich des Agenten (Standard: `~/.openclaw/workspace`).

<Tip>
Wenn Ihr Agent sich etwas merken soll, fragen Sie ihn einfach: „Merken Sie sich, dass ich TypeScript bevorzuge.“ Er schreibt es in die passende Datei.
</Tip>

## Abgeleitete Verpflichtungen

Einige zukünftige Nachfassaktionen sind keine dauerhaften Fakten. Wenn Sie ein Interview morgen erwähnen, kann die nützliche Erinnerung „nach dem Interview nachfragen“ sein, nicht „dies dauerhaft in `MEMORY.md` speichern“.

[Commitments](/de/concepts/commitments) sind optionale, kurzlebige Nachfass-Erinnerungen für diesen Fall. OpenClaw leitet sie in einem versteckten Hintergrunddurchlauf ab, begrenzt sie auf denselben Agenten und Kanal und liefert fällige Check-ins über Heartbeat aus. Explizite Erinnerungen verwenden weiterhin [geplante Aufgaben](/de/automation/cron-jobs).

## Memory-Tools

Der Agent hat zwei Tools für die Arbeit mit Memory:

- **`memory_search`** – findet relevante Notizen per semantischer Suche, auch wenn die Formulierung vom Original abweicht.
- **`memory_get`** – liest eine bestimmte Memory-Datei oder einen Zeilenbereich.

Beide Tools werden vom Active Memory-Plugin bereitgestellt (Standard: `memory-core`).

## Begleitendes Memory Wiki-Plugin

Wenn dauerhaftes Memory eher wie eine gepflegte Wissensbasis statt nur wie Rohnotizen funktionieren soll, verwenden Sie das gebündelte `memory-wiki`-Plugin.

`memory-wiki` kompiliert dauerhaftes Wissen in einen Wiki-Vault mit:

- deterministischer Seitenstruktur
- strukturierten Behauptungen und Belegen
- Nachverfolgung von Widersprüchen und Aktualität
- generierten Dashboards
- kompilierten Digests für Agent-/Runtime-Verbraucher
- Wiki-nativen Tools wie `wiki_search`, `wiki_get`, `wiki_apply` und `wiki_lint`

Es ersetzt nicht das Active Memory-Plugin. Das Active Memory-Plugin bleibt für Recall, Promotion und Dreaming zuständig. `memory-wiki` fügt daneben eine wissensbezogene Ebene mit reichhaltiger Provenienz hinzu.

Siehe [Memory Wiki](/de/plugins/memory-wiki).

## Memory-Suche

Wenn ein Embedding-Provider konfiguriert ist, verwendet `memory_search` **hybride Suche** – eine Kombination aus Vektorähnlichkeit (semantische Bedeutung) und Schlüsselwortabgleich (exakte Begriffe wie IDs und Code-Symbole). Das funktioniert sofort, sobald Sie einen API-Schlüssel für einen unterstützten Provider haben.

<Info>
OpenClaw erkennt Ihren Embedding-Provider automatisch anhand verfügbarer API-Schlüssel. Wenn Sie einen OpenAI-, Gemini-, Voyage- oder Mistral-Schlüssel konfiguriert haben, wird die Memory-Suche automatisch aktiviert.
</Info>

Details zur Funktionsweise der Suche, zu Tuning-Optionen und zur Provider-Einrichtung finden Sie unter [Memory Search](/de/concepts/memory-search).

## Memory-Backends

<CardGroup cols={3}>
<Card title="Integriert (Standard)" icon="database" href="/de/concepts/memory-builtin">
SQLite-basiert. Funktioniert sofort mit Schlüsselwortsuche, Vektorähnlichkeit und hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/de/concepts/memory-qmd">
Local-first-Sidecar mit Reranking, Query Expansion und der Möglichkeit, Verzeichnisse außerhalb des Arbeitsbereichs zu indexieren.
</Card>
<Card title="Honcho" icon="brain" href="/de/concepts/memory-honcho">
KI-natives sitzungsübergreifendes Memory mit Benutzermodellierung, semantischer Suche und Multi-Agent-Bewusstsein. Plugin-Installation.
</Card>
<Card title="LanceDB" icon="layers" href="/de/plugins/memory-lancedb">
Gebündeltes LanceDB-gestütztes Memory mit OpenAI-kompatiblen Embeddings, Auto-Recall, Auto-Capture und lokaler Ollama-Embedding-Unterstützung.
</Card>
</CardGroup>

## Wissens-Wiki-Ebene

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/de/plugins/memory-wiki">
Kompiliert dauerhaftes Memory in einen Wiki-Vault mit reichhaltiger Provenienz, einschließlich Behauptungen, Dashboards, Bridge-Modus und Obsidian-freundlichen Workflows.
</Card>
</CardGroup>

## Automatischer Memory-Flush

Bevor [Compaction](/de/concepts/compaction) Ihre Unterhaltung zusammenfasst, führt OpenClaw einen stillen Turn aus, der den Agenten daran erinnert, wichtigen Kontext in Memory-Dateien zu speichern. Dies ist standardmäßig aktiviert – Sie müssen nichts konfigurieren.

Um diesen Verwaltungs-Turn auf einem lokalen Modell zu halten, legen Sie eine exakte Überschreibung für das Memory-Flush-Modell fest:

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

Die Überschreibung gilt nur für den Memory-Flush-Turn und übernimmt nicht die Fallback-Kette der aktiven Sitzung.

<Tip>
Der Memory-Flush verhindert Kontextverlust während der Compaction. Wenn Ihr Agent wichtige Fakten in der Unterhaltung hat, die noch nicht in eine Datei geschrieben wurden, werden sie automatisch gespeichert, bevor die Zusammenfassung erfolgt.
</Tip>

## Dreaming

Dreaming ist ein optionaler Konsolidierungsdurchlauf im Hintergrund für Memory. Es sammelt kurzfristige Signale, bewertet Kandidaten und befördert nur qualifizierte Elemente in das Langzeitgedächtnis (`MEMORY.md`).

Es ist darauf ausgelegt, das Langzeitgedächtnis signalstark zu halten:

- **Opt-in**: standardmäßig deaktiviert.
- **Geplant**: Wenn aktiviert, verwaltet `memory-core` automatisch einen wiederkehrenden Cron-Job für einen vollständigen Dreaming-Durchlauf.
- **Schwellenwertbasiert**: Promotions müssen Score-, Recall-Häufigkeits- und Query-Diversity-Gates bestehen.
- **Überprüfbar**: Phasenzusammenfassungen und Diary-Einträge werden zur menschlichen Prüfung in `DREAMS.md` geschrieben.

Details zum Phasenverhalten, zu Bewertungssignalen und zum Dream Diary finden Sie unter [Dreaming](/de/concepts/dreaming).

## Belegter Backfill und Live-Promotion

Das Dreaming-System hat jetzt zwei eng verwandte Review-Lanes:

- **Live-Dreaming** arbeitet mit dem kurzfristigen Dreaming-Speicher unter `memory/.dreams/` und wird von der normalen Deep-Phase verwendet, wenn entschieden wird, was in `MEMORY.md` aufgenommen werden kann.
- **Belegter Backfill** liest historische `memory/YYYY-MM-DD.md`-Notizen als eigenständige Tagesdateien und schreibt strukturierte Review-Ausgaben in `DREAMS.md`.

Belegter Backfill ist nützlich, wenn Sie ältere Notizen erneut abspielen und prüfen möchten, was das System ohne manuelle Bearbeitung von `MEMORY.md` als dauerhaft einschätzt.

Wenn Sie Folgendes verwenden:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

werden die belegten dauerhaften Kandidaten nicht direkt befördert. Sie werden in denselben kurzfristigen Dreaming-Speicher aufgenommen, den die normale Deep-Phase bereits verwendet. Das bedeutet:

- `DREAMS.md` bleibt die Review-Oberfläche für Menschen.
- der kurzfristige Speicher bleibt die Ranking-Oberfläche für Maschinen.
- `MEMORY.md` wird weiterhin nur durch Deep-Promotion geschrieben.

Wenn Sie entscheiden, dass die Wiederholung nicht nützlich war, können Sie die gestagten Artefakte entfernen, ohne normale Diary-Einträge oder den normalen Recall-Zustand zu berühren:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Weiterführende Informationen

- [Integrierte Memory-Engine](/de/concepts/memory-builtin): Standard-SQLite-Backend.
- [QMD-Memory-Engine](/de/concepts/memory-qmd): fortgeschrittener Local-first-Sidecar.
- [Honcho-Memory](/de/concepts/memory-honcho): KI-natives sitzungsübergreifendes Memory.
- [Memory LanceDB](/de/plugins/memory-lancedb): LanceDB-gestütztes Plugin mit OpenAI-kompatiblen Embeddings.
- [Memory Wiki](/de/plugins/memory-wiki): kompilierter Wissens-Vault und Wiki-native Tools.
- [Memory-Suche](/de/concepts/memory-search): Suchpipeline, Provider und Tuning.
- [Dreaming](/de/concepts/dreaming): Hintergrund-Promotion von kurzfristigem Recall zu langfristigem Memory.
- [Memory-Konfigurationsreferenz](/de/reference/memory-config): alle Konfigurationsoptionen.
- [Compaction](/de/concepts/compaction): wie Compaction mit Memory interagiert.

## Verwandt

- [Active Memory](/de/concepts/active-memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Integrierte Memory-Engine](/de/concepts/memory-builtin)
- [Honcho-Memory](/de/concepts/memory-honcho)
- [Memory LanceDB](/de/plugins/memory-lancedb)
- [Commitments](/de/concepts/commitments)
