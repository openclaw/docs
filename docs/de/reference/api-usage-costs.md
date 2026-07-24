---
read_when:
    - Sie möchten verstehen, welche Funktionen möglicherweise kostenpflichtige APIs aufrufen.
    - Sie müssen Schlüssel, Kosten und die Nutzungstransparenz prüfen
    - Sie erklären die Kostenanzeige von /status oder /usage.
summary: Prüfen Sie, wodurch Kosten entstehen können, welche Schlüssel verwendet werden und wie Sie die Nutzung anzeigen können
title: API-Nutzung und Kosten
x-i18n:
    generated_at: "2026-07-24T05:15:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22caad8b8fa168739563223b3663a04adceeef7e83576a53dc9cdf885a35750d
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Übersicht der OpenClaw-Funktionen, die kostenpflichtige Provider-APIs aufrufen können, wo sie jeweils ihre Anmeldedaten lesen und wo die daraus entstehenden Kosten angezeigt werden.

## Wo Kosten angezeigt werden

**`/status`** (Momentaufnahme pro Sitzung)

- Zeigt das aktuelle Sitzungsmodell, die Kontextnutzung und die Token der letzten Antwort.
- Fügt **geschätzte Kosten** für die letzte Antwort hinzu, wenn OpenClaw über Nutzungsmetadaten und lokale Preisinformationen für das aktive Modell verfügt, einschließlich explizit bepreister Provider ohne API-Schlüssel wie Bedrock-`aws-sdk`-Modelle.
- Wenn die Live-Sitzungsmomentaufnahme nur wenige Daten enthält, stellt `/status` Token-/Cache-Zähler und die Bezeichnung des aktiven Modells aus dem neuesten Transkript-Nutzungseintrag wieder her. Vorhandene Live-Werte ungleich null haben Vorrang vor Transkriptdaten; ein Transkript-Gesamtwert in Prompt-Größe kann dennoch Vorrang haben, wenn der gespeicherte Gesamtwert fehlt oder kleiner ist.

**`/usage`** (Fußzeile pro Nachricht)

- `/usage full` hängt an jede Antwort eine Nutzungsfußzeile an, einschließlich **geschätzter Kosten**, wenn lokale Preisinformationen konfiguriert und Nutzungsmetadaten verfügbar sind.
- `/usage tokens` zeigt nur Token an. Abonnementbasierte OAuth-/Token- und CLI-Laufzeiten zeigen nur Token an, sofern sie nicht kompatible Nutzungsmetadaten zusammen mit einem expliziten lokalen Preis bereitstellen.
- `/usage cost` gibt eine lokale Kostenzusammenfassung aus; `/usage off` deaktiviert die Fußzeile.
- Hinweis zur Gemini CLI: Sowohl die Ausgabe von `stream-json` als auch die ältere Ausgabe von `json` enthalten Nutzungsdaten unter `stats`. OpenClaw normalisiert `stats.cached` zu `cacheRead` und leitet bei Bedarf Eingabe-Token aus `stats.input_tokens - stats.cached` ab.

**Control UI → Nutzung** (sitzungsübergreifende Analyse)

- Zeigt aus Transkripten abgeleitete Summen für Token und geschätzte Kosten im ausgewählten Datumsbereich mit Aufschlüsselungen nach Provider, Modell, Agent, Kanal und Token-Typ.
- Vergleicht kürzere Kalenderzeiträume, die am Enddatum des ausgewählten Bereichs enden. Fehlende Datumswerte zählen als Kalendertage mit null Nutzung; sie werden nicht übersprungen, um einen dichteren Zeitraum zu erzeugen.
- Beschriftet die Skala des Tagesdiagramms direkt. Ein `√`-Badge bedeutet, dass eine Quadratwurzelkomprimierung Tage mit geringer Nutzung sichtbar hält.
- Diese Summen beschreiben den verfügbaren lokalen Sitzungsverlauf, nicht eine Provider-Rechnung oder ein lebenslanges Abrechnungsjournal. Die Benutzeroberfläche warnt, wenn für einige Einträge Preisinformationen fehlen.

