---
read_when:
    - Token-Nutzung, Kosten oder Kontextfenster erklären
    - Fehlersuche bei Kontextwachstum oder Compaction-Verhalten
summary: Wie OpenClaw Prompt-Kontext aufbaut und Token-Nutzung + Kosten ausweist
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-05-02T21:03:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Tokenverwendung und Kosten

OpenClaw verfolgt **Token**, nicht Zeichen. Token sind modellspezifisch, aber die meisten
OpenAI-ähnlichen Modelle verwenden bei englischem Text durchschnittlich ca. 4 Zeichen pro Token.

## So wird der System-Prompt erstellt

OpenClaw setzt bei jeder Ausführung seinen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + kurze Beschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen).
  Der kompakte Skills-Block ist durch `skills.limits.maxSkillsPromptChars` begrenzt,
  mit optionaler Überschreibung pro Agent unter
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Anweisungen zur Selbstaktualisierung
- Workspace- und Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, wenn neu, plus `MEMORY.md`, wenn vorhanden). Kleingeschriebenes Root-`memory.md` wird nicht injiziert; es ist eine Legacy-Reparatureingabe für `openclaw doctor --fix`, wenn es zusammen mit `MEMORY.md` vorliegt. Große Dateien werden durch `agents.defaults.bootstrapMaxChars` gekürzt (Standard: 12000), und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Tägliche `memory/*.md`-Dateien sind nicht Teil des normalen Bootstrap-Prompts; sie bleiben in gewöhnlichen Runden bei Bedarf über Memory-Tools verfügbar, aber Zurücksetzen-/Start-Modellläufe können für diese erste Runde einen einmaligen Startkontextblock mit aktuellem täglichem Memory voranstellen. Reine Chat-Befehle `/new` und `/reset` werden bestätigt, ohne das Modell aufzurufen. Das Start-Präludium wird durch `agents.defaults.startupContext` gesteuert.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeit-Metadaten (Host/Betriebssystem/Modell/Denken)

Die vollständige Aufschlüsselung finden Sie unter [System-Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Benutzer- und Assistentennachrichten)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheits-Header (nicht sichtbar, zählen aber trotzdem)

Einige laufzeitintensive Oberflächen haben eigene explizite Obergrenzen:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Überschreibungen pro Agent befinden sich unter `agents.list[].contextLimits`. Diese Regler sind
für begrenzte Laufzeitauszüge und injizierte laufzeiteigene Blöcke vorgesehen. Sie sind
getrennt von Bootstrap-Limits, Startkontext-Limits und Skills-Prompt-Limits.

Für Bilder skaliert OpenClaw Transkript-/Tool-Bild-Payloads vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies anzupassen:

- Niedrigere Werte reduzieren in der Regel die Nutzung von Vision-Token und die Payload-Größe.
- Höhere Werte bewahren mehr visuelle Details für OCR-/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und System-Prompt-Größe) verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## So sehen Sie die aktuelle Token-Nutzung

Verwenden Sie diese Befehle im Chat:

- `/status` → **emoji-reiche Statuskarte** mit dem Sitzungsmodell, der Kontextnutzung,
  den Eingabe-/Ausgabe-Token der letzten Antwort und den **geschätzten Kosten** (nur API-Schlüssel).
- `/usage off|tokens|full` → hängt an jede Antwort eine **Nutzungsfußzeile pro Antwort** an.
  - Bleibt pro Sitzung bestehen (gespeichert als `responseUsage`).
  - OAuth-Authentifizierung **verbirgt Kosten** (nur Token).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungsprotokollen.

Weitere Oberflächen:

