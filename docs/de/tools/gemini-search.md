---
read_when:
    - Sie möchten Gemini für web_search verwenden
    - Sie benötigen einen `GEMINI_API_KEY` oder `models.providers.google.apiKey`
    - Sie möchten Google Search Grounding nutzen
summary: Gemini-Websuche mit Google-Search-Grounding
title: Gemini-Suche
x-i18n:
    generated_at: "2026-07-24T05:02:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw unterstützt Gemini-Modelle mit integriertem
[Google-Search-Grounding](https://ai.google.dev/gemini-api/docs/grounding),
das durch aktuelle Google-Suchergebnisse gestützte, KI-synthetisierte Antworten
mit Quellenangaben zurückgibt.

## API-Schlüssel abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Rufen Sie [Google AI Studio](https://aistudio.google.com/apikey) auf und erstellen Sie einen
    API-Schlüssel.
  </Step>
  <Step title="Schlüssel speichern">
    Legen Sie `GEMINI_API_KEY` in der Gateway-Umgebung fest, verwenden Sie
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
            apiKey: "AIza...", // optional, wenn GEMINI_API_KEY oder models.providers.google.apiKey festgelegt ist
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; greift auf models.providers.google.baseUrl zurück
            model: "gemini-2.5-flash", // Standardwert
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
`plugins.entries.google.config.webSearch.apiKey`, dann `GEMINI_API_KEY`
und anschließend `models.providers.google.apiKey`. Bei Basis-URLs hat die dedizierte
`plugins.entries.google.config.webSearch.baseUrl` Vorrang vor
`models.providers.google.baseUrl`.

Legen Sie bei einer Gateway-Installation Umgebungsschlüssel in `~/.openclaw/.env` ab.

## Funktionsweise

Im Gegensatz zu herkömmlichen Such-Providern, die eine Liste mit Links und Textausschnitten
zurückgeben, verwendet Gemini Google-Search-Grounding, um KI-synthetisierte Antworten mit
eingebetteten Quellenangaben zu erzeugen. Die Ergebnisse enthalten sowohl die synthetisierte Antwort als auch die Quell-
URLs.

- URLs von Quellenangaben aus dem Gemini-Grounding werden automatisch von Google-
  Weiterleitungs-URLs durch eine HEAD-Anfrage über den SSRF-geschützten
  Abrufpfad von OpenClaw in direkte URLs aufgelöst (Weiterleitungen folgen, HTTP/HTTPS-Validierung).
- Die Auflösung von Weiterleitungen verwendet strikte SSRF-Standardwerte, sodass Weiterleitungen zu
  privaten/internen Zielen blockiert werden.

## Unterstützte Parameter

Die Gemini-Suche unterstützt `query`, `freshness`, `date_after` und `date_before`.

`count` wird für die gemeinsame Kompatibilität mit `web_search` akzeptiert, aber das Gemini-Grounding
gibt weiterhin eine synthetisierte Antwort mit Quellenangaben anstelle einer Liste mit N
Ergebnissen zurück.

`freshness` akzeptiert `day`, `week`, `month`, `year` und die gemeinsamen Kurzformen
`pd`, `pw`, `pm` und `py`. `day`/`pd` fügt der Gemini-
Abfrage eine Aktualitätsanweisung hinzu, statt einen festen 24-Stunden-Zeitraum zu verwenden. `week`, `month`, `year` und explizite
`date_after`/`date_before`-Zeiträume legen für das Google-Search-Grounding von Gemini
`timeRangeFilter` fest. `country`, `language` und `domain_filter` werden nicht unterstützt.

## Modellauswahl

Das Standardmodell ist `gemini-2.5-flash` (schnell und kosteneffizient). Jedes Gemini-
Modell, das Grounding unterstützt, kann über
`plugins.entries.google.config.webSearch.model` verwendet werden.

## Überschreiben der Basis-URL

Legen Sie `plugins.entries.google.config.webSearch.baseUrl` fest, wenn die Gemini-Websuche
über einen Betreiber-Proxy oder einen benutzerdefinierten Gemini-kompatiblen Endpunkt geleitet werden
muss. Ist dieser Wert nicht festgelegt, verwendet die Gemini-Websuche erneut `models.providers.google.baseUrl`. Ein einfacher
`https://generativelanguage.googleapis.com`-Wert wird zu
`https://generativelanguage.googleapis.com/v1beta` normalisiert; benutzerdefinierte Proxy-Pfade werden
nach dem Entfernen abschließender Schrägstriche wie angegeben beibehalten.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit Textausschnitten
- [Perplexity Search](/de/tools/perplexity-search) -- strukturierte Ergebnisse + Inhaltsextraktion
