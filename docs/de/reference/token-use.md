---
read_when:
    - Erläuterung von Token-Nutzung, Kosten oder Kontextfenstern
    - Debugging des Kontextwachstums oder Compaction-Verhaltens
summary: Wie OpenClaw Prompt-Kontext erstellt und Token-Nutzung + Kosten meldet
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-06-27T18:13:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw verfolgt **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten OpenAI-artigen Modelle liegen bei englischem Text im Durchschnitt bei ca. 4 Zeichen pro Token.

## Wie der System-Prompt erstellt wird

OpenClaw setzt bei jedem Lauf einen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + kurze Beschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen).
  Native Codex-Turns erhalten den kompakten Skills-Block als turn-bezogene
  Entwickleranweisungen für die Zusammenarbeit; andere Harnesses erhalten ihn auf der normalen
  Prompt-Oberfläche. Er wird durch `skills.limits.maxSkillsPromptChars` begrenzt, mit
  optionaler Überschreibung pro Agent unter `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Selbstaktualisierungsanweisungen
- Workspace- + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` wenn neu, plus `MEMORY.md` wenn vorhanden). Native Codex-Turns fügen kein rohes `MEMORY.md` aus dem konfigurierten Agent-Workspace ein, wenn Memory-Tools für diesen Workspace verfügbar sind; sie enthalten einen kleinen Memory-Verweis in turn-bezogenen Entwickleranweisungen für die Zusammenarbeit und verwenden Memory-Tools bei Bedarf. Wenn Tools deaktiviert sind, die Memory-Suche nicht verfügbar ist oder sich der aktive Workspace vom Agent-Memory-Workspace unterscheidet, verwendet `MEMORY.md` den normalen begrenzten Turn-Kontextpfad. Kleingeschriebenes Root-`memory.md` wird nicht injiziert; es ist Legacy-Reparatureingabe für `openclaw doctor --fix`, wenn es mit `MEMORY.md` gepaart ist. Große injizierte Dateien werden durch `agents.defaults.bootstrapMaxChars` gekürzt (Standard: 20000), und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Tägliche Dateien unter `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts; sie bleiben in gewöhnlichen Turns bei Bedarf über Memory-Tools verfügbar, aber Reset-/Startup-Modellläufe können für diesen ersten Turn einen einmaligen Startup-Kontextblock mit neuerer täglicher Memory voranstellen. Bloße Chat-Befehle `/new` und `/reset` werden bestätigt, ohne das Modell aufzurufen. Das Startup-Präludium wird durch `agents.defaults.startupContext` gesteuert. AGENTS.md-Auszüge nach der Compaction sind separat und erfordern ein explizites Opt-in über `agents.defaults.compaction.postCompactionSections`.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeitmetadaten (Host/OS/Modell/Denken)

Die vollständige Aufschlüsselung finden Sie unter [System-Prompt](/de/concepts/system-prompt).

Wenn Sie Zugangsdaten oder Auth-Snippets dokumentieren, verwenden Sie die
[Secret-Placeholder-Konventionen](/de/reference/secret-placeholder-conventions), um
False Positives von Secret-Scannern bei reinen Dokumentationsänderungen zu
vermeiden.

## Was im Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Benutzer- + Assistentennachrichten)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheitsheader (nicht sichtbar, zählen aber trotzdem)

Einige laufzeitintensive Oberflächen haben eigene explizite Limits:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Überschreibungen pro Agent liegen unter `agents.list[].contextLimits`. Diese Stellschrauben sind
für begrenzte Laufzeitauszüge und injizierte laufzeiteigene Blöcke gedacht. Sie sind
von Bootstrap-Limits, Startup-Kontextlimits und Skills-Prompt-
Limits getrennt.

`toolResultMaxChars` ist eine erweiterte Obergrenze (bis zu `1000000` Zeichen). Wenn sie nicht gesetzt ist, wählt OpenClaw
das Live-Limit für Tool-Ergebnisse aus dem effektiven Modellkontextfenster: `16000` Zeichen
unter 100K Tokens, `32000` Zeichen ab 100K Tokens und `64000` Zeichen ab 200K+
Tokens, weiterhin begrenzt durch den Laufzeit-Context-Share-Schutz.

Für Bilder skaliert OpenClaw Transkript-/Tool-Bild-Payloads vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies anzupassen:

- Niedrigere Werte reduzieren in der Regel die Vision-Token-Nutzung und Payload-Größe.
- Höhere Werte erhalten mehr visuelle Details für OCR-/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und System-Prompt-Größe) verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Aktuelle Token-Nutzung anzeigen

Verwenden Sie im Chat:

- `/status` → **emoji-reiche Statuskarte** mit dem Sitzungsmodell, der Kontextnutzung,
  den Eingabe-/Ausgabe-Tokens der letzten Antwort und **geschätzten Kosten**, wenn lokale Preise
  für das aktive Modell konfiguriert sind.
- `/usage off|tokens|full` → hängt an jede Antwort eine **Nutzungsfußzeile pro Antwort** an.
  - Bleibt pro Sitzung erhalten (gespeichert als `responseUsage`).
  - `/usage reset` (Aliasse: `inherit`, `clear`, `default`) — löscht die Sitzungs-
    Überschreibung, sodass die Sitzung wieder den konfigurierten Standard erbt.
  - `/usage full` zeigt geschätzte Kosten nur an, wenn OpenClaw Nutzungsmetadaten und
    lokale Preise für das aktive Modell hat. Andernfalls werden nur Tokens angezeigt.
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs.

Andere Oberflächen:

- **TUI/Web-TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Quota-Fenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige provider-native Feldaliasse.
Für OpenAI-Family-Responses-Traffic umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Gemini-CLI-Nutzung wird ebenfalls normalisiert: Der standardmäßige `stream-json`-Parser liest
Assistenten-`message`-Events, und `stats.cached` wird auf `cacheRead` abgebildet, wobei
`stats.input_tokens - stats.cached` verwendet wird, wenn die CLI kein explizites
`stats.input`-Feld ausgibt. Legacy-JSON-Überschreibungen lesen Antworttext weiterhin aus
`response`.
Für nativen OpenAI-Family-Responses-Traffic werden WebSocket-/SSE-Nutzungsaliasse
auf dieselbe Weise normalisiert, und Gesamtwerte fallen auf normalisierte Eingabe + Ausgabe zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungssnapshot spärlich ist, können `/status` und `session_status`
Token-/Cache-Zähler und das aktive Laufzeitmodell-Label auch aus dem
neuesten Transkript-Nutzungslog wiederherstellen. Vorhandene von null verschiedene Live-Werte haben weiterhin
Vorrang vor Transkript-Fallback-Werten, und größere prompt-orientierte
Transkript-Gesamtwerte können gewinnen, wenn gespeicherte Gesamtwerte fehlen oder kleiner sind.
Nutzungs-Auth für Provider-Quota-Fenster stammt aus providerspezifischen Hooks, wenn
verfügbar; andernfalls fällt OpenClaw auf passende OAuth-/API-Key-Zugangsdaten
aus Auth-Profilen, Env oder Konfiguration zurück.
Assistenten-Transkripteinträge speichern dieselbe normalisierte Nutzungsform, einschließlich
`usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der Provider
Nutzungsmetadaten zurückgibt. Dadurch erhalten `/usage cost` und transkriptgestützter Sitzungsstatus
eine stabile Quelle, auch nachdem der Live-Laufzeitstatus verschwunden ist.

