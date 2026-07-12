---
read_when:
    - U wilt Z.AI-/GLM-modellen in OpenClaw gebruiken
    - Je hebt een eenvoudige configuratie van `ZAI_API_KEY` nodig
summary: Gebruik Z.AI (GLM-modellen) met OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T09:16:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI is het API-platform voor **GLM**-modellen. Het biedt REST-API's voor GLM en
gebruikt API-sleutels voor authenticatie. Maak uw API-sleutel aan in de Z.AI-console.
OpenClaw gebruikt de provider `zai` met een Z.AI-API-sleutel.

| Eigenschap   | Waarde                                       |
| ------------ | -------------------------------------------- |
| Provider     | `zai`                                        |
| Pakket       | `@openclaw/zai-provider`                     |
| Authenticatie | `ZAI_API_KEY` (verouderde alias: `Z_AI_API_KEY`) |
| API          | Z.AI Chat Completions (Bearer-authenticatie) |

## GLM-modellen

GLM is een modelfamilie, geen afzonderlijke provider. In OpenClaw gebruiken GLM-modellen
verwijzingen zoals `zai/glm-5.2`: provider `zai`, model-id `glm-5.2`.

## Aan de slag

Installeer eerst de provider-Plugin:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Eindpunt automatisch detecteren">
    **Meest geschikt voor:** de meeste gebruikers. OpenClaw test ondersteunde Z.AI-eindpunten met uw API-sleutel en past automatisch de juiste basis-URL toe.

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

  <Tab title="Expliciet regionaal eindpunt">
    **Meest geschikt voor:** gebruikers die een specifiek Coding Plan of algemeen API-oppervlak willen afdwingen.

    <Steps>
      <Step title="De juiste onboardingkeuze selecteren">
        ```bash
        # Coding Plan wereldwijd (aanbevolen voor gebruikers van Coding Plan)
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

### Eindpunten

| Onboardingkeuze      | Basis-URL                                     | Standaardmodel |
| -------------------- | --------------------------------------------- | -------------- |
| `zai-global`         | `https://api.z.ai/api/paas/v4`                | `glm-5.1`      |
| `zai-cn`             | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`      |
| `zai-coding-global`  | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`      |
| `zai-coding-cn`      | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`      |

`zai-api-key` detecteert automatisch een van deze vier door uw sleutel te testen met de
chat-completions-API van elk eindpunt. Hierbij worden eerst de algemene eindpunten
(`zai-global`, daarna `zai-cn`) gecontroleerd en vervolgens de Coding Plan-eindpunten
(`zai-coding-global`, daarna `zai-coding-cn`). Het proces stopt bij het eerste eindpunt
dat een aanvraag accepteert. Gebruik een expliciete `--auth-choice` om een Coding Plan-eindpunt
af te dwingen als uw sleutel op beide werkt.

## Configuratievoorbeeld

<Tip>
Met `zai-api-key` kan OpenClaw aan de hand van de sleutel het overeenkomende Z.AI-eindpunt
detecteren en automatisch de juiste basis-URL toepassen. Gebruik de expliciete regionale
keuzes wanneer u een specifiek Coding Plan of algemeen API-oppervlak wilt afdwingen.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 gebruikt het Coding Plan-eindpunt.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Ingebouwde catalogus

De provider-Plugin `zai` levert zijn catalogus in het Plugin-manifest, zodat een alleen-lezen
vermelding bekende GLM-rijen kan tonen zonder de providerruntime te laden:

```bash
openclaw models list --all --provider zai
```

De door het manifest ondersteunde catalogus bevat momenteel:

| Modelverwijzing       | Opmerkingen                         |
| --------------------- | ----------------------------------- |
| `zai/glm-5.2`         | Standaard voor Coding Plan; context van 1M |
| `zai/glm-5.1`         | Standaard voor de algemene API      |
| `zai/glm-5`           |                                     |
| `zai/glm-5-turbo`     |                                     |
| `zai/glm-5v-turbo`    |                                     |
| `zai/glm-4.7`         |                                     |
| `zai/glm-4.7-flash`   |                                     |
| `zai/glm-4.7-flashx`  |                                     |
| `zai/glm-4.6`         |                                     |
| `zai/glm-4.6v`        |                                     |
| `zai/glm-4.5`         |                                     |
| `zai/glm-4.5-air`     |                                     |
| `zai/glm-4.5-flash`   |                                     |
| `zai/glm-4.5v`        |                                     |

<Tip>
GLM-modellen zijn beschikbaar als `zai/<model>` (voorbeeld: `zai/glm-5`).
</Tip>

<Note>
De installatie van Coding Plan gebruikt standaard `zai/glm-5.2`; de installatie van de
algemene API blijft `zai/glm-5.1` gebruiken. Bij de Coding Plan-eindpunten valt automatische
detectie terug op `glm-5.1` en vervolgens `glm-4.7` wanneer de sleutel of het abonnement
GLM-5.2 niet beschikbaar stelt. GLM-versies en beschikbaarheid kunnen veranderen; voer
`openclaw models list --all --provider zai` uit om de catalogus te bekijken die bij uw
geïnstalleerde versie bekend is.
</Note>

## Denkniveaus

<Tabs>
  <Tab title="GLM-5.2">
    Volledig bereik: `off`, `low`, `high`, `max` (standaard `off`). OpenClaw koppelt
    `low` en `high` aan de redeneerinspanning `high` van Z.AI en `max` aan de inspanning
    `max` van Z.AI, via `reasoning_effort` in de aanvraagpayload.
  </Tab>
  <Tab title="Andere GLM-modellen">
    Alleen een binaire schakelaar: `off` en `low` (weergegeven als `on` in keuzelijsten),
    standaard `off`. Als denken op `off` wordt ingesteld, wordt
    `thinking: { type: "disabled" }` verzonden; bij elk ander niveau blijft de aanvraagpayload
    ongewijzigd (het eigen standaardgedrag voor redeneren van Z.AI is van toepassing).
  </Tab>
</Tabs>

Door denken op `off` in te stellen, voorkomt u dat antwoorden het uitvoerbudget aan
`reasoning_content` besteden voordat zichtbare tekst verschijnt.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Onbekende GLM-5-modellen voorwaarts oplossen">
    Onbekende `glm-5*`-id's worden nog steeds voorwaarts opgelost in het providerpad door
    metadata die eigendom is van de provider samen te stellen op basis van de
    `glm-4.7`-sjabloon wanneer de id overeenkomt met de huidige vorm van de GLM-5-familie.
  </Accordion>

  <Accordion title="Streaming van toolaanroepen">
    `tool_stream` is standaard ingeschakeld voor streaming van Z.AI-toolaanroepen. U schakelt dit als volgt uit:

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

  <Accordion title="Behoud van denkwerk">
    Het behoud van denkwerk moet expliciet worden ingeschakeld, omdat Z.AI vereist dat de
    volledige historische `reasoning_content` opnieuw wordt afgespeeld, wat het aantal
    prompttokens verhoogt. Schakel dit per model in:

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

    Wanneer dit is ingeschakeld en denken aanstaat, verzendt OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` en speelt het eerdere
    `reasoning_content` opnieuw af voor hetzelfde OpenAI-compatibele transcript. De
    parameternaam `preserve_thinking` in snake_case werkt als alias.

    Geavanceerde gebruikers kunnen de exacte providerpayload nog steeds overschrijven met
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Beeldbegrip">
    De Z.AI-Plugin registreert beeldbegrip.

    | Eigenschap | Waarde      |
    | ---------- | ----------- |
    | Model      | `glm-4.6v`  |

    Beeldbegrip wordt automatisch bepaald op basis van de geconfigureerde Z.AI-authenticatie;
    er is geen aanvullende configuratie nodig.

  </Accordion>

  <Accordion title="Authenticatiedetails">
    - Z.AI gebruikt Bearer-authenticatie met uw API-sleutel.
    - De onboardingkeuze `zai-api-key` detecteert automatisch het overeenkomende Z.AI-eindpunt door ondersteunde eindpunten met uw sleutel te testen.
    - Gebruik de expliciete regionale keuzes (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) wanneer u een specifiek API-oppervlak wilt afdwingen.
    - De verouderde omgevingsvariabele `Z_AI_API_KEY` wordt nog steeds geaccepteerd; OpenClaw kopieert deze bij het opstarten naar `ZAI_API_KEY` als `ZAI_API_KEY` niet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig OpenClaw-configuratieschema, inclusief provider- en modelinstellingen.
  </Card>
</CardGroup>
