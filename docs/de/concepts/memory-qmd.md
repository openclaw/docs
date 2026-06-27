---
read_when:
    - Sie möchten QMD als Ihr Memory-Backend einrichten
    - Sie möchten erweiterte Speicherfunktionen wie Reranking oder zusätzliche indexierte Pfade
summary: Local-first-Such-Sidecar mit BM25, Vektoren, Reranking und Abfrageerweiterung
title: QMD-Speicher-Engine
x-i18n:
    generated_at: "2026-06-27T17:23:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) ist ein local-first Such-Sidecar, das
parallel zu OpenClaw läuft. Es kombiniert BM25, Vektorsuche und Reranking in
einem einzelnen Binary und kann Inhalte über Ihre Workspace-Speicherdateien
hinaus indexieren.

## Was es gegenüber builtin hinzufügt

- **Reranking und Abfrageerweiterung** für bessere Recall.
- **Zusätzliche Verzeichnisse indexieren** -- Projektdokumentation, Teamnotizen, alles auf der Festplatte.
- **Sitzungstranskripte indexieren** -- frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** -- läuft mit dem offiziellen llama.cpp-Provider-Plugin und
  lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** -- wenn QMD nicht verfügbar ist, fällt OpenClaw nahtlos auf die
  builtin Engine zurück.

## Erste Schritte

### Voraussetzungen

- Installieren Sie QMD: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- SQLite-Build, der Erweiterungen erlaubt (`brew install sqlite` unter macOS).
- QMD muss im `PATH` des Gateways liegen.
- macOS und Linux funktionieren sofort. Windows wird am besten über WSL2 unterstützt.

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
MCP-Toolnamen zurück. Die Abstimmung beim Start erstellt außerdem veraltete
verwaltete Collections wieder mit ihren kanonischen Patterns, wenn eine ältere
QMD-Collection mit demselben Namen noch vorhanden ist.

## Wie das Sidecar funktioniert

- OpenClaw erstellt Collections aus Ihren Workspace-Speicherdateien und allen
  konfigurierten `memory.qmd.paths` und führt dann `qmd update` aus, wenn der
  QMD-Manager geöffnet wird, sowie anschließend regelmäßig (standardmäßig alle
  5 Minuten). Diese Aktualisierungen laufen über QMD-Unterprozesse, nicht über
  ein dateisystemweites Crawling im Prozess. Semantische Modi führen außerdem
  `qmd embed` aus.
- Die Standard-Workspace-Collection verfolgt `MEMORY.md` plus den Baum
  `memory/`. Kleingeschriebenes `memory.md` wird nicht als Root-Speicherdatei
  indexiert.
- QMDs eigener Scanner ignoriert versteckte Pfade und gängige Abhängigkeits-/
  Build-Verzeichnisse wie `.git`, `.cache`, `node_modules`, `vendor`, `dist`
  und `build`. Der Gateway-Start initialisiert QMD standardmäßig nicht, sodass
  der Kaltstart vermeidet, die Speicher-Runtime zu importieren oder den
  langlebigen Watcher zu erstellen, bevor Speicher erstmals verwendet wird.
- Wenn QMD dennoch beim Gateway-Start initialisiert werden soll, setzen Sie
  `memory.qmd.update.startup` auf `idle` oder `immediate`. Mit
  `memory.qmd.update.onBoot: true` führt der Start die erste Aktualisierung aus.
  Mit `onBoot: false` überspringt der Start diese sofortige Aktualisierung,
  öffnet aber weiterhin den langlebigen Manager, wenn Update- oder
  Embed-Intervalle konfiguriert sind, damit QMD seinen regulären Watcher und
  seine Timer besitzen kann.
- Suchen verwenden den konfigurierten `searchMode` (Standard: `search`;
  unterstützt auch `vsearch` und `query`). `search` ist nur BM25, daher
  überspringt OpenClaw in diesem Modus semantische Vektor-Bereitschaftsprüfungen
  und Embedding-Wartung. Wenn ein Modus fehlschlägt, versucht OpenClaw es mit
  `qmd query` erneut.
