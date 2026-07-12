---
read_when:
    - Erläuterung der Token-Nutzung, Kosten oder Kontextfenster
    - Kontextwachstum oder Compaction-Verhalten debuggen
summary: Wie OpenClaw den Prompt-Kontext erstellt und Token-Nutzung sowie Kosten meldet
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-07-12T16:00:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw erfasst **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten
OpenAI-ähnlichen Modelle verwenden bei englischem Text durchschnittlich etwa 4 Zeichen pro Token.

## Aufbau des System-Prompts

OpenClaw stellt bei jedem Lauf einen eigenen System-Prompt zusammen. Er enthält:

- Werkzeugliste + Kurzbeschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen). Native
  Codex-Turns erhalten den kompakten Skills-Block als auf den Turn beschränkte
  Entwickleranweisungen zur Zusammenarbeit; andere Harnesses erhalten ihn im normalen Prompt-Bereich.
  Begrenzt durch `skills.limits.maxSkillsPromptChars`, mit optionaler Überschreibung pro Agent
  unter `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Anweisungen zur Selbstaktualisierung
- Workspace- und Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, bei neuen Instanzen `BOOTSTRAP.md` sowie
  `MEMORY.md`, sofern vorhanden). Große eingefügte Dateien werden durch
  `agents.defaults.bootstrapMaxChars` gekürzt (Standard: `20000`); die gesamte
  Bootstrap-Einfügung ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard:
  `60000`).
  - Native Codex-Turns fügen nicht die unverarbeitete `MEMORY.md` ein, wenn für
    diesen Workspace Speicherwerkzeuge verfügbar sind; stattdessen erhalten sie einen kleinen
    Speicherverweis in den auf den Turn beschränkten Entwickleranweisungen zur Zusammenarbeit und
    verwenden Speicherwerkzeuge bei Bedarf. Wenn Werkzeuge deaktiviert sind, die Speichersuche
    nicht verfügbar ist oder sich der aktive Workspace vom Agent-Speicher-Workspace unterscheidet,
    fällt `MEMORY.md` auf den normalen begrenzten Turn-Kontextpfad zurück.
  - Die kleingeschriebene Stammdatei `memory.md` wird nie eingefügt. Sie dient als Legacy-Reparatureingabe
    für `openclaw doctor --fix`, das sie nach `MEMORY.md` migriert.
  - Die täglichen Dateien `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts;
    bei gewöhnlichen Turns bleiben sie über Speicherwerkzeuge bedarfsgesteuert verfügbar. Modellläufe
    beim Zurücksetzen oder Start können für diesen ersten Turn einen einmaligen Startkontextblock
    mit aktuellem täglichem Speicher voranstellen, gesteuert durch
    `agents.defaults.startupContext`. Reine Chat-Befehle `/new` und `/reset` werden
    bestätigt, ohne das Modell aufzurufen.
  - `AGENTS.md`-Auszüge nach der Compaction sind separat und erfordern eine ausdrückliche
    Aktivierung über `agents.defaults.compaction.postCompactionSections`.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeitmetadaten (Host/Betriebssystem/Modell/Reasoning)

Die vollständige Aufschlüsselung finden Sie unter [System-Prompt](/de/concepts/system-prompt).

Verwenden Sie beim Dokumentieren von Anmeldedaten oder Authentifizierungsausschnitten die
[Konventionen für Secret-Platzhalter](/de/reference/secret-placeholder-conventions), um
Fehlalarme von Secret-Scannern bei reinen Dokumentationsänderungen zu vermeiden.

## Was zum Kontextfenster zählt

Alles, was das Modell empfängt, wird auf das Kontextlimit angerechnet:

- System-Prompt (alle oben genannten Abschnitte)
- Gesprächsverlauf (Nachrichten von Benutzer und Assistent)
- Werkzeugaufrufe und Werkzeugergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Bereinigungsartefakte
- Provider-Wrapper oder Sicherheitsheader (nicht sichtbar, werden aber dennoch angerechnet)

