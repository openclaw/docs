---
read_when:
    - Je wilt GitHub Copilot als modelprovider gebruiken
    - Je hebt de `openclaw models auth login-github-copilot`-flow nodig
    - U kiest tussen de ingebouwde Copilot-provider, de Copilot SDK-harnas en de Copilot Proxy
summary: Meld u vanuit OpenClaw aan bij GitHub Copilot via de apparaatstroom of niet-interactieve tokenimport
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T09:13:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot is de AI-codeerassistent van GitHub. Deze biedt toegang tot Copilot-
modellen voor je GitHub-account en -abonnement. OpenClaw kan Copilot op drie
verschillende manieren gebruiken als modelprovider of agentruntime.

## Drie manieren om Copilot in OpenClaw te gebruiken

<Tabs>
  <Tab title="Ingebouwde provider (github-copilot)">
    Gebruik de ingebouwde apparaat-aanmeldingsflow om een GitHub-token te verkrijgen
    en wissel dit vervolgens tijdens het uitvoeren van OpenClaw in voor Copilot
    API-tokens. Dit is het **standaardpad** en het eenvoudigste pad, omdat VS Code
    niet vereist is.

    <Steps>
      <Step title="Voer de aanmeldingsopdracht uit">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Je wordt gevraagd een URL te bezoeken en een eenmalige code in te voeren.
        Houd de terminal open totdat het proces is voltooid.
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

  <Tab title="Copilot SDK-harnasplugin (copilot)">
    Installeer de externe Plugin `@openclaw/copilot` wanneer je wilt dat de
    Copilot CLI en SDK van GitHub de agentlus op laag niveau beheren voor
    geselecteerde `github-copilot/*`-modellen.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Schakel vervolgens een model of provider in voor de runtime:

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

    Kies dit wanneer je voor die agentbeurten ingebouwde Copilot CLI-sessies,
    door de SDK beheerde threadstatus en door Copilot beheerde Compaction wilt.
    Zonder de expliciete `agentRuntime`-inschakeling blijven
    `github-copilot/*`-modellen de ingebouwde provider gebruiken. Zie
    [Copilot SDK-harnas](/nl/plugins/copilot) voor het volledige runtimecontract.

  </Tab>

  <Tab title="Copilot Proxy-plugin (copilot-proxy)">
    Gebruik de VS Code-extensie **Copilot Proxy** als lokale brug. OpenClaw
    communiceert met het `/v1`-eindpunt van de proxy (standaard
    `http://localhost:3000/v1`) en gebruikt de modellenlijst die je configureert.

    De Plugin `copilot-proxy` wordt met OpenClaw meegeleverd en is standaard
    ingeschakeld. Configureer de basis-URL en model-ID's met:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Kies dit wanneer je Copilot Proxy al in VS Code uitvoert of verkeer erdoorheen
    moet routeren. De VS Code-extensie moet actief blijven.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (gegevenslocatie)

Als je organisatie een GitHub Enterprise-tenant met gegevenslocatie gebruikt
(een `*.ghe.com`-host, zoals `your-org.ghe.com`), bevindt Copilot zich op lokale
eindpunten van de tenant in plaats van op het openbare `github.com`. OpenClaw
biedt dit aan als volwaardige verificatiekeuze, zodat je URL's niet handmatig
hoeft te bewerken.

<Steps>
  <Step title="Kies de Enterprise-verificatieoptie">
    Kies tijdens de onboarding of in `openclaw models auth`
    **GitHub Copilot (Enterprise / data residency)**. Je wordt gevraagd om je
    Enterprise-domein (bijvoorbeeld `your-org.ghe.com`), waarna de
    apparaat-aanmelding voor die tenant wordt uitgevoerd.

    Voer alleen de tenantroot in (`your-org.ghe.com`). Afgeleide servicehosts,
    zoals `api.your-org.ghe.com` of `copilot-api.your-org.ghe.com`, worden niet
    geaccepteerd; OpenClaw leidt die eindpunten automatisch af van de tenantroot.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="Het domein wordt in de configuratie opgeslagen">
    De gekozen host wordt onder de providerparameters opgeslagen, zodat latere
    tokenvernieuwingen en voltooiingen automatisch op de tenant worden gericht:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

De apparaatflow, tokenuitwisseling en voltooiingen worden respectievelijk
omgezet naar `https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` en
`https://copilot-api.your-org.ghe.com`. Tokens voor gegevenslocatie bevatten
een tenantstempel en geen proxyaanwijzing. Daardoor valt de basis-URL voor
voltooiingen terug op de Copilot-host van de tenant in plaats van op het
openbare eindpunt.