**CLI-Nutzungszeiträume** (Provider-Kontingente, keine Kosten pro Nachricht)

- `openclaw status --usage` und `openclaw channels list` zeigen **Nutzungszeiträume** des Providers als `X% left` an.
- Aktuelle Provider für Nutzungszeiträume: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (umfasst ChatGPT-/Codex-Authentifizierung per OAuth/Token), Xiaomi und z.ai. Die vollständige Liste der Provider und Flags finden Sie unter [Modell-CLI](/de/cli/models) und [Kanal-CLI](/de/cli/channels).
- Die Rohfelder `usage_percent` / `usagePercent` von MiniMax geben das verbleibende Kontingent an, daher invertiert OpenClaw sie; anzahlbasierte Felder haben Vorrang, wenn sie vorhanden sind. Wenn die Antwort ein `model_remains`-Array enthält, wählt OpenClaw den Eintrag für das Chatmodell aus, leitet bei Bedarf die Bezeichnung des Zeitraums aus Zeitstempeln ab und nimmt den Modellnamen in die Planbezeichnung auf.
- Die Authentifizierung für Nutzungsdaten stammt aus providerspezifischen Hooks, sofern verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Schlüssel-Anmeldedaten aus Authentifizierungsprofilen, Umgebungsvariablen oder der Konfiguration zurück.

Ausführliche Beispiele finden Sie unter [Token-Nutzung und Kosten](/de/reference/token-use).

<Note>
Anthropic hat bestätigt, dass die Wiederverwendung der Claude CLI (einschließlich `claude -p`) ein zulässiges Integrationsmuster ist, sofern keine neue Richtlinie veröffentlicht wird. Anthropic stellt keine Kostenschätzung in Dollar pro Nachricht bereit, daher kann `/usage full` keine Kosten für die Nutzung der Claude CLI anzeigen.
</Note>

## Wie Schlüssel ermittelt werden

- **Authentifizierungsprofile**: pro Agent, gespeichert in `auth-profiles.json`.
- **Umgebungsvariablen**: zum Beispiel `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Konfiguration**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `memory.search.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, wodurch der Schlüssel gegebenenfalls in die Prozessumgebung des Skills exportiert wird.

## Funktionen, die Schlüssel kostenpflichtig verwenden können

### Antworten des Kernmodells (Chat + Tools)

Jede Antwort und jeder Tool-Aufruf wird über den aktuellen Modell-Provider ausgeführt. Dies ist die Hauptquelle für Nutzung und Kosten, einschließlich abonnementbasierter gehosteter Tarife, die außerhalb der lokalen Benutzeroberfläche von OpenClaw abgerechnet werden: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan und Anthrophics Claude-Anmeldepfad mit aktivierter Extra Usage.

Informationen zur Preiskonfiguration finden Sie unter [Modelle](/de/providers/models), Informationen zur Anzeige unter [Token-Nutzung und Kosten](/de/reference/token-use).

### Medienverständnis (Audio/Bild/Video)

Eingehende Medien können über eine Provider-API zusammengefasst oder transkribiert werden, bevor die Antwort-Pipeline ausgeführt wird. Die Provider-Unterstützung wird pro Plugin registriert und ändert sich, wenn Plugins hinzugefügt werden; die aktuelle Liste und Konfiguration finden Sie unter [Medienverständnis](/de/nodes/media-understanding).

### Bild- und Videogenerierung

`image_generate` und `video_generate` leiten Anfragen an einen verfügbaren authentifizierten Provider weiter. Beide können einen durch Authentifizierungsdaten gestützten Standard-Provider ableiten, wenn ihr `agents.defaults.mediaModels`-Eintrag nicht gesetzt ist.

Die aktuelle Provider-Liste finden Sie unter [Bildgenerierung](/de/tools/image-generation) und [Videogenerierung](/de/tools/video-generation).

### Memory-Embeddings und semantische Suche

