---
read_when:
    - Sie möchten dauerhaftes Wissen, das über einfache MEMORY.md-Notizen hinausgeht
    - Sie konfigurieren das mitgelieferte memory-wiki-Plugin
    - Sie benötigen separate Wiki-Vaults für Agenten in einem Gateway
    - Sie möchten wiki_search, wiki_get oder den Bridge-Modus verstehen
summary: 'memory-wiki: kompilierter Wissensspeicher mit Herkunftsnachweisen, Aussagen, Dashboards und Brückenmodus'
title: Gedächtnis-Wiki
x-i18n:
    generated_at: "2026-07-12T01:54:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` ist ein gebündeltes Plugin, das dauerhaftes Wissen in ein
navigierbares Wiki kompiliert: deterministische Seiten, strukturierte Aussagen mit Belegen,
Provenienz, Dashboards und maschinenlesbare Digests.

Es ersetzt nicht das Active-Memory-Plugin. Abruf, Überführung, Indizierung und
Dreaming verbleiben bei dem jeweils konfigurierten Speicher-Backend
(`memory-core`, QMD, Honcho usw.). `memory-wiki` wird ergänzend eingesetzt und kompiliert
Wissen in eine gepflegte Wiki-Ebene.

| Ebene                | Zuständig für                                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| Active-Memory-Plugin | Abruf, semantische Suche, Überführung, Dreaming, Speicher-Laufzeitumgebung                      |
| `memory-wiki`        | Kompilierte Wiki-Seiten, Synthesen mit umfassender Provenienz, Dashboards, Wiki-Suche/-Abruf/-Anwendung |

Praktische Regel:

- `memory_search` für einen umfassenden Abrufdurchlauf über alle konfigurierten Korpora
- `wiki_search` / `wiki_get`, wenn Sie Wiki-spezifische Rangfolge, Provenienz oder eine aussagenbasierte Struktur auf Seitenebene benötigen
- `memory_search corpus=all`, um beide Ebenen in einem Aufruf abzudecken, sofern das Active-Memory-Plugin die Korpusauswahl unterstützt

