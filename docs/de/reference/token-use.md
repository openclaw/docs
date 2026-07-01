---
read_when:
    - Tokennutzung, Kosten oder Kontextfenster erklären
    - Debuggen von Kontextwachstum oder Compaction-Verhalten
summary: Wie OpenClaw Prompt-Kontext erstellt und Token-Nutzung + Kosten meldet
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-07-01T18:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw verfolgt **Token**, nicht Zeichen. Token sind modellspezifisch, aber die meisten
OpenAI-artigen Modelle liegen bei englischem Text durchschnittlich bei etwa 4 Zeichen pro Token.

## Wie der System-Prompt erstellt wird

OpenClaw setzt bei jedem Lauf seinen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + kurze Beschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen).
  Native Codex-Turns erhalten den kompakten Skills-Block als turnbezogene
  Entwickleranweisungen zur Zusammenarbeit; andere Harnesses erhalten ihn in der normalen
  Prompt-Oberfläche. Er wird durch `skills.limits.maxSkillsPromptChars` begrenzt,
  mit optionaler Überschreibung pro Agent unter `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Anweisungen zur Selbstaktualisierung
- Workspace- + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, wenn neu, plus `MEMORY.md`, wenn vorhanden). Native Codex-Turns fügen kein rohes `MEMORY.md` aus dem konfigurierten Agent-Workspace ein, wenn Memory-Tools für diesen Workspace verfügbar sind; sie enthalten einen kleinen Memory-Verweis in turnbezogenen Entwickleranweisungen zur Zusammenarbeit und verwenden Memory-Tools bei Bedarf. Wenn Tools deaktiviert sind, die Memory-Suche nicht verfügbar ist oder sich der aktive Workspace vom Agent-Memory-Workspace unterscheidet, verwendet `MEMORY.md` den normalen begrenzten Turn-Kontext-Pfad. Kleingeschriebenes Root-`memory.md` wird nicht injiziert; es ist Legacy-Reparatureingabe für `openclaw doctor --fix`, wenn es zusammen mit `MEMORY.md` vorliegt. Große injizierte Dateien werden durch `agents.defaults.bootstrapMaxChars` gekürzt (Standard: 20000), und die gesamte Bootstrap-Injektion wird durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Tägliche Dateien unter `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts; sie bleiben in gewöhnlichen Turns bei Bedarf über Memory-Tools verfügbar, aber Reset-/Startup-Modellläufe können für diesen ersten Turn einen einmaligen Startup-Kontext-Block mit aktuellem täglichem Memory voranstellen. Reine Chat-Befehle `/new` und `/reset` werden bestätigt, ohne das Modell aufzurufen. Das Startup-Präludium wird durch `agents.defaults.startupContext` gesteuert. AGENTS.md-Auszüge nach Compaction sind separat und erfordern ein explizites Opt-in über `agents.defaults.compaction.postCompactionSections`.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeitmetadaten (Host/OS/Modell/Thinking)

Die vollständige Aufschlüsselung finden Sie unter [System-Prompt](/de/concepts/system-prompt).

Wenn Sie Zugangsdaten oder Auth-Snippets dokumentieren, verwenden Sie die
[Konventionen für Secret-Platzhalter](/de/reference/secret-placeholder-conventions), um
False Positives von Secret-Scannern bei reinen Dokumentationsänderungen zu vermeiden.

## Was zum Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Benutzer- + Assistentennachrichten)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheits-Header (nicht sichtbar, werden aber trotzdem gezählt)

Einige laufzeitintensive Oberflächen haben eigene explizite Begrenzungen:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Überschreibungen pro Agent liegen unter `agents.list[].contextLimits`. Diese Regler sind
für begrenzte Laufzeitauszüge und injizierte laufzeiteigene Blöcke gedacht. Sie sind
getrennt von Bootstrap-Limits, Startup-Kontext-Limits und Skills-Prompt-Limits.

