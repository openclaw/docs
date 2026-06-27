---
read_when:
    - Sie möchten einen selbst gehosteten Websuch-Provider
    - Sie möchten SearXNG für web_search verwenden
    - Sie benötigen eine datenschutzorientierte oder air-gapped Suchoption
summary: SearXNG-Websuche -- selbst gehosteter Meta-Such-Provider ohne Schlüssel
title: SearXNG-Suche
x-i18n:
    generated_at: "2026-06-27T18:21:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw unterstützt [SearXNG](https://docs.searxng.org/) als **selbst gehosteten,
schlüsselfreien** `web_search`-Provider. SearXNG ist eine Open-Source-Metasuchmaschine,
die Ergebnisse aus Google, Bing, DuckDuckGo und anderen Quellen aggregiert.

Vorteile:

- **Kostenlos und unbegrenzt** -- kein API-Schlüssel und kein kommerzielles Abonnement erforderlich
- **Datenschutz / Air-Gap** -- Abfragen verlassen Ihr Netzwerk nie
- **Funktioniert überall** -- keine regionalen Einschränkungen durch kommerzielle Such-APIs

## Einrichtung

<Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Eine SearXNG-Instanz ausführen">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Oder verwenden Sie eine vorhandene SearXNG-Bereitstellung, auf die Sie Zugriff haben. Informationen zur Produktionseinrichtung finden Sie in der
    [SearXNG-Dokumentation](https://docs.searxng.org/).

  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Oder legen Sie die Umgebungsvariable fest und lassen Sie sie von der automatischen Erkennung finden:

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
- `http://` wird nur für vertrauenswürdige Hosts in privaten Netzwerken oder Loopback-Hosts akzeptiert
- öffentliche SearXNG-Hosts müssen `https://` verwenden
- private/interne Hosts verwenden den selbst gehosteten Netzwerk-Guard; öffentliche `https://`-
  Hosts bleiben beim strikten Web-Search-Guard und können nicht auf private
  Adressen weiterleiten

## Umgebungsvariable

Legen Sie `SEARXNG_BASE_URL` als Alternative zur Konfiguration fest:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Wenn `SEARXNG_BASE_URL` festgelegt ist und kein expliziter Provider konfiguriert wurde, wählt die automatische Erkennung SearXNG automatisch aus (mit der niedrigsten Priorität -- jeder API-gestützte Provider mit einem
Schlüssel hat Vorrang).

## Plugin-Konfigurationsreferenz

| Feld         | Beschreibung                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | Basis-URL Ihrer SearXNG-Instanz (erforderlich)                     |
| `categories` | Kommagetrennte Kategorien wie `general`, `news` oder `science`     |
| `language`   | Sprachcode für Ergebnisse wie `en`, `de` oder `fr`                 |

## Hinweise

- **JSON-API** -- verwendet SearXNGs nativen `format=json`-Endpunkt, kein HTML-Scraping
- **URLs für Bildergebnisse** -- Ergebnisse der Bildkategorie enthalten `img_src`, wenn SearXNG
  eine direkte Bild-URL zurückgibt
- **Kein API-Schlüssel** -- funktioniert sofort mit jeder SearXNG-Instanz
- **Base-URL-Validierung** -- `baseUrl` muss eine gültige `http://`- oder `https://`-
  URL sein; öffentliche Hosts müssen `https://` verwenden
- **Network Guard** -- private/interne SearXNG-Endpunkte aktivieren den Zugriff auf private Netzwerke; öffentliche `https://`-SearXNG-Endpunkte behalten strikten SSRF-
  Schutz bei
- **Reihenfolge der automatischen Erkennung** -- SearXNG wird nach API-gestützten Providern
  mit konfigurierten Schlüsseln geprüft (Reihenfolge 200). Schlüsselfreie Provider wie DuckDuckGo oder
  Ollama Web Search werden ohne explizite Provider-Auswahl nicht automatisch ausgewählt
- **Selbst gehostet** -- Sie kontrollieren die Instanz, Abfragen und vorgelagerten Suchmaschinen
- **Kategorien** verwenden standardmäßig `general`, wenn sie nicht konfiguriert sind
- **Kategorie-Fallback** -- wenn eine Anfrage für eine nicht-`general`-Kategorie erfolgreich ist, aber
  null Ergebnisse zurückgibt, versucht OpenClaw dieselbe Abfrage einmal mit `general` erneut,
  bevor eine leere Ergebnismenge zurückgegeben wird

<Tip>
  Damit die SearXNG-JSON-API funktioniert, stellen Sie sicher, dass Ihre SearXNG-Instanz das `json`-
  Format in ihrer `settings.yml` unter `search.formats` aktiviert hat.
</Tip>

## Verwandt

- [Web Search overview](/de/tools/web) -- alle Provider und automatische Erkennung
- [DuckDuckGo Search](/de/tools/duckduckgo-search) -- ein weiterer schlüsselfreier Provider
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit kostenlosem Tarif
