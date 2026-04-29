---
read_when:
    - Je wilt MiniMax-modellen in OpenClaw
    - Je hebt hulp nodig bij het instellen van MiniMax
summary: MiniMax-modellen gebruiken in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-29T23:11:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax-provider gebruikt standaard **MiniMax M2.7**.

MiniMax biedt ook:

- Gebundelde spraaksynthese via T2A v2
- Gebundeld beeldbegrip via `MiniMax-VL-01`
- Gebundelde muziekgeneratie via `music-2.6`
- Gebundelde `web_search` via de zoek-API van MiniMax Coding Plan

Providerindeling:

| Provider-ID      | Authenticatie | Mogelijkheden                                                                                         |
| ---------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `minimax`        | API-sleutel   | Tekst, beeldgeneratie, muziekgeneratie, videogeneratie, beeldbegrip, spraak, webzoekfunctie          |
| `minimax-portal` | OAuth         | Tekst, beeldgeneratie, muziekgeneratie, videogeneratie, beeldbegrip, spraak                          |

## Ingebouwde catalogus

| Model                    | Type             | Beschrijving                              |
| ------------------------ | ---------------- | ----------------------------------------- |
| `MiniMax-M2.7`           | Chat (redenering) | Standaard gehost redeneermodel            |
| `MiniMax-M2.7-highspeed` | Chat (redenering) | Snellere M2.7-redeneringslaag             |
| `MiniMax-VL-01`          | Visie            | Model voor beeldbegrip                    |
| `image-01`               | Beeldgeneratie   | Tekst-naar-beeld en beeld-naar-beeld-bewerking |
| `music-2.6`              | Muziekgeneratie  | Standaard muziekmodel                     |
| `music-2.5`              | Muziekgeneratie  | Vorige muziekgeneratielaag                |
| `music-2.0`              | Muziekgeneratie  | Verouderde muziekgeneratielaag            |
| `MiniMax-Hailuo-2.3`     | Videogeneratie   | Tekst-naar-video en beeldreferentiestromen |

## Aan de slag

Kies je gewenste authenticatiemethode en volg de installatiestappen.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Beste voor:** snelle configuratie met MiniMax Coding Plan via OAuth, geen API-sleutel vereist.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Dit authenticeert bij `api.minimax.io`.
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

            Dit authenticeert bij `api.minimaxi.com`.
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
    OAuth-configuraties gebruiken de provider-id `minimax-portal`. Modelverwijzingen volgen de vorm `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Verwijslink voor MiniMax Coding Plan (10% korting): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Beste voor:** gehoste MiniMax met Anthropic-compatibele API.

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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
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
    Op het Anthropic-compatibele streamingpad schakelt OpenClaw MiniMax-denken standaard uit, tenzij je zelf expliciet `thinking` instelt. Het streaming-eindpunt van MiniMax verzendt `reasoning_content` in OpenAI-achtige deltafragmenten in plaats van native Anthropic-denkblokken, waardoor interne redenering in zichtbare uitvoer kan lekken als dit impliciet ingeschakeld blijft.
    </Warning>

    <Note>
    API-sleutelconfiguraties gebruiken de provider-id `minimax`. Modelverwijzingen volgen de vorm `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configureren via `openclaw configure`

Gebruik de interactieve configuratiewizard om MiniMax in te stellen zonder JSON te bewerken:

<Steps>
  <Step title="Start de wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Selecteer Model/auth">
    Kies **Model/auth** in het menu.
  </Step>
  <Step title="Kies een MiniMax-authoptie">
    Kies een van de beschikbare MiniMax-opties:

    | Auth-keuze | Beschrijving |
    | --- | --- |
    | `minimax-global-oauth` | Internationale OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China OAuth (Coding Plan) |
    | `minimax-global-api` | Internationale API-sleutel |
    | `minimax-cn-api` | China API-sleutel |

  </Step>
  <Step title="Kies je standaardmodel">
    Selecteer je standaardmodel wanneer daarom wordt gevraagd.
  </Step>
</Steps>

## Mogelijkheden

### Afbeeldingen genereren

