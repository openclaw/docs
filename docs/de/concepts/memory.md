---
read_when:
    - Sie möchten verstehen, wie Memory funktioniert
    - Sie möchten wissen, welche Speicherdateien Sie schreiben sollen
summary: Wie sich OpenClaw sitzungsübergreifend an Dinge erinnert
title: Speicherübersicht
x-i18n:
    generated_at: "2026-07-12T15:12:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw merkt sich Dinge, indem es einfache Markdown-Dateien in den Workspace Ihres Agenten schreibt (standardmäßig `~/.openclaw/workspace`). Das Modell merkt sich nur, was auf dem Datenträger gespeichert wird; es gibt keinen verborgenen Zustand.

## Funktionsweise

Ihr Agent verfügt über drei speicherbezogene Dateien:

- **`MEMORY.md`** — Langzeitgedächtnis. Dauerhafte Fakten, Präferenzen und Entscheidungen. Wird zu Beginn einer Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** (oder `memory/YYYY-MM-DD-<slug>.md`) — tägliche Notizen. Laufender Kontext und Beobachtungen. Die datierten Notizen von heute und gestern werden bei einem einfachen `/new` oder `/reset` automatisch geladen; Varianten mit Slug, etwa solche, die vom gebündelten Session-Memory-Hook geschrieben werden, werden zusammen mit der Datei geladen, die nur das Datum enthält.
- **`DREAMS.md`** (optional) — Traumtagebuch und Zusammenfassungen von Dreaming-Durchläufen zur menschlichen Überprüfung, einschließlich historisch fundierter Backfill-Einträge.

<Tip>
Wenn Ihr Agent sich etwas merken soll, bitten Sie ihn einfach darum: „Merken Sie sich, dass ich TypeScript bevorzuge.“ Er schreibt die Notiz in die entsprechende Datei.
</Tip>

## Was wohin gehört

`MEMORY.md` ist die kompakte, kuratierte Ebene: dauerhafte Fakten, Präferenzen, fortbestehende Entscheidungen und kurze Zusammenfassungen, die zu Beginn einer Sitzung verfügbar sein sollten. Sie ist weder ein Rohtranskript noch ein tägliches Protokoll oder ein vollständiges Archiv.

Die Dateien `memory/YYYY-MM-DD.md` bilden die Arbeitsebene: ausführliche tägliche Notizen, Beobachtungen, Sitzungszusammenfassungen und Rohkontext, die später noch nützlich sein können. Sie werden für `memory_search` und `memory_get` indexiert, aber nicht bei jedem Turn in den Bootstrap-Prompt eingefügt.

Im Laufe der Zeit destilliert der Agent nützliches Material aus den täglichen Notizen in `MEMORY.md` und entfernt veraltete Langzeiteinträge. Generierte Workspace-Anweisungen und der Heartbeat-Ablauf erledigen dies regelmäßig; Sie müssen `MEMORY.md` nicht für jedes Detail manuell bearbeiten.

Wenn `MEMORY.md` das Budget für Bootstrap-Dateien überschreitet, lässt OpenClaw die Datei auf dem Datenträger unverändert, kürzt jedoch die in den Kontext eingefügte Kopie. Betrachten Sie dies als Signal, ausführliches Material nach `memory/*.md` zu verschieben, in `MEMORY.md` nur eine dauerhafte Zusammenfassung zu behalten oder die Bootstrap-Grenzwerte zu erhöhen, wenn Sie mehr Prompt-Budget verwenden möchten. Mit `/context list`, `/context detail` oder `openclaw doctor` können Sie die Rohgröße, die eingefügte Größe und den Kürzungsstatus anzeigen.

## Aktionsabhängige Erinnerungen

Die meisten Erinnerungen sind gewöhnliche Markdown-Notizen. Einige beeinflussen, was der Agent später tun sollte; halten Sie in diesen Fällen nicht nur den Fakt selbst fest, sondern auch, wann auf Grundlage der Notiz sicher gehandelt werden kann.

