---
read_when:
    - Sie möchten MiniMax für `web_search` verwenden.
    - Sie benötigen einen MiniMax-Token-Plan-Schlüssel oder ein OAuth-Token.
    - Sie benötigen Hinweise zum Suchhost für MiniMax CN/global
summary: MiniMax-Suche über die Such-API des Token Plan
title: MiniMax-Suche
x-i18n:
    generated_at: "2026-07-12T02:14:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw unterstützt MiniMax als `web_search`-Provider über die Such-API des MiniMax
Token Plan. Sie liefert strukturierte Suchergebnisse mit Titeln, URLs,
Textauszügen und verwandten Suchanfragen.

## Zugangsdaten für einen Token Plan abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Erstellen oder kopieren Sie einen MiniMax-Token-Plan-Schlüssel auf der
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
`MINIMAX_API_KEY` als Umgebungsvariablen-Aliasse, die nach
`MINIMAX_CODE_PLAN_KEY` in dieser Reihenfolge geprüft werden. `MINIMAX_API_KEY` sollte auf
Token-Plan-Zugangsdaten mit aktivierter Suche verweisen; gewöhnliche API-Schlüssel für
MiniMax-Modelle werden vom Suchendpunkt des Token Plan möglicherweise nicht akzeptiert.

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

**Alternative über Umgebungsvariablen:** Legen Sie `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` in der Gateway-Umgebung fest.
Bei einer Gateway-Installation tragen Sie die Variable in `~/.openclaw/.env` ein.

## Regionsauswahl

MiniMax Search verwendet diese Endpunkte:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- China: `https://api.minimaxi.com/v1/coding_plan/search`

Wenn `plugins.entries.minimax.config.webSearch.region` nicht festgelegt ist, ermittelt OpenClaw
die Region in dieser Reihenfolge:

1. `tools.web.search.minimax.region` / Plugin-eigene Einstellung `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Das bedeutet, dass ein Onboarding für China oder `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search automatisch ebenfalls auf dem chinesischen Host belässt.

Selbst wenn Sie sich bei MiniMax über den OAuth-Pfad `minimax-portal` authentifiziert haben,
wird die Websuche weiterhin mit der Provider-ID `minimax` registriert; die Basis-URL
des OAuth-Providers dient als Regionshinweis für die Auswahl des chinesischen oder globalen Hosts,
und `MINIMAX_OAUTH_TOKEN` kann die Bearer-Zugangsdaten für MiniMax Search bereitstellen.

## Unterstützte Parameter

| Parameter | Typ      | Einschränkungen    | Beschreibung                                                                        |
| --------- | -------- | ------------------ | ----------------------------------------------------------------------------------- |
| `query`   | Zeichenfolge | erforderlich    | Zeichenfolge der Suchanfrage.                                                       |
| `count`   | Ganzzahl | 1–10, Standardwert 5 | Anzahl der zurückzugebenden Ergebnisse. OpenClaw kürzt die zurückgegebene Liste auf diese Größe. |

Provider-spezifische Filter werden derzeit nicht unterstützt.

## Verwandte Themen

- [Übersicht über die Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [MiniMax](/de/providers/minimax) -- Einrichtung von Modellen, Bildern, Sprachausgabe und Authentifizierung