`toolResultMaxChars` ist eine erweiterte Obergrenze (bis zu `1000000` Zeichen). Wenn sie nicht gesetzt ist, wählt OpenClaw
die Live-Begrenzung für Tool-Ergebnisse aus dem effektiven Modellkontextfenster: `16000` Zeichen
unter 100K Token, `32000` Zeichen ab 100K Token und `64000` Zeichen ab 200K
Token, weiterhin begrenzt durch den Laufzeit-Kontextanteils-Schutz.

Für Bilder skaliert OpenClaw Transkript-/Tool-Bild-Payloads vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies anzupassen:

- Niedrigere Werte reduzieren in der Regel die Nutzung von Vision-Token und die Payload-Größe.
- Höhere Werte bewahren mehr visuelle Details für OCR-/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und System-Prompt-Größe) verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## So sehen Sie die aktuelle Token-Nutzung

Verwenden Sie diese Befehle im Chat:

- `/status` → **statuskarte mit vielen Emojis** mit dem Sitzungsmodell, der Kontextnutzung,
  den Eingabe-/Ausgabe-Token der letzten Antwort und **geschätzten Kosten**, wenn lokale Preise
  für das aktive Modell konfiguriert sind.
- `/usage off|tokens|full` → hängt an jede Antwort eine **Nutzungsfußzeile pro Antwort** an.
  - Bleibt pro Sitzung erhalten (gespeichert als `responseUsage`).
  - `/usage reset` (Aliase: `inherit`, `clear`, `default`) — löscht die Sitzungsüberschreibung,
    sodass die Sitzung den konfigurierten Standard wieder erbt.
  - `/usage tokens` zeigt Turn-Token-/Cache-Details.
  - `/usage full` zeigt kompakte Modell-/Kontext-/Kostendetails; geschätzte Kosten erscheinen
    nur, wenn OpenClaw Nutzungsmetadaten und lokale Preise für das aktive Modell hat.
    Benutzerdefinierte `messages.usageTemplate`-Layouts können Token-/Cache-Felder enthalten.
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs.

Andere Oberflächen:

- **TUI/Web-TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Kontingentfenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige Provider-native Feldaliase.
Für Responses-Traffic der OpenAI-Familie umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Die Nutzung von Gemini CLI wird ebenfalls normalisiert: Der standardmäßige `stream-json`-Parser liest
Assistenten-`message`-Events, und `stats.cached` wird auf `cacheRead` abgebildet, wobei
`stats.input_tokens - stats.cached` verwendet wird, wenn die CLI kein explizites
`stats.input`-Feld ausgibt. Legacy-JSON-Überschreibungen lesen Antworttext weiterhin aus
`response`.
Für nativen Responses-Traffic der OpenAI-Familie werden WebSocket-/SSE-Nutzungsaliase
auf dieselbe Weise normalisiert, und Summen fallen auf normalisierte Eingabe + Ausgabe zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungssnapshot lückenhaft ist, können `/status` und `session_status`
auch Token-/Cache-Zähler und die aktive Laufzeit-Modellbezeichnung aus dem
neuesten Transkript-Nutzungslog wiederherstellen. Vorhandene von null verschiedene Live-Werte haben weiterhin
Vorrang vor Transkript-Fallback-Werten, und größere promptorientierte
Transkript-Gesamtsummen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.
Die Nutzungs-Authentifizierung für Provider-Kontingentfenster stammt aus providerspezifischen Hooks, wenn
verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Key-Zugangsdaten
aus Auth-Profilen, Umgebung oder Konfiguration zurück.
Assistenten-Transkripteinträge speichern dieselbe normalisierte Nutzungsform, einschließlich
`usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der Provider
Nutzungsmetadaten zurückgibt. Dadurch erhalten `/usage cost` und transkriptgestützter Sitzungsstatus
eine stabile Quelle, selbst nachdem der Live-Laufzeitzustand nicht mehr vorhanden ist.

OpenClaw hält die Provider-Nutzungsabrechnung vom aktuellen Kontextsnapshot getrennt.
Provider-`usage.total` kann gecachte Eingabe, Ausgabe und mehrere
Tool-Loop-Modellaufrufe enthalten, ist also für Kosten und Telemetrie nützlich, kann aber
das Live-Kontextfenster überzeichnen. Kontextanzeigen und Diagnosen verwenden den neuesten Prompt-Snapshot
(`promptTokens` oder den letzten Modellaufruf, wenn kein Prompt-Snapshot
verfügbar ist) für `context.used`.

## Kostenschätzung (wenn angezeigt)

Kosten werden anhand Ihrer Modellpreiskonfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1M Token** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preise fehlen, lässt `/usage full` die Kosten aus; verwenden Sie `/usage tokens`
oder ein benutzerdefiniertes `messages.usageTemplate`, wenn Sie Token-/Cache-Details in jeder
Antwort benötigen. Die Kostenanzeige ist nicht auf API-Key-Authentifizierung beschränkt: Provider ohne API-Key
wie `aws-sdk` können geschätzte Kosten anzeigen, wenn ihr konfigurierter Modelleintrag
lokale Preise enthält und der Provider Nutzungsmetadaten zurückgibt.

Nachdem Sidecars und Kanäle den Gateway-Bereit-Pfad erreicht haben, startet OpenClaw einen
optionalen Hintergrund-Preis-Bootstrap für konfigurierte Modellreferenzen, die noch keine
lokalen Preise haben. Dieser Bootstrap ruft entfernte OpenRouter- und LiteLLM-
Preiskataloge ab. Setzen Sie `models.pricing.enabled: false`, um diese Katalogabrufe
in Offline- oder eingeschränkten Netzwerken zu überspringen; explizite
`models.providers.*.models[].cost`-Einträge steuern weiterhin lokale Kostenschätzungen.

## Cache-TTL und Auswirkungen von Pruning

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es kürzt die Sitzung, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, damit nachfolgende Anfragen den
frisch gecachten Kontext wiederverwenden können, statt den vollständigen Verlauf erneut zu cachen. Dadurch bleiben Cache-
Schreibkosten niedriger, wenn eine Sitzung länger als die TTL inaktiv bleibt.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Sitzungs-Pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn die Cache-TTL Ihres Modells
`1h` beträgt, kann ein Heartbeat-Intervall knapp darunter (z. B. `55m`) vermeiden,
dass der vollständige Prompt erneut gecacht wird, wodurch Cache-Schreibkosten sinken.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` anpassen.