Laufzeitintensive Bereiche haben eigene ausdrückliche Begrenzungen unter
`agents.defaults.contextLimits` (Überschreibungen pro Agent unter
`agents.list[].contextLimits`):

| Schlüssel                 | Zweck                                                                    |
| ------------------------- | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`       | Maximale Zeichenzahl, die `memory_get` vor der Kürzung zurückgibt.        |
| `memoryGetDefaultLines`   | Standardmäßiges `memory_get`-Zeilenfenster, wenn eine Anfrage `lines` auslässt. |
| `toolResultMaxChars`      | Erweiterte Obergrenze für ein einzelnes Live-Werkzeugergebnis (bis zu `1000000` Zeichen). |
| `postCompactionMaxChars`  | Maximale Zeichenzahl, die bei der Aktualisierung nach der Compaction aus `AGENTS.md` beibehalten wird. |

Dies sind begrenzte Laufzeitauszüge und von der Laufzeit verwaltete eingefügte Blöcke,
getrennt von Bootstrap-Limits, Startkontext-Limits und Limits für den Skills-Prompt.

`toolResultMaxChars` ist standardmäßig nicht gesetzt, daher leitet OpenClaw die Obergrenze
für Live-Werkzeugergebnisse aus dem effektiven Modellkontextfenster ab: `16000` Zeichen bei
weniger als 100K Tokens, `32000` Zeichen ab 100K Tokens, `64000` Zeichen ab 200K Tokens.
Die Laufzeitbegrenzung für den Kontextanteil beschränkt ein einzelnes Werkzeugergebnis weiterhin
auf 30 % des Kontextfensters, selbst wenn eine größere ausdrückliche Obergrenze konfiguriert ist.

Bei Bildern verkleinert OpenClaw Bildnutzlasten aus Transkripten und Werkzeugen vor
Provider-Aufrufen. Passen Sie dies mit `agents.defaults.imageMaxDimensionPx` an (Standard:
`1200`):

- Niedrigere Werte reduzieren den Verbrauch von Vision-Tokens und die Nutzlastgröße.
- Höhere Werte bewahren mehr visuelle Details für OCR- oder UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro eingefügter Datei, Werkzeuge, Skills und Größe des
System-Prompts) verwenden Sie `/context list` oder `/context detail`. Siehe
[Kontext](/de/concepts/context).

## Aktuelle Token-Nutzung anzeigen

Im Chat:

- `/status` -> Emoji-reiche Statuskarte mit dem Sitzungsmodell, der Kontextnutzung,
  den Eingabe-/Ausgabe-Tokens der letzten Antwort und den geschätzten Kosten, wenn für
  das aktive Modell lokale Preise konfiguriert sind.
- `/usage off|tokens|full` -> hängt an jede Antwort eine Nutzungsfußzeile pro Antwort
  an. Bleibt pro Sitzung erhalten (als `responseUsage` gespeichert).
  - `/usage reset` (Aliase: `inherit`, `clear`, `default`) löscht die
    Sitzungsüberschreibung, sodass wieder der konfigurierte Standard übernommen wird.
  - `/usage tokens` zeigt Token- und Cache-Details des Turns.
  - `/usage full` zeigt kompakte Modell-/Kontext-/Kostendetails; geschätzte Kosten
    erscheinen nur, wenn OpenClaw über Nutzungsmetadaten und lokale Preise für das
    aktive Modell verfügt. Benutzerdefinierte Layouts für `messages.usageTemplate` können
    Token-/Cache-Felder enthalten.
- `/usage cost` -> lokale Kostenzusammenfassung aus OpenClaw-Sitzungsprotokollen.

Weitere Oberflächen:

- **TUI/Web-TUI:** `/status` und `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Kontingentfenster (`X% left`, keine Kosten pro Antwort).
  Derzeitige Provider für Nutzungsfenster: Claude (Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige native Feldaliase der Provider.
Für Responses-Datenverkehr der OpenAI-Familie umfasst dies sowohl
`input_tokens`/`output_tokens` als auch `prompt_tokens`/`completion_tokens`, sodass
transportspezifische Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht
verändern. Auch die Nutzung der Gemini CLI wird normalisiert: Der standardmäßige
`stream-json`-Parser liest `message`-Ereignisse des Assistenten, und `stats.cached` wird
`cacheRead` zugeordnet, wobei `stats.input_tokens - stats.cached` verwendet wird, wenn die CLI
kein ausdrückliches Feld `stats.input` liefert. Legacy-JSON-Überschreibungen lesen den
Antworttext weiterhin aus `response`.

Bei nativem Responses-Datenverkehr der OpenAI-Familie werden WebSocket-/SSE-Nutzungsaliase
auf dieselbe Weise normalisiert, und Gesamtwerte greifen auf die normalisierte Summe aus Ein- und
Ausgabe zurück, wenn `total_tokens` fehlt oder `0` ist.

Wenn der aktuelle Sitzungssnapshot nur wenige Daten enthält, können `/status` und `session_status`
Token-/Cache-Zähler und die Bezeichnung des aktiven Laufzeitmodells aus dem neuesten
Nutzungsprotokoll des Transkripts wiederherstellen. Vorhandene von null verschiedene Live-Werte
haben weiterhin Vorrang vor Transkript-Rückfallwerten, und größere promptorientierte
Transkript-Gesamtwerte können Vorrang erhalten, wenn gespeicherte Gesamtwerte fehlen oder kleiner sind.

Die Nutzungsauthentifizierung für Provider-Kontingentfenster stammt zuerst aus
Provider-spezifischen Hooks; wenn ein Provider keinen Hook besitzt (oder der Hook kein Token
auflöst), greift OpenClaw auf passende OAuth-/API-Schlüssel-Anmeldedaten aus
Authentifizierungsprofilen, Umgebungsvariablen oder der Konfiguration zurück.

Assistenteneinträge im Transkript speichern dieselbe normalisierte Nutzungsstruktur,
einschließlich `usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der
Provider Nutzungsmetadaten zurückgibt. Dadurch erhalten `/usage cost` und der
transkriptgestützte Sitzungsstatus eine stabile Quelle, selbst nachdem der Live-Laufzeitzustand
nicht mehr vorhanden ist.

OpenClaw hält die Nutzungsabrechnung des Providers vom aktuellen Kontextsnapshot getrennt.
`usage.total` des Providers kann zwischengespeicherte Eingaben, Ausgaben und mehrere
Modellaufrufe in Werkzeugschleifen enthalten. Daher ist der Wert für Kosten und Telemetrie
nützlich, kann das Live-Kontextfenster jedoch zu hoch angeben. Kontextanzeigen und Diagnosen
verwenden für `context.used` den neuesten Prompt-Snapshot (`promptTokens` oder den letzten
Modellaufruf, wenn kein Prompt-Snapshot verfügbar ist).

## Kostenschätzung (sofern angezeigt)

Die Kosten werden anhand Ihrer Modellpreiskonfiguration geschätzt:

```text
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preise fehlen, lässt `/usage full` die Kosten aus; verwenden Sie
`/usage tokens` oder ein benutzerdefiniertes `messages.usageTemplate`, wenn Sie
Token-/Cache-Details in jeder Antwort benötigen. Die Kostenanzeige ist nicht auf die
Authentifizierung per API-Schlüssel beschränkt: Provider ohne API-Schlüssel wie `aws-sdk`
können geschätzte Kosten anzeigen, wenn ihr konfigurierter Modelleintrag lokale Preise enthält
und der Provider Nutzungsmetadaten zurückgibt.

Nachdem Sidecars und Kanäle den Bereitschaftspfad des Gateways erreicht haben, startet OpenClaw
optional im Hintergrund einen Preis-Bootstrap für konfigurierte Modellreferenzen, die noch
keine lokalen Preise besitzen. Dieser Bootstrap ruft entfernte Preiskataloge von OpenRouter und
LiteLLM ab. Setzen Sie `models.pricing.enabled: false`, um diese Katalogabrufe in
Offline- oder eingeschränkten Netzwerken zu überspringen; ausdrückliche Einträge unter
`models.providers.*.models[].cost` steuern weiterhin lokale Kostenschätzungen.

## Auswirkungen von Cache-TTL und Bereinigung

Das Prompt-Caching des Providers gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw
kann optional eine **Cache-TTL-Bereinigung** ausführen: Nach Ablauf der Cache-TTL wird die
Sitzung bereinigt und anschließend das Cache-Fenster zurückgesetzt, sodass nachfolgende Anfragen
den frisch zwischengespeicherten Kontext wiederverwenden, anstatt den gesamten Verlauf erneut
zwischenzuspeichern. Dadurch bleiben die Cache-Schreibkosten niedriger, wenn eine Sitzung länger
als die TTL inaktiv bleibt.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Sitzungsbereinigung](/de/concepts/session-pruning).

