---
read_when:
    - Sie möchten Kimi für web_search verwenden
    - Sie benötigen einen KIMI_API_KEY oder MOONSHOT_API_KEY
summary: Kimi-Websuche über die Moonshot-Websuche
title: Kimi-Suche
x-i18n:
    generated_at: "2026-07-12T02:16:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi ist ein `web_search`-Provider, der auf der nativen Websuche von Moonshot basiert. Moonshot
synthetisiert eine einzelne Antwort mit Inline-Quellenangaben, ähnlich wie die
Provider für fundierte Antworten von Gemini und Grok, anstatt eine sortierte Ergebnisliste zurückzugeben.

## Einrichtung

<Steps>
  <Step title="Schlüssel erstellen">
    Rufen Sie einen API-Schlüssel von [Moonshot AI](https://platform.moonshot.cn/) ab.
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der Gateway-Umgebung (fügen Sie
    ihn bei einer Gateway-Installation zu `~/.openclaw/.env` hinzu), oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wenn Sie während `openclaw onboard` oder `openclaw configure --section web`
**Kimi** auswählen, werden Sie außerdem zu Folgendem aufgefordert:

- der Moonshot-API-Region: `https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`
- dem Websuchmodell (Standardwert: `kimi-k2.6`)

## Konfiguration

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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
setzen Sie den Wert ausdrücklich auf `kimi`, wenn mehrere Zugangsdaten für die Suche konfiguriert sind.

Die entsprechende bereichsspezifische Form unter `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`)
funktioniert ebenfalls; beide Strukturen werden zu derselben aufgelösten Konfiguration zusammengeführt.

Standardwerte: Bei Auslassung ist der Standardwert für `baseUrl` `https://api.moonshot.ai/v1` und für `model`
`kimi-k2.6`.

Wenn der Chat-Datenverkehr den chinesischen Host verwendet (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), verwendet Kimi `web_search` diesen Host automatisch ebenfalls,
wenn kein eigener `baseUrl` festgelegt ist. Dadurch greifen `.cn`-Schlüssel nicht versehentlich auf den
internationalen Endpunkt zu, der für diese Schlüssel HTTP 401 zurückgibt. Legen Sie ausdrücklich
einen Kimi-`baseUrl` fest, um diese Vererbung außer Kraft zu setzen.

## Anforderung an die Fundierung

OpenClaw gibt ein Kimi-`web_search`-Ergebnis erst zurück, nachdem die Antwort von Moonshot
native Fundierungsnachweise für die Websuche enthält, etwa die Wiedergabe eines `$web_search`-Tool-Aufrufs,
`search_results` oder URLs von Quellenangaben. Wenn Kimi ohne Fundierung direkt antwortet
(beispielsweise „Ich kann nicht im Internet suchen“), gibt OpenClaw den Fehler
`kimi_web_search_ungrounded` zurück, anstatt diesen Text als Suchergebnis zu behandeln.
Wiederholen Sie die Abfrage, wechseln Sie zu einem strukturierten Provider wie Brave oder verwenden Sie
`web_fetch` beziehungsweise das Browser-Tool, wenn Ihnen bereits eine Ziel-URL vorliegt.

## Tool-Parameter

| Parameter                                                       | Unterstützt                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | Ja                                                                                                                                   |
| `count`                                                         | Wird zur Provider-übergreifenden Kompatibilität akzeptiert, aber ignoriert: Kimi gibt immer eine synthetisierte Antwort statt einer Liste mit N Ergebnissen zurück |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Nein                                                                                                                                 |

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) – alle Provider und automatische Erkennung
- [Moonshot AI](/de/providers/moonshot) – Dokumentation zum Moonshot-Modell und Kimi-Coding-Provider
- [Gemini-Suche](/de/tools/gemini-search) – KI-synthetisierte Antworten über die Fundierung von Google
- [Grok-Suche](/de/tools/grok-search) – KI-synthetisierte Antworten über die Fundierung von xAI
