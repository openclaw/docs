---
read_when:
    - Sie möchten MiniMax für web_search verwenden
    - Sie benötigen einen MiniMax Token Plan-Schlüssel oder ein OAuth-Token
    - Sie möchten Hinweise zum MiniMax-CN/global-Suchhost
summary: MiniMax Search über die Token Plan-Such-API
title: MiniMax-Suche
x-i18n:
    generated_at: "2026-05-11T20:38:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw unterstützt MiniMax als `web_search`-Provider über die Such-API des MiniMax
Token Plan. Sie gibt strukturierte Suchergebnisse mit Titeln, URLs,
Ausschnitten und verwandten Abfragen zurück.

## Token Plan-Zugangsdaten abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Erstellen oder kopieren Sie einen MiniMax Token Plan-Schlüssel von der
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    OAuth-Einrichtungen können stattdessen `MINIMAX_OAUTH_TOKEN` wiederverwenden.
  </Step>
  <Step title="Schlüssel speichern">
    Legen Sie `MINIMAX_CODE_PLAN_KEY` in der Gateway-Umgebung fest oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akzeptiert außerdem `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` und
`MINIMAX_API_KEY` als Env-Aliasse. `MINIMAX_API_KEY` sollte auf
Token Plan-Zugangsdaten mit aktivierter Suche verweisen; gewöhnliche MiniMax-Modell-API-Schlüssel werden vom Such-Endpunkt des Token Plan möglicherweise nicht
akzeptiert.

## Konfiguration

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
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
Für eine Gateway-Installation legen Sie ihn in `~/.openclaw/.env` ab.

## Regionsauswahl

MiniMax Search verwendet diese Endpunkte:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Wenn `plugins.entries.minimax.config.webSearch.region` nicht festgelegt ist, löst OpenClaw
die Region in dieser Reihenfolge auf:

1. `tools.web.search.minimax.region` / Plugin-eigene `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Das bedeutet, dass CN-Onboarding oder `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search automatisch ebenfalls auf dem CN-Host hält.

Auch wenn Sie MiniMax über den OAuth-Pfad `minimax-portal` authentifiziert haben,
wird die Websuche weiterhin mit der Provider-ID `minimax` registriert; die Basis-URL des OAuth-Providers
wird als Regionshinweis für die Auswahl des CN/global-Hosts verwendet, und `MINIMAX_OAUTH_TOKEN`
kann die Bearer-Zugangsdaten für MiniMax Search erfüllen.

## Unterstützte Parameter

| Parameter | Typ     | Einschränkungen | Beschreibung                                                               |
| --------- | ------- | --------------- | -------------------------------------------------------------------------- |
| `query`   | string  | erforderlich    | Suchabfragezeichenfolge.                                                   |
| `count`   | integer | 1-10            | Anzahl der zurückzugebenden Ergebnisse. OpenClaw kürzt die zurückgegebene Liste auf diese Größe. |

Provider-spezifische Filter werden derzeit nicht unterstützt.

## Verwandte Themen

- [Websuche-Übersicht](/de/tools/web) -- alle Provider und automatische Erkennung
- [MiniMax](/de/providers/minimax) -- Modell-, Bild-, Sprach- und Authentifizierungseinrichtung
