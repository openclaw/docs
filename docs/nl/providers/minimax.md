---
read_when:
    - Je wilt MiniMax-modellen in OpenClaw
    - Je hebt hulp nodig bij het instellen van MiniMax
summary: MiniMax-modellen gebruiken in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:13:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

De MiniMax-provider van OpenClaw gebruikt standaard **MiniMax M3**.

MiniMax biedt ook:

- Gebundelde spraaksynthese via T2A v2
- Gebundeld beeldbegrip via `MiniMax-VL-01`
- Gebundelde muziekgeneratie via `music-2.6`
- Gebundelde `web_search` via de zoek-API van het MiniMax Token Plan

Provider-indeling:

| Provider-ID     | Authenticatie | Mogelijkheden                                                                                         |
| ---------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `minimax`        | API-sleutel   | Tekst, beeldgeneratie, muziekgeneratie, videogeneratie, beeldbegrip, spraak, zoeken op web            |
| `minimax-portal` | OAuth         | Tekst, beeldgeneratie, muziekgeneratie, videogeneratie, beeldbegrip, spraak                           |

## Ingebouwde catalogus

| Model                    | Type              | Beschrijving                                  |
| ------------------------ | ----------------- | --------------------------------------------- |
| `MiniMax-M3`             | Chat (redenering) | Standaard gehost redeneermodel                |
| `MiniMax-M2.7`           | Chat (redenering) | Vorig gehost redeneermodel                    |
| `MiniMax-M2.7-highspeed` | Chat (redenering) | Snellere M2.7-redeneerlaag                    |
| `MiniMax-VL-01`          | Visie             | Model voor beeldbegrip                        |
| `image-01`               | Beeldgeneratie    | Tekst-naar-beeld en beeld-naar-beeld-bewerking |
| `music-2.6`              | Muziekgeneratie   | Standaard muziekmodel                         |
| `music-2.5`              | Muziekgeneratie   | Vorige muziekgeneratielaag                    |
| `music-2.0`              | Muziekgeneratie   | Verouderde muziekgeneratielaag                |
| `MiniMax-Hailuo-2.3`     | Videogeneratie    | Tekst-naar-video en beeldreferentieflows      |

## Aan de slag

Kies je voorkeursmethode voor authenticatie en volg de installatiestappen.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Het beste voor:** snelle installatie met MiniMax Coding Plan via OAuth, geen API-sleutel vereist.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Dit authenticeert tegen `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Dit authenticeert tegen `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth-installaties gebruiken de provider-id `minimax-portal`. Modelverwijzingen volgen de vorm `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Verwijzingslink voor MiniMax Coding Plan (10% korting): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Het beste voor:** gehoste MiniMax met Anthropic-compatibele API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Dit configureert `api.minimax.io` als de basis-URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Dit configureert `api.minimaxi.com` als de basis-URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Op het Anthropic-compatibele streamingpad schakelt OpenClaw het denken van MiniMax M2.x standaard uit, tenzij je zelf expliciet `thinking` instelt. Het streaming-eindpunt van M2.x geeft `reasoning_content` uit in deltafragmenten in OpenAI-stijl in plaats van native Anthropic-denkblokken, waardoor interne redenering kan lekken naar zichtbare uitvoer als dit impliciet ingeschakeld blijft. MiniMax-M3 (en voorwaarts compatibele M3.x) is vrijgesteld van deze standaardinstelling: M3 geeft correcte Anthropic-denkblokken uit en vereist actief denken om zichtbare inhoud te produceren, dus OpenClaw houdt M3 op het door de provider weggelaten/adaptieve denkpad.
    </Warning>

    <Note>
    Installaties met API-sleutel gebruiken de provider-id `minimax`. Modelverwijzingen volgen de vorm `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configureren via `openclaw configure`

Gebruik de interactieve configuratiewizard om MiniMax in te stellen zonder JSON te bewerken:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Kies **Model/auth** in het menu.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Kies een van de beschikbare MiniMax-opties:

    | Authenticatiekeuze | Beschrijving |
    | --- | --- |
    | `minimax-global-oauth` | Internationale OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China OAuth (Coding Plan) |
    | `minimax-global-api` | Internationale API-sleutel |
    | `minimax-cn-api` | China API-sleutel |

  </Step>
  <Step title="Pick your default model">
    Selecteer je standaardmodel wanneer daarom wordt gevraagd.
  </Step>
</Steps>

## Mogelijkheden

