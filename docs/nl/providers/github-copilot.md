---
read_when:
    - Je wilt GitHub Copilot als modelprovider gebruiken
    - Je hebt de `openclaw models auth login-github-copilot`-flow nodig
    - Je kiest tussen de ingebouwde Copilot-provider, de Copilot SDK-harness en Copilot Proxy
summary: Meld je aan bij GitHub Copilot vanuit OpenClaw via de apparaatflow of niet-interactieve tokenimport
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:12:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot is de AI-codeerassistent van GitHub. Het biedt toegang tot Copilot-
modellen voor je GitHub-account en -abonnement. OpenClaw kan Copilot op drie verschillende
manieren gebruiken als modelprovider of agentruntime.

## Drie manieren om Copilot in OpenClaw te gebruiken

<Tabs>
  <Tab title="Ingebouwde provider (github-copilot)">
    Gebruik de native apparaatlogin-flow om een GitHub-token te verkrijgen en wissel dit
    vervolgens om voor Copilot API-tokens wanneer OpenClaw draait. Dit is het **standaard** en eenvoudigste pad
    omdat VS Code niet vereist is.

    <Steps>
      <Step title="Voer de loginopdracht uit">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Je wordt gevraagd een URL te bezoeken en een eenmalige code in te voeren. Houd de
        terminal open totdat dit is voltooid.
      </Step>
      <Step title="Stel een standaardmodel in">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Of in de configuratie:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot SDK-harness-Plugin (copilot)">
    Installeer de externe `@openclaw/copilot` Plugin wanneer je wilt dat GitHub's
    Copilot CLI en SDK de low-level agentlus beheren voor geselecteerde
    `github-copilot/*`-modellen.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Kies vervolgens een model of provider voor de runtime:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Kies dit wanneer je native Copilot CLI-sessies, door de SDK beheerde threadstatus
    en door Copilot beheerde Compaction voor die agentbeurten wilt. Zie
    [Copilot SDK-harness](/nl/plugins/copilot) voor het volledige runtimecontract.

  </Tab>

  <Tab title="Copilot Proxy-Plugin (copilot-proxy)">
    Gebruik de **Copilot Proxy** VS Code-extensie als lokale brug. OpenClaw communiceert met
    het `/v1`-eindpunt van de proxy en gebruikt de modellenlijst die je daar configureert.

    <Note>
    Kies dit wanneer je Copilot Proxy al in VS Code gebruikt of verkeer erdoorheen moet routeren.
    Je moet de Plugin inschakelen en de VS Code-extensie actief houden.
    </Note>

  </Tab>
</Tabs>

## Optionele vlaggen

| Vlag            | Beschrijving                                        |
| --------------- | --------------------------------------------------- |
| `--yes`         | Sla de bevestigingsprompt over                     |
| `--set-default` | Pas ook het aanbevolen standaardmodel van de provider toe |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Niet-interactieve onboarding

