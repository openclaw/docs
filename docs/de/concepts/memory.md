---
read_when:
    - Sie möchten verstehen, wie Speicher funktioniert
    - Sie möchten wissen, welche Memory-Dateien geschrieben werden sollen
summary: Wie OpenClaw sich Dinge über Sitzungen hinweg merkt
title: Speicherübersicht
x-i18n:
    generated_at: "2026-06-27T17:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw merkt sich Dinge, indem es **einfache Markdown-Dateien** im Workspace Ihres Agents schreibt. Das Modell „erinnert“ sich nur an das, was auf die Festplatte gespeichert wird – es gibt keinen verborgenen Zustand.

## So funktioniert es

Ihr Agent hat drei speicherbezogene Dateien:

- **`MEMORY.md`** – Langzeitspeicher. Dauerhafte Fakten, Präferenzen und Entscheidungen. Wird zu Beginn jeder DM-Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** (oder **`memory/YYYY-MM-DD-<slug>.md`**) – Tagesnotizen. Laufender Kontext und Beobachtungen. Die Notizen von heute und gestern werden automatisch geladen, und Varianten mit Slug, etwa solche, die vom gebündelten Session-Memory-Hook bei `/new` oder `/reset` geschrieben werden, werden nun zusammen mit der reinen Datumsdatei erfasst.
- **`DREAMS.md`** (optional) – Dreaming-Tagebuch und Zusammenfassungen von Dreaming-Durchläufen zur menschlichen Prüfung, einschließlich fundierter historischer Backfill-Einträge.

Diese Dateien liegen im Agent-Workspace (Standard: `~/.openclaw/workspace`).

## Was wohin gehört

`MEMORY.md` ist die kompakte, kuratierte Ebene. Verwenden Sie sie für dauerhafte Fakten, Präferenzen, stehende Entscheidungen und kurze Zusammenfassungen, die zu Beginn einer privaten Hauptsitzung verfügbar sein sollten. Sie ist nicht als rohes Transkript, Tagesprotokoll oder vollständiges Archiv gedacht.

`memory/YYYY-MM-DD.md`-Dateien sind die Arbeitsebene. Verwenden Sie sie für detaillierte tägliche Notizen, Beobachtungen, Sitzungszusammenfassungen und Rohkontext, der später noch nützlich sein kann. Diese Dateien werden für `memory_search` und `memory_get` indexiert, aber nicht bei jedem Turn in den normalen Bootstrap-Prompt eingefügt.

Im Lauf der Zeit sollte der Agent nützliches Material aus Tagesnotizen in `MEMORY.md` verdichten und veraltete Langzeiteinträge entfernen. Die generierten Workspace-Anweisungen und der Heartbeat-Ablauf können das regelmäßig erledigen; Sie müssen `MEMORY.md` nicht für jedes erinnerte Detail manuell bearbeiten.

Wenn `MEMORY.md` das Budget für Bootstrap-Dateien überschreitet, lässt OpenClaw die Datei auf der Festplatte unverändert, kürzt aber die Kopie, die in den Modellkontext eingefügt wird. Betrachten Sie das als Signal, detailliertes Material zurück nach `memory/*.md` zu verschieben, nur die dauerhafte Zusammenfassung in `MEMORY.md` zu behalten oder die Bootstrap-Limits zu erhöhen, wenn Sie ausdrücklich mehr Prompt-Budget ausgeben möchten. Verwenden Sie `/context list`, `/context detail` oder `openclaw doctor`, um rohe gegenüber eingefügten Größen und den Kürzungsstatus zu sehen.

<Tip>
Wenn Ihr Agent sich etwas merken soll, bitten Sie ihn einfach darum: „Merken Sie sich, dass ich TypeScript bevorzuge.“ Er schreibt es in die passende Datei.
</Tip>

## Aktionssensitive Erinnerungen

Die meisten Erinnerungen können als gewöhnliche Markdown-Notizen geschrieben werden. Einige Erinnerungen beeinflussen jedoch, was der Agent später tun sollte. Erfassen Sie dafür, wann es sicher ist, anhand der Notiz zu handeln, nicht nur den Fakt selbst.

Erfassen Sie diese Aktionsgrenze, wenn eine Notiz Folgendes betrifft:

- Anforderungen an Genehmigungen oder Berechtigungen,
- temporäre Einschränkungen,
- Übergaben an eine andere Sitzung, einen Thread oder eine Person,
- Ablaufbedingungen,
- Zeitpunkt, ab dem Handeln sicher ist,
- Autorität der Quelle oder des Owners,
- Anweisungen, eine naheliegende Aktion zu vermeiden.

Eine nützliche aktionssensitive Erinnerung macht klar:

- was zukünftiges Verhalten ändert,
- wann oder unter welcher Bedingung sie gilt,
- wann sie abläuft oder was Handeln freischaltet,
- was der Agent vermeiden sollte,
- wer die Quelle oder der Owner ist, falls dies Vertrauen oder Autorität beeinflusst.

Memory kann Genehmigungskontext bewahren, setzt aber keine Richtlinien durch. Verwenden Sie OpenClaw-Genehmigungseinstellungen, Sandboxing und geplante Aufgaben für harte betriebliche Kontrollen.

