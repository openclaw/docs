---
read_when:
    - Sie möchten verstehen, wie der Speicher funktioniert
    - Sie möchten wissen, welche Speicherdateien Sie schreiben sollen
summary: Wie OpenClaw sich sitzungsübergreifend an Dinge erinnert
title: Speicherübersicht
x-i18n:
    generated_at: "2026-07-16T12:42:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw merkt sich Dinge, indem es einfache Markdown-Dateien in den
Workspace Ihres Agenten schreibt (Standard: `~/.openclaw/workspace`). Das Modell erinnert sich nur an das, was
auf der Festplatte gespeichert wird; es gibt keinen verborgenen Zustand.

## Funktionsweise

Ihr Agent verfügt über drei speicherbezogene Dateien:

- **`MEMORY.md`** — Langzeitgedächtnis. Dauerhafte Fakten, Präferenzen und
  Entscheidungen. Wird zu Beginn einer Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** (oder `memory/YYYY-MM-DD-<slug>.md`) — tägliche Notizen.
  Fortlaufender Kontext und Beobachtungen. Die datierten Notizen von heute und gestern werden
  bei einem einfachen `/new` oder `/reset` automatisch geladen; Varianten mit Slug, etwa diejenigen,
  die vom gebündelten Session-Memory-Hook geschrieben werden, werden zusammen mit der
  Datei erfasst, die nur das Datum enthält.
- **`DREAMS.md`** (optional) — Traumtagebuch und Zusammenfassungen von Dreaming-Durchläufen zur
  menschlichen Überprüfung, einschließlich historisch fundierter Backfill-Einträge.

<Tip>
Wenn Ihr Agent sich etwas merken soll, bitten Sie ihn einfach darum: „Merken Sie sich, dass ich
TypeScript bevorzuge.“ Er schreibt die Notiz in die entsprechende Datei.
</Tip>

## Was wohin gehört

`MEMORY.md` ist die kompakte, kuratierte Ebene: dauerhafte Fakten, Präferenzen, bestehende
Entscheidungen und kurze Zusammenfassungen, die zu Beginn einer
Sitzung verfügbar sein sollten. Sie ist kein Rohtranskript, tägliches Protokoll oder vollständiges Archiv.

`memory/YYYY-MM-DD.md`-Dateien bilden die Arbeitsebene: detaillierte tägliche Notizen,
Beobachtungen, Sitzungszusammenfassungen und Rohkontext, die später noch nützlich sein
können. Sie werden für `memory_search` und `memory_get` indiziert, aber nicht
bei jedem Durchlauf in den Bootstrap-Prompt eingefügt.

Im Laufe der Zeit destilliert der Agent nützliches Material aus täglichen Notizen in
`MEMORY.md` und entfernt veraltete Langzeiteinträge. Generierte Workspace-
Anweisungen und der Heartbeat-Ablauf erledigen dies regelmäßig; Sie müssen
`MEMORY.md` nicht für jedes Detail manuell bearbeiten.

Wenn `MEMORY.md` das Budget für Bootstrap-Dateien überschreitet, lässt OpenClaw die Datei auf der
Festplatte unverändert, kürzt jedoch die in den Kontext eingefügte Kopie. Betrachten Sie dies als
Signal, detailliertes Material nach `memory/*.md` zu verschieben, nur eine dauerhafte
Zusammenfassung in `MEMORY.md` aufzubewahren oder die Bootstrap-Grenzwerte zu erhöhen, wenn Sie mehr
Prompt-Budget aufwenden möchten. Verwenden Sie `/context list`, `/context detail` oder `openclaw doctor`, um
die Rohgröße, die eingefügte Größe und den Kürzungsstatus anzuzeigen.

## Import aus Programmierassistenten

Die Control UI kann vorhandenes lokales Gedächtnis aus Codex und Claude Code importieren.
Öffnen Sie **Einstellungen** → **Gedächtnis importieren**, wählen Sie den Zielagenten, prüfen Sie die
erkannten Dateien und bestätigen Sie den Import. OpenClaw kopiert ausschließlich Markdown-Gedächtnisinhalte:

- Codex: die konsolidierten Dateien `MEMORY.md` und `memory_summary.md` unter
  `~/.codex/memories` (oder `CODEX_HOME/memories`). Rohe Rollout- und Transkriptdateien
  werden nicht importiert.