Halten Sie diese Aktionsgrenze fest, wenn eine Notiz Folgendes betrifft:

- Anforderungen an Genehmigungen oder Berechtigungen,
- vorübergehende Einschränkungen,
- Übergaben an eine andere Sitzung, einen anderen Thread oder eine andere Person,
- Ablaufbedingungen,
- den Zeitpunkt, ab dem sicher gehandelt werden kann,
- die Autorität der Quelle oder des Verantwortlichen,
- Anweisungen, eine verlockende Aktion zu vermeiden.

Eine nützliche aktionsabhängige Erinnerung stellt Folgendes klar:

- was zukünftiges Verhalten ändert,
- wann oder unter welcher Bedingung sie gilt,
- wann sie abläuft oder wodurch eine Aktion freigegeben wird,
- was der Agent vermeiden sollte,
- wer die Quelle oder der Verantwortliche ist, falls dies Vertrauen oder Autorität beeinflusst.

Der Speicher kann den Genehmigungskontext bewahren, setzt Richtlinien jedoch nicht durch. Verwenden Sie die Genehmigungseinstellungen, das Sandboxing und geplante Aufgaben von OpenClaw für verbindliche betriebliche Kontrollen.

Beispiel:

```md
Die API-Migration wird in einer anderen Sitzung entworfen. Zukünftige Turns sollten
die API-Implementierung nicht aus diesem Thread heraus bearbeiten; verwenden Sie die
Erkenntnisse hier nur als Entwurfsgrundlage, bis der Migrationsplan umgesetzt ist.
```

Ein weiteres Beispiel:

```md
Ein Bericht aus einer nicht vertrauenswürdigen Quelle muss vor der Übernahme geprüft werden. Zukünftige Turns
sollten ihn nur als Beleg behandeln; speichern Sie ihn nicht als dauerhafte Erinnerung, bis
eine vertrauenswürdige prüfende Person die Inhalte bestätigt.
```

Dies ist kein erforderliches Schema für jede Erinnerung; einfache Fakten können knapp bleiben. Verwenden Sie aktionsabhängige Grenzen, wenn der Verlust von Informationen über Zeitpunkt, Autorität, Ablauf oder den Kontext für sicheres Handeln dazu führen könnte, dass der Agent später das Falsche tut.

Verwenden Sie [Commitments](/de/concepts/commitments) für abgeleitete, kurzlebige Folgeaktionen. Verwenden Sie [geplante Aufgaben](/de/automation/cron-jobs) für genaue Erinnerungen, zeitgesteuerte Prüfungen und wiederkehrende Arbeiten. Der Speicher kann weiterhin den dauerhaften Kontext zu beiden Abläufen zusammenfassen.

## Abgeleitete Commitments

Einige zukünftige Folgeaktionen sind keine dauerhaften Fakten. Wenn Sie ein Vorstellungsgespräch morgen erwähnen, könnte die nützliche Erinnerung „nach dem Vorstellungsgespräch nachfragen“ lauten und nicht „dies für immer in `MEMORY.md` speichern“.

[Commitments](/de/concepts/commitments) sind optionale, kurzlebige Erinnerungen an Folgeaktionen für diesen Fall. OpenClaw leitet sie in einem verborgenen Hintergrunddurchlauf ab, beschränkt sie auf denselben Agenten und Kanal und übermittelt fällige Nachfragen über den Heartbeat. Explizite Erinnerungen verwenden weiterhin [geplante Aufgaben](/de/automation/cron-jobs).

## Speicherwerkzeuge

Der Agent verfügt über zwei Werkzeuge für die Arbeit mit dem Speicher:

- **`memory_search`** — findet relevante Notizen mithilfe semantischer Suche, selbst wenn sich die Formulierung vom Original unterscheidet.
- **`memory_get`** — liest eine bestimmte Speicherdatei oder einen bestimmten Zeilenbereich.

Beide Werkzeuge werden vom aktiven Speicher-Plugin bereitgestellt (standardmäßig `memory-core`).

## Speichersuche

