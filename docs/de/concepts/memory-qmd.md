---
read_when:
    - Sie möchten QMD als Ihr Speicher-Backend einrichten
    - Sie möchten erweiterte Speicherfunktionen wie Reranking oder zusätzliche indizierte Pfade
summary: Lokale Search-Sidecar mit BM25, Vektoren, Reranking und Query Expansion
title: QMD-Speicher-Engine
x-i18n:
    generated_at: "2026-06-28T22:33:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) ist ein Local-first-Such-Sidecar, der
neben OpenClaw läuft. Es kombiniert BM25, Vektorsuche und Reranking in einer
einzelnen Binärdatei und kann Inhalte über Ihre Workspace-Speicherdateien hinaus
indexieren.

## Was es gegenüber der integrierten Lösung hinzufügt

- **Reranking und Abfrageerweiterung** für bessere Trefferquote.
- **Zusätzliche Verzeichnisse indexieren** -- Projektdokumentation, Teamnotizen, alles auf der Festplatte.
- **Sitzungstranskripte indexieren** -- frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** -- läuft mit dem offiziellen llama.cpp-Provider-Plugin und
  lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** -- wenn QMD nicht verfügbar ist, fällt OpenClaw nahtlos auf die
  integrierte Engine zurück.

## Erste Schritte

### Voraussetzungen

- Installieren Sie QMD: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- SQLite-Build, der Erweiterungen erlaubt (`brew install sqlite` unter macOS).
- QMD muss im `PATH` des Gateways liegen.
- macOS und Linux funktionieren ohne zusätzliche Einrichtung. Windows wird am besten über WSL2 unterstützt.

### Aktivieren

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw erstellt ein eigenständiges QMD-Home unter
`~/.openclaw/agents/<agentId>/qmd/` und verwaltet den Sidecar-Lebenszyklus
automatisch -- Collections, Updates und Embedding-Läufe werden für Sie
übernommen. Es bevorzugt aktuelle QMD-Collection- und MCP-Abfrageformen, fällt
bei Bedarf aber weiterhin auf alternative Collection-Pattern-Flags und ältere
MCP-Tool-Namen zurück. Die Abstimmung beim Start erstellt außerdem veraltete
verwaltete Collections wieder mit ihren kanonischen Patterns, wenn noch eine
ältere QMD-Collection mit demselben Namen vorhanden ist.

## Funktionsweise des Sidecars

- OpenClaw erstellt Collections aus Ihren Workspace-Speicherdateien und allen
  konfigurierten `memory.qmd.paths` und führt dann `qmd update` aus, wenn der QMD-Manager
  geöffnet wird, sowie danach regelmäßig (standardmäßig alle 5 Minuten). Diese Aktualisierungen
  laufen über QMD-Subprozesse, nicht über ein dateisystemweites Crawling im Prozess. Semantische
  Modi führen außerdem `qmd embed` aus.
- Die standardmäßige Workspace-Collection verfolgt `MEMORY.md` plus den Baum
  `memory/`. Kleingeschriebenes `memory.md` wird nicht als Root-Speicherdatei indexiert.
- Der eigene Scanner von QMD ignoriert versteckte Pfade und übliche Abhängigkeits- oder Build-
  Verzeichnisse wie `.git`, `.cache`, `node_modules`, `vendor`, `dist` und
  `build`. Der Gateway-Start initialisiert QMD standardmäßig nicht, sodass ein Kaltstart
  weder die Speicherlaufzeit importiert noch den langlebigen Watcher erstellt, bevor
  Speicher erstmals verwendet wird.
- Wenn Sie QMD trotzdem beim Gateway-Start initialisieren möchten, setzen Sie
  `memory.qmd.update.startup` auf `idle` oder `immediate`. Mit
  `memory.qmd.update.onBoot: true` führt der Start die anfängliche Aktualisierung aus. Mit
  `onBoot: false` überspringt der Start diese sofortige Aktualisierung, öffnet aber dennoch den
  langlebigen Manager, wenn Update- oder Embed-Intervalle konfiguriert sind, damit QMD
  seinen regulären Watcher und seine Timer besitzen kann.
