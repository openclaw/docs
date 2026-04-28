---
read_when:
    - Sie möchten Grok für `web_search` verwenden
    - Sie benötigen ein `XAI_API_KEY` für die Websuche
summary: Grok-Websuche über web-gegroundete Antworten von xAI
title: Grok-Suche
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T07:03:35Z"
  model: gpt-5.4
  provider: openai
  source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
  source_path: tools/grok-search.md
  workflow: 15
---

OpenClaw unterstützt Grok als Anbieter für `web_search` und verwendet dabei web-gegroundete
Antworten von xAI, um AI-synthetisierte Antworten zu erzeugen, die auf Live-Suchergebnissen
mit Zitaten basieren.

Dasselbe `XAI_API_KEY` kann auch das integrierte Tool `x_search` für die Suche nach Beiträgen auf X
(früher Twitter) versorgen. Wenn Sie den Schlüssel unter
`plugins.entries.xai.config.webSearch.apiKey` speichern, verwendet OpenClaw ihn jetzt auch als
Fallback für den gebündelten xAI-Modellanbieter.

Für Metriken auf Beitragsebene auf X wie Reposts, Antworten, Lesezeichen oder Aufrufe bevorzugen Sie
`x_search` mit der exakten Beitrags-URL oder Status-ID statt einer breiten Suchanfrage.

## Onboarding und Konfiguration

Wenn Sie **Grok** wählen während:

- `openclaw onboard`
- `openclaw configure --section web`

kann OpenClaw einen separaten Folgeschritt anzeigen, um `x_search` mit demselben
`XAI_API_KEY` zu aktivieren. Dieser Folgeschritt:

- erscheint nur, nachdem Sie Grok für `web_search` gewählt haben
- ist keine separate Auswahl eines Web-Suchanbieters auf oberster Ebene
- kann optional im selben Ablauf das Modell `x_search` setzen

Wenn Sie ihn überspringen, können Sie `x_search` später in der Konfiguration aktivieren oder ändern.

## Einen API-Schlüssel beziehen

<Steps>
  <Step title="Einen Schlüssel erstellen">
    Beziehen Sie einen API-Schlüssel von [xAI](https://console.x.ai/).
  </Step>
  <Step title="Den Schlüssel speichern">
    Setzen Sie `XAI_API_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn über:

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
            apiKey: "xai-...", // optional, wenn XAI_API_KEY gesetzt ist
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

**Alternative über die Umgebung:** Setzen Sie `XAI_API_KEY` in der Gateway-Umgebung.
Bei einer Gateway-Installation legen Sie es in `~/.openclaw/.env` ab.

## Funktionsweise

Grok verwendet web-gegroundete Antworten von xAI, um Antworten mit Inline-
Zitaten zu synthetisieren, ähnlich dem Grounding-Ansatz von Gemini mit Google Search.

## Unterstützte Parameter

Grok-Suche unterstützt `query`.

`count` wird aus Kompatibilitätsgründen für das gemeinsame `web_search` akzeptiert, aber Grok gibt weiterhin
eine synthetisierte Antwort mit Zitaten zurück statt einer Liste mit N Ergebnissen.

Anbieterspezifische Filter werden derzeit nicht unterstützt.

## Verwandt

- [Überblick über Web Search](/de/tools/web) -- alle Anbieter und Auto-Erkennung
- [x_search in Web Search](/de/tools/web#x_search) -- erstklassige X-Suche über xAI
- [Gemini Search](/de/tools/gemini-search) -- AI-synthetisierte Antworten über Google-Grounding
