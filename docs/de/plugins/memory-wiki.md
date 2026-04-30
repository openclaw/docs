---
read_when:
    - Sie möchten dauerhaftes Wissen, das über einfache MEMORY.md-Notizen hinausgeht
    - Sie konfigurieren das mitgelieferte memory-wiki-Plugin
    - Sie möchten wiki_search, wiki_get oder den Bridge-Modus verstehen
summary: 'memory-wiki: zusammengestelltes Wissensarchiv mit Provenienz, Aussagen, Dashboards und Bridge-Modus'
title: Speicher-Wiki
x-i18n:
    generated_at: "2026-04-30T07:06:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` ist ein gebündeltes Plugin, das dauerhaften Speicher in einen kompilierten
Wissensspeicher umwandelt.

Es ersetzt **nicht** das Active Memory Plugin. Das Active Memory Plugin
verwaltet weiterhin Abruf, Promotion, Indizierung und Dreaming. `memory-wiki`
sitzt daneben und kompiliert dauerhaftes Wissen in ein navigierbares Wiki mit
deterministischen Seiten, strukturierten Behauptungen, Provenienz, Dashboards
und maschinenlesbaren Digests.

Verwenden Sie es, wenn Speicher sich eher wie eine gepflegte Wissensschicht und
weniger wie ein Stapel von Markdown-Dateien verhalten soll.

## Was es hinzufügt

- Einen dedizierten Wiki-Speicher mit deterministischem Seitenlayout
- Strukturierte Metadaten für Behauptungen und Nachweise, nicht nur Prosa
- Provenienz, Vertrauen, Widersprüche und offene Fragen auf Seitenebene
- Kompilierte Digests für Agent- und Runtime-Nutzer
- Wiki-native Werkzeuge für Suche, Abruf, Anwendung und Linting
- Optionalen Bridge-Modus, der öffentliche Artefakte aus dem Active Memory Plugin importiert
- Optionalen Obsidian-freundlichen Rendermodus und CLI-Integration

## Wie es mit Speicher zusammenpasst

Betrachten Sie die Aufteilung so:

| Schicht                                                 | Verwaltet                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory Plugin (`memory-core`, QMD, Honcho usw.)  | Abruf, semantische Suche, Promotion, Dreaming, Speicher-Runtime                             |
| `memory-wiki`                                           | Kompilierte Wiki-Seiten, provenienzreiche Synthesen, Dashboards, wiki-spezifische Suche/Abruf/Anwendung |

Wenn das Active Memory Plugin gemeinsame Abrufartefakte bereitstellt, kann OpenClaw
beide Schichten in einem Durchlauf mit `memory_search corpus=all` durchsuchen.

Wenn Sie wiki-spezifisches Ranking, Provenienz oder direkten Seitenzugriff benötigen,
verwenden Sie stattdessen die wiki-nativen Werkzeuge.

## Empfohlenes Hybridmuster

Eine starke Standardeinstellung für lokal zuerst ausgelegte Setups ist:

- QMD als Active-Memory-Backend für Abruf und breite semantische Suche
- `memory-wiki` im Modus `bridge` für dauerhafte, synthetisierte Wissensseiten

Diese Aufteilung funktioniert gut, weil jede Schicht fokussiert bleibt:

- QMD hält Rohnotizen, Sitzungsexporte und zusätzliche Sammlungen durchsuchbar
- `memory-wiki` kompiliert stabile Entitäten, Behauptungen, Dashboards und Quellseiten

Praktische Regel:

- Verwenden Sie `memory_search`, wenn Sie einen breiten Abrufdurchlauf über den Speicher möchten
- Verwenden Sie `wiki_search` und `wiki_get`, wenn Sie provenienzbewusste Wiki-Ergebnisse möchten
- Verwenden Sie `memory_search corpus=all`, wenn die gemeinsame Suche beide Schichten umfassen soll

Wenn der Bridge-Modus null exportierte Artefakte meldet, stellt das Active Memory Plugin
derzeit noch keine öffentlichen Bridge-Eingaben bereit. Führen Sie zuerst
`openclaw wiki doctor` aus und bestätigen Sie dann, dass das Active Memory Plugin
öffentliche Artefakte unterstützt.

