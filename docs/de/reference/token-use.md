---
read_when:
    - Erläuterung der Token-Nutzung, Kosten oder Kontextfenster
    - Kontextwachstum oder Compaction-Verhalten debuggen
summary: Wie OpenClaw Prompt-Kontext erstellt und Token-Nutzung sowie Kosten ausweist
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-07-12T02:10:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw erfasst **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, bei den meisten
OpenAI-ähnlichen Modellen entsprechen im englischen Text jedoch durchschnittlich etwa 4 Zeichen einem Token.

## So wird der System-Prompt erstellt

OpenClaw stellt bei jedem Lauf einen eigenen System-Prompt zusammen. Er enthält:

- Werkzeugliste und Kurzbeschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen). Native
  Codex-Turns erhalten den kompakten Skills-Block als auf den Turn beschränkte
  Entwickleranweisungen für die Zusammenarbeit; andere Harnesses erhalten ihn auf der normalen Prompt-Oberfläche.
  Begrenzt durch `skills.limits.maxSkillsPromptChars`, mit optionaler Überschreibung pro Agent unter
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Anweisungen zur Selbstaktualisierung
- Workspace- und Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, bei neuen Workspaces `BOOTSTRAP.md` sowie
  `MEMORY.md`, sofern vorhanden). Große eingefügte Dateien werden durch
  `agents.defaults.bootstrapMaxChars` gekürzt (Standard: `20000`); die gesamte Bootstrap-
  Einfügung ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard:
  `60000`).
  - Native Codex-Turns fügen den Rohinhalt von `MEMORY.md` nicht ein, wenn für
    diesen Workspace Speicherwerkzeuge verfügbar sind; stattdessen erhalten sie einen kurzen Speicherverweis in
    den auf den Turn beschränkten Entwickleranweisungen für die Zusammenarbeit und verwenden Speicherwerkzeuge
    bei Bedarf. Wenn Werkzeuge deaktiviert sind, die Speichersuche nicht verfügbar ist oder
    der aktive Workspace vom Speicher-Workspace des Agenten abweicht, wird `MEMORY.md`
    ersatzweise über den normalen begrenzten Turn-Kontext bereitgestellt.
  - Die kleingeschriebene Stammdatei `memory.md` wird niemals eingefügt. Sie dient als Legacy-Reparatureingabe
    für `openclaw doctor --fix`, das sie nach `MEMORY.md` migriert.
  - Die täglichen Dateien unter `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts;
    in gewöhnlichen Turns bleiben sie über Speicherwerkzeuge bei Bedarf verfügbar. Modellläufe beim Zurücksetzen oder Starten
    können für diesen ersten Turn einmalig einen Startkontextblock mit aktuellen
    täglichen Speichereinträgen voranstellen, gesteuert durch
    `agents.defaults.startupContext`. Die reinen Chat-Befehle `/new` und `/reset` werden
    bestätigt, ohne das Modell aufzurufen.
  - Auszüge aus `AGENTS.md` nach der Compaction werden separat behandelt und erfordern eine ausdrückliche
    Aktivierung über `agents.defaults.compaction.postCompactionSections`.
- Zeit (UTC und Zeitzone des Benutzers)
- Antwort-Tags und Heartbeat-Verhalten
- Laufzeitmetadaten (Host/Betriebssystem/Modell/Denkmodus)

Die vollständige Aufschlüsselung finden Sie unter [System-Prompt](/de/concepts/system-prompt).

Verwenden Sie beim Dokumentieren von Zugangsdaten oder Authentifizierungsausschnitten die
[Konventionen für Geheimnisplatzhalter](/de/reference/secret-placeholder-conventions), um
Fehlalarme von Geheimnisscannern bei reinen Dokumentationsänderungen zu vermeiden.

## Was zum Kontextfenster zählt

Alles, was das Modell empfängt, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Nachrichten von Benutzer und Assistent)
- Werkzeugaufrufe und Werkzeugergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Bereinigungsartefakte
- Provider-Wrapper oder Sicherheitsheader (nicht sichtbar, werden aber dennoch gezählt)

Laufzeitintensive Oberflächen haben eigene ausdrückliche Grenzen unter
`agents.defaults.contextLimits` (agentenspezifische Überschreibungen unter
`agents.list[].contextLimits`):

| Schlüssel                 | Zweck                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `memoryGetMaxChars`       | Maximale Zeichenzahl, die `memory_get` vor der Kürzung zurückgibt.                     |
| `memoryGetDefaultLines`   | Standardmäßiges Zeilenfenster von `memory_get`, wenn eine Anfrage `lines` auslässt.    |
| `toolResultMaxChars`      | Erweiterte Obergrenze für ein einzelnes Live-Werkzeugergebnis (bis zu `1000000` Zeichen). |
| `postCompactionMaxChars`  | Maximale Zeichenzahl, die beim Aktualisieren nach der Compaction aus `AGENTS.md` beibehalten wird. |

Dabei handelt es sich um begrenzte Laufzeitauszüge und von der Laufzeit eingefügte Blöcke,
die von Bootstrap-Grenzen, Startkontextgrenzen und Grenzen des Skills-Prompts
getrennt sind.

`toolResultMaxChars` ist standardmäßig nicht gesetzt. OpenClaw leitet daher die Live-
Grenze für Werkzeugergebnisse aus dem effektiven Kontextfenster des Modells ab: `16000` Zeichen bei weniger als
100.000 Tokens, `32000` Zeichen ab 100.000 Tokens und `64000` Zeichen ab 200.000 Tokens.
Die Laufzeitschutzgrenze für den Kontextanteil begrenzt ein einzelnes Werkzeugergebnis weiterhin auf 30 % des
Kontextfensters, selbst wenn eine höhere ausdrückliche Obergrenze konfiguriert ist.

Bei Bildern verkleinert OpenClaw Bildnutzlasten aus Transkripten und Werkzeugen vor
Provider-Aufrufen. Passen Sie dies mit `agents.defaults.imageMaxDimensionPx` an (Standard:
`1200`):

- Niedrigere Werte reduzieren den Verbrauch von Vision-Tokens und die Nutzlastgröße.
- Höhere Werte bewahren mehr visuelle Details für Screenshots mit hohem OCR-/UI-Anteil.

Eine praktische Aufschlüsselung nach eingefügter Datei, Werkzeugen, Skills und Größe des
System-Prompts erhalten Sie mit `/context list` oder `/context detail`. Siehe
[Kontext](/de/concepts/context).

## So zeigen Sie die aktuelle Token-Nutzung an

Im Chat:

- `/status` -> statusreiche Karte mit Emojis, die das Sitzungsmodell, die Kontextnutzung,
  die Ein- und Ausgabe-Tokens der letzten Antwort sowie die geschätzten Kosten anzeigt, wenn lokale Preise für
  das aktive Modell konfiguriert sind.
- `/usage off|tokens|full` -> fügt jeder Antwort eine Nutzungsfußzeile pro Antwort hinzu.
  Bleibt pro Sitzung bestehen (gespeichert als `responseUsage`).
  - `/usage reset` (Aliasse: `inherit`, `clear`, `default`) löscht die
    Sitzungsüberschreibung, sodass wieder der konfigurierte Standard übernommen wird.
  - `/usage tokens` zeigt Token- und Cache-Details des Turns.
  - `/usage full` zeigt kompakte Modell-, Kontext- und Kostendetails; geschätzte Kosten
    erscheinen nur, wenn OpenClaw über Nutzungsmetadaten und lokale Preise für das
    aktive Modell verfügt. Benutzerdefinierte Layouts unter `messages.usageTemplate` können
    Token- und Cache-Felder enthalten.
- `/usage cost` -> lokale Kostenzusammenfassung aus den OpenClaw-Sitzungsprotokollen.

Weitere Oberflächen:

- **TUI/Web-TUI:** `/status` und `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Kontingentfenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider für Nutzungsfenster: Claude (Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan und z.ai.

Vor der Anzeige normalisieren die Nutzungsoberflächen gängige Aliasse nativer Provider-Felder.
Für Responses-Datenverkehr der OpenAI-Familie umfasst dies sowohl
`input_tokens`/`output_tokens` als auch `prompt_tokens`/`completion_tokens`, sodass
transportspezifische Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen
nicht verändern. Auch die Nutzung der Gemini CLI wird normalisiert: Der standardmäßige
`stream-json`-Parser liest `message`-Ereignisse des Assistenten, und `stats.cached` wird
`cacheRead` zugeordnet; `stats.input_tokens - stats.cached` wird verwendet, wenn die CLI
kein ausdrückliches Feld `stats.input` liefert. Legacy-JSON-Überschreibungen lesen den Antworttext
weiterhin aus `response`.

Bei nativem Responses-Datenverkehr der OpenAI-Familie werden WebSocket-/SSE-Nutzungsaliasse
auf dieselbe Weise normalisiert, und Gesamtwerte werden ersatzweise aus normalisierter Ein- und Ausgabe
gebildet, wenn `total_tokens` fehlt oder `0` ist.

Wenn der aktuelle Sitzungssnapshot nur wenige Daten enthält, können `/status` und `session_status`
Token-/Cache-Zähler sowie die aktive Laufzeitmodellbezeichnung aus dem
neuesten Transkript-Nutzungsprotokoll wiederherstellen. Vorhandene Live-Werte ungleich null haben weiterhin
Vorrang vor Ersatzwerten aus dem Transkript, und größere promptbezogene
Transkript-Gesamtwerte können sich durchsetzen, wenn gespeicherte Gesamtwerte fehlen oder kleiner sind.

Die Nutzungsauthentifizierung für Provider-Kontingentfenster stammt zuerst aus providerspezifischen Hooks.
Wenn ein Provider keinen Hook hat oder der Hook kein Token auflösen kann,
greift OpenClaw ersatzweise auf passende OAuth-/API-Schlüssel-Zugangsdaten aus Authentifizierungsprofilen,
Umgebungsvariablen oder der Konfiguration zurück.

Transkripteinträge des Assistenten speichern dieselbe normalisierte Nutzungsstruktur,
einschließlich `usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der
Provider Nutzungsmetadaten zurückgibt. Dadurch erhalten `/usage cost` und der
transkriptgestützte Sitzungsstatus eine stabile Quelle, selbst nachdem der Live-
Laufzeitstatus nicht mehr vorhanden ist.

OpenClaw hält die Nutzungsabrechnung des Providers vom aktuellen Kontextsnapshot
getrennt. `usage.total` des Providers kann zwischengespeicherte Eingaben, Ausgaben und
mehrere Modellaufrufe in Werkzeugschleifen umfassen. Der Wert ist daher für Kosten und Telemetrie nützlich,
kann aber das aktive Kontextfenster zu groß darstellen. Kontextanzeigen und Diagnosen verwenden
für `context.used` den neuesten Prompt-Snapshot (`promptTokens` oder den letzten Modellaufruf,
wenn kein Prompt-Snapshot verfügbar ist).

## Kostenschätzung (wenn angezeigt)

Die Kosten werden anhand Ihrer Modellpreiskonfiguration geschätzt:

```text
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preisangaben fehlen, lässt `/usage full` die Kosten aus. Verwenden Sie
`/usage tokens` oder ein benutzerdefiniertes `messages.usageTemplate`, wenn Sie
Token-/Cache-Details in jeder Antwort benötigen. Die Kostenanzeige ist nicht auf die Authentifizierung per API-Schlüssel
beschränkt: Provider ohne API-Schlüssel wie `aws-sdk` können geschätzte Kosten anzeigen, wenn
ihr konfigurierter Modelleintrag lokale Preise enthält und der Provider
Nutzungsmetadaten zurückgibt.

Nachdem Sidecars und Kanäle den Bereitschaftspfad des Gateways erreicht haben, startet OpenClaw einen
optionalen Hintergrundprozess zum Laden von Preisen für konfigurierte Modellreferenzen, die noch
keine lokalen Preise haben. Dieser Prozess ruft entfernte Preiskataloge von OpenRouter und
LiteLLM ab. Setzen Sie `models.pricing.enabled: false`, um diese
Katalogabrufe in Offline- oder eingeschränkten Netzwerken zu überspringen; ausdrückliche Einträge unter
`models.providers.*.models[].cost` bestimmen weiterhin lokale Kostenschätzungen.

## Auswirkungen von Cache-TTL und Bereinigung

Das Prompt-Caching des Providers gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw
kann optional eine **Cache-TTL-Bereinigung** ausführen: Nach Ablauf der Cache-TTL
bereinigt es die Sitzung und setzt anschließend das Cache-Fenster zurück, sodass nachfolgende Anfragen
den frisch zwischengespeicherten Kontext wiederverwenden, statt den gesamten Verlauf erneut zwischenzuspeichern.
Dadurch bleiben die Cache-Schreibkosten niedriger, wenn eine Sitzung länger als die TTL inaktiv ist.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration), und lesen Sie die
Verhaltensdetails unter [Sitzungsbereinigung](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn die Cache-
TTL Ihres Modells `1h` beträgt, kann ein Heartbeat-Intervall knapp darunter, beispielsweise `55m`,
das erneute Zwischenspeichern des vollständigen Prompts vermeiden und so die Cache-Schreibkosten senken.

In Konfigurationen mit mehreren Agenten können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-
Verhalten pro Agent mit `agents.list[].params.cacheRetention` anpassen.

Eine vollständige Beschreibung aller Einstellungen finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).