- Wenn `searchMode` `query` ist, setzen Sie `memory.qmd.rerank` auf `false`, um
  QMDs hybriden Abfragepfad ohne Reranker zu verwenden. OpenClaw übergibt
  `--no-rerank` an den direkten QMD-CLI-Pfad und `rerank: false` an QMDs
  MCP-Abfragetool. Diese Option erfordert QMD 2.1 oder neuer.
- Bei QMD-Releases, die Multi-Collection-Filter angeben, gruppiert OpenClaw
  Collections derselben Quelle in einen QMD-Suchaufruf. Ältere QMD-Releases
  behalten den kompatiblen Fallback pro Collection bei.
- Wenn QMD vollständig ausfällt, fällt OpenClaw auf die builtin SQLite Engine
  zurück. Wiederholte Chat-Turn-Versuche pausieren nach einem Öffnungsfehler
  kurz, damit ein fehlendes Binary oder eine defekte Sidecar-Abhängigkeit keinen
  Wiederholungssturm erzeugt; `openclaw memory status` und einmalige
  CLI-Probes prüfen QMD weiterhin direkt erneut.

<Info>
Die erste Suche kann langsam sein -- QMD lädt GGUF-Modelle (~2 GB) für
Reranking und Abfrageerweiterung beim ersten `qmd query`-Lauf automatisch
herunter.
</Info>

## Suchleistung und Kompatibilität

OpenClaw hält den QMD-Suchpfad sowohl mit aktuellen als auch mit älteren
QMD-Installationen kompatibel.

Beim Start prüft OpenClaw den installierten QMD-Hilfetext einmal pro Manager.
Wenn das Binary Unterstützung für mehrere Collection-Filter angibt, durchsucht
OpenClaw alle Collections derselben Quelle mit einem Befehl:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dadurch wird vermieden, für jede Durable-Memory-Collection einen QMD-Unterprozess
zu starten. Sitzungstranskript-Collections bleiben in ihrer eigenen Quellgruppe,
sodass gemischte `memory`- und `sessions`-Suchen dem Ergebnis-Diversifier
weiterhin Eingaben aus beiden Quellen liefern.

Ältere QMD-Builds akzeptieren nur einen Collection-Filter. Wenn OpenClaw einen
dieser Builds erkennt, behält es den Kompatibilitätspfad bei und durchsucht jede
Collection separat, bevor Ergebnisse zusammengeführt und dedupliziert werden.

Um den installierten Contract manuell zu prüfen, führen Sie aus:

```bash
qmd --help | grep -i collection
```

Die aktuelle QMD-Hilfe sagt, dass Collection-Filter eine oder mehrere
Collections anvisieren können. Ältere Hilfe beschreibt üblicherweise eine
einzelne Collection.

## Modell-Overrides

QMD-Modell-Umgebungsvariablen werden unverändert vom Gateway-Prozess
durchgereicht, sodass Sie QMD global abstimmen können, ohne neue
OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Nachdem Sie das Embedding-Modell geändert haben, führen Sie Embeddings erneut
aus, damit der Index zum neuen Vektorraum passt.

## Zusätzliche Pfade indexieren

Verweisen Sie QMD auf zusätzliche Verzeichnisse, um sie durchsuchbar zu machen:

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

Snippets aus zusätzlichen Pfaden erscheinen als
`qmd/<collection>/<relative-path>` in Suchergebnissen. `memory_get` versteht
dieses Präfix und liest aus dem richtigen Collection-Root.

## Sitzungstranskripte indexieren

Aktivieren Sie Sitzungsindexierung, um frühere Unterhaltungen wiederzufinden:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkripte werden als bereinigte Benutzer-/Assistant-Turns in eine dedizierte
QMD-Collection unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert.

## Suchumfang

Standardmäßig werden QMD-Suchergebnisse in Direkt- und Channel-Sitzungen
(nicht Gruppen) angezeigt. Konfigurieren Sie `memory.qmd.scope`, um dies zu
ändern:

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

