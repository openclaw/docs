---
read_when:
    - Je wilt MiniMax-modellen in OpenClaw
    - Je hebt hulp nodig bij het instellen van MiniMax
summary: Gebruik MiniMax-modellen in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T09:19:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  De meegeleverde `minimax`-Plugin registreert twee providers en zeven mogelijkheden: chat, afbeeldingsgeneratie, muziekgeneratie, videogeneratie, afbeeldingsbegrip, spraak (T2A v2) en zoeken op internet.

  | Provider-ID      | Authenticatie | Mogelijkheden                                                                                              |
  | ---------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
  | `minimax`        | API-sleutel   | Tekst, afbeeldingsgeneratie, muziekgeneratie, videogeneratie, afbeeldingsbegrip, spraak, zoeken op internet |
  | `minimax-portal` | OAuth         | Tekst, afbeeldingsgeneratie, muziekgeneratie, videogeneratie, afbeeldingsbegrip, spraak                     |

  <Tip>
  Verwijzingslink voor het MiniMax Coding Plan (10% korting): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Ingebouwde catalogus

  | Model                    | Type                   | Beschrijving                                         |
  | ------------------------ | ---------------------- | ---------------------------------------------------- |
  | `MiniMax-M3`             | Chat (redeneren)       | Standaard gehost redeneermodel                        |
  | `MiniMax-M2.7`           | Chat (redeneren)       | Vorig gehost redeneermodel                            |
  | `MiniMax-M2.7-highspeed` | Chat (redeneren)       | Snellere redeneervariant van M2.7                     |
  | `MiniMax-VL-01`          | Visie                  | Model voor afbeeldingsbegrip                          |
  | `image-01`               | Afbeeldingsgeneratie   | Tekst-naar-afbeelding en afbeelding-naar-afbeelding   |
  | `music-2.6`              | Muziekgeneratie        | Standaard muziekmodel                                 |
  | `MiniMax-Hailuo-2.3`     | Videogeneratie         | Tekst-naar-video- en afbeelding-naar-videowerkstromen |

  Modelverwijzingen volgen het authenticatiepad: `minimax/<model>` voor configuraties met een API-sleutel en `minimax-portal/<model>` voor OAuth-configuraties.

  ## Aan de slag

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Het meest geschikt voor:** snelle configuratie met het MiniMax Coding Plan via OAuth, zonder vereiste API-sleutel.

    <Tabs>
      <Tab title="Internationaal">
        <Steps>
          <Step title="Voer de onboarding uit">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Resulterende basis-URL van de provider: `api.minimax.io`.
          </Step>
          <Step title="Controleer of het model beschikbaar is">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Voer de onboarding uit">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Resulterende basis-URL van de provider: `api.minimaxi.com`.
          </Step>
          <Step title="Controleer of het model beschikbaar is">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth-configuraties gebruiken de provider-ID `minimax-portal`. Modelverwijzingen hebben de vorm `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="API-sleutel">
    **Het meest geschikt voor:** gehoste MiniMax met een Anthropic-compatibele API.

    <Tabs>
      <Tab title="Internationaal">
        <Steps>
          <Step title="Voer de onboarding uit">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Hiermee wordt `api.minimax.io` als basis-URL geconfigureerd.
          </Step>
          <Step title="Controleer of het model beschikbaar is">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Voer de onboarding uit">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Hiermee wordt `api.minimaxi.com` als basis-URL geconfigureerd.
          </Step>
          <Step title="Controleer of het model beschikbaar is">
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
    Het Anthropic-compatibele streaming-eindpunt van MiniMax-M2.x verzendt `reasoning_content` in deltasegmenten in OpenAI-stijl in plaats van systeemeigen denkblokken van Anthropic. Hierdoor komt interne redenering in de zichtbare uitvoer terecht als denken impliciet ingeschakeld blijft. OpenClaw schakelt denken voor M2.x standaard uit, tenzij u `thinking` zelf expliciet instelt. MiniMax-M3 (en voorwaarts compatibele M3.x-versies) vormt een uitzondering: M3 verzendt correcte denkblokken van Anthropic en vereist dat denken actief is om zichtbare inhoud te produceren. Daarom houdt OpenClaw M3 op het adaptieve denkpad van de provider. Zie het gedeelte over standaardinstellingen voor denken onder Geavanceerde configuratie hieronder.
    </Warning>

    <Note>
    Configuraties met een API-sleutel gebruiken de provider-ID `minimax`. Modelverwijzingen hebben de vorm `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configureren via `openclaw configure`