De MiniMax-Plugin registreert het model `image-01` voor de tool `image_generate`. Het ondersteunt:

- **Tekst-naar-afbeelding genereren** met beheer van beeldverhouding
- **Afbeelding-naar-afbeelding bewerken** (onderwerpreferentie) met beheer van beeldverhouding
- Maximaal **9 uitvoerafbeeldingen** per aanvraag
- Maximaal **1 referentieafbeelding** per bewerkingsaanvraag
- Ondersteunde beeldverhoudingen: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Stel MiniMax in als provider voor het genereren van afbeeldingen om MiniMax daarvoor te gebruiken:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

De Plugin gebruikt dezelfde `MINIMAX_API_KEY` of OAuth-auth als de tekstmodellen. Er is geen aanvullende configuratie nodig als MiniMax al is ingesteld.

Zowel `minimax` als `minimax-portal` registreren `image_generate` met hetzelfde
`image-01`-model. Instellingen met API-sleutel gebruiken `MINIMAX_API_KEY`; OAuth-instellingen kunnen in plaats daarvan
het meegeleverde `minimax-portal`-authpad gebruiken.

Afbeeldingen genereren gebruikt altijd MiniMax' speciale afbeeldingseindpunt
(`/v1/image_generation`) en negeert `models.providers.minimax.baseUrl`,
omdat dat veld de chat-/Anthropic-compatibele basis-URL configureert. Stel
`MINIMAX_API_HOST=https://api.minimaxi.com` in om het genereren van afbeeldingen
via het CN-eindpunt te routeren; het standaard globale eindpunt is
`https://api.minimax.io`.

Wanneer onboarding of instelling met API-sleutel expliciete `models.providers.minimax`-vermeldingen schrijft, materialiseert OpenClaw `MiniMax-M2.7` en
`MiniMax-M2.7-highspeed` als chatmodellen met alleen tekst. Afbeeldingsbegrip wordt
apart beschikbaar gemaakt via de door de Plugin beheerde mediaprovider `MiniMax-VL-01`.

<Note>
Zie [Afbeeldingen genereren](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

### Tekst-naar-spraak

De meegeleverde `minimax`-Plugin registreert MiniMax T2A v2 als spraakprovider voor
`messages.tts`.

- Standaard TTS-model: `speech-2.8-hd`
- Standaardstem: `English_expressive_narrator`
- Ondersteunde meegeleverde model-id's zijn onder andere `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` en `speech-01-turbo`.
- Auth-oplossing is `messages.tts.providers.minimax.apiKey`, daarna
  OAuth-/token-authprofielen van `minimax-portal`, daarna omgevingssleutels voor
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), en daarna `MINIMAX_API_KEY`.
- Als er geen TTS-host is geconfigureerd, hergebruikt OpenClaw de geconfigureerde
  OAuth-host van `minimax-portal` en verwijdert het Anthropic-compatibele padsuffixen
  zoals `/anthropic`.
- Normale audiobijlagen blijven MP3.
- Doelen voor spraaknotities zoals Feishu en Telegram worden van MiniMax
  MP3 naar 48kHz Opus getranscodeerd met `ffmpeg`, omdat de Feishu/Lark-bestands-API alleen
  `file_type: "opus"` accepteert voor native audioberichten.
- MiniMax T2A accepteert fractionele `speed` en `vol`, maar `pitch` wordt als een
  geheel getal verzonden; OpenClaw kapt fractionele `pitch`-waarden af vóór de API-aanvraag.

| Instelling                                | Env-var                | Standaard                     | Beschrijving                    |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API-host.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS-model-id.                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Stem-id gebruikt voor spraakuitvoer. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Afspeelsnelheid, `0.5..2.0`.     |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Gehele pitchverschuiving, `-12..12`. |

### Muziek genereren

De meegeleverde MiniMax-Plugin registreert het genereren van muziek via de gedeelde
tool `music_generate` voor zowel `minimax` als `minimax-portal`.

- Standaard muziekmodel: `minimax/music-2.6`
- OAuth-muziekmodel: `minimax-portal/music-2.6`
- Ondersteunt ook `minimax/music-2.5` en `minimax/music-2.0`
- Promptbesturing: `lyrics`, `instrumental`, `durationSeconds`
- Uitvoerindeling: `mp3`
- Runs met sessieondersteuning koppelen los via de gedeelde taak-/statusstroom, inclusief `action: "status"`

