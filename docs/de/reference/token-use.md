---
read_when:
    - Erklärung von Tokennutzung, Kosten oder Kontextfenstern
    - Debugging von Kontextwachstum oder Compaction-Verhalten
summary: Wie OpenClaw Prompt-Kontext erstellt und Tokennutzung + Kosten meldet
title: Tokennutzung und Kosten
x-i18n:
    generated_at: "2026-04-26T11:39:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# Tokennutzung & Kosten

OpenClaw erfasst **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten Modelle im OpenAI-Stil kommen bei englischem Text im Durchschnitt auf etwa 4 Zeichen pro Token.

## Wie der System-Prompt erstellt wird

OpenClaw setzt bei jedem Lauf seinen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + Kurzbeschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen).
  Der kompakte Skills-Block wird durch `skills.limits.maxSkillsPromptChars`
  begrenzt, mit optionaler Agent-spezifischer Überschreibung unter
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Anweisungen für Self-Update
- Workspace- + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, wenn neu, sowie `MEMORY.md`, falls vorhanden). Kleingeschriebenes `memory.md` im Root wird nicht injiziert; es ist Legacy-Reparatureingabe für `openclaw doctor --fix`, wenn es zusammen mit `MEMORY.md` vorhanden ist. Große Dateien werden durch `agents.defaults.bootstrapMaxChars` abgeschnitten (Standard: 12000), und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Tägliche Dateien unter `memory/*.md` sind kein Teil des normalen Bootstrap-Prompts; sie bleiben in normalen Turns bei Bedarf über Memory-Tools verfügbar, aber bei einfachem `/new` und `/reset` kann für diesen ersten Turn einmalig ein Startup-Context-Block mit aktuellem täglichem Memory vorangestellt werden. Dieses Startup-Prelude wird durch `agents.defaults.startupContext` gesteuert.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeitmetadaten (Host/OS/Modell/Thinking)

Die vollständige Aufschlüsselung finden Sie unter [System Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell empfängt, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Konversationsverlauf (Nachrichten von Benutzer + Assistent)
- Tool-Calls und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheits-Header (nicht sichtbar, werden aber trotzdem gezählt)

Einige laufzeitintensive Oberflächen haben eigene explizite Begrenzungen:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Überschreibungen pro Agent befinden sich unter `agents.list[].contextLimits`. Diese Einstellungen sind
für begrenzte Laufzeit-Auszüge und injizierte, laufzeiteigene Blöcke gedacht. Sie sind
getrennt von Bootstrap-Limits, Startup-Context-Limits und Skills-Prompt-
Limits.

Bei Bildern skaliert OpenClaw Transkript-/Tool-Bild-Payloads vor Provider-Calls herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies anzupassen:

- Niedrigere Werte reduzieren in der Regel Vision-Tokennutzung und Payload-Größe.
- Höhere Werte erhalten mehr visuelle Details für OCR-/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und System-Prompt-Größe) verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## So sehen Sie die aktuelle Tokennutzung

Verwenden Sie im Chat Folgendes:

- `/status` → **statuskarte mit vielen Emojis** mit dem Sitzungsmodell, der Kontextnutzung,
  den Input-/Output-Tokens der letzten Antwort und den **geschätzten Kosten** (nur API-Schlüssel).
- `/usage off|tokens|full` → hängt an jede Antwort einen **Nutzungs-Footer pro Antwort** an.
  - Wird pro Sitzung gespeichert (gespeichert als `responseUsage`).
  - OAuth-Authentifizierung **blendet Kosten aus** (nur Tokens).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus den OpenClaw-Sitzungslogs.

Weitere Oberflächen:

