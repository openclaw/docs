---
read_when:
    - Sie wünschen dauerhaftes Wissen, das über einfache MEMORY.md-Notizen hinausgeht
    - Sie konfigurieren das gebündelte memory-wiki-Plugin
    - Sie benötigen separate Wiki-Vaults für Agenten in einem Gateway
    - Sie möchten wiki_search, wiki_get oder den Bridge-Modus verstehen
summary: 'memory-wiki: kompilierter Wissensspeicher mit Herkunftsnachweisen, Aussagen, Dashboards und Bridge-Modus'
title: Speicher-Wiki
x-i18n:
    generated_at: "2026-07-24T04:32:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fda3c801ae39b529a3f1fcaf8791b6dcb1d8116ba2e73e99cca62dca6c64140a
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` ist ein gebündeltes Plugin, das dauerhaftes Wissen in ein
navigierbares Wiki überführt: deterministische Seiten, strukturierte Aussagen mit Belegen,
Herkunftsnachweise, Dashboards und maschinenlesbare Zusammenfassungen.

Es ersetzt nicht das Active-Memory-Plugin. Abruf, Übernahme, Indizierung und
Dreaming bleiben Eigentum des jeweils konfigurierten Memory-Backends
(`memory-core`, QMD, Honcho usw.). `memory-wiki` ergänzt es und überführt
Wissen in eine gepflegte Wiki-Ebene.

Aktivieren Sie das Plugin, bevor Sie seine CLI, Tools oder Runtime-Integration verwenden:

```bash
openclaw plugins enable memory-wiki
openclaw gateway restart
```

| Ebene                | Zuständig für                                                                      |
| -------------------- | --------------------------------------------------------------------------------- |
| Active-Memory-Plugin | Abruf, semantische Suche, Übernahme, Dreaming, Memory-Runtime                      |
| `memory-wiki`        | Kompilierte Wiki-Seiten, Synthesen mit umfassenden Herkunftsnachweisen, Dashboards, Wiki-Suche/Abruf/Anwendung |

Praktische Regel:

- `memory_search` für einen umfassenden Abrufdurchlauf über alle konfigurierten Korpora
- `wiki_search` / `wiki_get`, wenn Sie Wiki-spezifische Rangfolgen, Herkunftsnachweise oder eine aussagenbasierte Seitenstruktur benötigen
- `memory_search corpus=all`, um beide Ebenen in einem Aufruf abzudecken, sofern das Active-Memory-Plugin die Korpusauswahl unterstützt

Eine gängige Local-First-Konfiguration: QMD als Active-Memory-Backend für den Abruf und
`memory-wiki` im Modus `bridge` für dauerhafte synthetisierte Seiten. Siehe das
Beispiel für QMD und den Bridge-Modus unter [Konfiguration](#configuration).

Wenn der Bridge-Modus null exportierte Artefakte meldet, stellt das Active-Memory-Plugin
derzeit keine öffentlichen Bridge-Eingaben bereit. Führen Sie zuerst `openclaw wiki doctor` aus
und vergewissern Sie sich anschließend, dass das Active-Memory-Plugin öffentliche Artefakte unterstützt.

## Vault-Modi

- `isolated` (Standard): eigener Vault, eigene Quellen, keine Abhängigkeit vom Active-Memory-Plugin. Verwenden Sie dies für einen eigenständigen, kuratierten Wissensspeicher.
- `bridge`: liest öffentliche Memory-Artefakte und Ereignisprotokolle über öffentliche Plugin-SDK-Schnittstellen aus dem Active-Memory-Plugin. Verwenden Sie dies, um die exportierten Artefakte des Memory-Plugins zu kompilieren, ohne auf private Plugin-Interna zuzugreifen.
- `unsafe-local`: expliziter Ausweg für lokale private Pfade auf demselben Rechner. Absichtlich experimentell und nicht portierbar; verwenden Sie ihn nur, wenn Sie die Vertrauensgrenze verstehen und ausdrücklich lokalen Dateisystemzugriff benötigen, den der Bridge-Modus nicht bereitstellen kann.

Vault-Modus und Vault-Gültigkeitsbereich sind voneinander unabhängige Entscheidungen:

- `vaultMode` bestimmt, woher Wiki-Eingaben stammen.
- `vault.scope` bestimmt, ob alle Agenten einen Vault verwenden oder jeder Agent einen untergeordneten Vault erhält.

`vault.scope: "global"` ist der Standard und bewahrt das bestehende Verhalten mit einem einzelnen Vault.
Verwenden Sie `vault.scope: "agent"` mit dem Modus `isolated` oder `bridge`, wenn
Agenten keine Wiki-Seiten, kompilierten Zusammenfassungen, Suchergebnisse oder Schreibvorgänge
gemeinsam verwenden dürfen. Der Agentengültigkeitsbereich kann nicht mit dem Modus
`unsafe-local` kombiniert werden, weil diese konfigurierten privaten Pfade keine agenteneigenen
Eingaben sind. Die Konfigurationsvalidierung lehnt diese Kombination ab.

Der Bridge-Modus kann abhängig vom Konfigurationsschalter `bridge.*` Folgendes indizieren:

- exportierte Memory-Artefakte (`indexMemoryRoot`)
- tägliche Notizen (`indexDailyNotes`)
- Dreaming-Berichte (`indexDreamReports`)
- Memory-Ereignisprotokolle (`followMemoryEvents`)

Wenn der Bridge-Modus aktiv und `bridge.readMemoryArtifacts` aktiviert ist,
werden `openclaw wiki status`, `openclaw wiki doctor` und `openclaw wiki bridge
import` über den laufenden Gateway geleitet, sodass sie denselben Kontext des
Active-Memory-Plugins wie der Agenten-/Runtime-Speicher sehen. Wenn die Bridge deaktiviert
oder das Lesen von Artefakten ausgeschaltet ist, behalten diese Befehle ihr lokales/offline
Verhalten bei.

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

Verwaltete Inhalte verbleiben innerhalb generierter Blöcke; Blöcke mit menschlichen Notizen
bleiben bei der Neugenerierung erhalten.

- `sources/`: importiertes Rohmaterial und durch Bridge-/Unsafe-Local-Quellen gestützte Seiten
- `entities/`: dauerhafte Dinge, Personen, Systeme, Projekte, Objekte
- `concepts/`: Ideen, Abstraktionen, Muster, Richtlinien (zugleich das Ziel für OKF-Importe)
- `syntheses/`: kompilierte Zusammenfassungen und gepflegte Gesamtübersichten
- `reports/`: generierte Dashboards

## Importe im Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importieren Sie ein entpacktes Open-Knowledge-Format-Bundle in Wiki-Konzeptseiten. Dies eignet
sich gut, wenn ein Datenkatalog, Dokumentations-Crawler oder Anreicherungsagent bereits
OKF erzeugt: Behalten Sie OKF als portables Austauschartefakt bei und lassen Sie `memory-wiki`
daraus OpenClaw-native Konzeptseiten und kompilierte Zusammenfassungen erstellen.

- nicht reservierte `.md`-Dateien sind Konzeptdokumente
- jedes importierte Konzept erfordert ein nicht leeres Frontmatter-Feld `type`; fehlt `type`, wird eine Warnung vom Typ `missing-type` ausgegeben und die Datei übersprungen
- unbekannte `type`-Werte werden als generische Konzepte akzeptiert
- `index.md` und `log.md` sind reserviert und werden nie als Konzepte importiert
- fehlerhafte oder externe Markdown-Links bleiben unverändert

Importierte Seiten werden unter `concepts/` zusammengeführt, damit bestehende Abläufe
für Kompilierung, Suche, Abruf und Dashboards sie ohne einen zweiten Wiki-Baum erfassen.
Jede Seite behält die ursprüngliche OKF-Konzept-ID, den Quellpfad, `type`,
`resource`, `tags`, den Zeitstempel und das vollständige Frontmatter des Erzeugers.
Interne OKF-Links werden auf die generierten Wiki-Konzeptseiten umgeschrieben und erzeugen
außerdem strukturierte `relationships`-Einträge mit `kind: okf-link`.

## Strukturierte Aussagen und Belege

Seiten enthalten strukturiertes `claims`-Frontmatter und nicht nur Freitext. Jede
Aussage kann `id`, `text`, `status`, `confidence`,
`evidence[]` und `updatedAt` enthalten. Jeder Belegeintrag kann
`kind`, `sourceId`, `path`, `lines`,
`weight`, `confidence`, `privacyTier`, `note` und
`updatedAt` enthalten.

Dadurch verhält sich das Wiki wie eine Überzeugungsebene und nicht wie eine passive
Notizablage. Aussagen können nachverfolgt, bewertet, angefochten und bis zu ihren Quellen
zurückverfolgt werden.

## Agentenseitige Entitätsmetadaten

Entitätsseiten enthalten generische Routing-Metadaten, die für Personen, Teams,
Systeme, Projekte oder jeden anderen Entitätstyp verwendet werden können:

- `entityType`: zum Beispiel `person`, `team`, `system`, `project`
- `canonicalId`: stabiler Identitätsschlüssel über Aliasse und Importe hinweg
- `aliases`: Namen, Handles oder Bezeichnungen, die auf dieselbe Seite verweisen
- `privacyTier`: frei formulierbare Zeichenfolge; `public` gilt als nicht prüfungsbedürftig, jeder andere Wert (zum Beispiel `local-private`, `sensitive`, `confirm-before-use`) wird in `reports/privacy-review.md` markiert
- `bestUsedFor` / `notEnoughFor`: kompakte Routing-Hinweise
- `lastRefreshedAt`: Zeitstempel der Quellenaktualisierung, getrennt vom Bearbeitungszeitpunkt der Seite
- `personCard`: optionale personenspezifische Routing-Karte (Handles, soziale Profile, E-Mail-Adressen, Zeitzone, Zuständigkeitsbereich, geeignete Anfragen, ungeeignete Anfragen, Konfidenz, Datenschutzstufe)
- `relationships`: typisierte Kanten zu verwandten Seiten (Ziel, Art, Gewichtung, Konfidenz, Belegart, Datenschutzstufe, Notiz)

Beginnen Sie für ein Personen-Wiki mit `reports/person-agent-directory.md` und öffnen Sie anschließend
die Personenseite mit `wiki_get`, bevor Sie Kontaktdaten oder abgeleitete
Fakten verwenden.

<Accordion title="Beispiel einer Entitätsseite">
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
  - Routing im Beispiel-Ökosystem
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

Die Kompilierung liest Wiki-Seiten, normalisiert Zusammenfassungen und speichert einen
maschinenorientierten Snapshot im gemeinsamen SQLite-Plugin-Status von OpenClaw.
Runtime-Code verwendet den vom Lebenszyklus verwalteten Owner-Snapshot, um SQLite während
der asynchronen Prompt-Vorbereitung zu laden; die synchrone Prompt-Zusammenstellung liest
niemals Markdown aus oder greift auf Cache-Dateien zu. Die kompilierte Ausgabe dient
außerdem der ersten Wiki-Indizierung für Suche/Abruf, der Rückauflösung von Aussage-IDs
zu ihren jeweiligen Seiten, kompakten Prompt-Ergänzungen und der Berichterstellung.

Quelländerungen und Vault-Wiederherstellungen werden erst nach der nächsten Kompilierung
maschinenwirksam. Beim Neustart oder Aktualisieren des Plugin-Lebenszyklus wird die kausal
verkettete Kompilierungsveröffentlichung des Vaults mit SQLite verglichen und ein Snapshot
aus einem neueren, zurückgesetzten Zustand abgelehnt. Ein Compiler, der vor dem Rollback
gestartet wurde, kann nicht auf Grundlage des wiederhergestellten Vorgängerzustands
veröffentlichen. Die Prompt-Vorbereitung fragt den Vault nicht regelmäßig ab und installiert
keine Dateiwächter.
Nach der Rollback-Quarantäne löscht eine Kompilierung im laufenden Prozess den Owner
sofort; ein separater Compiler-Prozess erfordert eine Aktualisierung des Plugin-Lebenszyklus,
damit der Daemon die neue dauerhafte Veröffentlichung bestätigen kann.
Kompilierte Caches können neu aufgebaut werden: Cache-Zeilen aus der Zeit vor den
Veröffentlichungsepochen gelten als Fehltreffer und werden durch die nächste Kompilierung
ersetzt; sie werden nicht migriert.

## Dashboards und Zustandsberichte

Wenn `render.createDashboards` aktiviert ist, pflegt die Kompilierung Dashboards unter
`reports/`:

| Bericht                             | Erfasst                                            |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | Seiten mit ungelösten Fragen                       |
| `reports/contradictions.md`         | Cluster aus Widerspruchsnotizen                    |
| `reports/low-confidence.md`         | Seiten und Aussagen mit niedriger Konfidenz        |
| `reports/claim-health.md`           | Aussagen ohne strukturierte Belege                 |
| `reports/stale-pages.md`            | veraltete oder unbekannte Aktualität               |
| `reports/person-agent-directory.md` | Routing-Karten für Personen/Entitäten              |
| `reports/relationship-graph.md`     | strukturierte Beziehungskanten                     |
| `reports/provenance-coverage.md`    | Abdeckung der Belegklassen                         |
| `reports/privacy-review.md`         | nicht öffentliche Datenschutzstufen, die vor der Verwendung geprüft werden müssen |

## Suche und Abruf

Zwei Such-Backends:

- `shared`: verwendet den gemeinsamen Memory-Suchablauf, sofern verfügbar
- `local`: durchsucht das Wiki lokal

Drei Korpora: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` verwenden nach Möglichkeit kompilierte Zusammenfassungen als ersten Durchlauf
- Aussage-IDs werden zur jeweiligen Seite zurückaufgelöst
- angefochtene/veraltete/aktuelle Aussagen beeinflussen die Rangfolge
- Herkunftsbezeichnungen bleiben in den Ergebnissen erhalten

