---
read_when:
    - Tokennutzung, Kosten oder Kontextfenster erklären
    - Fehlersuche bei Kontextwachstum oder Compaction-Verhalten
summary: Wie OpenClaw Prompt-Kontext aufbaut und Tokenverbrauch + Kosten ausweist
title: Tokennutzung und Kosten
x-i18n:
    generated_at: "2026-04-30T07:14:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Token-Nutzung und Kosten

OpenClaw erfasst **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten
OpenAI-artigen Modelle liegen bei englischem Text im Durchschnitt bei etwa 4 Zeichen pro Token.

## Wie der System-Prompt erstellt wird

OpenClaw setzt bei jedem Lauf seinen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + kurze Beschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen).
  Der kompakte Skills-Block wird durch `skills.limits.maxSkillsPromptChars` begrenzt,
  mit optionaler Überschreibung pro Agent unter
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Self-Update-Anweisungen
- Workspace + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, wenn neu, sowie `MEMORY.md`, wenn vorhanden). Die Root-Datei `memory.md` in Kleinschreibung wird nicht injiziert; sie ist Legacy-Reparatureingabe für `openclaw doctor --fix`, wenn sie zusammen mit `MEMORY.md` vorliegt. Große Dateien werden durch `agents.defaults.bootstrapMaxChars` gekürzt (Standard: 12000), und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Tägliche Dateien unter `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts; sie bleiben in gewöhnlichen Durchläufen bei Bedarf über Memory-Tools verfügbar, aber Reset-/Start-Modellläufe können für diesen ersten Durchlauf einen einmaligen Startkontextblock mit aktuellem täglichem Speicher voranstellen. Reine Chat-Befehle wie `/new` und `/reset` werden ohne Aufruf des Modells bestätigt. Das Start-Prelude wird durch `agents.defaults.startupContext` gesteuert.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Runtime-Metadaten (Host/OS/Modell/Thinking)

Die vollständige Aufschlüsselung finden Sie unter [System-Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Konversationsverlauf (Benutzer- + Assistentennachrichten)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheits-Header (nicht sichtbar, zählen aber trotzdem)

Einige runtime-intensive Oberflächen haben eigene explizite Limits:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Überschreibungen pro Agent befinden sich unter `agents.list[].contextLimits`. Diese Regler sind
für begrenzte Runtime-Auszüge und injizierte runtime-eigene Blöcke gedacht. Sie sind
von Bootstrap-Limits, Startkontext-Limits und Skills-Prompt-Limits getrennt.

Für Bilder skaliert OpenClaw Transkript-/Tool-Bild-Payloads vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies anzupassen:

- Niedrigere Werte reduzieren normalerweise die Nutzung von Vision-Tokens und die Payload-Größe.
- Höhere Werte bewahren mehr visuelle Details für OCR-/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und System-Prompt-Größe) verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## So sehen Sie die aktuelle Token-Nutzung

Verwenden Sie im Chat:

- `/status` → **Statuskarte mit vielen Emojis** mit Sitzungsmodell, Kontextnutzung,
  Eingabe-/Ausgabe-Tokens der letzten Antwort und **geschätzten Kosten** (nur API-Key).
- `/usage off|tokens|full` → hängt an jede Antwort eine **Nutzungsfußzeile pro Antwort** an.
  - Bleibt pro Sitzung bestehen (gespeichert als `responseUsage`).
  - OAuth-Authentifizierung **blendet Kosten aus** (nur Tokens).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs.

Andere Oberflächen:

- **TUI/Web-TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Kontingentfenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren gängige provider-native Feldaliasnamen vor der Anzeige.
Für Responses-Traffic der OpenAI-Familie umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht ändern.
Auch die JSON-Nutzung der Gemini CLI wird normalisiert: Antworttext stammt aus `response`, und
`stats.cached` wird auf `cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` ausgibt.
Für nativen Responses-Traffic der OpenAI-Familie werden WebSocket-/SSE-Nutzungsaliasnamen
auf die gleiche Weise normalisiert, und Summen fallen auf normalisierte Eingabe + Ausgabe zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungssnapshot spärlich ist, können `/status` und `session_status`
auch Token-/Cache-Zähler und die aktive Runtime-Modellbezeichnung aus dem
neuesten Transkript-Nutzungslog wiederherstellen. Vorhandene Live-Werte ungleich null haben weiterhin
Vorrang vor Fallback-Werten aus dem Transkript, und größere prompt-orientierte
Transkriptsummen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.
Die Nutzungsauthentifizierung für Provider-Kontingentfenster stammt aus provider-spezifischen Hooks, wenn
verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Key-Anmeldedaten
aus Authentifizierungsprofilen, Umgebung oder Konfiguration zurück.
Assistenten-Transkripteinträge speichern dieselbe normalisierte Nutzungsform, einschließlich
`usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der Provider
Nutzungsmetadaten zurückgibt. Dadurch erhalten `/usage cost` und transkriptgestützter Sitzungsstatus
eine stabile Quelle, auch nachdem der Live-Runtime-Zustand nicht mehr vorhanden ist.