- Claude Code: Markdown-Dateien aus dem automatischen Gedächtnisverzeichnis jedes Projekts unter
  `~/.claude/projects/*/memory` sowie eine vom Benutzer konfigurierte
  `autoMemoryDirectory`, sofern vorhanden. Projektanweisungen, Sitzungen, Einstellungen
  und Anmeldedaten sind nicht Bestandteil dieser ausschließlich das Gedächtnis betreffenden Aktion.

Importierte Dateien bleiben unter `memory/imports/codex/` und
`memory/imports/claude-code/` im ausgewählten Agenten-Workspace getrennt. Sie werden
für `memory_search` indiziert und sind über `memory_get` verfügbar; sie werden nicht mit
dem Bootstrap-`MEMORY.md` des Agenten zusammengeführt. Die Quelldateien bleiben unverändert.

Die Vorschau kennzeichnet Konflikte am Zielort. Aktivieren Sie **Vorhandene Importe ersetzen**, um
diese Dateien zu ersetzen; beim Anwenden wird ein verifiziertes Backup vor dem Import erstellt und
Kopien der überschriebenen Dateien auf Elementebene werden im Migrationsbericht aufbewahrt.

## Aktionssensitive Erinnerungen

Die meisten Erinnerungen sind gewöhnliche Markdown-Notizen. Einige beeinflussen, was der Agent
später tun sollte; halten Sie bei diesen fest, wann auf Grundlage der Notiz sicher gehandelt werden kann,
nicht nur die Tatsache selbst.

Erfassen Sie diese Handlungsgrenze, wenn eine Notiz Folgendes betrifft:

- Genehmigungs- oder Berechtigungsanforderungen,
- vorübergehende Einschränkungen,
- Übergaben an eine andere Sitzung, einen anderen Thread oder eine andere Person,
- Ablaufbedingungen,
- Zeitpunkt für sicheres Handeln,
- Autorität der Quelle oder des Verantwortlichen,
- Anweisungen, eine naheliegende Aktion zu vermeiden.

Eine nützliche aktionssensitive Erinnerung verdeutlicht:

- was zukünftiges Verhalten ändert,
- wann oder unter welcher Bedingung sie gilt,
- wann sie abläuft oder was eine Handlung freigibt,
- was der Agent vermeiden sollte,
- wer die Quelle oder der Verantwortliche ist, falls dies Vertrauen oder Autorität beeinflusst.

Das Gedächtnis kann den Genehmigungskontext bewahren, erzwingt jedoch keine Richtlinien. Verwenden Sie
die Genehmigungseinstellungen von OpenClaw, Sandboxing und geplante Aufgaben für verbindliche
betriebliche Kontrollen.

Beispiel:

```md
Die API-Migration wird in einer anderen Sitzung entworfen. Zukünftige Durchläufe sollten
die API-Implementierung nicht aus diesem Thread heraus bearbeiten; verwenden Sie die Erkenntnisse hier nur als
Entwurfsgrundlage, bis der Migrationsplan vorliegt.
```

Ein weiteres Beispiel:

```md
Ein Bericht aus einer nicht vertrauenswürdigen Quelle muss vor der Übernahme geprüft werden. Zukünftige Durchläufe
sollten ihn nur als Beleg behandeln; speichern Sie ihn nicht als dauerhafte Erinnerung, bis ein
vertrauenswürdiger Prüfer den Inhalt bestätigt.
```

Dies ist kein erforderliches Schema für jede Erinnerung; einfache Fakten können knapp bleiben.
Verwenden Sie aktionssensitive Grenzen, wenn der Verlust von Zeitpunkt, Autorität, Ablauf oder
Kontext für sicheres Handeln dazu führen könnte, dass der Agent später falsch handelt.

Verwenden Sie [Verpflichtungen](/de/concepts/commitments) für abgeleitete, kurzlebige Folgeaktionen.
Verwenden Sie [geplante Aufgaben](/de/automation/cron-jobs) für exakte Erinnerungen, zeitgesteuerte Prüfungen
und wiederkehrende Arbeiten. Das Gedächtnis kann den dauerhaften Kontext um
beide Pfade weiterhin zusammenfassen.

## Abgeleitete Verpflichtungen

Einige zukünftige Folgeaktionen sind keine dauerhaften Fakten. Wenn Sie ein Vorstellungsgespräch
für morgen erwähnen, könnte die nützliche Erinnerung „nach dem Vorstellungsgespräch nachfragen“ lauten, nicht „dies
für immer in `MEMORY.md` speichern“.

