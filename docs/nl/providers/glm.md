---
read_when:
    - Je wilt GLM-modellen in OpenClaw
    - Je hebt de naamgevingsconventie en configuratie voor modellen nodig
summary: Overzicht van de GLM-modelfamilie en gebruik ervan in OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T09:29:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM is een modelfamilie (geen bedrijf) die beschikbaar is via het [Z.AI](https://z.ai)-platform. In OpenClaw worden GLM-modellen benaderd via de gebundelde `zai`-provider met refs zoals `zai/glm-5.1`.

| Eigenschap             | Waarde                                                                      |
| ---------------------- | --------------------------------------------------------------------------- |
| Provider-id            | `zai`                                                                       |
| Plugin                 | gebundeld, `enabledByDefault: true`                                         |
| Auth-omgevingsvariabelen | `ZAI_API_KEY` or `Z_AI_API_KEY`                                           |
| Onboardingkeuzes       | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                    | OpenAI-compatibel                                                           |
| Standaardbasis-URL     | `https://api.z.ai/api/paas/v4`                                              |
| Voorgestelde standaard | `zai/glm-5.1`                                                               |
| Standaard afbeeldingsmodel | `zai/glm-4.6v`                                                          |

## Aan de slag

<Steps>
  <Step title="Kies een authenticatieroute en voer onboarding uit">
    Kies de onboardingkeuze die past bij je Z.AI-abonnement en regio. De generieke keuze `zai-api-key` detecteert automatisch het bijpassende endpoint op basis van de sleutelvorm; gebruik de expliciete regiokeuzes wanneer je een specifiek Coding Plan of algemeen API-oppervlak wilt afdwingen.

    | Auth-keuze          | Beste voor                                          |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | Generieke API-sleutel met automatische endpointdetectie |
    | `zai-coding-global` | Coding Plan-gebruikers (wereldwijd)                 |
    | `zai-coding-cn`     | Coding Plan-gebruikers (China-regio)                |
    | `zai-global`        | Algemene API (wereldwijd)                           |
    | `zai-cn`            | Algemene API (China-regio)                          |

    <CodeGroup>

```bash Automatisch detecteren
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (wereldwijd)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash Algemene API (wereldwijd)
openclaw onboard --auth-choice zai-global
```

```bash Algemene API (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="Stel GLM in als het standaardmodel">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Controleer of modellen beschikbaar zijn">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Configuratievoorbeeld

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  Met `zai-api-key` kan OpenClaw het bijpassende Z.AI-endpoint detecteren op basis van de sleutelvorm en automatisch de juiste basis-URL toepassen. Gebruik de expliciete regiokeuzes wanneer je een specifiek Coding Plan of algemeen API-oppervlak wilt vastzetten.
</Tip>

## Ingebouwde catalogus

De gebundelde `zai`-provider vult 13 GLM-modelrefs vooraf in. Alle vermeldingen ondersteunen redeneren, tenzij anders aangegeven; `glm-5v-turbo` en `glm-4.6v` accepteren naast tekst ook afbeeldingsinvoer.

| Modelref             | Opmerkingen                                        |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | Standaardmodel. Redeneren, alleen tekst, 202k context. |
| `zai/glm-5`          | Redeneren, alleen tekst, 202k context.             |
| `zai/glm-5-turbo`    | Redeneren, alleen tekst, 202k context.             |
| `zai/glm-5v-turbo`   | Redeneren, tekst + afbeelding, 202k context.       |
| `zai/glm-4.7`        | Redeneren, alleen tekst, 204k context.             |
| `zai/glm-4.7-flash`  | Redeneren, alleen tekst, 200k context.             |
| `zai/glm-4.7-flashx` | Redeneren, alleen tekst.                           |
| `zai/glm-4.6`        | Redeneren, alleen tekst.                           |
| `zai/glm-4.6v`       | Redeneren, tekst + afbeelding. Standaard afbeeldingsmodel. |
| `zai/glm-4.5`        | Redeneren, alleen tekst.                           |
| `zai/glm-4.5-air`    | Redeneren, alleen tekst.                           |
| `zai/glm-4.5-flash`  | Redeneren, alleen tekst.                           |
| `zai/glm-4.5v`       | Redeneren, tekst + afbeelding.                     |

<Note>
  GLM-versies en beschikbaarheid kunnen veranderen. Voer `openclaw models list --provider zai` uit om de catalogusrijen te bekijken die bekend zijn bij je geïnstalleerde versie, en raadpleeg de Z.AI-documentatie voor nieuw toegevoegde of verouderde modellen.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Automatische endpointdetectie">
    Wanneer je de auth-keuze `zai-api-key` gebruikt, inspecteert OpenClaw de sleutelvorm om de juiste Z.AI-basis-URL te bepalen. Expliciete regiokeuzes (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) overschrijven automatische detectie en zetten het endpoint direct vast.
  </Accordion>

  <Accordion title="Providerdetails">
    GLM-modellen worden aangeboden door de runtimeprovider `zai`. Zie de [Z.AI-providerpagina](/nl/providers/zai) voor de volledige providerconfiguratie, regionale endpoints en aanvullende mogelijkheden.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Z.AI-provider" href="/nl/providers/zai" icon="server">
    Volledige Z.AI-providerconfiguratie en regionale endpoints.
  </Card>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers kiezen, modelrefs en failovergedrag.
  </Card>
  <Card title="Denkmodi" href="/nl/tools/thinking" icon="brain">
    `/think`-niveaus voor de GLM-familie met redeneermogelijkheden.
  </Card>
  <Card title="Veelgestelde vragen over modellen" href="/nl/help/faq-models" icon="circle-question">
    Auth-profielen, modellen wisselen en "no profile"-fouten oplossen.
  </Card>
</CardGroup>