- **TUI/Web-TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Kontingentfenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige provider-native Feldaliasnamen.
Für Traffic der OpenAI-Familie über Responses umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Auch die JSON-Nutzung der Gemini CLI wird normalisiert: Antworttext stammt aus `response`, und
`stats.cached` wird auf `cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` ausgibt.
Für nativen Responses-Traffic der OpenAI-Familie werden WebSocket-/SSE-Nutzungsaliasnamen
auf dieselbe Weise normalisiert, und Summen fallen auf normalisierte Eingabe + Ausgabe zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungssnapshot spärlich ist, können `/status` und `session_status`
außerdem Token-/Cache-Zähler und die aktive Laufzeitmodellbezeichnung aus dem
jüngsten Transkript-Nutzungsprotokoll wiederherstellen. Vorhandene Nichtnull-Live-Werte haben weiterhin
Vorrang vor Transkript-Fallback-Werten, und größere promptorientierte
Transkriptsummen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.
Die Nutzungsauthentifizierung für Provider-Kontingentfenster stammt aus provider-spezifischen Hooks, wenn
verfügbar; andernfalls fällt OpenClaw auf passende OAuth-/API-Schlüssel-Anmeldedaten
aus Authentifizierungsprofilen, Umgebung oder Konfiguration zurück.
Assistenten-Transkripteinträge speichern dieselbe normalisierte Nutzungsform, einschließlich
`usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der Provider
Nutzungsmetadaten zurückgibt. Dadurch erhalten `/usage cost` und transkriptgestützter Sitzungsstatus
eine stabile Quelle, auch nachdem der Live-Laufzeitzustand verschwunden ist.

OpenClaw hält die Provider-Nutzungsabrechnung getrennt vom aktuellen Kontextsnapshot.
Provider-`usage.total` kann gecachte Eingabe, Ausgabe und mehrere
Tool-Loop-Modellaufrufe enthalten; sie ist daher nützlich für Kosten und Telemetrie, kann aber das
Live-Kontextfenster überzeichnen. Kontextanzeigen und Diagnosen verwenden den neuesten Prompt-
Snapshot (`promptTokens` oder den letzten Modellaufruf, wenn kein Prompt-Snapshot
verfügbar ist) für `context.used`.

## Kostenschätzung (wenn angezeigt)

Kosten werden aus Ihrer Modellpreiskonfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Token** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preise fehlen, zeigt OpenClaw nur Token an. OAuth-Token
zeigen niemals Dollarkosten.

Nachdem Sidecars und Kanäle den Bereit-Pfad des Gateway erreicht haben, startet OpenClaw ein
optionales Pricing-Bootstrap im Hintergrund für konfigurierte Modellreferenzen, die noch
keine lokalen Preise haben. Dieses Bootstrap ruft entfernte Preis-Kataloge von OpenRouter und LiteLLM
ab. Setzen Sie `models.pricing.enabled: false`, um diese Katalogabrufe
in Offline- oder eingeschränkten Netzwerken zu überspringen; explizite
`models.providers.*.models[].cost`-Einträge steuern weiterhin lokale
Kostenschätzungen.

## Cache-TTL und Auswirkung von Pruning

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es bereinigt die Sitzung, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen den
frisch gecachten Kontext wiederverwenden können, statt den vollständigen Verlauf erneut zu cachen. Dadurch bleiben Cache-
Schreibkosten niedriger, wenn eine Sitzung über die TTL hinaus inaktiv ist.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Sitzungs-Pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Inaktivitätslücken hinweg **warm** halten. Wenn die Cache-TTL Ihres Modells
`1h` beträgt, kann ein Heartbeat-Intervall knapp darunter (z. B. `55m`) vermeiden,
dass der vollständige Prompt erneut gecacht wird, und so Cache-Schreibkosten reduzieren.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` abstimmen.

Eine vollständige Anleitung für jeden einzelnen Regler finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).

Bei Anthropic-API-Preisen sind Cache-Lesevorgänge deutlich günstiger als Eingabe-
Token, während Cache-Schreibvorgänge mit einem höheren Multiplikator berechnet werden. Die neuesten Sätze und TTL-Multiplikatoren finden Sie in Anthropics Preisen für
Prompt-Caching:
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

`agents.list[].params` wird über die `params` des ausgewählten Modells gelegt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandards unverändert erben können.

### Beispiel: Anthropic-1M-Kontext-Beta-Header aktivieren

Anthropics 1M-Kontextfenster ist derzeit Beta-gated. OpenClaw kann den
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

Dies wird auf Anthropics Beta-Header `context-1m-2025-08-07` abgebildet.

Dies gilt nur, wenn `context1m: true` für diesen Modelleintrag gesetzt ist.

Anforderung: Die Anmeldedaten müssen für die Nutzung langer Kontexte berechtigt sein. Andernfalls
antwortet Anthropic für diese Anfrage mit einem provider-seitigen Ratenlimitfehler.

Wenn Sie Anthropic mit OAuth-/Abonnement-Token (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, weil Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zum Reduzieren von Token-Druck

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` für screenshotlastige Sitzungen.
- Halten Sie Skill-Beschreibungen kurz (die Skill-Liste wird in den Prompt injiziert).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Die genaue Formel für den Overhead der Skill-Liste finden Sie unter [Skills](/de/tools/skills).

## Verwandte Themen

- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