<Steps>
  <Step title="Start de wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Selecteer Model/auth">
    Kies **Model/auth** in het menu.
  </Step>
  <Step title="Kies een MiniMax-authenticatieoptie">
    | Authenticatiekeuze    | Beschrijving                       |
    | --------------------- | ---------------------------------- |
    | `minimax-global-oauth` | Internationale OAuth (Coding Plan) |
    | `minimax-cn-oauth`     | Chinese OAuth (Coding Plan)         |
    | `minimax-global-api`   | Internationale API-sleutel          |
    | `minimax-cn-api`       | Chinese API-sleutel                 |
  </Step>
  <Step title="Kies je standaardmodel">
    Selecteer je standaardmodel wanneer daarom wordt gevraagd.
  </Step>
</Steps>

## Mogelijkheden

### Afbeeldingen genereren

De MiniMax-plugin registreert het model `image-01` voor de tool `image_generate` voor zowel `minimax` als `minimax-portal` en hergebruikt daarbij dezelfde `MINIMAX_API_KEY` of OAuth-authenticatie als de tekstmodellen.

- Tekst-naar-afbeelding-generatie en afbeelding-naar-afbeelding-bewerking (onderwerpreferentie), beide met regeling van de beeldverhouding
- Maximaal 9 uitvoerafbeeldingen per aanvraag en 1 referentieafbeelding per bewerkingsaanvraag
- Ondersteunde beeldverhoudingen: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Voor het genereren van afbeeldingen wordt altijd het speciale afbeeldingseindpunt van MiniMax (`/v1/image_generation`) gebruikt en wordt `models.providers.minimax.baseUrl` genegeerd, omdat dat veld in plaats daarvan de met chat/Anthropic compatibele basis-URL configureert. Stel `MINIMAX_API_HOST=https://api.minimaxi.com` in om het genereren van afbeeldingen via het Chinese eindpunt te routeren; het standaard internationale eindpunt is `https://api.minimax.io`.

