---
read_when:
    - Sie möchten QMD als Ihr Speicher-Backend einrichten
    - Sie möchten erweiterte Speicherfunktionen wie Reranking oder zusätzliche indizierte Pfade.
summary: Local-First-Such-Sidecar mit BM25, Vektoren, Reranking und Abfrageerweiterung
title: QMD-Speicher-Engine
x-i18n:
    generated_at: "2026-07-24T04:22:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c0e54dc9a18d834036e4c79d6b7bdecb268a29976d9f30ea6e82a56ca5d71fda
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) ist ein Local-First-Such-Sidecar, der parallel zu
OpenClaw ausgeführt wird. Er kombiniert BM25, Vektorsuche und Reranking in einer
einzigen Binärdatei und kann Inhalte über die Speicherdateien Ihres Arbeitsbereichs hinaus indizieren.

## Vorteile gegenüber der integrierten Lösung

- **Reranking und Abfrageerweiterung** für eine bessere Trefferquote.
- **Zusätzliche Verzeichnisse indizieren** – Projektdokumentation, Teamnotizen und beliebige Inhalte auf dem Datenträger.
- **Sitzungstranskripte indizieren** – frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** – wird mit dem offiziellen llama.cpp-Provider-Plugin ausgeführt und
  lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** – wenn QMD nicht verfügbar ist, wechselt OpenClaw nahtlos zur
  integrierten Engine.

## Erste Schritte

### Voraussetzungen

- QMD installieren: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- SQLite-Build, der Erweiterungen zulässt (`brew install sqlite` unter macOS).
- QMD muss sich im `PATH` des Gateways befinden.
- macOS und Linux funktionieren ohne weitere Einrichtung. Windows wird am besten über WSL2 unterstützt.

### Aktivieren

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw erstellt eine eigenständige QMD-Home-Umgebung unter
`~/.openclaw/agents/<agentId>/qmd/` und verwaltet den Lebenszyklus des Sidecars
automatisch – Sammlungen, Aktualisierungen und Einbettungsläufe werden für Sie verwaltet.
Dabei werden aktuelle QMD-Sammlungs- und MCP-Abfrageformate bevorzugt, bei Bedarf erfolgt jedoch ein Fallback auf
alternative Flags für Sammlungsmuster und ältere MCP-Werkzeugnamen.
Die Abstimmung beim Start erstellt außerdem veraltete verwaltete Sammlungen erneut mit ihren
kanonischen Mustern, wenn noch eine ältere QMD-Sammlung mit demselben Namen
vorhanden ist.

## Funktionsweise des Sidecars

- OpenClaw erstellt Sammlungen aus den Speicherdateien des Arbeitsbereichs und den konfigurierten
  `memory.qmd.paths`. Der QMD-Adapter ist für Aktualisierungs-, Einbettungs-, Entprellungs- und
  Zeitüberschreitungsheuristiken zuständig; diese können nicht durch Benutzer konfiguriert werden.
- QMD verwaltet weiterhin seine `index.sqlite`, die YAML-Sammlungskonfiguration und die Modelldownloads
  in der agentenspezifischen QMD-Home-Umgebung; hierbei handelt es sich um Artefakte eines externen Werkzeugs,
  nicht um OpenClaw-Statustabellen. Die OpenClaw-eigene Koordination erfolgt ausschließlich in SQLite:
  Eine gemeinsam genutzte Lease begrenzt die Einbettungsarbeit agentenübergreifend, während jeweils eine Lease in der
  Datenbank eines Agenten dessen Schreibvorgänge für Sammlungen, Aktualisierungen und Einbettungen serialisiert.
  Die Laufzeit erstellt keine QMD-Dateisperren-Sidecars mehr. `openclaw doctor --fix`
  entfernt außer Betrieb genommene Sidecars erst, nachdem nachgewiesen wurde, dass deren früherer Prozesseigentümer nicht mehr aktiv ist.
  Upgrades erfolgen als sauberer Übergang: Stoppen Sie alle OpenClaw-Prozesse, die dasselbe
  Statusverzeichnis verwenden, und starten Sie sie neu, bevor Sie die neue Version verwenden. Gemischte alte und neue QMD-
  Writer werden nicht unterstützt; die Laufzeit sperrt die außer Betrieb genommenen
  Sidecars absichtlich nicht parallel.