OpenClaw hält die Provider-Nutzungsabrechnung vom aktuellen Kontext-Snapshot getrennt.
Provider `usage.total` kann gecachte Eingabe, Ausgabe und mehrere
Tool-Loop-Modellaufrufe enthalten, ist also für Kosten und Telemetrie nützlich, kann aber
das Live-Kontextfenster überschätzen. Kontextanzeigen und Diagnosen verwenden den neuesten Prompt-
Snapshot (`promptTokens` oder den letzten Modellaufruf, wenn kein Prompt-Snapshot
verfügbar ist) für `context.used`.

## Kostenschätzung (wenn angezeigt)

Kosten werden aus Ihrer Modellpreiskonfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preise fehlen, zeigt OpenClaw nur Tokens an. OAuth-Tokens
zeigen niemals Dollar-Kosten.

Der Gateway-Start führt außerdem optional im Hintergrund ein Preis-Bootstrap für
konfigurierte Modellreferenzen aus, die noch keine lokalen Preise haben. Dieses Bootstrap
ruft entfernte OpenRouter- und LiteLLM-Preiskataloge ab. Setzen Sie
`models.pricing.enabled: false`, um diese Startkatalogabrufe in Offline-
oder eingeschränkten Netzwerken zu überspringen; explizite Einträge unter `models.providers.*.models[].cost`
steuern weiterhin lokale Kostenschätzungen.

## Cache-TTL und Auswirkung von Pruning

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es bereinigt die Sitzung, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen den
frisch gecachten Kontext wiederverwenden können, statt den gesamten Verlauf erneut zu cachen. Dadurch bleiben die
Cache-Schreibkosten niedriger, wenn eine Sitzung länger als die TTL inaktiv ist.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Sitzungs-Pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufpausen hinweg **warm** halten. Wenn Ihre Modell-Cache-TTL
`1h` ist, kann ein Heartbeat-Intervall knapp darunter (z. B. `55m`) vermeiden,
dass der gesamte Prompt erneut gecacht wird, und so Cache-Schreibkosten reduzieren.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration verwenden und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` anpassen.

Eine vollständige Anleitung zu jedem einzelnen Regler finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).

Bei Anthropic-API-Preisen sind Cache-Lesevorgänge deutlich günstiger als Eingabe-
Tokens, während Cache-Schreibvorgänge mit einem höheren Multiplikator abgerechnet werden. Die neuesten Raten und TTL-Multiplikatoren finden Sie in Anthropics
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

`agents.list[].params` wird mit den `params` des ausgewählten Modells zusammengeführt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandards unverändert übernehmen können.

### Beispiel: Anthropic-1M-Kontext-Beta-Header aktivieren

Anthropics 1M-Kontextfenster ist derzeit durch eine Beta-Freigabe geschützt. OpenClaw kann den
erforderlichen Wert `anthropic-beta` injizieren, wenn Sie `context1m` für unterstützte Opus-
oder Sonnet-Modelle aktivieren.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Dies wird auf Anthropics Beta-Header `context-1m-2025-08-07` abgebildet.

Dies gilt nur, wenn `context1m: true` für diesen Modelleintrag gesetzt ist.

Anforderung: Die Anmeldedaten müssen für die Nutzung langer Kontexte berechtigt sein. Falls nicht,
antwortet Anthropic für diese Anfrage mit einem provider-seitigen Rate-Limit-Fehler.

Wenn Sie Anthropic mit OAuth-/Abonnement-Tokens (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, weil Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zur Reduzierung von Token-Druck

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` für screenshot-lastige Sitzungen.
- Halten Sie Skill-Beschreibungen kurz (die Skill-Liste wird in den Prompt injiziert).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Die genaue Formel für den Overhead der Skill-Liste finden Sie unter [Skills](/de/tools/skills).

## Verwandte Themen

- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
