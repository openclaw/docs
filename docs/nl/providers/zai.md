---
read_when:
    - Je wilt Z.AI-/GLM-modellen in OpenClaw
    - Je hebt een eenvoudige configuratie van `ZAI_API_KEY` nodig
summary: Gebruik Z.AI (GLM-modellen) met OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T16:29:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI is het API-platform voor **GLM**-modellen. Het biedt REST-API's voor GLM en
gebruikt API-sleutels voor authenticatie. Maak je API-sleutel aan in de Z.AI-console.
OpenClaw gebruikt de provider `zai` met een Z.AI-API-sleutel.

| Eigenschap | Waarde                                        |
| -------- | -------------------------------------------- |
| Provider | `zai`                                        |
| Pakket  | `@openclaw/zai-provider`                     |
| Authenticatie     | `ZAI_API_KEY` (verouderde alias: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (Bearer-authenticatie)          |

## GLM-modellen

GLM is een modelfamilie, geen afzonderlijke provider. In OpenClaw gebruiken GLM-modellen
referenties zoals `zai/glm-5.2`: provider `zai`, model-id `glm-5.2`.

## Aan de slag

Installeer eerst de provider-Plugin:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Endpoint automatisch detecteren">
    **Het meest geschikt voor:** de meeste gebruikers. OpenClaw test ondersteunde Z.AI-endpoints met je API-sleutel en past automatisch de juiste basis-URL toe.

    <Steps>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Controleren of het model wordt vermeld">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Expliciet regionaal endpoint">
    **Het meest geschikt voor:** gebruikers die een specifiek Coding Plan- of algemeen API-oppervlak willen afdwingen.

    <Steps>
      <Step title="De juiste onboardingoptie kiezen">
        ```bash
        # Coding Plan Global (aanbevolen voor gebruikers van Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (regio China)
        openclaw onboard --auth-choice zai-coding-cn

        # Algemene API
        openclaw onboard --auth-choice zai-global

        # Algemene API CN (regio China)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Controleren of het model wordt vermeld">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Endpoints

| Onboardingoptie   | Basis-URL                                      | Standaardmodel |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` detecteert automatisch een van deze vier door je sleutel te testen met de
Chat Completions-API van elk endpoint, waarbij eerst de algemene endpoints (`zai-global`,
daarna `zai-cn`) en vervolgens de Coding Plan-endpoints (`zai-coding-global`, daarna
`zai-coding-cn`) worden gecontroleerd, en stopt bij het eerste endpoint dat een verzoek accepteert.
Gebruik een expliciete `--auth-choice` om een Coding Plan-endpoint af te dwingen als je sleutel
op beide werkt.

## Snelheidslimieten en overbelasting

Z.AI beschrijft Coding Plan en de algemene agenttools als diensten
waarvan de capaciteit wordt beheerd. Volgens de eigen documentatie van Z.AI:

- [Algemene agenttools](https://docs.z.ai/devpack/tool/others),
  waaronder OpenClaw, worden op basis van best effort aangeboden. Tijdens een hoge inferentiebelasting,
  doorgaans rond 14.00-18.00 uur Singaporese tijd, kunnen voor sommige verzoeken tijdelijke
  snelheidslimieten gelden.
- [Snelheids- en gelijktijdigheidslimieten van Coding Plan](https://docs.z.ai/devpack/usage-policy)
  zijn gekoppeld aan het abonnementsniveau en kunnen dynamisch worden aangepast op basis van de
  beschikbaarheid van resources. Buiten piekuren kan een hogere gelijktijdigheid gelden.
- [API-foutcode `1302`](https://docs.z.ai/api-reference/api-code) betekent "Snelheidslimiet
  voor verzoeken bereikt". API-foutcode `1305` betekent "De dienst is mogelijk
  tijdelijk overbelast. Probeer het later opnieuw".

Als je tijdens een drukke periode een tijdelijk antwoord met `429` of `1305` ziet, wacht dan en
probeer het verzoek opnieuw. Als fouten buiten piekperioden reproduceerbaar zijn of alleen
optreden voor één endpoint, model of verzoekstructuur, controleer dan eerst het geconfigureerde endpoint
en model:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Coding Plan-sleutels moeten een Coding Plan-endpoint gebruiken, zoals
`https://api.z.ai/api/coding/paas/v4`; algemene API-sleutels moeten een algemeen API-endpoint
gebruiken, zoals `https://api.z.ai/api/paas/v4`. Aanhoudende fouten met
dezelfde sleutel en hetzelfde endpoint kunnen wijzen op een weigering aan providerzijde of een abonnementsbeperking,
niet op normale beperking door piekbelasting.

## Configuratievoorbeeld

<Tip>
Met `zai-api-key` kan OpenClaw aan de hand van de sleutel het overeenkomende Z.AI-endpoint detecteren en
automatisch de juiste basis-URL toepassen. Gebruik de expliciete regionale opties wanneer
je een specifiek Coding Plan- of algemeen API-oppervlak wilt afdwingen.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 gebruikt het Coding Plan-endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Ingebouwde catalogus

De provider-Plugin `zai` levert zijn catalogus mee in het Plugin-manifest, zodat een alleen-lezen
lijst bekende GLM-rijen kan weergeven zonder de providerruntime te laden:

```bash
openclaw models list --all --provider zai
```

De catalogus op basis van het manifest bevat momenteel:

| Modelreferentie            | Opmerkingen                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Standaard voor Coding Plan; context van 1M |
| `zai/glm-5.1`        | Standaard voor algemene API             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
GLM-modellen zijn beschikbaar als `zai/<model>` (voorbeeld: `zai/glm-5`).
</Tip>

<Note>
De configuratie van Coding Plan gebruikt standaard `zai/glm-5.2`; de configuratie van de algemene API behoudt
`zai/glm-5.1`. Op de Coding Plan-endpoints valt automatische detectie terug op
`glm-5.1` en vervolgens `glm-4.7` wanneer de sleutel of het abonnement geen GLM-5.2 beschikbaar stelt. GLM-
versies en beschikbaarheid kunnen veranderen; voer `openclaw models list --all --provider zai` uit
om de catalogus te bekijken die bij je geïnstalleerde versie bekend is.
</Note>

## Denkniveaus

<Tabs>
  <Tab title="GLM-5.2">
    Volledig bereik: `off`, `low`, `high`, `max` (standaard `off`). OpenClaw wijst
    `low` en `high` toe aan Z.AI's redeneerinspanning `high`, en `max` aan Z.AI's
    inspanning `max`, via `reasoning_effort` in de verzoekpayload.
  </Tab>
  <Tab title="Andere GLM-modellen">
    Alleen een binaire schakelaar: `off` en `low` (weergegeven als `on` in keuzelijsten), standaard
    `off`. Als denken wordt ingesteld op `off`, wordt `thinking: { type: "disabled" }` verzonden;
    bij elk ander niveau blijft de verzoekpayload ongewijzigd (Z.AI's eigen standaardgedrag
    voor redeneren is van toepassing).
  </Tab>
</Tabs>

Door denken in te stellen op `off` voorkom je antwoorden die het uitvoerbudget besteden aan
`reasoning_content` vóór de zichtbare tekst.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Onbekende GLM-5-modellen voorwaarts omzetten">
    Onbekende `glm-5*`-id's worden nog steeds voorwaarts omgezet in het providerpad door
    metadata van de provider te genereren op basis van de sjabloon `glm-4.7` wanneer de id
    overeenkomt met de huidige vorm van de GLM-5-familie.
  </Accordion>

  <Accordion title="Streaming van toolaanroepen">
    `tool_stream` is standaard ingeschakeld voor streaming van Z.AI-toolaanroepen. Zo schakel je dit uit:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bewaard denkproces">
    Het bewaren van het denkproces is optioneel, omdat Z.AI vereist dat de volledige historische
    `reasoning_content` opnieuw wordt afgespeeld, waardoor het aantal prompttokens toeneemt. Schakel dit
    per model in:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Als dit is ingeschakeld en denken aanstaat, verzendt OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` en speelt het eerdere
    `reasoning_content` opnieuw af voor hetzelfde OpenAI-compatibele transcript. De parameternaam
    `preserve_thinking` in snake_case werkt als alias.

    Geavanceerde gebruikers kunnen de exacte providerpayload nog steeds overschrijven met
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Beeldbegrip">
    De Z.AI-Plugin registreert beeldbegrip.

    | Eigenschap      | Waarde       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Beeldbegrip wordt automatisch bepaald aan de hand van de geconfigureerde Z.AI-authenticatie; er is
    geen aanvullende configuratie nodig.

  </Accordion>

  <Accordion title="Authenticatiedetails">
    - Z.AI gebruikt Bearer-authenticatie met je API-sleutel.
    - De onboardingoptie `zai-api-key` detecteert automatisch het overeenkomende Z.AI-endpoint door ondersteunde endpoints met je sleutel te testen.
    - Gebruik de expliciete regionale opties (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) wanneer je een specifiek API-oppervlak wilt afdwingen.
    - De verouderde omgevingsvariabele `Z_AI_API_KEY` wordt nog steeds geaccepteerd; OpenClaw kopieert deze bij het opstarten naar `ZAI_API_KEY` als `ZAI_API_KEY` niet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig OpenClaw-configuratieschema, inclusief provider- en modelinstellingen.
  </Card>
</CardGroup>
