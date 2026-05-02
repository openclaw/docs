---
read_when:
    - Sie möchten einen selbst gehosteten Provider für die Websuche
    - Sie möchten SearXNG für web_search verwenden
    - Sie benötigen eine datenschutzorientierte oder vom Netz getrennte Suchoption
summary: SearXNG-Websuche -- selbst gehosteter Metasuch-Provider ohne API-Schlüssel
title: SearXNG-Suche
x-i18n:
    generated_at: "2026-05-02T06:48:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8743325d4d4fdccad04956154bb87b1bd7f7155fb063a09cee3733a73e8d0c30
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw unterstützt [SearXNG](https://docs.searxng.org/) als **selbst gehosteten,
API-schlüsselfreien** `web_search`-Provider. SearXNG ist eine Open-Source-Metasuchmaschine,
die Ergebnisse von Google, Bing, DuckDuckGo und anderen Quellen aggregiert.

Vorteile:

- **Kostenlos und unbegrenzt** -- kein API-Schlüssel und kein kommerzielles Abonnement erforderlich
- **Datenschutz / Air-Gap** -- Abfragen verlassen niemals Ihr Netzwerk
- **Funktioniert überall** -- keine regionalen Einschränkungen kommerzieller Such-APIs

## Einrichtung

<Steps>
  <Step title="Run a SearXNG instance">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Oder verwenden Sie eine vorhandene SearXNG-Bereitstellung, auf die Sie Zugriff haben. Informationen zur Produktivumgebung finden Sie in der
    [SearXNG-Dokumentation](https://docs.searxng.org/).

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Oder setzen Sie die Umgebungsvariable und lassen Sie sie von der automatischen Erkennung finden:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Plugin-Einstellungen für die SearXNG-Instanz:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Das Feld `baseUrl` akzeptiert auch SecretRef-Objekte.

Transportregeln:

- `https://` funktioniert für öffentliche oder private SearXNG-Hosts
- `http://` wird nur für vertrauenswürdige Hosts in privaten Netzwerken oder loopback Hosts akzeptiert
- öffentliche SearXNG-Hosts müssen `https://` verwenden
- private/interne Hosts verwenden den Netzwerk-Guard für selbst gehostete Umgebungen; öffentliche `https://`
  Hosts bleiben beim strikten Websuche-Guard und können nicht zu privaten
  Adressen weiterleiten

## Umgebungsvariable

Setzen Sie `SEARXNG_BASE_URL` als Alternative zur Konfiguration:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Wenn `SEARXNG_BASE_URL` gesetzt ist und kein expliziter Provider konfiguriert wurde, wählt die automatische Erkennung
SearXNG automatisch aus (mit der niedrigsten Priorität -- jeder API-gestützte Provider mit einem
Schlüssel gewinnt zuerst).

## Plugin-Konfigurationsreferenz

| Feld         | Beschreibung                                                         |
| ------------ | -------------------------------------------------------------------- |
| `baseUrl`    | Basis-URL Ihrer SearXNG-Instanz (erforderlich)                       |
| `categories` | Durch Kommas getrennte Kategorien wie `general`, `news` oder `science` |
| `language`   | Sprachcode für Ergebnisse wie `en`, `de` oder `fr`                   |

## Hinweise

- **JSON-API** -- verwendet den nativen `format=json`-Endpunkt von SearXNG, kein HTML-Scraping
- **URLs von Bildergebnissen** -- Ergebnisse der Bildkategorie enthalten `img_src`, wenn SearXNG
  eine direkte Bild-URL zurückgibt
- **Kein API-Schlüssel** -- funktioniert sofort mit jeder SearXNG-Instanz
- **Validierung der Basis-URL** -- `baseUrl` muss eine gültige `http://`- oder `https://`
  URL sein; öffentliche Hosts müssen `https://` verwenden
- **Netzwerk-Guard** -- private/interne SearXNG-Endpunkte aktivieren
  Zugriff auf private Netzwerke; öffentliche `https://` SearXNG-Endpunkte behalten strikten SSRF-
  Schutz bei
- **Reihenfolge der automatischen Erkennung** -- SearXNG wird in der
  automatischen Erkennung zuletzt geprüft (Reihenfolge 200). API-gestützte Provider mit konfigurierten Schlüsseln werden zuerst ausgeführt, dann
  DuckDuckGo (Reihenfolge 100), dann Ollama Web Search (Reihenfolge 110)
- **Selbst gehostet** -- Sie kontrollieren die Instanz, Abfragen und Upstream-Suchmaschinen
- **Kategorien** verwenden standardmäßig `general`, wenn sie nicht konfiguriert sind

<Tip>
  Damit die SearXNG-JSON-API funktioniert, stellen Sie sicher, dass in Ihrer SearXNG-Instanz das Format `json`
  in `settings.yml` unter `search.formats` aktiviert ist.
</Tip>

## Verwandte Themen

- [Überblick über Web Search](/de/tools/web) -- alle Provider und automatische Erkennung
- [DuckDuckGo Search](/de/tools/duckduckgo-search) -- ein weiterer schlüsselfreier Fallback
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit kostenlosem Kontingent
