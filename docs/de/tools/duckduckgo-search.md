---
read_when:
    - Sie möchten einen Websuch-Provider, der keinen API-Schlüssel erfordert
    - Sie möchten DuckDuckGo für web_search verwenden
    - Sie möchten einen ausdrücklich ausgewählten suchschlüsselfreien Provider
summary: DuckDuckGo-Websuche -- Provider ohne API-Schlüssel (experimentell, HTML-basiert)
title: DuckDuckGo-Suche
x-i18n:
    generated_at: "2026-06-27T18:17:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw unterstützt DuckDuckGo als **Provider ohne API-Schlüssel** für `web_search`. Es ist kein API-Schlüssel und kein Konto erforderlich.

<Warning>
  DuckDuckGo ist eine **experimentelle, inoffizielle** Integration, die Ergebnisse
  aus den Nicht-JavaScript-Suchseiten von DuckDuckGo abruft - nicht aus einer offiziellen API. Rechnen Sie
  mit gelegentlichen Ausfällen durch Bot-Challenge-Seiten oder HTML-Änderungen.
</Warning>

## Einrichtung

Kein API-Schlüssel erforderlich - legen Sie DuckDuckGo einfach als Ihren Provider fest:

<Steps>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Optionale Einstellungen auf Plugin-Ebene für Region und SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Tool-Parameter

<ParamField path="query" type="string" required>
Suchanfrage.
</ParamField>

<ParamField path="count" type="number" default="5">
Zurückzugebende Ergebnisse (1-10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo-Regionscode (z. B. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch-Stufe.
</ParamField>

Region und SafeSearch können auch in der Plugin-Konfiguration festgelegt werden (siehe oben) - Tool-
Parameter überschreiben Konfigurationswerte pro Abfrage.

## Hinweise

- **Kein API-Schlüssel** - funktioniert, nachdem Sie DuckDuckGo als Ihren `web_search`-
  Provider ausgewählt haben
- **Experimentell** - sammelt Ergebnisse aus den Nicht-JavaScript-HTML-
  Suchseiten von DuckDuckGo, nicht aus einer offiziellen API oder einem SDK
- **Bot-Challenge-Risiko** - DuckDuckGo kann CAPTCHAs ausliefern oder Anfragen
  bei starker oder automatisierter Nutzung blockieren
- **HTML-Parsing** - Ergebnisse hängen von der Seitenstruktur ab, die sich ohne
  Vorankündigung ändern kann
- **Explizite Auswahl** - OpenClaw wählt DuckDuckGo nicht automatisch aus,
  wenn kein API-gestützter Provider konfiguriert ist
- **SafeSearch ist standardmäßig auf moderat gesetzt**, wenn nicht konfiguriert

<Tip>
  Für den Produktionseinsatz sollten Sie [Brave Search](/de/tools/brave-search) (kostenloses Kontingent
  verfügbar) oder einen anderen API-gestützten Provider in Betracht ziehen.
</Tip>

## Verwandt

- [Web Search-Überblick](/de/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit kostenlosem Kontingent
- [Exa Search](/de/tools/exa-search) -- neuronale Suche mit Inhaltsextraktion
