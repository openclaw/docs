---
read_when:
    - Sie möchten verstehen, wie der Speicher funktioniert
    - Sie möchten wissen, welche Speicherdateien geschrieben werden
summary: Wie OpenClaw sich Dinge sitzungsübergreifend merkt
title: Speicherüberblick
x-i18n:
    generated_at: "2026-04-06T03:06:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d19d4fa9c4b3232b7a97f7a382311d2a375b562040de15e9fe4a0b1990b825e7
    source_path: concepts/memory.md
    workflow: 15
---

# Speicherüberblick

OpenClaw merkt sich Dinge, indem es **einfache Markdown-Dateien** im Workspace
Ihres Agenten schreibt. Das Modell „erinnert“ sich nur an das, was auf der
Festplatte gespeichert wird -- es gibt keinen versteckten Zustand.

## So funktioniert es

Ihr Agent hat drei speicherbezogene Dateien:

- **`MEMORY.md`** -- Langzeitspeicher. Dauerhafte Fakten, Präferenzen und
  Entscheidungen. Wird zu Beginn jeder DM-Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** -- tägliche Notizen. Laufender Kontext und
  Beobachtungen. Die Notizen von heute und gestern werden automatisch geladen.
- **`DREAMS.md`** (experimentell, optional) -- Dream Diary und Zusammenfassungen
  von Dreaming-Durchläufen zur menschlichen Überprüfung.

Diese Dateien befinden sich im Workspace des Agenten (Standard:
`~/.openclaw/workspace`).

<Tip>
Wenn Sie möchten, dass Ihr Agent sich etwas merkt, sagen Sie es ihm einfach:
„Merke dir, dass ich TypeScript bevorzuge.“ Er schreibt es dann in die passende
Datei.
</Tip>

## Speicher-Tools

Der Agent hat zwei Tools für die Arbeit mit Speicher:

- **`memory_search`** -- findet relevante Notizen mithilfe semantischer Suche,
  auch wenn die Formulierung vom Original abweicht.
- **`memory_get`** -- liest eine bestimmte Speicherdatei oder einen
  Zeilenbereich.

Beide Tools werden vom aktiven Speicher-Plugin bereitgestellt (Standard:
`memory-core`).

## Speichersuche

Wenn ein Embedding-Anbieter konfiguriert ist, verwendet `memory_search` eine
**hybride Suche** -- eine Kombination aus Vektorähnlichkeit (semantische
Bedeutung) und Schlüsselwortabgleich (exakte Begriffe wie IDs und Codesymbole).
Dies funktioniert sofort, sobald Sie einen API-Schlüssel für einen unterstützten
Anbieter haben.

<Info>
OpenClaw erkennt Ihren Embedding-Anbieter automatisch anhand verfügbarer
API-Schlüssel. Wenn Sie einen konfigurierten OpenAI-, Gemini-, Voyage- oder
Mistral-Schlüssel haben, ist die Speichersuche automatisch aktiviert.
</Info>

Details dazu, wie die Suche funktioniert, zu Tuning-Optionen und zur
Anbietereinrichtung finden Sie unter
[Memory Search](/de/concepts/memory-search).

## Speicher-Backends

<CardGroup cols={3}>
<Card title="Integriert (Standard)" icon="database" href="/de/concepts/memory-builtin">
SQLite-basiert. Funktioniert sofort mit Schlüsselwortsuche, Vektorähnlichkeit und
hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/de/concepts/memory-qmd">
Local-first-Sidecar mit Reranking, Query Expansion und der Möglichkeit,
Verzeichnisse außerhalb des Workspace zu indizieren.
</Card>
<Card title="Honcho" icon="brain" href="/de/concepts/memory-honcho">
AI-native sitzungsübergreifender Speicher mit Benutzermodellierung,
semantischer Suche und Multi-Agent-Bewusstsein. Plugin-Installation.
</Card>
</CardGroup>

## Automatischer Speicher-Flush

Bevor [Kompaktierung](/de/concepts/compaction) Ihre Unterhaltung zusammenfasst,
führt OpenClaw einen stillen Durchlauf aus, der den Agenten daran erinnert,
wichtigen Kontext in Speicherdateien zu speichern. Dies ist standardmäßig
aktiviert -- Sie müssen nichts konfigurieren.

<Tip>
Der Speicher-Flush verhindert Kontextverlust während der Kompaktierung. Wenn Ihr
Agent wichtige Fakten in der Unterhaltung hat, die noch nicht in eine Datei
geschrieben wurden, werden sie automatisch gespeichert, bevor die Zusammenfassung
erfolgt.
</Tip>

## Dreaming (experimentell)

Dreaming ist ein optionaler Konsolidierungsdurchlauf im Hintergrund für den
Speicher. Er sammelt kurzfristige Signale, bewertet Kandidaten und übernimmt nur
qualifizierte Einträge in den Langzeitspeicher (`MEMORY.md`).

Es ist darauf ausgelegt, den Langzeitspeicher signalstark zu halten:

- **Opt-in**: standardmäßig deaktiviert.
- **Geplant**: Wenn aktiviert, verwaltet `memory-core` automatisch einen
  wiederkehrenden Cron-Job für einen vollständigen Dreaming-Durchlauf.
- **Schwellenwertbasiert**: Übernahmen müssen Schranken für Bewertung,
  Erinnerungsfrequenz und Query-Diversität bestehen.
- **Überprüfbar**: Phasenzusammenfassungen und Tagebucheinträge werden zur
  menschlichen Überprüfung in `DREAMS.md` geschrieben.

Zum Phasenverhalten, zu Bewertungssignalen und zu Details des Dream Diary siehe
[Dreaming (experimental)](/concepts/dreaming).

## CLI

```bash
openclaw memory status          # Indexstatus und Anbieter prüfen
openclaw memory search "query"  # Über die Befehlszeile suchen
openclaw memory index --force   # Den Index neu aufbauen
```

## Weiterführende Informationen

- [Builtin Memory Engine](/de/concepts/memory-builtin) -- Standard-Backend auf SQLite-Basis
- [QMD Memory Engine](/de/concepts/memory-qmd) -- erweitertes Local-first-Sidecar
- [Honcho Memory](/de/concepts/memory-honcho) -- AI-native sitzungsübergreifender Speicher
- [Memory Search](/de/concepts/memory-search) -- Suchpipeline, Anbieter und
  Tuning
- [Dreaming (experimental)](/concepts/dreaming) -- Hintergrundübernahme
  von kurzfristigem Abruf in den Langzeitspeicher
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config) -- alle Konfigurationsoptionen
- [Kompaktierung](/de/concepts/compaction) -- wie Kompaktierung mit Speicher interagiert
