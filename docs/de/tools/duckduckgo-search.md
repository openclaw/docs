---
read_when:
    - Sie möchten einen Provider für die Websuche, der keinen API-Schlüssel erfordert
    - Sie möchten DuckDuckGo für web_search verwenden
    - Sie benötigen eine konfigurationsfreie Ausweichlösung für die Suche
summary: DuckDuckGo-Websuche -- Fallback-Provider ohne Schlüssel (experimentell, HTML-basiert)
title: DuckDuckGo-Suche
x-i18n:
    generated_at: "2026-05-06T07:05:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw unterstützt DuckDuckGo als **schlüsselfreien** `web_search`-Provider. Es ist kein API-Schlüssel und kein Konto erforderlich.

<Warning>
  DuckDuckGo ist eine **experimentelle, inoffizielle** Integration, die Ergebnisse
  aus DuckDuckGos Nicht-JavaScript-Suchseiten abruft - nicht aus einer offiziellen API. Rechnen Sie
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

- **Kein API-Schlüssel** - funktioniert sofort, ohne Konfiguration
- **Experimentell** - sammelt Ergebnisse aus DuckDuckGos Nicht-JavaScript-HTML-
  Suchseiten, nicht aus einer offiziellen API oder einem SDK
- **Bot-Challenge-Risiko** - DuckDuckGo kann CAPTCHAs ausliefern oder Anfragen
  bei starker oder automatisierter Nutzung blockieren
- **HTML-Parsing** - Ergebnisse hängen von der Seitenstruktur ab, die sich ohne
  Ankündigung ändern kann
- **Reihenfolge der automatischen Erkennung** - DuckDuckGo ist der erste schlüsselfreie Fallback
  (Reihenfolge 100) in der automatischen Erkennung. API-gestützte Provider mit konfigurierten Schlüsseln werden
  zuerst ausgeführt, dann Ollama Web Search (Reihenfolge 110), dann SearXNG (Reihenfolge 200)
- **SafeSearch ist standardmäßig moderat**, wenn nicht konfiguriert

<Tip>
  Für den Produktionseinsatz sollten Sie [Brave Search](/de/tools/brave-search) (kostenloses Kontingent
  verfügbar) oder einen anderen API-gestützten Provider in Betracht ziehen.
</Tip>

## Verwandt

- [Web Search-Übersicht](/de/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit kostenlosem Kontingent
- [Exa Search](/de/tools/exa-search) -- neuronale Suche mit Inhaltsextraktion