<Note>
Bij het wisselen van domein wordt de apparaat-aanmelding altijd opnieuw
uitgevoerd. Als je al een Copilot-token hebt opgeslagen en een ander domein
kiest (openbaar `github.com` ↔ een `*.ghe.com`-tenant, of van de ene tenant naar
de andere), gebruikt OpenClaw het bestaande token niet opnieuw. Er wordt een
nieuwe aanmelding afgedwongen, zodat het token is beperkt tot het domein dat in
de configuratie wordt opgeslagen. Wanneer je je opnieuw aanmeldt voor
*hetzelfde* domein, wordt nog steeds aangeboden om het huidige token opnieuw te
gebruiken. Bij terugschakelen naar het openbare `github.com` wordt de opgeslagen
`githubDomain` gewist, zodat de configuratie terugkeert naar de standaardwaarde.
</Note>

<Note>
De omgevingsvariabele `COPILOT_GITHUB_DOMAIN` overschrijft het bepaalde domein
voor elk Copilot-pad dat het domein bepaalt: de Enterprise-apparaataanmelding
(`--method device-enterprise`), de zelfstandige snelkoppeling
`openclaw models auth login-github-copilot`, tokenvernieuwing, embeddings en
voltooiingen. Stel deze in op je `*.ghe.com`-host voor volledig headless
opstellingen of CI-opstellingen. Laat de variabele oningesteld (en laat de
configuratieparameter weg) om het openbare `github.com` te gebruiken.
Aanmeldingen slaan het domein op waarvoor het token is uitgegeven (en wissen
het wanneer je je bij het openbare `github.com` aanmeldt), zodat de routering
correct blijft nadat de omgevingsvariabele is verwijderd.
</Note>

## Optionele vlaggen

| Opdracht                                                               | Vlag            | Beschrijving                                                     |
| ---------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Overschrijf een bestaand verificatieprofiel zonder bevestiging   |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Pas ook het aanbevolen standaardmodel van de provider toe        |

```bash
# De bevestiging voor opnieuw aanmelden overslaan
openclaw models auth login-github-copilot --yes

# Aanmelden en het standaardmodel in één stap instellen
openclaw models auth login --provider github-copilot --method device --set-default
```

## Niet-interactieve onboarding