### Beeldgeneratie

De MiniMax-Plugin registreert het model `image-01` voor de tool `image_generate`. Het ondersteunt:

- **Tekst-naar-beeld-generatie** met controle over beeldverhouding
- **Beeld-naar-beeld-bewerking** (onderwerpreferentie) met controle over beeldverhouding
- Tot **9 uitvoerbeelden** per verzoek
- Tot **1 referentiebeeld** per bewerkingsverzoek
- Ondersteunde beeldverhoudingen: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Om MiniMax voor beeldgeneratie te gebruiken, stel je het in als de provider voor beeldgeneratie:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

De Plugin gebruikt dezelfde `MINIMAX_API_KEY` of OAuth-authenticatie als de tekstmodellen. Er is geen aanvullende configuratie nodig als MiniMax al is ingesteld.

Zowel `minimax` als `minimax-portal` registreren `image_generate` met hetzelfde
`image-01`-model. Installaties met API-sleutel gebruiken `MINIMAX_API_KEY`; OAuth-installaties kunnen in plaats daarvan
het gebundelde authenticatiepad `minimax-portal` gebruiken.

Beeldgeneratie gebruikt altijd het specifieke beeldeindpunt van MiniMax
(`/v1/image_generation`) en negeert `models.providers.minimax.baseUrl`,
omdat dat veld de chat/Anthropic-compatibele basis-URL configureert. Stel
`MINIMAX_API_HOST=https://api.minimaxi.com` in om beeldgeneratie
via het CN-eindpunt te routeren; het standaard globale eindpunt is
`https://api.minimax.io`.

Wanneer onboarding of installatie met API-sleutel expliciete vermeldingen voor `models.providers.minimax`
schrijft, materialiseert OpenClaw `MiniMax-M3`, `MiniMax-M2.7` en
`MiniMax-M2.7-highspeed` als chatmodellen. M3 adverteert tekst- en beeldinvoer;
beeldbegrip blijft afzonderlijk beschikbaar via de door de Plugin beheerde
mediaprovider `MiniMax-VL-01`.

<Note>
Zie [Beeldgeneratie](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

### Tekst-naar-spraak

De gebundelde `minimax`-Plugin registreert MiniMax T2A v2 als spraakprovider voor
`messages.tts`.

- Standaard TTS-model: `speech-2.8-hd`
- Standaardstem: `English_expressive_narrator`
- Ondersteunde gebundelde model-id's omvatten `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` en `speech-01-turbo`.
- Authenticatieoplossing is `messages.tts.providers.minimax.apiKey`, daarna
  `minimax-portal` OAuth/token-authenticatieprofielen, daarna Token Plan-omgevingssleutels
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), daarna `MINIMAX_API_KEY`.
- Als er geen TTS-host is geconfigureerd, hergebruikt OpenClaw de geconfigureerde
  OAuth-host van `minimax-portal` en verwijdert Anthropic-compatibele padsuffixen
  zoals `/anthropic`.
- Normale audiobijlagen blijven MP3.
- Doelen voor spraaknotities zoals Feishu en Telegram worden getranscodeerd van MiniMax
  MP3 naar 48 kHz Opus met `ffmpeg`, omdat de Feishu/Lark-bestands-API alleen
  `file_type: "opus"` accepteert voor native audioberichten.
- MiniMax T2A accepteert fractionele `speed` en `vol`, maar `pitch` wordt verzonden als een
  geheel getal; OpenClaw kapt fractionele `pitch`-waarden af vóór het API-verzoek.

| Instelling                                      | Env-var                | Standaard                     | Beschrijving                         |
| ----------------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------ |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API-host.                |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS-model-id.                        |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Stem-id gebruikt voor spraakuitvoer. |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Afspeelsnelheid, `0.5..2.0`.         |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Volume, `(0, 10]`.                   |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Gehele-toonhoogteverschuiving, `-12..12`. |

### Muziekgeneratie

De gebundelde MiniMax-Plugin registreert muziekgeneratie via de gedeelde
tool `music_generate` voor zowel `minimax` als `minimax-portal`.

- Standaard muziekmodel: `minimax/music-2.6`
- OAuth-muziekmodel: `minimax-portal/music-2.6`
- Ondersteunt ook `minimax/music-2.5` en `minimax/music-2.0`
- Promptbesturing: `lyrics`, `instrumental`
- Uitvoerformaat: `mp3`
- Sessie-ondersteunde uitvoeringen worden losgekoppeld via de gedeelde taak-/statusflow, inclusief `action: "status"`

