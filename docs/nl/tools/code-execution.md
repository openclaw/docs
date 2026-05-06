---
read_when:
    - Je wilt code_execution inschakelen of configureren
    - Je wilt analyse op afstand zonder lokale shelltoegang
    - Je wilt x_search of web_search combineren met externe Python-analyse
summary: 'code_execution: voer gesandboxte externe Python-analyse uit met xAI'
title: Code-uitvoering
x-i18n:
    generated_at: "2026-05-06T09:34:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` voert sandboxed externe Python-analyse uit op de Responses API van xAI. Het wordt geregistreerd door de meegeleverde `xai`-Plugin (onder het `tools`-contract) en dispatcht naar hetzelfde `https://api.x.ai/v1/responses`-endpoint dat door `x_search` wordt gebruikt.

| Eigenschap         | Waarde                                                         |
| ------------------ | -------------------------------------------------------------- |
| Toolnaam           | `code_execution`                                               |
| Provider-Plugin    | `xai` (meegeleverd, `enabledByDefault: true`)                  |
| Authenticatie      | `XAI_API_KEY` of `plugins.entries.xai.config.webSearch.apiKey` |
| Standaardmodel     | `grok-4-1-fast`                                                |
| Standaardtimeout   | 30 seconden                                                    |
| Standaard `maxTurns` | niet ingesteld (xAI past zijn eigen interne limiet toe)      |

Dit is anders dan lokale [`exec`](/nl/tools/exec):

- `exec` voert shellcommando's uit op je machine of gekoppelde node.
- `code_execution` voert Python uit in de externe sandbox van xAI.

Gebruik `code_execution` voor:

- Berekeningen.
- Tabellering.
- Snelle statistieken.
- Analyse in grafiekstijl.
- Het analyseren van gegevens die door `x_search` of `web_search` zijn geretourneerd.

Gebruik het **niet** wanneer je lokale bestanden, je shell, je repo of gekoppelde apparaten nodig hebt. Gebruik daarvoor [`exec`](/nl/tools/exec).

## Instellen

<Steps>
  <Step title="Geef een xAI API-sleutel op">
    Stel `XAI_API_KEY` in de Gateway-omgeving in, of configureer de sleutel onder de xAI-Plugin zodat dezelfde credential `code_execution`, `x_search`, webzoeken en andere xAI-tools dekt:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    Of via config:

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
    De tool wordt begrensd door `plugins.entries.xai.config.codeExecution.enabled`. Standaard staat dit uit.

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

    `code_execution` verschijnt in de toollijst van de agent zodra de xAI-Plugin opnieuw registreert met `enabled: true`.

  </Step>
</Steps>

## Het gebruiken

Vraag op een natuurlijke manier en maak de analyse-intentie expliciet:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

De tool gebruikt intern één `task`-parameter, dus de agent moet het volledige analyseverzoek en eventuele inline gegevens in één prompt verzenden.

## Fouten

Wanneer de tool zonder authenticatie wordt uitgevoerd, retourneert deze een gestructureerde `missing_xai_api_key`-fout die naar de omgevingsvariabele en het configpad verwijst. De fout is JSON, geen gegooide exception, zodat de agent zichzelf kan corrigeren:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limieten

- Dit is externe xAI-uitvoering, geen lokale procesuitvoering.
- Behandel resultaten als vluchtige analyse, niet als een persistente notebooksessie.
- Ga niet uit van toegang tot lokale bestanden of je werkruimte.
- Gebruik voor recente X-gegevens eerst [`x_search`](/nl/tools/web#x_search) en geef het resultaat door aan `code_execution`.

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
    Grok-modellen, web-/x-zoeken en code-uitvoeringsconfiguratie.
  </Card>
</CardGroup>
