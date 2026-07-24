---
read_when:
    - Sie möchten MiniMax für web_search verwenden
    - Sie benötigen einen Schlüssel für den MiniMax Token Plan oder ein OAuth-Token
    - Sie wünschen eine Anleitung zum MiniMax-Suchhost für China/global.
summary: MiniMax Search über die Token-Plan-Such-API
title: MiniMax-Suche
x-i18n:
    generated_at: "2026-07-24T04:11:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb851614bbe43f011e07fe3e80d5390f1ba515f3e00ba749c91999617ad2d1e2
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw unterstützt MiniMax als `web_search`-Provider über die MiniMax
Token Plan Search API. Sie gibt strukturierte Suchergebnisse mit Titeln, URLs,
Textauszügen und verwandten Suchanfragen zurück.

## Token-Plan-Zugangsdaten abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Erstellen oder kopieren Sie einen MiniMax-Token-Plan-Schlüssel von der
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    OAuth-Konfigurationen können stattdessen `MINIMAX_OAUTH_TOKEN` wiederverwenden.
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `MINIMAX_CODE_PLAN_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akzeptiert außerdem `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` und
`MINIMAX_API_KEY` als Umgebungsvariablen-Aliasse, die in dieser Reihenfolge nach
`MINIMAX_CODE_PLAN_KEY` geprüft werden. `MINIMAX_API_KEY` sollte auf
Token-Plan-Zugangsdaten mit aktivierter Suche verweisen; gewöhnliche MiniMax-Modell-API-Schlüssel werden vom
Token-Plan-Suchendpunkt möglicherweise nicht akzeptiert.

## Konfiguration

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional, wenn eine MiniMax-Token-Plan-Umgebungsvariable gesetzt ist
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

**Alternative über Umgebungsvariablen:** Setzen Sie `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` in der Gateway-Umgebung.
Bei einer Gateway-Installation tragen Sie die Variable in `~/.openclaw/.env` ein.

## Regionsauswahl

MiniMax Search verwendet diese Endpunkte:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Wenn `plugins.entries.minimax.config.webSearch.region` nicht gesetzt ist, ermittelt OpenClaw
die Region in dieser Reihenfolge:

1. Plugin-eigenes `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Das bedeutet, dass ein CN-Onboarding oder `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search automatisch ebenfalls auf dem CN-Host belässt.

Auch wenn Sie MiniMax über den OAuth-Pfad `minimax-portal` authentifiziert haben,
wird die Websuche weiterhin mit der Provider-ID `minimax` registriert; die Basis-URL
des OAuth-Providers dient als Regionshinweis für die Auswahl des CN-/globalen Hosts, und `MINIMAX_OAUTH_TOKEN`
kann die Bearer-Zugangsdaten für MiniMax Search bereitstellen.

## Unterstützte Parameter

| Parameter | Typ     | Einschränkungen | Beschreibung                                                                  |
| --------- | ------- | --------------- | ----------------------------------------------------------------------------- |
| `query`   | string  | erforderlich    | Zeichenfolge der Suchanfrage.                                                 |
| `count`   | integer | 1-10, Standard 5 | Anzahl der zurückzugebenden Ergebnisse. OpenClaw kürzt die zurückgegebene Liste auf diese Größe. |

Provider-spezifische Filter werden derzeit nicht unterstützt.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [MiniMax](/de/providers/minimax) -- Einrichtung von Modell, Bild, Sprache und Authentifizierung