MiniMax gebruiken als standaard muziekaanbieder:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Zie [Muziekgeneratie](/nl/tools/music-generation) voor gedeelde toolparameters, aanbiederselectie en failovergedrag.
</Note>

### Videogeneratie

De gebundelde MiniMax-Plugin registreert videogeneratie via de gedeelde
`video_generate`-tool voor zowel `minimax` als `minimax-portal`.

- Standaard videomodel: `minimax/MiniMax-Hailuo-2.3`
- OAuth-videomodel: `minimax-portal/MiniMax-Hailuo-2.3`
- Modi: tekst-naar-video- en referentieflows met één afbeelding
- Ondersteunt `aspectRatio` en `resolution`

MiniMax gebruiken als standaard videoaanbieder:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters, aanbiederselectie en failovergedrag.
</Note>

### Afbeeldingsbegrip

De MiniMax-Plugin registreert afbeeldingsbegrip los van de tekstcatalogus:

| Aanbieder-ID     | Standaard afbeeldingsmodel |
| ---------------- | -------------------------- |
| `minimax`        | `MiniMax-VL-01`            |
| `minimax-portal` | `MiniMax-VL-01`            |

Daarom kan automatische mediarouting MiniMax-afbeeldingsbegrip gebruiken, zelfs
wanneer de gebundelde catalogus voor tekstaanbieders ook M3-chatverwijzingen met afbeeldingsmogelijkheden bevat.

### Webzoekopdracht

De MiniMax-Plugin registreert ook `web_search` via de MiniMax Token Plan
zoek-API.

- Aanbieder-id: `minimax`
- Gestructureerde resultaten: titels, URL's, snippets, gerelateerde zoekopdrachten
- Voorkeurs-env-var: `MINIMAX_CODE_PLAN_KEY`
- Geaccepteerde env-aliassen: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Compatibiliteitsfallback: `MINIMAX_API_KEY` wanneer deze al naar een token-planreferentie verwijst
- Regiohergebruik: `plugins.entries.minimax.config.webSearch.region`, daarna `MINIMAX_API_HOST`, daarna MiniMax-basis-URL's van aanbieders
- Zoeken blijft op aanbieder-id `minimax`; OAuth-CN/global-installatie kan regio indirect sturen via `models.providers.minimax-portal.baseUrl` en kan bearer-auth leveren via `MINIMAX_OAUTH_TOKEN`

Configuratie staat onder `plugins.entries.minimax.config.webSearch.*`.