- **TUI/Web TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Quotenfenster (`X% left`, nicht Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenster: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige providernative Feldaliasse.
Für Responses-Datenverkehr der OpenAI-Familie umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, damit transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Auch die JSON-Nutzung von Gemini CLI wird normalisiert: Antworttext kommt aus `response`, und
`stats.cached` wird auf `cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` liefert.
Bei nativem Responses-Datenverkehr der OpenAI-Familie werden WebSocket-/SSE-Nutzungsaliasse auf dieselbe Weise
normalisiert, und Summen greifen auf normalisierte Eingabe + Ausgabe zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungs-Snapshot spärlich ist, können `/status` und `session_status`
auch Token-/Cache-Zähler und die aktive Modellbezeichnung der Laufzeit aus dem
letzten Nutzungslog des Transkripts wiederherstellen. Vorhandene Live-Werte ungleich null haben weiterhin
Vorrang vor Rückfallwerten aus dem Transkript, und größere promptorientierte
Transkript-Summen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.
Die Nutzungs-Authentifizierung für Provider-Quotenfenster stammt aus providerspezifischen Hooks, wenn verfügbar;
andernfalls greift OpenClaw auf passende OAuth-/API-Key-Anmeldedaten aus
Auth-Profilen, Umgebung oder Konfiguration zurück.
Einträge des Assistenten im Transkript speichern dieselbe normalisierte Nutzungsform, einschließlich
`usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der Provider Nutzungsmetadaten zurückgibt. Dadurch erhalten `/usage cost` und transkriptgestützter Sitzungsstatus auch dann
eine stabile Quelle, wenn der Live-Laufzeitstatus nicht mehr vorhanden ist.

OpenClaw hält die Nutzungsabrechnung des Providers getrennt vom aktuellen Kontext-Snapshot.
Provider-`usage.total` kann gecachte Eingaben, Ausgaben und mehrere Modellaufrufe in Tool-Schleifen enthalten, ist also für Kosten und Telemetrie nützlich, kann aber das Live-Kontextfenster überzeichnen. Kontextanzeigen und Diagnosen verwenden den neuesten Prompt-Snapshot (`promptTokens` oder den letzten Modellaufruf, wenn kein Prompt-Snapshot verfügbar ist) für `context.used`.

## Kostenschätzung (wenn angezeigt)

Kosten werden aus Ihrer Modellpreis-Konfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preisinformationen fehlen, zeigt OpenClaw nur Tokens an. OAuth-Tokens
zeigen niemals Dollar-Kosten an.

## Auswirkungen von Cache-TTL und Pruning

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es beschneidet die Sitzung, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen den
frisch gecachten Kontext wiederverwenden können, statt den vollständigen Verlauf erneut zu cachen. Dadurch bleiben Cache-Schreibkosten niedriger, wenn eine Sitzung über die TTL hinaus inaktiv ist.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Session pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn die Cache-TTL Ihres Modells
`1h` beträgt, kann das Setzen des Heartbeat-Intervalls knapp darunter (z. B. `55m`) vermeiden,
dass der vollständige Prompt erneut gecacht werden muss, was Cache-Schreibkosten reduziert.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` anpassen.

Eine vollständige Anleitung zu allen Einstellungen finden Sie unter [Prompt Caching](/de/reference/prompt-caching).

Bei der API-Bepreisung von Anthropic sind Cache-Lesevorgänge deutlich günstiger als Input-
Tokens, während Cache-Schreibvorgänge mit einem höheren Multiplikator abgerechnet werden. Die neuesten Preise und TTL-Multiplikatoren finden Sie in der Preisübersicht von Anthropic für Prompt Caching:
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

### Beispiel: gemischter Verkehr mit Cache-Strategie pro Agent

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

`agents.list[].params` wird über `params` des ausgewählten Modells zusammengeführt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandards unverändert übernehmen können.

### Beispiel: Anthropic-Beta-Header für 1M-Kontext aktivieren

Das 1M-Kontextfenster von Anthropic ist derzeit durch einen Beta-Zugang geschützt. OpenClaw kann den
erforderlichen Wert `anthropic-beta` injizieren, wenn Sie `context1m` bei unterstützten Opus-
oder Sonnet-Modellen aktivieren.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Dies wird dem Beta-Header `context-1m-2025-08-07` von Anthropic zugeordnet.

Dies gilt nur, wenn `context1m: true` für diesen Modelleintrag gesetzt ist.

Voraussetzung: Die Anmeldedaten müssen für die Nutzung von langem Kontext geeignet sein. Andernfalls
antwortet Anthropic für diese Anfrage mit einem providerseitigen Rate-Limit-Fehler.

Wenn Sie Anthropic mit OAuth-/Subscription-Tokens (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, weil Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zur Verringerung des Tokendrucks

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` für sitzungen mit vielen Screenshots.
- Halten Sie Skill-Beschreibungen kurz (die Skills-Liste wird in den Prompt injiziert).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Siehe [Skills](/de/tools/skills) für die genaue Formel des Overheads der Skills-Liste.

## Verwandt

- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