Wenn der Bridge-Modus aktiv ist und `bridge.readMemoryArtifacts` aktiviert ist,
lesen `openclaw wiki status`, `openclaw wiki doctor` und `openclaw wiki bridge
import` über den laufenden Gateway. Dadurch bleiben CLI-Bridge-Prüfungen mit dem
Runtime-Kontext des Speicher-Plugins abgestimmt. Wenn Bridge deaktiviert ist oder
Artefakt-Lesezugriffe ausgeschaltet sind, behalten diese Befehle ihr lokales/Offline-Verhalten.

## Speicher-Modi

`memory-wiki` unterstützt drei Speicher-Modi:

### `isolated`

Eigener Speicher, eigene Quellen, keine Abhängigkeit von `memory-core`.

Verwenden Sie dies, wenn das Wiki ein eigener kuratierter Wissensspeicher sein soll.

### `bridge`

Liest öffentliche Speicherartefakte und Speicherereignisse aus dem Active Memory Plugin
über öffentliche Plugin-SDK-Schnittstellen.

Verwenden Sie dies, wenn das Wiki die exportierten Artefakte des Speicher-Plugins
kompilieren und organisieren soll, ohne auf private Plugin-Interna zuzugreifen.

Der Bridge-Modus kann Folgendes indizieren:

- exportierte Speicherartefakte
- Dream-Berichte
- Tagesnotizen
- Speicher-Root-Dateien
- Speicherereignisprotokolle

### `unsafe-local`

Explizite Ausweichmöglichkeit für private lokale Pfade auf derselben Maschine.

Dieser Modus ist bewusst experimentell und nicht portabel. Verwenden Sie ihn nur,
wenn Sie die Vertrauensgrenze verstehen und ausdrücklich lokalen Dateisystemzugriff
benötigen, den der Bridge-Modus nicht bereitstellen kann.

## Speicher-Layout

Das Plugin initialisiert einen Speicher wie folgt:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Verwaltete Inhalte bleiben innerhalb generierter Blöcke. Menschliche Notizblöcke
werden beibehalten.

Die Hauptseitengruppen sind:

- `sources/` für importiertes Rohmaterial und bridge-gestützte Seiten
- `entities/` für dauerhafte Dinge, Personen, Systeme, Projekte und Objekte
- `concepts/` für Ideen, Abstraktionen, Muster und Richtlinien
- `syntheses/` für kompilierte Zusammenfassungen und gepflegte Rollups
- `reports/` für generierte Dashboards

## Strukturierte Behauptungen und Nachweise

Seiten können strukturiertes `claims`-Frontmatter enthalten, nicht nur Freitext.

Jede Behauptung kann Folgendes enthalten:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Nachweiseinträge können Folgendes enthalten:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Dadurch verhält sich das Wiki eher wie eine Überzeugungsschicht als wie eine passive
Notizensammlung. Behauptungen können verfolgt, bewertet, angefochten und zu Quellen
zurückverfolgt werden.

## Agent-orientierte Entitätsmetadaten

Entitätsseiten können außerdem Routing-Metadaten für Agenten enthalten. Dies ist generisches
Frontmatter und funktioniert daher für Personen, Teams, Systeme, Projekte oder jeden
anderen Entitätstyp.

Häufige Felder sind:

- `entityType`: zum Beispiel `person`, `team`, `system` oder `project`
- `canonicalId`: stabiler Identitätsschlüssel, der über Aliase und Importe hinweg verwendet wird
- `aliases`: Namen, Handles oder Labels, die auf dieselbe Seite aufgelöst werden sollen
- `privacyTier`: `public`, `local-private`, `sensitive` oder `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: kompakte Routing-Hinweise
- `lastRefreshedAt`: Zeitstempel der Quellenaktualisierung, getrennt vom Bearbeitungszeitpunkt der Seite
- `personCard`: optionale personenspezifische Routing-Karte mit Handles, sozialen Profilen,
  E-Mails, Zeitzone, Lane, Anfragen für, nicht anfragen für, Vertrauen und Datenschutz
- `relationships`: typisierte Kanten zu verwandten Seiten mit Ziel, Art, Gewicht,
  Vertrauen, Nachweisart, Datenschutzstufe und Notiz

Für ein Personen-Wiki sollte der Agent normalerweise mit
`reports/person-agent-directory.md` beginnen und anschließend die Personenseite mit `wiki_get`
öffnen, bevor Kontaktdaten oder abgeleitete Fakten verwendet werden.

Beispiel:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Kompilierungs-Pipeline

Der Kompilierungsschritt liest Wiki-Seiten, normalisiert Zusammenfassungen und erzeugt stabile
maschinenorientierte Artefakte unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Diese Digests existieren, damit Agenten und Runtime-Code keine Markdown-Seiten
auslesen müssen.

Die kompilierte Ausgabe treibt außerdem Folgendes an:

- Wiki-Indizierung im ersten Durchlauf für Such-/Abrufflüsse
- Nachschlagen von Behauptungs-IDs zurück zu den zugehörigen Seiten
- kompakte Prompt-Ergänzungen
- Berichts-/Dashboard-Generierung

## Dashboards und Zustandsberichte

Wenn `render.createDashboards` aktiviert ist, verwaltet die Kompilierung Dashboards unter
`reports/`.

Integrierte Berichte umfassen:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Diese Berichte verfolgen Dinge wie:

- Cluster von Widerspruchsnotizen
- konkurrierende Behauptungscluster
- Behauptungen ohne strukturierte Nachweise
- Seiten und Behauptungen mit geringem Vertrauen
- veraltete oder unbekannte Aktualität
- Seiten mit ungelösten Fragen
- Routing-Karten für Personen/Entitäten
- strukturierte Beziehungskanten
- Abdeckung von Nachweisklassen
- nicht-öffentliche Datenschutzstufen, die vor der Verwendung geprüft werden müssen

## Suche und Abruf

`memory-wiki` unterstützt zwei Such-Backends:

- `shared`: verwendet den gemeinsamen Speichersuchfluss, wenn verfügbar
- `local`: durchsucht das Wiki lokal

Es unterstützt außerdem drei Korpora:

- `wiki`
- `memory`
- `all`

Wichtiges Verhalten:

- `wiki_search` und `wiki_get` verwenden, wenn möglich, kompilierte Digests als ersten Durchlauf
- Behauptungs-IDs können zur zugehörigen Seite zurück aufgelöst werden
- angefochtene/veraltete/frische Behauptungen beeinflussen das Ranking
- Provenienzlabels können in Ergebnisse übernommen werden
- der Suchmodus kann das Ranking für Personensuche, Fragenrouting, Quellnachweise
  oder Rohbehauptungen gewichten

Praktische Regel:

- Verwenden Sie `memory_search corpus=all` für einen breiten Abrufdurchlauf
- Verwenden Sie `wiki_search` + `wiki_get`, wenn Ihnen wiki-spezifisches Ranking,
  Provenienz oder Überzeugungsstruktur auf Seitenebene wichtig ist

Suchmodi:

- `auto`: ausgewogene Standardeinstellung
- `find-person`: gewichtet personenähnliche Entitäten, Aliase, Handles, soziale Profile und
  kanonische IDs höher
- `route-question`: gewichtet Agent-Karten, Anfragen-für-Hinweise, Best-Used-For-Hinweise und
  Beziehungskontext höher
- `source-evidence`: gewichtet Quellseiten und strukturierte Nachweismetadaten höher
- `raw-claim`: gewichtet passende strukturierte Behauptungen höher und gibt Behauptungs-/Nachweis-
  Metadaten in Ergebnissen zurück

Wenn ein Ergebnis zu einer strukturierten Behauptung passt, kann `wiki_search`
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` und `evidenceSourceIds` in seiner Detailnutzlast zurückgeben. Die Textausgabe
enthält außerdem kompakte `Claim:`- und `Evidence:`-Zeilen, wenn verfügbar.

## Agent-Werkzeuge

Das Plugin registriert diese Werkzeuge:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Was sie tun:

- `wiki_status`: aktueller Speicher-Modus, Zustand, Verfügbarkeit der Obsidian-CLI
- `wiki_search`: durchsucht Wiki-Seiten und, wenn konfiguriert, gemeinsame Speicherkorpora;
  akzeptiert `mode` für Personensuche, Fragenrouting, Quellnachweise oder Rohbehauptungs-Drilldown
