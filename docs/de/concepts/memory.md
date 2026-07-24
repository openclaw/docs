---
read_when:
    - Sie möchten verstehen, wie der Speicher funktioniert
    - Sie möchten wissen, welche Memory-Dateien Sie schreiben sollen
summary: Wie OpenClaw sich sitzungsübergreifend an Dinge erinnert
title: Speicherübersicht
x-i18n:
    generated_at: "2026-07-24T04:53:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cdfd5276d6289a4ee38b5203eb5443312c4b040d4ea67abe4a9c579703136339
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw merkt sich Dinge, indem es einfache Markdown-Dateien in den
Arbeitsbereich Ihres Agenten schreibt (Standard: `~/.openclaw/workspace`). Das Modell merkt sich nur, was
auf der Festplatte gespeichert wird; es gibt keinen verborgenen Zustand.

## Funktionsweise

Ihr Agent verfügt über drei speicherbezogene Dateien:

- **`MEMORY.md`** — Langzeitspeicher. Dauerhafte Fakten, Präferenzen und
  Entscheidungen. Wird zu Beginn einer Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** (oder `memory/YYYY-MM-DD-<slug>.md`) — tägliche Notizen.
  Fortlaufender Kontext und Beobachtungen. Die datierten Notizen von heute und gestern werden
  bei einem einfachen `/new` oder `/reset` automatisch geladen; Varianten mit Slug, wie sie
  etwa vom gebündelten Session-Memory-Hook geschrieben werden, werden zusammen mit der
  Datei berücksichtigt, die nur das Datum enthält.
- **`DREAMS.md`** (optional) — Traumtagebuch und Zusammenfassungen von Dreaming-Durchläufen zur
  menschlichen Überprüfung, einschließlich fundierter historischer Backfill-Einträge.

<Tip>
Wenn sich Ihr Agent etwas merken soll, bitten Sie ihn einfach darum: „Merken Sie sich, dass ich
TypeScript bevorzuge.“ Er schreibt die Notiz in die entsprechende Datei.
</Tip>

## Was wohin gehört

`MEMORY.md` ist die kompakte, kuratierte Ebene: dauerhafte Fakten, Präferenzen, geltende
Entscheidungen und kurze Zusammenfassungen, die zu Beginn einer
Sitzung verfügbar sein sollten. Sie ist weder ein Rohtranskript noch ein Tagesprotokoll oder ein vollständiges Archiv.

`memory/YYYY-MM-DD.md`-Dateien bilden die Arbeitsebene: ausführliche tägliche Notizen,
Beobachtungen, Sitzungszusammenfassungen und Rohkontext, die später noch nützlich sein können.
Sie werden für `memory_search` und `memory_get` indiziert, aber nicht
bei jedem Durchlauf in den Bootstrap-Prompt eingefügt.

Im Laufe der Zeit destilliert der Agent nützliches Material aus täglichen Notizen in
`MEMORY.md` und entfernt veraltete Langzeiteinträge. Generierte Anweisungen für den Arbeitsbereich
und der Heartbeat-Ablauf erledigen dies regelmäßig; Sie müssen
`MEMORY.md` nicht für jedes Detail manuell bearbeiten.

Wenn `MEMORY.md` das Budget für Bootstrap-Dateien überschreitet, lässt OpenClaw die Datei auf
der Festplatte unverändert, kürzt jedoch die in den Kontext eingefügte Kopie. Betrachten Sie dies als
Signal, ausführliches Material nach `memory/*.md` zu verschieben, nur eine dauerhafte
Zusammenfassung in `MEMORY.md` aufzubewahren oder die Bootstrap-Grenzwerte zu erhöhen, wenn Sie mehr
Prompt-Budget verwenden möchten. Mit `/context list`, `/context detail` oder `openclaw doctor` können Sie
Rohgröße und eingefügte Größe sowie den Kürzungsstatus anzeigen.

## Import aus Programmierassistenten

Die Control UI kann vorhandenen lokalen Speicher aus Codex und Claude Code importieren.
Öffnen Sie **Settings** → **Import Memory**, wählen Sie den Zielagenten aus, prüfen Sie die
erkannten Dateien und bestätigen Sie den Import. OpenClaw kopiert ausschließlich Markdown-Speicher:

- Codex: die konsolidierten Dateien `MEMORY.md` und `memory_summary.md` unter
  `~/.codex/memories` (oder `CODEX_HOME/memories`). Rohdateien von Ausführungen und Transkripten
  werden nicht importiert.
- Claude Code: Markdown-Dateien aus dem automatischen Speicherverzeichnis jedes Projekts unter
  `~/.claude/projects/*/memory` sowie eine benutzerkonfigurierte
  `autoMemoryDirectory`, sofern vorhanden. Projektanweisungen, Sitzungen, Einstellungen
  und Anmeldedaten sind nicht Bestandteil dieser ausschließlich den Speicher betreffenden Aktion.

Importierte Dateien bleiben unter `memory/imports/codex/` und
`memory/imports/claude-code/` im Arbeitsbereich des ausgewählten Agenten getrennt. Sie werden
für `memory_search` indiziert und sind über `memory_get` verfügbar; sie werden nicht mit
der Bootstrap-Datei `MEMORY.md` des Agenten zusammengeführt. Die Quelldateien bleiben unverändert.

Die Vorschau kennzeichnet Konflikte am Ziel. Aktivieren Sie **Replace existing imports**, um
diese Dateien zu ersetzen; beim Anwenden wird eine verifizierte Sicherung vor dem Import erstellt und
im Migrationsbericht werden Kopien der einzelnen überschriebenen Dateien aufbewahrt.

## Aktionsrelevante Erinnerungen

Die meisten Erinnerungen sind gewöhnliche Markdown-Notizen. Manche beeinflussen, was der Agent
später tun soll; halten Sie bei diesen fest, wann auf Grundlage der Notiz sicher gehandelt werden kann, nicht nur
die Tatsache selbst.

Erfassen Sie diese Aktionsgrenze, wenn eine Notiz Folgendes betrifft:

- Genehmigungs- oder Berechtigungsanforderungen,
- vorübergehende Einschränkungen,
- Übergaben an eine andere Sitzung, einen anderen Thread oder eine andere Person,
- Ablaufbedingungen,
- den Zeitpunkt, ab dem sicher gehandelt werden kann,
- die Autorität der Quelle oder des Verantwortlichen,
- Anweisungen, eine verlockende Aktion zu vermeiden.

Eine nützliche aktionsrelevante Erinnerung verdeutlicht:

- was zukünftiges Verhalten ändert,
- wann oder unter welcher Bedingung sie gilt,
- wann sie abläuft oder wodurch eine Aktion freigegeben wird,
- was der Agent vermeiden soll,
- wer die Quelle oder der Verantwortliche ist, sofern dies Vertrauen oder Autorität beeinflusst.