[Verpflichtungen](/de/concepts/commitments) sind optionale, kurzlebige Erinnerungen an Folgeaktionen
für diesen Fall. OpenClaw leitet sie in einem verborgenen Hintergrunddurchlauf ab,
beschränkt sie auf denselben Agenten und Kanal und übermittelt fällige Nachfragen über
Heartbeat. Explizite Erinnerungen verwenden weiterhin [geplante Aufgaben](/de/automation/cron-jobs).

## Gedächtniswerkzeuge

Der Agent verfügt über zwei Werkzeuge für die Arbeit mit dem Gedächtnis:

- **`memory_search`** — findet relevante Notizen mittels semantischer Suche, selbst wenn
  die Formulierung vom Original abweicht.
- **`memory_get`** — liest eine bestimmte Gedächtnisdatei oder einen Zeilenbereich.

Beide Werkzeuge werden vom aktiven Gedächtnis-Plugin bereitgestellt (Standard: `memory-core`).

## Gedächtnissuche

Wenn ein Embedding-Provider konfiguriert ist, verwendet `memory_search` eine hybride Suche:
Vektorähnlichkeit (semantische Bedeutung) kombiniert mit Schlüsselwortabgleich (exakte
Begriffe wie IDs und Codesymbole). Dies funktioniert mit einem API-Schlüssel
für jeden unterstützten Provider ohne zusätzliche Einrichtung.

<Info>
OpenClaw verwendet standardmäßig OpenAI-Embeddings. Legen Sie
`agents.defaults.memorySearch.provider` explizit fest, um Gemini, Voyage,
Mistral, Bedrock, DeepInfra, lokales GGUF, Ollama, LM Studio, GitHub Copilot oder
einen generischen OpenAI-kompatiblen Endpunkt zu verwenden.
</Info>

Unter [Gedächtnissuche](/de/concepts/memory-search) finden Sie Informationen zur Funktionsweise der Suche, zu
Optimierungsoptionen und zur Provider-Einrichtung.

## Gedächtnis-Backends

<CardGroup cols={3}>
<Card title="Integriert (Standard)" icon="database" href="/de/concepts/memory-builtin">
SQLite-basiert. Funktioniert ohne zusätzliche Einrichtung mit Schlüsselwortsuche, Vektorähnlichkeit und
hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/de/concepts/memory-qmd">
Local-First-Sidecar mit Neusortierung, Abfrageerweiterung und der Möglichkeit,
Verzeichnisse außerhalb des Workspace zu indizieren.
</Card>
<Card title="Honcho" icon="brain" href="/de/concepts/memory-honcho">
KI-natives sitzungsübergreifendes Gedächtnis mit Benutzermodellierung, semantischer Suche und
Multi-Agenten-Bewusstsein. Plugin-Installation.
</Card>
<Card title="LanceDB" icon="layers" href="/de/plugins/memory-lancedb">
LanceDB-gestütztes Gedächtnis mit OpenAI-kompatiblen Embeddings, automatischem Abruf,
automatischer Erfassung und Unterstützung lokaler Ollama-Embeddings. Plugin-Installation.
</Card>
</CardGroup>

## Wissens-Wiki-Ebene

