---
read_when:
    - Sie möchten Kimi für web_search verwenden
    - Sie benötigen einen `KIMI_API_KEY` oder `MOONSHOT_API_KEY`
summary: Kimi-Websuche über Moonshot-Websuche
title: Kimi-Suche
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw unterstützt Kimi als `web_search`-Provider und verwendet dabei Moonshot-Websuche,
um KI-synthetisierte Antworten mit Zitaten zu erzeugen.

## API-Schlüssel abrufen

<Steps>
  <Step title="Einen Schlüssel erstellen">
    Holen Sie sich einen API-Schlüssel von [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Den Schlüssel speichern">
    Setzen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der Gateway-Umgebung oder
    konfigurieren Sie dies über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wenn Sie **Kimi** während `openclaw onboard` oder
`openclaw configure --section web` auswählen, kann OpenClaw auch nach Folgendem fragen:

- der Moonshot-API-Region:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- dem Standardmodell für Kimi-Websuche (Standard ist `kimi-k2.6`)

## Konfiguration

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional, wenn KIMI_API_KEY oder MOONSHOT_API_KEY gesetzt ist
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

Wenn Sie den China-API-Host für Chat verwenden (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), verwendet OpenClaw denselben Host für Kimi-
`web_search`, wenn `tools.web.search.kimi.baseUrl` weggelassen wird, sodass Schlüssel von
[platform.moonshot.cn](https://platform.moonshot.cn/) nicht versehentlich den
internationalen Endpunkt treffen (der häufig HTTP 401 zurückgibt). Überschreiben Sie dies
mit `tools.web.search.kimi.baseUrl`, wenn Sie eine andere Search-Base-URL benötigen.

**Alternative über Umgebung:** Setzen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der
Gateway-Umgebung. Für eine Gateway-Installation legen Sie ihn in `~/.openclaw/.env` ab.

Wenn Sie `baseUrl` weglassen, verwendet OpenClaw standardmäßig `https://api.moonshot.ai/v1`.
Wenn Sie `model` weglassen, verwendet OpenClaw standardmäßig `kimi-k2.6`.

## So funktioniert es

Kimi verwendet Moonshot-Websuche, um Antworten mit Inline-Zitaten zu synthetisieren,
ähnlich wie Gemini und Grok bei fundierten Antworten.

## Unterstützte Parameter

Die Kimi-Suche unterstützt `query`.

`count` wird aus Gründen der gemeinsamen `web_search`-Kompatibilität akzeptiert, aber Kimi gibt weiterhin
eine synthetisierte Antwort mit Zitaten zurück statt einer Liste aus N Ergebnissen.

Providerspezifische Filter werden derzeit nicht unterstützt.

## Verwandt

- [Überblick zur Websuche](/de/tools/web) -- alle Provider und Auto-Erkennung
- [Moonshot AI](/de/providers/moonshot) -- Dokumentation zum Provider für Moonshot-Modelle + Kimi Coding
- [Gemini Search](/de/tools/gemini-search) -- KI-synthetisierte Antworten über Google-Grounding
- [Grok Search](/de/tools/grok-search) -- KI-synthetisierte Antworten über xAI-Grounding
