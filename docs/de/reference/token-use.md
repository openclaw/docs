---
read_when:
    - Token-Nutzung, Kosten oder Kontextfenster erklären
    - Fehlersuche bei Kontextwachstum oder Verhalten der Compaction
summary: Wie OpenClaw Prompt-Kontext aufbaut und Token-Nutzung sowie Kosten meldet
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-05-06T07:02:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw verfolgt **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten OpenAI-ähnlichen Modelle liegen bei englischem Text im Durchschnitt bei ~4 Zeichen pro Token.

## Wie der System-Prompt erstellt wird

OpenClaw setzt bei jedem Lauf seinen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + Kurzbeschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen).
  Der kompakte Skills-Block ist durch `skills.limits.maxSkillsPromptChars` begrenzt,
  mit optionaler Überschreibung pro Agent unter
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Anweisungen zur Selbstaktualisierung
- Workspace + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` wenn neu, plus `MEMORY.md` wenn vorhanden). Kleingeschriebenes Root-`memory.md` wird nicht injiziert; es ist Legacy-Reparatureingabe für `openclaw doctor --fix`, wenn es zusammen mit `MEMORY.md` vorhanden ist. Große Dateien werden durch `agents.defaults.bootstrapMaxChars` gekürzt (Standard: 12000), und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Tägliche Dateien unter `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts; sie bleiben in gewöhnlichen Turns bei Bedarf über Memory-Tools verfügbar, aber Reset-/Startup-Modellläufe können für diesen ersten Turn einen einmaligen Startup-Kontextblock mit aktueller täglicher Erinnerung voranstellen. Reine Chat-Befehle `/new` und `/reset` werden bestätigt, ohne das Modell aufzurufen. Das Startup-Präludium wird durch `agents.defaults.startupContext` gesteuert.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeitmetadaten (Host/OS/Modell/Thinking)

Die vollständige Aufschlüsselung finden Sie unter [System-Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Nachrichten von Benutzer + Assistant)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheits-Header (nicht sichtbar, zählen aber trotzdem)

Einige laufzeitintensive Oberflächen haben eigene explizite Obergrenzen:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Überschreibungen pro Agent liegen unter `agents.list[].contextLimits`. Diese Regler sind
für begrenzte Laufzeitauszüge und injizierte, laufzeiteigene Blöcke gedacht. Sie sind
getrennt von Bootstrap-Limits, Startup-Kontext-Limits und Skills-Prompt-Limits.

Für Bilder skaliert OpenClaw Bild-Payloads aus Transkripten/Tools vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies anzupassen:

- Niedrigere Werte reduzieren üblicherweise die Nutzung von Vision-Tokens und die Payload-Größe.
- Höhere Werte erhalten mehr visuelle Details für OCR-/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und Größe des System-Prompts) verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Wie Sie die aktuelle Token-Nutzung sehen

Verwenden Sie diese Befehle im Chat:

- `/status` → **Emoji-reiche Statuskarte** mit Sitzungsmodell, Kontextnutzung,
  Eingabe-/Ausgabe-Tokens der letzten Antwort und **geschätzten Kosten** (nur API-Schlüssel).
- `/usage off|tokens|full` → hängt an jede Antwort eine **Nutzungsfußzeile pro Antwort** an.
  - Bleibt pro Sitzung erhalten (gespeichert als `responseUsage`).
  - OAuth-Authentifizierung **blendet Kosten aus** (nur Tokens).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs.

Andere Oberflächen:

- **TUI/Web TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Kontingentfenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige provider-native Feld-Aliasse.
Für Traffic der OpenAI-Familie bei Responses umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Auch die JSON-Nutzung der Gemini CLI wird normalisiert: Antworttext kommt aus `response`, und
`stats.cached` wird `cacheRead` zugeordnet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` ausgibt.
Für nativen Responses-Traffic der OpenAI-Familie werden WebSocket-/SSE-Nutzungsaliase
auf dieselbe Weise normalisiert, und Summen fallen auf normalisierte Eingabe + Ausgabe zurück,
wenn `total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungssnapshot spärlich ist, können `/status` und `session_status`
auch Token-/Cache-Zähler und das aktive Laufzeitmodell-Label aus dem
jüngsten Transkript-Nutzungslog wiederherstellen. Vorhandene Live-Werte ungleich null haben weiterhin
Vorrang vor Fallback-Werten aus dem Transkript, und größere promptorientierte
Transkriptsummen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.
Die Nutzungsautorisierung für Provider-Kontingentfenster stammt aus provider-spezifischen Hooks, sofern
verfügbar; andernfalls fällt OpenClaw auf passende OAuth-/API-Schlüssel-Zugangsdaten
aus Auth-Profilen, Umgebungsvariablen oder Konfiguration zurück.
Assistant-Transkripteinträge speichern dieselbe normalisierte Nutzungsform, einschließlich
`usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der Provider
Nutzungsmetadaten zurückgibt. Dadurch erhalten `/usage cost` und transkriptgestützter Sitzungsstatus
eine stabile Quelle, auch nachdem der Live-Laufzeitzustand verschwunden ist.

OpenClaw hält die Provider-Nutzungsabrechnung getrennt vom aktuellen Kontext-
Snapshot. Provider-`usage.total` kann gecachte Eingaben, Ausgaben und mehrere
Tool-Loop-Modellaufrufe enthalten. Daher ist es für Kosten und Telemetrie nützlich, kann aber
das Live-Kontextfenster überhöht darstellen. Kontextanzeigen und Diagnosen verwenden den neuesten Prompt-
Snapshot (`promptTokens`, oder den letzten Modellaufruf, wenn kein Prompt-Snapshot
verfügbar ist) für `context.used`.

## Kostenschätzung (wenn angezeigt)

Kosten werden aus Ihrer Modellpreiskonfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preise fehlen, zeigt OpenClaw nur Tokens an. OAuth-Tokens
zeigen niemals Dollarkosten.

Nachdem Sidecars und Channels den Gateway-Bereit-Pfad erreicht haben, startet OpenClaw einen
optionalen Hintergrund-Bootstrap für Preise für konfigurierte Modellreferenzen, die noch
keine lokalen Preise haben. Dieser Bootstrap ruft entfernte OpenRouter- und LiteLLM-
Preiskataloge ab. Setzen Sie `models.pricing.enabled: false`, um diese Katalog-
Abrufe in Offline- oder eingeschränkten Netzwerken zu überspringen; explizite
`models.providers.*.models[].cost`-Einträge steuern weiterhin lokale Kostenschätzungen.

## Cache-TTL und Pruning-Auswirkung

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es pruned die Sitzung, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen den
frisch gecachten Kontext wiederverwenden können, statt den gesamten Verlauf neu zu cachen. Das hält
Cache-Schreibkosten niedriger, wenn eine Sitzung über die TTL hinaus inaktiv ist.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Sitzungs-Pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn Ihre Modell-Cache-TTL
`1h` beträgt, kann ein Heartbeat-Intervall knapp darunter (z. B. `55m`) vermeiden,
den gesamten Prompt neu zu cachen, wodurch Cache-Schreibkosten sinken.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` abstimmen.

Eine vollständige Anleitung für jeden einzelnen Regler finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).

Bei Anthropic-API-Preisen sind Cache-Lesevorgänge deutlich günstiger als Eingabe-
Tokens, während Cache-Schreibvorgänge mit einem höheren Multiplikator abgerechnet werden. Die aktuellen Tarife und TTL-Multiplikatoren finden Sie in Anthropics
Prompt-Caching-Preisen:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Beispiel: 1h-Cache mit Heartbeat warm halten

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Beispiel: gemischter Traffic mit Cache-Strategie pro Agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` wird über den `params` des ausgewählten Modells zusammengeführt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandardwerte unverändert übernehmen können.

### Beispiel: Anthropic-1M-Kontext-Beta-Header aktivieren

Anthropics 1M-Kontextfenster ist derzeit durch eine Beta-Freigabe geschützt. OpenClaw kann den
erforderlichen `anthropic-beta`-Wert injizieren, wenn Sie `context1m` für unterstützte Opus-
oder Sonnet-Modelle aktivieren.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Dies wird Anthropics Beta-Header `context-1m-2025-08-07` zugeordnet.

Dies gilt nur, wenn `context1m: true` für diesen Modelleintrag gesetzt ist.

Anforderung: Die Zugangsdaten müssen für Long-Context-Nutzung berechtigt sein. Andernfalls
antwortet Anthropic für diese Anfrage mit einem provider-seitigen Rate-Limit-Fehler.

Wenn Sie Anthropic mit OAuth-/Abonnement-Tokens (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, da Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zum Reduzieren des Token-Drucks

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` für Screenshot-lastige Sitzungen.
- Halten Sie Skills-Beschreibungen kurz (die Skills-Liste wird in den Prompt injiziert).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Die genaue Formel für den Overhead der Skills-Liste finden Sie unter [Skills](/de/tools/skills).

## Verwandte Themen

- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