Bei der Anthropic-API-Preisgestaltung sind Cache-Lesevorgänge deutlich günstiger als Eingabe-
Tokens, während Cache-Schreibvorgänge mit einem höheren Multiplikator berechnet werden. Die aktuellen Preise und TTL-Multiplikatoren
finden Sie in Anthropics Preisübersicht zum Prompt-Caching:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Beispiel: 1-Stunden-Cache mit Heartbeat warm halten

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
          cacheRetention: "long" # Standardbasis für die meisten Agenten
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # langen Cache für umfangreiche Sitzungen warm halten
    - id: "alerts"
      params:
        cacheRetention: "none" # Cache-Schreibvorgänge bei stoßweisen Benachrichtigungen vermeiden
```

`agents.list[].params` wird mit den `params` des ausgewählten Modells zusammengeführt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandards unverändert
übernehmen können.

### Anthropic-Kontext mit 1 Mio. Tokens

OpenClaw verwendet für allgemein verfügbare Claude-4.x-Modelle wie Opus 4.8, Opus 4.7, Opus
4.6 und Sonnet 4.6 das Anthropic-Kontextfenster mit 1 Mio. Tokens. Für diese Modelle benötigen Sie
`params.context1m: true` nicht.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Ältere Konfigurationen können `context1m: true` beibehalten, OpenClaw sendet für
diese Einstellung jedoch nicht mehr Anthropics eingestellten Beta-Header
`context-1m-2025-08-07` und erweitert nicht unterstützte ältere Claude-Modelle
nicht auf 1 Mio. Tokens.

Anforderung: Die Anmeldedaten müssen für die Nutzung langer Kontexte geeignet sein. Andernfalls
antwortet Anthropic für diese Anfrage mit einem Provider-seitigen Fehler wegen einer Ratenbegrenzung.

Wenn Sie sich bei Anthropic mit OAuth-/Abonnement-Tokens
(`sk-ant-oat-*`) authentifizieren, behält OpenClaw die für OAuth erforderlichen Anthropic-Beta-
Header bei und entfernt zugleich das eingestellte `context-1m-*`-Beta, falls es noch in einer
älteren Konfiguration enthalten ist.

## Tipps zur Verringerung des Token-Drucks

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Verringern Sie `agents.defaults.imageMaxDimensionPx` für Sitzungen mit vielen Screenshots.
- Halten Sie Skill-Beschreibungen kurz (die Skill-Liste wird in den Prompt eingefügt).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeiten.

Die genaue Formel für den zusätzlichen Umfang der Skill-Liste finden Sie unter [Skills](/de/tools/skills).

## Verwandte Themen

- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
