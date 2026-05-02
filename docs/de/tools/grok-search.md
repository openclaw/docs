---
read_when:
    - Sie möchten Grok für web_search verwenden
    - Sie benötigen einen XAI_API_KEY für die Websuche
summary: Grok-Websuche über webgestützte Antworten von xAI
title: Grok-Suche
x-i18n:
    generated_at: "2026-05-02T06:47:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw unterstützt Grok als `web_search`-Provider und verwendet webgestützte
Antworten von xAI, um KI-synthetisierte Antworten auf Basis von Live-Suchergebnissen
mit Zitaten zu erstellen.

Derselbe `XAI_API_KEY` kann auch das integrierte Tool `x_search` für die Suche
nach Beiträgen auf X (ehemals Twitter) betreiben. Wenn Sie den Schlüssel unter
`plugins.entries.xai.config.webSearch.apiKey` speichern, verwendet OpenClaw ihn jetzt
auch als Fallback für den gebündelten xAI-Modell-Provider.

Für beitragsspezifische X-Metriken wie Reposts, Antworten, Lesezeichen oder Aufrufe
verwenden Sie bevorzugt `x_search` mit der exakten Beitrags-URL oder Status-ID statt
einer breiten Suchanfrage.

## Onboarding und Konfiguration

Wenn Sie **Grok** während:

- `openclaw onboard`
- `openclaw configure --section web`

auswählen, kann OpenClaw einen separaten Folgeschritt anzeigen, um `x_search` mit demselben
`XAI_API_KEY` zu aktivieren. Dieser Folgeschritt:

- erscheint nur, nachdem Sie Grok für `web_search` ausgewählt haben
- ist keine separate Websuche-Provider-Auswahl auf oberster Ebene
- kann optional während desselben Ablaufs das `x_search`-Modell festlegen

Wenn Sie ihn überspringen, können Sie `x_search` später in der Konfiguration aktivieren oder ändern.

## API-Schlüssel abrufen

<Steps>
  <Step title="Create a key">
    Rufen Sie einen API-Schlüssel von [xAI](https://console.x.ai/) ab.
  </Step>
  <Step title="Store the key">
    Legen Sie `XAI_API_KEY` in der Gateway-Umgebung fest oder konfigurieren Sie ihn über:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Umgebungsalternative:** Legen Sie `XAI_API_KEY` in der Gateway-Umgebung fest.
Bei einer Gateway-Installation legen Sie ihn in `~/.openclaw/.env` ab.

## Funktionsweise

Grok verwendet webgestützte Antworten von xAI, um Antworten mit Inline-Zitaten
zu synthetisieren, ähnlich dem Ansatz von Gemini für Google-Search-Grounding.

## Unterstützte Parameter

Die Grok-Suche unterstützt `query`.

`count` wird aus Kompatibilitätsgründen mit dem gemeinsamen `web_search` akzeptiert,
aber Grok gibt weiterhin eine synthetisierte Antwort mit Zitaten zurück statt einer
Liste mit N Ergebnissen.

Provider-spezifische Filter werden derzeit nicht unterstützt.

Grok verwendet ein Provider-spezifisches Standard-Timeout von 60 Sekunden, weil
webgestützte Suchen über xAI Responses länger laufen können als der gemeinsame
`web_search`-Standard. Legen Sie `tools.web.search.timeoutSeconds` fest, um es zu überschreiben.

## Basis-URL-Overrides

Legen Sie `plugins.entries.xai.config.webSearch.baseUrl` fest, wenn die Grok-Websuche
über einen Betreiber-Proxy oder einen xAI-kompatiblen Responses-Endpunkt geleitet
werden soll. OpenClaw sendet nach dem Entfernen abschließender Schrägstriche an
`<baseUrl>/responses`. `x_search` verwendet denselben `webSearch.baseUrl`-Fallback, sofern
`plugins.entries.xai.config.xSearch.baseUrl` nicht festgelegt ist.

## Verwandte Themen

- [Web Search-Übersicht](/de/tools/web) -- alle Provider und automatische Erkennung
- [x_search in Web Search](/de/tools/web#x_search) -- erstklassige X-Suche über xAI
- [Gemini Search](/de/tools/gemini-search) -- KI-synthetisierte Antworten über Google-Grounding