Eine verbreitete Local-First-Konfiguration: QMD als Active-Memory-Backend für den Abruf und
`memory-wiki` im Modus `bridge` für dauerhafte synthetisierte Seiten. Siehe das
Beispiel für QMD und den Bridge-Modus unter [Konfiguration](#configuration).

Wenn der Bridge-Modus null exportierte Artefakte meldet, stellt das Active-Memory-Plugin
derzeit keine öffentlichen Bridge-Eingaben bereit. Führen Sie zuerst `openclaw wiki doctor` aus
und vergewissern Sie sich anschließend, dass das Active-Memory-Plugin öffentliche Artefakte unterstützt.

## Vault-Modi

- `isolated` (Standard): eigener Vault, eigene Quellen, keine Abhängigkeit vom Active-Memory-Plugin. Verwenden Sie diesen Modus für einen eigenständigen kuratierten Wissensspeicher.
- `bridge`: Liest öffentliche Speicherartefakte und Ereignisprotokolle des Active-Memory-Plugins über öffentliche Schnittstellen des Plugin-SDK. Verwenden Sie diesen Modus, um die exportierten Artefakte des Speicher-Plugins zu kompilieren, ohne auf private Plugin-Interna zuzugreifen.
- `unsafe-local`: expliziter Ausweg für private lokale Pfade auf demselben Rechner. Absichtlich experimentell und nicht portabel; verwenden Sie diesen Modus nur, wenn Sie die Vertrauensgrenze verstehen und ausdrücklich lokalen Dateisystemzugriff benötigen, den der Bridge-Modus nicht bereitstellen kann.

Vault-Modus und Vault-Geltungsbereich sind voneinander unabhängige Optionen:

- `vaultMode` legt fest, woher die Wiki-Eingaben stammen.
- `vault.scope` legt fest, ob alle Agenten einen Vault verwenden oder jeder Agent einen untergeordneten Vault erhält.

`vault.scope: "global"` ist der Standard und erhält das bestehende Verhalten mit einem einzigen Vault.
Verwenden Sie `vault.scope: "agent"` mit dem Modus `isolated` oder `bridge`, wenn
Agenten Wiki-Seiten, kompilierte Digests, Suchergebnisse oder Schreibvorgänge nicht gemeinsam nutzen dürfen.
Der Agenten-Geltungsbereich kann nicht mit dem Modus `unsafe-local` kombiniert werden, da die konfigurierten
privaten Pfade keine agenteneigenen Eingaben sind. Die Konfigurationsvalidierung lehnt diese
Kombination ab.

Der Bridge-Modus kann abhängig vom jeweiligen Konfigurationsschalter unter `bridge.*` Folgendes indizieren:

- exportierte Speicherartefakte (`indexMemoryRoot`)
- tägliche Notizen (`indexDailyNotes`)
- Dreaming-Berichte (`indexDreamReports`)
- Speicherereignisprotokolle (`followMemoryEvents`)

Wenn der Bridge-Modus aktiv und `bridge.readMemoryArtifacts` aktiviert ist,
werden `openclaw wiki status`, `openclaw wiki doctor` und `openclaw wiki bridge
import` über den laufenden Gateway geleitet, sodass sie denselben Kontext des Active-Memory-Plugins
wie der Agenten-/Laufzeitspeicher verwenden. Wenn die Bridge deaktiviert ist oder Artefaktlesevorgänge
ausgeschaltet sind, behalten diese Befehle ihr lokales Offline-Verhalten bei.

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

Verwaltete Inhalte bleiben innerhalb generierter Blöcke; von Menschen erstellte Notizblöcke bleiben
bei der Neugenerierung erhalten.

- `sources/`: importiertes Rohmaterial und Seiten, die auf Bridge- bzw. `unsafe-local`-Quellen basieren
- `entities/`: dauerhafte Dinge, Personen, Systeme, Projekte und Objekte
- `concepts/`: Ideen, Abstraktionen, Muster und Richtlinien (auch der Zielort für OKF-Importe)
- `syntheses/`: kompilierte Zusammenfassungen und gepflegte Übersichten
- `reports/`: generierte Dashboards

## Importe im Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importieren Sie ein entpacktes Paket im Open Knowledge Format in Wiki-Konzeptseiten. Dies eignet sich
gut, wenn ein Datenkatalog, Dokumentations-Crawler oder Anreicherungsagent bereits
OKF erzeugt: Behalten Sie OKF als portables Austauschartefakt bei und lassen Sie `memory-wiki`
daraus OpenClaw-native Konzeptseiten und kompilierte Digests erstellen.

- Nicht reservierte `.md`-Dateien sind Konzeptdokumente
- Jedes importierte Konzept benötigt ein nicht leeres Frontmatter-Feld `type`; fehlt `type`, wird eine Warnung `missing-type` erzeugt und die Datei übersprungen
- Unbekannte `type`-Werte werden als generische Konzepte akzeptiert
- `index.md` und `log.md` sind reserviert und werden niemals als Konzepte importiert
- Defekte oder externe Markdown-Links bleiben unverändert

Importierte Seiten werden direkt unter `concepts/` abgelegt, sodass bestehende Abläufe zum Kompilieren,
Suchen, Abrufen und Erstellen von Dashboards sie ohne einen zweiten Wiki-Baum erfassen. Jede Seite behält die
ursprüngliche OKF-Konzept-ID, den Quellpfad, `type`, `resource`, `tags`, den Zeitstempel
und das vollständige Frontmatter des Erzeugers. Interne OKF-Links werden auf die generierten
Wiki-Konzeptseiten umgeschrieben und erzeugen außerdem strukturierte `relationships`-Einträge mit
`kind: okf-link`.

## Strukturierte Aussagen und Belege

Seiten enthalten strukturiertes `claims`-Frontmatter, nicht nur unstrukturierten Text. Jede
Aussage kann `id`, `text`, `status`, `confidence`, `evidence[]` und
`updatedAt` enthalten. Jeder Belegeintrag kann `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` und `updatedAt` enthalten.

Dadurch verhält sich das Wiki wie eine Überzeugungsebene und nicht wie eine passive Notizablage.
Aussagen können nachverfolgt, bewertet, angefochten und anhand ihrer Quellen geklärt werden.

## Agentenbezogene Entitätsmetadaten

Entitätsseiten enthalten generische Routing-Metadaten, die für Personen, Teams,
Systeme, Projekte oder beliebige andere Entitätstypen verwendet werden können:

- `entityType`: zum Beispiel `person`, `team`, `system`, `project`
- `canonicalId`: stabiler Identitätsschlüssel über Aliasse und Importe hinweg
- `aliases`: Namen, Handles oder Bezeichnungen, die auf dieselbe Seite verweisen
- `privacyTier`: frei formulierbare Zeichenfolge; `public` wird so behandelt, als sei keine Prüfung erforderlich, jeder andere Wert (zum Beispiel `local-private`, `sensitive`, `confirm-before-use`) wird in `reports/privacy-review.md` gekennzeichnet
- `bestUsedFor` / `notEnoughFor`: kompakte Routing-Hinweise
- `lastRefreshedAt`: Zeitstempel der Quellenaktualisierung, unabhängig vom Bearbeitungszeitpunkt der Seite
- `personCard`: optionale personenspezifische Routing-Karte (Handles, soziale Profile, E-Mail-Adressen, Zeitzone, Bereich, geeignete Anfragen, zu vermeidende Anfragen, Konfidenz, Datenschutzstufe)
- `relationships`: typisierte Kanten zu verwandten Seiten (Ziel, Art, Gewichtung, Konfidenz, Belegart, Datenschutzstufe, Anmerkung)

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
  - Beispielhafte Weiterleitung innerhalb des Ökosystems
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
    - Fragen zur beispielhaften Einführung
  avoidAskingFor:
    - nicht zugehörige Abrechnungsentscheidungen
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
    text: Alex ist für die Weiterleitung innerhalb des Beispiel-Ökosystems hilfreich.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Kompilierungs-Pipeline

Die Kompilierung liest Wiki-Seiten, normalisiert Zusammenfassungen und erzeugt stabile
maschinenorientierte Artefakte unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Agenten und Laufzeitcode lesen diese Digests, anstatt Markdown auszulesen.
Die kompilierte Ausgabe unterstützt außerdem die Wiki-Indizierung im ersten Durchlauf für Suche/Abruf, die
Rückverfolgung von Aussage-IDs zu den zugehörigen Seiten, kompakte Prompt-Ergänzungen und die
Berichtserstellung.

## Dashboards und Zustandsberichte

Wenn `render.createDashboards` aktiviert ist, pflegt die Kompilierung Dashboards unter
`reports/`:

| Bericht                              | Erfasst                                             |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | Seiten mit ungeklärten Fragen                    |
| `reports/contradictions.md`         | Gruppen von Widerspruchsanmerkungen                        |
| `reports/low-confidence.md`         | Seiten und Aussagen mit niedriger Konfidenz                    |
| `reports/claim-health.md`           | Aussagen ohne strukturierte Belege                 |
| `reports/stale-pages.md`            | veraltete Seiten oder Seiten mit unbekannter Aktualität                         |
| `reports/person-agent-directory.md` | Routing-Karten für Personen/Entitäten                        |
| `reports/relationship-graph.md`     | strukturierte Beziehungskanten                      |
| `reports/provenance-coverage.md`    | Abdeckung der Belegklassen                            |
| `reports/privacy-review.md`         | nicht öffentliche Datenschutzstufen, die vor der Verwendung geprüft werden müssen |

## Suche und Abruf

Zwei Such-Backends:

- `shared`: Verwendet den gemeinsamen Speicher-Suchablauf, sofern verfügbar
- `local`: Durchsucht das Wiki lokal

Drei Korpora: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` verwenden nach Möglichkeit kompilierte Digests als ersten Durchlauf
- Aussage-IDs werden auf die zugehörige Seite zurückgeführt
- angefochtene, veraltete und aktuelle Aussagen beeinflussen die Rangfolge
- Provenienzbezeichnungen bleiben in den Ergebnissen erhalten

Suchmodi (`--mode` / Werkzeugparameter `mode`):

| Modus              | Verstärkt                                                         |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | ausgewogene Standardeinstellung                                               |
| `find-person`     | personenähnliche Entitäten, Aliasse, Handles, soziale Profile, kanonische IDs |
| `route-question`  | Agentenkarten, Hinweise für geeignete Anfragen/Einsatzbereiche, Beziehungskontext |
| `source-evidence` | Quellseiten und strukturierte Belegmetadaten                  |
| `raw-claim`       | übereinstimmende strukturierte Aussagen; gibt Metadaten zu Aussagen/Belegen zurück    |

Wenn ein Ergebnis mit einer strukturierten Aussage übereinstimmt, gibt `wiki_search`
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` und `evidenceSourceIds` in seiner Detailnutzlast zurück. Die Textausgabe
enthält, sofern verfügbar, kompakte Zeilen `Claim:` und `Evidence:`.

## Agentenwerkzeuge

| Tool          | Zweck                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | aktueller Vault-Modus und -Umfang, aufgelöster Agent, Zustand, Verfügbarkeit der Obsidian-CLI                                                                                 |
| `wiki_search` | Wiki-Seiten und, sofern konfiguriert, den gemeinsamen Speicherkorpus durchsuchen; akzeptiert `mode` für Personensuche, Fragenweiterleitung, Quellenbelege oder Rohbehauptungsanalyse |
| `wiki_get`    | eine Wiki-Seite anhand von ID/Pfad lesen; greift auf den gemeinsamen Speicherkorpus zurück, wenn die gemeinsame Suche aktiviert ist und die Suche keinen Treffer ergibt         |
| `wiki_apply`  | gezielte Synthese-/Metadatenänderungen ohne freie Eingriffe in Seiten                                                                                                         |
| `wiki_lint`   | strukturelle Prüfungen, Herkunftslücken, Widersprüche, offene Fragen                                                                                                           |

Das Plugin registriert außerdem eine nicht exklusive Ergänzung des Speicherkorpus, sodass die gemeinsamen
Funktionen `memory_search` und `memory_get` auf das Wiki zugreifen können, wenn das aktive Speicher-Plugin
die Korpusauswahl unterstützt.

## Verhalten von Prompt und Kontext

Wenn `context.includeCompiledDigestPrompt` aktiviert ist, hängen Speicher-Promptabschnitte
eine kompakte kompilierte Momentaufnahme aus `agent-digest.json` an: nur die wichtigsten Seiten,
nur die wichtigsten Behauptungen, Anzahl der Widersprüche, Anzahl der Fragen sowie Angaben zu
Konfidenz und Aktualität. Dies muss explizit aktiviert werden, da es die Promptstruktur verändert; es ist hauptsächlich
für Kontext-Engines oder die Promptzusammenstellung relevant, die Speicherergänzungen ausdrücklich
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

| Schlüssel                                  | Werte / Standardwert                            | Hinweise                                                                                  |
| ------------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (Standard), `bridge`, `unsafe-local` | wählt das Eingabe- und Integrationsverhalten                                               |
| `vault.scope`                              | `global` (Standard), `agent`                    | ein gemeinsamer Vault oder ein untergeordneter Vault pro Agent                             |
| `vault.path`                               | globaler Standard `~/.openclaw/wiki/main`       | exakter globaler Vault; übergeordnetes Verzeichnis bei Agent-Umfang ist standardmäßig `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native` (Standard), `obsidian`                 |                                                                                           |
| `bridge.readMemoryArtifacts`               | Standard `true`                                 | öffentliche Artefakte des aktiven Speicher-Plugins importieren                            |
| `bridge.followMemoryEvents`                | Standard `true`                                 | Ereignisprotokolle im Bridge-Modus einschließen                                            |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | Standard `false`                                | erforderlich, um Importe im Modus `unsafe-local` auszuführen                              |
| `unsafeLocal.paths`                        | Standard `[]`                                   | explizite lokale Pfade für den Import im Modus `unsafe-local`                             |
| `search.backend`                           | `shared` (Standard), `local`                    |                                                                                           |
| `search.corpus`                            | `wiki` (Standard), `memory`, `all`              |                                                                                           |
| `context.includeCompiledDigestPrompt`      | Standard `false`                                | kompakte Digest-Momentaufnahme des ausgewählten Agent an Speicher-Promptabschnitte anhängen |
| `render.createBacklinks`                   | Standard `true`                                 | deterministische Blöcke mit verwandten Inhalten erzeugen                                  |
| `render.createDashboards`                  | Standard `true`                                 | Dashboard-Seiten erzeugen                                                                 |

### Vaults pro Agent

Setzen Sie `vault.scope` auf `agent`, um jedem konfigurierten Agent ein separates Wiki
zuzuweisen. In diesem Umfang ist `vault.path` ein übergeordnetes Verzeichnis, an das OpenClaw
die normalisierte Agent-ID anhängt:

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
`~/.openclaw/wiki/marketing` aufgelöst. Wenn `vault.path` im Agent-Umfang weggelassen wird, ist das
übergeordnete Verzeichnis standardmäßig `~/.openclaw/wiki`. Der standardmäßige Agent `main` behält daher
den vorhandenen Pfad `~/.openclaw/wiki/main`.

Agent-Tools, kompilierte Prompt-Digests und die über
`memory_search` / `memory_get` bereitgestellte Wiki-Ergänzung lösen den Vault anhand des aktiven Agent-Kontexts auf.
Geben Sie bei CLI- und Gateway-Aufrufen in einer Einrichtung mit mehreren konfigurierten Agents
den Agent explizit mit `openclaw wiki --agent <agentId> ...` oder über `agentId` in der Gateway-Anfrage
an. Ein einzelner konfigurierter Agent bleibt der Standard, wenn keine ID
angegeben wird.

Im Bridge-Modus akzeptieren Agent-bezogene Importe ein öffentliches Speicherartefakt nur, wenn
dessen `agentIds` den ausgewählten Agent enthält. Artefakte, die einem anderen Agent gehören,
keine Eigentümermetadaten besitzen oder einen unbekannten Eigentümer haben, werden übersprungen. Der globale Umfang
behält das bisherige Verhalten für gemeinsame Artefakte bei.

<Warning>
Durch die Änderung von `vault.scope` wird ein vorhandener Vault nicht kopiert oder aufgeteilt. Im Agent-Umfang
wird ein explizit konfigurierter `vault.path` zu einem übergeordneten Verzeichnis. Verschieben oder
importieren Sie daher vorhandene Seiten bewusst, bevor Sie produktive Agents umstellen. Sichern Sie
zuerst den Vault.

Vaults pro Agent bilden eine Wissensgrenze innerhalb desselben Prozesses, keine Sicherheitsgrenze
des Betriebssystems. Plugins und nicht sandboxierte Tools mit Zugriff auf das Host-Dateisystem können
weiterhin das Verzeichnis eines anderen Agent lesen. Verwenden Sie [Sandboxing](/de/gateway/sandboxing) oder
[separate Gateway-Profile](/de/gateway/multiple-gateways), wenn Agents einander nicht
vertrauen.
</Warning>

### Beispiel: QMD + Bridge-Modus

Verwenden Sie dies, wenn Sie QMD für den Abruf und `memory-wiki` für eine gepflegte
Wissensebene einsetzen möchten. Jede Ebene bleibt fokussiert: QMD hält Rohnotizen, Sitzungsexporte
und zusätzliche Sammlungen durchsuchbar, während `memory-wiki`
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
kompilierte Seiten und Dashboards, und die Promptstruktur bleibt unverändert, bis Sie
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
`wiki chatgpt import` / `wiki chatgpt rollback` und aller `wiki obsidian`-Unterbefehle
finden Sie unter [CLI: Wiki](/de/cli/wiki).

## Obsidian-Unterstützung

Wenn `vault.renderMode` auf `obsidian` gesetzt ist, schreibt das Plugin Obsidian-freundliches
Markdown und kann optional die offizielle `obsidian`-CLI verwenden, um den Status
abzufragen, den Vault zu durchsuchen, eine Seite zu öffnen, einen Befehl aufzurufen und zur
Tagesnotiz zu wechseln. Dies ist optional; das Wiki funktioniert auch im nativen Modus ohne
Obsidian.

Agent-bezogene Vaults können weiterhin Obsidian-freundliches Markdown verwenden, aber die Konfigurationsvalidierung
lehnt `obsidian.useOfficialCli: true` zusammen mit `vault.scope: "agent"` ab.
Die aktuelle Einstellung `obsidian.vaultName` ist global und kann nicht für jeden Agent einen eigenen
Obsidian-Vault auswählen. Verwenden Sie stattdessen die Wiki-Tools und CLI-Operationen
oder betreiben Sie ein von Obsidian verwaltetes Wiki im globalen Umfang.

## Empfohlener Arbeitsablauf

<Steps>
<Step title="Das aktive Speicher-Plugin für den Abruf beibehalten">
Abruf, Übernahme und Dreaming bleiben in der Zuständigkeit des konfigurierten Speicher-Backends.
</Step>
<Step title="memory-wiki aktivieren">
Beginnen Sie mit dem Modus `isolated`, sofern Sie nicht ausdrücklich den Bridge-Modus verwenden möchten.
</Step>
<Step title="wiki_search / wiki_get verwenden, wenn die Herkunft relevant ist">
Ziehen Sie diese Funktionen `memory_search` vor, wenn Sie eine Wiki-spezifische Rangfolge oder eine Glaubwürdigkeitsstruktur auf Seitenebene benötigen.
</Step>
<Step title="wiki_apply für gezielte Synthesen oder Metadatenaktualisierungen verwenden">
Vermeiden Sie die manuelle Bearbeitung verwalteter generierter Blöcke.
</Step>
<Step title="wiki_lint nach wesentlichen Änderungen ausführen">
Erkennt Widersprüche, offene Fragen und Herkunftslücken.
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
