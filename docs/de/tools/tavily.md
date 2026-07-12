---
read_when:
    - Sie möchten eine Tavily-gestützte Websuche
    - Sie benötigen einen Tavily-API-Schlüssel
    - Sie möchten Tavily als `web_search`-Provider verwenden
    - Sie möchten Inhalte aus URLs extrahieren
summary: Tavily-Such- und Extraktionstools
title: Tavily
x-i18n:
    generated_at: "2026-07-12T15:59:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) ist eine für KI-Anwendungen entwickelte Such-API. OpenClaw stellt sie auf zwei Arten bereit:

- als `web_search`-Provider für das generische Suchwerkzeug
- als explizite Plugin-Werkzeuge: `tavily_search` und `tavily_extract`

Tavily liefert strukturierte, für die Verarbeitung durch LLMs optimierte Ergebnisse mit konfigurierbarer Suchtiefe, Themenfilterung, Domainfiltern, KI-generierten Antwortzusammenfassungen und Inhaltsextraktion aus URLs (einschließlich mit JavaScript gerenderter Seiten).

| Eigenschaft | Wert                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Plugin-ID   | `tavily`                                                                                                |
| Paket       | `@openclaw/tavily-plugin`                                                                               |
| Authentifizierung | Umgebungsvariable `TAVILY_API_KEY` oder Konfiguration `apiKey`                                    |
| Basis-URL   | `https://api.tavily.com` (Standard); Umgebungsvariable `TAVILY_BASE_URL` oder Konfiguration `baseUrl` zum Überschreiben |
| Zeitlimits  | 30s für Suche, 60s für Extraktion (Standard)                                                            |
| Werkzeuge   | `tavily_search`, `tavily_extract`                                                                       |

## Erste Schritte

<Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie unter [tavily.com](https://tavily.com) ein Tavily-Konto und generieren Sie anschließend im Dashboard einen API-Schlüssel.
  </Step>
  <Step title="Plugin und Provider konfigurieren">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional, wenn TAVILY_API_KEY festgelegt ist
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
  <Step title="Ausführung der Suche überprüfen">
    Lösen Sie über einen beliebigen Agenten eine `web_search` aus oder rufen Sie `tavily_search` direkt auf.
  </Step>
</Steps>

<Tip>
Wenn Sie Tavily beim Onboarding oder über `openclaw configure --section web` auswählen, wird das offizielle Tavily-Plugin bei Bedarf installiert und aktiviert.
</Tip>

## Werkzeugreferenz

### `tavily_search`

Verwenden Sie dieses Werkzeug, wenn Sie Tavily-spezifische Suchoptionen statt der generischen `web_search` verwenden möchten.

| Parameter         | Typ          | Einschränkungen / Standard              | Beschreibung                                        |
| ----------------- | ------------ | --------------------------------------- | --------------------------------------------------- |
| `query`           | Zeichenfolge | erforderlich                            | Zeichenfolge der Suchanfrage.                       |
| `search_depth`    | Aufzählung   | `basic` (Standard), `advanced`          | `advanced` ist langsamer, liefert aber relevantere Ergebnisse. |
| `topic`           | Aufzählung   | `general` (Standard), `news`, `finance` | Nach Themenkategorie filtern.                       |
| `max_results`     | Ganzzahl     | 1-20, Standard `5`                      | Anzahl der Ergebnisse.                              |
| `include_answer`  | boolescher Wert | Standard `false`                     | Eine von Tavily KI-generierte Antwortzusammenfassung einbeziehen. |
| `time_range`      | Aufzählung   | `day`, `week`, `month`, `year`          | Ergebnisse nach Aktualität filtern.                 |
| `include_domains` | Zeichenfolgen-Array | (keine)                           | Nur Ergebnisse aus diesen Domains einbeziehen.      |
| `exclude_domains` | Zeichenfolgen-Array | (keine)                           | Ergebnisse aus diesen Domains ausschließen.         |

Abwägung bei der Suchtiefe:

| Tiefe      | Geschwindigkeit | Relevanz | Am besten geeignet für                    |
| ---------- | --------------- | -------- | ----------------------------------------- |
| `basic`    | Schneller       | Hoch     | Allgemeine Suchanfragen (Standard).       |
| `advanced` | Langsamer       | Höchste  | Präzise Recherche und Faktenprüfung.      |

### `tavily_extract`

Verwenden Sie dieses Werkzeug, um bereinigte Inhalte aus einer oder mehreren URLs zu extrahieren. Es verarbeitet mit JavaScript gerenderte Seiten und unterstützt eine an Abfragen ausgerichtete Segmentierung für eine gezielte Extraktion.

| Parameter           | Typ          | Einschränkungen / Standard     | Beschreibung                                                      |
| ------------------- | ------------ | ------------------------------ | ----------------------------------------------------------------- |
| `urls`              | Zeichenfolgen-Array | erforderlich, 1-20      | URLs, aus denen Inhalte extrahiert werden sollen.                 |
| `query`             | Zeichenfolge | (optional)                     | Extrahierte Segmente anhand ihrer Relevanz für diese Abfrage neu sortieren. |
| `extract_depth`     | Aufzählung   | `basic` (Standard), `advanced` | Verwenden Sie `advanced` für JS-intensive Seiten, SPAs oder dynamische Tabellen. |
| `chunks_per_source` | Ganzzahl     | 1-5; **erfordert `query`**     | Pro URL zurückgegebene Segmente. Führt ohne `query` zu einem Fehler. |
| `include_images`    | boolescher Wert | Standard `false`            | Bild-URLs in die Ergebnisse einbeziehen.                          |

Abwägung bei der Extraktionstiefe:

| Tiefe      | Verwendungszweck                                  |
| ---------- | ------------------------------------------------- |
| `basic`    | Einfache Seiten. Probieren Sie dies zuerst aus.   |
| `advanced` | Mit JS gerenderte SPAs, dynamische Inhalte, Tabellen. |

<Tip>
Teilen Sie größere URL-Listen auf mehrere `tavily_extract`-Aufrufe auf (maximal 20 pro Anfrage). Verwenden Sie `query` zusammen mit `chunks_per_source`, um statt vollständiger Seiten nur relevante Inhalte abzurufen.
</Tip>

## Das richtige Werkzeug auswählen

| Bedarf                                           | Werkzeug          |
| ------------------------------------------------ | ----------------- |
| Schnelle Websuche ohne spezielle Optionen        | `web_search`      |
| Suche mit Tiefe, Thema und KI-Antworten           | `tavily_search`   |
| Inhalte aus bestimmten URLs extrahieren          | `tavily_extract`  |

<Note>
Das generische Werkzeug `web_search` unterstützt mit Tavily als Provider `query` und `count` (bis zu 20 Ergebnisse). Verwenden Sie für Tavily-spezifische Optionen (`search_depth`, `topic`, `include_answer`, Domainfilter, Zeitraum) stattdessen `tavily_search`.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Auflösungsreihenfolge für API-Schlüssel">
    Der Tavily-Client sucht seinen API-Schlüssel in dieser Reihenfolge:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (über SecretRefs aufgelöst).
    2. `TAVILY_API_KEY` aus der Gateway-Umgebung.

    Sowohl `tavily_search` als auch `tavily_extract` lösen einen Einrichtungsfehler aus, wenn keiner der beiden Werte vorhanden ist.

  </Accordion>

  <Accordion title="Benutzerdefinierte Basis-URL">
    Überschreiben Sie `plugins.entries.tavily.config.webSearch.baseUrl` oder legen Sie `TAVILY_BASE_URL` fest, wenn Sie Tavily über einen Proxy bereitstellen. Die Konfiguration hat Vorrang vor der Umgebungsvariable. Der Standardwert ist `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` erfordert `query`">
    `tavily_extract` lehnt Aufrufe ab, die `chunks_per_source` ohne `query` übergeben. Tavily ordnet Segmente nach ihrer Relevanz für die Abfrage, daher ist der Parameter ohne eine Abfrage bedeutungslos.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Übersicht über die Websuche" href="/de/tools/web" icon="magnifying-glass">
    Alle Provider und Regeln zur automatischen Erkennung.
  </Card>
  <Card title="Firecrawl" href="/de/tools/firecrawl" icon="fire">
    Suche und Scraping mit Inhaltsextraktion.
  </Card>
  <Card title="Exa Search" href="/de/tools/exa-search" icon="binoculars">
    Neuronale Suche mit Inhaltsextraktion.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständiges Konfigurationsschema für Plugin-Einträge und Werkzeug-Routing.
  </Card>
</CardGroup>
