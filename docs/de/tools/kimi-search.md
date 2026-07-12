---
read_when:
    - Sie möchten Kimi für `web_search` verwenden.
    - Sie benötigen einen `KIMI_API_KEY` oder `MOONSHOT_API_KEY`
summary: Kimi-Websuche über die Moonshot-Websuche
title: Kimi-Suche
x-i18n:
    generated_at: "2026-07-12T15:58:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi ist ein `web_search`-Provider, der auf der nativen Websuche von Moonshot basiert. Moonshot
synthetisiert eine Antwort mit Inline-Quellenangaben, ähnlich wie die Provider für
quellengestützte Antworten von Gemini und Grok, statt eine nach Relevanz sortierte Ergebnisliste zurückzugeben.

## Einrichtung

<Steps>
  <Step title="Schlüssel erstellen">
    Rufen Sie einen API-Schlüssel von [Moonshot AI](https://platform.moonshot.cn/) ab.
  </Step>
  <Step title="Schlüssel speichern">
    Legen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der Gateway-Umgebung fest (fügen Sie ihn bei einer
    Gateway-Installation zu `~/.openclaw/.env` hinzu), oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wenn Sie während `openclaw onboard` oder `openclaw configure --section web`
**Kimi** auswählen, werden Sie außerdem nach Folgendem gefragt:

- der Moonshot-API-Region: `https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`
- dem Websuchmodell (standardmäßig `kimi-k2.6`)

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
legen Sie ihn explizit auf `kimi` fest, wenn mehrere Suchzugangsdaten konfiguriert sind.

Die entsprechende bereichsspezifische Form unter `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`)
funktioniert ebenfalls; beide Strukturen werden in derselben aufgelösten Konfiguration zusammengeführt.

Standardwerte: Wenn `baseUrl` ausgelassen wird, ist der Standardwert `https://api.moonshot.ai/v1`; für `model`
ist der Standardwert `kimi-k2.6`.

Wenn der Chat-Datenverkehr den chinesischen Host verwendet (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), verwendet Kimi `web_search` diesen Host automatisch ebenfalls,
wenn die eigene `baseUrl` nicht festgelegt ist. Dadurch greifen `.cn`-Schlüssel nicht versehentlich auf den
internationalen Endpunkt zu (der für diese Schlüssel HTTP 401 zurückgibt). Legen Sie für Kimi eine explizite
`baseUrl` fest, um diese Vererbung außer Kraft zu setzen.

## Anforderung an die Quellenbelegung

OpenClaw gibt ein Kimi-`web_search`-Ergebnis erst zurück, nachdem die Antwort von Moonshot
native Belege für die Websuche enthält, beispielsweise die Wiedergabe eines `$web_search`-Tool-Aufrufs,
`search_results` oder Quellen-URLs. Wenn Kimi direkt ohne Quellenbelegung antwortet
(beispielsweise „Ich kann nicht im Internet suchen“), gibt OpenClaw einen
`kimi_web_search_ungrounded`-Fehler zurück, statt diesen Text als Suchergebnis zu behandeln.
Wiederholen Sie die Abfrage, wechseln Sie zu einem strukturierten Provider wie Brave oder verwenden Sie
`web_fetch` beziehungsweise das Browser-Tool, wenn Ihnen bereits eine Ziel-URL vorliegt.

## Tool-Parameter

| Parameter                                                       | Unterstützt                                                                                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | Ja                                                                                                                                 |
| `count`                                                         | Wird zur anbieterübergreifenden Kompatibilität akzeptiert, aber ignoriert: Kimi gibt immer eine synthetisierte Antwort zurück, keine Liste mit N Ergebnissen |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Nein                                                                                                                               |

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) - alle Provider und automatische Erkennung
- [Moonshot AI](/de/providers/moonshot) - Dokumentation zum Moonshot-Modell und zum Kimi-Coding-Provider
- [Gemini Search](/de/tools/gemini-search) - KI-synthetisierte Antworten mit Quellenbelegung durch Google
- [Grok Search](/de/tools/grok-search) - KI-synthetisierte Antworten mit Quellenbelegung durch xAI
