---
read_when:
    - Sie möchten Kimi für web_search verwenden
    - Sie benötigen einen KIMI_API_KEY oder MOONSHOT_API_KEY
summary: Kimi-Websuche über Moonshot-Websuche
title: Kimi-Suche
x-i18n:
    generated_at: "2026-05-02T06:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw unterstützt Kimi als `web_search`-Provider und verwendet die Moonshot-Websuche,
um KI-generierte Antworten mit Quellenangaben zu erzeugen.

## API-Schlüssel abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Rufen Sie einen API-Schlüssel von [Moonshot AI](https://platform.moonshot.cn/) ab.
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der Gateway-Umgebung oder
    konfigurieren Sie dies über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wenn Sie während `openclaw onboard` oder
`openclaw configure --section web` **Kimi** auswählen, kann OpenClaw auch nach Folgendem fragen:

- der Moonshot-API-Region:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- dem standardmäßigen Kimi-Websuchmodell (standardmäßig `kimi-k2.6`)

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

Wenn Sie den China-API-Host für Chat verwenden (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), verwendet OpenClaw denselben Host auch für Kimi
`web_search`, wenn `tools.web.search.kimi.baseUrl` ausgelassen wird. Dadurch treffen Schlüssel von
[platform.moonshot.cn](https://platform.moonshot.cn/) nicht versehentlich den
internationalen Endpunkt (der häufig HTTP 401 zurückgibt). Überschreiben Sie dies
mit `tools.web.search.kimi.baseUrl`, wenn Sie eine andere Such-Basis-URL benötigen.

**Alternative per Umgebung:** Setzen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der
Gateway-Umgebung. Bei einer Gateway-Installation legen Sie ihn in `~/.openclaw/.env` ab.

Wenn Sie `baseUrl` auslassen, verwendet OpenClaw standardmäßig `https://api.moonshot.ai/v1`.
Wenn Sie `model` auslassen, verwendet OpenClaw standardmäßig `kimi-k2.6`.

## Funktionsweise

Kimi verwendet die Moonshot-Websuche, um Antworten mit Inline-Quellenangaben zu synthetisieren,
ähnlich wie beim Ansatz von Gemini und Grok für fundierte Antworten.

OpenClaw behandelt Kimi `web_search` nur dann als erfolgreich, nachdem Moonshot
native Grounding-Nachweise aus der Websuche zurückgibt, etwa eine erneut abspielbare
`$web_search`-Tool-Nutzlast, `search_results` oder Quellen-URLs. Wenn Kimi sofort mit einer
einfachen Chat-Antwort wie „Ich kann nicht im Internet surfen“ stoppt und keine Grounding-Nachweise liefert,
gibt OpenClaw stattdessen einen strukturierten Fehler `kimi_web_search_ungrounded` zurück,
anstatt diesen Text als Suchergebnis zu verpacken. Wiederholen Sie die Abfrage, wechseln Sie zu einem strukturierten
Provider wie Brave oder verwenden Sie `web_fetch` / das Browser-Tool, wenn Ihnen bereits
eine Ziel-URL vorliegt.

## Unterstützte Parameter

Die Kimi-Suche unterstützt `query`.

`count` wird für die gemeinsame `web_search`-Kompatibilität akzeptiert, Kimi gibt jedoch weiterhin
eine einzelne synthetisierte Antwort mit Quellenangaben zurück, statt einer Liste mit N Ergebnissen.

Provider-spezifische Filter werden derzeit nicht unterstützt.

## Verwandte Themen

- [Websuche-Übersicht](/de/tools/web) -- alle Provider und automatische Erkennung
- [Moonshot AI](/de/providers/moonshot) -- Dokumentation zum Moonshot-Modell und Kimi Coding-Provider
- [Gemini Search](/de/tools/gemini-search) -- KI-generierte Antworten über Google-Grounding
- [Grok Search](/de/tools/grok-search) -- KI-generierte Antworten über xAI-Grounding
