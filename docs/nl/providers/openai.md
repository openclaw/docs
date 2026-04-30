---
read_when:
    - Je wilt OpenAI-modellen gebruiken in OpenClaw
    - Je wilt Codex-authenticatie via een abonnement in plaats van API-sleutels
    - Je hebt strikter uitvoeringsgedrag van GPT-5-agents nodig
summary: Gebruik OpenAI via API-sleutels of een Codex-abonnement in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:29:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI biedt ontwikkelaars-API's voor GPT-modellen, en Codex is ook beschikbaar als
coding agent in een ChatGPT-abonnement via OpenAI's Codex-clients. OpenClaw houdt die
oppervlakken gescheiden zodat de configuratie voorspelbaar blijft.

OpenClaw ondersteunt drie OpenAI-familieroutes. Het modelvoorvoegsel selecteert de
provider-/authenticatieroute; een afzonderlijke runtime-instelling selecteert wie de
ingebedde agentlus uitvoert:

- **API-sleutel** — directe OpenAI Platform-toegang met gebruiksgebaseerde facturering (`openai/*`-modellen)
- **Codex-abonnement via PI** — ChatGPT/Codex-aanmelding met abonnementstoegang (`openai-codex/*`-modellen)
- **Codex app-server-harnas** — native Codex app-server-uitvoering (`openai/*`-modellen plus `agents.defaults.agentRuntime.id: "codex"`)

OpenAI ondersteunt expliciet OAuth-gebruik via abonnementen in externe tools en workflows zoals OpenClaw.

Provider, model, runtime en kanaal zijn afzonderlijke lagen. Als die labels
door elkaar raken, lees dan [Agentruntimes](/nl/concepts/agent-runtimes) voordat je
de configuratie wijzigt.

## Snelle keuze

| Doel                                          | Gebruik                                          | Opmerkingen                                                                  |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Directe facturering via API-sleutel           | `openai/gpt-5.5`                                 | Stel `OPENAI_API_KEY` in of voer OpenAI API-sleutel-onboarding uit.           |
| GPT-5.5 met ChatGPT/Codex-abonnementsauth     | `openai-codex/gpt-5.5`                           | Standaard PI-route voor Codex OAuth. Beste eerste keuze voor abonnementssetups. |
| GPT-5.5 met native Codex app-server-gedrag    | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Forceert het Codex app-server-harnas voor die modelverwijzing.                |
| Afbeeldingen genereren of bewerken            | `openai/gpt-image-2`                             | Werkt met `OPENAI_API_KEY` of OpenAI Codex OAuth.                             |
| Afbeeldingen met transparante achtergrond     | `openai/gpt-image-1.5`                           | Gebruik `outputFormat=png` of `webp` en `openai.background=transparent`.      |

## Naamgevingskaart

De namen lijken op elkaar maar zijn niet onderling uitwisselbaar:

| Naam die je ziet                    | Laag              | Betekenis                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Providervoorvoegsel | Directe OpenAI Platform API-route.                                                              |
| `openai-codex`                     | Providervoorvoegsel | OpenAI Codex OAuth-/abonnementsroute via de normale OpenClaw PI-runner.                         |
| `codex` plugin                     | Plugin            | Meegeleverde OpenClaw-plugin die de native Codex app-server-runtime en `/codex`-chatbesturing biedt. |
| `agentRuntime.id: codex`           | Agentruntime      | Forceer het native Codex app-server-harnas voor ingebedde beurten.                                |
| `/codex ...`                       | Chatopdrachtenset | Koppel/beheer Codex app-server-threads vanuit een gesprek.                                        |
| `runtime: "acp", agentId: "codex"` | ACP-sessieroute   | Expliciet fallbackpad dat Codex via ACP/acpx uitvoert.                                            |

Dit betekent dat een configuratie bewust zowel `openai-codex/*` als de
`codex` plugin kan bevatten. Dat is geldig wanneer je Codex OAuth via PI wilt
en ook native `/codex`-chatbesturing beschikbaar wilt hebben. `openclaw doctor`
waarschuwt voor die combinatie zodat je kunt bevestigen dat dit de bedoeling is;
het herschrijft deze niet.

