---
read_when:
    - Erläuterung der Token-Nutzung, Kosten oder Kontextfenster
    - Kontextwachstum oder Compaction-Verhalten debuggen
summary: Wie OpenClaw den Prompt-Kontext erstellt und Token-Nutzung sowie Kosten ausweist
title: Tokenverbrauch und Kosten
x-i18n:
    generated_at: "2026-07-24T04:07:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6624bceb0bcbca769c9d569389b73b82f1ea73133e09f0ae9859833196d85911
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw erfasst **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten
Modelle im OpenAI-Stil verwenden bei englischem Text durchschnittlich ~4 Zeichen pro Token.

## So wird der System-Prompt erstellt

OpenClaw stellt bei jedem Lauf einen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + Kurzbeschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen). Native
  Codex-Turns erhalten den kompakten Skills-Block als auf den Turn beschränkte
  Entwickleranweisungen zur Zusammenarbeit; andere Harnesses erhalten ihn auf der normalen Prompt-Oberfläche.
  Begrenzt durch `skills.limits.maxSkillsPromptChars`, mit optionaler Überschreibung pro Agent
  unter `agents.entries.*.skillsLimits.maxSkillsPromptChars`.
- Anweisungen zur Selbstaktualisierung
- Workspace- + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` bei neuen Workspaces sowie
  `MEMORY.md`, falls vorhanden). Große injizierte Dateien werden durch
  `agents.defaults.bootstrapMaxChars` gekürzt (Standard: `20000`); die gesamte Bootstrap-
  Injektion wird durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard:
  `60000`).
  - Native Codex-Turns fügen den unverarbeiteten Inhalt von `MEMORY.md` nicht ein, wenn für
    diesen Workspace Memory-Tools verfügbar sind; stattdessen erhalten sie in den
    auf den Turn beschränkten Entwickleranweisungen zur Zusammenarbeit einen kurzen Memory-Verweis und verwenden
    Memory-Tools bei Bedarf. Wenn Tools deaktiviert sind, die Memory-Suche nicht verfügbar ist oder
    sich der aktive Workspace vom Agent-Memory-Workspace unterscheidet, greift `MEMORY.md`
    auf den normalen begrenzten Turn-Kontextpfad zurück.
  - Die kleingeschriebene Stammdatei `memory.md` wird niemals injiziert. Sie dient als Legacy-Reparatureingabe
    für `openclaw doctor --fix`, das sie nach `MEMORY.md` migriert.
  - Tägliche `memory/*.md`-Dateien sind nicht Teil des normalen Bootstrap-Prompts;
    sie bleiben bei gewöhnlichen Turns über Memory-Tools bei Bedarf verfügbar. Modellläufe zum Zurücksetzen/Starten
    können für diesen ersten Turn einmalig einen Startkontextblock mit aktuellen
    täglichen Memory-Inhalten voranstellen, gesteuert durch
    `agents.defaults.startupContext`. Reine Chat-Befehle `/new` und `/reset` werden
    bestätigt, ohne das Modell aufzurufen.
  - Auszüge aus `AGENTS.md` nach der Compaction erfordern ein ausdrückliches
    Opt-in über `agents.defaults.compaction.postCompactionSections`; Plugins können über
    `before_prompt_build` weiteren Kontext hinzufügen.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeitmetadaten (Host/Betriebssystem/Modell/Thinking)

Eine vollständige Aufschlüsselung finden Sie unter [System-Prompt](/de/concepts/system-prompt).

Verwenden Sie bei der Dokumentation von Anmeldedaten oder Authentifizierungsausschnitten die
[Konventionen für Geheimnisplatzhalter](/de/reference/secret-placeholder-conventions), um
Fehlalarme von Secret-Scannern bei reinen Dokumentationsänderungen zu vermeiden.

## Was zum Kontextfenster zählt

Alles, was das Modell empfängt, wird auf das Kontextlimit angerechnet:

- System-Prompt (alle oben genannten Abschnitte)
- Konversationsverlauf (Nachrichten von Benutzer + Assistent)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Bereinigungsartefakte
- Provider-Wrapper oder Sicherheitsheader (nicht sichtbar, werden aber dennoch angerechnet)

Laufzeitintensive Oberflächen haben eigene explizite Grenzwerte unter
`agents.defaults.contextLimits` (Überschreibungen pro Agent unter
`agents.entries.*.contextLimits`):

| Schlüssel                 | Zweck                                                                    |
| ------------------------- | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | Maximale Anzahl Zeichen, die `memory_get` vor der Kürzung zurückgibt.    |
| `postCompactionMaxChars` | Maximale Anzahl Zeichen, die während der Aktualisierung nach der Compaction aus `AGENTS.md` beibehalten wird. |

Hierbei handelt es sich um begrenzte Laufzeitauszüge und injizierte laufzeiteigene Blöcke,
die von Bootstrap-Limits, Startkontextlimits und Limits für Skills-Prompts
getrennt sind.

OpenClaw leitet den aktuellen Grenzwert für Tool-Ergebnisse aus dem effektiven Modellkontextfenster
ab: `16000` Zeichen bei weniger als
100K Tokens, `32000` Zeichen ab 100K Tokens, `64000` Zeichen ab 200K Tokens.
Die Laufzeitbegrenzung für den Kontextanteil beschränkt außerdem ein einzelnes Tool-Ergebnis auf 30 % des
Kontextfensters.

Große Provider-Fenster werden nicht automatisch aktiviert, wenn sie Kosten
oder Latenz erheblich verändern. Beispielsweise veröffentlichen direkte OpenAI-Modelle GPT-5.5 und GPT-5.6
ein Gesamtfenster von `1050000` Tokens, OpenClaw begrenzt ihr aktives
Laufzeitbudget jedoch standardmäßig auf `272000` Tokens. Das optionale Eingabebudget von `922000` reserviert das
vollständige Ausgabelimit von `128000`, und OpenAI berechnet für die gesamte Anfrage
höhere Preise für langen Kontext, sobald die Eingabe `272000` Tokens überschreitet. Siehe
[OpenAI-Standardwerte für Kontextfenster](/de/providers/openai#context-window-defaults-and-long-context-opt-in).

Bei Bildern verkleinert OpenClaw Bildnutzlasten aus Transkripten/Tools vor
Provider-Aufrufen. Passen Sie dies mit `agents.defaults.imageMaxDimensionPx` an (Standard:
`1200`):

- Niedrigere Werte reduzieren die Nutzung von Vision-Tokens und die Nutzlastgröße.
- Höhere Werte bewahren mehr visuelle Details für OCR-/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (nach injizierter Datei, Tools, Skills und Größe des
System-Prompts) verwenden Sie `/context list` oder `/context detail`. Siehe
[Kontext](/de/concepts/context).

## So zeigen Sie die aktuelle Token-Nutzung an

Im Chat:

- `/status` -> Emoji-reiche Statuskarte mit dem Sitzungsmodell, der Kontextnutzung,
  den Eingabe-/Ausgabe-Tokens der letzten Antwort und den geschätzten Kosten, wenn lokale Preise
  für das aktive Modell konfiguriert sind.
- `/usage off|tokens|full` -> fügt jeder Antwort eine Nutzungsfußzeile pro Antwort
  hinzu. Bleibt sitzungsbezogen erhalten (gespeichert als `responseUsage`).
  - `/usage reset` (Aliase: `inherit`, `clear`, `default`) löscht die
    Sitzungsüberschreibung, sodass der konfigurierte Standard erneut übernommen wird.
  - `/usage tokens` zeigt Token-/Cache-Details des Turns.
  - `/usage full` zeigt kompakte Modell-/Kontext-/Kostendetails; geschätzte Kosten
    werden nur angezeigt, wenn OpenClaw über Nutzungsmetadaten und lokale Preise für das
    aktive Modell verfügt. Benutzerdefinierte `messages.usageTemplate`-Layouts können
    Token-/Cache-Felder enthalten.
- `/usage cost` -> lokale Kostenzusammenfassung aus OpenClaw-Sitzungsprotokollen.

Weitere Oberflächen:

- **TUI/Web-TUI:** `/status` und `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Kontingentfenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider für Nutzungsfenster: Claude (Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige Aliase nativer Provider-Felder.
Für Responses-Datenverkehr der OpenAI-Familie umfasst dies sowohl
`input_tokens`/`output_tokens` als auch `prompt_tokens`/`completion_tokens`, sodass
transportspezifische Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen
nicht verändern. Die Nutzung der Gemini CLI wird ebenfalls normalisiert: Der standardmäßige `stream-json`-
Parser liest Assistentenereignisse vom Typ `message`, und `stats.cached` wird auf
`cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached` verwendet wird, wenn die CLI
kein explizites Feld `stats.input` liefert. Legacy-JSON-Überschreibungen lesen den Antworttext weiterhin
aus `response`.

Für nativen Responses-Datenverkehr der OpenAI-Familie werden WebSocket-/SSE-Nutzungsaliase
auf dieselbe Weise normalisiert, und Gesamtwerte greifen auf normalisierte Eingabe + Ausgabe
zurück, wenn `total_tokens` fehlt oder `0` ist.

Wenn der aktuelle Sitzungssnapshot nur wenige Daten enthält, können `/status` und `session_status`
Token-/Cache-Zähler sowie die Bezeichnung des aktiven Laufzeitmodells aus dem
neuesten Transkript-Nutzungsprotokoll wiederherstellen. Vorhandene von null verschiedene Live-Werte haben weiterhin
Vorrang vor Transkript-Fallback-Werten, und größere promptorientierte
Transkript-Gesamtwerte können Vorrang erhalten, wenn gespeicherte Gesamtwerte fehlen oder kleiner sind.

Die Nutzungsauthentifizierung für Provider-Kontingentfenster stammt zuerst aus Provider-spezifischen Hooks;
wenn ein Provider keinen Hook besitzt (oder der Hook kein Token auflöst),
greift OpenClaw auf passende OAuth-/API-Schlüssel-Anmeldedaten aus Authentifizierungsprofilen,
Umgebungsvariablen oder der Konfiguration zurück.

Assistententranskripteinträge speichern dieselbe normalisierte Nutzungsstruktur,
einschließlich `usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der
Provider Nutzungsmetadaten zurückgibt. Dadurch erhalten `/usage cost` und der
transkriptgestützte Sitzungsstatus selbst dann eine stabile Quelle, wenn der aktive
Laufzeitzustand nicht mehr vorhanden ist.

OpenClaw hält die Provider-Nutzungsabrechnung vom aktuellen Kontextsnapshot
getrennt. Provider-`usage.total` kann zwischengespeicherte Eingaben, Ausgaben und
mehrere Modellaufrufe in Tool-Schleifen enthalten. Daher eignet es sich für Kosten und Telemetrie, kann aber
das aktuelle Kontextfenster überhöht darstellen. Kontextanzeigen und Diagnosen verwenden
für `context.used` den neuesten Prompt-Snapshot (`promptTokens` oder den letzten Modellaufruf, wenn kein
Prompt-Snapshot verfügbar ist).

## Kostenschätzung (falls angezeigt)

Die Kosten werden anhand Ihrer Modellpreiskonfiguration geschätzt:

```text
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1M Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preisangaben fehlen, lässt `/usage full` die Kosten weg; verwenden Sie
`/usage tokens` oder ein benutzerdefiniertes `messages.usageTemplate`, wenn Sie
Token-/Cache-Details in jeder Antwort benötigen. Die Kostenanzeige ist nicht auf die Authentifizierung
per API-Schlüssel beschränkt: Provider ohne API-Schlüssel wie `aws-sdk` können geschätzte Kosten anzeigen, wenn
ihr konfigurierter Modelleintrag lokale Preise enthält und der Provider
Nutzungsmetadaten zurückgibt.

Nachdem Sidecars und Kanäle den Bereitschaftspfad des Gateways erreicht haben, startet OpenClaw
optional im Hintergrund einen Preis-Bootstrap für konfigurierte Modellreferenzen, für die
noch keine lokalen Preise vorliegen. Dieser Bootstrap ruft entfernte Preiskataloge von OpenRouter und
LiteLLM ab. Setzen Sie `models.pricing.enabled: false`, um diese
Katalogabrufe in Offline- oder eingeschränkten Netzwerken zu überspringen; explizite
`models.providers.*.models[].cost`-Einträge steuern weiterhin lokale Kostenschätzungen.

## Auswirkungen von Cache-TTL und Bereinigung

Das Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw
kann optional eine **Cache-TTL-Bereinigung** ausführen: Die Sitzung wird bereinigt, sobald die
Cache-TTL abgelaufen ist; anschließend wird das Cache-Fenster zurückgesetzt, sodass nachfolgende Anfragen
den neu zwischengespeicherten Kontext wiederverwenden, anstatt den gesamten Verlauf erneut zwischenzuspeichern.
Dadurch bleiben die Cache-Schreibkosten niedriger, wenn eine Sitzung länger als die TTL inaktiv ist.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Sitzungsbereinigung](/de/concepts/session-pruning).

Heartbeat kann den Cache über inaktive Zeiträume hinweg **warm** halten. Wenn die Cache-
TTL Ihres Modells `1h` beträgt, kann ein Heartbeat-Intervall knapp darunter (z. B. `55m`)
verhindern, dass der gesamte Prompt erneut zwischengespeichert wird, und so die Cache-Schreibkosten senken.

In Multi-Agent-Konfigurationen können Sie eine gemeinsame Modellkonfiguration verwenden und das Cache-
Verhalten mit `agents.entries.*.params.cacheRetention` pro Agent anpassen.

Eine vollständige Anleitung zu sämtlichen Einstellungen finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).

Bei der Preisgestaltung der Anthropic-API sind Cache-Lesevorgänge erheblich günstiger als Eingabe-
Tokens, während Cache-Schreibvorgänge mit einem höheren Multiplikator abgerechnet werden. Die aktuellen Preise und TTL-Multiplikatoren
für Anthropic-Prompt-Caching finden Sie unter:
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

### Beispiel: Gemischter Datenverkehr mit Cache-Strategie pro Agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # Standardbasiswert für die meisten Agenten
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # langen Cache für intensive Sitzungen aktiv halten
    - id: "alerts"
      params:
        cacheRetention: "none" # Cache-Schreibvorgänge für stoßweise Benachrichtigungen vermeiden
```

`agents.entries.*.params` wird über den `params` des ausgewählten Modells zusammengeführt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandardwerte
unverändert übernehmen können.

### Anthropic-Kontext mit 1M

OpenClaw dimensioniert allgemein verfügbare Claude-4.x-Modelle wie Opus 4.8, Opus 4.7, Opus
4.6 und Sonnet 4.6 mit dem 1M-Kontextfenster von Anthropic. Sie benötigen
`params.context1m: true` für diese Modelle nicht.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Ältere Konfigurationen können `context1m: true` beibehalten, aber OpenClaw sendet
den eingestellten Anthropic-Beta-Header `context-1m-2025-08-07` für diese Einstellung nicht mehr und
erweitert nicht unterstützte ältere Claude-Modelle nicht auf 1M.

Voraussetzung: Die Anmeldedaten müssen für die Nutzung langer Kontexte berechtigt sein. Andernfalls
antwortet Anthropic für diese Anfrage mit einem Provider-seitigen Ratenbegrenzungsfehler.

Wenn Sie sich bei Anthropic mit OAuth-/Abonnement-Tokens
(`sk-ant-oat-*`) authentifizieren, behält OpenClaw die für OAuth erforderlichen Anthropic-Beta-
Header bei und entfernt gleichzeitig den eingestellten Beta-Wert `context-1m-*`, falls er noch in
einer älteren Konfiguration vorhanden ist.

## Tipps zur Verringerung des Token-Drucks

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie umfangreiche Tool-Ausgaben in Ihren Workflows.
- Reduzieren Sie `agents.defaults.imageMaxDimensionPx` für Sitzungen mit vielen Screenshots.
- Halten Sie Skill-Beschreibungen kurz (die Skill-Liste wird in den Prompt eingefügt).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeiten.

Die genaue Formel für den Overhead der Skill-Liste finden Sie unter [Skills](/de/tools/skills).

## Verwandte Themen

- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