OpenClaw hält Provider-Nutzungsabrechnung getrennt vom aktuellen Kontext-
Snapshot. Provider-`usage.total` kann gecachte Eingaben, Ausgaben und mehrere
Modellaufrufe in Tool-Loops enthalten, ist daher für Kosten und Telemetrie nützlich, kann aber
das Live-Kontextfenster überzeichnen. Kontextanzeigen und Diagnosen verwenden den neuesten Prompt-
Snapshot (`promptTokens` oder den letzten Modellaufruf, wenn kein Prompt-Snapshot
verfügbar ist) für `context.used`.

## Kostenschätzung (wenn angezeigt)

Kosten werden aus Ihrer Modellpreiskonfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1M Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preise fehlen, zeigt OpenClaw nur Tokens an. Die Kostenanzeige ist
nicht auf API-Key-Auth beschränkt: Nicht-API-Key-Provider wie `aws-sdk` können
geschätzte Kosten anzeigen, wenn ihr konfigurierter Modelleintrag lokale Preise enthält und der
Provider Nutzungsmetadaten zurückgibt.

Nachdem Sidecars und Channels den Gateway-Bereit-Pfad erreicht haben, startet OpenClaw ein
optionales Pricing-Bootstrap im Hintergrund für konfigurierte Modell-Refs, die noch
keine lokalen Preise haben. Dieses Bootstrap ruft entfernte OpenRouter- und LiteLLM-
Preiskataloge ab. Setzen Sie `models.pricing.enabled: false`, um diese Katalog-
Abrufe in Offline- oder eingeschränkten Netzwerken zu überspringen; explizite
`models.providers.*.models[].cost`-Einträge treiben lokale Kosten-
Schätzungen weiterhin an.

