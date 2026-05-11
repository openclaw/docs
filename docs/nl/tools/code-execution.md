---
read_when:
    - Je wilt code_execution inschakelen of configureren
    - Je wilt analyse op afstand zonder lokale shelltoegang
    - Je wilt x_search of web_search combineren met externe Python-analyse
summary: 'code_execution: voer Python-analyse op afstand in een sandbox uit met xAI'
title: Code-uitvoering
x-i18n:
    generated_at: "2026-05-11T20:52:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` voert sandboxed externe Python-analyse uit op xAI's Responses API. Het wordt geregistreerd door de gebundelde `xai` Plugin (onder het `tools`-contract) en stuurt door naar hetzelfde `https://api.x.ai/v1/responses`-endpoint dat door `x_search` wordt gebruikt.

| Eigenschap             | Waarde                                                                            |
| ---------------------- | --------------------------------------------------------------------------------- |
| Toolnaam               | `code_execution`                                                                  |
| Provider-Plugin        | `xai` (gebundeld, `enabledByDefault: true`)                                       |
| Authenticatie          | xAI-authprofiel, `XAI_API_KEY`, of `plugins.entries.xai.config.webSearch.apiKey`  |
| Standaardmodel         | `grok-4-1-fast`                                                                   |
| Standaardtime-out      | 30 seconden                                                                       |
| Standaard `maxTurns`   | niet ingesteld (xAI past zijn eigen interne limiet toe)                           |

Dit verschilt van lokale [`exec`](/nl/tools/exec):

- `exec` voert shellcommando's uit op je machine of gekoppelde node.
- `code_execution` voert Python uit in xAI's externe sandbox.

Gebruik `code_execution` voor:

- Berekeningen.
- Tabellering.
- Snelle statistieken.
- Diagramachtige analyse.
- Analyse van gegevens die door `x_search` of `web_search` zijn teruggegeven.

Gebruik het **niet** wanneer je lokale bestanden, je shell, je repo of gekoppelde apparaten nodig hebt. Gebruik daarvoor [`exec`](/nl/tools/exec).

## Instellen

<Steps>
  <Step title="Geef een xAI API-sleutel op">
    Voer `openclaw onboard --auth-choice xai-api-key` uit voor `code_execution` en
    `x_search`, of stel `XAI_API_KEY` in / configureer de sleutel onder de xAI Plugin
    wanneer je ook wilt dat Grok-webzoekopdrachten dezelfde referentie gebruiken:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    Of via configuratie:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Schakel code_execution in en stem het af">
    De tool wordt afgeschermd door `plugins.entries.xai.config.codeExecution.enabled`. Standaard staat dit uit.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Herstart de Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` verschijnt in de toollijst van de agent zodra de xAI Plugin opnieuw registreert met `enabled: true`.

  </Step>
</Steps>

## Hoe je het gebruikt

Vraag op natuurlijke wijze en maak de analysebedoeling expliciet:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

De tool neemt intern één `task`-parameter aan, dus de agent moet het volledige analyseverzoek en eventuele inline gegevens in één prompt verzenden.

## Fouten

Wanneer de tool zonder authenticatie wordt uitgevoerd, geeft deze een gestructureerde `missing_xai_api_key`-fout terug die verwijst naar de auth-profile-, env-var- en configuratieopties. De fout is JSON, geen gegooide exception, zodat de agent zichzelf kan corrigeren:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limieten

- Dit is externe xAI-uitvoering, geen lokale procesuitvoering.
- Behandel resultaten als kortstondige analyse, niet als een permanente notebooksessie.
- Ga niet uit van toegang tot lokale bestanden of je werkruimte.
- Gebruik voor recente X-gegevens eerst [`x_search`](/nl/tools/web#x_search) en leid het resultaat door naar `code_execution`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec-tool" href="/nl/tools/exec" icon="terminal">
    Lokale shelluitvoering op je machine of gekoppelde node.
  </Card>
  <Card title="Exec-goedkeuringen" href="/nl/tools/exec-approvals" icon="shield">
    Toestaan/weigeren-beleid voor shelluitvoering.
  </Card>
  <Card title="Webtools" href="/nl/tools/web" icon="globe">
    `web_search`, `x_search` en `web_fetch`.
  </Card>
  <Card title="xAI-provider" href="/nl/providers/xai" icon="microchip">
    Grok-modellen, web-/x-zoekopdrachten en configuratie voor code-uitvoering.
  </Card>
</CardGroup>
