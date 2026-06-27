---
read_when:
    - Sie möchten Gemini für web_search verwenden
    - Sie benötigen einen GEMINI_API_KEY oder models.providers.google.apiKey
    - Sie möchten Google Search-Grounding
summary: Gemini-Websuche mit Google Search-Grounding
title: Gemini-Suche
x-i18n:
    generated_at: "2026-06-27T18:18:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw unterstützt Gemini-Modelle mit integriertem
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding),
das KI-synthetisierte Antworten zurückgibt, die durch Live-Ergebnisse von Google Search mit
Quellenangaben belegt sind.

## API-Schlüssel abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Gehen Sie zu [Google AI Studio](https://aistudio.google.com/apikey) und erstellen Sie einen
    API-Schlüssel.
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `GEMINI_API_KEY` in der Gateway-Umgebung, verwenden Sie
    `models.providers.google.apiKey` erneut oder konfigurieren Sie einen dedizierten Websuchschlüssel über:

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
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

**Priorität der Anmeldedaten:** Die Gemini-Websuche verwendet zuerst
`plugins.entries.google.config.webSearch.apiKey`, dann `GEMINI_API_KEY`,
danach `models.providers.google.apiKey`. Bei Basis-URLs hat die dedizierte
`plugins.entries.google.config.webSearch.baseUrl` Vorrang vor
`models.providers.google.baseUrl`.

Legen Sie bei einer Gateway-Installation Umgebungsschlüssel in `~/.openclaw/.env` ab.

## Funktionsweise

Anders als herkömmliche Search-Provider, die eine Liste von Links und Snippets zurückgeben,
nutzt Gemini Google Search grounding, um KI-synthetisierte Antworten mit
Inline-Quellenangaben zu erzeugen. Die Ergebnisse enthalten sowohl die synthetisierte Antwort als auch die Quell-
URLs.

- Quellen-URLs aus Gemini grounding werden automatisch von Google-
  Weiterleitungs-URLs in direkte URLs aufgelöst.
- Die Auflösung von Weiterleitungen verwendet den SSRF-Schutzpfad (HEAD + Weiterleitungsprüfungen +
  http/https-Validierung), bevor die endgültige Quellen-URL zurückgegeben wird.
- Die Auflösung von Weiterleitungen verwendet strikte SSRF-Standardeinstellungen, sodass Weiterleitungen zu
  privaten/internen Zielen blockiert werden.

## Unterstützte Parameter

Die Gemini-Suche unterstützt `query`, `freshness`, `date_after` und `date_before`.

`count` wird für die gemeinsame `web_search`-Kompatibilität akzeptiert, aber Gemini grounding
gibt weiterhin eine synthetisierte Antwort mit Quellenangaben statt einer Ergebnisliste mit N Treffern
zurück.

`freshness` akzeptiert `day`, `week`, `month`, `year` sowie die gemeinsamen Kurzformen
`pd`, `pw`, `pm` und `py`. `day`/`pd` fügt der Gemini-
Abfrage eine Aktualitätsanweisung hinzu statt eines festen 24-Stunden-Zeitraums. `week`, `month`, `year` und explizite
`date_after`/`date_before`-Bereiche setzen den
`timeRangeFilter` von Gemini Google Search grounding. `country`, `language` und `domain_filter` werden nicht unterstützt.

## Modellauswahl

Das Standardmodell ist `gemini-2.5-flash` (schnell und kosteneffizient). Jedes Gemini-
Modell, das grounding unterstützt, kann über
`plugins.entries.google.config.webSearch.model` verwendet werden.

## Überschreibungen der Basis-URL

Setzen Sie `plugins.entries.google.config.webSearch.baseUrl`, wenn die Gemini-Websuche
über einen Operator-Proxy oder einen benutzerdefinierten Gemini-kompatiblen Endpunkt geleitet werden muss. Wenn
dies nicht gesetzt ist, verwendet die Gemini-Websuche `models.providers.google.baseUrl` erneut. Ein einfacher
Wert `https://generativelanguage.googleapis.com` wird zu
`https://generativelanguage.googleapis.com/v1beta` normalisiert; benutzerdefinierte Proxy-Pfade bleiben
nach dem Entfernen nachgestellter Schrägstriche unverändert.

## Verwandte Themen

- [Überblick über die Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit Snippets
- [Perplexity Search](/de/tools/perplexity-search) -- strukturierte Ergebnisse + Inhaltsextraktion
