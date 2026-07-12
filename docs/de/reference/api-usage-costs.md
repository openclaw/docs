---
read_when:
    - Sie möchten verstehen, welche Funktionen möglicherweise kostenpflichtige APIs aufrufen.
    - Sie müssen Schlüssel, Kosten und die Sichtbarkeit der Nutzung prüfen
    - Sie erläutern die Kostenanzeige von /status oder /usage.
summary: Prüfen Sie, welche Komponenten Kosten verursachen können, welche Schlüssel verwendet werden und wie Sie die Nutzung anzeigen können.
title: API-Nutzung und Kosten
x-i18n:
    generated_at: "2026-07-12T15:50:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Übersicht der OpenClaw-Funktionen, die kostenpflichtige Provider-APIs aufrufen können, wo sie jeweils ihre Anmeldedaten lesen und wo die daraus entstehenden Kosten angezeigt werden.

## Wo Kosten angezeigt werden

**`/status`** (Momentaufnahme pro Sitzung)

- Zeigt das aktuelle Sitzungsmodell, die Kontextnutzung und die Token der letzten Antwort.
- Fügt für die letzte Antwort **geschätzte Kosten** hinzu, wenn OpenClaw über Nutzungsmetadaten und lokale Preisinformationen für das aktive Modell verfügt. Dies schließt ausdrücklich bepreiste Provider ohne API-Schlüssel ein, beispielsweise Bedrock-Modelle mit `aws-sdk`.
- Wenn die aktuelle Sitzungsmomentaufnahme nur wenige Daten enthält, stellt `/status` die Token-/Cache-Zähler und die Bezeichnung des aktiven Modells aus dem neuesten Nutzungseintrag des Transkripts wieder her. Vorhandene Live-Werte ungleich null haben Vorrang vor Transkriptdaten; eine promptgroße Transkript-Gesamtsumme kann dennoch Vorrang haben, wenn die gespeicherte Gesamtsumme fehlt oder kleiner ist.

**`/usage`** (Fußzeile pro Nachricht)

- `/usage full` fügt jeder Antwort eine Nutzungsfußzeile hinzu, einschließlich **geschätzter Kosten**, wenn lokale Preisinformationen konfiguriert und Nutzungsmetadaten verfügbar sind.
- `/usage tokens` zeigt nur Token an. Abonnementbasierte OAuth-/Token- und CLI-Runtimes zeigen nur Token an, sofern sie nicht kompatible Nutzungsmetadaten sowie einen expliziten lokalen Preis bereitstellen.
- `/usage cost` gibt eine lokale Kostenzusammenfassung aus; `/usage off` deaktiviert die Fußzeile.
- Hinweis zur Gemini CLI: Sowohl die Ausgabe `stream-json` als auch die ältere Ausgabe `json` enthalten Nutzungsdaten unter `stats`. OpenClaw normalisiert `stats.cached` zu `cacheRead` und leitet Eingabe-Token bei Bedarf aus `stats.input_tokens - stats.cached` ab.

**Control UI → Nutzung** (sitzungsübergreifende Analyse)

- Zeigt aus Transkripten abgeleitete Token-Gesamtsummen und geschätzte Kostensummen für den ausgewählten Datumsbereich an, aufgeschlüsselt nach Provider, Modell, Agent, Kanal und Token-Typ.
- Vergleicht kürzere Kalenderzeiträume, die am Enddatum des ausgewählten Bereichs enden. Fehlende Datumswerte gelten als Kalendertage ohne Nutzung; sie werden nicht übersprungen, um einen dichteren Zeitraum zu erzeugen.
- Beschriftet die Skala des Tagesdiagramms direkt. Ein `√`-Abzeichen bedeutet, dass eine Quadratwurzelkompression Tage mit geringer Nutzung sichtbar hält.
- Diese Summen beschreiben den verfügbaren lokalen Sitzungsverlauf, nicht eine Provider-Rechnung oder ein Abrechnungsbuch über die gesamte Laufzeit. Die Benutzeroberfläche warnt, wenn für einige Einträge Preisinformationen fehlen.

**CLI-Nutzungszeiträume** (Provider-Kontingente, keine Kosten pro Nachricht)