Suchmodi (Parameter `--mode` / Tool `mode`):

| Modus             | Verstärkung                                                   |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | ausgewogene Standardeinstellung                                |
| `find-person`     | personenähnliche Entitäten, Aliasse, Handles, soziale Profile, kanonische IDs |
| `route-question`  | Agentenkarten, Hinweise zu Fragen/optimalen Einsatzgebieten, Beziehungskontext |
| `source-evidence` | Quellseiten und strukturierte Metadaten zu Nachweisen           |
| `raw-claim`       | Abgleich strukturierter Aussagen; gibt Metadaten zu Aussagen/Nachweisen zurück |

Wenn ein Ergebnis mit einer strukturierten Aussage übereinstimmt, gibt `wiki_search`
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` und `evidenceSourceIds` in seiner Detailnutzlast zurück. Die Textausgabe
enthält kompakte `Claim:`- und `Evidence:`-Zeilen, sofern verfügbar.

## Agentenwerkzeuge

| Werkzeug      | Zweck                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | aktueller Vault-Modus und -Geltungsbereich, aufgelöster Agent, Status, Verfügbarkeit der Obsidian-CLI                                                          |
| `wiki_search` | durchsucht Wiki-Seiten und, sofern konfiguriert, den gemeinsamen Speicherkorpus; akzeptiert `mode` für Personensuche, Fragen-Routing, Quellennachweise oder detaillierte Rohdaten zu Aussagen |
| `wiki_get`    | liest eine Wiki-Seite anhand ihrer ID/ihres Pfads und greift auf den gemeinsamen Speicherkorpus zurück, wenn die gemeinsame Suche aktiviert ist und die Suche keinen Treffer ergibt |
| `wiki_apply`  | eng begrenzte Synthese-/Metadatenänderungen ohne frei formulierte Eingriffe in Seiten                                                                          |
| `wiki_lint`   | Strukturprüfungen, Lücken in der Herkunftsdokumentation, Widersprüche, offene Fragen                                                                            |

Das Plugin registriert außerdem eine nicht exklusive Ergänzung des Speicherkorpus, sodass gemeinsame
`memory_search` und `memory_get` auf das Wiki zugreifen können, wenn das aktive Speicher-
Plugin die Korpusauswahl unterstützt.

## Verhalten von Prompt und Kontext

Wenn `context.includeCompiledDigestPrompt` aktiviert ist, hängen Speicher-Promptabschnitte
einen kompakten kompilierten Schnappschuss aus dem Plugin-Zustand an: nur die wichtigsten Seiten,
nur die wichtigsten Aussagen, Anzahl der Widersprüche, Anzahl der Fragen sowie Angaben zu Konfidenz/Aktualität.
Dies ist optional, da es die Promptstruktur verändert; relevant ist es hauptsächlich
für Kontext-Engines oder die Promptzusammenstellung, die Speicherergänzungen
explizit verarbeiten.

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

Wichtige Umschalter:

| Schlüssel                                  | Werte / Standard                               | Hinweise                                                                      |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (Standard), `bridge`, `unsafe-local` | wählt das Eingabe- und Integrationsverhalten                                  |
| `vault.scope`                              | `global` (Standard), `agent`                    | ein gemeinsamer Vault oder ein untergeordneter Vault pro Agent                |
| `vault.path`                               | globaler Standard `~/.openclaw/wiki/main`      | exakter globaler Vault; übergeordnetes Verzeichnis im Agent-Geltungsbereich ist standardmäßig `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native` (Standard), `obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | Standard `true`                              | öffentliche Artefakte des aktiven Speicher-Plugins importieren                |
| `bridge.followMemoryEvents`                | Standard `true`                              | Ereignisprotokolle im Bridge-Modus einbeziehen                                |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | Standard `false`                             | erforderlich, um `unsafe-local`-Importe auszuführen                           |
| `unsafeLocal.paths`                        | Standard `[]`                                | explizite lokale Pfade für den Import im Modus `unsafe-local`                 |
| `search.backend`                           | `shared` (Standard), `local`                    |                                                                               |
| `search.corpus`                            | `wiki` (Standard), `memory`, `all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | Standard `false`                             | kompakten Digest-Schnappschuss des ausgewählten Agenten an Speicher-Promptabschnitte anhängen |
| `render.createBacklinks`                   | Standard `true`                              | deterministische Blöcke mit verwandten Inhalten erzeugen                      |
| `render.createDashboards`                  | Standard `true`                              | Dashboard-Seiten erzeugen                                                     |

### Vaults pro Agent

Setzen Sie `vault.scope` auf `agent`, um jedem konfigurierten Agenten ein separates Wiki zuzuweisen.
In diesem Geltungsbereich ist `vault.path` ein übergeordnetes Verzeichnis, an das OpenClaw die
normalisierte Agenten-ID anhängt:

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
`~/.openclaw/wiki/marketing` aufgelöst. Wenn `vault.path` im Agent-Geltungsbereich fehlt, ist das
übergeordnete Verzeichnis standardmäßig `~/.openclaw/wiki`. Der standardmäßige Agent `main` behält daher
den vorhandenen Pfad `~/.openclaw/wiki/main` bei.

Agentenwerkzeuge, kompilierte Prompt-Digests und die über
`memory_search` / `memory_get` bereitgestellte Wiki-Ergänzung lösen den Vault anhand des aktiven Agentenkontexts auf.
Geben Sie bei CLI- und Gateway-Aufrufen in einer Einrichtung mit mehreren konfigurierten Agenten
den Agenten explizit mit `openclaw wiki --agent <agentId> ...` oder über `agentId` der Gateway-
Anfrage an. Ein einzelner konfigurierter Agent bleibt die Standardeinstellung, wenn keine ID
angegeben wird.

Im Bridge-Modus akzeptieren Importe im Agent-Geltungsbereich ein öffentliches Speicherartefakt nur, wenn
dessen `agentIds` den ausgewählten Agenten enthält. Artefakte, die einem anderen Agenten gehören,
keine Eigentümermetadaten enthalten oder einen unbekannten Eigentümer haben, werden übersprungen. Der globale Geltungsbereich
behält das bestehende Verhalten für gemeinsame Artefakte bei.

<Warning>
Durch Ändern von `vault.scope` wird ein vorhandener Vault weder kopiert noch aufgeteilt. Im Agent-Geltungsbereich
wird ein explizit konfigurierter `vault.path` zu einem übergeordneten Verzeichnis; verschieben oder
importieren Sie daher vorhandene Seiten gezielt, bevor Sie produktive Agenten umstellen. Sichern Sie
zuerst den Vault.

Vaults pro Agent bilden eine Wissensgrenze innerhalb desselben Prozesses, jedoch keine Sicherheitsgrenze
des Betriebssystems. Plugins und nicht sandboxierte Werkzeuge mit Zugriff auf das Host-Dateisystem können
weiterhin das Verzeichnis eines anderen Agenten lesen. Verwenden Sie [Sandboxing](/de/gateway/sandboxing) oder
[separate Gateway-Profile](/de/gateway/multiple-gateways), wenn Agenten einander nicht vertrauen.
</Warning>

### Beispiel: QMD + Bridge-Modus

Verwenden Sie dies, wenn Sie QMD für den Abruf und `memory-wiki` für eine gepflegte
Wissensebene einsetzen möchten. Jede Ebene behält ihren Schwerpunkt: QMD hält Rohnotizen, Sitzungs-
exporte und zusätzliche Sammlungen durchsuchbar, während `memory-wiki`
stabile Entitäten, Aussagen, Dashboards und Quellseiten kompiliert.

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

Dadurch bleibt QMD für den Abruf des aktiven Speichers zuständig, `memory-wiki` konzentriert sich auf
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
`wiki chatgpt import` / `wiki chatgpt rollback` und des vollständigen Satzes von `wiki obsidian`-
Unterbefehlen finden Sie unter [CLI: Wiki](/de/cli/wiki).

## Obsidian-Unterstützung

Wenn `vault.renderMode` auf `obsidian` gesetzt ist, schreibt das Plugin Obsidian-kompatibles
Markdown und kann optional die offizielle `obsidian`-CLI verwenden, um den Status
abzufragen, den Vault zu durchsuchen, eine Seite zu öffnen, einen Befehl aufzurufen und zur
Tagesnotiz zu wechseln. Dies ist optional; das Wiki funktioniert im nativen Modus auch ohne
Obsidian.

Vaults im Agent-Geltungsbereich können weiterhin Obsidian-kompatibles Markdown verwenden, aber die Konfigurations-
validierung lehnt `obsidian.useOfficialCli: true` zusammen mit `vault.scope: "agent"` ab.
Die aktuelle Einstellung `obsidian.vaultName` ist global und kann nicht für jeden Agenten einen eigenen
Obsidian-Vault auswählen. Verwenden Sie stattdessen die Wiki-Werkzeuge und CLI-Operationen
oder betreiben Sie ein von Obsidian verwaltetes Wiki im globalen Geltungsbereich.

## Empfohlener Arbeitsablauf

<Steps>
<Step title="Das Active-Memory-Plugin für den Abruf beibehalten">
Abruf, Übernahme und Dreaming bleiben in der Zuständigkeit des konfigurierten Memory-Backends.
</Step>
<Step title="memory-wiki aktivieren">
Beginnen Sie mit dem Modus `isolated`, sofern Sie nicht ausdrücklich den Bridge-Modus verwenden möchten.
</Step>
<Step title="wiki_search / wiki_get verwenden, wenn die Provenienz wichtig ist">
Ziehen Sie diese gegenüber `memory_search` vor, wenn Sie Wiki-spezifisches Ranking oder eine Überzeugungsstruktur auf Seitenebene benötigen.
</Step>
<Step title="wiki_apply für eng begrenzte Synthesen oder Metadatenaktualisierungen verwenden">
Vermeiden Sie die manuelle Bearbeitung verwalteter generierter Blöcke.
</Step>
<Step title="wiki_lint nach wesentlichen Änderungen ausführen">
Erkennt Widersprüche, offene Fragen und Provenienzlücken.
</Step>
<Step title="Dashboards für die Sichtbarkeit veralteter Inhalte und von Widersprüchen aktivieren">
Legen Sie `render.createDashboards: true` fest (Standard).
</Step>
</Steps>

## Zugehörige Dokumentation

- [Memory-Übersicht](/de/concepts/memory)
- [CLI: Memory](/de/cli/memory)
- [CLI: Wiki](/de/cli/wiki)
- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview)