Wenn der Scope eine Suche verweigert, protokolliert OpenClaw eine Warnung mit
dem abgeleiteten Channel und Chat-Typ, damit leere Ergebnisse leichter zu
debuggen sind.

## Quellenangaben

Wenn `memory.citations` `auto` oder `on` ist, enthalten Such-Snippets eine
Fußzeile `Source: <path#line>`. Setzen Sie `memory.citations = "off"`, um die
Fußzeile wegzulassen, den Pfad aber intern weiterhin an den Agenten zu
übergeben.

## Wann verwenden

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für höherwertige Ergebnisse.
- Projektdokumentation oder Notizen außerhalb des Workspace durchsuchen.
- Frühere Sitzungsunterhaltungen wiederfinden.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Setups funktioniert die [builtin Engine](/de/concepts/memory-builtin)
gut ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass das Binary im `PATH` des
Gateways liegt. Wenn OpenClaw als Dienst läuft, erstellen Sie einen Symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Wenn `qmd --version` in Ihrer Shell funktioniert, OpenClaw aber weiterhin
`spawn qmd ENOENT` meldet, hat der Gateway-Prozess wahrscheinlich einen anderen
`PATH` als Ihre interaktive Shell. Legen Sie das Binary explizit fest:

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

Verwenden Sie `command -v qmd` in der Umgebung, in der QMD installiert ist, und
prüfen Sie anschließend erneut mit `openclaw memory status --deep`.

**Erste Suche sehr langsam?** QMD lädt GGUF-Modelle bei der ersten Verwendung
herunter. Wärmen Sie mit `qmd query "test"` und denselben XDG-Verzeichnissen vor,
die OpenClaw verwendet.

**Viele QMD-Unterprozesse während der Suche?** Aktualisieren Sie QMD, wenn
möglich. OpenClaw verwendet nur dann einen Prozess für Multi-Collection-Suchen
derselben Quelle, wenn das installierte QMD Unterstützung für mehrere `-c`-Filter
angibt; andernfalls behält es aus Korrektheitsgründen den älteren
Fallback pro Collection bei.

**Nur-BM25-QMD versucht weiterhin, llama.cpp zu bauen?** Setzen Sie
`memory.qmd.searchMode = "search"`. OpenClaw behandelt diesen Modus als rein
lexikalisch, führt keine QMD-Vektorstatus-Probes oder Embedding-Wartung aus und
überlässt semantische Bereitschaftsprüfungen `vsearch`- oder `query`-Setups.

**Suche läuft in einen Timeout?** Erhöhen Sie
`memory.qmd.limits.timeoutMs` (Standard: 4000 ms). Setzen Sie den Wert für
langsamere Hardware auf `120000`.

**Leere Ergebnisse in Gruppen-Chats?** Prüfen Sie `memory.qmd.scope` -- der
Standard erlaubt nur Direkt- und Channel-Sitzungen.

**Root-Speichersuche ist plötzlich zu breit geworden?** Starten Sie das Gateway
neu oder warten Sie auf die nächste Start-Abstimmung. OpenClaw erstellt veraltete
verwaltete Collections wieder mit den kanonischen `MEMORY.md`- und
`memory/`-Patterns, wenn es einen Gleichnamenskonflikt erkennt.

**Workspace-sichtbare temporäre Repos verursachen `ENAMETOOLONG` oder defekte
Indexierung?** Die QMD-Traversierung folgt derzeit dem zugrunde liegenden
Verhalten des QMD-Scanners statt den builtin Symlink-Regeln von OpenClaw.
Bewahren Sie temporäre Monorepo-Checkouts in versteckten Verzeichnissen wie
`.tmp/` oder außerhalb indexierter QMD-Roots auf, bis QMD zyklussichere
Traversierung oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi,
Update-Intervalle, Scope-Regeln und alle weiteren Einstellungen finden Sie in
der [Referenz zur Speicherkonfiguration](/de/reference/memory-config).

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Builtin Memory Engine](/de/concepts/memory-builtin)
- [Honcho-Speicher](/de/concepts/memory-honcho)