Wenn ein Embedding-Provider konfiguriert ist, verwendet `memory_search` eine hybride Suche: Vektorähnlichkeit (semantische Bedeutung) kombiniert mit Schlüsselwortabgleich (exakte Begriffe wie IDs und Codesymbole). Dies funktioniert ohne weitere Einrichtung mit einem API-Schlüssel für jeden unterstützten Provider.

<Info>
OpenClaw verwendet standardmäßig OpenAI-Embeddings. Legen Sie `agents.defaults.memorySearch.provider` explizit fest, um Gemini, Voyage, Mistral, Bedrock, DeepInfra, lokales GGUF, Ollama, LM Studio, GitHub Copilot oder einen generischen OpenAI-kompatiblen Endpunkt zu verwenden.
</Info>

Unter [Speichersuche](/de/concepts/memory-search) erfahren Sie, wie die Suche funktioniert, welche Abstimmungsoptionen verfügbar sind und wie Provider eingerichtet werden.

## Speicher-Backends

<CardGroup cols={3}>
<Card title="Integriert (Standard)" icon="database" href="/de/concepts/memory-builtin">
SQLite-basiert. Funktioniert ohne weitere Einrichtung mit Schlüsselwortsuche, Vektorähnlichkeit und hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/de/concepts/memory-qmd">
Local-First-Sidecar mit Neusortierung, Abfrageerweiterung und der Möglichkeit, Verzeichnisse außerhalb des Workspace zu indexieren.
</Card>
<Card title="Honcho" icon="brain" href="/de/concepts/memory-honcho">
KI-nativer sitzungsübergreifender Speicher mit Benutzermodellierung, semantischer Suche und Unterstützung für mehrere Agenten. Installation als Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/de/plugins/memory-lancedb">
LanceDB-gestützter Speicher mit OpenAI-kompatiblen Embeddings, automatischem Abruf, automatischer Erfassung und Unterstützung lokaler Ollama-Embeddings. Installation als Plugin.
</Card>
</CardGroup>

## Wissens-Wiki-Ebene