Beispiel:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Ein weiteres Beispiel:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Verwenden Sie [Commitments](/de/concepts/commitments) für abgeleitete, kurzlebige Follow-ups. Verwenden Sie [geplante Aufgaben](/de/automation/cron-jobs) für exakte Erinnerungen, zeitgesteuerte Prüfungen und wiederkehrende Arbeit. Memory kann den dauerhaften Kontext rund um beide Pfade weiterhin zusammenfassen.

Dies ist kein erforderliches Schema für jede Erinnerung. Einfache Fakten können knapp bleiben. Verwenden Sie aktionssensitive Grenzen, wenn der Verlust von Timing, Autorität, Ablauf oder Kontext für sicheres Handeln dazu führen könnte, dass der Agent später das Falsche tut.

## Abgeleitete Commitments

Einige zukünftige Follow-ups sind keine dauerhaften Fakten. Wenn Sie ein Vorstellungsgespräch morgen erwähnen, kann die nützliche Erinnerung „nach dem Vorstellungsgespräch nachfragen“ sein, nicht „dies für immer in `MEMORY.md` speichern“.

[Commitments](/de/concepts/commitments) sind Opt-in-Erinnerungen für kurzlebige Follow-ups in diesem Fall. OpenClaw leitet sie in einem verborgenen Hintergrunddurchlauf ab, grenzt sie auf denselben Agent und Kanal ein und liefert fällige Nachfragen über Heartbeat aus. Ausdrückliche Erinnerungen verwenden weiterhin [geplante Aufgaben](/de/automation/cron-jobs).

## Memory-Tools

Der Agent hat zwei Tools für die Arbeit mit Memory:

- **`memory_search`** – findet relevante Notizen mithilfe semantischer Suche, selbst wenn sich die Formulierung vom Original unterscheidet.
- **`memory_get`** – liest eine bestimmte Memory-Datei oder einen Zeilenbereich.

Beide Tools werden vom Active-Memory-Plugin bereitgestellt (Standard: `memory-core`).

## Begleitendes Memory-Wiki-Plugin

Wenn dauerhafte Memory sich eher wie eine gepflegte Wissensbasis als wie rohe Notizen verhalten soll, verwenden Sie das gebündelte `memory-wiki`-Plugin.

`memory-wiki` kompiliert dauerhaftes Wissen in einen Wiki-Vault mit:

- deterministischer Seitenstruktur
- strukturierten Aussagen und Belegen
- Verfolgung von Widersprüchen und Aktualität
- generierten Dashboards
- kompilierten Digests für Agent-/Runtime-Verbraucher
- wiki-nativen Tools wie `wiki_search`, `wiki_get`, `wiki_apply` und `wiki_lint`

Es ersetzt das Active-Memory-Plugin nicht. Das Active-Memory-Plugin besitzt weiterhin Recall, Promotion und Dreaming. `memory-wiki` ergänzt daneben eine Wissensebene mit reichhaltiger Provenienz.

Siehe [Memory Wiki](/de/plugins/memory-wiki).

## Memory-Suche

Wenn ein Embedding-Provider konfiguriert ist, verwendet `memory_search` **hybride Suche** – eine Kombination aus Vektorähnlichkeit (semantische Bedeutung) und Keyword-Abgleich (exakte Begriffe wie IDs und Codesymbole). Das funktioniert sofort, sobald Sie einen API-Schlüssel für einen unterstützten Provider haben.

<Info>
OpenClaw verwendet standardmäßig OpenAI-Embeddings. Setzen Sie `agents.defaults.memorySearch.provider` ausdrücklich, um Gemini-, Voyage-, Mistral-, lokale, Ollama-, Bedrock-, GitHub-Copilot- oder OpenAI-kompatible Embeddings zu verwenden.
</Info>

Details zur Funktionsweise der Suche, zu Tuning-Optionen und zur Provider-Einrichtung finden Sie unter [Memory Search](/de/concepts/memory-search).

## Memory-Backends

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/de/concepts/memory-builtin">
SQLite-basiert. Funktioniert sofort mit Keyword-Suche, Vektorähnlichkeit und hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/de/concepts/memory-qmd">
Local-first-Sidecar mit Reranking, Query-Erweiterung und der Möglichkeit, Verzeichnisse außerhalb des Workspace zu indexieren.
</Card>
<Card title="Honcho" icon="brain" href="/de/concepts/memory-honcho">
KI-native sitzungsübergreifende Memory mit Benutzermodellierung, semantischer Suche und Multi-Agent-Awareness. Plugin-Installation.
</Card>
<Card title="LanceDB" icon="layers" href="/de/plugins/memory-lancedb">
Gebündelte LanceDB-gestützte Memory mit OpenAI-kompatiblen Embeddings, Auto-Recall, Auto-Capture und lokaler Ollama-Embedding-Unterstützung.
</Card>
</CardGroup>

