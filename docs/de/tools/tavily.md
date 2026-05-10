---
read_when:
    - Sie möchten eine Tavily-gestützte Websuche
    - Sie benötigen einen Tavily-API-Schlüssel
    - Sie möchten Tavily als web_search-Provider verwenden
    - Sie möchten Inhalte aus URLs extrahieren
summary: Tavily-Such- und Extraktionstools
title: Tavily
x-i18n:
    generated_at: "2026-05-10T19:56:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) ist eine Such-API, die für KI-Anwendungen entwickelt wurde. OpenClaw stellt sie auf zwei Arten bereit:

- als `web_search`-Provider für das generische Such-Tool
- als explizite Plugin-Tools: `tavily_search` und `tavily_extract`

Tavily gibt strukturierte Ergebnisse zurück, die für die Nutzung durch LLMs optimiert sind, mit konfigurierbarer Suchtiefe, Themenfilterung, Domain-Filtern, KI-generierten Antwortzusammenfassungen und Inhaltsextraktion aus URLs (einschließlich JavaScript-gerenderter Seiten).

| Eigenschaft    | Wert                                |
| --------------- | ----------------------------------- |
| Plugin-ID       | `tavily`                            |
| Authentifizierung | `TAVILY_API_KEY` oder Konfiguration `apiKey` |
| Basis-URL       | `https://api.tavily.com` (Standard) |
| Gebündelte Tools | `tavily_search`, `tavily_extract`   |

## Erste Schritte

<Steps>
  <Step title="Get an API key">
    Erstellen Sie ein Tavily-Konto unter [tavily.com](https://tavily.com), und generieren Sie anschließend im Dashboard einen API-Schlüssel.
  </Step>
  <Step title="Configure the plugin and provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify search runs">
    Lösen Sie eine `web_search` über einen beliebigen Agenten aus, oder rufen Sie `tavily_search` direkt auf.
  </Step>
</Steps>

<Tip>
Wenn Sie Tavily im Onboarding oder mit `openclaw configure --section web` auswählen, wird das gebündelte Tavily-Plugin automatisch aktiviert.
</Tip>

## Tool-Referenz

### `tavily_search`

Verwenden Sie dies, wenn Sie Tavily-spezifische Suchsteuerungen statt des generischen `web_search` nutzen möchten.

| Parameter         | Typ          | Einschränkungen / Standard            | Beschreibung                                    |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | erforderlich                           | Suchabfragezeichenfolge. Unter 400 Zeichen halten. |
| `search_depth`    | enum         | `basic` (Standard), `advanced`         | `advanced` ist langsamer, aber relevanter.      |
| `topic`           | enum         | `general` (Standard), `news`, `finance` | Nach Themenfamilie filtern.                    |
| `max_results`     | integer      | 1-20                                   | Anzahl der Ergebnisse.                          |
| `include_answer`  | boolean      | Standard `false`                       | Eine KI-generierte Tavily-Antwortzusammenfassung einschließen. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Ergebnisse nach Aktualität filtern.             |
| `include_domains` | string array | (keine)                                | Nur Ergebnisse aus diesen Domains einschließen. |
| `exclude_domains` | string array | (keine)                                | Ergebnisse aus diesen Domains ausschließen.     |

Kompromiss bei der Suchtiefe:

| Tiefe      | Geschwindigkeit | Relevanz | Am besten geeignet für                  |
| ---------- | ---------------- | -------- | --------------------------------------- |
| `basic`    | Schneller        | Hoch     | Allgemeine Abfragen (Standard).         |
| `advanced` | Langsamer        | Am höchsten | Präzise Recherche und Faktenfindung. |

### `tavily_extract`

Verwenden Sie dies, um bereinigte Inhalte aus einer oder mehreren URLs zu extrahieren. Unterstützt JavaScript-gerenderte Seiten und abfrageorientiertes Chunking für gezielte Extraktion.

| Parameter           | Typ          | Einschränkungen / Standard     | Beschreibung                                              |
| ------------------- | ------------ | ------------------------------- | --------------------------------------------------------- |
| `urls`              | string array | erforderlich, 1-20              | URLs, aus denen Inhalte extrahiert werden sollen.         |
| `query`             | string       | (optional)                      | Extrahierte Chunks nach Relevanz für diese Abfrage neu ranken. |
| `extract_depth`     | enum         | `basic` (Standard), `advanced`  | Verwenden Sie `advanced` für JS-lastige Seiten, SPAs oder dynamische Tabellen. |
| `chunks_per_source` | integer      | 1-5; **erfordert `query`**      | Pro URL zurückgegebene Chunks. Führt zu Fehlern, wenn ohne `query` gesetzt. |
| `include_images`    | boolean      | Standard `false`                | Bild-URLs in Ergebnisse einschließen.                     |

Kompromiss bei der Extraktionstiefe:

| Tiefe      | Wann verwenden                            |
| ---------- | ------------------------------------------ |
| `basic`    | Einfache Seiten. Versuchen Sie dies zuerst. |
| `advanced` | JS-gerenderte SPAs, dynamische Inhalte, Tabellen. |

<Tip>
Teilen Sie größere URL-Listen in mehrere `tavily_extract`-Aufrufe auf (max. 20 pro Anfrage). Verwenden Sie `query` plus `chunks_per_source`, um nur relevante Inhalte statt vollständiger Seiten zu erhalten.
</Tip>

## Das richtige Tool auswählen

| Bedarf                                   | Tool             |
| ---------------------------------------- | ---------------- |
| Schnelle Websuche ohne Spezialoptionen   | `web_search`     |
| Suche mit Tiefe, Thema, KI-Antworten     | `tavily_search`  |
| Inhalte aus bestimmten URLs extrahieren  | `tavily_extract` |

<Note>
Das generische Tool `web_search` mit Tavily als Provider unterstützt `query` und `count` (bis zu 20 Ergebnisse). Für Tavily-spezifische Steuerungen (`search_depth`, `topic`, `include_answer`, Domain-Filter, Zeitraum) verwenden Sie stattdessen `tavily_search`.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="API key resolution order">
    Der Tavily-Client sucht seinen API-Schlüssel in dieser Reihenfolge:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (über SecretRefs aufgelöst).
    2. `TAVILY_API_KEY` aus der Gateway-Umgebung.

    `tavily_extract` löst einen Einrichtungsfehler aus, wenn keines von beiden vorhanden ist.

  </Accordion>

  <Accordion title="Custom base URL">
    Überschreiben Sie `plugins.entries.tavily.config.webSearch.baseUrl`, wenn Sie Tavily über einen Proxy vorschalten. Der Standard ist `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` weist Aufrufe zurück, die `chunks_per_source` ohne `query` übergeben. Tavily rankt Chunks nach Abfragerelevanz, daher ist der Parameter ohne eine Abfrage bedeutungslos.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/de/tools/web" icon="magnifying-glass">
    Alle Provider und Regeln zur automatischen Erkennung.
  </Card>
  <Card title="Firecrawl" href="/de/tools/firecrawl" icon="fire">
    Suche plus Scraping mit Inhaltsextraktion.
  </Card>
  <Card title="Exa Search" href="/de/tools/exa-search" icon="binoculars">
    Neuronale Suche mit Inhaltsextraktion.
  </Card>
  <Card title="Configuration" href="/de/gateway/configuration" icon="gear">
    Vollständiges Konfigurationsschema für Plugin-Einträge und Tool-Routing.
  </Card>
</CardGroup>