- `openclaw status --usage` und `openclaw channels list` zeigen **Nutzungszeiträume** des Providers als `X% left` an.
- Aktuelle Provider für Nutzungszeiträume: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (umfasst ChatGPT-/Codex-OAuth-/Token-Authentifizierung), Xiaomi und z.ai. Die vollständige Liste der Provider und Flags finden Sie unter [Modell-CLI](/de/cli/models) und [Kanal-CLI](/de/cli/channels).
- Die Rohfelder `usage_percent` / `usagePercent` von MiniMax geben das verbleibende Kontingent an, daher invertiert OpenClaw sie; anzahlbasierte Felder haben Vorrang, wenn sie vorhanden sind. Wenn die Antwort ein Array `model_remains` enthält, wählt OpenClaw den Eintrag für das Chatmodell aus, leitet bei Bedarf die Bezeichnung des Zeitraums aus Zeitstempeln ab und fügt den Modellnamen in die Tarifbezeichnung ein.
- Die Authentifizierung für die Nutzungsabfrage stammt aus providerspezifischen Hooks, sofern verfügbar. Andernfalls greift OpenClaw auf passende OAuth-/API-Schlüssel-Anmeldedaten aus Authentifizierungsprofilen, Umgebungsvariablen oder der Konfiguration zurück.

Ausführliche Beispiele finden Sie unter [Token-Nutzung und Kosten](/de/reference/token-use).

<Note>
Anthropic hat bestätigt, dass die Wiederverwendung der Claude CLI (einschließlich `claude -p`) ein zulässiges Integrationsmuster ist, sofern keine neue Richtlinie veröffentlicht wird. Anthropic stellt keine Kostenschätzung pro Nachricht in Dollar bereit, daher kann `/usage full` keine Kosten für die Nutzung der Claude CLI anzeigen.
</Note>

## So werden Schlüssel ermittelt

- **Authentifizierungsprofile**: pro Agent, gespeichert in `auth-profiles.json`.
- **Umgebungsvariablen**: beispielsweise `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Konfiguration**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, wodurch der Schlüssel möglicherweise in die Prozessumgebung des Skills exportiert wird.

## Funktionen, die Schlüssel kostenpflichtig verwenden können

### Antworten des Kernmodells (Chat + Tools)

Jede Antwort und jeder Tool-Aufruf wird über den aktuellen Modell-Provider ausgeführt. Dies ist die Hauptquelle für Nutzung und Kosten, einschließlich abonnementbasierter gehosteter Tarife, deren Abrechnung außerhalb der lokalen Benutzeroberfläche von OpenClaw erfolgt: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan und der Claude-Anmeldepfad von Anthropic mit aktivierter Extra Usage.

Informationen zur Preiskonfiguration finden Sie unter [Modelle](/de/providers/models) und zur Anzeige unter [Token-Nutzung und Kosten](/de/reference/token-use).

### Medienanalyse (Audio/Bild/Video)

Eingehende Medien können über eine Provider-API zusammengefasst oder transkribiert werden, bevor die Antwortpipeline ausgeführt wird. Die Provider-Unterstützung wird für jedes Plugin einzeln registriert und ändert sich, wenn Plugins hinzugefügt werden. Die aktuelle Liste und Konfiguration finden Sie unter [Medienanalyse](/de/nodes/media-understanding).

### Bild- und Videogenerierung

`image_generate` und `video_generate` leiten Anfragen an den jeweils verfügbaren konfigurierten Provider weiter. Die Bildgenerierung kann einen durch Authentifizierungsdaten gestützten Standard-Provider ableiten, wenn `agents.defaults.imageGenerationModel` nicht festgelegt ist; für die Videogenerierung muss `agents.defaults.videoGenerationModel` explizit festgelegt sein (beispielsweise `qwen/wan2.6-t2v`).

Die aktuelle Provider-Liste finden Sie unter [Bildgenerierung](/de/tools/image-generation) und [Videogenerierung](/de/tools/video-generation).

### Speicher-Embeddings und semantische Suche

Die semantische Speichersuche verwendet Embedding-APIs, wenn `agents.defaults.memorySearch.provider` einen entfernten Adapter angibt (beispielsweise `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memorySearch.provider = "lmstudio"` oder `"ollama"` wird über einen lokalen beziehungsweise selbst gehosteten Server ausgeführt und verursacht üblicherweise keine Abrechnung für gehostete Dienste. Mit `memorySearch.provider = "local"` verbleibt alles auf dem Gerät, ohne API-Nutzung. Ein optionaler Provider unter `memorySearch.fallback` kann Fehler lokaler Embeddings abfangen.

Siehe [Speicher](/de/concepts/memory).

### Tool für die Websuche

Für `web_search` können abhängig vom ausgewählten Provider Nutzungsgebühren anfallen. Jeder Provider liest seinen Schlüssel zuerst aus einer Umgebungsvariable und anschließend aus `plugins.entries.<id>.config.webSearch.apiKey`:

| Provider               | Umgebungsvariable(n)                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                                             |
| DuckDuckGo             | ohne Schlüssel; inoffiziell, HTML-basiert, keine Abrechnung                                                                                                                                 |
| Exa                    | `EXA_API_KEY`                                                                                                                                                                               |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                                         |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                                            |
| Grok (xAI)             | xAI-OAuth-Profil oder `XAI_API_KEY`                                                                                                                                                          |
| Kimi (Moonshot)        | `KIMI_API_KEY` oder `MOONSHOT_API_KEY`                                                                                                                                                       |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY`                                                                                              |
| Ollama Web Search      | ohne Schlüssel für einen erreichbaren, angemeldeten lokalen Host; die direkte Suche über `https://ollama.com` verwendet `OLLAMA_API_KEY`; authentifizierungsgeschützte Hosts verwenden die reguläre Bearer-Authentifizierung des Ollama-Providers erneut |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                                          |
| Perplexity Search API  | `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`                                                                                                                                               |
| SearXNG                | `SEARXNG_BASE_URL`; ohne Schlüssel/selbst gehostet, keine Abrechnung für gehostete Dienste                                                                                                   |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                                            |

