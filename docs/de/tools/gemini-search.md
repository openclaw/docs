---
read_when:
    - Sie möchten Gemini für `web_search` verwenden
    - Sie benötigen einen `GEMINI_API_KEY`
    - Sie möchten Google-Search-Grounding nutzen
summary: Gemini-Websuche mit Google-Search-Grounding
title: Gemini-Suche
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T07:03:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw unterstützt Gemini-Modelle mit integriertem
[Google Search Grounding](https://ai.google.dev/gemini-api/docs/grounding),
das KI-synthetisierte Antworten zurückgibt, die durch Live-Ergebnisse der Google-Suche mit
Zitationen gestützt werden.

## API-Schlüssel abrufen

<Steps>
  <Step title="Einen Schlüssel erstellen">
    Gehen Sie zu [Google AI Studio](https://aistudio.google.com/apikey) und erstellen Sie einen
    API-Schlüssel.
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `GEMINI_API_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfiguration

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional, wenn GEMINI_API_KEY gesetzt ist
            model: "gemini-2.5-flash", // Standard
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Alternative über Umgebungsvariablen:** Setzen Sie `GEMINI_API_KEY` in der Gateway-Umgebung.
Für eine Gateway-Installation legen Sie ihn in `~/.openclaw/.env` ab.

## Funktionsweise

Im Gegensatz zu traditionellen Suchprovidern, die eine Liste von Links und Snippets zurückgeben,
verwendet Gemini Google Search Grounding, um KI-synthetisierte Antworten mit
Inline-Zitationen zu erzeugen. Die Ergebnisse enthalten sowohl die synthetisierte Antwort als auch die Quell-
URLs.

- Zitations-URLs aus Gemini Grounding werden automatisch von Google-
  Redirect-URLs zu direkten URLs aufgelöst.
- Die Auflösung von Redirects verwendet den SSRF-Guard-Pfad (HEAD + Redirect-Prüfungen +
  http/https-Validierung), bevor die endgültige Zitations-URL zurückgegeben wird.
- Die Auflösung von Redirects verwendet strenge SSRF-Standards, daher werden Redirects auf
  private/interne Ziele blockiert.

## Unterstützte Parameter

Die Gemini-Suche unterstützt `query`.

`count` wird aus Kompatibilitätsgründen mit gemeinsamem `web_search` akzeptiert, aber Gemini Grounding
gibt weiterhin eine einzelne synthetisierte Antwort mit Zitationen statt einer N-Ergebnis-
Liste zurück.

Providerspezifische Filter wie `country`, `language`, `freshness` und
`domain_filter` werden nicht unterstützt.

## Modellauswahl

Das Standardmodell ist `gemini-2.5-flash` (schnell und kosteneffizient). Jedes Gemini-
Modell, das Grounding unterstützt, kann über
`plugins.entries.google.config.webSearch.model` verwendet werden.

## Verwandt

- [Web Search overview](/de/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit Snippets
- [Perplexity Search](/de/tools/perplexity-search) -- strukturierte Ergebnisse + Inhaltsextraktion