Voor de apparaat-aanmeldingsflow is een interactieve TTY vereist. Importeer voor
een headless opstelling een bestaand GitHub OAuth-toegangstoken met
`openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Je kunt `--auth-choice` ook weglaten; door `--github-copilot-token` door te geven,
wordt de providerverificatiekeuze voor GitHub Copilot afgeleid. Als de vlag
wordt weggelaten, valt de onboarding terug op `COPILOT_GITHUB_TOKEN`, daarna
`GH_TOKEN` en vervolgens `GITHUB_TOKEN`. Gebruik `--secret-input-mode ref` met
een ingestelde `COPILOT_GITHUB_TOKEN` om een door een omgevingsvariabele
ondersteunde `tokenRef` op te slaan in plaats van leesbare tekst in
`auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Interactieve TTY vereist">
    Voor de apparaat-aanmeldingsflow is een interactieve TTY vereist. Voer deze
    rechtstreeks in een terminal uit, niet in een niet-interactief script of
    een CI-pijplijn.
  </Accordion>

  <Accordion title="Modelbeschikbaarheid is afhankelijk van je abonnement">
    De beschikbaarheid van Copilot-modellen is afhankelijk van je GitHub-
    abonnement. Als een model wordt geweigerd, probeer dan een andere ID
    (bijvoorbeeld `github-copilot/gpt-5.5`). Zie de
    [ondersteunde modellen per Copilot-abonnement](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    van GitHub voor de huidige modellenlijst.
  </Accordion>

  <Accordion title="Live catalogusvernieuwing vanuit de Copilot API">
    Zodra het verificatiepad via apparaat-aanmelding (of omgevingsvariabele)
    een GitHub-token heeft bepaald, vernieuwt OpenClaw de modelcatalogus op
    aanvraag via `${baseUrl}/models` (hetzelfde eindpunt dat VS Code Copilot
    gebruikt). Zo volgt de runtime de rechten per account en nauwkeurige
    contextvensters zonder wijzigingen in het manifest. Nieuw gepubliceerde
    Copilot-modellen worden zichtbaar zonder een OpenClaw-upgrade en
    contextvensters weerspiegelen de werkelijke limieten per model
    (bijvoorbeeld 400k voor de gpt-5.x-serie en 1M voor de interne
    `claude-opus-*-1m`-varianten).

    De meegeleverde statische catalogus blijft zichtbaar als terugvaloptie
    wanneer detectie is uitgeschakeld, de gebruiker geen GitHub-
    verificatieprofiel heeft, de tokenuitwisseling mislukt of de HTTPS-aanroep
    naar `/models` een fout oplevert. Als je dit wilt uitschakelen en volledig
    wilt vertrouwen op de statische manifestcatalogus (offline of fysiek van
    netwerken gescheiden scenario's):

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
    Claude-model-ID's gebruiken automatisch het Anthropic Messages-transport.
    Gemini-modellen gebruiken het OpenAI Chat Completions-transport; GPT- en
    o-serie-modellen blijven het OpenAI Responses-transport gebruiken. OpenClaw
    selecteert het juiste transport op basis van de modelverwijzing.
  </Accordion>

  <Accordion title="Aanvraagcompatibiliteit">
    OpenClaw verzendt aanvraagheaders in Copilot IDE-stijl via Copilot-
    transporten (versies van de VS Code-editor en -Plugin en de integratie-ID
    `vscode-chat`), markeert vervolgbeurten met toolresultaten als door de agent
    geïnitieerd en stelt de Copilot-visionheader in wanneer een beurt
    afbeeldingsinvoer bevat.
  </Accordion>

  <Accordion title="Volgorde voor het bepalen van omgevingsvariabelen">
    OpenClaw bepaalt Copilot-verificatie via omgevingsvariabelen in de volgende
    prioriteitsvolgorde:

    | Prioriteit | Variabele               | Opmerkingen                              |
    | ---------- | ------------------------ | ---------------------------------------- |
    | 1          | `COPILOT_GITHUB_TOKEN`   | Hoogste prioriteit, specifiek voor Copilot |
    | 2          | `GH_TOKEN`               | GitHub CLI-token (terugvaloptie)         |
    | 3          | `GITHUB_TOKEN`           | Standaard GitHub-token (laagste)         |

    Wanneer meerdere variabelen zijn ingesteld, gebruikt OpenClaw de variabele
    met de hoogste prioriteit. De apparaat-aanmeldingsflow
    (`openclaw models auth login-github-copilot`) slaat het token op in de
    verificatieprofielopslag en heeft voorrang op alle omgevingsvariabelen.

  </Accordion>

  <Accordion title="Tokenopslag">
    De aanmelding slaat een GitHub-token op in de verificatieprofielopslag
    (profiel-ID `github-copilot:github`) en wisselt dit tijdens het uitvoeren
    van OpenClaw in voor een kortstondig Copilot API-token. Je hoeft het token
    niet handmatig te beheren.
  </Accordion>
</AccordionGroup>

## Embeddings voor geheugenzoekopdrachten

GitHub Copilot kan ook fungeren als embeddingprovider voor
[geheugenzoekopdrachten](/nl/concepts/memory-search). Als je een Copilot-abonnement
hebt en bent aangemeld, kan OpenClaw dit gebruiken voor embeddings zonder een
afzonderlijke API-sleutel.

### Configuratie

Stel `memorySearch.provider` expliciet in om GitHub Copilot-embeddings te
gebruiken. Als een GitHub-token beschikbaar is, detecteert OpenClaw beschikbare
embeddingmodellen via de Copilot API en kiest het automatisch het beste model.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optioneel: het automatisch gedetecteerde model overschrijven
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Werking

1. OpenClaw bepaalt je GitHub-token (via omgevingsvariabelen of een verificatieprofiel).
2. Het token wordt ingewisseld voor een kortstondig Copilot API-token.
3. Het Copilot-eindpunt `/models` wordt opgevraagd om beschikbare embeddingmodellen te detecteren.
4. Het beste model wordt gekozen (voorkeursvolgorde: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Embeddingaanvragen worden naar het Copilot-eindpunt `/embeddings` verzonden.

De beschikbaarheid van modellen is afhankelijk van je GitHub-abonnement. Als
er geen embeddingmodellen beschikbaar zijn, slaat OpenClaw Copilot over en
probeert het de volgende provider.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="OAuth en authenticatie" href="/nl/gateway/authentication" icon="key">
    Authenticatiedetails en regels voor hergebruik van aanmeldgegevens.
  </Card>
</CardGroup>