Die semantische Memory-Suche verwendet Embedding-APIs, wenn `memory.search.provider` einen Remote-Adapter angibt (zum Beispiel `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memory.search.provider = "lmstudio"` oder `"ollama"` wird auf einem lokalen/selbst gehosteten Server ausgeführt und verursacht üblicherweise keine Kosten für gehostete Dienste. `memory.search.provider = "local"` führt alles auf dem Gerät aus, ohne eine API zu verwenden. Ein optionaler `memory.search.fallback`-Provider kann Fehler bei lokalen Embeddings abdecken.

Siehe [Memory](/de/concepts/memory).

### Websuch-Tool

`web_search` kann abhängig vom ausgewählten Provider Nutzungskosten verursachen. Jeder Provider liest seinen Schlüssel zuerst aus einer Umgebungsvariablen und anschließend aus `plugins.entries.<id>.config.webSearch.apiKey`:

| Provider               | Umgebungsvariable(n)                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                     |
| DuckDuckGo             | ohne Schlüssel; inoffiziell, HTML-basiert, keine Abrechnung                                                                                                            |
| Exa                    | `EXA_API_KEY`                                                                                                                                                     |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                     |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                     |
| Grok (xAI)             | xAI-OAuth-Profil oder `XAI_API_KEY`                                                                                                                               |
| Kimi (Moonshot)        | `KIMI_API_KEY` oder `MOONSHOT_API_KEY`                                                                                                                             |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY`                                                                                     |
| Ollama Web Search      | ohne Schlüssel für einen erreichbaren, lokal angemeldeten Host; die direkte `https://ollama.com`-Suche verwendet `OLLAMA_API_KEY`; authentifizierungsgeschützte Hosts verwenden die normale Bearer-Authentifizierung des Ollama-Providers |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`                                                                                                                             |
| SearXNG                | `SEARXNG_BASE_URL`; ohne Schlüssel/selbst gehostet, keine Abrechnung für gehostete Dienste                                                                              |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                     |

Ältere `tools.web.search.*`-Konfigurationspfade werden weiterhin über einen Kompatibilitäts-Shim geladen, sind jedoch nicht mehr die empfohlene Schnittstelle.

**Kostenloses Guthaben für Brave Search**: Jeder Tarif enthält ein monatlich erneuertes kostenloses Guthaben von $5. Der Search-Tarif kostet $5 pro 1,000 Anfragen, sodass das Guthaben 1,000 Anfragen pro Monat kostenlos abdeckt. Legen Sie im Brave-Dashboard ein Nutzungslimit fest, um unerwartete Kosten zu vermeiden.

Siehe [Web-Tools](/de/tools/web).

### Webabruf-Tool (Firecrawl)

`web_fetch` kann Firecrawl mit schlüssellosem Starter-Zugang aufrufen; fügen Sie `FIRECRAWL_API_KEY` (oder `plugins.entries.firecrawl.config.webFetch.apiKey`) für höhere Limits hinzu. Wenn Firecrawl nicht konfiguriert ist, greift das Tool auf einen direkten Abruf und das gebündelte `web-readability`-Plugin zurück (keine kostenpflichtige API). Deaktivieren Sie `plugins.entries.web-readability.enabled`, um die lokale Readability-Extraktion zu überspringen.

Siehe [Web-Tools](/de/tools/web).

### Momentaufnahmen der Provider-Nutzung (Status/Systemzustand)

`openclaw status --usage` und `openclaw models status --json` rufen Provider-Endpunkte für Nutzungsdaten auf, um Kontingentzeiträume oder den Authentifizierungsstatus anzuzeigen. Die Aufrufzahl ist gering, die Aufrufe greifen jedoch weiterhin auf Provider-APIs zu.

Siehe [Modell-CLI](/de/cli/models).

### Schutzmechanismus-Zusammenfassung bei Compaction

Der Compaction-Schutzmechanismus kann den Sitzungsverlauf mithilfe des aktuellen Modells zusammenfassen und ruft dabei Provider-APIs auf.

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
