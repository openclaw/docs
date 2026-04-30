---
read_when:
    - Sie möchten QMD als Ihr Speicher-Backend einrichten
    - Sie möchten erweiterte Speicherfunktionen wie Reranking oder zusätzliche indexierte Pfade nutzen
summary: Local-first-Sidecar für die Suche mit BM25, Vektoren, Reranking und Abfrageerweiterung
title: QMD-Speicher-Engine
x-i18n:
    generated_at: "2026-04-30T06:48:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) ist ein lokal-first Such-Sidecar, der neben OpenClaw läuft. Er kombiniert BM25, Vektorsuche und Reranking in einer einzigen Binärdatei und kann Inhalte über die Memory-Dateien Ihres Workspaces hinaus indizieren.

## Was es gegenüber dem integrierten System hinzufügt

- **Reranking und Abfrageerweiterung** für bessere Trefferabdeckung.
- **Zusätzliche Verzeichnisse indizieren** -- Projektdokumentation, Teamnotizen, alles auf der Festplatte.
- **Sitzungstranskripte indizieren** -- frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** -- läuft mit dem optionalen node-llama-cpp-Laufzeitpaket und lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** -- wenn QMD nicht verfügbar ist, fällt OpenClaw nahtlos auf die integrierte Engine zurück.

## Erste Schritte

### Voraussetzungen

- Installieren Sie QMD: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- SQLite-Build, der Erweiterungen erlaubt (`brew install sqlite` unter macOS).
- QMD muss im `PATH` des Gateway liegen.
- macOS und Linux funktionieren sofort. Windows wird am besten über WSL2 unterstützt.

### Aktivieren

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw erstellt ein eigenständiges QMD-Home unter `~/.openclaw/agents/<agentId>/qmd/` und verwaltet den Sidecar-Lebenszyklus automatisch -- Collections, Updates und Embedding-Läufe werden für Sie gehandhabt. Es bevorzugt aktuelle QMD-Collection- und MCP-Abfrageformen, fällt bei Bedarf aber weiterhin auf alternative Collection-Muster-Flags und ältere MCP-Toolnamen zurück. Die Abstimmung beim Start erstellt außerdem veraltete verwaltete Collections wieder mit ihren kanonischen Mustern, wenn noch eine ältere QMD-Collection mit demselben Namen vorhanden ist.

## Wie der Sidecar funktioniert

- OpenClaw erstellt Collections aus Ihren Workspace-Memory-Dateien und allen konfigurierten `memory.qmd.paths` und führt dann `qmd update` aus, wenn der QMD-Manager geöffnet wird, sowie anschließend regelmäßig (standardmäßig alle 5 Minuten). Diese Aktualisierungen laufen über QMD-Unterprozesse, nicht über einen Dateisystem-Crawl im Prozess. Semantische Modi führen außerdem `qmd embed` aus.
- Die standardmäßige Workspace-Collection verfolgt `MEMORY.md` plus den `memory/`-Baum. Kleingeschriebenes `memory.md` wird nicht als Root-Memory-Datei indiziert.
- Der eigene Scanner von QMD ignoriert versteckte Pfade und übliche Abhängigkeits-/Build-Verzeichnisse wie `.git`, `.cache`, `node_modules`, `vendor`, `dist` und `build`. Der Gateway-Start initialisiert QMD standardmäßig nicht, sodass ein Kaltstart vermeidet, die Memory-Laufzeit zu importieren oder den langlebigen Watcher zu erstellen, bevor Memory erstmals verwendet wird.
- Wenn Sie dennoch eine Aktualisierung beim Gateway-Start möchten, setzen Sie `memory.qmd.update.startup` auf `idle` oder `immediate`. Die optionale Startaktualisierung verwendet einen einmaligen QMD-Unterprozesspfad, statt den vollständigen langlebigen In-Process-Watcher zu erstellen.
- Suchen verwenden den konfigurierten `searchMode` (Standard: `search`; unterstützt außerdem `vsearch` und `query`). `search` ist ausschließlich BM25, daher überspringt OpenClaw in diesem Modus semantische Vektor-Bereitschaftsprüfungen und Embedding-Wartung. Wenn ein Modus fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Mit QMD-Versionen, die Multi-Collection-Filter ankündigen, gruppiert OpenClaw Collections aus derselben Quelle in einen einzigen QMD-Suchaufruf. Ältere QMD-Versionen behalten den kompatiblen Fallback pro Collection.
- Wenn QMD vollständig fehlschlägt, fällt OpenClaw auf die integrierte SQLite-Engine zurück. Wiederholte Versuche in Chat-Turns werden nach einem Öffnungsfehler kurz zurückgestellt, damit eine fehlende Binärdatei oder eine defekte Sidecar-Abhängigkeit keinen Retry-Sturm erzeugt; `openclaw memory status` und einmalige CLI-Prüfungen prüfen QMD weiterhin direkt erneut.

<Info>
Die erste Suche kann langsam sein -- QMD lädt GGUF-Modelle (~2 GB) für Reranking und Abfrageerweiterung beim ersten `qmd query`-Lauf automatisch herunter.
</Info>

## Suchleistung und Kompatibilität

OpenClaw hält den QMD-Suchpfad sowohl mit aktuellen als auch älteren QMD-Installationen kompatibel.

Beim Start prüft OpenClaw den Hilfetext des installierten QMD einmal pro Manager. Wenn die Binärdatei Unterstützung für mehrere Collection-Filter ankündigt, durchsucht OpenClaw alle Collections derselben Quelle mit einem Befehl:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Das vermeidet, für jede Durable-Memory-Collection einen eigenen QMD-Unterprozess zu starten. Collections für Sitzungstranskripte bleiben in ihrer eigenen Quellgruppe, sodass gemischte `memory` + `sessions`-Suchen dem Ergebnis-Diversifier weiterhin Eingaben aus beiden Quellen geben.

