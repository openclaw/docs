---
read_when:
    - Sie möchten einen selbst gehosteten Provider für die Websuche
    - Sie möchten SearXNG für web_search verwenden
    - Sie benötigen eine datenschutzorientierte oder vom Netzwerk isolierte Suchoption
summary: SearXNG-Websuche – selbst gehosteter Meta-Such-Provider ohne API-Schlüssel
title: SearXNG-Suche
x-i18n:
    generated_at: "2026-07-12T15:59:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw unterstützt [SearXNG](https://docs.searxng.org/) als **selbst gehosteten,
schlüsselfreien** `web_search`-Provider. SearXNG ist eine quelloffene Metasuchmaschine,
die Ergebnisse von Google, Bing, DuckDuckGo und anderen Quellen zusammenführt.

Vorteile:

- **Kostenlos und unbegrenzt** -- kein API-Schlüssel oder kommerzielles Abonnement erforderlich
- **Datenschutz / Air-Gap** -- Abfragen verlassen Ihr Netzwerk nie
- **Überall einsetzbar** -- keine regionalen Einschränkungen kommerzieller Such-APIs

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

    Alternativ können Sie jede vorhandene SearXNG-Bereitstellung verwenden, auf die Sie Zugriff haben. Informationen zur
    Produktionseinrichtung finden Sie in der [SearXNG-Dokumentation](https://docs.searxng.org/).

  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    # Wählen Sie "searxng" als Provider aus
    ```

    Alternativ können Sie die Umgebungsvariable setzen und die automatische Erkennung verwenden:

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

Einstellungen auf Plugin-Ebene für die SearXNG-Instanz:

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

`baseUrl` akzeptiert auch ein SecretRef-Objekt (zum Beispiel `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Umgebungsvariable

Legen Sie alternativ zur Konfiguration `SEARXNG_BASE_URL` fest:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Auflösungsreihenfolge: konfigurierte `baseUrl`-Zeichenfolge, dann eine eingebettete Umgebungs-SecretRef für
`baseUrl`, dann `SEARXNG_BASE_URL`. Wenn keiner der Konfigurationspfade festgelegt ist und
`SEARXNG_BASE_URL` vorhanden ist, ohne dass explizit ein Provider ausgewählt wurde, wählt die automatische Erkennung
SearXNG aus.

## Referenz zur Plugin-Konfiguration

| Feld         | Beschreibung                                                               |
| ------------ | -------------------------------------------------------------------------- |
| `baseUrl`    | Basis-URL Ihrer SearXNG-Instanz (erforderlich)                             |
| `categories` | Kommagetrennte Kategorien wie `general`, `news` oder `science`             |
| `language`   | Sprachcode für Ergebnisse wie `en`, `de` oder `fr`                         |

Der Aufruf des Tools `web_search` akzeptiert außerdem `count` (1-10 Ergebnisse), `categories`
und `language` als Überschreibungen pro Aufruf.

## Hinweise

- **JSON-API** -- verwendet den nativen SearXNG-Endpunkt `format=json` statt HTML-Scraping
- **URLs von Bildergebnissen** -- Ergebnisse der Bildkategorie enthalten `img_src`, wenn SearXNG
  eine direkte Bild-URL zurückgibt
- **Kein API-Schlüssel** -- funktioniert sofort mit jeder SearXNG-Instanz
- **Validierung der Basis-URL** -- `baseUrl` muss eine gültige `http://`- oder `https://`-
  URL sein
- **Netzwerkschutz** -- `http://`-Basis-URLs müssen auf einen vertrauenswürdigen privaten oder
  Loopback-Host verweisen (öffentliche Hosts müssen `https://` verwenden); `https://`-Basis-URLs, die
  zu einer privaten/internen Adresse aufgelöst werden, erhalten dieselbe Ausnahme für selbst gehostete Instanzen,
  während für `https://`-Basis-URLs, die öffentlich aufgelöst werden, weiterhin strenger SSRF-Schutz gilt
- **Reihenfolge der automatischen Erkennung** -- SearXNG erfordert eine konfigurierte `baseUrl` (Reihenfolge
  200 unter Providern, die bereits über die erforderlichen Anmeldedaten verfügen). Schlüsselfreie
  Provider wie DuckDuckGo oder Ollama Web Search werden bei der automatischen Erkennung nie implizit ausgewählt;
  sie werden nur durch eine explizite Auswahl von `provider` aktiviert
- **Selbst gehostet** -- Sie kontrollieren die Instanz, Abfragen und vorgelagerten Suchmaschinen
- **Kategorien** verwenden standardmäßig `general`, wenn sie nicht konfiguriert sind
- **Kategorie-Fallback** -- wenn eine Anfrage für eine andere Kategorie als `general` erfolgreich ist, aber
  keine Ergebnisse zurückgibt, versucht OpenClaw dieselbe Abfrage einmal mit `general` erneut,
  bevor eine leere Ergebnismenge zurückgegeben wird
- **Ergebnis-Caching** -- identische Abfragen (gleiche Abfrage, Anzahl, Kategorien,
  Sprache und Basis-URL) werden für eine kurze TTL prozessintern zwischengespeichert
- **Versionsanforderung** -- das Plugin deklariert `minHostVersion: >=2026.6.9`

<Tip>
  Damit die SearXNG-JSON-API funktioniert, stellen Sie sicher, dass in Ihrer SearXNG-Instanz das Format `json`
  in der Datei `settings.yml` unter `search.formats` aktiviert ist.
</Tip>

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [DuckDuckGo-Suche](/de/tools/duckduckgo-search) -- ein weiterer schlüsselfreier Provider
- [Brave-Suche](/de/tools/brave-search) -- strukturierte Ergebnisse mit kostenlosem Kontingent
