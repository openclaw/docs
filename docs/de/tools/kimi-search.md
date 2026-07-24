---
read_when:
    - Sie möchten Kimi für web_search verwenden
    - Sie benötigen einen KIMI_API_KEY oder MOONSHOT_API_KEY
summary: Kimi-Websuche über die Moonshot-Websuche
title: Kimi-Suche
x-i18n:
    generated_at: "2026-07-24T04:12:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 65e5f8c9f3b607dbcc3256c51a6a083864e31f65ed2a751d2d500abeb35ba844
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi ist ein `web_search`-Provider, der auf der nativen Websuche von Moonshot basiert. Moonshot
synthetisiert eine Antwort mit Inline-Quellenangaben, ähnlich wie die Provider für
fundierte Antworten von Gemini und Grok, statt eine sortierte Ergebnisliste zurückzugeben.

## Einrichtung

<Steps>
  <Step title="Schlüssel erstellen">
    Rufen Sie einen API-Schlüssel von [Moonshot AI](https://platform.moonshot.cn/) ab.
  </Step>
  <Step title="Schlüssel speichern">
    Legen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der Gateway-Umgebung fest (bei einer
    Gateway-Installation fügen Sie ihn zu `~/.openclaw/.env` hinzu), oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wenn Sie während `openclaw onboard` oder `openclaw configure --section web` **Kimi** auswählen,
werden Sie außerdem zu Folgendem aufgefordert:

- die Moonshot-API-Region: `https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`
- das Websuchmodell (standardmäßig `kimi-k2.6`)

## Konfiguration

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional, wenn KIMI_API_KEY oder MOONSHOT_API_KEY festgelegt ist
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

`tools.web.search.provider` wird bei Auslassung automatisch anhand der verfügbaren API-Schlüssel erkannt;
legen Sie es ausdrücklich auf `kimi` fest, wenn mehrere Suchanmeldedaten konfiguriert sind.

Konfigurieren Sie die Kimi-spezifischen Werte `apiKey`, `baseUrl` und `model` unter
`plugins.entries.moonshot.config.webSearch`.

Standardwerte: `baseUrl` verwendet bei Auslassung standardmäßig `https://api.moonshot.ai/v1`, `model`
standardmäßig `kimi-k2.6`.

Wenn der Chat-Datenverkehr den chinesischen Host verwendet (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), verwendet Kimi `web_search` diesen Host automatisch ebenfalls,
wenn der eigene Wert `baseUrl` nicht festgelegt ist, damit `.cn`-Schlüssel nicht versehentlich den
internationalen Endpunkt ansprechen (der für diese Schlüssel HTTP 401 zurückgibt). Legen Sie einen ausdrücklichen
Kimi-Wert für `baseUrl` fest, um diese Vererbung zu überschreiben.

## Grounding-Anforderung

OpenClaw gibt ein Kimi-Ergebnis für `web_search` erst zurück, nachdem die Antwort von Moonshot
native Grounding-Nachweise der Websuche enthält, etwa die Wiedergabe eines `$web_search`-Tool-Aufrufs,
`search_results` oder URLs für Quellenangaben. Wenn Kimi direkt ohne
Grounding antwortet (zum Beispiel „Ich kann nicht im Internet suchen“), gibt OpenClaw stattdessen einen
`kimi_web_search_ungrounded`-Fehler zurück, anstatt diesen Text als Suchergebnis
zu behandeln. Versuchen Sie die Abfrage erneut, wechseln Sie zu einem strukturierten Provider wie Brave oder verwenden Sie
`web_fetch` beziehungsweise das Browser-Tool, wenn Sie bereits eine Ziel-URL haben.

## Tool-Parameter

| Parameter                                                       | Unterstützt                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | Ja                                                                                                                      |
| `count`                                                         | Wird zur Provider-übergreifenden Kompatibilität akzeptiert, aber ignoriert: Kimi gibt immer eine synthetisierte Antwort zurück, keine Liste mit N Ergebnissen |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Nein                                                                                                                       |

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) - alle Provider und automatische Erkennung
- [Moonshot AI](/de/providers/moonshot) - Dokumentation zum Moonshot-Modell und Kimi-Coding-Provider
- [Gemini Search](/de/tools/gemini-search) - KI-synthetisierte Antworten mittels Google-Grounding
- [Grok Search](/de/tools/grok-search) - KI-synthetisierte Antworten mittels xAI-Grounding