<Note>
Zie [Afbeeldingen genereren](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

### Tekst-naar-spraak

De meegeleverde `minimax`-plugin registreert MiniMax T2A v2 als spraakprovider voor `messages.tts`.

- Standaard TTS-model: `speech-2.8-hd`
- Standaardstem: `English_expressive_narrator`
- Meegeleverde model-ID's: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Volgorde voor het bepalen van de authenticatie: `messages.tts.providers.minimax.apiKey`, vervolgens OAuth-/tokenauthenticatieprofielen van `minimax-portal`, daarna omgevingssleutels voor het Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`) en ten slotte `MINIMAX_API_KEY`
- Als er geen TTS-host is geconfigureerd, hergebruikt OpenClaw de geconfigureerde OAuth-host van `minimax-portal` en verwijdert het met Anthropic compatibele padsuffixen zoals `/anthropic`
- Normale audiobijlagen blijven MP3. Doelen voor spraakberichten (Feishu, Telegram en andere kanalen die om een met spraakberichten compatibele bijlage vragen) worden met `ffmpeg` getranscodeerd van MiniMax-MP3 naar 48kHz-Opus, omdat bijvoorbeeld de bestands-API van Feishu/Lark voor systeemeigen audioberichten alleen `file_type: "opus"` accepteert
- MiniMax T2A accepteert fractionele waarden voor `speed` en `vol`, maar `pitch` wordt als geheel getal verzonden; OpenClaw kapt fractionele `pitch`-waarden af vóór de API-aanvraag

| Instelling                                | Omgevingsvariabele     | Standaard                     | Beschrijving                              |
| ----------------------------------------- | ---------------------- | ----------------------------- | ----------------------------------------- |
| `messages.tts.providers.minimax.baseUrl`  | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | API-host voor MiniMax T2A.                |
| `messages.tts.providers.minimax.model`    | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID van het TTS-model.                     |
| `messages.tts.providers.minimax.voiceId`  | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Stem-ID voor de spraakuitvoer.            |
| `messages.tts.providers.minimax.speed`    |                        | `1.0`                         | Afspeelsnelheid, `0.5..2.0`.              |
| `messages.tts.providers.minimax.vol`      |                        | `1.0`                         | Volume, `(0, 10]`.                        |
| `messages.tts.providers.minimax.pitch`    |                        | `0`                           | Gehele toonhoogteverschuiving, `-12..12`. |

### Muziek genereren

De meegeleverde MiniMax-plugin registreert het genereren van muziek via de gedeelde tool `music_generate` voor zowel `minimax` als `minimax-portal`.

- Standaard muziekmodel: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Ondersteunt ook `music-2.6-free`, `music-cover` en `music-cover-free`
- Promptbesturing: `lyrics`, `instrumental`
- Uitvoerindeling: `mp3`
- Door sessies ondersteunde uitvoeringen worden losgekoppeld via de gedeelde taak-/statusstroom, inclusief `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Zie [Muziek genereren](/nl/tools/music-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

### Video genereren

De meegeleverde MiniMax-plugin registreert het genereren van video via de gedeelde tool `video_generate` voor zowel `minimax` als `minimax-portal`.

- Standaard videomodel: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Ondersteunt ook `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` en `I2V-01`
- Modi: tekst-naar-video en stromen met één afbeelding als referentie
- Ondersteunt `resolution` (`768P` of `1080P` bij Hailuo 2.3/02-modellen); `aspectRatio` wordt niet ondersteund en wordt genegeerd

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

### Afbeeldingsbegrip

De MiniMax-plugin registreert afbeeldingsbegrip afzonderlijk van de tekstcatalogus:

| Provider-ID      | Standaard afbeeldingsmodel | Pdf-tekstextractie |
| ---------------- | -------------------------- | ------------------ |
| `minimax`        | `MiniMax-VL-01`            | `MiniMax-M2.7`     |
| `minimax-portal` | `MiniMax-VL-01`            | `MiniMax-M2.7`     |

Daarom kan automatische mediaroutering MiniMax-afbeeldingsbegrip gebruiken, zelfs wanneer de meegeleverde tekstprovidercatalogus ook chatreferenties bevat voor M3-modellen die afbeeldingen ondersteunen. Voor pdf-begrip wordt `MiniMax-M2.7` uitsluitend voor tekstextractie gebruikt; MiniMax registreert geen conversiepad van pdf naar afbeelding.

### Zoeken op het web

De MiniMax-plugin registreert ook `web_search` via de zoek-API van het MiniMax Token Plan (`/v1/coding_plan/search`).

- Provider-ID: `minimax`
- Gestructureerde resultaten: titels, URL's, fragmenten, gerelateerde zoekopdrachten
- Voorkeursomgevingsvariabele: `MINIMAX_CODE_PLAN_KEY`
- Geaccepteerde omgevingsaliassen: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Compatibiliteitsfallback: `MINIMAX_API_KEY` wanneer deze al naar een referentie voor het tokenplan verwijst
- Hergebruik van regio: `plugins.entries.minimax.config.webSearch.region`, vervolgens `MINIMAX_API_HOST`, daarna de basis-URL's van de MiniMax-provider
- Zoeken blijft provider-ID `minimax` gebruiken; OAuth-configuratie voor CN/globaal kan de regio indirect aansturen via `models.providers.minimax-portal.baseUrl` en bearer-authenticatie leveren via `MINIMAX_OAUTH_TOKEN`

De configuratie bevindt zich onder `plugins.entries.minimax.config.webSearch.*`.

<Note>
Zie [MiniMax Search](/nl/tools/minimax-search) voor de volledige configuratie en het gebruik van zoeken op het web.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Configuratieopties">
    | Optie | Beschrijving |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Gebruik bij voorkeur `https://api.minimax.io/anthropic` (compatibel met Anthropic); `https://api.minimax.io/v1` is optioneel voor met OpenAI compatibele payloads |
    | `models.providers.minimax.api` | Gebruik bij voorkeur `anthropic-messages`; `openai-completions` is optioneel voor met OpenAI compatibele payloads |
    | `models.providers.minimax.apiKey` | MiniMax-API-sleutel (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definieer `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Geef aliassen aan modellen die u in de toelatingslijst wilt opnemen |
    | `models.mode` | Behoud `merge` als u MiniMax naast de ingebouwde modellen wilt toevoegen |
  </Accordion>

  <Accordion title="Standaardinstellingen voor denkwerk">
    Bij `api: "anthropic-messages"` voegt OpenClaw voor MiniMax M2.x-modellen `thinking: { type: "disabled" }` toe, tenzij een eerdere wrapper het veld `thinking` al in de payload heeft ingesteld. Dit voorkomt dat het streaming-eindpunt van M2.x `reasoning_content` in deltafragmenten in OpenAI-stijl uitzendt, waardoor interne redeneringen in zichtbare uitvoer zouden terechtkomen.

    MiniMax-M3 (en M3.x) is uitgezonderd: M3 retourneert een lege `content`-array met `stop_reason: "end_turn"` wanneer denkwerk is uitgeschakeld. Daarom verwijdert OpenClaw de impliciete uitgeschakelde standaardinstelling voor M3 en dwingt het in plaats daarvan `thinking: { type: "adaptive" }` af wanneer een denkniveau is ingesteld.

    Beschikbare denkniveaus per modelfamilie:

    | Modelfamilie   | Niveaus                                   | Standaard  |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                         | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Snelle modus">
    `/fast on` of `params.fastMode: true` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed` op het met Anthropic compatibele streamingpad (`api: "anthropic-messages"`, provider `minimax` of `minimax-portal`).
  </Accordion>

  <Accordion title="Fallbackvoorbeeld">
    **Meest geschikt voor:** behoud uw krachtigste model van de nieuwste generatie als primair model en schakel bij een fout over naar MiniMax M2.7. In het onderstaande voorbeeld wordt Opus als concreet primair model gebruikt; vervang dit door het gewenste primaire model van de nieuwste generatie.

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

  <Accordion title="Gebruiksdetails van Coding Plan">
    - Gebruiks-API van Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` of `https://api.minimax.io/v1/token_plan/remains` (vereist een Coding Plan-sleutel).
    - Bij gebruikspeiling wordt de host afgeleid van `models.providers.minimax-portal.baseUrl` of `models.providers.minimax.baseUrl` wanneer deze is geconfigureerd. Daardoor peilen globale configuraties die `https://api.minimax.io/anthropic` gebruiken bij `api.minimax.io`. Bij ontbrekende of onjuist gevormde basis-URL's blijft de CN-fallback behouden voor compatibiliteit.
    - OpenClaw normaliseert het Coding Plan-gebruik van MiniMax naar dezelfde weergave `% resterend` die andere providers gebruiken. De onbewerkte velden `usage_percent` / `usagePercent` van MiniMax geven het resterende quotum aan, niet het verbruikte quotum. Daarom keert OpenClaw deze waarden om. Op aantallen gebaseerde velden krijgen voorrang wanneer ze aanwezig zijn.
    - Wanneer de API `model_remains` retourneert, geeft OpenClaw de voorkeur aan de vermelding voor het chatmodel, leidt het indien nodig het vensterlabel af van `start_time` / `end_time` en neemt het de geselecteerde modelnaam op in het planlabel, zodat Coding Plan-vensters gemakkelijker te onderscheiden zijn.
    - Gebruiksmomentopnamen behandelen `minimax`, `minimax-cn`, `minimax-portal` en `minimax-portal-cn` als hetzelfde MiniMax-quotumoppervlak en geven de voorkeur aan opgeslagen MiniMax-OAuth voordat ze terugvallen op omgevingsvariabelen voor de Coding Plan-sleutel.

  </Accordion>
</AccordionGroup>

## Opmerkingen

- Standaard chatmodel: `MiniMax-M3`. Alternatieve chatmodellen: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Onboarding en rechtstreekse configuratie met een API-sleutel schrijven modeldefinities voor M3 en beide M2.7-varianten
- Afbeeldingsbegrip gebruikt de door de plugin beheerde mediaprovider `MiniMax-VL-01`
- Werk de prijswaarden in `models.json` bij als u exacte kostentracering nodig hebt
- Gebruik `openclaw models list` om het huidige provider-ID te bevestigen en schakel vervolgens over met `openclaw models set minimax/MiniMax-M3` of `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Zie [Modelproviders](/nl/concepts/model-providers) voor providerregels.
</Note>

## Probleemoplossing

<AccordionGroup>
  <Accordion title='"Onbekend model: minimax/MiniMax-M3"'>
    Dit betekent doorgaans dat de **MiniMax-provider niet is geconfigureerd** (er is geen overeenkomende providervermelding en er is geen MiniMax-authenticatieprofiel of omgevingssleutel gevonden). Los dit als volgt op:

    - Voer `openclaw configure` uit en selecteer een authenticatieoptie voor **MiniMax**, of
    - Voeg handmatig het overeenkomende blok `models.providers.minimax` of `models.providers.minimax-portal` toe, of
    - Stel `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` of een MiniMax-authenticatieprofiel in, zodat de overeenkomende provider kan worden geïnjecteerd.

    Houd er rekening mee dat het model-ID **hoofdlettergevoelig** is:

    - Pad met API-sleutel: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` of `minimax/MiniMax-M2.7-highspeed`
    - OAuth-pad: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` of `minimax-portal/MiniMax-M2.7-highspeed`

    Controleer het daarna opnieuw met:

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
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor de afbeeldingstool en providerselectie.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Gedeelde parameters voor de muziektool en providerselectie.
  </Card>
  <Card title="Video genereren" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor de videotool en providerselectie.
  </Card>
  <Card title="MiniMax Search" href="/nl/tools/minimax-search" icon="magnifying-glass">
    Configuratie voor zoeken op het web via MiniMax Token Plan.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