- Suchen verwenden den konfigurierten `searchMode` (Standard: `search`; unterstützt auch
  `vsearch` und `query`). `search` ist nur BM25, daher überspringt OpenClaw in diesem Modus
  semantische Vektor-Bereitschaftsprüfungen und Embedding-Wartung. Wenn ein Modus
  fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn `searchMode` auf `query` steht, setzen Sie `memory.qmd.rerank` auf `false`, um QMDs
  hybriden Abfragepfad ohne Reranker zu verwenden. OpenClaw übergibt `--no-rerank` an den
  direkten QMD-CLI-Pfad und `rerank: false` an QMDs MCP-Abfragetool. Diese Option
  erfordert QMD 2.1 oder neuer.
- Bei QMD-Versionen, die Multi-Collection-Filter ausweisen, fasst OpenClaw
  Collections aus derselben Quelle in einem QMD-Suchaufruf zusammen. Ältere QMD-Versionen
  behalten den kompatiblen Fallback pro Collection.
- Wenn QMD vollständig fehlschlägt, fällt OpenClaw auf die integrierte SQLite-Engine zurück.
  Wiederholte Versuche in Chat-Turns legen nach einem Öffnungsfehler kurz eine Pause ein, damit
  eine fehlende Binärdatei oder beschädigte Sidecar-Abhängigkeit keinen Wiederholungssturm
  erzeugt; `openclaw memory status` und einmalige CLI-Prüfungen prüfen QMD weiterhin direkt erneut.

<Info>
Die erste Suche kann langsam sein -- QMD lädt beim ersten `qmd query`-Lauf automatisch
GGUF-Modelle (~2 GB) für Reranking und Abfrageerweiterung herunter.
</Info>

## Suchleistung und Kompatibilität

OpenClaw hält den QMD-Suchpfad mit aktuellen und älteren QMD-Installationen kompatibel.

Beim Start prüft OpenClaw den Hilfetext des installierten QMD einmal pro Manager. Wenn die
Binärdatei Unterstützung für mehrere Collection-Filter ausweist, durchsucht OpenClaw alle
Collections derselben Quelle mit einem Befehl:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Das vermeidet, für jede Durable-Memory-Collection einen eigenen QMD-Subprozess zu starten.
Sitzungstranskript-Collections bleiben in ihrer eigenen Quellgruppe, sodass gemischte
Suchen über `memory` + `sessions` dem Ergebnis-Diversifizierer weiterhin Eingaben aus beiden
Quellen liefern.

Ältere QMD-Builds akzeptieren nur einen Collection-Filter. Wenn OpenClaw einen dieser
Builds erkennt, behält es den Kompatibilitätspfad bei und durchsucht jede Collection
separat, bevor Ergebnisse zusammengeführt und dedupliziert werden.

Um den installierten Vertrag manuell zu prüfen, führen Sie aus:

```bash
qmd --help | grep -i collection
```

Die aktuelle QMD-Hilfe sagt, dass Collection-Filter eine oder mehrere Collections
adressieren können. Ältere Hilfe beschreibt üblicherweise eine einzelne Collection.

## Modellüberschreibungen

QMD-Modellumgebungsvariablen werden unverändert aus dem Gateway-Prozess
durchgereicht, sodass Sie QMD global abstimmen können, ohne neue OpenClaw-Konfiguration
hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Nachdem Sie das Embedding-Modell geändert haben, führen Sie die Embeddings erneut aus,
damit der Index zum neuen Vektorraum passt.

## Zusätzliche Pfade indexieren

Richten Sie QMD auf zusätzliche Verzeichnisse aus, um sie durchsuchbar zu machen:

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

Snippets aus zusätzlichen Pfaden erscheinen in Suchergebnissen als
`qmd/<collection>/<relative-path>`. `memory_get` versteht dieses Präfix und liest aus dem
richtigen Collection-Root.

## Sitzungstranskripte indexieren

Aktivieren Sie die Sitzungsindexierung, um frühere Unterhaltungen wiederzufinden. QMD benötigt
sowohl die allgemeine `memorySearch`-Sitzungsquelle als auch den QMD-Transkriptexporter:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkripte werden als bereinigte User/Assistant-Turns in eine dedizierte QMD-Collection
unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert. Nur
`memorySearch.experimental.sessionMemory` zu setzen, exportiert keine Transkripte nach QMD.

