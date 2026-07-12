---
read_when:
    - Sie möchten dauerhaftes Wissen, das über einfache MEMORY.md-Notizen hinausgeht
    - Sie konfigurieren das gebündelte memory-wiki-Plugin
    - Sie benötigen separate Wiki-Vaults für Agenten in einem Gateway
    - Sie möchten wiki_search, wiki_get oder den Bridge-Modus verstehen
summary: 'memory-wiki: kompilierter Wissensspeicher mit Herkunftsnachweisen, Aussagen, Dashboards und Brückenmodus'
title: Speicher-Wiki
x-i18n:
    generated_at: "2026-07-12T15:44:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` ist ein gebündeltes Plugin, das dauerhaftes Wissen zu einem
navigierbaren Wiki kompiliert: deterministische Seiten, strukturierte Aussagen mit Belegen,
Provenienz, Dashboards und maschinenlesbare Zusammenfassungen.

Es ersetzt nicht das Active-Memory-Plugin. Abruf, Übernahme, Indizierung und
Dreaming verbleiben bei dem jeweils konfigurierten Memory-Backend
(`memory-core`, QMD, Honcho usw.). `memory-wiki` wird ergänzend dazu eingesetzt und kompiliert
Wissen zu einer gepflegten Wiki-Schicht.

| Schicht              | Zuständig für                                                                     |
| -------------------- | --------------------------------------------------------------------------------- |
| Active-Memory-Plugin | Abruf, semantische Suche, Übernahme, Dreaming, Memory-Laufzeit                    |
| `memory-wiki`        | Kompilierte Wiki-Seiten, Synthesen mit umfangreicher Provenienz, Dashboards, Wiki-Suche/-Abruf/-Anwendung |

Praktische Regel:

- `memory_search` für einen umfassenden Abrufdurchlauf über alle konfigurierten Korpora
- `wiki_search` / `wiki_get`, wenn Sie Wiki-spezifische Rangfolge, Provenienz oder eine aussagenbasierte Struktur auf Seitenebene benötigen
- `memory_search corpus=all`, um beide Schichten in einem Aufruf abzudecken, sofern das Active-Memory-Plugin die Korpusauswahl unterstützt

