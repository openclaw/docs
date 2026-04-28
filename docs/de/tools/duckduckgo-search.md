---
read_when:
    - Sie möchten einen Websuch-Provider, der keinen API key benötigt
    - Sie möchten DuckDuckGo für `web_search` verwenden
    - Sie benötigen einen Such-Fallback ohne Konfiguration
summary: DuckDuckGo-Websuche -- schlüsselfreier Fallback-Provider (experimentell, HTML-basiert)
title: DuckDuckGo-Suche
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T07:02:39Z"
  model: gpt-5.4
  provider: openai
  source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
  source_path: tools/duckduckgo-search.md
  workflow: 15
---

OpenClaw unterstützt DuckDuckGo als **schlüsselfreien** `web_search`-Provider. Es ist kein API key und kein Konto erforderlich.

<Warning>
  DuckDuckGo ist eine **experimentelle, inoffizielle** Integration, die Ergebnisse
  aus den nicht JavaScript-basierten Suchseiten von DuckDuckGo abruft — nicht aus
  einer offiziellen API. Rechnen Sie mit gelegentlichen Ausfällen durch Bot-Challenge-Seiten oder HTML-Änderungen.
</Warning>

## Einrichtung

Kein API key erforderlich — setzen Sie DuckDuckGo einfach als Ihren Provider:

<Steps>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    # Wählen Sie "duckduckgo" als Provider
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
            region: "us-en", // DuckDuckGo-Regionscode
            safeSearch: "moderate", // "strict", "moderate" oder "off"
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
Anzahl der zurückzugebenden Ergebnisse (1–10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo-Regionscode (z. B. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch-Stufe.
</ParamField>

Region und SafeSearch können auch in der Plugin-Konfiguration gesetzt werden (siehe oben) — Tool-
Parameter überschreiben Konfigurationswerte pro Anfrage.

## Hinweise

- **Kein API key** — funktioniert sofort, ohne Konfiguration
- **Experimentell** — sammelt Ergebnisse aus den nicht JavaScript-basierten HTML-
  Suchseiten von DuckDuckGo, nicht aus einer offiziellen API oder SDK
- **Risiko von Bot-Challenges** — DuckDuckGo kann bei starker oder automatisierter Nutzung
  CAPTCHAs ausliefern oder Anfragen blockieren
- **HTML-Parsing** — Ergebnisse hängen von der Seitenstruktur ab, die sich ohne
  Vorankündigung ändern kann
- **Reihenfolge der Auto-Erkennung** — DuckDuckGo ist der erste schlüsselfreie Fallback
  (Reihenfolge 100) in der Auto-Erkennung. API-gestützte Provider mit konfigurierten Schlüsseln laufen
  zuerst, dann Ollama Web Search (Reihenfolge 110), dann SearXNG (Reihenfolge 200)
- **SafeSearch ist standardmäßig moderate**, wenn nichts konfiguriert ist

<Tip>
  Für den Einsatz in Produktion sollten Sie [Brave Search](/de/tools/brave-search) (kostenlose Stufe
  verfügbar) oder einen anderen API-gestützten Provider in Betracht ziehen.
</Tip>

## Verwandt

- [Web Search overview](/de/tools/web) -- alle Provider und Auto-Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit kostenloser Stufe
- [Exa Search](/de/tools/exa-search) -- neuronale Suche mit Inhaltsextraktion