Wenn sich der dauerhafte Speicher eher wie eine gepflegte Wissensdatenbank als wie Rohnotizen verhalten soll, verwenden Sie das gebündelte Plugin `memory-wiki`. Es kompiliert dauerhaftes Wissen in einen Wiki-Tresor mit deterministischer Seitenstruktur, strukturierten Aussagen und Belegen, Nachverfolgung von Widersprüchen und Aktualität, generierten Dashboards, kompilierten Zusammenfassungen und Wiki-nativen Werkzeugen (`wiki_status`, `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` ersetzt das aktive Speicher-Plugin nicht; das aktive Speicher-Plugin bleibt für Abruf, Übernahme und Dreaming verantwortlich. `memory-wiki` ergänzt es um eine wissensbasierte Ebene mit umfangreichen Herkunftsinformationen.

<CardGroup cols={1}>
<Card title="Speicher-Wiki" icon="book" href="/de/plugins/memory-wiki">
Kompiliert dauerhaften Speicher in einen Wiki-Tresor mit umfangreichen Herkunftsinformationen, Aussagen, Dashboards, Bridge-Modus und Obsidian-freundlichen Arbeitsabläufen.
</Card>
</CardGroup>

## Automatisches Leeren des Speichers

Bevor [Compaction](/de/concepts/compaction) Ihre Unterhaltung zusammenfasst, führt OpenClaw einen stillen Turn aus, der den Agenten daran erinnert, wichtigen Kontext in Speicherdateien zu sichern. Dies ist standardmäßig aktiviert; legen Sie `agents.defaults.compaction.memoryFlush.enabled: false` fest, um es zu deaktivieren.

Um diesen Verwaltungs-Turn auf einem lokalen Modell auszuführen, legen Sie eine exakte Überschreibung fest, die nur für den Turn zum Leeren des Speichers gilt (sie übernimmt nicht die Modell-Fallback-Kette der aktiven Sitzung):

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
Das Leeren des Speichers verhindert Kontextverlust während der Compaction. Wenn die Unterhaltung wichtige Fakten enthält, die Ihr Agent noch nicht in eine Datei geschrieben hat, werden diese automatisch gespeichert, bevor die Zusammenfassung erfolgt.
</Tip>

## Dreaming

Dreaming ist ein optionaler Konsolidierungsdurchlauf für den Speicher im Hintergrund. Er sammelt kurzfristige Abrufsignale, bewertet Kandidaten und übernimmt nur qualifizierte Einträge in den Langzeitspeicher (`MEMORY.md`):

- **Optional**: standardmäßig deaktiviert.
- **Geplant**: Wenn diese Funktion aktiviert ist, verwaltet `memory-core` automatisch einen wiederkehrenden Cron-Job für einen vollständigen Dreaming-Durchlauf.
- **Schwellenwertbasiert**: Übernahmen müssen Schwellenwerte für Bewertung, Abrufhäufigkeit und Abfragevielfalt erfüllen.
- **Überprüfbar**: Phasenzusammenfassungen und Tagebucheinträge werden zur menschlichen Überprüfung in `DREAMS.md` geschrieben.

Unter [Dreaming](/de/concepts/dreaming) finden Sie Details zum Phasenverhalten, zu Bewertungssignalen und zum Traumtagebuch.

## Fundierter Backfill und Live-Übernahme

Das Dreaming-System verfügt über zwei zusammengehörige Prüfpfade:

- **Live-Dreaming** arbeitet mit dem kurzfristigen Dreaming-Speicher unter `memory/.dreams/` und wird von der normalen Tiefenphase verwendet, um zu entscheiden, was in `MEMORY.md` übernommen wird.
- **Fundierter Backfill** liest historische Notizen aus `memory/YYYY-MM-DD.md` als eigenständige Tagesdateien und schreibt strukturierte Prüfergebnisse in `DREAMS.md`.

Der fundierte Backfill eignet sich dazu, ältere Notizen erneut zu verarbeiten und zu prüfen, was das System als dauerhaft betrachtet, ohne `MEMORY.md` manuell zu bearbeiten.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das Flag `--stage-short-term` stellt fundierte dauerhafte Kandidaten in demselben kurzfristigen Dreaming-Speicher bereit, den die normale Tiefenphase bereits verwendet; es übernimmt sie nicht direkt. Daher gilt:

- `DREAMS.md` bleibt die Oberfläche für die menschliche Überprüfung.
- Der kurzfristige Speicher bleibt die maschinenorientierte Ranglistenoberfläche.
- `MEMORY.md` wird weiterhin ausschließlich durch die Tiefenübernahme beschrieben.

So machen Sie eine erneute Verarbeitung rückgängig, ohne gewöhnliche Tagebucheinträge oder den normalen Abrufzustand zu verändern:

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

- [Speichersuche](/de/concepts/memory-search): Suchpipeline, Provider und Abstimmung.
- [Integrierte Speicher-Engine](/de/concepts/memory-builtin): standardmäßiges SQLite-Backend.
- [QMD-Speicher-Engine](/de/concepts/memory-qmd): erweiterter Local-First-Sidecar.
- [Honcho-Speicher](/de/concepts/memory-honcho): KI-nativer sitzungsübergreifender Speicher.
- [LanceDB-Speicher](/de/plugins/memory-lancedb): LanceDB-gestütztes Plugin mit OpenAI-kompatiblen Embeddings.
- [Speicher-Wiki](/de/plugins/memory-wiki): kompilierter Wissenstresor und Wiki-native Werkzeuge.
- [Dreaming](/de/concepts/dreaming): Übernahme aus dem kurzfristigen Abruf in den Langzeitspeicher im Hintergrund.
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config): alle Konfigurationsoptionen.
- [Compaction](/de/concepts/compaction): Zusammenspiel von Compaction und Speicher.
- [Active Memory](/de/concepts/active-memory): Speicher von Subagenten für interaktive Chatsitzungen.