Eine gängige Local-First-Konfiguration: QMD als Active-Memory-Backend für den Abruf und
`memory-wiki` im Modus `bridge` für dauerhafte synthetisierte Seiten. Siehe das
Beispiel für QMD + Bridge-Modus unter [Konfiguration](#configuration).

Wenn der Bridge-Modus keine exportierten Artefakte meldet, stellt das Active-Memory-Plugin
derzeit keine öffentlichen Bridge-Eingaben bereit. Führen Sie zuerst `openclaw wiki doctor` aus
und prüfen Sie anschließend, ob das Active-Memory-Plugin öffentliche Artefakte unterstützt.

## Vault-Modi

- `isolated` (Standard): eigener Vault, eigene Quellen, keine Abhängigkeit vom Active-Memory-Plugin. Verwenden Sie diesen Modus für einen eigenständigen, kuratierten Wissensspeicher.
- `bridge`: liest öffentliche Memory-Artefakte und Ereignisprotokolle über öffentliche Schnittstellen des Plugin-SDK aus dem Active-Memory-Plugin. Verwenden Sie diesen Modus, um die exportierten Artefakte des Memory-Plugins zu kompilieren, ohne auf private Plugin-Interna zuzugreifen.
- `unsafe-local`: expliziter Ausweg für private lokale Pfade auf demselben Rechner. Bewusst experimentell und nicht portabel; verwenden Sie ihn nur, wenn Sie die Vertrauensgrenze verstehen und ausdrücklich lokalen Dateisystemzugriff benötigen, den der Bridge-Modus nicht bereitstellen kann.

Vault-Modus und Vault-Geltungsbereich sind voneinander unabhängige Entscheidungen:

- `vaultMode` bestimmt, woher die Wiki-Eingaben stammen.
- `vault.scope` bestimmt, ob alle Agenten einen Vault verwenden oder jeder Agent einen untergeordneten Vault erhält.

`vault.scope: "global"` ist der Standard und bewahrt das bisherige Verhalten mit einem einzigen Vault.
Verwenden Sie `vault.scope: "agent"` zusammen mit dem Modus `isolated` oder `bridge`, wenn
Agenten keine Wiki-Seiten, kompilierten Zusammenfassungen, Suchergebnisse oder Schreibvorgänge gemeinsam nutzen dürfen.
Der Agentengeltungsbereich kann nicht mit dem Modus `unsafe-local` kombiniert werden, da diese konfigurierten
privaten Pfade keine agenteneigenen Eingaben sind. Die Konfigurationsvalidierung weist diese
Kombination zurück.

Der Bridge-Modus kann abhängig vom jeweiligen `bridge.*`-Konfigurationsschalter Folgendes indizieren:

- exportierte Memory-Artefakte (`indexMemoryRoot`)
- tägliche Notizen (`indexDailyNotes`)
- Dreaming-Berichte (`indexDreamReports`)
- Memory-Ereignisprotokolle (`followMemoryEvents`)

Wenn der Bridge-Modus aktiv und `bridge.readMemoryArtifacts` aktiviert ist,
werden `openclaw wiki status`, `openclaw wiki doctor` und `openclaw wiki bridge
import` über den laufenden Gateway geleitet, sodass sie denselben Kontext des aktiven
Memory-Plugins wie das Agenten-/Laufzeit-Memory sehen. Wenn Bridge deaktiviert ist oder das
Lesen von Artefakten ausgeschaltet ist, behalten diese Befehle ihr lokales/offlinefähiges Verhalten bei.

## Vault-Struktur

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

Verwaltete Inhalte verbleiben innerhalb generierter Blöcke; von Menschen erstellte Notizblöcke bleiben
bei der Regenerierung erhalten.

- `sources/`: importiertes Rohmaterial und durch Bridge/Unsafe-Local bereitgestellte Seiten
- `entities/`: dauerhafte Dinge, Personen, Systeme, Projekte, Objekte
- `concepts/`: Ideen, Abstraktionen, Muster, Richtlinien (auch das Ziel für OKF-Importe)
- `syntheses/`: kompilierte Zusammenfassungen und gepflegte Gesamtübersichten
- `reports/`: generierte Dashboards

## Importe im Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importiert ein entpacktes Open-Knowledge-Format-Paket in Wiki-Konzeptseiten. Gut
geeignet, wenn ein Datenkatalog, Dokumentations-Crawler oder Anreicherungsagent bereits
OKF erzeugt: Behalten Sie OKF als portables Austauschartefakt bei und lassen Sie `memory-wiki`
daraus OpenClaw-native Konzeptseiten und kompilierte Zusammenfassungen erstellen.

- nicht reservierte `.md`-Dateien sind Konzeptdokumente
- jedes importierte Konzept erfordert ein nicht leeres Frontmatter-Feld `type`; fehlt `type`, wird eine `missing-type`-Warnung erzeugt und die Datei übersprungen
- unbekannte `type`-Werte werden als generische Konzepte akzeptiert
- `index.md` und `log.md` sind reserviert und werden niemals als Konzepte importiert
- fehlerhafte oder externe Markdown-Links bleiben unverändert

Importierte Seiten werden direkt unter `concepts/` abgelegt, sodass vorhandene Abläufe zum Kompilieren, Suchen, Abrufen und
für Dashboards sie ohne einen zweiten Wiki-Baum erfassen. Jede Seite behält die
ursprüngliche OKF-Konzept-ID, den Quellpfad, `type`, `resource`, `tags`, den Zeitstempel
und das vollständige Frontmatter des Erzeugers. Interne OKF-Links werden auf die generierten
Wiki-Konzeptseiten umgeschrieben und erzeugen zusätzlich strukturierte `relationships`-Einträge mit
`kind: okf-link`.

## Strukturierte Aussagen und Belege

Seiten enthalten strukturiertes `claims`-Frontmatter, nicht nur Freitext. Jede
Aussage kann `id`, `text`, `status`, `confidence`, `evidence[]` und
`updatedAt` enthalten. Jeder Belegeintrag kann `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` und `updatedAt` enthalten.

Dadurch verhält sich das Wiki wie eine Überzeugungsschicht und nicht wie eine passive Notizablage.
Aussagen können verfolgt, bewertet, angefochten und anhand der Quellen geklärt werden.

## Agentenseitige Entitätsmetadaten

Entitätsseiten enthalten generische Routing-Metadaten, die für Personen, Teams,
Systeme, Projekte oder jeden anderen Entitätstyp nutzbar sind:

- `entityType`: zum Beispiel `person`, `team`, `system`, `project`
- `canonicalId`: stabiler Identitätsschlüssel über Aliasse und Importe hinweg
- `aliases`: Namen, Handles oder Bezeichnungen, die auf dieselbe Seite aufgelöst werden
- `privacyTier`: frei formulierbare Zeichenfolge; `public` gilt als nicht prüfpflichtig, jeder andere Wert (zum Beispiel `local-private`, `sensitive`, `confirm-before-use`) wird in `reports/privacy-review.md` gekennzeichnet
- `bestUsedFor` / `notEnoughFor`: kompakte Routing-Hinweise
- `lastRefreshedAt`: Zeitstempel der Quellenaktualisierung, getrennt vom Bearbeitungszeitpunkt der Seite
- `personCard`: optionale personenspezifische Routing-Karte (Handles, soziale Profile, E-Mail-Adressen, Zeitzone, Bereich, geeignete und ungeeignete Anfragen, Konfidenz, Datenschutzstufe)
- `relationships`: typisierte Kanten zu verwandten Seiten (Ziel, Art, Gewichtung, Konfidenz, Belegart, Datenschutzstufe, Notiz)

Beginnen Sie bei einem Personen-Wiki mit `reports/person-agent-directory.md` und öffnen Sie anschließend
die Personenseite mit `wiki_get`, bevor Sie Kontaktdaten oder abgeleitete
Fakten verwenden.

<Accordion title="Beispiel für eine Entitätsseite">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Beispiel-Routing im Ökosystem
notEnoughFor:
  - rechtliche Genehmigung
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Beispiel-Ökosystem
  askFor:
    - Fragen zum Beispiel-Rollout
  avoidAskingFor:
    - nicht damit zusammenhängende Abrechnungsentscheidungen
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Andere Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex ist für das Routing im Beispiel-Ökosystem hilfreich.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Kompilierungspipeline

Die Kompilierung liest Wiki-Seiten, normalisiert Zusammenfassungen und erzeugt stabile
maschinenorientierte Artefakte unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Agenten und Laufzeitcode lesen diese Zusammenfassungen, anstatt Markdown auszulesen.
Die kompilierte Ausgabe bildet außerdem die Grundlage für die erste Stufe der Wiki-Indizierung für Suche/Abruf, die
Rückauflösung von Aussage-IDs zu den zugehörigen Seiten, kompakte Prompt-Ergänzungen und die
Berichtserstellung.

## Dashboards und Zustandsberichte

Wenn `render.createDashboards` aktiviert ist, pflegt die Kompilierung Dashboards unter
`reports/`:

| Bericht                             | Erfasst                                                    |
| ----------------------------------- | ---------------------------------------------------------- |
| `reports/open-questions.md`         | Seiten mit ungeklärten Fragen                              |
| `reports/contradictions.md`         | Cluster von Widerspruchsnotizen                            |
| `reports/low-confidence.md`         | Seiten und Aussagen mit niedriger Konfidenz                |
| `reports/claim-health.md`           | Aussagen ohne strukturierte Belege                         |
| `reports/stale-pages.md`            | veraltete oder unbekannte Aktualität                       |
| `reports/person-agent-directory.md` | Routing-Karten für Personen/Entitäten                      |
| `reports/relationship-graph.md`     | strukturierte Beziehungskanten                             |
| `reports/provenance-coverage.md`    | Abdeckung nach Belegklasse                                 |
| `reports/privacy-review.md`         | nicht öffentliche Datenschutzstufen, die vor der Verwendung geprüft werden müssen |

## Suche und Abruf

Zwei Such-Backends:

- `shared`: verwendet den gemeinsamen Memory-Suchablauf, sofern verfügbar
- `local`: durchsucht das Wiki lokal

Drei Korpora: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` verwenden nach Möglichkeit kompilierte Zusammenfassungen als ersten Durchlauf
- Aussage-IDs werden auf die zugehörige Seite aufgelöst
- angefochtene/veraltete/aktuelle Aussagen beeinflussen die Rangfolge
- Provenienzbezeichnungen bleiben in den Ergebnissen erhalten

Suchmodi (`--mode` / Tool-Parameter `mode`):

| Modus             | Verstärkt                                                      |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | ausgewogener Standard                                          |
| `find-person`     | personenartige Entitäten, Aliasse, Handles, soziale Profile, kanonische IDs |
| `route-question`  | Agentenkarten, Hinweise zu geeigneten Anfragen/Einsatzgebieten, Beziehungskontext |
| `source-evidence` | Quellseiten und strukturierte Belegmetadaten                   |
| `raw-claim`       | übereinstimmende strukturierte Aussagen; gibt Aussage-/Belegmetadaten zurück |

Wenn ein Ergebnis mit einer strukturierten Aussage übereinstimmt, gibt `wiki_search`
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` und `evidenceSourceIds` in seiner Detailnutzlast zurück. Die Textausgabe
enthält, sofern verfügbar, kompakte Zeilen mit `Claim:` und `Evidence:`.

## Agenten-Tools

| Tool          | Zweck                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | aktueller Vault-Modus und Geltungsbereich, aufgelöster Agent, Zustand, Verfügbarkeit der Obsidian-CLI                                                                             |
| `wiki_search` | durchsucht Wiki-Seiten und, sofern konfiguriert, den gemeinsamen Speicherkorpus; akzeptiert `mode` für Personensuche, Fragen-Routing, Quellenbelege oder detaillierte Rohbehauptungen |
| `wiki_get`    | liest eine Wiki-Seite anhand von ID/Pfad und greift auf den gemeinsamen Speicherkorpus zurück, wenn die gemeinsame Suche aktiviert ist und die Suche keinen Treffer liefert         |
| `wiki_apply`  | eng begrenzte Änderungen an Synthesen/Metadaten ohne freie Bearbeitung der Seite                                                                                                  |
| `wiki_lint`   | strukturelle Prüfungen, Provenienzlücken, Widersprüche, offene Fragen                                                                                                              |

Das Plugin registriert außerdem eine nicht exklusive Ergänzung zum Speicherkorpus, sodass die gemeinsamen
Funktionen `memory_search` und `memory_get` auf das Wiki zugreifen können, wenn das aktive Speicher-
Plugin die Korpusauswahl unterstützt.

## Verhalten von Prompt und Kontext

Wenn `context.includeCompiledDigestPrompt` aktiviert ist, hängen Speicher-Prompt-Abschnitte
einen kompakten kompilierten Schnappschuss aus `agent-digest.json` an: nur die wichtigsten Seiten,
nur die wichtigsten Behauptungen, Anzahl der Widersprüche, Anzahl der Fragen sowie Qualifikatoren für
Konfidenz/Aktualität. Dies ist optional, da es die Prompt-Struktur verändert; relevant ist es hauptsächlich
für Kontext-Engines oder die Prompt-Zusammenstellung, die Speicherergänzungen ausdrücklich
verarbeiten.

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
            scope: "global",
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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

| Schlüssel                                    | Werte / Standardwert                             | Hinweise                                                                                      |
| -------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `vaultMode`                                  | `isolated` (Standard), `bridge`, `unsafe-local`   | bestimmt das Eingabe- und Integrationsverhalten                                                |
| `vault.scope`                                | `global` (Standard), `agent`                      | ein gemeinsamer Vault oder ein untergeordneter Vault pro Agent                                 |
| `vault.path`                                 | globaler Standard `~/.openclaw/wiki/main`         | exakter globaler Vault; übergeordnetes Verzeichnis im Agent-Geltungsbereich ist standardmäßig `~/.openclaw/wiki` |
| `vault.renderMode`                           | `native` (Standard), `obsidian`                   |                                                                                               |
| `bridge.readMemoryArtifacts`                 | Standard `true`                                   | öffentliche Artefakte des aktiven Speicher-Plugins importieren                                |
| `bridge.followMemoryEvents`                  | Standard `true`                                   | Ereignisprotokolle im Bridge-Modus einbeziehen                                                 |
| `unsafeLocal.allowPrivateMemoryCoreAccess`   | Standard `false`                                  | erforderlich, um `unsafe-local`-Importe auszuführen                                            |
| `unsafeLocal.paths`                          | Standard `[]`                                     | explizite lokale Pfade für den Import im Modus `unsafe-local`                                  |
| `search.backend`                             | `shared` (Standard), `local`                      |                                                                                               |
| `search.corpus`                              | `wiki` (Standard), `memory`, `all`                |                                                                                               |
| `context.includeCompiledDigestPrompt`        | Standard `false`                                  | kompakten Digest-Schnappschuss des ausgewählten Agents an Speicher-Prompt-Abschnitte anhängen  |
| `render.createBacklinks`                     | Standard `true`                                   | deterministische Blöcke mit verwandten Inhalten erzeugen                                      |
| `render.createDashboards`                    | Standard `true`                                   | Dashboard-Seiten erzeugen                                                                     |

### Vaults pro Agent

Setzen Sie `vault.scope` auf `agent`, um jedem konfigurierten Agent ein separates Wiki
zuzuweisen. In diesem Geltungsbereich ist `vault.path` ein übergeordnetes Verzeichnis, und OpenClaw hängt die
normalisierte Agent-ID an:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

Dies wird zu `~/.openclaw/wiki/support` und
`~/.openclaw/wiki/marketing` aufgelöst. Wenn `vault.path` im Agent-Geltungsbereich nicht angegeben ist, verwendet das
übergeordnete Verzeichnis standardmäßig `~/.openclaw/wiki`. Der Standard-Agent `main` behält daher
den bestehenden Pfad `~/.openclaw/wiki/main`.

Agent-Tools, kompilierte Prompt-Digests und die über
`memory_search` / `memory_get` bereitgestellte Wiki-Ergänzung lösen den Vault aus dem aktiven Agent-Kontext auf.
Geben Sie bei CLI- und Gateway-Aufrufen in einer Konfiguration mit mehreren konfigurierten Agents
den Agent explizit mit `openclaw wiki --agent <agentId> ...` oder über
`agentId` in der Gateway-Anfrage an. Ein einzelner konfigurierter Agent bleibt der Standard, wenn keine ID
angegeben wird.

Im Bridge-Modus akzeptieren agentenspezifische Importe ein öffentliches Speicherartefakt nur, wenn
dessen `agentIds` den ausgewählten Agent enthält. Artefakte, die einem anderen Agent gehören,
keine Eigentümermetadaten enthalten oder einen unbekannten Eigentümer haben, werden übersprungen. Der globale Geltungsbereich
behält das bestehende Verhalten für gemeinsame Artefakte bei.

<Warning>
Das Ändern von `vault.scope` kopiert oder teilt keinen bestehenden Vault. Im Agent-Geltungsbereich
wird ein explizit konfigurierter `vault.path` zu einem übergeordneten Verzeichnis. Verschieben oder
importieren Sie daher bestehende Seiten bewusst, bevor Sie produktive Agents umstellen. Sichern Sie
zuerst den Vault.

Vaults pro Agent stellen eine Wissensgrenze innerhalb desselben Prozesses dar, keine Sicherheitsgrenze
des Betriebssystems. Plugins und nicht sandboxierte Tools mit Zugriff auf das Host-Dateisystem können
weiterhin das Verzeichnis eines anderen Agents lesen. Verwenden Sie [Sandboxing](/de/gateway/sandboxing) oder
[separate Gateway-Profile](/de/gateway/multiple-gateways), wenn die Agents einander nicht vertrauen.
</Warning>

### Beispiel: QMD + Bridge-Modus

Verwenden Sie dies, wenn Sie QMD für den Abruf und `memory-wiki` für eine gepflegte
Wissensebene einsetzen möchten. Jede Ebene bleibt fokussiert: QMD hält Rohnotizen, Sitzungs-
exporte und zusätzliche Sammlungen durchsuchbar, während `memory-wiki`
stabile Entitäten, Behauptungen, Dashboards und Quellseiten kompiliert.

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

Dadurch bleibt QMD für den Abruf aus dem aktiven Speicher zuständig, `memory-wiki` konzentriert sich auf
kompilierte Seiten und Dashboards, und die Prompt-Struktur bleibt unverändert, bis Sie
kompilierte Digest-Prompts bewusst aktivieren.

## CLI

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

Die vollständige Befehlsreferenz einschließlich
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` sowie des vollständigen Satzes der `wiki obsidian`-
Unterbefehle finden Sie unter [CLI: Wiki](/de/cli/wiki).

## Obsidian-Unterstützung

Wenn `vault.renderMode` auf `obsidian` gesetzt ist, schreibt das Plugin Obsidian-kompatibles
Markdown und kann optional die offizielle `obsidian`-CLI verwenden, um den Status
abzufragen, den Vault zu durchsuchen, eine Seite zu öffnen, einen Befehl aufzurufen und zur
Tagesnotiz zu springen. Dies ist optional; das Wiki funktioniert im nativen Modus auch ohne
Obsidian.

Agentenspezifische Vaults können weiterhin Obsidian-kompatibles Markdown verwenden, aber die Konfigurations-
validierung lehnt `obsidian.useOfficialCli: true` zusammen mit `vault.scope: "agent"` ab.
Die aktuelle Einstellung `obsidian.vaultName` ist global und kann nicht für jeden Agent einen eigenen
Obsidian-Vault auswählen. Verwenden Sie stattdessen die Wiki-Tools und CLI-Operationen
oder betreiben Sie ein durch Obsidian verwaltetes Wiki im globalen Geltungsbereich.

## Empfohlener Arbeitsablauf

<Steps>
<Step title="Das aktive Speicher-Plugin für den Abruf beibehalten">
Abruf, Übernahme und Dreaming bleiben in der Zuständigkeit des konfigurierten Speicher-Backends.
</Step>
<Step title="memory-wiki aktivieren">
Beginnen Sie mit dem Modus `isolated`, sofern Sie nicht ausdrücklich den Bridge-Modus verwenden möchten.
</Step>
<Step title="wiki_search / wiki_get verwenden, wenn Provenienz wichtig ist">
Ziehen Sie diese gegenüber `memory_search` vor, wenn Sie Wiki-spezifische Rangfolgen oder eine Überzeugungsstruktur auf Seitenebene benötigen.
</Step>
<Step title="wiki_apply für eng begrenzte Synthesen oder Metadatenaktualisierungen verwenden">
Vermeiden Sie die manuelle Bearbeitung verwalteter generierter Blöcke.
</Step>
<Step title="wiki_lint nach wesentlichen Änderungen ausführen">
Erkennt Widersprüche, offene Fragen und Provenienzlücken.
</Step>
<Step title="Dashboards für die Sichtbarkeit veralteter Inhalte und von Widersprüchen aktivieren">
Setzen Sie `render.createDashboards: true` (Standard).
</Step>
</Steps>

## Verwandte Dokumentation

- [Speicherübersicht](/de/concepts/memory)
- [CLI: Speicher](/de/cli/memory)
- [CLI: Wiki](/de/cli/wiki)
- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview)