- Die standardmäßige Arbeitsbereichssammlung verfolgt `MEMORY.md` sowie den `memory/`-
  Verzeichnisbaum. `memory.md` in Kleinschreibung wird nicht als Stamm-Speicherdatei indiziert.
- Der QMD-eigene Scanner ignoriert versteckte Pfade und gängige Abhängigkeits-/Build-
  Verzeichnisse wie `.git`, `.cache`, `node_modules`, `vendor`, `dist` und
  `build`. Beim Start des Gateways bleibt QMD verzögert geladen; der Manager wird initialisiert, wenn der Speicher
  erstmals verwendet wird.
- Suchen verwenden den konfigurierten `searchMode` (Standard: `search`; unterstützt außerdem
  `vsearch` und `query`). `search` verwendet ausschließlich BM25, daher überspringt OpenClaw in diesem Modus
  Bereitschaftsprüfungen für semantische Vektoren und die Einbettungswartung. Wenn ein Modus
  fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn `searchMode` auf `query` gesetzt ist, setzen Sie `memory.qmd.rerank` auf `false`, um
  den hybriden Abfragepfad von QMD ohne Reranker zu verwenden (erfordert QMD 2.1 oder neuer).
  OpenClaw übergibt `--no-rerank` an den direkten QMD-CLI-Pfad und
  `rerank: false` an das MCP-Abfragewerkzeug von QMD.
- Bei QMD-Versionen, die Filter für mehrere Sammlungen ausweisen, fasst OpenClaw
  Sammlungen mit derselben Quelle in einem QMD-Suchaufruf zusammen. Ältere QMD-Versionen
  behalten den kompatiblen Fallback pro Sammlung bei.
- Wenn QMD vollständig ausfällt, wechselt OpenClaw zur integrierten SQLite-Engine.
  Wiederholte Versuche in Chat-Durchläufen werden nach einem Öffnungsfehler kurz verzögert, damit eine
  fehlende Binärdatei oder eine defekte Sidecar-Abhängigkeit keinen Wiederholungssturm verursacht;
  `openclaw memory status` und einmalige CLI-Prüfungen überprüfen QMD weiterhin
  direkt.

<Info>
Die erste Suche kann langsam sein – QMD lädt beim ersten `qmd query`-Lauf automatisch
GGUF-Modelle (~2 GB) für Reranking und Abfrageerweiterung herunter.
</Info>

## Suchleistung und Kompatibilität

OpenClaw hält den QMD-Suchpfad sowohl mit aktuellen als auch mit älteren QMD-
Installationen kompatibel.

Beim Start überprüft OpenClaw den Hilfetext des installierten QMD einmal pro Manager. Wenn
die Binärdatei Unterstützung für mehrere Sammlungsfilter ausweist, durchsucht OpenClaw
alle Sammlungen derselben Quelle mit einem einzigen Befehl:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dadurch muss nicht für jede dauerhafte Speichersammlung ein eigener QMD-Unterprozess gestartet werden.
Sammlungen von Sitzungstranskripten verbleiben in ihrer eigenen Quellengruppe, sodass gemischte
Suchen über `memory` und `sessions` dem Ergebnis-Diversifizierer weiterhin Eingaben aus
beiden Quellen liefern.

Ältere QMD-Builds akzeptieren nur einen Sammlungsfilter. Wenn OpenClaw einen
solchen Build erkennt, behält es den Kompatibilitätspfad bei und durchsucht jede Sammlung
separat, bevor die Ergebnisse zusammengeführt und dedupliziert werden.

