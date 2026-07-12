---
read_when:
    - Je wilt Alibaba Wan-videogeneratie gebruiken in OpenClaw
    - Voor het genereren van video's moet je een API-sleutel voor Model Studio of DashScope instellen
summary: Alibaba Model Studio Wan-videogeneratie in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T09:12:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

De meegeleverde `alibaba`-plugin registreert een provider voor het genereren van video's met Wan-modellen op Alibaba Model Studio (de internationale naam voor DashScope). Deze is standaard ingeschakeld; alleen een API-sleutel is vereist.

| Eigenschap             | Waarde                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| Provider-id            | `alibaba`                                                                       |
| Plugin                 | meegeleverd, `enabledByDefault: true`                                            |
| Omgevingsvariabelen voor authenticatie | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (eerste overeenkomst wint) |
| Onboardingvlag         | `--auth-choice alibaba-model-studio-api-key`                                    |
| Rechtstreekse CLI-vlag | `--alibaba-model-studio-api-key <key>`                                          |
| Standaardmodel         | `alibaba/wan2.6-t2v`                                                            |
| Standaardbasis-URL     | `https://dashscope-intl.aliyuncs.com`                                           |

## Aan de slag

<Steps>
  <Step title="Stel een API-sleutel in">
    Sla de sleutel tijdens de onboarding op voor de `alibaba`-provider:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Of geef de sleutel rechtstreeks door:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Of exporteer een van de geaccepteerde omgevingsvariabelen voordat u de Gateway start:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # of DASHSCOPE_API_KEY=...
    # of QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Stel een standaardvideomodel in">
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
  <Step title="Controleer of de provider is geconfigureerd">
    ```bash
    openclaw models list --provider alibaba
    ```

    De lijst bevat alle vijf meegeleverde Wan-modellen. Als `MODELSTUDIO_API_KEY` niet kan worden gevonden, meldt `openclaw models status --json` de ontbrekende referentie onder `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  De Alibaba-plugin en de [Qwen-plugin](/nl/providers/qwen) authenticeren beide bij DashScope en accepteren deels dezelfde omgevingsvariabelen. Gebruik model-id's met `alibaba/...` voor de speciale Wan-video-interface; gebruik id's met `qwen/...` voor Qwen-chat, insluitingen of mediabegrip.
</Note>

## Ingebouwde Wan-modellen

| Modelreferentie             | Modus                              |
| --------------------------- | ---------------------------------- |
| `alibaba/wan2.6-t2v`        | Tekst naar video (standaard)       |
| `alibaba/wan2.6-i2v`        | Afbeelding naar video              |
| `alibaba/wan2.6-r2v`        | Referentie naar video              |
| `alibaba/wan2.6-r2v-flash`  | Referentie naar video (snel)       |
| `alibaba/wan2.7-r2v`        | Referentie naar video              |

## Mogelijkheden en limieten

Alle drie de modi hebben hetzelfde maximumaantal video's en dezelfde maximale duur per aanvraag; alleen de invoervorm verschilt.

| Modus                      | Max. uitvoervideo's | Max. invoerafbeeldingen | Max. invoervideo's | Max. duur | Ondersteunde besturingselementen                          |
| -------------------------- | ------------------- | ----------------------- | ------------------ | --------- | -------------------------------------------------------- |
| Tekst naar video           | 1                   | n.v.t.                  | n.v.t.             | 10 s      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Afbeelding naar video      | 1                   | 1                       | n.v.t.             | 10 s      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referentie naar video      | 1                   | n.v.t.                  | 4                  | 10 s      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Een aanvraag zonder `durationSeconds` krijgt de door DashScope geaccepteerde standaardwaarde van **5 seconden**. Stel `durationSeconds` expliciet in voor het [hulpmiddel voor videogeneratie](/nl/tools/video-generation) om de duur tot 10 s te verlengen.

<Warning>
  Referentieafbeeldingen en -video's moeten externe `http(s)`-URL's zijn; de referentiemodi van DashScope weigeren lokale bestandspaden. Upload ze eerst naar objectopslag of gebruik de werkwijze van het [mediahulpmiddel](/nl/tools/media-overview), die al een openbare URL oplevert.
</Warning>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Overschrijf de basis-URL van DashScope">
    De provider gebruikt standaard het internationale DashScope-eindpunt. Gebruik de volgende configuratie om het eindpunt voor de Chinese regio te gebruiken:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    De provider verwijdert afsluitende schuine strepen voordat AIGC-taak-URL's worden samengesteld.

  </Accordion>

  <Accordion title="Prioriteit van authenticatieomgevingsvariabelen">
    OpenClaw haalt de Alibaba-API-sleutel in deze volgorde uit omgevingsvariabelen en gebruikt de eerste niet-lege waarde:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Geconfigureerde vermeldingen in `auth.profiles` (ingesteld via `openclaw models auth login`) hebben voorrang op het bepalen via omgevingsvariabelen. Zie [Authenticatieprofielen in de veelgestelde vragen over modellen](/nl/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) voor profielrotatie, afkoelperioden en mechanismen voor overschrijven.

  </Accordion>

  <Accordion title="Relatie met de Qwen-plugin">
    Beide meegeleverde plugins communiceren met DashScope en accepteren deels dezelfde API-sleutels. Gebruik:

    - id's met `alibaba/wan*.*` voor de speciale Wan-videoprovider die op deze pagina wordt beschreven.
    - id's met `qwen/*` voor Qwen-chat, insluitingen en mediabegrip (zie [Qwen](/nl/providers/qwen)).

    Door `MODELSTUDIO_API_KEY` eenmaal in te stellen, worden beide plugins geauthenticeerd, omdat de lijsten met authenticatieomgevingsvariabelen bewust overlappen; afzonderlijke onboarding voor elke plugin is niet vereist.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor het videohulpmiddel en providerselectie.
  </Card>
  <Card title="Qwen" href="/nl/providers/qwen" icon="microchip">
    Configuratie van Qwen-chat, insluitingen en mediabegrip met dezelfde DashScope-authenticatie.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaardwaarden en modelconfiguratie.
  </Card>
  <Card title="Veelgestelde vragen over modellen" href="/nl/help/faq-models" icon="circle-question">
    Authenticatieprofielen, wisselen tussen modellen en fouten met "geen profiel" oplossen.
  </Card>
</CardGroup>