Ältere Konfigurationspfade unter `tools.web.search.*` werden weiterhin über einen Kompatibilitäts-Shim geladen, sind jedoch nicht mehr die empfohlene Schnittstelle.

**Kostenloses Guthaben für Brave Search**: Jeder Tarif enthält ein monatlich erneuertes kostenloses Guthaben von $5. Der Search-Tarif kostet $5 pro 1,000 Anfragen, sodass das Guthaben 1,000 Anfragen pro Monat kostenlos abdeckt. Legen Sie im Brave-Dashboard ein Nutzungslimit fest, um unerwartete Gebühren zu vermeiden.

Siehe [Web-Tools](/de/tools/web).

### Tool zum Abrufen von Webinhalten (Firecrawl)

`web_fetch` kann Firecrawl mit einem schlüssellosen Starterzugang aufrufen; fügen Sie `FIRECRAWL_API_KEY` (oder `plugins.entries.firecrawl.config.webFetch.apiKey`) hinzu, um höhere Limits zu erhalten. Wenn Firecrawl nicht konfiguriert ist, greift das Tool auf einen direkten Abruf sowie das gebündelte Plugin `web-readability` zurück (keine kostenpflichtige API). Deaktivieren Sie `plugins.entries.web-readability.enabled`, um die lokale Readability-Extraktion zu überspringen.

Siehe [Web-Tools](/de/tools/web).

### Momentaufnahmen der Provider-Nutzung (Status/Zustand)

`openclaw status --usage` und `openclaw models status --json` rufen Endpunkte zur Provider-Nutzung auf, um Kontingentzeiträume oder den Authentifizierungszustand anzuzeigen. Die Aufrufe erfolgen in geringer Anzahl, greifen jedoch weiterhin auf Provider-APIs zu.

Siehe [Modell-CLI](/de/cli/models).

### Zusammenfassung als Compaction-Schutz

Der Compaction-Schutz kann den Sitzungsverlauf mithilfe des aktuellen Modells zusammenfassen und ruft dabei Provider-APIs auf.

Siehe [Sitzungsverwaltung und Compaction](/de/reference/session-management-compaction).

### Modellscan/-prüfung

`openclaw models scan` kann OpenRouter-Modelle prüfen und verwendet bei aktivierter Prüfung `OPENROUTER_API_KEY`.

Siehe [Modell-CLI](/de/cli/models).

### Sprechen (Sprachausgabe)

Der Sprechmodus kann ElevenLabs aufrufen, wenn es konfiguriert ist: `ELEVENLABS_API_KEY` oder `talk.providers.elevenlabs.apiKey`.

Siehe [Sprechmodus](/de/nodes/talk).

### Skills (Drittanbieter-APIs)

Skills können `apiKey` in `skills.entries.<name>.apiKey` speichern. Wenn ein Skill diesen Schlüssel für eine externe API verwendet, richten sich die Kosten nach dem Provider des Skills.

Siehe [Skills](/de/tools/skills).

## Verwandte Themen

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