Heartbeat kann den Cache über Inaktivitätsphasen hinweg **warm** halten. Wenn die Cache-TTL
Ihres Modells `1h` beträgt, kann ein Heartbeat-Intervall knapp darunter (z. B. `55m`)
verhindern, dass der vollständige Prompt erneut zwischengespeichert wird, wodurch die
Cache-Schreibkosten sinken.

In Multi-Agent-Konfigurationen können Sie eine gemeinsame Modellkonfiguration verwenden und das
Cache-Verhalten pro Agent mit `agents.list[].params.cacheRetention` anpassen.

Eine vollständige Anleitung für jede einzelne Einstellung finden Sie unter
[Prompt-Caching](/de/reference/prompt-caching).

Bei der Anthropic-API-Preisgestaltung sind Cache-Lesevorgänge erheblich günstiger als
Eingabe-Tokens, während Cache-Schreibvorgänge mit einem höheren Multiplikator abgerechnet werden.
Die neuesten Preise und TTL-Multiplikatoren finden Sie in der Anthropic-Preisübersicht zum
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

### Beispiel: Gemischter Datenverkehr mit Cache-Strategie pro Agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # standardmäßige Ausgangsbasis für die meisten Agenten
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # langen Cache für umfangreiche Sitzungen warm halten
    - id: "alerts"
      params:
        cacheRetention: "none" # Cache-Schreibvorgänge für stoßweise Benachrichtigungen vermeiden