MiniMax gebruiken als standaard muziekprovider:

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
Zie [Muziek genereren](/nl/tools/music-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

### Video genereren

De meegeleverde MiniMax-Plugin registreert het genereren van video via de gedeelde
tool `video_generate` voor zowel `minimax` als `minimax-portal`.

- Standaard videomodel: `minimax/MiniMax-Hailuo-2.3`
- OAuth-videomodel: `minimax-portal/MiniMax-Hailuo-2.3`
- Modi: tekst-naar-video en stromen met referentie voor een enkele afbeelding
- Ondersteunt `aspectRatio` en `resolution`

MiniMax gebruiken als standaard videoprovider:

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
Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

### Afbeeldingsbegrip

De MiniMax Plugin registreert afbeeldingsbegrip los van de tekstcatalogus:

| Provider-ID      | Standaard afbeeldingsmodel |
| ---------------- | -------------------------- |
| `minimax`        | `MiniMax-VL-01`            |
| `minimax-portal` | `MiniMax-VL-01`            |

Daarom kan automatische mediaroutering MiniMax-afbeeldingsbegrip gebruiken, zelfs
wanneer de gebundelde catalogus voor tekstproviders nog tekst-only M2.7-chatverwijzingen toont.

### Webzoekfunctie

De MiniMax Plugin registreert ook `web_search` via de MiniMax Coding Plan
zoek-API.

- Provider-ID: `minimax`
- Gestructureerde resultaten: titels, URL's, fragmenten, gerelateerde zoekopdrachten
- Voorkeurs-env-var: `MINIMAX_CODE_PLAN_KEY`
- Geaccepteerde env-alias: `MINIMAX_CODING_API_KEY`
- Compatibiliteitsfallback: `MINIMAX_API_KEY` wanneer deze al naar een coding-plan-token verwijst
- Hergebruik van regio: `plugins.entries.minimax.config.webSearch.region`, daarna `MINIMAX_API_HOST`, daarna MiniMax-providerbasis-URL's
- Zoeken blijft op provider-ID `minimax`; OAuth CN/global-configuratie kan de regio nog steeds indirect sturen via `models.providers.minimax-portal.baseUrl`

Configuratie staat onder `plugins.entries.minimax.config.webSearch.*`.

<Note>
Zie [MiniMax Zoeken](/nl/tools/minimax-search) voor volledige configuratie en gebruik van webzoeken.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Configuratieopties">
    | Optie | Beschrijving |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Geef de voorkeur aan `https://api.minimax.io/anthropic` (Anthropic-compatibel); `https://api.minimax.io/v1` is optioneel voor OpenAI-compatibele payloads |
    | `models.providers.minimax.api` | Geef de voorkeur aan `anthropic-messages`; `openai-completions` is optioneel voor OpenAI-compatibele payloads |
    | `models.providers.minimax.apiKey` | MiniMax API-sleutel (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definieer `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Aliasmodellen die je in de allowlist wilt |
    | `models.mode` | Houd `merge` aan als je MiniMax naast ingebouwde modellen wilt toevoegen |
  </Accordion>

  <Accordion title="Thinking-standaarden">
    Bij `api: "anthropic-messages"` injecteert OpenClaw `thinking: { type: "disabled" }`, tenzij thinking al expliciet is ingesteld in params/config.

    Dit voorkomt dat het streaming-eindpunt van MiniMax `reasoning_content` uitzendt in OpenAI-achtige delta chunks, waardoor interne redenering zou lekken naar zichtbare uitvoer.

  </Accordion>

  <Accordion title="Snelle modus">
    `/fast on` of `params.fastMode: true` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed` op het Anthropic-compatibele streampad.
  </Accordion>

  <Accordion title="Fallbackvoorbeeld">
    **Het meest geschikt voor:** houd je sterkste model van de nieuwste generatie als primair en schakel bij falen over naar MiniMax M2.7. Het onderstaande voorbeeld gebruikt Opus als concreet primair model; vervang dit door je gewenste primaire model van de nieuwste generatie.

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

  <Accordion title="Details over Coding Plan-gebruik">
    - Gebruiks-API voor Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (vereist een Coding Plan-sleutel).
    - OpenClaw normaliseert MiniMax Coding Plan-gebruik naar dezelfde weergave met `% resterend` die door andere providers wordt gebruikt. De ruwe velden `usage_percent` / `usagePercent` van MiniMax zijn resterend quotum, geen verbruikt quotum, dus OpenClaw keert ze om. Op aantallen gebaseerde velden krijgen voorrang wanneer ze aanwezig zijn.
    - Wanneer de API `model_remains` retourneert, geeft OpenClaw de voorkeur aan de vermelding voor het chatmodel, leidt het zo nodig het vensterlabel af van `start_time` / `end_time`, en neemt het de geselecteerde modelnaam op in het planlabel zodat Coding Plan-vensters makkelijker te onderscheiden zijn.
    - Gebruikssnapshots behandelen `minimax`, `minimax-cn` en `minimax-portal` als hetzelfde MiniMax-quotumoppervlak, en geven de voorkeur aan opgeslagen MiniMax OAuth voordat wordt teruggevallen op omgevingsvariabelen voor de Coding Plan-sleutel.

  </Accordion>
</AccordionGroup>

## Opmerkingen

- Modelverwijzingen volgen het authenticatiepad:
  - API-sleutelconfiguratie: `minimax/<model>`
  - OAuth-configuratie: `minimax-portal/<model>`
- Standaard chatmodel: `MiniMax-M2.7`
- Alternatief chatmodel: `MiniMax-M2.7-highspeed`
- Onboarding en directe API-sleutelconfiguratie schrijven tekst-only modeldefinities voor beide M2.7-varianten
- Beeldbegrip gebruikt de door de plugin beheerde mediaprovider `MiniMax-VL-01`
- Werk prijswaarden in `models.json` bij als je exacte kostentracking nodig hebt
- Gebruik `openclaw models list` om de huidige provider-id te bevestigen en schakel daarna over met `openclaw models set minimax/MiniMax-M2.7` of `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Verwijzingslink voor MiniMax Coding Plan (10% korting): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Zie [Modelproviders](/nl/concepts/model-providers) voor providerregels.
</Note>

## Probleemoplossing

<AccordionGroup>
  <Accordion title='"Onbekend model: minimax/MiniMax-M2.7"'>
    Dit betekent meestal dat de **MiniMax-provider niet is geconfigureerd** (geen overeenkomende providervermelding en geen MiniMax-authenticatieprofiel/omgevingssleutel gevonden). Een oplossing voor deze detectie staat in **2026.1.12**. Los dit op door:

    - Te upgraden naar **2026.1.12** (of te draaien vanaf bron `main`) en daarna de Gateway opnieuw te starten.
    - `openclaw configure` uit te voeren en een **MiniMax**-authenticatieoptie te selecteren, of
    - Het overeenkomende blok `models.providers.minimax` of `models.providers.minimax-portal` handmatig toe te voegen, of
    - `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` of een MiniMax-authenticatieprofiel in te stellen zodat de overeenkomende provider kan worden geïnjecteerd.

    Zorg ervoor dat de model-id **hoofdlettergevoelig** is:

    - API-sleutelpad: `minimax/MiniMax-M2.7` of `minimax/MiniMax-M2.7-highspeed`
    - OAuth-pad: `minimax-portal/MiniMax-M2.7` of `minimax-portal/MiniMax-M2.7-highspeed`

    Controleer daarna opnieuw met:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [Veelgestelde vragen](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failover-gedrag kiezen.
  </Card>
  <Card title="Beeldgeneratie" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor beeldtools en providerselectie.
  </Card>
  <Card title="Muziekgeneratie" href="/nl/tools/music-generation" icon="music">
    Gedeelde parameters voor muziektools en providerselectie.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="MiniMax Search" href="/nl/tools/minimax-search" icon="magnifying-glass">
    Webzoekconfiguratie via MiniMax Coding Plan.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