Ältere QMD-Builds akzeptieren nur einen Collection-Filter. Wenn OpenClaw einen dieser Builds erkennt, behält es den Kompatibilitätspfad bei und durchsucht jede Collection separat, bevor Ergebnisse zusammengeführt und dedupliziert werden.

Um den installierten Vertrag manuell zu prüfen, führen Sie aus:

```bash
qmd --help | grep -i collection
```

Die aktuelle QMD-Hilfe sagt, dass Collection-Filter eine oder mehrere Collections ansprechen können. Ältere Hilfe beschreibt üblicherweise eine einzelne Collection.

## Modell-Overrides

QMD-Modell-Umgebungsvariablen werden unverändert vom Gateway-Prozess weitergereicht, sodass Sie QMD global feinabstimmen können, ohne neue OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Nachdem Sie das Embedding-Modell geändert haben, führen Sie Embeddings erneut aus, damit der Index zum neuen Vektorraum passt.

## Zusätzliche Pfade indizieren

Richten Sie QMD auf zusätzliche Verzeichnisse, um sie durchsuchbar zu machen:

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

Snippets aus zusätzlichen Pfaden erscheinen als `qmd/<collection>/<relative-path>` in Suchergebnissen. `memory_get` versteht dieses Präfix und liest aus dem richtigen Collection-Root.

## Sitzungstranskripte indizieren

Aktivieren Sie Sitzungsindizierung, um frühere Unterhaltungen wiederzufinden:

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

Transkripte werden als bereinigte Benutzer-/Assistant-Turns in eine dedizierte QMD-Collection unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert.

## Suchumfang

Standardmäßig werden QMD-Suchergebnisse in Direkt- und Channel-Sitzungen angezeigt (nicht in Gruppen). Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

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

Wenn der Umfang eine Suche verweigert, protokolliert OpenClaw eine Warnung mit dem abgeleiteten Channel und Chattyp, damit leere Ergebnisse leichter zu debuggen sind.

## Quellenangaben

Wenn `memory.citations` auf `auto` oder `on` steht, enthalten Such-Snippets eine `Source: <path#line>`-Fußzeile. Setzen Sie `memory.citations = "off"`, um die Fußzeile wegzulassen, während der Pfad intern weiterhin an den Agenten übergeben wird.

## Wann verwenden

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für höherwertige Ergebnisse.
- Projektdokumentation oder Notizen außerhalb des Workspaces durchsuchen.
- Vergangene Sitzungsunterhaltungen wiederfinden.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Setups funktioniert die [integrierte Engine](/de/concepts/memory-builtin) gut ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass die Binärdatei im `PATH` des Gateway liegt. Wenn OpenClaw als Dienst läuft, erstellen Sie einen Symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Wenn `qmd --version` in Ihrer Shell funktioniert, OpenClaw aber weiterhin `spawn qmd ENOENT` meldet, hat der Gateway-Prozess wahrscheinlich einen anderen `PATH` als Ihre interaktive Shell. Legen Sie die Binärdatei explizit fest:

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

Verwenden Sie `command -v qmd` in der Umgebung, in der QMD installiert ist, und prüfen Sie dann erneut mit `openclaw memory status --deep`.

**Erste Suche sehr langsam?** QMD lädt GGUF-Modelle bei der ersten Verwendung herunter. Wärmen Sie mit `qmd query "test"` unter Verwendung derselben XDG-Verzeichnisse vor, die OpenClaw verwendet.

**Viele QMD-Unterprozesse während der Suche?** Aktualisieren Sie QMD, wenn möglich. OpenClaw verwendet einen Prozess für Multi-Collection-Suchen derselben Quelle nur, wenn das installierte QMD Unterstützung für mehrere `-c`-Filter ankündigt; andernfalls behält es aus Korrektheitsgründen den älteren Fallback pro Collection bei.

**BM25-only-QMD versucht weiterhin, llama.cpp zu bauen?** Setzen Sie `memory.qmd.searchMode = "search"`. OpenClaw behandelt diesen Modus als rein lexikalisch, führt keine QMD-Vektorstatusprüfungen oder Embedding-Wartung aus und überlässt semantische Bereitschaftsprüfungen `vsearch`- oder `query`-Setups.

**Suche läuft in ein Timeout?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standard: 4000 ms). Setzen Sie den Wert für langsamere Hardware auf `120000`.

**Leere Ergebnisse in Gruppenchats?** Prüfen Sie `memory.qmd.scope` -- der Standard erlaubt nur Direkt- und Channel-Sitzungen.

**Root-Memory-Suche wurde plötzlich zu breit?** Starten Sie den Gateway neu oder warten Sie auf die nächste Startabstimmung. OpenClaw erstellt veraltete verwaltete Collections wieder mit den kanonischen `MEMORY.md`- und `memory/`-Mustern, wenn es einen Namenskonflikt erkennt.

**Workspace-sichtbare temporäre Repos verursachen `ENAMETOOLONG` oder defekte Indizierung?**
Die QMD-Traversierung folgt derzeit dem Verhalten des zugrunde liegenden QMD-Scanners statt den integrierten Symlink-Regeln von OpenClaw. Legen Sie temporäre Monorepo-Checkouts in versteckten Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Roots ab, bis QMD zyklussichere Traversierung oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Aktualisierungsintervalle, Umfangsregeln und alle anderen Stellschrauben finden Sie in der [Memory-Konfigurationsreferenz](/de/reference/memory-config).

## Verwandt

- [Memory-Übersicht](/de/concepts/memory)
- [Integrierte Memory-Engine](/de/concepts/memory-builtin)
- [Honcho Memory](/de/concepts/memory-honcho)