## Knowledge-Wiki-Ebene

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/de/plugins/memory-wiki">
Kompiliert dauerhafte Memory in einen Wiki-Vault mit reichhaltiger Provenienz, Aussagen, Dashboards, Bridge-Modus und Obsidian-freundlichen Workflows.
</Card>
</CardGroup>

## Automatischer Memory-Flush

Bevor [Compaction](/de/concepts/compaction) Ihre Unterhaltung zusammenfasst, führt OpenClaw einen stillen Turn aus, der den Agent daran erinnert, wichtigen Kontext in Memory-Dateien zu speichern. Dies ist standardmäßig aktiviert – Sie müssen nichts konfigurieren.

Um diesen Housekeeping-Turn auf einem lokalen Modell zu halten, setzen Sie ein exaktes Memory-Flush-Modell-Override:

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

Das Override gilt nur für den Memory-Flush-Turn und erbt nicht die Fallback-Kette der aktiven Sitzung.

<Tip>
Der Memory-Flush verhindert Kontextverlust während der Compaction. Wenn Ihr Agent wichtige Fakten in der Unterhaltung hat, die noch nicht in eine Datei geschrieben wurden, werden sie vor der Zusammenfassung automatisch gespeichert.
</Tip>

## Dreaming

Dreaming ist ein optionaler Hintergrunddurchlauf zur Konsolidierung von Memory. Es sammelt kurzfristige Signale, bewertet Kandidaten und übernimmt nur qualifizierte Elemente in den Langzeitspeicher (`MEMORY.md`).

Es ist darauf ausgelegt, Langzeitspeicher signalstark zu halten:

- **Opt-in**: standardmäßig deaktiviert.
- **Geplant**: Wenn aktiviert, verwaltet `memory-core` automatisch einen wiederkehrenden Cron-Job für einen vollständigen Dreaming-Durchlauf.
- **Schwellwertbasiert**: Promotions müssen Score-, Recall-Frequency- und Query-Diversity-Gates bestehen.
- **Prüfbar**: Phasenzusammenfassungen und Tagebucheinträge werden zur menschlichen Prüfung in `DREAMS.md` geschrieben.

Phasenverhalten, Bewertungssignale und Details zum Dreaming-Tagebuch finden Sie unter [Dreaming](/de/concepts/dreaming).

## Grounded Backfill und Live-Promotion

Das Dreaming-System hat nun zwei eng verwandte Review-Lanes:

- **Live-Dreaming** arbeitet aus dem kurzfristigen Dreaming-Store unter `memory/.dreams/` und wird von der normalen Deep-Phase verwendet, wenn entschieden wird, was in `MEMORY.md` übergehen kann.
- **Grounded Backfill** liest historische `memory/YYYY-MM-DD.md`-Notizen als eigenständige Tagesdateien und schreibt strukturierte Review-Ausgaben in `DREAMS.md`.

Grounded Backfill ist nützlich, wenn Sie ältere Notizen erneut abspielen und prüfen möchten, was das System für dauerhaft hält, ohne `MEMORY.md` manuell zu bearbeiten.

Wenn Sie Folgendes verwenden:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

werden die fundierten dauerhaften Kandidaten nicht direkt übernommen. Sie werden in denselben kurzfristigen Dreaming-Store gestaged, den die normale Deep-Phase bereits verwendet. Das bedeutet:

- `DREAMS.md` bleibt die menschliche Review-Oberfläche.
- der kurzfristige Store bleibt die maschinenseitige Ranking-Oberfläche.
- `MEMORY.md` wird weiterhin nur durch Deep-Promotion geschrieben.

Wenn Sie entscheiden, dass das Replay nicht nützlich war, können Sie die gestagten Artefakte entfernen, ohne gewöhnliche Tagebucheinträge oder normalen Recall-Zustand zu berühren:

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

## Weitere Informationen

- [Builtin-Memory-Engine](/de/concepts/memory-builtin): Standard-SQLite-Backend.
- [QMD-Memory-Engine](/de/concepts/memory-qmd): fortgeschrittener Local-first-Sidecar.
- [Honcho Memory](/de/concepts/memory-honcho): KI-native sitzungsübergreifende Memory.
- [Memory LanceDB](/de/plugins/memory-lancedb): LanceDB-gestütztes Plugin mit OpenAI-kompatiblen Embeddings.
- [Memory Wiki](/de/plugins/memory-wiki): kompilierter Wissens-Vault und wiki-native Tools.
- [Memory Search](/de/concepts/memory-search): Suchpipeline, Provider und Tuning.
- [Dreaming](/de/concepts/dreaming): Hintergrund-Promotion von kurzfristigem Recall in den Langzeitspeicher.
- [Memory-Konfigurationsreferenz](/de/reference/memory-config): alle Konfigurationsoptionen.
- [Compaction](/de/concepts/compaction): wie Compaction mit Memory interagiert.

## Verwandt

- [Active Memory](/de/concepts/active-memory)
- [Memory Search](/de/concepts/memory-search)
- [Builtin-Memory-Engine](/de/concepts/memory-builtin)
- [Honcho Memory](/de/concepts/memory-honcho)
- [Memory LanceDB](/de/plugins/memory-lancedb)
- [Commitments](/de/concepts/commitments)
