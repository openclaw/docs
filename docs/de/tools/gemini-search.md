---
read_when:
    - Sie möchten Gemini für web_search verwenden.
    - Sie benötigen einen `GEMINI_API_KEY` oder `models.providers.google.apiKey`
    - Sie möchten Grounding mit der Google-Suche nutzen
summary: Gemini-Websuche mit Google-Suche-Grounding
title: Gemini-Suche
x-i18n:
    generated_at: "2026-07-12T15:57:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw unterstützt Gemini-Modelle mit integrierter
[Fundierung durch Google Search](https://ai.google.dev/gemini-api/docs/grounding),
die KI-generierte Antworten zurückgibt, die auf aktuellen Google-Suchergebnissen mit
Quellenangaben basieren.

## API-Schlüssel abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Rufen Sie [Google AI Studio](https://aistudio.google.com/apikey) auf und erstellen Sie einen
    API-Schlüssel.
  </Step>
  <Step title="Schlüssel speichern">
    Legen Sie `GEMINI_API_KEY` in der Gateway-Umgebung fest, verwenden Sie
    `models.providers.google.apiKey` wieder oder konfigurieren Sie einen dedizierten Schlüssel für die Websuche über:

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
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; greift ersatzweise auf models.providers.google.baseUrl zurück
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
`plugins.entries.google.config.webSearch.apiKey`, dann `GEMINI_API_KEY` und
anschließend `models.providers.google.apiKey`. Bei Basis-URLs hat die dedizierte
`plugins.entries.google.config.webSearch.baseUrl` Vorrang vor
`models.providers.google.baseUrl`.

Legen Sie bei einer Gateway-Installation Umgebungsschlüssel in `~/.openclaw/.env` ab.

## Funktionsweise

Im Gegensatz zu herkömmlichen Such-Providern, die eine Liste mit Links und Textausschnitten
zurückgeben, verwendet Gemini die Fundierung durch Google Search, um KI-generierte Antworten mit
eingebetteten Quellenangaben zu erstellen. Die Ergebnisse enthalten sowohl die generierte Antwort als auch die
Quell-URLs.

- URLs aus Quellenangaben der Gemini-Fundierung werden über eine HEAD-Anfrage durch den
  SSRF-geschützten Abrufpfad von OpenClaw automatisch von Google-Weiterleitungs-URLs
  in direkte URLs aufgelöst (Weiterleitungen folgen, HTTP/HTTPS-Validierung).
- Die Auflösung von Weiterleitungen verwendet strenge SSRF-Standardeinstellungen, sodass Weiterleitungen zu
  privaten/internen Zielen blockiert werden.

## Unterstützte Parameter

Die Gemini-Suche unterstützt `query`, `freshness`, `date_after` und `date_before`.

`count` wird zur Kompatibilität mit dem gemeinsamen `web_search` akzeptiert, die Gemini-Fundierung
gibt jedoch weiterhin eine einzelne generierte Antwort mit Quellenangaben statt einer
Liste mit N Ergebnissen zurück.

`freshness` akzeptiert `day`, `week`, `month`, `year` sowie die gemeinsamen Kurzformen
`pd`, `pw`, `pm` und `py`. `day`/`pd` fügt der Gemini-Abfrage eine Aktualitätsanweisung
hinzu, anstatt einen festen Zeitraum von 24 Stunden festzulegen. `week`, `month`, `year` und explizite
Bereiche mit `date_after`/`date_before` legen den
`timeRangeFilter` der Fundierung durch Gemini Google Search fest. `country`, `language` und `domain_filter` werden nicht unterstützt.

## Modellauswahl

Das Standardmodell ist `gemini-2.5-flash` (schnell und kosteneffizient). Jedes Gemini-Modell,
das Fundierung unterstützt, kann über
`plugins.entries.google.config.webSearch.model` verwendet werden.

## Überschreiben der Basis-URL

Legen Sie `plugins.entries.google.config.webSearch.baseUrl` fest, wenn die Gemini-Websuche
über einen Betreiber-Proxy oder einen benutzerdefinierten Gemini-kompatiblen Endpunkt geleitet werden
muss. Ist dieser Wert nicht festgelegt, verwendet die Gemini-Websuche `models.providers.google.baseUrl` wieder. Ein einfacher
Wert `https://generativelanguage.googleapis.com` wird zu
`https://generativelanguage.googleapis.com/v1beta` normalisiert; benutzerdefinierte Proxy-Pfade werden
nach dem Entfernen abschließender Schrägstriche unverändert beibehalten.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit Textausschnitten
- [Perplexity Search](/de/tools/perplexity-search) -- strukturierte Ergebnisse + Inhaltsextraktion
