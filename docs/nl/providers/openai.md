---
read_when:
    - Je wilt OpenAI-modellen gebruiken in OpenClaw
    - Je wilt Codex-abonnementsauthenticatie in plaats van API-sleutels
    - Je hebt strikter uitvoeringsgedrag voor GPT-5-agenten nodig
summary: Gebruik OpenAI via API-sleutels of een Codex-abonnement in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T11:26:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0caf43895c1bc8494b1a0d4aeef98e575bb31aca047430a63156875bed3bb112
    source_path: providers/openai.md
    workflow: 16
---

OpenAI biedt ontwikkelaars-API's voor GPT-modellen, en Codex is ook beschikbaar als een
codeeragent voor ChatGPT-abonnementen via de Codex-clients van OpenAI. OpenClaw houdt die
interfaces gescheiden zodat de configuratie voorspelbaar blijft.

OpenClaw ondersteunt drie OpenAI-familieroutes. De meeste ChatGPT/Codex-abonnees
die Codex-gedrag willen, moeten de native Codex app-server-runtime gebruiken. Het
modelvoorvoegsel selecteert de provider-/modelnaam; een aparte runtime-instelling selecteert
wie de ingebedde agentlus uitvoert:

- **API-sleutel** - directe toegang tot OpenAI Platform met facturering op basis van gebruik (`openai/*`-modellen)
- **Codex-abonnement met native Codex-runtime** - ChatGPT/Codex-aanmelding plus uitvoering via Codex app-server (`openai/*`-modellen plus `agents.defaults.agentRuntime.id: "codex"`)
- **Codex-abonnement via PI** - ChatGPT/Codex-aanmelding met de normale OpenClaw PI-runner (`openai-codex/*`-modellen)

OpenAI ondersteunt expliciet het gebruik van abonnements-OAuth in externe tools en workflows zoals OpenClaw.

Provider, model, runtime en kanaal zijn aparte lagen. Als die labels door elkaar
worden gehaald, lees dan [Agentruntimes](/nl/concepts/agent-runtimes) voordat je de
configuratie wijzigt.

## Snelle keuze

| Doel                                                 | Gebruik                                          | Opmerkingen                                                               |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime    | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Aanbevolen Codex-configuratie voor de meeste gebruikers. Meld je aan met `openai-codex`-authenticatie. |
| Directe facturering via API-sleutel                  | `openai/gpt-5.5`                                 | Stel `OPENAI_API_KEY` in of voer OpenAI API-sleutel-onboarding uit.       |
| ChatGPT/Codex-abonnementsauthenticatie via PI        | `openai-codex/gpt-5.5`                           | Gebruik dit alleen als je bewust de normale PI-runner wilt.               |
| Beeldgeneratie of -bewerking                         | `openai/gpt-image-2`                             | Werkt met `OPENAI_API_KEY` of OpenAI Codex OAuth.                         |
| Afbeeldingen met transparante achtergrond            | `openai/gpt-image-1.5`                           | Gebruik `outputFormat=png` of `webp` en `openai.background=transparent`.  |

## Naamgevingskaart

De namen lijken op elkaar, maar zijn niet onderling uitwisselbaar:

| Naam die je ziet                    | Laag              | Betekenis                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Providerprefix    | Directe OpenAI Platform API-route.                                                                |
| `openai-codex`                     | Providerprefix    | OpenAI Codex OAuth-/abonnementsroute via de normale OpenClaw PI-runner.                           |
| `codex` plugin                     | Plugin            | Meegeleverde OpenClaw-plugin die de native Codex app-server-runtime en `/codex`-chatbesturing biedt. |
| `agentRuntime.id: codex`           | Agentruntime      | Dwing de native Codex app-server-harness af voor ingebedde beurten.                               |
| `/codex ...`                       | Chatcommandoset   | Codex app-server-threads vanuit een gesprek koppelen/beheren.                                     |
| `runtime: "acp", agentId: "codex"` | ACP-sessieroute   | Expliciet fallbackpad dat Codex via ACP/acpx uitvoert.                                            |

Dit betekent dat een configuratie bewust zowel `openai-codex/*` als de
`codex` plugin kan bevatten. Dat is geldig wanneer je Codex OAuth via PI wilt en ook wilt
dat native `/codex`-chatbesturing beschikbaar is. `openclaw doctor` waarschuwt voor die
combinatie zodat je kunt bevestigen dat die bewust is; het herschrijft deze niet.