<Note>
GPT-5.5 is beschikbaar via zowel directe OpenAI Platform API-sleuteltoegang als
abonnements-/OAuth-routes. Gebruik `openai/gpt-5.5` voor direct
`OPENAI_API_KEY`-verkeer, `openai-codex/gpt-5.5` voor Codex OAuth via PI, of
`openai/gpt-5.5` met `agentRuntime.id: "codex"` voor het native Codex
app-server-harnas.
</Note>

<Note>
Het inschakelen van de OpenAI-plugin, of het selecteren van een `openai-codex/*`-model,
schakelt de meegeleverde Codex app-server-plugin niet in. OpenClaw schakelt die
plugin alleen in wanneer je expliciet het native Codex-harnas selecteert met
`agentRuntime.id: "codex"` of een verouderde `codex/*`-modelverwijzing gebruikt.
Als de meegeleverde `codex` plugin is ingeschakeld maar `openai-codex/*` nog steeds
via PI wordt opgelost, waarschuwt `openclaw doctor` en laat het de route ongewijzigd.
</Note>

## OpenClaw-functiedekking

| OpenAI-mogelijkheid       | OpenClaw-oppervlak                                        | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>`-modelprovider                            | Ja                                                     |
| Codex-abonnementsmodellen | `openai-codex/<model>` met `openai-codex` OAuth           | Ja                                                     |
| Codex app-server-harnas   | `openai/<model>` met `agentRuntime.id: codex`             | Ja                                                     |
| Webzoekopdracht aan serverzijde | Native OpenAI Responses-tool                         | Ja, wanneer webzoekopdracht is ingeschakeld en geen provider is vastgezet |
| Afbeeldingen              | `image_generate`                                          | Ja                                                     |
| Video's                   | `video_generate`                                          | Ja                                                     |
| Tekst-naar-spraak         | `messages.tts.provider: "openai"` / `tts`                 | Ja                                                     |
| Batch spraak-naar-tekst   | `tools.media.audio` / media-inzicht                       | Ja                                                     |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "openai"`               | Ja                                                     |
| Realtime spraak           | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ja                                                    |
| Embeddings                | geheugen-embeddingprovider                                | Ja                                                     |

## Geheugen-embeddings