Führen Sie Folgendes aus, um den installierten Vertrag manuell zu überprüfen:

```bash
qmd --help | grep -i collection
```

Die aktuelle QMD-Hilfe erwähnt die Auswahl einer oder mehrerer Sammlungen. Ältere Hilfetexte
beschreiben üblicherweise eine einzelne Sammlung.

## Modellüberschreibungen

QMD-Modellumgebungsvariablen werden unverändert vom Gateway-
Prozess weitergegeben, sodass Sie QMD global abstimmen können, ohne eine neue OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Führen Sie nach dem Ändern des Einbettungsmodells die Einbettungen erneut aus, damit der Index dem
neuen Vektorraum entspricht.

## Zusätzliche Pfade indizieren

Richten Sie QMD auf zusätzliche Verzeichnisse, damit diese durchsucht werden können:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Ausschnitte aus zusätzlichen Pfaden erscheinen in den Suchergebnissen als
`qmd/<collection>/<relative-path>`. `memory_get` erkennt dieses Präfix und liest aus dem
korrekten Sammlungsstamm.

## Sitzungstranskripte indizieren

Aktivieren Sie die Sitzungsindizierung, um frühere Unterhaltungen wiederzufinden. QMD benötigt sowohl die
allgemeine Sitzungsquelle `memory.search` als auch den QMD-Transkriptexporter:

```json5
{
  memory: {
    backend: "qmd",
    search: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"],
    },
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkripte werden als bereinigte Benutzer-/Assistentenbeiträge in eine dedizierte QMD-
Sammlung unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert. Wenn nur
`sources: ["sessions"]` festgelegt wird, werden keine Transkripte in QMD exportiert; aktivieren Sie zusätzlich
`rememberAcrossConversations` oder den expliziten QMD-Sitzungsexport.

Sitzungstreffer werden weiterhin nach
[`tools.sessions.visibility`](/de/gateway/config-tools#toolssessions) gefiltert. Die
standardmäßige Sichtbarkeit `tree` umfasst die aktuelle Sitzung, die daraus gestarteten Sitzungen
und Gruppensitzungen desselben Agenten, die über die kontextbezogene Gruppenerkennung beobachtet werden. Mit
`session.dmScope: "main"` teilen sich Benutzer in einer Mehrbenutzer-DM-Konfiguration die Hauptsitzung
und können Inhalte aus deren beobachteten Gruppen wiederfinden. Verwenden Sie für die DM-Isolierung einen peerbezogenen
`dmScope` oder setzen Sie die Sichtbarkeit auf `"self"`, um kontextbezogene
Lesezugriffe auf beobachtete Sitzungen zu deaktivieren. Andere, nicht zusammenhängende Sitzungen desselben Agenten erfordern weiterhin
die Sichtbarkeit `"agent"`.

## Suchbereich

Standardmäßig werden QMD-Suchergebnisse nur in direkten Sitzungen angezeigt, nicht
in Gruppen- oder Kanalchats. Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Der obige Ausschnitt entspricht der tatsächlichen Standardregel. Wenn der Bereich eine Suche verweigert,
protokolliert OpenClaw eine Warnung mit dem abgeleiteten Kanal und Chattyp, damit sich leere
Ergebnisse leichter diagnostizieren lassen.

## Quellenangaben

Wenn `memory.citations` auf `auto` oder `on` gesetzt ist, wird an Suchausschnitte eine
`Source: <path>#L<line>`- (oder `#L<start>-L<end>`-) Fußzeile angehängt. Im Modus `auto`
wird die Fußzeile nur für direkte Chatsitzungen hinzugefügt. Setzen Sie
`memory.citations = "off"`, um die Fußzeile wegzulassen und den Pfad dennoch intern an den
Agenten zu übergeben.

