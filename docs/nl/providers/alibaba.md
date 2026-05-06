---
read_when:
    - Je wilt Alibaba Wan-videogeneratie gebruiken in OpenClaw
    - Voor videogeneratie moet je een API-sleutel voor Model Studio of DashScope instellen
summary: Alibaba Model Studio Wan-videogeneratie in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T09:27:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw levert een meegeleverde `alibaba`-Plugin die een videogeneratieprovider registreert voor Wan-modellen op Alibaba Model Studio (de internationale naam voor DashScope). De Plugin is standaard ingeschakeld; je hoeft alleen een API-sleutel in te stellen.

| Eigenschap       | Waarde                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| Provider-id      | `alibaba`                                                                       |
| Plugin           | meegeleverd, `enabledByDefault: true`                                           |
| Auth-env-vars    | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (eerste match wint) |
| Onboarding-flag  | `--auth-choice alibaba-model-studio-api-key`                                    |
| Directe CLI-flag | `--alibaba-model-studio-api-key <key>`                                          |
| Standaardmodel   | `alibaba/wan2.6-t2v`                                                            |
| Standaardbasis-URL | `https://dashscope-intl.aliyuncs.com`                                         |

## Aan de slag

<Steps>
  <Step title="Set an API key">
    Gebruik onboarding om de sleutel op te slaan voor de `alibaba`-provider:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Of geef de sleutel direct door tijdens installatie/onboarding:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Of exporteer een van de geaccepteerde env-vars voordat je de Gateway start:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Set a default video model">
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
  <Step title="Verify the provider is configured">
    ```bash
    openclaw models list --provider alibaba
    ```

    De lijst moet alle vijf meegeleverde Wan-modellen bevatten. Als `MODELSTUDIO_API_KEY` niet kan worden herleid, meldt `openclaw models status --json` de ontbrekende credential onder `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  De Alibaba-Plugin en de [Qwen-Plugin](/nl/providers/qwen) authenticeren beide bij DashScope en accepteren overlappende env-vars. Gebruik `alibaba/...`-model-id's om het specifieke Wan-video-oppervlak aan te sturen; gebruik `qwen/...`-id's wanneer je Qwen's chat-, embedding- of mediabegrip-oppervlak wilt.
</Note>

## Ingebouwde Wan-modellen

| Modelverwijzing           | Modus                     |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Tekst-naar-video (standaard) |
| `alibaba/wan2.6-i2v`       | Afbeelding-naar-video     |
| `alibaba/wan2.6-r2v`       | Referentie-naar-video     |
| `alibaba/wan2.6-r2v-flash` | Referentie-naar-video (snel) |
| `alibaba/wan2.7-r2v`       | Referentie-naar-video     |

## Mogelijkheden en limieten

De meegeleverde provider weerspiegelt de limieten van DashScope's Wan-video-API. Alle drie modi delen hetzelfde maximum voor het aantal video's per request en dezelfde duurlimiet; alleen de invoervorm verschilt.

| Modus              | Max. uitvoervideo's | Max. invoerafbeeldingen | Max. invoervideo's | Max. duur | Ondersteunde instellingen                                  |
| ------------------ | ------------------- | ----------------------- | ------------------ | --------- | ---------------------------------------------------------- |
| Tekst-naar-video   | 1                   | n.v.t.                  | n.v.t.             | 10 s      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Afbeelding-naar-video | 1                | 1                       | n.v.t.             | 10 s      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referentie-naar-video | 1                | n.v.t.                  | 4                  | 10 s      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Wanneer een request `durationSeconds` weglaat, stuurt de provider DashScope's geaccepteerde standaard van **5 seconden**. Stel `durationSeconds` expliciet in op de [videogeneratietool](/nl/tools/video-generation) om dit te verlengen tot maximaal 10 s.

<Warning>
  Referentieafbeeldingen en video-invoer moeten externe `http(s)`-URL's zijn. Lokale bestandspaden worden niet geaccepteerd door DashScope's referentiemodi; upload eerst naar objectopslag of gebruik de [mediatool](/nl/tools/media-overview)-flow die al een openbare URL produceert.
</Warning>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Override the DashScope base URL">
    De provider gebruikt standaard het internationale DashScope-endpoint. Stel dit in om het endpoint voor de China-regio te gebruiken:

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

    De provider verwijdert afsluitende schuine strepen voordat AIGC-taak-URL's worden opgebouwd.

  </Accordion>

  <Accordion title="Auth env priority">
    OpenClaw herleidt de Alibaba API-sleutel uit omgevingsvariabelen in deze volgorde en gebruikt de eerste niet-lege waarde:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Geconfigureerde `auth.profiles`-vermeldingen (ingesteld via `openclaw models auth login`) overschrijven env-var-resolutie. Zie [Auth-profielen in de modellen-FAQ](/nl/help/faq-models#what-is-an-auth-profile) voor profielrotatie, cooldown en override-mechanismen.

  </Accordion>

  <Accordion title="Relationship to the Qwen plugin">
    Beide meegeleverde Plugins praten met DashScope en accepteren overlappende API-sleutels. Gebruik:

    - `alibaba/wan*.*`-id's om de specifieke Wan-videoprovider aan te sturen die op deze pagina wordt beschreven.
    - `qwen/*`-id's voor Qwen-chat, embeddings en mediabegrip (zie [Qwen](/nl/providers/qwen)).

    Door `MODELSTUDIO_API_KEY` één keer in te stellen, worden beide Plugins geauthenticeerd omdat de lijst met auth-env-vars bewust overlapt; je hoeft niet elke Plugin afzonderlijk te onboarden.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Video generation" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="Qwen" href="/nl/providers/qwen" icon="microchip">
    Qwen-chat, embeddings en configuratie voor mediabegrip met dezelfde DashScope-authenticatie.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaarden en modelconfiguratie.
  </Card>
  <Card title="Models FAQ" href="/nl/help/faq-models" icon="circle-question">
    Auth-profielen, wisselen van model en oplossen van fouten over "geen profiel".
  </Card>
</CardGroup>
