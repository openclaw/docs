---
read_when:
    - Je wilt code_execution inschakelen of configureren
    - Je wilt analyse op afstand zonder toegang tot de lokale shell
    - U wilt x_search of web_search combineren met externe Python-analyse
summary: 'code_execution: voer Python-analyse op afstand uit in een sandbox met xAI'
title: Code-uitvoering
x-i18n:
    generated_at: "2026-07-12T09:28:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` voert Python-analyses op afstand uit in een sandbox via xAI's Responses API
(`https://api.x.ai/v1/responses`, hetzelfde eindpunt dat `x_search` gebruikt). Het wordt
door de meegeleverde `xai`-plugin geregistreerd onder het `tools`-contract.

<Warning>
  `code_execution` wordt uitgevoerd op de servers van xAI. xAI brengt $5 per 1.000 toolaanroepen
  in rekening, plus de invoer- en uitvoertokens van het model.
</Warning>

| Eigenschap         | Waarde                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Toolnaam           | `code_execution`                                                                  |
| Providerplugin     | `xai` (meegeleverd, `enabledByDefault: true`)                                     |
| Authenticatie      | xAI-authenticatieprofiel, `XAI_API_KEY` of `plugins.entries.xai.config.webSearch.apiKey` |
| Standaardmodel     | `grok-4.3`                                                                        |
| Standaardtime-out  | 30 seconden                                                                       |
| Standaard-`maxTurns` | niet ingesteld (xAI past zijn eigen interne limiet toe)                         |

Gebruik het voor berekeningen, tabellen, snelle statistieken en analyses in
grafiekvorm, ook voor gegevens die door `x_search` of `web_search` zijn
geretourneerd. Het heeft geen toegang tot lokale bestanden, je shell, je
repository of gekoppelde apparaten en bewaart geen status tussen aanroepen.
Beschouw elke aanroep daarom als een tijdelijke analyse, niet als een
notebooksessie. Voer voor actuele gegevens van X eerst
[`x_search`](/nl/tools/web#x_search) uit en geef het resultaat door.

Gebruik in plaats daarvan [`exec`](/nl/tools/exec) voor lokale uitvoering.

## Installatie

<Steps>
  <Step title="Provide xAI credentials">
    OAuth vereist een geschikt SuperGrok- of X Premium-abonnement
    (verificatie met een apparaatcode, zodat het vanaf externe hosts werkt
    zonder callback naar localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Tijdens een nieuwe installatie is dezelfde keuze beschikbaar in de
    onboarding:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Of met een API-sleutel:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Of via de configuratie:

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

    Elk van deze drie opties voorziet ook `x_search` en Grok `web_search` van
    authenticatie.

  </Step>

  <Step title="Enable and tune code_execution">
    Als `enabled` is weggelaten, wordt `code_execution` alleen beschikbaar
    gemaakt wanneer de provider van het actieve model `xai` is en de
    xAI-inloggegevens kunnen worden gevonden. Stel bij een actief model met
    een bekende niet-xAI-provider
    `plugins.entries.xai.config.codeExecution.enabled` in op `true` om gebruik
    met meerdere providers in te schakelen. Als de provider van het actieve
    model ontbreekt of niet kan worden bepaald, blijft de tool verborgen. Stel
    `enabled` in op `false` om de tool voor elke provider uit te schakelen.
    xAI-inloggegevens zijn altijd vereist.

    Gebruik hetzelfde blok om het model, de aanroeplimiet of de time-out te
    overschrijven:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // required for a known non-xAI model provider
                model: "grok-4.3", // override the default xAI code-execution model
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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` verschijnt in de toollijst van de agent zodra de
    xAI-plugin zich opnieuw registreert en de bovenstaande controles voor
    provider, inschakeling en authenticatie slagen.

  </Step>
</Steps>

## Gebruik

Maak het doel van de analyse expliciet. De tool heeft één `task`-parameter,
dus stuur het volledige verzoek en eventuele inlinegegevens in één prompt:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

## Fouten

Zonder authenticatie retourneert de tool een gestructureerde JSON-fout
(en genereert deze geen exception), zodat de agent zichzelf kan corrigeren:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec tool" href="/nl/tools/exec" icon="terminal">
    Lokale shell-uitvoering op je computer of gekoppelde Node.
  </Card>
  <Card title="Exec approvals" href="/nl/tools/exec-approvals" icon="shield">
    Beleid voor het toestaan of weigeren van shell-uitvoering.
  </Card>
  <Card title="Web tools" href="/nl/tools/web" icon="globe">
    `web_search`, `x_search` en `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/nl/providers/xai" icon="microchip">
    Grok-modellen, zoeken op het web en X, en configuratie voor code-uitvoering.
  </Card>
</CardGroup>