<Note>
Zie [MiniMax Search](/nl/tools/minimax-search) voor volledige configuratie en gebruik van webzoekopdrachten.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Configuratieopties">
    | Optie | Beschrijving |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Geef de voorkeur aan `https://api.minimax.io/anthropic` (Anthropic-compatibel); `https://api.minimax.io/v1` is optioneel voor OpenAI-compatibele payloads |
    | `models.providers.minimax.api` | Geef de voorkeur aan `anthropic-messages`; `openai-completions` is optioneel voor OpenAI-compatibele payloads |
    | `models.providers.minimax.apiKey` | MiniMax-API-sleutel (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definieer `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Aliasmodellen die je in de allowlist wilt |
    | `models.mode` | Houd `merge` als je MiniMax naast ingebouwde aanbieders wilt toevoegen |
  </Accordion>

  <Accordion title="Standaardinstellingen voor denken">
    Bij `api: "anthropic-messages"` injecteert OpenClaw `thinking: { type: "disabled" }` voor MiniMax M2.x-modellen, tenzij denken al expliciet is ingesteld in params/config.

    Dit voorkomt dat het streamingendpoint van M2.x `reasoning_content` uitzendt in delta-chunks in OpenAI-stijl, waardoor interne redenering in zichtbare uitvoer zou lekken.

    MiniMax-M3 (en M3.x) is uitgezonderd: M3 zendt correcte Anthropic-denkblokken uit en retourneert een lege `content`-array met `stop_reason: "end_turn"` wanneer denken is uitgeschakeld, dus de wrapper houdt M3 op het weggelaten/adaptieve denkpad van de aanbieder.

  </Accordion>

  <Accordion title="Snelle modus">
    `/fast on` of `params.fastMode: true` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed` op het Anthropic-compatibele streampad.
  </Accordion>

  <Accordion title="Fallbackvoorbeeld">
    **Beste voor:** houd je sterkste model van de nieuwste generatie als primaire keuze en val terug op MiniMax M2.7. Het onderstaande voorbeeld gebruikt Opus als concrete primaire keuze; vervang dit door je gewenste primaire model van de nieuwste generatie.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gebruiksdetails voor Coding Plan">
    - Gebruiks-API voor Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` of `https://api.minimax.io/v1/token_plan/remains` (vereist een coding-plan-sleutel).
    - Gebruikspolling leidt de host af van `models.providers.minimax-portal.baseUrl` of `models.providers.minimax.baseUrl` wanneer geconfigureerd, zodat globale installaties die `https://api.minimax.io/anthropic` gebruiken `api.minimax.io` pollen. Ontbrekende of onjuist gevormde basis-URL's behouden de CN-fallback voor compatibiliteit.
    - OpenClaw normaliseert MiniMax-coding-plan-gebruik naar dezelfde `% left`-weergave die andere aanbieders gebruiken. De ruwe velden `usage_percent` / `usagePercent` van MiniMax zijn resterend quotum, niet verbruikt quotum, dus OpenClaw keert ze om. Op aantallen gebaseerde velden winnen wanneer ze aanwezig zijn.
    - Wanneer de API `model_remains` retourneert, geeft OpenClaw de voorkeur aan de chatmodelvermelding, leidt het vensterlabel indien nodig af van `start_time` / `end_time` en neemt de geselecteerde modelnaam op in het planlabel, zodat coding-plan-vensters makkelijker te onderscheiden zijn.
    - Gebruikssnapshots behandelen `minimax`, `minimax-cn` en `minimax-portal` als hetzelfde MiniMax-quotumoppervlak, en geven de voorkeur aan opgeslagen MiniMax-OAuth voordat ze terugvallen op env-vars voor Coding Plan-sleutels.

  </Accordion>
</AccordionGroup>

## Opmerkingen

- Modelverwijzingen volgen het auth-pad:
  - API-sleutelinstallatie: `minimax/<model>`
  - OAuth-installatie: `minimax-portal/<model>`
- Standaard chatmodel: `MiniMax-M3`
- Alternatieve chatmodellen: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Onboarding en directe API-sleutelinstallatie schrijven modeldefinities voor M3 en beide M2.7-varianten
- Afbeeldingsbegrip gebruikt de door de Plugin beheerde media-aanbieder `MiniMax-VL-01`
- Werk prijswaarden bij in `models.json` als je exacte kostentracking nodig hebt
- Gebruik `openclaw models list` om de huidige aanbieder-id te bevestigen en schakel daarna over met `openclaw models set minimax/MiniMax-M3` of `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Referrallink voor MiniMax Coding Plan (10% korting): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Zie [Modelaanbieders](/nl/concepts/model-providers) voor aanbiedersregels.
</Note>

## Probleemoplossing

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    Dit betekent meestal dat de **MiniMax-aanbieder niet is geconfigureerd** (geen overeenkomende aanbiedervermelding en geen MiniMax-authprofiel/env-sleutel gevonden). Een fix voor deze detectie staat in **2026.1.12**. Los dit op door:

    - Te upgraden naar **2026.1.12** (of uit source `main` te draaien) en daarna de Gateway opnieuw te starten.
    - `openclaw configure` uit te voeren en een **MiniMax**-authoptie te selecteren, of
    - Het overeenkomende blok `models.providers.minimax` of `models.providers.minimax-portal` handmatig toe te voegen, of
    - `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` of een MiniMax-authprofiel in te stellen, zodat de overeenkomende aanbieder kan worden geïnjecteerd.

    Zorg dat het model-id **hoofdlettergevoelig** is:

    - API-sleutelpad: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` of `minimax/MiniMax-M2.7-highspeed`
    - OAuth-pad: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` of `minimax-portal/MiniMax-M2.7-highspeed`

    Controleer daarna opnieuw met:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Aanbieders, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Afbeeldingsgeneratie" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor afbeeldingstools en aanbiederselectie.
  </Card>
  <Card title="Muziekgeneratie" href="/nl/tools/music-generation" icon="music">
    Gedeelde parameters voor muziektools en aanbiederselectie.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en aanbiederselectie.
  </Card>
  <Card title="MiniMax Search" href="/nl/tools/minimax-search" icon="magnifying-glass">
    Configuratie van webzoekopdrachten via MiniMax Token Plan.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en FAQ.
  </Card>
</CardGroup>