- `wiki_get`: liest eine Wiki-Seite nach ID/Pfad oder fällt auf das gemeinsame Speicherkorpus zurück
- `wiki_apply`: enge Synthese-/Metadatenmutationen ohne freie Seitenchirurgie
- `wiki_lint`: strukturelle Prüfungen, Provenienzlücken, Widersprüche, offene Fragen

Das Plugin registriert außerdem eine nicht-exklusive Speicherkorpus-Ergänzung, sodass gemeinsame
`memory_search` und `memory_get` das Wiki erreichen können, wenn das Active Memory Plugin
Korpusauswahl unterstützt.

## Prompt- und Kontextverhalten

Wenn `context.includeCompiledDigestPrompt` aktiviert ist, hängen Speicher-Prompt-Abschnitte
einen kompakten kompilierten Snapshot aus `agent-digest.json` an.

Dieser Snapshot ist absichtlich klein und signalreich:

- nur Top-Seiten
- nur Top-Behauptungen
- Anzahl der Widersprüche
- Anzahl der Fragen
- Vertrauens-/Aktualitätsqualifizierer

Dies ist optional, weil es die Prompt-Form verändert und hauptsächlich für Kontext-Engines
oder ältere Prompt-Zusammenstellung nützlich ist, die Speicherergänzungen ausdrücklich verwenden.

## Konfiguration

Legen Sie die Konfiguration unter `plugins.entries.memory-wiki.config` ab:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Wichtige Schalter:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` oder `obsidian`
- `bridge.readMemoryArtifacts`: öffentliche Artefakte des Active-Memory-Plugins importieren
- `bridge.followMemoryEvents`: Ereignisprotokolle im Bridge-Modus einschließen
- `search.backend`: `shared` oder `local`
- `search.corpus`: `wiki`, `memory` oder `all`
- `context.includeCompiledDigestPrompt`: kompakten Digest-Snapshot an Memory-Prompt-Abschnitte anhängen
- `render.createBacklinks`: deterministische verwandte Blöcke erzeugen
- `render.createDashboards`: Dashboard-Seiten erzeugen

### Beispiel: QMD + Bridge-Modus

Verwenden Sie dies, wenn Sie QMD für den Abruf und `memory-wiki` für eine gepflegte
Wissensebene möchten:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Dies behält bei:

- QMD bleibt für Active-Memory-Abruf zuständig
- `memory-wiki` konzentriert sich auf kompilierte Seiten und Dashboards
- die Prompt-Form bleibt unverändert, bis Sie kompilierte Digest-Prompts absichtlich aktivieren

## CLI

`memory-wiki` stellt außerdem eine CLI-Oberfläche auf oberster Ebene bereit:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Die vollständige Befehlsreferenz finden Sie unter [CLI: wiki](/de/cli/wiki).

## Obsidian-Unterstützung

Wenn `vault.renderMode` `obsidian` ist, schreibt das Plugin Obsidian-freundliches
Markdown und kann optional die offizielle `obsidian`-CLI verwenden.

Unterstützte Workflows umfassen:

- Statusprüfung
- Vault-Suche
- Öffnen einer Seite
- Aufrufen eines Obsidian-Befehls
- Springen zur täglichen Notiz

Dies ist optional. Das Wiki funktioniert weiterhin im nativen Modus ohne Obsidian.

## Empfohlener Workflow

1. Behalten Sie Ihr Active-Memory-Plugin für Abruf/Promotion/Dreaming bei.
2. Aktivieren Sie `memory-wiki`.
3. Beginnen Sie mit dem Modus `isolated`, es sei denn, Sie möchten ausdrücklich den Bridge-Modus.
4. Verwenden Sie `wiki_search` / `wiki_get`, wenn Provenienz wichtig ist.
5. Verwenden Sie `wiki_apply` für gezielte Synthesen oder Metadatenaktualisierungen.
6. Führen Sie nach wesentlichen Änderungen `wiki_lint` aus.
7. Aktivieren Sie Dashboards, wenn Sie Sichtbarkeit für veraltete Inhalte/Widersprüche wünschen.

## Verwandte Dokumentation

- [Memory-Übersicht](/de/concepts/memory)
- [CLI: memory](/de/cli/memory)
- [CLI: wiki](/de/cli/wiki)
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
