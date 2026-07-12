---
read_when:
    - Sie möchten einen Websuch-Provider, der keinen API-Schlüssel erfordert.
    - Sie möchten DuckDuckGo für web_search verwenden
    - Sie möchten einen ausdrücklich ausgewählten Such-Provider ohne API-Schlüssel
summary: DuckDuckGo-Websuche -- schlüsselfreier Provider (experimentell, HTML-basiert)
title: DuckDuckGo-Suche
x-i18n:
    generated_at: "2026-07-12T15:57:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw unterstützt DuckDuckGo als **schlüsselfreien** `web_search`-Provider. Es sind weder ein API-Schlüssel noch ein Konto erforderlich.

<Warning>
  DuckDuckGo ist eine **experimentelle, inoffizielle** Integration, die DuckDuckGos HTML-Suchseiten ohne JavaScript ausliest – keine offizielle API. Rechnen Sie mit gelegentlichen Ausfällen durch Bot-Challenge-Seiten oder HTML-Änderungen.
</Warning>

## Einrichtung

DuckDuckGo wird nie automatisch ausgewählt, da die automatische Erkennung nur Provider mit verwendbaren Anmeldedaten berücksichtigt. Legen Sie ihn ausdrücklich fest:

<Steps>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    # Wählen Sie "duckduckgo" als Provider aus
    ```
  </Step>
</Steps>

## Konfiguration

Legen Sie den Provider direkt in der Konfiguration fest:

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
Anzahl der zurückzugebenden Ergebnisse (1-10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo-Regionscode (z. B. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch-Stufe.
</ParamField>

Die Tool-Parameter `region` und `safeSearch` überschreiben die obigen Plugin-Konfigurationswerte jeweils für die einzelne Suchanfrage.

## Hinweise

- **Kein API-Schlüssel** – funktioniert, sobald DuckDuckGo als `web_search`-Provider ausgewählt ist.
- **Experimentell** – liest DuckDuckGos HTML-Suchseiten ohne JavaScript aus und verwendet keine offizielle API oder kein offizielles SDK. Die Ergebnisse hängen von der Seitenstruktur ab, die sich ohne Vorankündigung ändern kann.
- **Risiko von Bot-Challenges** – DuckDuckGo kann bei starker oder automatisierter Nutzung CAPTCHAs anzeigen oder Anfragen blockieren.
- **Nur ausdrückliche Auswahl** – die automatische Erkennung von OpenClaw berücksichtigt nur Provider mit verwendbaren Anmeldedaten. Daher wird ein schlüsselfreier Provider wie DuckDuckGo nie automatisch ausgewählt; Sie müssen `provider: "duckduckgo"` festlegen.
- **SafeSearch verwendet standardmäßig `moderate`**, wenn keine Konfiguration vorliegt.

<Tip>
  Erwägen Sie für den Produktionseinsatz [Brave Search](/de/tools/brave-search) (kostenlose Stufe verfügbar) oder einen anderen API-basierten Provider.
</Tip>

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) – alle Provider und die automatische Erkennung
- [Brave Search](/de/tools/brave-search) – strukturierte Ergebnisse mit kostenloser Stufe
- [Exa Search](/de/tools/exa-search) – neuronale Suche mit Inhaltsextraktion