<Note>
GPT-5.5 is beschikbaar via zowel directe OpenAI Platform API-sleuteltoegang als
abonnements-/OAuth-routes. Voor een ChatGPT/Codex-abonnement plus native Codex-
uitvoering gebruik je `openai/gpt-5.5` met `agentRuntime.id: "codex"`. Gebruik
`openai-codex/gpt-5.5` alleen voor Codex OAuth via PI, of `openai/gpt-5.5`
zonder Codex-runtime-override voor direct `OPENAI_API_KEY`-verkeer.
</Note>

<Note>
Het inschakelen van de OpenAI-plugin, of het selecteren van een `openai-codex/*`-model,
schakelt de meegeleverde Codex app-server-plugin niet in. OpenClaw schakelt die plugin alleen
in wanneer je expliciet de native Codex-harness selecteert met
`agentRuntime.id: "codex"` of een verouderde `codex/*`-modelreferentie gebruikt.
Als de meegeleverde `codex` plugin is ingeschakeld maar `openai-codex/*` nog steeds via PI
wordt opgelost, waarschuwt `openclaw doctor` en laat het de route ongewijzigd.
</Note>

## OpenClaw-functiedekking

| OpenAI-mogelijkheid       | OpenClaw-oppervlak                                        | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>`-modelprovider                            | Ja                                                     |
| Codex-abonnementsmodellen | `openai-codex/<model>` met `openai-codex` OAuth           | Ja                                                     |
| Codex app-server-harness  | `openai/<model>` met `agentRuntime.id: codex`             | Ja                                                     |
| Webzoekfunctie aan serverzijde | Native OpenAI Responses-tool                         | Ja, wanneer webzoekfunctie is ingeschakeld en er geen provider is vastgezet |
| Afbeeldingen              | `image_generate`                                           | Ja                                                     |
| Video's                   | `video_generate`                                           | Ja                                                     |
| Tekst-naar-spraak         | `messages.tts.provider: "openai"` / `tts`                  | Ja                                                     |
| Batchspraak-naar-tekst    | `tools.media.audio` / mediabegrip                          | Ja                                                     |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "openai"`                | Ja                                                     |
| Realtime spraak           | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ja                                                     |
| Embeddings                | provider voor geheugen-embeddings                         | Ja                                                     |

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

