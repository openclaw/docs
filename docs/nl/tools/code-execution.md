---
read_when:
    - U wilt code_execution inschakelen of configureren
    - Je wilt externe analyse zonder lokale shelltoegang
    - Je wilt x_search of web_search combineren met Python-analyse op afstand
summary: 'code_execution: voer gesandboxte externe Python-analyse uit met xAI'
title: Code-uitvoering
x-i18n:
    generated_at: "2026-06-27T18:24:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` voert sandboxed externe Python-analyse uit op xAI's Responses API. Het wordt geregistreerd door de gebundelde `xai`-Plugin (onder het `tools`-contract) en stuurt door naar hetzelfde `https://api.x.ai/v1/responses`-eindpunt dat door `x_search` wordt gebruikt.

| Eigenschap         | Waarde                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Toolnaam           | `code_execution`                                                                  |
| Provider-Plugin    | `xai` (gebundeld, `enabledByDefault: true`)                                       |
| Auth               | xAI-authprofiel, `XAI_API_KEY`, of `plugins.entries.xai.config.webSearch.apiKey`  |
| Standaardmodel     | `grok-4-1-fast`                                                                   |
| Standaardtimeout   | 30 seconden                                                                       |
| Standaard `maxTurns` | niet ingesteld (xAI past zijn eigen interne limiet toe)                         |

Dit is anders dan lokale [`exec`](/nl/tools/exec):

- `exec` voert shell-opdrachten uit op je machine of gekoppelde Node.
- `code_execution` voert Python uit in xAI's externe sandbox.

Gebruik `code_execution` voor:

- Berekeningen.
- Tabellering.
- Snelle statistiek.
- Analyse in grafiekstijl.
- Het analyseren van gegevens die door `x_search` of `web_search` zijn geretourneerd.

Gebruik het **niet** wanneer je lokale bestanden, je shell, je repo of gekoppelde apparaten nodig hebt. Gebruik daarvoor [`exec`](/nl/tools/exec).

## Installatie

<Steps>
  <Step title="Provide xAI credentials">
    Log in met Grok OAuth via een geschikt SuperGrok- of X Premium-abonnement,
    of sla een API-sleutel op. xAI OAuth gebruikt device-codeverificatie, dus het werkt
    vanaf externe hosts zonder localhost-callback. OAuth werkt voor
    `code_execution` en `x_search`; `XAI_API_KEY` of Plugin-webzoekconfiguratie
    kan ook Grok `web_search` aandrijven.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Tijdens een nieuwe installatie zijn dezelfde auth-keuzes beschikbaar in
    onboarding:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Of gebruik een API-sleutel:

    ```bash
    openclaw models auth login --provider xai --method api-key
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

  <Step title="Enable and tune code_execution">
    `code_execution` is beschikbaar wanneer xAI-inloggegevens beschikbaar zijn. Stel
    `plugins.entries.xai.config.codeExecution.enabled` in op `false` om het uit te schakelen,
    of gebruik hetzelfde blok om het model en de timeout af te stemmen.

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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` verschijnt in de toollijst van de agent zodra de xAI-Plugin zich opnieuw registreert met `enabled: true`.

  </Step>
</Steps>

## Hoe je het gebruikt

Vraag op een natuurlijke manier en maak de analysebedoeling expliciet:

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

Wanneer de tool zonder auth wordt uitgevoerd, retourneert deze een gestructureerde `missing_xai_api_key`-fout die wijst naar het authprofiel, de omgevingsvariabele en de configuratieopties. De fout is JSON, geen gegooide uitzondering, zodat de agent zichzelf kan corrigeren:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limieten

- Dit is externe xAI-uitvoering, geen lokale procesuitvoering.
- Behandel resultaten als tijdelijke analyse, niet als een persistente notebooksessie.
- Ga niet uit van toegang tot lokale bestanden of je werkruimte.
- Gebruik voor actuele X-gegevens eerst [`x_search`](/nl/tools/web#x_search) en voer het resultaat door naar `code_execution`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec tool" href="/nl/tools/exec" icon="terminal">
    Lokale shell-uitvoering op je machine of gekoppelde Node.
  </Card>
  <Card title="Exec approvals" href="/nl/tools/exec-approvals" icon="shield">
    Toestaan/weigeren-beleid voor shell-uitvoering.
  </Card>
  <Card title="Web tools" href="/nl/tools/web" icon="globe">
    `web_search`, `x_search` en `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/nl/providers/xai" icon="microchip">
    Grok-modellen, web-/x-zoekopdrachten en configuratie voor code-uitvoering.
  </Card>
</CardGroup>