OpenClaw kan OpenAI, of een OpenAI-compatibel embedding-eindpunt, gebruiken voor
`memory_search`-indexering en query-embeddings:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Voor OpenAI-compatibele eindpunten die asymmetrische embeddinglabels vereisen,
stel je `queryInputType` en `documentInputType` in onder `memorySearch`. OpenClaw stuurt
die door als providerspecifieke `input_type`-aanvraagvelden: query-embeddings gebruiken
`queryInputType`; geïndexeerde geheugenfragmenten en batchindexering gebruiken
`documentInputType`. Zie de [referentie voor geheugenconfiguratie](/nl/reference/memory-config#provider-specific-config) voor het volledige voorbeeld.

## Aan de slag

Kies je gewenste authenticatiemethode en volg de installatiestappen.

<Tabs>
  <Tab title="API-sleutel (OpenAI Platform)">
    **Beste voor:** directe API-toegang en gebruiksgebaseerde facturering.

    <Steps>
      <Step title="Haal je API-sleutel op">
        Maak of kopieer een API-sleutel vanuit het [OpenAI Platform-dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Voer onboarding uit">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Of geef de sleutel direct door:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Routesamenvatting

    | Modelverwijzing        | Runtimeconfiguratie       | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | weggelaten / `agentRuntime.id: "pi"` | Directe OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | weggelaten / `agentRuntime.id: "pi"` | Directe OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"` | Codex app-server-harnas     | Codex app-server |

    <Note>
    `openai/*` is de directe OpenAI API-sleutelroute, tenzij je expliciet
    het Codex app-server-harnas forceert. Gebruik `openai-codex/*` voor Codex OAuth via
    de standaard PI-runner, of gebruik `openai/gpt-5.5` met
    `agentRuntime.id: "codex"` voor native Codex app-server-uitvoering.
    </Note>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw stelt `openai/gpt-5.3-codex-spark` **niet** beschikbaar. Live OpenAI API-aanvragen wijzen dat model af, en de huidige Codex-catalogus stelt het ook niet beschikbaar.
    </Warning>

  </Tab>

  <Tab title="Codex-abonnement">
    **Beste voor:** je ChatGPT/Codex-abonnement gebruiken in plaats van een afzonderlijke API-sleutel. Codex cloud vereist aanmelding bij ChatGPT.

    <Steps>
      <Step title="Voer Codex OAuth uit">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Of voer OAuth direct uit:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Voor headless setups of setups die ongeschikt zijn voor callbacks, voeg je `--device-code` toe om aan te melden met een ChatGPT-apparaatcodeflow in plaats van de localhost-browsercallback:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Stel het standaardmodel in">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Routesamenvatting

    | Modelverwijzing | Runtimeconfiguratie | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | weggelaten / `runtime: "pi"` | ChatGPT/Codex OAuth via PI | Codex-aanmelding |
    | `openai-codex/gpt-5.4-mini` | weggelaten / `runtime: "pi"` | ChatGPT/Codex OAuth via PI | Codex-aanmelding |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Nog steeds PI tenzij een plugin expliciet `openai-codex` claimt | Codex-aanmelding |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server-harnas | Codex app-server-auth |

    <Note>
    Blijf de `openai-codex`-provider-id gebruiken voor auth-/profielopdrachten. Het
    `openai-codex/*`-modelvoorvoegsel is ook de expliciete PI-route voor Codex OAuth.
    Het selecteert of activeert het meegeleverde Codex app-server-harnas niet automatisch.
    </Note>

    ### Configuratievoorbeeld

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding importeert geen OAuth-materiaal meer uit `~/.codex`. Meld je aan met browser-OAuth (standaard) of de apparaatcodeflow hierboven — OpenClaw beheert de resulterende referenties in zijn eigen agent-authopslag.
    </Note>

    ### Statusindicator

    Chat `/status` toont welke modelruntime actief is voor de huidige sessie.
    De standaard PI-harness verschijnt als `Runtime: OpenClaw Pi Default`. Wanneer de
    gebundelde Codex app-server-harness is geselecteerd, toont `/status`
    `Runtime: OpenAI Codex`. Bestaande sessies behouden hun vastgelegde harness-id, dus gebruik
    `/new` of `/reset` nadat je `agentRuntime` hebt gewijzigd als je wilt dat `/status` een
    nieuwe PI/Codex-keuze weerspiegelt.

    ### Doctor-waarschuwing

    Als de gebundelde `codex`-Plugin is ingeschakeld terwijl de
    `openai-codex/*`-route van dit tabblad is geselecteerd, waarschuwt `openclaw doctor` dat het model
    nog steeds via PI wordt omgezet. Laat de configuratie ongewijzigd wanneer dat de
    bedoelde subscription-auth-route is. Schakel alleen over naar `openai/<model>` plus
    `agentRuntime.id: "codex"` wanneer je native Codex
    app-server-uitvoering wilt.

    ### Limiet voor contextvenster

    OpenClaw behandelt modelmetadata en de runtime-contextlimiet als afzonderlijke waarden.

    Voor `openai-codex/gpt-5.5` via Codex OAuth:

    - Native `contextWindow`: `1000000`
    - Standaard runtime-`contextTokens`-limiet: `272000`

    De kleinere standaardlimiet heeft in de praktijk betere latentie- en kwaliteitskenmerken. Overschrijf deze met `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Gebruik `contextWindow` om native modelmetadata te declareren. Gebruik `contextTokens` om het runtime-contextbudget te beperken.
    </Note>

    ### Catalogusherstel

    OpenClaw gebruikt upstream Codex-catalogusmetadata voor `gpt-5.5` wanneer deze
    aanwezig is. Als live Codex-detectie de rij `openai-codex/gpt-5.5` weglaat terwijl
    het account is geauthenticeerd, synthetiseert OpenClaw die OAuth-modelrij zodat
    cron-, subagent- en geconfigureerde standaardmodelruns niet mislukken met
    `Unknown model`.

  </Tab>
</Tabs>

## Native Codex app-server-authenticatie

De native Codex app-server-harness gebruikt `openai/*`-modelverwijzingen plus
`agentRuntime.id: "codex"`, maar de authenticatie blijft accountgebaseerd. OpenClaw
selecteert authenticatie in deze volgorde:

1. Een expliciet OpenClaw `openai-codex`-auth-profiel dat aan de agent is gekoppeld.
2. Het bestaande account van de app-server, zoals een lokale Codex CLI ChatGPT-aanmelding.
3. Alleen voor lokale stdio app-server-starts, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer de app-server geen account meldt en nog steeds
   OpenAI-authenticatie vereist.

Dat betekent dat een lokale ChatGPT/Codex-abonnementsaanmelding niet wordt vervangen alleen
omdat het gatewayproces ook `OPENAI_API_KEY` heeft voor directe OpenAI-modellen
of embeddings. De fallback naar een API-sleutel via env is alleen het lokale stdio-pad zonder account; deze
wordt niet naar WebSocket app-server-verbindingen verzonden. Wanneer een abonnementsachtig Codex-profiel
is geselecteerd, houdt OpenClaw ook `CODEX_API_KEY` en `OPENAI_API_KEY`
buiten het gespawnde stdio app-server-childproces en stuurt het de geselecteerde credentials
via de login-RPC van de app-server.

## Afbeeldingen genereren

De gebundelde `openai`-Plugin registreert afbeeldingsgeneratie via de tool `image_generate`.
Deze ondersteunt zowel afbeeldingsgeneratie met OpenAI API-sleutel als Codex OAuth-afbeeldingsgeneratie
via dezelfde `openai/gpt-image-2`-modelverwijzing.

| Mogelijkheid             | OpenAI API-sleutel                | Codex OAuth                          |
| ------------------------ | --------------------------------- | ------------------------------------ |
| Modelverwijzing          | `openai/gpt-image-2`              | `openai/gpt-image-2`                 |
| Authenticatie            | `OPENAI_API_KEY`                  | OpenAI Codex OAuth-aanmelding        |
| Transport                | OpenAI Images API                 | Codex Responses-backend              |
| Max. afbeeldingen per aanvraag | 4                           | 4                                    |
| Bewerkingsmodus          | Ingeschakeld (tot 5 referentieafbeeldingen) | Ingeschakeld (tot 5 referentieafbeeldingen) |
| Grootte-overschrijvingen | Ondersteund, inclusief 2K/4K-formaten | Ondersteund, inclusief 2K/4K-formaten |
| Beeldverhouding / resolutie | Niet doorgestuurd naar OpenAI Images API | Waar veilig gekoppeld aan een ondersteund formaat |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Zie [Afbeeldingen genereren](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

`gpt-image-2` is de standaard voor zowel OpenAI tekst-naar-afbeelding-generatie als het
bewerken van afbeeldingen. `gpt-image-1.5`, `gpt-image-1` en `gpt-image-1-mini` blijven bruikbaar als
expliciete modeloverschrijvingen. Gebruik `openai/gpt-image-1.5` voor PNG/WebP-uitvoer
met transparante achtergrond; de huidige `gpt-image-2`-API wijst
`background: "transparent"` af.

Voor een aanvraag met transparante achtergrond moeten agents `image_generate` aanroepen met
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` of `"webp"`, en
`background: "transparent"`; de oudere provideroptie `openai.background` wordt
nog steeds geaccepteerd. OpenClaw beschermt ook de openbare OpenAI- en
OpenAI Codex OAuth-routes door standaard transparantie-aanvragen voor `openai/gpt-image-2` te herschrijven
naar `gpt-image-1.5`; Azure en aangepaste OpenAI-compatibele endpoints behouden
hun geconfigureerde deployment-/modelnamen.

Dezelfde instelling is beschikbaar voor headless CLI-runs:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Gebruik dezelfde vlaggen `--output-format` en `--background` met
`openclaw infer image edit` wanneer je vanaf een invoerbestand start.
`--openai-background` blijft beschikbaar als OpenAI-specifieke alias.

Voor Codex OAuth-installaties behoud je dezelfde `openai/gpt-image-2`-verwijzing. Wanneer een
`openai-codex` OAuth-profiel is geconfigureerd, zet OpenClaw dat opgeslagen OAuth-
toegangstoken om en stuurt het afbeeldingsaanvragen via de Codex Responses-backend. Het
probeert niet eerst `OPENAI_API_KEY` en valt voor die aanvraag niet stilzwijgend terug op een API-sleutel.
Configureer `models.providers.openai` expliciet met een API-sleutel,
aangepaste basis-URL of Azure-endpoint wanneer je in plaats daarvan de directe OpenAI Images API-
route wilt.
Als dat aangepaste afbeeldingsendpoint zich op een vertrouwd LAN-/privéadres bevindt, stel dan ook
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in; OpenClaw houdt
private/interne OpenAI-compatibele afbeeldingsendpoints geblokkeerd tenzij deze opt-in
aanwezig is.

Genereren:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Een transparante PNG genereren:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Bewerken:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Video genereren

De gebundelde `openai`-Plugin registreert videogeneratie via de tool `video_generate`.

| Mogelijkheid      | Waarde                                                                            |
| ----------------- | --------------------------------------------------------------------------------- |
| Standaardmodel    | `openai/sora-2`                                                                   |
| Modi              | Tekst-naar-video, afbeelding-naar-video, bewerking van één video                  |
| Referentie-invoer | 1 afbeelding of 1 video                                                           |
| Grootte-overschrijvingen | Ondersteund                                                                 |
| Andere overschrijvingen | `aspectRatio`, `resolution`, `audio`, `watermark` worden genegeerd met een toolwaarschuwing |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Zie [Video genereren](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

## GPT-5-promptbijdrage

OpenClaw voegt een gedeelde GPT-5-promptbijdrage toe voor runs uit de GPT-5-familie bij verschillende providers. Deze wordt toegepast op basis van model-id, dus `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` en andere compatibele GPT-5-verwijzingen krijgen dezelfde overlay. Oudere GPT-4.x-modellen niet.

De gebundelde native Codex-harness gebruikt hetzelfde GPT-5-gedrag en dezelfde heartbeat-overlay via developerinstructies van de Codex app-server, zodat `openai/gpt-5.x`-sessies die via `agentRuntime.id: "codex"` worden geforceerd dezelfde follow-through- en proactieve Heartbeat-richtlijnen behouden, ook al beheert Codex de rest van de harnessprompt.

De GPT-5-bijdrage voegt een getagd gedragscontract toe voor persona-persistentie, uitvoeringsveiligheid, tooldiscipline, uitvoervorm, voltooiingscontroles en verificatie. Kanaalspecifiek antwoord- en stil-berichtgedrag blijft in de gedeelde OpenClaw-systeemprompt en het outbound-bezorgbeleid. De GPT-5-richtlijnen zijn altijd ingeschakeld voor overeenkomende modellen. De laag voor vriendelijke interactiestijl is afzonderlijk en configureerbaar.

| Waarde                 | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (standaard) | Schakel de laag voor vriendelijke interactiestijl in |
| `"on"`                 | Alias voor `"friendly"`                     |
| `"off"`                | Schakel alleen de vriendelijke stijllaag uit |

<Tabs>
  <Tab title="Configuratie">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Waarden zijn runtime hoofdletterongevoelig, dus `"Off"` en `"off"` schakelen allebei de vriendelijke stijllaag uit.
</Tip>

<Note>
Legacy `plugins.entries.openai.config.personality` wordt nog steeds gelezen als compatibiliteitsfallback wanneer de gedeelde instelling `agents.defaults.promptOverlays.gpt5.personality` niet is ingesteld.
</Note>

## Stem en spraak

<AccordionGroup>
  <Accordion title="Spraaksynthese (TTS)">
    De gebundelde `openai`-Plugin registreert spraaksynthese voor het oppervlak `messages.tts`.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stem | `messages.tts.providers.openai.voice` | `coral` |
    | Snelheid | `messages.tts.providers.openai.speed` | (niet ingesteld) |
    | Instructies | `messages.tts.providers.openai.instructions` | (niet ingesteld, alleen `gpt-4o-mini-tts`) |
    | Formaat | `messages.tts.providers.openai.responseFormat` | `opus` voor spraaknotities, `mp3` voor bestanden |
    | API-sleutel | `messages.tts.providers.openai.apiKey` | Valt terug op `OPENAI_API_KEY` |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Beschikbare modellen: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Beschikbare stemmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Stel `OPENAI_TTS_BASE_URL` in om de TTS-basis-URL te overschrijven zonder het chat-API-endpoint te beïnvloeden.
    </Note>

  </Accordion>

  <Accordion title="Spraak-naar-tekst">
    De gebundelde `openai`-Plugin registreert batch-spraak-naar-tekst via
    OpenClaw's media-understanding-transcriptieoppervlak.

    - Standaardmodel: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Invoerpad: multipart-audiobestandsupload
    - Ondersteund door OpenClaw overal waar inkomende audiotranscriptie
      `tools.media.audio` gebruikt, inclusief Discord-spraakkanaalsegmenten en kanaal-
      audiobijlagen

    Om OpenAI af te dwingen voor inkomende audiotranscriptie:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Taal- en prompt-hints worden doorgestuurd naar OpenAI wanneer ze worden geleverd door de
    gedeelde configuratie voor audiomedia of per-call transcriptieverzoek.

  </Accordion>

  <Accordion title="Realtime transcriptie">
    De meegeleverde `openai`-plugin registreert realtime transcriptie voor de Voice Call-plugin.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Taal | `...openai.language` | (niet ingesteld) |
    | Prompt | `...openai.prompt` | (niet ingesteld) |
    | Stilteduur | `...openai.silenceDurationMs` | `800` |
    | VAD-drempel | `...openai.vadThreshold` | `0.5` |
    | API-sleutel | `...openai.apiKey` | Valt terug op `OPENAI_API_KEY` |

    <Note>
    Gebruikt een WebSocket-verbinding met `wss://api.openai.com/v1/realtime` met G.711 u-law-audio (`g711_ulaw` / `audio/pcmu`). Deze streamingprovider is bedoeld voor het realtime transcriptiepad van Voice Call; Discord-spraak neemt momenteel korte segmenten op en gebruikt in plaats daarvan het batchtranscriptiepad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime spraak">
    De meegeleverde `openai`-plugin registreert realtime spraak voor de Voice Call-plugin.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stem | `...openai.voice` | `alloy` |
    | Temperatuur | `...openai.temperature` | `0.8` |
    | VAD-drempel | `...openai.vadThreshold` | `0.5` |
    | Stilteduur | `...openai.silenceDurationMs` | `500` |
    | API-sleutel | `...openai.apiKey` | Valt terug op `OPENAI_API_KEY` |

    <Note>
    Ondersteunt Azure OpenAI via de configuratiesleutels `azureEndpoint` en `azureDeployment` voor realtime backend-bridges. Ondersteunt bidirectionele tool-calling. Gebruikt de G.711 u-law-audio-indeling.
    </Note>

    <Note>
    Control UI Talk gebruikt realtime OpenAI-browsersessies met een door de Gateway uitgegeven
    tijdelijke client secret en een directe browser-WebRTC-SDP-uitwisseling met de
    OpenAI Realtime API. Liveverificatie door maintainers is beschikbaar met
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    de OpenAI-leg geeft een client secret uit in Node, genereert een browser-SDP-aanbod
    met nep-microfoonmedia, plaatst dit bij OpenAI en past het SDP-antwoord toe
    zonder geheimen te loggen.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-eindpunten

De meegeleverde `openai`-provider kan een Azure OpenAI-resource gebruiken voor het genereren van afbeeldingen
door de basis-URL te overschrijven. Op het afbeeldingsgeneratiepad detecteert OpenClaw
Azure-hostnamen op `models.providers.openai.baseUrl` en schakelt het automatisch over naar
de aanvraagvorm van Azure.

<Note>
Realtime spraak gebruikt een apart configuratiepad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
en wordt niet beïnvloed door `models.providers.openai.baseUrl`. Zie de accordion **Realtime
spraak** onder [Spraak en spraakherkenning](#voice-and-speech) voor de Azure-
instellingen.
</Note>

Gebruik Azure OpenAI wanneer:

- Je al een Azure OpenAI-abonnement, quotum of enterpriseovereenkomst hebt
- Je regionale dataresidentie of compliancecontroles nodig hebt die Azure biedt
- Je verkeer binnen een bestaande Azure-tenant wilt houden

### Configuratie

Voor Azure-afbeeldingsgeneratie via de meegeleverde `openai`-provider wijs je
`models.providers.openai.baseUrl` naar je Azure-resource en stel je `apiKey` in op
de Azure OpenAI-sleutel (niet een OpenAI Platform-sleutel):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw herkent deze Azure-hostsuffixen voor de Azure-route voor afbeeldingsgeneratie:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Voor afbeeldingsgeneratieverzoeken op een herkende Azure-host doet OpenClaw het volgende:

- Verstuurt de header `api-key` in plaats van `Authorization: Bearer`
- Gebruikt deployment-scoped paden (`/openai/deployments/{deployment}/...`)
- Voegt `?api-version=...` toe aan elk verzoek
- Gebruikt een standaard aanvraagtime-out van 600s voor Azure-aanroepen voor afbeeldingsgeneratie.
  Per-call `timeoutMs`-waarden overschrijven deze standaard nog steeds.

Andere basis-URL's (publieke OpenAI, OpenAI-compatibele proxy's) behouden de standaard
OpenAI-aanvraagvorm voor afbeeldingen.

<Note>
Azure-routering voor het afbeeldingsgeneratiepad van de `openai`-provider vereist
OpenClaw 2026.4.22 of later. Eerdere versies behandelen elke aangepaste
`openai.baseUrl` als het publieke OpenAI-eindpunt en zullen mislukken met Azure-
afbeeldingsdeployments.
</Note>

### API-versie

Stel `AZURE_OPENAI_API_VERSION` in om een specifieke Azure-preview- of GA-versie
vast te zetten voor het Azure-pad voor afbeeldingsgeneratie:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

De standaard is `2024-12-01-preview` wanneer de variabele niet is ingesteld.

### Modelnamen zijn deploymentnamen

Azure OpenAI koppelt modellen aan deployments. Voor Azure-verzoeken voor afbeeldingsgeneratie
die via de meegeleverde `openai`-provider worden gerouteerd, moet het veld `model` in OpenClaw
de **Azure-deploymentnaam** zijn die je in de Azure-portal hebt geconfigureerd, niet
de publieke OpenAI-model-id.

Als je een deployment maakt met de naam `gpt-image-2-prod` die `gpt-image-2` levert:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dezelfde regel voor deploymentnamen geldt voor aanroepen voor afbeeldingsgeneratie die via
de meegeleverde `openai`-provider worden gerouteerd.

### Regionale beschikbaarheid

Azure-afbeeldingsgeneratie is momenteel alleen beschikbaar in een subset van regio's
(bijvoorbeeld `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controleer de actuele regiolijst van Microsoft voordat je een
deployment maakt, en bevestig dat het specifieke model in jouw regio wordt aangeboden.

### Parameterverschillen

Azure OpenAI en publieke OpenAI accepteren niet altijd dezelfde afbeeldingsparameters.
Azure kan opties weigeren die publieke OpenAI toestaat (bijvoorbeeld bepaalde
`background`-waarden op `gpt-image-2`) of ze alleen beschikbaar stellen op specifieke model-
versies. Deze verschillen komen van Azure en het onderliggende model, niet van
OpenClaw. Als een Azure-verzoek mislukt met een validatiefout, controleer dan de
parameterset die door jouw specifieke deployment en API-versie in de
Azure-portal wordt ondersteund.

<Note>
Azure OpenAI gebruikt native transport en compat-gedrag, maar ontvangt niet
de verborgen attributieheaders van OpenClaw — zie de accordion **Native versus OpenAI-compatibele
routes** onder [Geavanceerde configuratie](#advanced-configuration).

Voor chat- of Responses-verkeer op Azure (buiten afbeeldingsgeneratie) gebruik je de
onboardingflow of een toegewezen Azure-providerconfiguratie — alleen `openai.baseUrl`
neemt de Azure API-/auth-vorm niet over. Er bestaat een aparte
`azure-openai-responses/*`-provider; zie
de accordion over server-side Compaction hieronder.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Transport (WebSocket versus SSE)">
    OpenClaw gebruikt WebSocket-first met SSE-fallback (`"auto"`) voor zowel `openai/*` als `openai-codex/*`.

    In de modus `"auto"` doet OpenClaw het volgende:
    - Probeert één vroege WebSocket-fout opnieuw voordat wordt teruggevallen op SSE
    - Markeert WebSocket na een fout gedurende ~60 seconden als gedegradeerd en gebruikt SSE tijdens de cool-down
    - Voegt stabiele headers voor sessie- en beurtidentiteit toe voor nieuwe pogingen en herverbindingen
    - Normaliseert gebruikstellers (`input_tokens` / `prompt_tokens`) over transportvarianten heen

    | Waarde | Gedrag |
    |-------|----------|
    | `"auto"` (standaard) | Eerst WebSocket, SSE-fallback |
    | `"sse"` | Alleen SSE afdwingen |
    | `"websocket"` | Alleen WebSocket afdwingen |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Gerelateerde OpenAI-documentatie:
    - [Realtime API met WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API-responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket-opwarming">
    OpenClaw schakelt WebSocket-opwarming standaard in voor `openai/*` en `openai-codex/*` om de latentie van de eerste beurt te verminderen.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Snelle modus">
    OpenClaw biedt een gedeelde schakelaar voor snelle modus voor `openai/*` en `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuratie:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wanneer ingeschakeld, koppelt OpenClaw snelle modus aan OpenAI-prioriteitsverwerking (`service_tier = "priority"`). Bestaande `service_tier`-waarden blijven behouden, en snelle modus herschrijft `reasoning` of `text.verbosity` niet.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Sessie-overschrijvingen winnen van configuratie. Door de sessie-overschrijving in de Sessions UI te wissen, keert de sessie terug naar de geconfigureerde standaard.
    </Note>

  </Accordion>

  <Accordion title="Prioriteitsverwerking (service_tier)">
    De API van OpenAI biedt prioriteitsverwerking via `service_tier`. Stel dit per model in OpenClaw in:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Ondersteunde waarden: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` wordt alleen doorgestuurd naar native OpenAI-eindpunten (`api.openai.com`) en native Codex-eindpunten (`chatgpt.com/backend-api`). Als je een van beide providers via een proxy routeert, laat OpenClaw `service_tier` ongemoeid.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Voor directe OpenAI Responses-modellen (`openai/*` op `api.openai.com`) schakelt de Pi-harness-streamwrapper van de OpenAI-plugin server-side Compaction automatisch in:

    - Dwingt `store: true` af (tenzij modelcompatibiliteit `supportsStore: false` instelt)
    - Injecteert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standaard `compact_threshold`: 70% van `contextWindow` (of `80000` wanneer niet beschikbaar)

    Dit geldt voor het ingebouwde Pi-harness-pad en voor OpenAI-providerhooks die door embedded runs worden gebruikt. De native Codex app-server-harness beheert zijn eigen context via Codex en wordt apart geconfigureerd met `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Expliciet inschakelen">
        Nuttig voor compatibele eindpunten zoals Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Aangepaste drempel">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Uitschakelen">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` beheert alleen `context_management`-injectie. Directe OpenAI Responses-modellen forceren nog steeds `store: true`, tenzij compat `supportsStore: false` instelt.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT-modus">
    Voor GPT-5-familie-runs op `openai/*` kan OpenClaw een strikter ingebed uitvoeringscontract gebruiken:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Met `strict-agentic` doet OpenClaw het volgende:
    - Behandelt een beurt met alleen een plan niet langer als succesvolle voortgang wanneer er een toolactie beschikbaar is
    - Probeert de beurt opnieuw met een act-now-sturing
    - Schakelt `update_plan` automatisch in voor substantieel werk
    - Toont een expliciete geblokkeerde status als het model blijft plannen zonder te handelen

    <Note>
    Alleen van toepassing op OpenAI- en Codex GPT-5-familie-runs. Andere providers en oudere modelfamilies behouden het standaardgedrag.
    </Note>

  </Accordion>

  <Accordion title="Native versus OpenAI-compatibele routes">
    OpenClaw behandelt directe OpenAI-, Codex- en Azure OpenAI-eindpunten anders dan generieke OpenAI-compatibele `/v1`-proxies:

    **Native routes** (`openai/*`, Azure OpenAI):
    - Behoudt `reasoning: { effort: "none" }` alleen voor modellen die de OpenAI-`none`-inspanning ondersteunen
    - Laat uitgeschakelde reasoning weg voor modellen of proxies die `reasoning.effort: "none"` weigeren
    - Stelt toolschema's standaard in op strikte modus
    - Voegt verborgen attributieheaders alleen toe op geverifieerde native hosts
    - Behoudt OpenAI-specifieke request shaping (`service_tier`, `store`, reasoning-compat, prompt-cache-hints)

    **Proxy/compatibele routes:**
    - Gebruiken losser compat-gedrag
    - Verwijderen Completions `store` uit niet-native `openai-completions`-payloads
    - Accepteren geavanceerde `params.extra_body`/`params.extraBody` pass-through-JSON voor OpenAI-compatibele Completions-proxies
    - Accepteren `params.chat_template_kwargs` voor OpenAI-compatibele Completions-proxies zoals vLLM
    - Forceren geen strikte toolschema's of native-only headers

    Azure OpenAI gebruikt native transport en compat-gedrag, maar ontvangt de verborgen attributieheaders niet.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failover-gedrag kiezen.
  </Card>
  <Card title="Afbeeldingsgeneratie" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor afbeeldingstools en providerselectie.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="OAuth en auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