```

`agents.list[].params` wird über die `params` des ausgewählten Modells gelegt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandards unverändert übernehmen können.

### Anthropic-Kontext mit 1M Tokens

OpenClaw dimensioniert GA-fähige Claude-4.x-Modelle wie Opus 4.8, Opus 4.7, Opus
4.6 und Sonnet 4.6 mit dem 1M-Kontextfenster von Anthropic. Für diese Modelle benötigen Sie
`params.context1m: true` nicht.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Ältere Konfigurationen können `context1m: true` beibehalten, aber OpenClaw sendet für diese
Einstellung nicht mehr den eingestellten Anthropic-Beta-Header `context-1m-2025-08-07` und
erweitert nicht unterstützte ältere Claude-Modelle nicht auf 1M.

Voraussetzung: Die Zugangsdaten müssen für die Nutzung mit langem Kontext berechtigt sein. Andernfalls
antwortet Anthropic für diese Anfrage mit einem Provider-seitigen Ratenbegrenzungsfehler.

Wenn Sie sich bei Anthropic mit OAuth-/Abonnement-Token
(`sk-ant-oat-*`) authentifizieren, behält OpenClaw die für OAuth erforderlichen Anthropic-Beta-
Header bei und entfernt gleichzeitig die eingestellte `context-1m-*`-Beta, falls sie noch in
älteren Konfigurationen vorhanden ist.

## Tipps zum Reduzieren der Token-Belastung

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie umfangreiche Werkzeugausgaben in Ihren Workflows.
- Verringern Sie `agents.defaults.imageMaxDimensionPx` für Sitzungen mit vielen Screenshots.
- Halten Sie Skill-Beschreibungen kurz (die Skill-Liste wird in den Prompt eingefügt).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeiten.

Die genaue Formel für den Zusatzaufwand durch die Skill-Liste finden Sie unter [Skills](/de/tools/skills).

## Verwandte Themen

- [API-Nutzung und -Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