Eine vollständige Regler-für-Regler-Anleitung finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).

Für Anthropic-API-Preise sind Cache-Lesevorgänge deutlich günstiger als Eingabe-
Token, während Cache-Schreibvorgänge mit einem höheren Multiplikator abgerechnet werden. Die neuesten Preise und TTL-Multiplikatoren finden Sie in Anthropics
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
nur `cacheRetention` überschreiben und andere Modellstandards unverändert erben können.

### Anthropic-1M-Kontext

OpenClaw dimensioniert GA-fähige Claude-4.x-Modelle wie Opus 4.8, Opus 4.7, Opus 4.6 und
Sonnet 4.6 mit Anthropics 1M-Kontextfenster. Sie benötigen für diese Modelle kein
`params.context1m: true`.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Ältere Konfigurationen können `context1m: true` beibehalten, aber OpenClaw sendet
für diese Einstellung nicht mehr Anthropics eingestellten `context-1m-2025-08-07`-Beta-Header und
erweitert nicht unterstützte ältere Claude-Modelle nicht auf 1M.

Anforderung: Die Zugangsdaten müssen für Long-Context-Nutzung berechtigt sein. Andernfalls
antwortet Anthropic für diese Anfrage mit einem providerseitigen Rate-Limit-Fehler.

Wenn Sie Anthropic mit OAuth-/Abonnement-Token (`sk-ant-oat-*`) authentifizieren,
bewahrt OpenClaw die für OAuth erforderlichen Anthropic-Beta-Header, während der
eingestellte `context-1m-*`-Beta-Header entfernt wird, falls er in älterer Konfiguration verbleibt.

## Tipps zur Reduzierung des Token-Drucks

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` für screenshotlastige Sitzungen.
- Halten Sie Beschreibungen von Skills kurz (die Skill-Liste wird in den Prompt eingefügt).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Die genaue Formel für den Overhead der Skill-Liste finden Sie unter [Skills](/de/tools/skills).

## Verwandt

- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
