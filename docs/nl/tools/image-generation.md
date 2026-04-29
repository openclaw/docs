---
read_when:
    - Afbeeldingen genereren of bewerken via de agent
    - Aanbieders en modellen voor beeldgeneratie configureren
    - Inzicht in de parameters van de tool image_generate
sidebarTitle: Image generation
summary: Genereer en bewerk afbeeldingen via image_generate in OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Afbeeldingsgeneratie
x-i18n:
    generated_at: "2026-04-29T23:24:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

De tool `image_generate` laat de agent afbeeldingen maken en bewerken met je
geconfigureerde providers. Gegenereerde afbeeldingen worden automatisch als media-
bijlagen in het antwoord van de agent geleverd.

<Note>
De tool verschijnt alleen wanneer er ten minste één provider voor
afbeeldingsgeneratie beschikbaar is. Als je `image_generate` niet ziet in de
tools van je agent, configureer dan `agents.defaults.imageGenerationModel`, stel
een provider-API-sleutel in, of meld je aan met OpenAI Codex OAuth.
</Note>

## Snel aan de slag

<Steps>
  <Step title="Authenticatie configureren">
    Stel een API-sleutel in voor ten minste één provider (bijvoorbeeld `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) of meld je aan met OpenAI Codex OAuth.
  </Step>
  <Step title="Kies een standaardmodel (optioneel)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth gebruikt dezelfde modelverwijzing `openai/gpt-image-2`. Wanneer een
    OAuth-profiel `openai-codex` is geconfigureerd, routeert OpenClaw afbeeldings-
    aanvragen via dat OAuth-profiel in plaats van eerst `OPENAI_API_KEY` te proberen.
    Expliciete configuratie van `models.providers.openai` (API-sleutel,
    aangepaste/Azure-basis-URL) kiest weer voor de directe route via de OpenAI Images API.

  </Step>
  <Step title="Vraag het de agent">
    _"Genereer een afbeelding van een vriendelijke robotmascotte."_

    De agent roept `image_generate` automatisch aan. Er is geen toestemmingslijst
    voor tools nodig — het is standaard ingeschakeld wanneer er een provider beschikbaar is.

  </Step>
</Steps>

<Warning>
Voor OpenAI-compatibele LAN-eindpunten zoals LocalAI behoud je de aangepaste
`models.providers.openai.baseUrl` en kies je expliciet voor
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Privé- en interne
afbeeldingseindpunten blijven standaard geblokkeerd.
</Warning>

## Algemene routes

| Doel                                                 | Modelverwijzing                                   | Auth                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| OpenAI-afbeeldingsgeneratie met API-facturering      | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| OpenAI-afbeeldingsgeneratie met Codex-abonnementsauth | `openai/gpt-image-2`                              | OpenAI Codex OAuth                     |
| OpenAI PNG/WebP met transparante achtergrond         | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` of OpenAI Codex OAuth |
| DeepInfra-afbeeldingsgeneratie                      | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter-afbeeldingsgeneratie                     | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM-afbeeldingsgeneratie                        | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini-afbeeldingsgeneratie                  | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` of `GOOGLE_API_KEY`   |

Dezelfde tool `image_generate` verwerkt tekst-naar-afbeelding en bewerking met
referentieafbeeldingen. Gebruik `image` voor één referentie of `images` voor
meerdere referenties. Door de provider ondersteunde uitvoerhints zoals `quality`,
`outputFormat` en `background` worden doorgestuurd wanneer beschikbaar en
gerapporteerd als genegeerd wanneer een provider ze niet ondersteunt. Gebundelde
ondersteuning voor transparante achtergronden is specifiek voor OpenAI; andere
providers kunnen PNG-alpha nog steeds behouden als hun backend die uitvoert.

## Ondersteunde providers

| Provider   | Standaardmodel                         | Bewerkingsondersteuning             | Auth                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Ja (1 afbeelding, workflow-geconfigureerd) | `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` voor cloud |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Ja (1 afbeelding)                  | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Ja                                 | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Ja                                 | `GEMINI_API_KEY` of `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | Ja (tot 5 invoerafbeeldingen)      | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Ja (onderwerpreferentie)           | `MINIMAX_API_KEY` of MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Ja (tot 4 afbeeldingen)            | `OPENAI_API_KEY` of OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Ja (tot 5 invoerafbeeldingen)      | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Nee                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Ja (tot 5 afbeeldingen)            | `XAI_API_KEY`                                         |

Gebruik `action: "list"` om beschikbare providers en modellen tijdens runtime te inspecteren:

```text
/tool image_generate action=list
```

## Providermogelijkheden

| Mogelijkheid          | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Genereren (max. aantal) | Workflow-gedefinieerd | 4       | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Bewerken / referentie | 1 afbeelding (workflow) | 1 afbeelding | 1 afbeelding | Tot 5 afbeeldingen | 1 afbeelding (onderwerpreferentie) | Tot 5 afbeeldingen | — | Tot 5 afbeeldingen |
| Grootteregeling       | —                  | ✓         | ✓                 | ✓              | —                     | Tot 4K         | —     | —              |
| Beeldverhouding       | —                  | —         | ✓ (alleen genereren) | ✓            | ✓                     | —              | —     | ✓              |
| Resolutie (1K/2K/4K)  | —                  | —         | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Toolparameters

<ParamField path="prompt" type="string" required>
  Prompt voor afbeeldingsgeneratie. Vereist voor `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Gebruik `"list"` om beschikbare providers en modellen tijdens runtime te inspecteren.
</ParamField>
<ParamField path="model" type="string">
  Provider-/modeloverride (bijv. `openai/gpt-image-2`). Gebruik
  `openai/gpt-image-1.5` voor transparante OpenAI-achtergronden.
</ParamField>
<ParamField path="image" type="string">
  Pad of URL naar één referentieafbeelding voor bewerkingsmodus.
</ParamField>
<ParamField path="images" type="string[]">
  Meerdere referentieafbeeldingen voor bewerkingsmodus (tot 5 bij ondersteunende providers).
</ParamField>
<ParamField path="size" type="string">
  Groottehint: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Beeldverhouding: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Resolutiehint.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Kwaliteitshint wanneer de provider die ondersteunt.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Hint voor uitvoerindeling wanneer de provider die ondersteunt.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Achtergrondhint wanneer de provider die ondersteunt. Gebruik `transparent` met
  `outputFormat: "png"` of `"webp"` voor providers die transparantie ondersteunen.
</ParamField>
<ParamField path="count" type="number">Aantal te genereren afbeeldingen (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Optionele time-out voor providerverzoek in milliseconden.</ParamField>
<ParamField path="filename" type="string">Hint voor uitvoerbestandsnaam.</ParamField>
<ParamField path="openai" type="object">
  Alleen-OpenAI-hints: `background`, `moderation`, `outputCompression` en `user`.
</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. Wanneer een fallbackprovider
een verwante geometrieoptie ondersteunt in plaats van de exact aangevraagde,
wijst OpenClaw vóór indiening opnieuw toe naar de dichtstbijzijnde ondersteunde
grootte, beeldverhouding of resolutie. Niet-ondersteunde uitvoerhints worden
weggelaten voor providers die ondersteuning niet declareren en worden in het
toolresultaat gerapporteerd. Toolresultaten rapporteren de toegepaste
instellingen; `details.normalization` legt elke vertaling van aangevraagd naar
toegepast vast.
</Note>

## Configuratie

### Modelselectie

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Providerselectievolgorde

OpenClaw probeert providers in deze volgorde:

1. **`model`-parameter** uit de toolaanroep (als de agent er een opgeeft).
2. **`imageGenerationModel.primary`** uit configuratie.
3. **`imageGenerationModel.fallbacks`** op volgorde.
4. **Automatische detectie** — alleen auth-gedekte providerstandaarden:
   - huidige standaardprovider eerst;
   - resterende geregistreerde providers voor afbeeldingsgeneratie op volgorde van provider-id.

Als een provider faalt (authenticatiefout, snelheidslimiet, enz.), wordt de volgende
geconfigureerde kandidaat automatisch geprobeerd. Als alles faalt, bevat de fout details
van elke poging.

<AccordionGroup>
  <Accordion title="Modeloverrides per aanroep zijn exact">
    Een `model`-override per aanroep probeert alleen die provider/dat model en gaat
    niet door naar geconfigureerde primaire/fallback- of automatisch gedetecteerde providers.
  </Accordion>
  <Accordion title="Automatische detectie is auth-bewust">
    Een providerstandaard komt alleen in de kandidatenlijst wanneer OpenClaw die provider
    daadwerkelijk kan authenticeren. Stel
    `agents.defaults.mediaGenerationAutoProviderFallback: false` in om alleen expliciete
    vermeldingen voor `model`, `primary` en `fallbacks` te gebruiken.
  </Accordion>
  <Accordion title="Time-outs">
    Stel `agents.defaults.imageGenerationModel.timeoutMs` in voor trage afbeeldings-
    backends. Een `timeoutMs`-toolparameter per aanroep overschrijft de geconfigureerde
    standaardwaarde.
  </Accordion>
  <Accordion title="Inspecteren tijdens runtime">
    Gebruik `action: "list"` om de momenteel geregistreerde providers,
    hun standaardmodellen en auth-env-var-hints te inspecteren.
  </Accordion>
</AccordionGroup>

### Afbeeldingen bewerken

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI en xAI ondersteunen het bewerken
van referentieafbeeldingen. Geef een pad of URL naar een referentieafbeelding door:

```text
"Genereer een aquarelversie van deze foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google en xAI ondersteunen tot 5 referentieafbeeldingen via de
parameter `images`. fal, MiniMax en ComfyUI ondersteunen er 1.

## Diepgaande informatie per provider

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (en gpt-image-1.5)">
    OpenAI-afbeeldingsgeneratie gebruikt standaard `openai/gpt-image-2`. Als er een
    `openai-codex` OAuth-profiel is geconfigureerd, hergebruikt OpenClaw hetzelfde
    OAuth-profiel dat door Codex-abonnementschatmodellen wordt gebruikt en stuurt het
    de afbeeldingsaanvraag via de Codex Responses-backend. Verouderde Codex-basis-
    URL's zoals `https://chatgpt.com/backend-api` worden voor afbeeldingsaanvragen
    gecanoniseerd naar `https://chatgpt.com/backend-api/codex`. OpenClaw
    valt voor die aanvraag **niet** stilzwijgend terug op `OPENAI_API_KEY` —
    configureer `models.providers.openai` expliciet met een API-sleutel,
    aangepaste basis-URL of Azure-eindpunt om directe routering via de OpenAI Images API af te dwingen.

    De modellen `openai/gpt-image-1.5`, `openai/gpt-image-1` en
    `openai/gpt-image-1-mini` kunnen nog steeds expliciet worden geselecteerd. Gebruik
    `gpt-image-1.5` voor PNG/WebP-uitvoer met transparante achtergrond; de huidige
    `gpt-image-2`-API weigert `background: "transparent"`.

    `gpt-image-2` ondersteunt zowel tekst-naar-afbeelding-generatie als
    bewerking met referentieafbeeldingen via dezelfde `image_generate`-tool.
    OpenClaw stuurt `prompt`, `count`, `size`, `quality`, `outputFormat`
    en referentieafbeeldingen door naar OpenAI. OpenAI ontvangt
    `aspectRatio` of `resolution` **niet** rechtstreeks; waar mogelijk zet OpenClaw
    deze om naar een ondersteunde `size`, anders meldt de tool ze als
    genegeerde overrides.

    OpenAI-specifieke opties staan onder het object `openai`:

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` accepteert `transparent`, `opaque` of `auto`;
    transparante uitvoer vereist `outputFormat` `png` of `webp` en een
    OpenAI-afbeeldingsmodel dat transparantie ondersteunt. OpenClaw routeert standaard
    `gpt-image-2`-aanvragen met transparante achtergrond naar `gpt-image-1.5`.
    `openai.outputCompression` is van toepassing op JPEG/WebP-uitvoer.

    De hint `background` op het hoogste niveau is providerneutraal en wordt momenteel
    gekoppeld aan hetzelfde OpenAI-aanvraagveld `background` wanneer de OpenAI-provider
    is geselecteerd. Providers die geen achtergrondondersteuning declareren, retourneren
    deze in `ignoredOverrides` in plaats van de niet-ondersteunde parameter te ontvangen.

    Zie [Azure OpenAI-eindpunten](/nl/providers/openai#azure-openai-endpoints) om
    OpenAI-afbeeldingsgeneratie via een Azure OpenAI-implementatie te routeren
    in plaats van via `api.openai.com`.

  </Accordion>
  <Accordion title="OpenRouter-afbeeldingsmodellen">
    OpenRouter-afbeeldingsgeneratie gebruikt dezelfde `OPENROUTER_API_KEY` en
    routeert via OpenRouter's chat completions-afbeeldings-API. Selecteer
    OpenRouter-afbeeldingsmodellen met het voorvoegsel `openrouter/`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw stuurt `prompt`, `count`, referentieafbeeldingen en
    Gemini-compatibele hints voor `aspectRatio` / `resolution` door naar OpenRouter.
    Huidige ingebouwde snelkoppelingen voor OpenRouter-afbeeldingsmodellen omvatten
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` en `openai/gpt-5.4-image-2`. Gebruik
    `action: "list"` om te zien wat je geconfigureerde Plugin blootstelt.

  </Accordion>
  <Accordion title="MiniMax dubbele authenticatie">
    MiniMax-afbeeldingsgeneratie is beschikbaar via beide gebundelde MiniMax-
    authenticatiepaden:

    - `minimax/image-01` voor configuraties met API-sleutel
    - `minimax-portal/image-01` voor configuraties met OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    De gebundelde xAI-provider gebruikt `/v1/images/generations` voor aanvragen met alleen een prompt
    en `/v1/images/edits` wanneer `image` of `images` aanwezig is.

    - Modellen: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Aantal: tot 4
    - Referenties: één `image` of maximaal vijf `images`
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluties: `1K`, `2K`
    - Uitvoer: geretourneerd als door OpenClaw beheerde afbeeldingsbijlagen

    OpenClaw stelt bewust geen xAI-native `quality`, `mask`,
    `user` of extra native-only beeldverhoudingen beschikbaar totdat die bedieningselementen
    bestaan in het gedeelde provideroverschrijdende `image_generate`-contract.

  </Accordion>
</AccordionGroup>

## Voorbeelden

<Tabs>
  <Tab title="Genereren (4K-landschap)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Genereren (transparante PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Equivalente CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Genereren (twee vierkante)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Bewerken (één referentie)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Bewerken (meerdere referenties)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Dezelfde flags `--output-format` en `--background` zijn beschikbaar op
`openclaw infer image edit`; `--openai-background` blijft een
OpenAI-specifieke alias. Andere gebundelde providers dan OpenAI declareren
momenteel geen expliciete achtergrondbediening, dus `background: "transparent"` wordt
voor hen als genegeerd gemeld.

## Gerelateerd

- [Toolsoverzicht](/nl/tools) — alle beschikbare agenttools
- [ComfyUI](/nl/providers/comfy) — configuratie van lokale ComfyUI- en Comfy Cloud-workflows
- [fal](/nl/providers/fal) — configuratie van de fal-provider voor afbeeldingen en video
- [Google (Gemini)](/nl/providers/google) — configuratie van de Gemini-afbeeldingsprovider
- [MiniMax](/nl/providers/minimax) — configuratie van de MiniMax-afbeeldingsprovider
- [OpenAI](/nl/providers/openai) — configuratie van de OpenAI Images-provider
- [Vydra](/nl/providers/vydra) — configuratie van Vydra voor afbeeldingen, video en spraak
- [xAI](/nl/providers/xai) — configuratie van Grok voor afbeeldingen, video, zoeken, code-uitvoering en TTS
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — `imageGenerationModel`-configuratie
- [Modellen](/nl/concepts/models) — modelconfiguratie en failover