Als je al een GitHub OAuth-toegangstoken voor Copilot hebt, importeer dit dan tijdens
headless setup met `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Je kunt `--auth-choice` ook weglaten; het doorgeven van `--github-copilot-token` leidt de
authenticatiekeuze voor de GitHub Copilot-provider af. Als de vlag wordt weggelaten, valt onboarding
terug op `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` en daarna `GITHUB_TOKEN`. Gebruik
`--secret-input-mode ref` met `COPILOT_GITHUB_TOKEN` ingesteld om een door env ondersteunde
`tokenRef` op te slaan in plaats van platte tekst in `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Interactieve TTY vereist">
    De apparaatlogin-flow vereist een interactieve TTY. Voer deze rechtstreeks uit in een
    terminal, niet in een niet-interactief script of CI-pijplijn.
  </Accordion>

  <Accordion title="Modelbeschikbaarheid hangt af van je abonnement">
    De beschikbaarheid van Copilot-modellen hangt af van je GitHub-abonnement. Als een model wordt
    geweigerd, probeer dan een andere ID (bijvoorbeeld `github-copilot/gpt-5.5`). Zie
    GitHub's [ondersteunde modellen per Copilot-abonnement](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    voor de actuele modellenlijst.
  </Accordion>

  <Accordion title="Live catalogusvernieuwing vanuit de Copilot API">
    Zodra het authpad via apparaatlogin (of env-var) een GitHub-token heeft opgelost,
    vernieuwt OpenClaw de modelcatalogus op aanvraag vanuit `${baseUrl}/models`
    (hetzelfde eindpunt dat VS Code Copilot gebruikt), zodat de runtime
    per-accountrechten en nauwkeurige contextvensters volgt zonder manifestverloop.
    Nieuw gepubliceerde Copilot-modellen worden zichtbaar zonder OpenClaw-upgrade,
    en contextvensters weerspiegelen de echte limieten per model
    (bijv. 400k voor de gpt-5.x-serie, 1M voor de interne
    `claude-opus-*-1m`-varianten).

    De gebundelde statische catalogus blijft de zichtbare fallback wanneer detectie
    is uitgeschakeld, de gebruiker geen GitHub-authprofiel heeft, de tokenwisseling
    mislukt of de HTTPS-aanroep naar `/models` een fout geeft. Om je af te melden en volledig
    te vertrouwen op de statische manifestcatalogus (offline / air-gapped scenario's):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Transportselectie">
    Claude-model-ID's gebruiken automatisch het Anthropic Messages-transport. GPT-,
    o-series- en Gemini-modellen behouden het OpenAI Responses-transport. OpenClaw
    selecteert het juiste transport op basis van de modelref.
  </Accordion>

  <Accordion title="Requestcompatibiliteit">
    OpenClaw verzendt Copilot IDE-stijl requestheaders op Copilot-transporten,
    inclusief ingebouwde Compaction, toolresultaat- en afbeeldingsvervolgbeurten. Het
    schakelt geen provider-level Responses-continuation in voor Copilot, tenzij
    dat gedrag is geverifieerd tegen de API van Copilot.
  </Accordion>

  <Accordion title="Oplosvolgorde voor omgevingsvariabelen">
    OpenClaw lost Copilot-authenticatie op uit omgevingsvariabelen in de volgende
    prioriteitsvolgorde:

    | Prioriteit | Variabele             | Opmerkingen                      |
    | ---------- | --------------------- | -------------------------------- |
    | 1          | `COPILOT_GITHUB_TOKEN` | Hoogste prioriteit, Copilot-specifiek |
    | 2          | `GH_TOKEN`            | GitHub CLI-token (fallback)      |
    | 3          | `GITHUB_TOKEN`        | Standaard GitHub-token (laagste) |

    Wanneer meerdere variabelen zijn ingesteld, gebruikt OpenClaw degene met de hoogste prioriteit.
    De apparaatlogin-flow (`openclaw models auth login-github-copilot`) slaat
    het token op in de authprofielopslag en heeft voorrang op alle omgevingsvariabelen.

  </Accordion>

  <Accordion title="Tokenopslag">
    De login slaat een GitHub-token op in de authprofielopslag en wisselt dit
    om voor een Copilot API-token wanneer OpenClaw draait. Je hoeft het
    token niet handmatig te beheren.
  </Accordion>
</AccordionGroup>

<Warning>
De apparaatloginopdracht vereist een interactieve TTY. Gebruik niet-interactieve
onboarding wanneer je headless setup nodig hebt.
</Warning>

## Embeddings voor geheugenzoekopdrachten

GitHub Copilot kan ook dienen als embeddingprovider voor
[geheugenzoekopdrachten](/nl/concepts/memory-search). Als je een Copilot-abonnement hebt en
bent ingelogd, kan OpenClaw dit gebruiken voor embeddings zonder aparte API-sleutel.

### Configuratie

Stel `memorySearch.provider` expliciet in om GitHub Copilot-embeddings te gebruiken. Als een
GitHub-token beschikbaar is, detecteert OpenClaw beschikbare embeddingmodellen vanuit
de Copilot API en kiest automatisch het beste model.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Hoe het werkt

1. OpenClaw lost je GitHub-token op (uit env-vars of authprofiel).
2. Wisselt dit om voor een kortlevend Copilot API-token.
3. Vraagt het Copilot `/models`-eindpunt op om beschikbare embeddingmodellen te detecteren.
4. Kiest het beste model (geeft de voorkeur aan `text-embedding-3-small`).
5. Verzendt embeddingrequests naar het Copilot `/embeddings`-eindpunt.

Modelbeschikbaarheid hangt af van je GitHub-abonnement. Als er geen embeddingmodellen
beschikbaar zijn, slaat OpenClaw Copilot over en probeert het de volgende provider.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="OAuth en auth" href="/nl/gateway/authentication" icon="key">
    Authdetails en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
