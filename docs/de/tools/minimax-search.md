---
read_when:
    - Sie möchten MiniMax für web_search verwenden
    - Sie benötigen einen MiniMax Token Plan-Schlüssel oder ein OAuth-Token
    - Sie möchten Hinweise zum MiniMax-Such-Host für CN/global
summary: MiniMax-Suche über die Token Plan-Such-API
title: MiniMax-Suche
x-i18n:
    generated_at: "2026-05-02T06:48:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw unterstützt MiniMax als `web_search`-Provider über die MiniMax
Token Plan-Such-API. Sie gibt strukturierte Suchergebnisse mit Titeln, URLs,
Snippets und verwandten Abfragen zurück.

## Token Plan-Anmeldedaten abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Erstellen oder kopieren Sie einen MiniMax Token Plan-Schlüssel von der
    [MiniMax-Plattform](https://platform.minimax.io/user-center/basic-information/interface-key).
    OAuth-Einrichtungen können stattdessen `MINIMAX_OAUTH_TOKEN` wiederverwenden.
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `MINIMAX_CODE_PLAN_KEY` in der Gateway-Umgebung, oder konfigurieren Sie es über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akzeptiert außerdem `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` und
`MINIMAX_API_KEY` als Umgebungsaliasnamen. `MINIMAX_API_KEY` sollte auf
suchfähige Token Plan-Anmeldedaten verweisen; gewöhnliche MiniMax-Modell-API-Schlüssel werden vom
Token Plan-Suchendpunkt möglicherweise nicht akzeptiert.

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

**Umgebungsalternative:** Setzen Sie `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` in der Gateway-Umgebung.
Für eine Gateway-Installation legen Sie es in `~/.openclaw/.env` ab.

## Regionsauswahl

MiniMax Search verwendet diese Endpunkte:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Wenn `plugins.entries.minimax.config.webSearch.region` nicht gesetzt ist, löst OpenClaw
die Region in dieser Reihenfolge auf:

1. `tools.web.search.minimax.region` / Plugin-eigene `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Das bedeutet, dass CN-Onboarding oder `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search automatisch ebenfalls auf dem CN-Host hält.

Auch wenn Sie MiniMax über den OAuth-Pfad `minimax-portal` authentifiziert haben,
wird die Websuche weiterhin mit der Provider-ID `minimax` registriert; die Basis-URL des OAuth-Providers
wird als Regionshinweis für die CN/global-Hostauswahl verwendet, und `MINIMAX_OAUTH_TOKEN`
kann die Bearer-Anmeldedaten für MiniMax Search erfüllen.

## Unterstützte Parameter

MiniMax Search unterstützt:

- `query`
- `count` (OpenClaw kürzt die zurückgegebene Ergebnisliste auf die angeforderte Anzahl)

Provider-spezifische Filter werden derzeit nicht unterstützt.

## Siehe auch

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [MiniMax](/de/providers/minimax) -- Modell-, Bild-, Sprach- und Auth-Einrichtung