Wenn sich das dauerhafte Gedächtnis eher wie eine gepflegte Wissensdatenbank
als wie Rohnotizen verhalten soll, verwenden Sie das gebündelte Plugin `memory-wiki`. Es kompiliert dauerhaftes
Wissen in einen Wiki-Tresor mit deterministischer Seitenstruktur, strukturierten
Aussagen und Belegen, Nachverfolgung von Widersprüchen und Aktualität, generierten
Dashboards, kompilierten Zusammenfassungen und Wiki-nativen Werkzeugen (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` ersetzt nicht das aktive Gedächtnis-Plugin; das aktive Gedächtnis-
Plugin bleibt für Abruf, Übernahme und Dreaming zuständig. `memory-wiki` ergänzt daneben eine
Wissensebene mit umfangreichen Herkunftsinformationen.

<CardGroup cols={1}>
<Card title="Gedächtnis-Wiki" icon="book" href="/de/plugins/memory-wiki">
Kompiliert dauerhaftes Gedächtnis in einen Wiki-Tresor mit umfangreichen Herkunftsinformationen, Aussagen,
Dashboards, Brückenmodus und Obsidian-kompatiblen Workflows.
</Card>
</CardGroup>

## Automatisches Leeren des Gedächtnisses

Bevor [Compaction](/de/concepts/compaction) Ihre Unterhaltung zusammenfasst,
führt OpenClaw einen stillen Durchlauf aus, der den Agenten daran erinnert, wichtigen Kontext
in Gedächtnisdateien zu speichern. Dies ist standardmäßig aktiviert; setzen Sie
`agents.defaults.compaction.memoryFlush.enabled: false`, um es zu deaktivieren.

Um diesen Verwaltungsdurchlauf auf einem lokalen Modell auszuführen, legen Sie eine exakte Überschreibung fest, die
nur für den Durchlauf zum Leeren des Gedächtnisses gilt (sie übernimmt nicht die Modell-Fallback-Kette
der aktiven Sitzung):

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
Das Leeren des Gedächtnisses verhindert Kontextverlust während der Compaction. Wenn Ihr Agent
wichtige Fakten aus der Unterhaltung noch nicht in eine Datei geschrieben hat, werden sie
automatisch gespeichert, bevor die Zusammenfassung erfolgt.
</Tip>

## Dreaming

Dreaming ist ein optionaler Konsolidierungsdurchlauf im Hintergrund für das Gedächtnis. Er sammelt
kurzfristige Abrufsignale, bewertet Kandidaten und übernimmt nur qualifizierte
Elemente in das Langzeitgedächtnis (`MEMORY.md`):

- **Optional**: standardmäßig deaktiviert.
- **Geplant**: Wenn aktiviert, verwaltet `memory-core` automatisch einen wiederkehrenden Cron-
  Job für einen vollständigen Dreaming-Durchlauf.
- **Schwellenwertbasiert**: Übernahmen müssen die Grenzwerte für Bewertung, Abrufhäufigkeit und
  Abfragevielfalt erfüllen.
- **Überprüfbar**: Phasenzusammenfassungen und Tagebucheinträge werden zur
  menschlichen Überprüfung in `DREAMS.md` geschrieben.

Unter [Dreaming](/de/concepts/dreaming) finden Sie Details zum Phasenverhalten, zu Bewertungssignalen und zum
Traumtagebuch.

## Fundierter Backfill und Live-Übernahme

Das Dreaming-System verfügt über zwei zusammengehörige Prüfpfade:

- **Live-Dreaming** arbeitet mit dem kurzfristigen Dreaming-Speicher unter
  `memory/.dreams/` und wird von der normalen Tiefenphase verwendet, um zu entscheiden, was
  in `MEMORY.md` übernommen wird.
- **Fundierter Backfill** liest historische `memory/YYYY-MM-DD.md`-Notizen als
  eigenständige Tagesdateien und schreibt strukturierte Prüfausgaben in `DREAMS.md`.

Der fundierte Backfill eignet sich dazu, ältere Notizen erneut abzuspielen und zu prüfen, was das
System als dauerhaft betrachtet, ohne `MEMORY.md` manuell zu bearbeiten.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das Flag `--stage-short-term` stellt fundierte dauerhafte Kandidaten im selben
kurzfristigen Dreaming-Speicher bereit, den die normale Tiefenphase bereits verwendet; es
übernimmt sie nicht direkt. Daher gilt:

- `DREAMS.md` bleibt die Oberfläche für die menschliche Überprüfung.
- Der kurzfristige Speicher bleibt die maschinenorientierte Ranglistenoberfläche.
- `MEMORY.md` wird weiterhin ausschließlich durch die Tiefenübernahme geschrieben.

So machen Sie eine erneute Verarbeitung rückgängig, ohne gewöhnliche Tagebucheinträge oder den normalen Abrufzustand
zu verändern:

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

- [Speichersuche](/de/concepts/memory-search): Suchpipeline, Provider und Optimierung.
- [Integrierte Speicher-Engine](/de/concepts/memory-builtin): standardmäßiges SQLite-Backend.
- [QMD-Speicher-Engine](/de/concepts/memory-qmd): fortschrittlicher Local-First-Sidecar.
- [Honcho-Speicher](/de/concepts/memory-honcho): KI-nativer sitzungsübergreifender Speicher.
- [Memory LanceDB](/de/plugins/memory-lancedb): LanceDB-gestütztes Plugin mit OpenAI-kompatiblen Einbettungen.
- [Memory Wiki](/de/plugins/memory-wiki): kompilierter Wissensspeicher und Wiki-native Werkzeuge.
- [Dreaming](/de/concepts/dreaming): Hintergrundüberführung aus dem Kurzzeitabruf in den Langzeitspeicher.
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config): alle Konfigurationsoptionen.
- [Compaction](/de/concepts/compaction): wie Compaction mit dem Speicher interagiert.
- [Active Memory](/de/concepts/active-memory): Sub-Agent-Speicher für interaktive Chatsitzungen.
