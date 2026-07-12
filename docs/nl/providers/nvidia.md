---
read_when:
    - Je wilt gratis open modellen gebruiken in OpenClaw
    - Je moet NVIDIA_API_KEY instellen
    - Je wilt Nemotron 3 Ultra via NVIDIA gebruiken
summary: Gebruik NVIDIA's met OpenAI compatibele API in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T09:20:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA biedt open modellen gratis aan via een OpenAI-compatibele API op
`https://integrate.api.nvidia.com/v1`, geverifieerd met een API-sleutel van
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
gebruikt standaard Nemotron 3 Ultra voor de NVIDIA-provider, NVIDIA's redeneermodel
met in totaal 550B parameters, waarvan 55B actief, voor agentgestuurd werk met
een lange context.

## Aan de slag

<Steps>
  <Step title="Haal uw API-sleutel op">
    Maak een API-sleutel aan op [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporteer de sleutel en voer de onboarding uit">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Stel een NVIDIA-model in">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Geef voor een niet-interactieve configuratie de sleutel rechtstreeks door:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
Met `--nvidia-api-key` komt de sleutel terecht in de shellgeschiedenis en de uitvoer van `ps`. Gebruik waar mogelijk bij voorkeur de omgevingsvariabele
`NVIDIA_API_KEY`.
</Warning>

## Configuratievoorbeeld

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Uitgelichte catalogus

Wanneer een NVIDIA API-sleutel is geconfigureerd, halen de configuratie- en modelselectiepaden
NVIDIA's openbare catalogus met uitgelichte modellen op van
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` en
bewaren ze het resultaat 24 uur in de cache (de eerste 32 vermeldingen,
geïmporteerd als rijen met vrije tekstinvoer). Nieuwe uitgelichte modellen van
build.nvidia.com verschijnen daardoor in de configuratie- en modelselectieonderdelen
zonder dat u op een OpenClaw-release hoeft te wachten. Wanneer de livefeed
beschikbaar is, wordt het eerst geretourneerde model tijdens de NVIDIA-configuratie
vooraf geselecteerd.

Bij het ophalen geldt een vast HTTPS-hostbeleid voor `assets.ngc.nvidia.com`. Als
geen NVIDIA API-sleutel is geconfigureerd, of als de feed niet beschikbaar of
ongeldig is, valt OpenClaw terug op de hieronder vermelde ingebouwde catalogus en
ingebouwde standaardwaarde.

## Nemotron 3 Ultra

Nemotron 3 Ultra is het standaard NVIDIA-model in OpenClaw. NVIDIA's buildpagina voor
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
vermeldt het als een gratis beschikbaar eindpunt met een contextspecificatie van
1 miljoen tokens.

De ingebouwde Ultra-rij verzendt standaard
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`,
zodat normale chatuitvoer in het zichtbare antwoord blijft in plaats van
redeneertekst bloot te leggen.

Gebruik Ultra als de krachtigste standaardoptie van NVIDIA. Houd Super geselecteerd
als u de kleinere Nemotron 3-optie wilt, of kies een van de modellen van derden
die in NVIDIA's catalogus worden gehost als hun context, latentie of gedrag beter
aansluit.

## Ingebouwde terugvalcatalogus

De selecteerbare ingebouwde rijen zijn een momentopname van NVIDIA's catalogus met
uitgelichte modellen. Verouderde compatibiliteitsrijen blijven via een exacte
verwijzing beschikbaar, maar worden niet in modelkiezers weergegeven.

| Modelverwijzing                             | Naam                  | Context   | Maximale uitvoer |
| ------------------------------------------ | --------------------- | --------- | ---------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192            |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192            |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192            |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192            |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192            |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384           |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384           |

De volledige compatibiliteitscatalogus behoudt voor bestaande configuraties ook
deze eerder uitgebrachte verwijzingen: `nvidia/moonshotai/kimi-k2.5`,
`nvidia/z-ai/glm-5.1`, `nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` en
`nvidia/minimaxai/minimax-m2.7`. Ze blijven via een exacte verwijzing beschikbaar,
maar verschijnen nooit in de onboarding of modelkiezers.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Automatisch inschakelen">
    De provider wordt automatisch ingeschakeld wanneer de omgevingsvariabele
    `NVIDIA_API_KEY` is ingesteld of tijdens de onboarding een sleutel is
    opgeslagen. Naast de sleutel is geen expliciete providerconfiguratie vereist.
  </Accordion>

  <Accordion title="Catalogus en prijzen">
    OpenClaw geeft de voorkeur aan NVIDIA's openbare catalogus met uitgelichte
    modellen wanneer NVIDIA-verificatie is geconfigureerd en bewaart deze 24 uur
    in de cache. De ingebouwde selecteerbare terugvaloptie is een statische
    momentopname van NVIDIA's catalogus met uitgelichte modellen; verouderde
    compatibiliteitsrijen die alleen via een exacte verwijzing beschikbaar zijn,
    worden verborgen in modelkiezers. Kosten zijn in de broncode standaard `0`,
    omdat NVIDIA momenteel gratis API-toegang biedt voor de vermelde modellen.
  </Accordion>

  <Accordion title="OpenAI-compatibel eindpunt">
    OpenClaw communiceert met NVIDIA via de adapter `openai-completions` en de
    standaardroute voor chatvoltooiingen onder `/v1`. Alle OpenAI-compatibele
    hulpmiddelen zouden direct met de NVIDIA-basis-URL moeten werken.
  </Accordion>

  <Accordion title="Redeneerparameters van Nemotron 3 Ultra">
    NVIDIA's Ultra-voorbeeldverzoek gebruikt `chat_template_kwargs.enable_thinking`
    en `reasoning_budget` voor redeneeruitvoer. De ingebouwde Ultra-rij van
    OpenClaw schakelt sjabloonredenering standaard uit voor normaal chatgebruik.
    Als u NVIDIA-redeneeruitvoer wilt inschakelen of andere NVIDIA-specifieke
    verzoekvelden wilt afdwingen, stelt u parameters per model in en beperkt u
    providerspecifieke overschrijvingen tot het NVIDIA-model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.chat_template_kwargs` wordt samengevoegd met eventuele
    `chat_template_kwargs` die al in het verzoek aanwezig zijn, in plaats van het
    volledige object te vervangen. `params.extra_body` is de definitieve
    OpenAI-compatibele overschrijving van de aanvraagbody en overschrijft
    conflicterende payloadsleutels. Gebruik dit daarom alleen voor velden die
    NVIDIA voor het geselecteerde eindpunt documenteert.

  </Accordion>

  <Accordion title="Trage antwoorden van aangepaste providers">
    Sommige door NVIDIA gehoste aangepaste modellen kunnen langer nodig hebben
    dan de standaardbewaking van circa 120 seconden voor modelinactiviteit,
    voordat ze een eerste antwoordfragment verzenden. Verhoog voor aangepaste
    NVIDIA-providervermeldingen de providertime-out in plaats van de time-out
    van de volledige agentruntime; `timeoutSeconds` geldt voor HTTP-verzoeken
    van de provider en verhoogt de limiet van de inactiviteits- en
    streambewaking voor die provider:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA-modellen zijn momenteel gratis te gebruiken. Raadpleeg
[build.nvidia.com](https://build.nvidia.com/) voor de meest recente informatie
over beschikbaarheid en snelheidslimieten.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en terugvalgedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
