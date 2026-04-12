---
read_when:
    - Erklärung von Token-Nutzung, Kosten oder Kontextfenstern
    - Debuggen von Kontextwachstum oder Kompaktierungsverhalten
summary: Wie OpenClaw Prompt-Kontext erstellt und Token-Nutzung + Kosten meldet
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-12T06:16:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8c856549cd28b8364a640e6fa9ec26aa736895c7a993e96cbe85838e7df2dfb
    source_path: reference/token-use.md
    workflow: 15
---

# Token-Nutzung und Kosten

OpenClaw erfasst **Token**, nicht Zeichen. Token sind modellspezifisch, aber die meisten
Modelle im OpenAI-Stil haben im Durchschnitt etwa 4 Zeichen pro Token bei englischem Text.

## Wie der System-Prompt erstellt wird

OpenClaw setzt bei jedem Lauf seinen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + kurze Beschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen)
- Anweisungen zur Selbstaktualisierung
- Workspace- + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, wenn neu, sowie `MEMORY.md`, wenn vorhanden, oder `memory.md` als Fallback in Kleinbuchstaben). Große Dateien werden durch `agents.defaults.bootstrapMaxChars` abgeschnitten (Standard: 20000), und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 150000). Tägliche Dateien in `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts; sie bleiben bei normalen Turns bedarfsbasiert über Speicher-Tools verfügbar, aber bei reinem `/new` und `/reset` kann ein einmaliger Startkontext-Block mit aktuellem täglichem Speicher für diesen ersten Turn vorangestellt werden. Dieses Startpräliminarium wird durch `agents.defaults.startupContext` gesteuert.
- Zeit (UTC + Benutzerzeitzone)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeitmetadaten (Host/OS/Modell/Thinking)

Die vollständige Aufschlüsselung finden Sie unter [System Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Benutzer- + Assistenten-Nachrichten)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Kompaktierungszusammenfassungen und Artefakte des Beschneidens
- Provider-Wrapper oder Safety-Header (nicht sichtbar, aber dennoch mitgezählt)

Bei Bildern skaliert OpenClaw Bild-Payloads aus Transkripten/Tools vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies anzupassen:

- Niedrigere Werte reduzieren in der Regel die Vision-Token-Nutzung und die Payload-Größe.
- Höhere Werte bewahren mehr visuelle Details für OCR-/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und System-Prompt-Größe) verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## So sehen Sie die aktuelle Token-Nutzung

Verwenden Sie diese Befehle im Chat:

- `/status` → **statuskarte mit vielen Emojis** mit dem Sitzungsmodell, der Kontextnutzung,
  den Eingabe-/Ausgabe-Token der letzten Antwort und den **geschätzten Kosten** (nur API-Schlüssel).
- `/usage off|tokens|full` → hängt an jede Antwort eine **Nutzungsfußzeile pro Antwort** an.
  - Wird pro Sitzung beibehalten (gespeichert als `responseUsage`).
  - OAuth-Authentifizierung **blendet Kosten aus** (nur Token).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungsprotokollen an.

Weitere Oberflächen:

- **TUI/Web TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Quota-Fenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenster: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige feldnative Aliase von Providern.
Für OpenAI-Familie-Responses-Datenverkehr umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Auch die JSON-Nutzung von Gemini CLI wird normalisiert: Der Antworttext stammt aus `response`, und
`stats.cached` wird auf `cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` ausgibt.
Für nativen OpenAI-Familie-Responses-Datenverkehr werden WebSocket-/SSE-Nutzungsaliase
auf die gleiche Weise normalisiert, und Summen greifen auf normalisierte Eingabe + Ausgabe zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungssnapshot spärlich ist, können `/status` und `session_status`
auch Token-/Cache-Zähler und die aktive Laufzeit-Modellbezeichnung aus dem zuletzt verwendeten Transkript-Nutzungsprotokoll wiederherstellen. Bereits vorhandene Live-Werte ungleich null haben weiterhin Vorrang vor Transkript-Fallback-Werten, und größere promptorientierte
Transkript-Summen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.
Die Nutzungsautorisierung für Provider-Quota-Fenster stammt, sofern verfügbar, aus providerspezifischen Hooks; andernfalls greift OpenClaw auf passende OAuth-/API-Schlüssel-Anmeldedaten aus Auth-Profilen, Umgebungsvariablen oder der Konfiguration zurück.

## Kostenschätzung (wenn angezeigt)

Kosten werden anhand Ihrer Modell-Preis-Konfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Token** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preisdaten fehlen, zeigt OpenClaw nur Token an. OAuth-Token
zeigen niemals Dollar-Kosten an.

## Auswirkungen von Cache-TTL und Beschneidung

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Beschneidung** ausführen: Es beschneidet die Sitzung, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen den
frisch gecachten Kontext erneut verwenden können, anstatt den gesamten Verlauf neu zu cachen. Dadurch bleiben die
Cache-Schreibkosten niedriger, wenn eine Sitzung länger als die TTL inaktiv bleibt.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Session pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn Ihre Modell-Cache-TTL
`1h` beträgt, kann das Setzen des Heartbeat-Intervalls knapp darunter (z. B. `55m`) verhindern,
dass der gesamte Prompt erneut gecacht werden muss, was Cache-Schreibkosten reduziert.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` abstimmen.

Eine vollständige Anleitung zu allen Stellschrauben finden Sie unter [Prompt Caching](/de/reference/prompt-caching).

Bei der Preisgestaltung der Anthropic API sind Cache-Lesevorgänge deutlich günstiger als Eingabe-Token,
während Cache-Schreibvorgänge mit einem höheren Multiplikator berechnet werden. Die aktuellen Tarife und TTL-Multiplikatoren finden Sie in der Anthropic-Dokumentation zur Prompt-Caching-Preisgestaltung:
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

### Beispiel: gemischter Datenverkehr mit Cache-Strategie pro Agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # Standardbasis für die meisten Agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # langen Cache für tiefe Sitzungen warm halten
    - id: "alerts"
      params:
        cacheRetention: "none" # Cache-Schreibvorgänge für burstartige Benachrichtigungen vermeiden
```

`agents.list[].params` wird über die `params` des ausgewählten Modells zusammengeführt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandards unverändert erben können.

### Beispiel: Anthropic-1M-Kontext-Beta-Header aktivieren

Das 1M-Kontextfenster von Anthropic ist derzeit per Beta-Gating geschützt. OpenClaw kann den
erforderlichen Wert für `anthropic-beta` einfügen, wenn Sie `context1m` bei unterstützten Opus-
oder Sonnet-Modellen aktivieren.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Dies wird auf den Beta-Header `context-1m-2025-08-07` von Anthropic abgebildet.

Dies gilt nur, wenn `context1m: true` für diesen Modelleintrag gesetzt ist.

Voraussetzung: Die Anmeldedaten müssen für die Nutzung von Langkontext berechtigt sein. Ist dies nicht der Fall,
antwortet Anthropic für diese Anfrage mit einem providerseitigen Rate-Limit-Fehler.

Wenn Sie Anthropic mit OAuth-/Abonnement-Token (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, da Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zur Reduzierung von Token-Druck

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` bei screenshotlastigen Sitzungen.
- Halten Sie Skill-Beschreibungen kurz (die Skills-Liste wird in den Prompt injiziert).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Unter [Skills](/de/tools/skills) finden Sie die genaue Formel für den Overhead der Skills-Liste.
