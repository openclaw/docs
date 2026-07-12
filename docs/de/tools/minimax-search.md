---
read_when:
    - Sie möchten MiniMax für web_search verwenden
    - Sie benötigen einen MiniMax-Token-Plan-Schlüssel oder ein OAuth-Token
    - Sie benötigen Hinweise zum MiniMax-Suchhost für China bzw. weltweit.
summary: MiniMax-Suche über die Such-API des Token Plan
title: MiniMax-Suche
x-i18n:
    generated_at: "2026-07-12T16:05:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw unterstützt MiniMax als `web_search`-Provider über die Such-API des MiniMax
Token Plan. Sie gibt strukturierte Suchergebnisse mit Titeln, URLs,
Textausschnitten und verwandten Suchanfragen zurück.

## Anmeldedaten für einen Token Plan abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Erstellen oder kopieren Sie einen MiniMax-Token-Plan-Schlüssel von der
    [MiniMax-Plattform](https://platform.minimax.io/user-center/basic-information/interface-key).
    OAuth-Konfigurationen können stattdessen `MINIMAX_OAUTH_TOKEN` wiederverwenden.
  </Step>
  <Step title="Schlüssel speichern">
    Legen Sie `MINIMAX_CODE_PLAN_KEY` in der Gateway-Umgebung fest oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akzeptiert außerdem `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` und
`MINIMAX_API_KEY` als Umgebungsvariablen-Aliasse, die in dieser Reihenfolge nach
`MINIMAX_CODE_PLAN_KEY` geprüft werden. `MINIMAX_API_KEY` sollte auf
Token-Plan-Anmeldedaten mit aktivierter Suche verweisen; gewöhnliche API-Schlüssel für
MiniMax-Modelle werden vom Such-Endpunkt des Token Plan möglicherweise nicht akzeptiert.

## Konfiguration

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional, wenn eine MiniMax-Token-Plan-Umgebungsvariable festgelegt ist
            region: "global", // oder "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Alternative über die Umgebung:** Legen Sie `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` in der Gateway-Umgebung fest.
Bei einer Gateway-Installation tragen Sie die Variable in `~/.openclaw/.env` ein.

## Regionsauswahl

MiniMax Search verwendet diese Endpunkte:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Wenn `plugins.entries.minimax.config.webSearch.region` nicht festgelegt ist, ermittelt OpenClaw
die Region in dieser Reihenfolge:

1. `tools.web.search.minimax.region` / Plugin-eigene Einstellung `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Das bedeutet, dass ein CN-Onboarding oder `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search automatisch ebenfalls auf dem CN-Host belässt.

Auch wenn Sie sich über den OAuth-Pfad `minimax-portal` bei MiniMax authentifiziert haben,
wird die Websuche weiterhin mit der Provider-ID `minimax` registriert; die Basis-URL des
OAuth-Providers dient als Regionshinweis für die Auswahl des CN- oder globalen Hosts, und
`MINIMAX_OAUTH_TOKEN` kann die Bearer-Anmeldedaten für MiniMax Search bereitstellen.

## Unterstützte Parameter

| Parameter | Typ     | Einschränkungen       | Beschreibung                                                                       |
| --------- | ------- | --------------------- | ---------------------------------------------------------------------------------- |
| `query`   | string  | erforderlich          | Zeichenfolge der Suchanfrage.                                                      |
| `count`   | integer | 1-10, Standardwert 5  | Anzahl der zurückzugebenden Ergebnisse. OpenClaw kürzt die zurückgegebene Liste auf diese Größe. |

Provider-spezifische Filter werden derzeit nicht unterstützt.

## Verwandte Themen

- [Übersicht über die Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [MiniMax](/de/providers/minimax) -- Einrichtung von Modellen, Bildern, Sprache und Authentifizierung