Der Speicher kann Genehmigungskontext bewahren, setzt jedoch keine Richtlinien durch. Verwenden Sie
die Genehmigungseinstellungen, das Sandboxing und geplante Aufgaben von OpenClaw für verbindliche
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
sollten ihn nur als Beleg behandeln; speichern Sie ihn erst als dauerhafte Erinnerung, wenn ein
vertrauenswürdiger Prüfer die Inhalte bestätigt.
```

Dies ist kein verpflichtendes Schema für jede Erinnerung; einfache Fakten können knapp bleiben.
Verwenden Sie aktionsrelevante Grenzen, wenn der Verlust von Zeitpunkt, Autorität, Ablauf oder
Kontext für sicheres Handeln dazu führen könnte, dass der Agent später das Falsche tut.

Verwenden Sie [geplante Aufgaben](/de/automation/cron-jobs) für genaue Erinnerungen, zeitgesteuerte Prüfungen
und wiederkehrende Arbeiten. Der Speicher kann weiterhin den dauerhaften Kontext dieser
Arbeiten zusammenfassen.

## Eingestellte abgeleitete Verpflichtungen

Manche zukünftigen Folgeaktionen sind keine dauerhaften Fakten. Wenn Sie ein Vorstellungsgespräch
morgen erwähnen, könnte die nützliche Erinnerung „nach dem Vorstellungsgespräch nachfragen“ lauten, nicht „dies
für immer in `MEMORY.md` speichern“.

Das Experiment mit abgeleiteten Verpflichtungen wurde eingestellt. OpenClaw extrahiert oder
übermittelt diese Folgeaktionen nicht mehr. Verwenden Sie [geplante Aufgaben](/de/automation/cron-jobs) für
zukünftige Aktionen; der ältere Befehl `openclaw commitments` bleibt verfügbar, um
vorhandene gespeicherte Zeilen zu prüfen oder zu verwerfen.

## Speicherwerkzeuge

Der Agent verfügt über zwei Werkzeuge für die Arbeit mit dem Speicher:

- **`memory_search`** — findet relevante Notizen mithilfe semantischer Suche, selbst wenn
  die Formulierung vom Original abweicht.
- **`memory_get`** — liest eine bestimmte Speicherdatei oder einen Zeilenbereich.

Beide Werkzeuge werden vom aktiven Speicher-Plugin bereitgestellt (Standard: `memory-core`).

## Speichersuche

Wenn ein Embedding-Provider konfiguriert ist, verwendet `memory_search` eine hybride Suche:
Vektorähnlichkeit (semantische Bedeutung) kombiniert mit Schlüsselwortabgleich (exakte
Begriffe wie IDs und Codesymbole). Dies funktioniert ohne weitere Einrichtung mit einem API-Schlüssel
für jeden unterstützten Provider.

<Info>
OpenClaw verwendet standardmäßig OpenAI-Embeddings. Setzen Sie
`memory.search.provider` ausdrücklich, um Gemini, Voyage,
Mistral, Bedrock, DeepInfra, lokales GGUF, Ollama, LM Studio, GitHub Copilot oder
einen generischen OpenAI-kompatiblen Endpunkt zu verwenden.
</Info>

Unter [Speichersuche](/de/concepts/memory-search) erfahren Sie, wie die Suche funktioniert, welche
Optimierungsoptionen verfügbar sind und wie Provider eingerichtet werden.

## Speicher-Backends

<CardGroup cols={3}>
<Card title="Integriert (Standard)" icon="database" href="/de/concepts/memory-builtin">
SQLite-basiert. Funktioniert ohne weitere Einrichtung mit Schlüsselwortsuche, Vektorähnlichkeit und
hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/de/concepts/memory-qmd">
Lokal ausgerichteter Sidecar mit Neusortierung, Abfrageerweiterung und der Möglichkeit,
Verzeichnisse außerhalb des Arbeitsbereichs zu indizieren.
</Card>
<Card title="Honcho" icon="brain" href="/de/concepts/memory-honcho">
KI-nativer sitzungsübergreifender Speicher mit Benutzermodellierung, semantischer Suche und
Bewusstsein für mehrere Agenten. Plugin-Installation.
</Card>
<Card title="LanceDB" icon="layers" href="/de/plugins/memory-lancedb">
LanceDB-gestützter Speicher mit OpenAI-kompatiblen Embeddings, automatischem Abruf,
automatischer Erfassung und Unterstützung lokaler Ollama-Embeddings. Plugin-Installation.
</Card>
</CardGroup>

## Wissens-Wiki-Ebene

Wenn sich dauerhafter Speicher eher wie eine gepflegte Wissensdatenbank
als wie rohe Notizen verhalten soll, verwenden Sie das gebündelte Plugin `memory-wiki`. Es kompiliert dauerhaftes
Wissen in einen Wiki-Tresor mit deterministischer Seitenstruktur, strukturierten
Aussagen und Belegen, Nachverfolgung von Widersprüchen und Aktualität, generierten
Dashboards, kompilierten Zusammenfassungen und Wiki-nativen Werkzeugen (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` ersetzt das aktive Speicher-Plugin nicht; das aktive Speicher-Plugin
bleibt für Abruf, Übernahme und Dreaming zuständig. `memory-wiki` fügt daneben eine
provenienzreiche Wissensebene hinzu.

<CardGroup cols={1}>
<Card title="Speicher-Wiki" icon="book" href="/de/plugins/memory-wiki">
Kompiliert dauerhaften Speicher in einen provenienzreichen Wiki-Tresor mit Aussagen,
Dashboards, Brückenmodus und Obsidian-freundlichen Arbeitsabläufen.
</Card>
</CardGroup>

## Automatisches Leeren des Speichers

Bevor [Compaction](/de/concepts/compaction) Ihre Unterhaltung zusammenfasst,
führt OpenClaw einen stillen Durchlauf aus, der den Agenten daran erinnert, wichtigen Kontext
in Speicherdateien zu sichern. Dies ist standardmäßig aktiviert; setzen Sie
`agents.defaults.compaction.memoryFlush.enabled: false`, um es zu deaktivieren.