Voor OpenAI-compatibele eindpunten die asymmetrische embeddinglabels vereisen, stel je
`queryInputType` en `documentInputType` in onder `memorySearch`. OpenClaw stuurt
deze door als providerspecifieke `input_type`-aanvraagvelden: query-embeddings gebruiken
`queryInputType`; geïndexeerde geheugenfragmenten en batchindexering gebruiken
`documentInputType`. Zie de [referentie voor geheugenconfiguratie](/nl/reference/memory-config#provider-specific-config) voor het volledige voorbeeld.

## Aan de slag

Kies je gewenste authenticatiemethode en volg de installatiestappen.

<Tabs>
  <Tab title="API-sleutel (OpenAI Platform)">
    **Beste voor:** directe API-toegang en facturering op basis van gebruik.

    <Steps>
      <Step title="Haal je API-sleutel op">
        Maak of kopieer een API-sleutel vanuit het [OpenAI Platform-dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Voer onboarding uit">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Of geef de sleutel rechtstreeks door:

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

    | Modelreferentie        | Runtimeconfiguratie       | Route                       | Authenticatie    |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | weggelaten / `agentRuntime.id: "pi"` | Directe OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | weggelaten / `agentRuntime.id: "pi"` | Directe OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex app-server-harness    | Codex app-server |

    <Note>
    `openai/*` is de directe OpenAI API-sleutelroute, tenzij je expliciet de
    Codex app-server-harness afdwingt. Gebruik `openai-codex/*` voor Codex OAuth via
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
    OpenClaw stelt `openai/gpt-5.3-codex-spark` **niet** beschikbaar. Live OpenAI API-aanvragen weigeren dat model, en de huidige Codex-catalogus stelt het ook niet beschikbaar.
    </Warning>

  </Tab>

  <Tab title="Codex-abonnement">
    **Beste voor:** het gebruiken van je ChatGPT/Codex-abonnement met native Codex app-server-uitvoering in plaats van een aparte API-sleutel. Codex-cloud vereist ChatGPT-aanmelding.

    <Steps>
      <Step title="Voer Codex OAuth uit">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Of voer OAuth rechtstreeks uit:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Voeg voor headless setups of setups die callbackproblemen geven `--device-code` toe om je aan te melden met een ChatGPT-device-code-flow in plaats van de localhost-browsercallback:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Gebruik de native Codex-runtime">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex","fallback":"none"}' --strict-json
        ```
      </Step>
      <Step title="Controleer of Codex-authenticatie beschikbaar is">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Nadat de Gateway draait, stuur je `/codex status` of `/codex models`
        in de chat om de native app-server-runtime te controleren.
      </Step>
    </Steps>

    ### Routesamenvatting

    | Modelreferentie | Runtimeconfiguratie | Route | Authenticatie |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Native Codex app-server-harness | Codex-aanmelding of geselecteerd `openai-codex`-profiel |
    | `openai-codex/gpt-5.5` | weggelaten / `runtime: "pi"` | ChatGPT/Codex OAuth via PI | Codex-aanmelding |
    | `openai-codex/gpt-5.4-mini` | weggelaten / `runtime: "pi"` | ChatGPT/Codex OAuth via PI | Codex-aanmelding |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Nog steeds PI, tenzij een plugin expliciet `openai-codex` claimt | Codex-aanmelding |

    <Note>
    Blijf de provider-id `openai-codex` gebruiken voor auth-/profielopdrachten. Het
    modelprefix `openai-codex/*` is ook de expliciete PI-route voor Codex OAuth.
    Het selecteert of activeert de gebundelde Codex app-server-harness niet automatisch. Voor
    de gangbare configuratie met abonnement plus native runtime meldt u zich aan met
    `openai-codex`, maar houdt u de modelreferentie op `openai/gpt-5.5` en stelt u
    `agentRuntime.id: "codex"` in.
    </Note>

    ### Configuratievoorbeeld

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    Om Codex OAuth in plaats daarvan op de normale PI-runner te houden, gebruikt u
    `openai-codex/gpt-5.5` en laat u de Codex-runtime-override weg.

    <Note>
    Onboarding importeert geen OAuth-materiaal meer uit `~/.codex`. Meld u aan met browser-OAuth (standaard) of de device-code-flow hierboven — OpenClaw beheert de resulterende aanmeldgegevens in zijn eigen auth-opslag voor agents.
    </Note>

    ### Statusindicator

    Chat `/status` toont welke modelruntime actief is voor de huidige sessie.
    De standaard PI-harness wordt weergegeven als `Runtime: OpenClaw Pi Default`. Wanneer de
    gebundelde Codex app-server-harness is geselecteerd, toont `/status`
    `Runtime: OpenAI Codex`. Bestaande sessies behouden hun vastgelegde harness-id, dus gebruik
    `/new` of `/reset` nadat u `agentRuntime` hebt gewijzigd als u wilt dat `/status`
    een nieuwe PI-/Codex-keuze weergeeft.

    ### Doctor-waarschuwing

    Als de gebundelde Plugin `codex` is ingeschakeld terwijl een `openai-codex/*`-route is
    geselecteerd, waarschuwt `openclaw doctor` dat het model nog steeds via PI wordt opgelost.
    Laat de configuratie alleen ongewijzigd wanneer die PI-route met abonnementsauth
    bedoeld is. Schakel over naar `openai/<model>` plus `agentRuntime.id: "codex"` wanneer
    u native uitvoering via de Codex app-server wilt.

    ### Limiet voor contextvenster

    OpenClaw behandelt modelmetadata en de runtime-contextlimiet als afzonderlijke waarden.

    Voor `openai-codex/gpt-5.5` via Codex OAuth:

    - Native `contextWindow`: `1000000`
    - Standaard runtime-`contextTokens`-limiet: `272000`

    De kleinere standaardlimiet heeft in de praktijk betere latency- en kwaliteitskenmerken. Overschrijf deze met `contextTokens`:

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

    OpenClaw gebruikt upstream Codex-catalogusmetadata voor `gpt-5.5` wanneer die
    aanwezig zijn. Als live Codex-detectie de rij `openai-codex/gpt-5.5` weglaat terwijl
    het account is geauthenticeerd, synthetiseert OpenClaw die OAuth-modelrij zodat
    cron-, sub-agent- en geconfigureerde standaardmodeluitvoeringen niet mislukken met
    `Unknown model`.

  </Tab>
</Tabs>

## Native Codex app-server-auth

De native Codex app-server-harness gebruikt `openai/*`-modelreferenties plus
`agentRuntime.id: "codex"`, maar de auth is nog steeds accountgebaseerd. OpenClaw
selecteert auth in deze volgorde:

1. Een expliciet OpenClaw `openai-codex`-authprofiel dat aan de agent is gekoppeld.
2. Het bestaande account van de app-server, zoals een lokale Codex CLI ChatGPT-aanmelding.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer de app-server geen account rapporteert en nog steeds
   OpenAI-auth vereist.

Dat betekent dat een lokale ChatGPT-/Codex-abonnementsaanmelding niet wordt vervangen alleen
omdat het gatewayproces ook `OPENAI_API_KEY` heeft voor directe OpenAI-modellen
of embeddings. Env-API-key-fallback is alleen het lokale stdio-pad zonder account; deze
wordt niet naar WebSocket-app-serververbindingen verzonden. Wanneer een Codex-profiel
in abonnementsstijl is geselecteerd, houdt OpenClaw ook `CODEX_API_KEY` en `OPENAI_API_KEY`
uit het gespawnde stdio-app-server-kindproces en verzendt het de geselecteerde aanmeldgegevens
via de login-RPC van de app-server.

## Afbeeldingsgeneratie

De gebundelde `openai`-Plugin registreert afbeeldingsgeneratie via de tool `image_generate`.
Deze ondersteunt zowel afbeeldingsgeneratie met een OpenAI API-key als afbeeldingsgeneratie met
Codex OAuth via dezelfde modelreferentie `openai/gpt-image-2`.

| Mogelijkheid             | OpenAI API-key                    | Codex OAuth                         |
| ------------------------ | --------------------------------- | ----------------------------------- |
| Modelreferentie          | `openai/gpt-image-2`              | `openai/gpt-image-2`                |
| Auth                     | `OPENAI_API_KEY`                  | OpenAI Codex OAuth-aanmelding       |
| Transport                | OpenAI Images API                 | Codex Responses-backend             |
| Max. afbeeldingen per verzoek | 4                             | 4                                   |
| Bewerkmodus              | Ingeschakeld (tot 5 referentieafbeeldingen) | Ingeschakeld (tot 5 referentieafbeeldingen) |
| Grootte-overschrijvingen | Ondersteund, inclusief 2K-/4K-groottes | Ondersteund, inclusief 2K-/4K-groottes |
| Beeldverhouding / resolutie | Niet doorgestuurd naar OpenAI Images API | Waar veilig toegewezen aan een ondersteunde grootte |

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
Zie [Afbeeldingsgeneratie](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

`gpt-image-2` is de standaard voor zowel OpenAI-tekst-naar-afbeelding-generatie als afbeeldingsbewerking. `gpt-image-1.5`, `gpt-image-1` en `gpt-image-1-mini` blijven bruikbaar als expliciete model-overschrijvingen. Gebruik `openai/gpt-image-1.5` voor PNG-/WebP-uitvoer met transparante achtergrond; de huidige `gpt-image-2`-API weigert `background: "transparent"`.

Voor een verzoek met transparante achtergrond moeten agents `image_generate` aanroepen met
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` of `"webp"`, en
`background: "transparent"`; de oudere provideroptie `openai.background` wordt
nog steeds geaccepteerd. OpenClaw beschermt ook de publieke OpenAI- en
OpenAI Codex OAuth-routes door standaard transparantieverzoeken voor `openai/gpt-image-2`
te herschrijven naar `gpt-image-1.5`; Azure en aangepaste OpenAI-compatibele eindpunten behouden
hun geconfigureerde deployment-/modelnamen.

Dezelfde instelling is beschikbaar voor headless CLI-uitvoeringen:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Gebruik dezelfde vlaggen `--output-format` en `--background` met
`openclaw infer image edit` wanneer u begint vanaf een invoerbestand.
`--openai-background` blijft beschikbaar als OpenAI-specifieke alias.

Voor Codex OAuth-installaties behoudt u dezelfde referentie `openai/gpt-image-2`. Wanneer een
`openai-codex`-OAuth-profiel is geconfigureerd, lost OpenClaw dat opgeslagen OAuth-
toegangstoken op en verzendt het afbeeldingsverzoeken via de Codex Responses-backend. Het
probeert niet eerst `OPENAI_API_KEY` en valt voor dat verzoek ook niet stilzwijgend terug op een API-key.
Configureer `models.providers.openai` expliciet met een API-key,
aangepaste basis-URL of Azure-eindpunt wanneer u in plaats daarvan de directe OpenAI Images API-
route wilt.
Als dat aangepaste afbeeldingseindpunt zich op een vertrouwd LAN-/privéadres bevindt, stel dan ook
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in; OpenClaw houdt
private/interne OpenAI-compatibele afbeeldingseindpunten geblokkeerd tenzij deze opt-in
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

## Videogeneratie

De gebundelde `openai`-Plugin registreert videogeneratie via de tool `video_generate`.

| Mogelijkheid      | Waarde                                                                            |
| ----------------- | --------------------------------------------------------------------------------- |
| Standaardmodel    | `openai/sora-2`                                                                   |
| Modi              | Tekst-naar-video, afbeelding-naar-video, enkelvoudige videobewerking              |
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
Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

## GPT-5-promptbijdrage

OpenClaw voegt een gedeelde GPT-5-promptbijdrage toe voor uitvoeringen met de GPT-5-familie bij providers. Deze wordt toegepast op basis van model-id, dus `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` en andere compatibele GPT-5-referenties krijgen dezelfde overlay. Oudere GPT-4.x-modellen niet.

De gebundelde native Codex-harness gebruikt hetzelfde GPT-5-gedrag en dezelfde Heartbeat-overlay via ontwikkelaarsinstructies van de Codex app-server, dus `openai/gpt-5.x`-sessies die via `agentRuntime.id: "codex"` worden afgedwongen, behouden dezelfde follow-through en proactieve Heartbeat-richtlijnen, ook al beheert Codex de rest van de harnessprompt.

De GPT-5-bijdrage voegt een getagd gedragscontract toe voor persona-persistentie, uitvoeringsveiligheid, tooldiscipline, uitvoervorm, voltooiingscontroles en verificatie. Kanaalspecifiek antwoordgedrag en gedrag voor stille berichten blijven in de gedeelde OpenClaw-systeemprompt en het beleid voor uitgaande levering. De GPT-5-richtlijnen zijn altijd ingeschakeld voor overeenkomende modellen. De vriendelijke interactiestijllaag is afzonderlijk en configureerbaar.

| Waarde                 | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (standaard) | Schakel de vriendelijke interactiestijllaag in |
| `"on"`                 | Alias voor `"friendly"`                     |
| `"off"`                | Schakel alleen de vriendelijke stijllaag uit |

<Tabs>
  <Tab title="Config">
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
Waarden zijn tijdens runtime niet hoofdlettergevoelig, dus zowel `"Off"` als `"off"` schakelen de vriendelijke stijllaag uit.
</Tip>

<Note>
Legacy `plugins.entries.openai.config.personality` wordt nog steeds gelezen als compatibiliteitsfallback wanneer de gedeelde instelling `agents.defaults.promptOverlays.gpt5.personality` niet is ingesteld.
</Note>

## Spraak en spraakuitvoer

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    De gebundelde `openai`-Plugin registreert spraaksynthese voor het oppervlak `messages.tts`.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stem | `messages.tts.providers.openai.voice` | `coral` |
    | Snelheid | `messages.tts.providers.openai.speed` | (niet ingesteld) |
    | Instructies | `messages.tts.providers.openai.instructions` | (niet ingesteld, alleen `gpt-4o-mini-tts`) |
    | Indeling | `messages.tts.providers.openai.responseFormat` | `opus` voor spraaknotities, `mp3` voor bestanden |
    | API-sleutel | `messages.tts.providers.openai.apiKey` | Valt terug op `OPENAI_API_KEY` |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Extra body | `messages.tts.providers.openai.extraBody` / `extra_body` | (niet ingesteld) |

    Beschikbare modellen: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Beschikbare stemmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wordt samengevoegd in de JSON van het `/audio/speech`-verzoek na de door OpenClaw gegenereerde velden, dus gebruik dit voor OpenAI-compatibele eindpunten die extra sleutels zoals `lang` vereisen. Prototype-sleutels worden genegeerd.

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
    Stel `OPENAI_TTS_BASE_URL` in om de TTS-basis-URL te overschrijven zonder het chat-API-eindpunt te beïnvloeden.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    De gebundelde `openai`-Plugin registreert batch-spraak-naar-tekst via
    OpenClaw's transcriptie-oppervlak voor mediabegrip.

    - Standaardmodel: `gpt-4o-transcribe`
    - Eindpunt: OpenAI REST `/v1/audio/transcriptions`
    - Invoerpad: multipart-upload van audiobestand
    - Ondersteund door OpenClaw overal waar transcriptie van inkomende audio
      `tools.media.audio` gebruikt, inclusief Discord-spraakkanaalsegmenten en
      audiobijlagen van kanalen

    Om OpenAI af te dwingen voor transcriptie van inkomende audio:

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
    gedeelde audiomediaconfiguratie of per-call transcriptieverzoek.

  </Accordion>

  <Accordion title="Realtime transcription">
    De gebundelde `openai`-Plugin registreert realtime transcriptie voor de Voice Call-Plugin.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Taal | `...openai.language` | (niet ingesteld) |
    | Prompt | `...openai.prompt` | (niet ingesteld) |
    | Stilteduur | `...openai.silenceDurationMs` | `800` |
    | VAD-drempel | `...openai.vadThreshold` | `0.5` |
    | API-sleutel | `...openai.apiKey` | Valt terug op `OPENAI_API_KEY` |

    <Note>
    Gebruikt een WebSocket-verbinding met `wss://api.openai.com/v1/realtime` met G.711 u-law (`g711_ulaw` / `audio/pcmu`)-audio. Deze streamingprovider is bedoeld voor het realtime transcriptiepad van Voice Call; Discord-spraak neemt momenteel korte segmenten op en gebruikt in plaats daarvan het batch-transcriptiepad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    De gebundelde `openai`-Plugin registreert realtime spraak voor de Voice Call-Plugin.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stem | `...openai.voice` | `alloy` |
    | Temperatuur | `...openai.temperature` | `0.8` |
    | VAD-drempel | `...openai.vadThreshold` | `0.5` |
    | Stilteduur | `...openai.silenceDurationMs` | `500` |
    | API-sleutel | `...openai.apiKey` | Valt terug op `OPENAI_API_KEY` |

    <Note>
    Ondersteunt Azure OpenAI via de configuratiesleutels `azureEndpoint` en `azureDeployment` voor realtime bridges in de backend. Ondersteunt bidirectionele toolaanroepen. Gebruikt het audioformaat G.711 u-law.
    </Note>

    <Note>
    Control UI Talk gebruikt OpenAI browser-realtime sessies met een door de Gateway uitgegeven
    tijdelijke client-secret en een directe browser-WebRTC SDP-uitwisseling met de
    OpenAI Realtime API. Live verificatie door maintainers is beschikbaar met
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    het OpenAI-deel geeft een client-secret uit in Node, genereert een browser-SDP-aanbod
    met nep-microfoonmedia, plaatst dit bij OpenAI en past het SDP-antwoord toe
    zonder geheimen te loggen.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-eindpunten

De gebundelde `openai`-provider kan een Azure OpenAI-resource gebruiken voor het genereren van afbeeldingen
door de basis-URL te overschrijven. Op het pad voor afbeeldingsgeneratie detecteert OpenClaw
Azure-hostnamen op `models.providers.openai.baseUrl` en schakelt het automatisch over naar
de verzoekstructuur van Azure.

<Note>
Realtime spraak gebruikt een apart configuratiepad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
en wordt niet beïnvloed door `models.providers.openai.baseUrl`. Zie de accordion **Realtime
voice** onder [Spraak en audio](#voice-and-speech) voor de Azure-instellingen.
</Note>

Gebruik Azure OpenAI wanneer:

- Je al een Azure OpenAI-abonnement, quotum of enterprise-overeenkomst hebt
- Je regionale data residency of compliance-controls nodig hebt die Azure biedt
- Je verkeer binnen een bestaande Azure-tenancy wilt houden

### Configuratie

Voor Azure-afbeeldingsgeneratie via de gebundelde `openai`-provider wijs je
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

- Verzendt de header `api-key` in plaats van `Authorization: Bearer`
- Gebruikt deployment-scoped paden (`/openai/deployments/{deployment}/...`)
- Voegt `?api-version=...` toe aan elk verzoek
- Gebruikt een standaard aanvraagtime-out van 600 s voor Azure-aanroepen voor afbeeldingsgeneratie.
  Per-call `timeoutMs`-waarden overschrijven deze standaardwaarde nog steeds.

Andere basis-URL's (publieke OpenAI, OpenAI-compatibele proxy's) behouden de standaard
OpenAI-verzoekstructuur voor afbeeldingen.

<Note>
Azure-routing voor het pad voor afbeeldingsgeneratie van de `openai`-provider vereist
OpenClaw 2026.4.22 of later. Eerdere versies behandelen elke aangepaste
`openai.baseUrl` zoals het publieke OpenAI-eindpunt en zullen falen tegen Azure
image-deployments.
</Note>

### API-versie

Stel `AZURE_OPENAI_API_VERSION` in om een specifieke Azure preview- of GA-versie
vast te zetten voor het Azure-pad voor afbeeldingsgeneratie:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

De standaardwaarde is `2024-12-01-preview` wanneer de variabele niet is ingesteld.

### Modelnamen zijn deploymentnamen

Azure OpenAI koppelt modellen aan deployments. Voor Azure-verzoeken voor afbeeldingsgeneratie
die via de gebundelde `openai`-provider worden gerouteerd, moet het veld `model` in OpenClaw
de **Azure-deploymentnaam** zijn die je in de Azure-portal hebt geconfigureerd, niet
de publieke OpenAI-model-id.

Als je een deployment maakt met de naam `gpt-image-2-prod` die `gpt-image-2` aanbiedt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dezelfde regel voor deploymentnamen geldt voor aanroepen voor afbeeldingsgeneratie die via
de gebundelde `openai`-provider worden gerouteerd.

### Regionale beschikbaarheid

Azure-afbeeldingsgeneratie is momenteel alleen beschikbaar in een subset van regio's
(bijvoorbeeld `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controleer de actuele regiolijst van Microsoft voordat je een
deployment maakt, en bevestig dat het specifieke model in jouw regio wordt aangeboden.

### Parameterverschillen

Azure OpenAI en publiek OpenAI accepteren niet altijd dezelfde afbeeldingsparameters.
Azure kan opties weigeren die publiek OpenAI toestaat (bijvoorbeeld bepaalde
`background`-waarden op `gpt-image-2`) of ze alleen beschikbaar maken op specifieke modelversies.
Deze verschillen komen van Azure en het onderliggende model, niet van OpenClaw.
Als een Azure-verzoek mislukt met een validatiefout, controleer dan de
parameterset die door jouw specifieke deployment en API-versie wordt ondersteund in de
Azure-portal.

<Note>
Azure OpenAI gebruikt native transport en compat-gedrag, maar ontvangt niet
de verborgen attributieheaders van OpenClaw — zie de accordion **Native versus OpenAI-compatibele
routes** onder [Geavanceerde configuratie](#advanced-configuration).

Voor chat- of Responses-verkeer op Azure (naast afbeeldingsgeneratie) gebruik je de
onboardingflow of een specifieke Azure-providerconfiguratie — alleen `openai.baseUrl`
neemt de Azure API-/auth-structuur niet over. Er bestaat een aparte
`azure-openai-responses/*`-provider; zie
de accordion Server-side Compaction hieronder.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw gebruikt WebSocket-first met SSE-fallback (`"auto"`) voor zowel `openai/*` als `openai-codex/*`.

    In de modus `"auto"` doet OpenClaw het volgende:
    - Probeert één vroege WebSocket-fout opnieuw voordat wordt teruggevallen op SSE
    - Markeert WebSocket na een fout gedurende ongeveer 60 seconden als gedegradeerd en gebruikt SSE tijdens de cool-down
    - Voegt stabiele sessie- en turn-identiteitsheaders toe voor retries en reconnects
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
    - [Streaming API-responsen (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw schakelt WebSocket-warm-up standaard in voor `openai/*` en `openai-codex/*` om de latentie van de eerste turn te verminderen.

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

  <Accordion title="Fast mode">
    OpenClaw biedt een gedeelde fast-mode-schakelaar voor `openai/*` en `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuratie:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wanneer ingeschakeld koppelt OpenClaw fast mode aan OpenAI-prioriteitsverwerking (`service_tier = "priority"`). Bestaande `service_tier`-waarden blijven behouden, en fast mode herschrijft `reasoning` of `text.verbosity` niet.

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
    Sessie-overschrijvingen hebben voorrang op configuratie. Het wissen van de sessie-overschrijving in de Sessions UI zet de sessie terug naar de geconfigureerde standaard.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
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
    `serviceTier` wordt alleen doorgestuurd naar native OpenAI-eindpunten (`api.openai.com`) en native Codex-eindpunten (`chatgpt.com/backend-api`). Als u een van beide providers via een proxy routeert, laat OpenClaw `service_tier` ongemoeid.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Voor directe OpenAI Responses-modellen (`openai/*` op `api.openai.com`) schakelt de Pi-harness-streamwrapper van de OpenAI-Plugin automatisch server-side compaction in:

    - Forceert `store: true` (tenzij modelcompatibiliteit `supportsStore: false` instelt)
    - Injecteert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standaardwaarde voor `compact_threshold`: 70% van `contextWindow` (of `80000` wanneer niet beschikbaar)

    Dit geldt voor het ingebouwde Pi-harness-pad en voor OpenAI-providerhooks die door ingesloten runs worden gebruikt. De native Codex-app-server-harness beheert zijn eigen context via Codex en wordt apart geconfigureerd met `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Enable explicitly">
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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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
    `responsesServerCompaction` beheert alleen de injectie van `context_management`. Directe OpenAI Responses-modellen forceren nog steeds `store: true`, tenzij compatibiliteit `supportsStore: false` instelt.
    </Note>

  </Accordion>

  <Accordion title="Strikte agentische GPT-modus">
    Voor GPT-5-family-runs op `openai/*` kan OpenClaw een strikter ingebed uitvoeringscontract gebruiken:

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
    - Behandelt een alleen-plan-beurt niet langer als succesvolle voortgang wanneer een toolactie beschikbaar is
    - Probeert de beurt opnieuw met een act-now-sturing
    - Schakelt `update_plan` automatisch in voor omvangrijk werk
    - Toont een expliciete geblokkeerde status als het model blijft plannen zonder te handelen

    <Note>
    Alleen van toepassing op OpenAI- en Codex GPT-5-family-runs. Andere providers en oudere modelfamilies behouden het standaardgedrag.
    </Note>

  </Accordion>

  <Accordion title="Native versus OpenAI-compatibele routes">
    OpenClaw behandelt directe OpenAI-, Codex- en Azure OpenAI-eindpunten anders dan generieke OpenAI-compatibele `/v1`-proxy's:

    **Native routes** (`openai/*`, Azure OpenAI):
    - Behouden `reasoning: { effort: "none" }` alleen voor modellen die de OpenAI-waarde `none` voor effort ondersteunen
    - Laten uitgeschakelde reasoning weg voor modellen of proxy's die `reasoning.effort: "none"` weigeren
    - Stellen toolschema's standaard in op strikte modus
    - Voegen verborgen attributieheaders alleen toe op geverifieerde native hosts
    - Behouden OpenAI-specifieke aanvraagvorming (`service_tier`, `store`, reasoning-compat, prompt-cache hints)

    **Proxy-/compatibele routes:**
    - Gebruiken soepeler compatgedrag
    - Verwijderen Completions `store` uit niet-native `openai-completions`-payloads
    - Accepteren geavanceerde `params.extra_body`/`params.extraBody` pass-through JSON voor OpenAI-compatibele Completions-proxy's
    - Accepteren `params.chat_template_kwargs` voor OpenAI-compatibele Completions-proxy's zoals vLLM
    - Dwingen geen strikte toolschema's of alleen-native headers af

    Azure OpenAI gebruikt native transport en compatgedrag, maar ontvangt de verborgen attributieheaders niet.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor afbeeldingstools en providerselectie.
  </Card>
  <Card title="Video's genereren" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="OAuth en auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
