---
read_when:
    - Sie möchten dauerhaftes Wissen über einfache MEMORY.md-Notizen hinaus
    - Sie konfigurieren das mitgelieferte memory-wiki-Plugin
    - Sie möchten wiki_search, wiki_get oder den Bridge-Modus verstehen
summary: 'memory-wiki: kompilierter Wissensspeicher mit Herkunftsnachweisen, Claims, Dashboards und Bridge-Modus'
title: Speicher-Wiki
x-i18n:
    generated_at: "2026-06-27T17:49:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` ist ein gebündeltes Plugin, das dauerhaften Speicher in einen
kompilierten Wissens-Vault verwandelt.

Es ersetzt **nicht** das Active Memory Plugin. Das Active Memory Plugin bleibt
weiterhin für Recall, Promotion, Indexierung und Dreaming zuständig.
`memory-wiki` läuft daneben und kompiliert dauerhaftes Wissen in ein
navigierbares Wiki mit deterministischen Seiten, strukturierten Aussagen,
Provenienz, Dashboards und maschinenlesbaren Digests.

Verwenden Sie es, wenn sich Speicher eher wie eine gepflegte Wissensebene
verhalten soll und weniger wie ein Stapel Markdown-Dateien.

## Was es hinzufügt

- Einen dedizierten Wiki-Vault mit deterministischem Seitenlayout
- Strukturierte Aussage- und Evidenzmetadaten, nicht nur Prosa
- Provenienz, Vertrauen, Widersprüche und offene Fragen auf Seitenebene
- Kompilierte Digests für Agent-/Runtime-Verbraucher
- Wiki-native Search-/Get-/Apply-/Lint-Tools
- Importe im Open Knowledge Format in kompilierte Wiki-Konzepte
- Optionalen Bridge-Modus, der öffentliche Artefakte aus dem Active Memory Plugin importiert
- Optionalen Obsidian-freundlichen Render-Modus und CLI-Integration

## Wie es mit Speicher zusammenpasst

Stellen Sie sich die Aufteilung so vor:

| Ebene                                                   | Zuständig für                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory Plugin (`memory-core`, QMD, Honcho usw.)  | Recall, semantische Suche, Promotion, Dreaming, Speicher-Runtime                           |
| `memory-wiki`                                           | Kompilierte Wiki-Seiten, provenienzreiche Synthesen, Dashboards, wiki-spezifisches Search/Get/Apply |

Wenn das Active Memory Plugin gemeinsame Recall-Artefakte bereitstellt, kann
OpenClaw mit `memory_search corpus=all` beide Ebenen in einem Durchlauf
durchsuchen.

Wenn Sie wiki-spezifisches Ranking, Provenienz oder direkten Seitenzugriff
benötigen, verwenden Sie stattdessen die wiki-nativen Tools.

## Empfohlenes Hybridmuster

Ein starker Standard für Local-first-Setups ist:

- QMD als Active-Memory-Backend für Recall und breite semantische Suche
- `memory-wiki` im Modus `bridge` für dauerhaft synthetisierte Wissensseiten

Diese Aufteilung funktioniert gut, weil jede Ebene fokussiert bleibt:

- QMD hält Rohnotizen, Session-Exporte und zusätzliche Collections durchsuchbar
- `memory-wiki` kompiliert stabile Entitäten, Aussagen, Dashboards und Quellseiten

Praktische Regel:

- Verwenden Sie `memory_search`, wenn Sie einen breiten Recall-Durchlauf über Speicher möchten
- Verwenden Sie `wiki_search` und `wiki_get`, wenn Sie provenienzbewusste Wiki-Ergebnisse möchten
- Verwenden Sie `memory_search corpus=all`, wenn die gemeinsame Suche beide Ebenen umfassen soll

Wenn der Bridge-Modus null exportierte Artefakte meldet, stellt das Active Memory
Plugin derzeit noch keine öffentlichen Bridge-Eingaben bereit. Führen Sie zuerst
`openclaw wiki doctor` aus und bestätigen Sie dann, dass das Active Memory Plugin
öffentliche Artefakte unterstützt.

Wenn der Bridge-Modus aktiv ist und `bridge.readMemoryArtifacts` aktiviert ist,
lesen `openclaw wiki status`, `openclaw wiki doctor` und `openclaw wiki bridge
import` über den laufenden Gateway. Dadurch bleiben CLI-Bridge-Prüfungen am
Runtime-Kontext des Memory-Plugins ausgerichtet. Wenn Bridge deaktiviert ist oder
Artefaktlesevorgänge ausgeschaltet sind, behalten diese Befehle ihr lokales/
Offline-Verhalten bei.