Sitzungstreffer werden weiterhin nach
[`tools.sessions.visibility`](/de/gateway/config-tools#toolssessions) gefiltert. Die standardmäßige
Sichtbarkeit `tree` legt keine unzusammenhängenden Sitzungen desselben Agenten offen. Wenn eine
vom Gateway disponierte Sitzung aus einer separaten DM-Sitzung wiederauffindbar sein soll,
setzen Sie `tools.sessions.visibility: "agent"` bewusst.

## Suchumfang

Standardmäßig werden QMD-Suchergebnisse in direkten Sitzungen und Kanalsitzungen angezeigt
(nicht in Gruppen). Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

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

Wenn der Scope eine Suche verweigert, protokolliert OpenClaw eine Warnung mit dem abgeleiteten
Kanal und Chattyp, damit leere Ergebnisse leichter zu debuggen sind.

## Zitationen

Wenn `memory.citations` auf `auto` oder `on` steht, enthalten Such-Snippets eine
Fußzeile `Source: <path#line>`. Setzen Sie `memory.citations = "off"`, um die Fußzeile
wegzulassen und den Pfad intern dennoch an den Agenten zu übergeben.

## Einsatzempfehlung

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für höherwertige Ergebnisse.
- Suche in Projektdokumentation oder Notizen außerhalb des Workspace.
- Wiederfinden früherer Sitzungsunterhaltungen.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Setups funktioniert die [integrierte Engine](/de/concepts/memory-builtin) gut
ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass die Binärdatei im `PATH` des Gateways liegt.
Wenn OpenClaw als Dienst läuft, erstellen Sie einen Symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Wenn `qmd --version` in Ihrer Shell funktioniert, OpenClaw aber weiterhin
`spawn qmd ENOENT` meldet, hat der Gateway-Prozess wahrscheinlich einen anderen `PATH` als Ihre
interaktive Shell. Legen Sie die Binärdatei explizit fest:

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

Verwenden Sie `command -v qmd` in der Umgebung, in der QMD installiert ist, und prüfen Sie dann
erneut mit `openclaw memory status --deep`.

**Erste Suche sehr langsam?** QMD lädt GGUF-Modelle bei der ersten Verwendung herunter. Wärmen
Sie mit `qmd query "test"` unter Verwendung derselben XDG-Verzeichnisse vor, die OpenClaw nutzt.

**Viele QMD-Subprozesse während der Suche?** Aktualisieren Sie QMD, wenn möglich. OpenClaw
verwendet nur dann einen Prozess für Multi-Collection-Suchen derselben Quelle, wenn das
installierte QMD Unterstützung für mehrere `-c`-Filter ausweist; andernfalls behält es aus
Korrektheitsgründen den älteren Fallback pro Collection bei.

**Nur-BM25-QMD versucht trotzdem, llama.cpp zu bauen?** Setzen Sie
`memory.qmd.searchMode = "search"`. OpenClaw behandelt diesen Modus als rein lexikalisch,
führt keine QMD-Vektorstatusprüfungen oder Embedding-Wartung aus und überlässt
semantische Bereitschaftsprüfungen `vsearch`- oder `query`-Setups.

**Suche läuft in ein Timeout?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standard: 4000 ms).
Setzen Sie den Wert für langsamere Hardware auf `120000`.

**Leere Ergebnisse in Gruppenchats?** Prüfen Sie `memory.qmd.scope` -- die Standardeinstellung
erlaubt nur direkte Sitzungen und Kanalsitzungen.

**Root-Speichersuche wurde plötzlich zu breit?** Starten Sie das Gateway neu oder warten Sie
auf die nächste Abstimmung beim Start. OpenClaw erstellt veraltete verwaltete Collections
wieder mit den kanonischen Patterns `MEMORY.md` und `memory/`, wenn es einen gleichnamigen
Konflikt erkennt.

**Workspace-sichtbare temporäre Repos verursachen `ENAMETOOLONG` oder defekte Indexierung?**
Die QMD-Traversierung folgt derzeit dem Verhalten des zugrunde liegenden QMD-Scanners statt
den integrierten Symlink-Regeln von OpenClaw. Legen Sie temporäre Monorepo-Checkouts in
versteckten Verzeichnissen wie `.tmp/` oder außerhalb indexierter QMD-Roots ab, bis QMD
zyklussichere Traversierung oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Aktualisierungsintervalle,
Scope-Regeln und alle weiteren Stellschrauben finden Sie in der
[Referenz zur Speicherkonfiguration](/de/reference/memory-config).

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Integrierte Speicher-Engine](/de/concepts/memory-builtin)
- [Honcho-Speicher](/de/concepts/memory-honcho)