## Einsatzmöglichkeiten

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für hochwertigere Ergebnisse.
- Durchsuchen von Projektdokumentation oder Notizen außerhalb des Arbeitsbereichs.
- Wiederfinden früherer Sitzungsunterhaltungen.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Konfigurationen eignet sich die [integrierte Engine](/de/concepts/memory-builtin)
ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass sich die Binärdatei im `PATH` des Gateways befindet. Wenn OpenClaw
als Dienst ausgeführt wird, erstellen Sie einen symbolischen Link:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Wenn `qmd --version` in Ihrer Shell funktioniert, OpenClaw jedoch weiterhin
`spawn qmd ENOENT` meldet, verwendet der Gateway-Prozess wahrscheinlich einen anderen `PATH` als
Ihre interaktive Shell. Legen Sie die Binärdatei ausdrücklich fest:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Verwenden Sie `command -v qmd` in der Umgebung, in der QMD installiert ist, und prüfen Sie anschließend erneut
mit `openclaw memory status --deep`.

**Erste Suche sehr langsam?** QMD lädt bei der ersten Verwendung GGUF-Modelle herunter. Wärmen Sie
mit `qmd query "test"` und denselben XDG-Verzeichnissen vor, die OpenClaw verwendet.

**Viele QMD-Unterprozesse während der Suche?** Aktualisieren Sie QMD, wenn möglich. OpenClaw
verwendet für Suchvorgänge über mehrere Sammlungen derselben Quelle nur dann einen einzigen Prozess, wenn das
installierte QMD Unterstützung für mehrere `-c`-Filter ausweist; andernfalls
behält es aus Korrektheitsgründen den älteren Fallback pro Sammlung bei.

**Versucht QMD im reinen BM25-Modus weiterhin, llama.cpp zu bauen?** Setzen Sie
`memory.qmd.searchMode = "search"`. OpenClaw behandelt diesen Modus als
rein lexikalisch, überspringt QMD-Vektorstatusprüfungen und die Einbettungswartung und
überlässt semantische Bereitschaftsprüfungen den Konfigurationen `vsearch` oder `query`.

**Zeitüberschreitung bei der Suche?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standard: 4000ms).
Legen Sie für langsamere Hardware einen höheren Wert fest, beispielsweise `120000`. Dieses Limit gilt für
QMD-eigene Suchbefehle während der `memory_search`-Aufrufe des Agenten; Einrichtung, Synchronisierung,
integrierter Fallback und ergänzende Korpusverarbeitung behalten ihre eigenen kürzeren Fristen bei.

**Leere Ergebnisse in Gruppen- oder Kanalchats?** Dies ist beim
standardmäßigen `memory.qmd.scope` zu erwarten, der nur direkte Sitzungen zulässt. Fügen Sie eine
`allow`-Regel für die Chattypen `group` oder `channel` hinzu, wenn dort QMD-Ergebnisse
angezeigt werden sollen.

**Ist die Stammspeichersuche plötzlich zu weit gefasst?** Starten Sie das Gateway neu oder warten Sie
auf die nächste Abstimmung beim Start. OpenClaw erstellt veraltete verwaltete
Sammlungen erneut mit den kanonischen Mustern `MEMORY.md` und `memory/`, wenn ein
Namenskonflikt erkannt wird.

**Verursachen im Arbeitsbereich sichtbare temporäre Repositorys `ENAMETOOLONG` oder eine fehlerhafte Indizierung?**
Die QMD-Durchquerung folgt dem zugrunde liegenden QMD-Scanner und nicht den
integrierten OpenClaw-Regeln für symbolische Links. Bewahren Sie temporäre Monorepo-Checkouts in versteckten
Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Stämme auf, bis QMD eine
zyklussichere Durchquerung oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Aktualisierungsintervalle,
Bereichsregeln und alle weiteren Einstellungen finden Sie in der
[Referenz zur Speicherkonfiguration](/de/reference/memory-config).

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Integrierte Speicher-Engine](/de/concepts/memory-builtin)
- [Honcho-Speicher](/de/concepts/memory-honcho)