Um diesen Verwaltungsdurchlauf auf einem lokalen Modell auszuführen, legen Sie eine exakte Überschreibung fest, die
nur für den Speicherleerungs-Durchlauf gilt (sie übernimmt nicht die Modell-Fallback-Kette der aktiven
Sitzung):

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
Das Leeren des Speichers verhindert Kontextverlust während der Compaction. Wenn Ihr Agent
wichtige Fakten aus der Unterhaltung noch nicht in eine Datei geschrieben hat, werden sie
automatisch gespeichert, bevor die Zusammenfassung erfolgt.
</Tip>

## Dreaming

Dreaming ist ein optionaler Hintergrunddurchlauf zur Konsolidierung des Speichers. Er erfasst
kurzfristige Abrufsignale, bewertet Kandidaten und übernimmt nur qualifizierte
Elemente in den Langzeitspeicher (`MEMORY.md`):

- **Optional**: standardmäßig deaktiviert.
- **Geplant**: Wenn aktiviert, verwaltet `memory-core` automatisch einen wiederkehrenden Cron-
  Job für einen vollständigen Dreaming-Durchlauf.
- **Schwellenwertbasiert**: Übernahmen müssen die Schwellen für Bewertung, Abrufhäufigkeit und
  Abfragevielfalt erfüllen.
- **Überprüfbar**: Phasenzusammenfassungen und Tagebucheinträge werden zur menschlichen Prüfung in
  `DREAMS.md` geschrieben.

Unter [Dreaming](/de/concepts/dreaming) finden Sie Details zum Phasenverhalten, zu Bewertungssignalen und zum
Traumtagebuch.

## Fundierter Backfill und Live-Übernahme

Das Dreaming-System verfügt über zwei zusammengehörige Prüfpfade:

- **Live-Dreaming** arbeitet mit dem kurzfristigen Dreaming-Speicher unter
  `memory/.dreams/` und wird von der normalen tiefen Phase verwendet, um zu entscheiden, was
  in `MEMORY.md` übernommen wird.
- **Fundierter Backfill** liest historische `memory/YYYY-MM-DD.md`-Notizen als
  eigenständige Tagesdateien und schreibt strukturierte Prüfergebnisse in `DREAMS.md`.

Der fundierte Backfill eignet sich dazu, ältere Notizen erneut abzuspielen und zu prüfen, was das
System als dauerhaft betrachtet, ohne `MEMORY.md` manuell zu bearbeiten.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das Flag `--stage-short-term` stellt fundierte dauerhafte Kandidaten in denselben
kurzfristigen Dreaming-Speicher ein, den die normale tiefe Phase bereits verwendet; es
übernimmt sie nicht direkt. Daher gilt:

- `DREAMS.md` bleibt die Oberfläche für die menschliche Prüfung.
- Der kurzfristige Speicher bleibt die maschinenorientierte Bewertungsoberfläche.
- `MEMORY.md` wird weiterhin ausschließlich durch die tiefe Übernahme geschrieben.

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

- [Speichersuche](/de/concepts/memory-search): Suchpipeline, Provider und Feinabstimmung.
- [Integrierte Speicher-Engine](/de/concepts/memory-builtin): standardmäßiges SQLite-Backend.
- [QMD-Speicher-Engine](/de/concepts/memory-qmd): fortschrittlicher Local-First-Sidecar.
- [Honcho-Speicher](/de/concepts/memory-honcho): KI-nativer sitzungsübergreifender Speicher.
- [Memory LanceDB](/de/plugins/memory-lancedb): LanceDB-gestütztes Plugin mit OpenAI-kompatiblen Einbettungen.
- [Memory Wiki](/de/plugins/memory-wiki): kompilierter Wissensspeicher und Wiki-native Werkzeuge.
- [Dreaming](/de/concepts/dreaming): Überführung im Hintergrund vom Kurzzeitabruf in den Langzeitspeicher.
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config): alle Konfigurationsoptionen.
- [Compaction](/de/concepts/compaction): wie Compaction mit dem Speicher interagiert.
- [Active Memory](/de/concepts/active-memory): Subagenten-Speicher für interaktive Chatsitzungen.
