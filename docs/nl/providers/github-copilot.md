---
read_when:
    - Je wilt GitHub Copilot als modelprovider gebruiken
    - Je hebt het `openclaw models auth login-github-copilot`-proces nodig
summary: Meld je aan bij GitHub Copilot vanuit OpenClaw met de apparaatflow of niet-interactieve tokenimport
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-29T23:10:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot is GitHubs AI-codeerassistent. Het biedt toegang tot Copilot-
modellen voor je GitHub-account en abonnement. OpenClaw kan Copilot op twee
verschillende manieren gebruiken als modelprovider.

## Twee manieren om Copilot te gebruiken in OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Gebruik de native apparaatloginflow om een GitHub-token te verkrijgen en wissel die vervolgens om voor
    Copilot API-tokens wanneer OpenClaw wordt uitgevoerd. Dit is het **standaard** en eenvoudigste pad,
    omdat het geen VS Code vereist.

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Je wordt gevraagd een URL te bezoeken en een eenmalige code in te voeren. Houd de
        terminal open totdat dit is voltooid.
      </Step>
      <Step title="Set a default model">
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

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Gebruik de **Copilot Proxy** VS Code-extensie als lokale brug. OpenClaw communiceert met
    het `/v1`-eindpunt van de proxy en gebruikt de modellijst die je daar configureert.

    <Note>
    Kies dit wanneer je Copilot Proxy al in VS Code uitvoert of erdoorheen moet routeren.
    Je moet de Plugin inschakelen en de VS Code-extensie actief houden.
    </Note>

  </Tab>
</Tabs>

## Optionele vlaggen

| Vlag            | Beschrijving                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Sla de bevestigingsprompt over                      |
| `--set-default` | Pas ook het aanbevolen standaardmodel van de provider toe |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Niet-interactieve onboarding

Als je al een GitHub OAuth-toegangstoken voor Copilot hebt, importeer dit dan tijdens
headless installatie met `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Je kunt `--auth-choice` ook weglaten; het doorgeven van `--github-copilot-token` leidt de
GitHub Copilot-providerauthekeuze af. Als de vlag wordt weggelaten, valt onboarding
terug op `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` en daarna `GITHUB_TOKEN`. Gebruik
`--secret-input-mode ref` met `COPILOT_GITHUB_TOKEN` ingesteld om een door env ondersteunde
`tokenRef` op te slaan in plaats van platte tekst in `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    De apparaatloginflow vereist een interactieve TTY. Voer deze rechtstreeks uit in een
    terminal, niet in een niet-interactief script of CI-pipeline.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    De beschikbaarheid van Copilot-modellen hangt af van je GitHub-abonnement. Als een model wordt
    geweigerd, probeer dan een andere ID (bijvoorbeeld `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transport selection">
    Claude-model-ID's gebruiken automatisch het Anthropic Messages-transport. GPT-,
    o-series- en Gemini-modellen behouden het OpenAI Responses-transport. OpenClaw
    selecteert het juiste transport op basis van de modelreferentie.
  </Accordion>

  <Accordion title="Request compatibility">
    OpenClaw verzendt Copilot IDE-stijl aanvraagheaders op Copilot-transporten,
    inclusief ingebouwde Compaction-, toolresultaat- en afbeeldingsopvolgbeurten. Het
    schakelt geen Responses-vervolg op providerniveau in voor Copilot, tenzij
    dat gedrag is geverifieerd tegen Copilots API.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw lost Copilot-auth op uit omgevingsvariabelen in de volgende
    prioriteitsvolgorde:

    | Prioriteit | Variabele             | Opmerkingen                      |
    | ---------- | --------------------- | -------------------------------- |
    | 1          | `COPILOT_GITHUB_TOKEN` | Hoogste prioriteit, Copilot-specifiek |
    | 2          | `GH_TOKEN`            | GitHub CLI-token (terugval)      |
    | 3          | `GITHUB_TOKEN`        | Standaard GitHub-token (laagste) |

    Wanneer meerdere variabelen zijn ingesteld, gebruikt OpenClaw degene met de hoogste prioriteit.
    De apparaatloginflow (`openclaw models auth login-github-copilot`) slaat
    het token op in de auth-profielopslag en krijgt voorrang op alle omgevingsvariabelen.

  </Accordion>

  <Accordion title="Token storage">
    De login slaat een GitHub-token op in de auth-profielopslag en wisselt het
    om voor een Copilot API-token wanneer OpenClaw wordt uitgevoerd. Je hoeft het
    token niet handmatig te beheren.
  </Accordion>
</AccordionGroup>

<Warning>
De apparaatloginopdracht vereist een interactieve TTY. Gebruik niet-interactieve
onboarding wanneer je headless installatie nodig hebt.
</Warning>

## Embeddings voor geheugenzoekopdrachten

GitHub Copilot kan ook dienen als embeddingprovider voor
[geheugenzoekopdrachten](/nl/concepts/memory-search). Als je een Copilot-abonnement hebt en
bent ingelogd, kan OpenClaw het gebruiken voor embeddings zonder aparte API-sleutel.

### Automatische detectie

Wanneer `memorySearch.provider` `"auto"` is (de standaard), wordt GitHub Copilot geprobeerd
met prioriteit 15 -- na lokale embeddings maar vóór OpenAI en andere betaalde
providers. Als een GitHub-token beschikbaar is, ontdekt OpenClaw beschikbare
embeddingmodellen via de Copilot API en kiest automatisch het beste model.

### Expliciete configuratie

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

1. OpenClaw lost je GitHub-token op (uit env-vars of auth-profiel).
2. Wisselt het om voor een kortlevend Copilot API-token.
3. Queryt het Copilot `/models`-eindpunt om beschikbare embeddingmodellen te ontdekken.
4. Kiest het beste model (geeft de voorkeur aan `text-embedding-3-small`).
5. Verzendt embeddingaanvragen naar het Copilot `/embeddings`-eindpunt.

De beschikbaarheid van modellen hangt af van je GitHub-abonnement. Als er geen embeddingmodellen
beschikbaar zijn, slaat OpenClaw Copilot over en probeert het de volgende provider.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="OAuth and auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van inloggegevens.
  </Card>
</CardGroup>