## Cache-TTL und Pruning-Auswirkung

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es pruned die Sitzung, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen den
frisch gecachten Kontext wiederverwenden können, anstatt den vollständigen Verlauf erneut zu cachen. Dadurch bleiben Cache-
Schreibkosten niedriger, wenn eine Sitzung über die TTL hinaus inaktiv bleibt.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration), und lesen Sie die
Verhaltensdetails unter [Sitzungs-Pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufpausen hinweg **warm** halten. Wenn die Cache-TTL Ihres Modells
`1h` beträgt, kann ein Heartbeat-Intervall knapp darunter (z. B. `55m`) vermeiden,
dass der vollständige Prompt erneut gecacht wird, wodurch Cache-Schreibkosten sinken.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` abstimmen.

Eine vollständige Anleitung zu jeder Stellschraube finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).

Für Anthropic-API-Preise sind Cache-Lesevorgänge deutlich günstiger als Eingabe-
Tokens, während Cache-Schreibvorgänge mit einem höheren Multiplikator abgerechnet werden. Die neuesten Tarife und TTL-Multiplikatoren finden Sie in Anthropics
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

### Beispiel: Gemischter Traffic mit Cache-Strategie pro Agent

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
nur `cacheRetention` überschreiben und andere Modellstandards unverändert erben können.

### Anthropic-1M-Kontext

OpenClaw dimensioniert GA-fähige Claude-4.x-Modelle wie Opus 4.8, Opus 4.7, Opus 4.6 und
Sonnet 4.6 mit Anthropics 1M-Kontextfenster. Sie benötigen
`params.context1m: true` für diese Modelle nicht.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Ältere Konfigurationen können `context1m: true` beibehalten, aber OpenClaw sendet
Anthropics eingestellten Beta-Header `context-1m-2025-08-07` für diese Einstellung nicht mehr und
erweitert nicht unterstützte ältere Claude-Modelle nicht auf 1M.

Anforderung: Die Zugangsdaten müssen für Long-Context-Nutzung berechtigt sein. Falls nicht,
antwortet Anthropic für diese Anfrage mit einem providerseitigen Rate-Limit-Fehler.

Wenn Sie Anthropic mit OAuth-/Subscription-Tokens (`sk-ant-oat-*`) authentifizieren,
behält OpenClaw die für OAuth erforderlichen Anthropic-Beta-Header bei, während der
eingestellte `context-1m-*`-Beta entfernt wird, falls er in älterer Konfiguration verbleibt.

## Tipps zur Reduzierung des Token-Drucks

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` für screenshotlastige Sitzungen.
- Halten Sie Skill-Beschreibungen kurz (die Skill-Liste wird in den Prompt injiziert).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Siehe [Skills](/de/tools/skills) für die genaue Formel zum Overhead der Skill-Liste.

## Verwandte Themen

- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