## Vault-Modi

`memory-wiki` unterstützt drei Vault-Modi:

### `isolated`

Eigener Vault, eigene Quellen, keine Abhängigkeit von `memory-core`.

Verwenden Sie dies, wenn das Wiki ein eigener kuratierter Wissensspeicher sein
soll.

### `bridge`

Liest öffentliche Speicherartefakte und Speicherereignisse aus dem Active Memory
Plugin über öffentliche Plugin-SDK-Seams.

Verwenden Sie dies, wenn das Wiki die exportierten Artefakte des Memory-Plugins
kompilieren und organisieren soll, ohne auf private Plugin-Interna zuzugreifen.

Der Bridge-Modus kann indexieren:

- exportierte Speicherartefakte
- Dream-Berichte
- tägliche Notizen
- Speicher-Root-Dateien
- Speicherereignisprotokolle

### `unsafe-local`

Expliziter Ausweg für lokale private Pfade auf derselben Maschine.

Dieser Modus ist absichtlich experimentell und nicht portabel. Verwenden Sie ihn
nur, wenn Sie die Vertrauensgrenze verstehen und konkret lokalen
Dateisystemzugriff benötigen, den der Bridge-Modus nicht bereitstellen kann.

## Vault-Layout

Das Plugin initialisiert einen Vault wie folgt:

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

Verwaltete Inhalte bleiben innerhalb generierter Blöcke. Menschliche
Notizblöcke bleiben erhalten.

Die Hauptseitengruppen sind:

- `sources/` für importiertes Rohmaterial und Bridge-gestützte Seiten
- `entities/` für dauerhafte Dinge, Personen, Systeme, Projekte und Objekte
- `concepts/` für Ideen, Abstraktionen, Muster und Richtlinien
- `syntheses/` für kompilierte Zusammenfassungen und gepflegte Rollups
- `reports/` für generierte Dashboards

## Importe im Open Knowledge Format

`memory-wiki` kann entpackte Open-Knowledge-Format-Bundles importieren mit:

```bash
openclaw wiki okf import ./bundles/ga4
```

Das passt am besten, wenn ein Datenkatalog, Dokumentations-Crawler oder
Enrichment-Agent bereits OKF erzeugt: Behalten Sie OKF als portables
Austauschartefakt bei und lassen Sie `memory-wiki` daraus OpenClaw-native
Konzeptseiten und kompilierte Digests erstellen.

Der Importer folgt der OKF-v0.1-Form:

- Nicht reservierte `.md`-Dateien sind Konzeptdokumente
- Jedes importierte Konzept benötigt ein nicht leeres Frontmatter-Feld `type`
- Unbekannte OKF-`type`-Werte werden akzeptiert
- Reservierte Dateien `index.md` und `log.md` werden nicht als Konzepte importiert
- Defekte oder externe Markdown-Links bleiben erhalten

Importierte Konzeptseiten werden unter `concepts/` abgeflacht, damit die
bestehenden Compile-, Search-, Get-, Dashboard- und Prompt-Digest-Pfade sie
sehen, ohne einen zweiten Wiki-Baum hinzuzufügen. Jede Seite behält die
ursprüngliche OKF-Konzept-ID, den Quellpfad, `type`, `resource`, `tags`, den
Zeitstempel und das vollständige Producer-Frontmatter. Interne OKF-Links werden
auf die generierten Wiki-Konzeptseiten umgeschrieben und zusätzlich als
strukturierte `relationships`-Einträge mit `kind: okf-link` ausgegeben.

## Strukturierte Aussagen und Evidenz

Seiten können strukturiertes `claims`-Frontmatter enthalten, nicht nur
Freitext.

Jede Aussage kann enthalten:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Evidenzeinträge können enthalten:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Dadurch verhält sich das Wiki eher wie eine Überzeugungsebene als wie eine
passive Notizablage. Aussagen können verfolgt, bewertet, angefochten und zurück
zu Quellen aufgelöst werden.

## Agent-orientierte Entitätsmetadaten

Entitätsseiten können außerdem Routing-Metadaten für die Agent-Nutzung tragen.
Dies ist generisches Frontmatter und funktioniert daher für Personen, Teams,
Systeme, Projekte oder jeden anderen Entitätstyp.

Häufige Felder sind:

- `entityType`: zum Beispiel `person`, `team`, `system` oder `project`
- `canonicalId`: stabiler Identitätsschlüssel, der über Aliasse und Importe hinweg verwendet wird
- `aliases`: Namen, Handles oder Labels, die auf dieselbe Seite aufgelöst werden sollen
- `privacyTier`: `public`, `local-private`, `sensitive` oder `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: kompakte Routing-Hinweise
- `lastRefreshedAt`: Quellaktualisierungs-Zeitstempel getrennt von der Seitenbearbeitungszeit
- `personCard`: optionale personenspezifische Routing-Karte mit Handles, Socials,
  E-Mails, Zeitzone, Lane, Ask-for, Avoid-asking-for, Vertrauen und Datenschutz
- `relationships`: typisierte Kanten zu verwandten Seiten mit Ziel, Art, Gewicht,
  Vertrauen, Evidenzart, Datenschutzstufe und Notiz

Für ein Personen-Wiki sollte der Agent in der Regel mit
`reports/person-agent-directory.md` beginnen und dann die Personenseite mit
`wiki_get` öffnen, bevor er Kontaktdaten oder abgeleitete Fakten verwendet.

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

## Compile-Pipeline

Der Compile-Schritt liest Wiki-Seiten, normalisiert Zusammenfassungen und gibt
stabile maschinenorientierte Artefakte aus unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Diese Digests existieren, damit Agents und Runtime-Code keine Markdown-Seiten
scrapen müssen.

Kompilierte Ausgabe treibt außerdem an:

- First-pass-Wiki-Indexierung für Search-/Get-Flows
- Claim-ID-Lookup zurück zu den besitzenden Seiten
- kompakte Prompt-Ergänzungen
- Bericht-/Dashboard-Generierung

## Dashboards und Health-Berichte

Wenn `render.createDashboards` aktiviert ist, pflegt Compile Dashboards unter
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

- Widerspruchsnotiz-Cluster
- konkurrierende Aussage-Cluster
- Aussagen ohne strukturierte Evidenz
- Seiten und Aussagen mit niedrigem Vertrauen
- veraltete oder unbekannte Aktualität
- Seiten mit ungelösten Fragen
- Personen-/Entitäts-Routing-Karten
- strukturierte Beziehungskanten
- Abdeckung von Evidenzklassen
- nicht öffentliche Datenschutzstufen, die vor der Verwendung geprüft werden müssen

## Suche und Abruf

`memory-wiki` unterstützt zwei Such-Backends:

- `shared`: verwendet den gemeinsamen Memory-Such-Flow, wenn verfügbar
- `local`: durchsucht das Wiki lokal

Es unterstützt außerdem drei Korpora:

- `wiki`
- `memory`
- `all`

Wichtiges Verhalten:

- `wiki_search` und `wiki_get` verwenden nach Möglichkeit kompilierte Digests als ersten Durchlauf
- Claim-IDs können zurück auf die besitzende Seite aufgelöst werden
- angefochtene/veraltete/frische Aussagen beeinflussen das Ranking
- Provenienzlabels können in Ergebnisse übernommen werden
- der Suchmodus kann das Ranking auf Personensuche, Fragenrouting, Quell-
  evidenz oder rohe Aussagen ausrichten

Praktische Regel:

- Verwenden Sie `memory_search corpus=all` für einen breiten Recall-Durchlauf
- Verwenden Sie `wiki_search` + `wiki_get`, wenn Ihnen wiki-spezifisches Ranking,
  Provenienz oder die Überzeugungsstruktur auf Seitenebene wichtig ist

Suchmodi:

- `auto`: ausgewogener Standard
- `find-person`: priorisiert personenähnliche Entitäten, Aliasse, Handles, Socials und
  kanonische IDs
- `route-question`: priorisiert Agent-Karten, Ask-for-Hinweise, Best-used-for-Hinweise und
  Beziehungskontext
- `source-evidence`: priorisiert Quellseiten und strukturierte Evidenzmetadaten
- `raw-claim`: priorisiert passende strukturierte Aussagen und gibt Claim-/Evidenz-
  metadaten in Ergebnissen zurück

Wenn ein Ergebnis zu einer strukturierten Aussage passt, kann `wiki_search`
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` und `evidenceSourceIds` in seinem Details-Payload zurückgeben.
Textausgabe enthält außerdem kompakte `Claim:`- und `Evidence:`-Zeilen, wenn
verfügbar.

## Agent-Tools

Das Plugin registriert diese Tools:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Was sie tun:

- `wiki_status`: aktueller Vault-Modus, Health, Obsidian-CLI-Verfügbarkeit
- `wiki_search`: durchsucht Wiki-Seiten und, wenn konfiguriert, gemeinsame Memory-Korpora;
  akzeptiert `mode` für Personensuche, Fragenrouting, Quellevidenz oder Drilldown in rohe
  Aussagen
- `wiki_get`: liest eine Wiki-Seite nach ID/Pfad oder fällt auf den gemeinsamen Memory-Korpus zurück
- `wiki_apply`: enge Synthese-/Metadatenmutationen ohne freie Seitenchirurgie
- `wiki_lint`: Strukturprüfungen, Provenienzlücken, Widersprüche, offene Fragen

Das Plugin registriert außerdem ein nicht exklusives Memory-Korpus-Supplement, sodass gemeinsame
`memory_search` und `memory_get` das Wiki erreichen können, wenn das aktive Memory-
Plugin die Korpusauswahl unterstützt.

## Prompt- und Kontextverhalten

Wenn `context.includeCompiledDigestPrompt` aktiviert ist, hängen Memory-Prompt-Abschnitte
einen kompakten kompilierten Snapshot aus `agent-digest.json` an.

Dieser Snapshot ist absichtlich klein und signalstark:

- nur Top-Seiten
- nur Top-Aussagen
- Anzahl der Widersprüche
- Anzahl der Fragen
- Qualifikatoren für Konfidenz/Aktualität

Dies ist opt-in, weil es die Prompt-Form verändert und hauptsächlich für Kontext-
Engines oder Legacy-Prompt-Zusammenstellung nützlich ist, die Memory-Supplements
explizit konsumieren.

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

Wichtige Optionen:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` oder `obsidian`
- `bridge.readMemoryArtifacts`: öffentliche Artefakte des aktiven Memory-Plugins importieren
- `bridge.followMemoryEvents`: Ereignisprotokolle im Bridge-Modus einschließen
- `search.backend`: `shared` oder `local`
- `search.corpus`: `wiki`, `memory` oder `all`
- `context.includeCompiledDigestPrompt`: kompakten Digest-Snapshot an Memory-Prompt-Abschnitte anhängen
- `render.createBacklinks`: deterministische verwandte Blöcke generieren
- `render.createDashboards`: Dashboard-Seiten generieren

### Beispiel: QMD + Bridge-Modus

Verwenden Sie dies, wenn Sie QMD für den Abruf und `memory-wiki` für eine gepflegte
Wissensebene nutzen möchten:

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
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

Dadurch bleibt:

- QMD für den Abruf aus Active Memory zuständig
- `memory-wiki` auf kompilierte Seiten und Dashboards fokussiert
- die Prompt-Form unverändert, bis Sie kompilierte Digest-Prompts bewusst aktivieren

## CLI

`memory-wiki` stellt außerdem eine Top-Level-CLI-Oberfläche bereit:

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

Siehe [CLI: Wiki](/de/cli/wiki) für die vollständige Befehlsreferenz.

## Obsidian-Unterstützung

Wenn `vault.renderMode` auf `obsidian` gesetzt ist, schreibt das Plugin Obsidian-freundliches
Markdown und kann optional die offizielle `obsidian`-CLI verwenden.

Unterstützte Workflows umfassen:

- Statusabfrage
- Vault-Suche
- Öffnen einer Seite
- Aufrufen eines Obsidian-Befehls
- Springen zur täglichen Notiz

Dies ist optional. Das Wiki funktioniert weiterhin im nativen Modus ohne Obsidian.

## Empfohlener Workflow

1. Behalten Sie Ihr aktives Memory-Plugin für Abruf/Promotion/Dreaming bei.
2. Aktivieren Sie `memory-wiki`.
3. Beginnen Sie mit dem Modus `isolated`, sofern Sie nicht ausdrücklich den Bridge-Modus wünschen.
4. Verwenden Sie `wiki_search` / `wiki_get`, wenn Provenienz wichtig ist.
5. Verwenden Sie `wiki_apply` für gezielte Synthesen oder Metadatenaktualisierungen.
6. Führen Sie nach wesentlichen Änderungen `wiki_lint` aus.
7. Aktivieren Sie Dashboards, wenn Sie Sichtbarkeit für veraltete Inhalte/Widersprüche wünschen.

## Verwandte Dokumentation

- [Memory-Überblick](/de/concepts/memory)
- [CLI: Memory](/de/cli/memory)
- [CLI: Wiki](/de/cli/wiki)
- [Plugin SDK-Überblick](/de/plugins/sdk-overview)
