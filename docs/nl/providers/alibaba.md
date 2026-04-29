---
read_when:
    - Je wilt Alibaba Wan-videogeneratie gebruiken in OpenClaw
    - Voor videogeneratie is een ingestelde API-sleutel voor Model Studio of DashScope vereist.
summary: Videogeneratie met Alibaba Model Studio Wan in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-29T23:08:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw levert een gebundelde `alibaba`-provider voor videogeneratie voor Wan-modellen op
Alibaba Model Studio / DashScope.

- Provider: `alibaba`
- Voorkeursauthenticatie: `MODELSTUDIO_API_KEY`
- Ook geaccepteerd: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: asynchrone videogeneratie van DashScope / Model Studio

## Aan de slag

<Steps>
  <Step title="Stel een API-sleutel in">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Stel een standaard videomodel in">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Controleer of de provider beschikbaar is">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Alle geaccepteerde authenticatiesleutels (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) werken. De onboardingkeuze `qwen-standard-api-key` configureert de gedeelde DashScope-referentie.
</Note>

## Ingebouwde Wan-modellen

De gebundelde `alibaba`-provider registreert momenteel:

| Modelreferentie           | Modus                     |
| ------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Tekst-naar-video          |
| `alibaba/wan2.6-i2v`       | Afbeelding-naar-video     |
| `alibaba/wan2.6-r2v`       | Referentie-naar-video     |
| `alibaba/wan2.6-r2v-flash` | Referentie-naar-video (snel) |
| `alibaba/wan2.7-r2v`       | Referentie-naar-video     |

## Huidige limieten

| Parameter             | Limiet                                                    |
| --------------------- | --------------------------------------------------------- |
| Uitvoervideo's        | Maximaal **1** per aanvraag                               |
| Invoerafbeeldingen    | Maximaal **1**                                            |
| Invoervideo's         | Maximaal **4**                                            |
| Duur                  | Maximaal **10 seconden**                                  |
| Ondersteunde opties   | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referentieafbeelding/-video | Alleen externe `http(s)`-URL's                      |

<Warning>
De modus voor referentieafbeelding/-video vereist momenteel **externe http(s)-URL's**. Lokale bestandspaden worden niet ondersteund voor referentie-invoer.
</Warning>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Relatie tot Qwen">
    De gebundelde `qwen`-provider gebruikt ook door Alibaba gehoste DashScope-eindpunten voor
    Wan-videogeneratie. Gebruik:

    - `qwen/...` wanneer je het canonieke Qwen-provideroppervlak wilt
    - `alibaba/...` wanneer je het directe, door de leverancier beheerde Wan-video-oppervlak wilt

    Zie de [Qwen-providerdocumentatie](/nl/providers/qwen) voor meer details.

  </Accordion>

  <Accordion title="Prioriteit van authenticatiesleutels">
    OpenClaw controleert op authenticatiesleutels in deze volgorde:

    1. `MODELSTUDIO_API_KEY` (voorkeur)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Elk van deze sleutels authenticeert de `alibaba`-provider.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde videotoolparameters en providerselectie.
  </Card>
  <Card title="Qwen" href="/nl/providers/qwen" icon="microchip">
    Qwen-providerconfiguratie en DashScope-integratie.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaarden en modelconfiguratie.
  </Card>
</CardGroup>
