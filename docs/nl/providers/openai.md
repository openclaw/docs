---
read_when:
    - Je wilt OpenAI-modellen gebruiken in OpenClaw
    - Je wilt Codex-abonnementsauthenticatie in plaats van API-sleutels
    - Je hebt strikter uitvoeringsgedrag voor GPT-5-agenten nodig
summary: OpenAI in OpenClaw gebruiken via API-sleutels of een Codex-abonnement
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:25:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI biedt ontwikkelaars-API's voor GPT-modellen, en Codex is ook beschikbaar als
ChatGPT-abonnement-coding agent via OpenAI's Codex-clients. OpenClaw houdt die
oppervlakken gescheiden zodat configuratie voorspelbaar blijft.

OpenClaw gebruikt `openai/*` als de canonieke OpenAI-modelroute. Ingebedde
agentbeurten op OpenAI-modellen lopen standaard via de native Codex app-server-runtime;
directe OpenAI API-sleutel-authenticatie blijft beschikbaar voor niet-agent-OpenAI-
oppervlakken zoals afbeeldingen, embeddings, spraak en realtime.

- **Agentmodellen** - `openai/*`-modellen via de Codex-runtime; meld je aan met
  `openai-codex`-auth voor ChatGPT/Codex-abonnementsgebruik, of configureer een
  `openai-codex` API-sleutelprofiel wanneer je bewust API-sleutel-authenticatie wilt.
- **Niet-agent-OpenAI-API's** - directe OpenAI Platform-toegang met gebruiksgebaseerde
  facturering via `OPENAI_API_KEY` of OpenAI API-sleutel-onboarding.
- **Verouderde configuratie** - `openai-codex/*`-modelrefs worden door
  `openclaw doctor --fix` gerepareerd naar `openai/*` plus de Codex-runtime.

OpenAI ondersteunt expliciet OAuth-gebruik met abonnementen in externe tools en workflows zoals OpenClaw.

Provider, model, runtime en kanaal zijn afzonderlijke lagen. Als die labels door
elkaar raken, lees dan [Agentruntimes](/nl/concepts/agent-runtimes) voordat je
configuratie wijzigt.

## Snelle keuze

| Doel                                                 | Gebruik                                                 | Opmerkingen                                                            |
| ---------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime    | `openai/gpt-5.5`                                        | Standaard OpenAI-agentconfiguratie. Meld je aan met `openai-codex`-auth. |
| Directe API-sleutelfacturering voor agentmodellen    | `openai/gpt-5.5` plus een `openai-codex` API-sleutelprofiel | Gebruik `auth.order.openai-codex` om dat profiel te verkiezen.        |
| Directe API-sleutelfacturering via expliciete PI     | `openai/gpt-5.5` plus `agentRuntime.id: "pi"`           | Selecteer een normaal `openai` API-sleutelprofiel.                     |
| Nieuwste ChatGPT Instant API-alias                   | `openai/chat-latest`                                    | Alleen directe API-sleutel. Bewegende alias voor experimenten, niet de standaard. |
| ChatGPT/Codex-abonnementsauthenticatie via expliciete PI | `openai/gpt-5.5` plus `agentRuntime.id: "pi"`       | Selecteer een `openai-codex`-authprofiel voor de compatibiliteitsroute. |
| Afbeeldingen genereren of bewerken                   | `openai/gpt-image-2`                                    | Werkt met zowel `OPENAI_API_KEY` als OpenAI Codex OAuth.               |
| Afbeeldingen met transparante achtergrond            | `openai/gpt-image-1.5`                                  | Gebruik `outputFormat=png` of `webp` en `openai.background=transparent`. |

## Namenkaart

De namen lijken op elkaar, maar zijn niet uitwisselbaar:

| Naam die je ziet                   | Laag                | Betekenis                                                                                         |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Providerprefix      | Canonieke OpenAI-modelroute; agentbeurten gebruiken de Codex-runtime.                             |
| `openai-codex`                     | Auth-/profielprefix | OpenAI Codex OAuth-/abonnementsauthenticatieprofielprovider.                                      |
| `codex` plugin                     | Plugin              | Gebundelde OpenClaw-Plugin die native Codex app-server-runtime en `/codex`-chatbediening biedt.   |
| `agentRuntime.id: codex`           | Agentruntime        | Forceer de native Codex app-server-harness voor ingebedde beurten.                                |
| `/codex ...`                       | Chatcommandoset     | Bind/beheer Codex app-server-threads vanuit een gesprek.                                          |
| `runtime: "acp", agentId: "codex"` | ACP-sessieroute     | Expliciet fallbackpad dat Codex via ACP/acpx uitvoert.                                            |

Dit betekent dat een configuratie bewust zowel `openai/*`-modelrefs als
`openai-codex`-authprofielen kan bevatten. `openclaw doctor --fix` herschrijft
verouderde `openai-codex/*`-modelrefs naar de canonieke OpenAI-modelroute.

<Note>
GPT-5.5 is beschikbaar via zowel directe OpenAI Platform API-sleuteltoegang als
abonnements-/OAuth-routes. Gebruik voor ChatGPT/Codex-abonnement plus native Codex-
uitvoering `openai/gpt-5.5`; niet-ingestelde runtimeconfiguratie selecteert nu de
Codex-harness voor OpenAI-agentbeurten. Gebruik OpenAI API-sleutelprofielen alleen
wanneer je directe API-sleutel-authenticatie wilt voor een OpenAI-agentmodel.
</Note>

<Note>
OpenAI-agentmodelbeurten vereisen de gebundelde Codex app-server-Plugin. Expliciete
PI-runtimeconfiguratie blijft beschikbaar als opt-in compatibiliteitsroute. Wanneer PI
expliciet wordt geselecteerd met een `openai-codex`-authprofiel, behoudt OpenClaw de
publieke modelref als `openai/*` en routeert PI intern via het verouderde
Codex-auth-transport. Voer `openclaw doctor --fix` uit om verouderde
`openai-codex/*`-modelrefs of oude PI-sessiepins te repareren die niet uit
expliciete runtimeconfiguratie komen.
</Note>

## OpenClaw-functiedekking

| OpenAI-mogelijkheid       | OpenClaw-oppervlak                                               | Status                                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>`-modelprovider                                    | Ja                                                     |
| Codex-abonnementsmodellen | `openai/<model>` met `openai-codex` OAuth                         | Ja                                                     |
| Verouderde Codex-modelrefs | `openai-codex/<model>`                                           | Door doctor gerepareerd naar `openai/<model>`          |
| Codex app-server-harness  | `openai/<model>` met weggelaten runtime of `agentRuntime.id: codex` | Ja                                                   |
| Server-side webzoekfunctie | Native OpenAI Responses-tool                                     | Ja, wanneer webzoekfunctie is ingeschakeld en geen provider is vastgezet |
| Afbeeldingen              | `image_generate`                                                  | Ja                                                     |
| Video's                   | `video_generate`                                                  | Ja                                                     |
| Tekst-naar-spraak         | `messages.tts.provider: "openai"` / `tts`                         | Ja                                                     |
| Batch-spraak-naar-tekst   | `tools.media.audio` / mediabegrip                                 | Ja                                                     |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "openai"`                       | Ja                                                     |
| Realtime spraak           | Voice Call `realtime.provider: "openai"` / Control UI Talk        | Ja                                                     |
| Embeddings                | provider voor geheugenembeddings                                  | Ja                                                     |

## Geheugenembeddings

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
die door als providerspecifieke `input_type`-aanvraagvelden: query-embeddings gebruiken
`queryInputType`; geindexeerde geheugenfragmenten en batchindexering gebruiken
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

    | Modelref              | Runtimeconfiguratie       | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitted / `agentRuntime.id: "codex"` | Codex app-server-harness | `openai-codex`-profiel |
    | `openai/gpt-5.4-mini` | omitted / `agentRuntime.id: "codex"` | Codex app-server-harness | `openai-codex`-profiel |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | PI-ingebedde runtime      | `openai`-profiel of geselecteerd `openai-codex`-profiel |

    <Note>
    `openai/*`-agentmodellen gebruiken de Codex app-server-harness. Om API-sleutel-
    authenticatie voor een agentmodel te gebruiken, maak je een `openai-codex` API-sleutelprofiel
    en orden je dit met `auth.order.openai-codex`; `OPENAI_API_KEY` blijft de directe
    fallback voor niet-agent-OpenAI-API-oppervlakken.
    </Note>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Om ChatGPT's huidige Instant-model vanuit de OpenAI API te proberen, stel je het model
    in op `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` is een bewegende alias. OpenAI documenteert dit als het nieuwste Instant-
    model dat in ChatGPT wordt gebruikt en beveelt `gpt-5.5` aan voor productiegebruik van de API, dus
    behoud `openai/gpt-5.5` als stabiele standaard tenzij je dat aliasgedrag expliciet wilt.
    De alias accepteert momenteel alleen `medium`-tekstuitvoerigheid, dus OpenClaw normaliseert
    incompatibele OpenAI-overschrijvingen voor tekstuitvoerigheid voor dit model.

    <Warning>
    OpenClaw biedt **geen** `openai/gpt-5.3-codex-spark`. Live OpenAI API-aanvragen wijzen dat model af, en de huidige Codex-catalogus biedt het ook niet.
    </Warning>

  </Tab>

  <Tab title="Codex-abonnement">
    **Beste voor:** je ChatGPT/Codex-abonnement gebruiken met native Codex app-server-uitvoering in plaats van een afzonderlijke API-sleutel. Codex-cloud vereist ChatGPT-aanmelding.

    <Steps>
      <Step title="Voer Codex OAuth uit">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Of voer OAuth direct uit:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Voeg voor headless of callback-onvriendelijke setups `--device-code` toe om je aan te melden met een ChatGPT-device-code-flow in plaats van de localhost-browsercallback:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Gebruik de canonieke OpenAI-modelroute">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Geen runtime-configuratie is vereist voor het standaardpad. OpenAI-agentbeurten
        selecteren automatisch de native Codex app-server-runtime, en OpenClaw
        installeert of herstelt de gebundelde Codex-plugin wanneer deze route wordt gekozen.
      </Step>
      <Step title="Controleer of Codex-authenticatie beschikbaar is">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Nadat de gateway actief is, stuur je `/codex status` of `/codex models`
        in de chat om de native app-server-runtime te controleren.
      </Step>
    </Steps>

    ### Routesamenvatting

    | Modelverwijzing | Runtime-configuratie | Route | Authenticatie |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | weggelaten / `agentRuntime.id: "codex"` | Native Codex app-server-harnas | Codex-aanmelding of geselecteerd `openai-codex`-profiel |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | PI-ingebedde runtime met intern Codex-auth-transport | Geselecteerd `openai-codex`-profiel |
    | `openai-codex/gpt-5.5` | hersteld door doctor | Legacy-route herschreven naar `openai/gpt-5.5` | Bestaand `openai-codex`-profiel |

    <Warning>
    Configureer geen oudere `openai-codex/gpt-5.1*`-, `openai-codex/gpt-5.2*`- of
    `openai-codex/gpt-5.3*`-modelverwijzingen. ChatGPT/Codex OAuth-accounts weigeren
    die modellen nu. Gebruik `openai/gpt-5.5`; OpenAI-agentbeurten selecteren nu standaard de Codex-
    runtime.
    </Warning>

    <Note>
    Blijf de provider-id `openai-codex` gebruiken voor auth-/profielopdrachten. Het
    modelvoorvoegsel `openai-codex/*` is legacy-configuratie die door doctor wordt hersteld. Voor de
    gebruikelijke setup met abonnement plus native runtime meld je je aan met `openai-codex`,
    maar houd je de modelverwijzing op `openai/gpt-5.5`.
    </Note>

    ### Configuratievoorbeeld

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    <Note>
    Onboarding importeert niet langer OAuth-materiaal uit `~/.codex`. Meld je aan met browser-OAuth (standaard) of de device-code-flow hierboven — OpenClaw beheert de resulterende inloggegevens in zijn eigen agent-auth-store.
    </Note>

    ### Codex OAuth-routering controleren en herstellen

    Gebruik deze opdrachten om te zien welk model, welke runtime en welke auth-route je standaard-
    agent gebruikt:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Voeg voor een specifieke agent `--agent <id>` toe:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Als een oudere configuratie nog steeds `openai-codex/gpt-*` of een verouderde OpenAI PI-
    sessiepin zonder expliciete runtime-configuratie bevat, herstel die dan:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Als `models auth list --provider openai-codex` geen bruikbaar profiel toont, meld je dan
    opnieuw aan:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` blijft de auth-/profielprovider-id. `openai/*` is de
    modelroute voor OpenAI-agentbeurten via Codex.

    ### Statusindicator

    Chat `/status` toont welke modelruntime actief is voor de huidige sessie.
    Het gebundelde Codex app-server-harnas verschijnt als `Runtime: OpenAI Codex` voor
    OpenAI-agentmodelbeurten. Verouderde PI-sessiepins worden hersteld naar Codex, tenzij
    de configuratie PI expliciet vastzet.

    ### Doctor-waarschuwing

    Als `openai-codex/*`-routes of verouderde OpenAI PI-pins in de configuratie of
    sessiestatus blijven staan, herschrijft `openclaw doctor --fix` ze naar `openai/*` met de
    Codex-runtime, tenzij PI expliciet is geconfigureerd.

    ### Limiet voor contextvenster

    OpenClaw behandelt modelmetadata en de runtime-contextlimiet als afzonderlijke waarden.

    Voor `openai/gpt-5.5` via de Codex OAuth-catalogus:

    - Native `contextWindow`: `1000000`
    - Standaard runtime-`contextTokens`-limiet: `272000`

    De kleinere standaardlimiet heeft in de praktijk betere eigenschappen voor latentie en kwaliteit. Overschrijf deze met `contextTokens`:

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
    aanwezig is. Als live Codex-discovery de `gpt-5.5`-rij weglaat terwijl
    het account is geauthenticeerd, synthetiseert OpenClaw die OAuth-modelrij zodat
    cron-, sub-agent- en geconfigureerde standaardmodelruns niet mislukken met
    `Unknown model`.

  </Tab>
</Tabs>

## Native Codex app-server-authenticatie

Het native Codex app-server-harnas gebruikt `openai/*`-modelverwijzingen plus weggelaten
runtime-configuratie of `agentRuntime.id: "codex"`, maar de authenticatie blijft
accountgebaseerd. OpenClaw
selecteert authenticatie in deze volgorde:

1. Een expliciet OpenClaw `openai-codex`-authprofiel dat aan de agent is gekoppeld.
2. Het bestaande account van de app-server, zoals een lokale Codex CLI ChatGPT-aanmelding.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer de app-server geen account rapporteert en nog steeds
   OpenAI-authenticatie vereist.

Dat betekent dat een lokale ChatGPT/Codex-abonnementsaanmelding niet wordt vervangen alleen
omdat het gatewayproces ook `OPENAI_API_KEY` heeft voor directe OpenAI-modellen
of embeddings. De fallback met env-API-sleutel is alleen het lokale stdio-pad zonder account; die
wordt niet naar WebSocket-app-serververbindingen gestuurd. Wanneer een abonnementachtig Codex-
profiel is geselecteerd, houdt OpenClaw ook `CODEX_API_KEY` en `OPENAI_API_KEY`
buiten het voortgebrachte stdio-app-server-childproces en stuurt het de geselecteerde inloggegevens
via de app-server-login-RPC.

## Afbeeldingen genereren

De gebundelde `openai`-plugin registreert afbeeldingsgeneratie via de tool `image_generate`.
Deze ondersteunt zowel afbeeldingsgeneratie met OpenAI API-sleutel als Codex OAuth-
afbeeldingsgeneratie via dezelfde `openai/gpt-image-2`-modelverwijzing.

| Mogelijkheid             | OpenAI API-sleutel                 | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modelverwijzing           | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authenticatie             | `OPENAI_API_KEY`                   | OpenAI Codex OAuth-aanmelding        |
| Transport                 | OpenAI Images API                  | Codex Responses-backend              |
| Max. afbeeldingen per verzoek | 4                              | 4                                    |
| Bewerkmodus               | Ingeschakeld (tot 5 referentieafbeeldingen) | Ingeschakeld (tot 5 referentieafbeeldingen) |
| Grootte-overschrijvingen  | Ondersteund, inclusief 2K/4K-groottes | Ondersteund, inclusief 2K/4K-groottes |
| Beeldverhouding / resolutie | Niet doorgestuurd naar OpenAI Images API | Toegewezen aan een ondersteunde grootte wanneer veilig |

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
expliciete modeloverschrijvingen. Gebruik `openai/gpt-image-1.5` voor PNG/WebP-uitvoer met
transparante achtergrond; de huidige `gpt-image-2`-API weigert
`background: "transparent"`.

Voor een verzoek met transparante achtergrond moeten agents `image_generate` aanroepen met
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` of `"webp"`, en
`background: "transparent"`; de oudere provideroptie `openai.background` wordt
nog steeds geaccepteerd. OpenClaw beschermt ook de openbare OpenAI- en
OpenAI Codex OAuth-routes door standaard `openai/gpt-image-2`-transparantieverzoeken
te herschrijven naar `gpt-image-1.5`; Azure en aangepaste OpenAI-compatibele endpoints behouden
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

Gebruik dezelfde flags `--output-format` en `--background` met
`openclaw infer image edit` wanneer je vanaf een invoerbestand begint.
`--openai-background` blijft beschikbaar als OpenAI-specifieke alias.

Houd voor Codex OAuth-installaties dezelfde `openai/gpt-image-2`-verwijzing aan. Wanneer een
`openai-codex` OAuth-profiel is geconfigureerd, lost OpenClaw dat opgeslagen OAuth-
toegangstoken op en stuurt het afbeeldingsverzoeken via de Codex Responses-backend. Het
probeert niet eerst `OPENAI_API_KEY` en valt voor dat verzoek niet stilzwijgend terug op een API-sleutel.
Configureer `models.providers.openai` expliciet met een API-sleutel,
aangepaste basis-URL of Azure-endpoint wanneer je in plaats daarvan de directe OpenAI Images API-
route wilt gebruiken.
Als dat aangepaste afbeeldingendpoint zich op een vertrouwd LAN-/privéadres bevindt, stel dan ook
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in; OpenClaw houdt
privé/interne OpenAI-compatibele afbeeldingendpoints geblokkeerd tenzij deze opt-in
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

De gebundelde `openai`-plugin registreert videogeneratie via de tool `video_generate`.

| Mogelijkheid      | Waarde                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
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

OpenClaw voegt een gedeelde GPT-5-promptbijdrage toe voor GPT-5-familieruns bij providers. Deze wordt toegepast op basis van model-id, zodat `openai/gpt-5.5`, legacyverwijzingen vóór herstel zoals `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` en andere compatibele GPT-5-verwijzingen dezelfde overlay krijgen. Oudere GPT-4.x-modellen niet.

Het gebundelde native Codex-harnas gebruikt hetzelfde GPT-5-gedrag en dezelfde Heartbeat-overlay via Codex app-server-ontwikkelaarsinstructies, zodat `openai/gpt-5.x`-sessies die via `agentRuntime.id: "codex"` worden afgedwongen dezelfde opvolgings- en proactieve Heartbeat-richtlijnen behouden, ook al beheert Codex de rest van de harnas-prompt.

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
Waarden zijn tijdens runtime hoofdletterongevoelig, dus `"Off"` en `"off"` schakelen beide de vriendelijke stijllaag uit.
</Tip>

<Note>
Verouderde `plugins.entries.openai.config.personality` wordt nog steeds gelezen als compatibiliteitsfallback wanneer de gedeelde instelling `agents.defaults.promptOverlays.gpt5.personality` niet is ingesteld.
</Note>

## Stem en spraak

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

    `extraBody` wordt samengevoegd in de JSON van de `/audio/speech`-aanvraag na de door OpenClaw gegenereerde velden, dus gebruik dit voor OpenAI-compatibele endpoints die extra sleutels zoals `lang` vereisen. Prototypesleutels worden genegeerd.

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

  <Accordion title="Speech-to-text">
    De gebundelde `openai`-Plugin registreert batch-spraak-naar-tekst via
    OpenClaw's transcriptieoppervlak voor mediabegrip.

    - Standaardmodel: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Invoerpad: upload van multipart-audiobestand
    - Ondersteund door OpenClaw overal waar transcriptie van inkomende audio
      `tools.media.audio` gebruikt, inclusief Discord-spraakkanaalsegmenten en
      audiobijlagen van kanalen

    Om OpenAI te forceren voor transcriptie van inkomende audio:

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

    Taal- en prompthints worden doorgestuurd naar OpenAI wanneer ze worden geleverd door de
    gedeelde audiomediaconfiguratie of per-call transcriptieaanvraag.

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
    Gebruikt een WebSocket-verbinding naar `wss://api.openai.com/v1/realtime` met G.711 u-law (`g711_ulaw` / `audio/pcmu`)-audio. Deze streamingprovider is voor het realtime transcriptiepad van Voice Call; Discord-spraak neemt momenteel korte segmenten op en gebruikt in plaats daarvan het batch-transcriptiepad `tools.media.audio`.
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
    Ondersteunt Azure OpenAI via de configuratiesleutels `azureEndpoint` en `azureDeployment` voor backend-realtimebruggen. Ondersteunt bidirectionele tool-calling. Gebruikt het G.711 u-law-audioformaat.
    </Note>

    <Note>
    Control UI Talk gebruikt OpenAI-browserrealtime-sessies met een door de Gateway
    gemaakte tijdelijke client secret en een directe browser-WebRTC SDP-uitwisseling met de
    OpenAI Realtime API. Live verificatie door maintainers is beschikbaar met
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    het OpenAI-deel maakt een client secret in Node, genereert een browser-SDP-aanbod
    met nep-microfoonmedia, post dit naar OpenAI en past het SDP-antwoord toe
    zonder geheimen te loggen.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-endpoints

De gebundelde `openai`-provider kan een Azure OpenAI-resource gebruiken voor het genereren van afbeeldingen
door de basis-URL te overschrijven. Op het pad voor afbeeldingsgeneratie detecteert OpenClaw
Azure-hostnamen op `models.providers.openai.baseUrl` en schakelt automatisch over naar
Azure's aanvraagvorm.

<Note>
Realtime spraak gebruikt een afzonderlijk configuratiepad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
en wordt niet beïnvloed door `models.providers.openai.baseUrl`. Zie de **Realtime
voice**-accordion onder [Stem en spraak](#voice-and-speech) voor de Azure-
instellingen.
</Note>

Gebruik Azure OpenAI wanneer:

- Je al een Azure OpenAI-abonnement, quotum of enterpriseovereenkomst hebt
- Je regionale dataresidentie of compliancecontroles nodig hebt die Azure biedt
- Je verkeer binnen een bestaande Azure-tenant wilt houden

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

OpenClaw herkent deze Azure-hostachtervoegsels voor de Azure-route voor afbeeldingsgeneratie:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Voor aanvragen voor afbeeldingsgeneratie op een herkende Azure-host doet OpenClaw het volgende:

- Verzendt de header `api-key` in plaats van `Authorization: Bearer`
- Gebruikt deployment-gescopete paden (`/openai/deployments/{deployment}/...`)
- Voegt `?api-version=...` toe aan elke aanvraag
- Gebruikt een standaard aanvraagtime-out van 600 s voor Azure-aanroepen voor afbeeldingsgeneratie.
  Per-call `timeoutMs`-waarden overschrijven deze standaard nog steeds.

Andere basis-URL's (publieke OpenAI, OpenAI-compatibele proxy's) behouden de standaard
OpenAI-aanvraagvorm voor afbeeldingen.

<Note>
Azure-routering voor het afbeeldingsgeneratiepad van de `openai`-provider vereist
OpenClaw 2026.4.22 of later. Eerdere versies behandelen elke aangepaste
`openai.baseUrl` zoals het publieke OpenAI-endpoint en zullen falen tegen Azure-
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

Azure OpenAI koppelt modellen aan deployments. Voor Azure-aanvragen voor afbeeldingsgeneratie
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
deployment maakt en bevestig dat het specifieke model in je regio wordt aangeboden.

### Parameterverschillen

Azure OpenAI en publieke OpenAI accepteren niet altijd dezelfde afbeeldingsparameters.
Azure kan opties weigeren die publieke OpenAI toestaat (bijvoorbeeld bepaalde
`background`-waarden op `gpt-image-2`) of ze alleen beschikbaar maken op specifieke modelversies.
Deze verschillen komen van Azure en het onderliggende model, niet van OpenClaw.
Als een Azure-aanvraag mislukt met een validatiefout, controleer dan de parameterset
die wordt ondersteund door je specifieke deployment en API-versie in de Azure-portal.

<Note>
Azure OpenAI gebruikt native transport en compatgedrag maar ontvangt niet
OpenClaw's verborgen attributieheaders — zie de **Native vs OpenAI-compatible
routes**-accordion onder [Geavanceerde configuratie](#advanced-configuration).

Voor chat- of Responses-verkeer op Azure (naast afbeeldingsgeneratie) gebruik je de
onboardingflow of een speciale Azure-providerconfiguratie — alleen `openai.baseUrl`
neemt de Azure API/auth-vorm niet over. Er bestaat een afzonderlijke
`azure-openai-responses/*`-provider; zie
de Server-side compaction-accordion hieronder.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw gebruikt eerst WebSocket met SSE-fallback (`"auto"`) voor `openai/*`.

    In de modus `"auto"` doet OpenClaw het volgende:
    - Probeert één vroege WebSocket-fout opnieuw voordat er wordt teruggevallen op SSE
    - Markeert WebSocket na een fout ongeveer 60 seconden als gedegradeerd en gebruikt SSE tijdens de afkoelperiode
    - Voegt stabiele headers voor sessie- en beurtidentiteit toe voor retries en reconnects
    - Normaliseert gebruikstellers (`input_tokens` / `prompt_tokens`) over transportvarianten heen

    | Waarde | Gedrag |
    |-------|----------|
    | `"auto"` (standaard) | Eerst WebSocket, SSE-fallback |
    | `"sse"` | Forceer alleen SSE |
    | `"websocket"` | Forceer alleen WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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

  <Accordion title="WebSocket-warm-up">
    OpenClaw schakelt WebSocket-warm-up standaard in voor `openai/*` om de latency van de eerste beurt te verlagen.

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
    OpenClaw biedt een gedeelde schakelaar voor snelle modus voor `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuratie:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wanneer ingeschakeld, koppelt OpenClaw de snelle modus aan OpenAI-prioriteitsverwerking (`service_tier = "priority"`). Bestaande `service_tier`-waarden blijven behouden, en de snelle modus herschrijft `reasoning` of `text.verbosity` niet.

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
    Sessie-overschrijvingen gaan voor configuratie. Door de sessie-overschrijving in de Sessions-UI te wissen, keert de sessie terug naar de geconfigureerde standaardwaarde.
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
    Voor directe OpenAI Responses-modellen (`openai/*` op `api.openai.com`) schakelt de Pi-harness-streamwrapper van de OpenAI-Plugin automatisch server-side Compaction in:

    - Forceert `store: true` (tenzij modelcompatibiliteit `supportsStore: false` instelt)
    - Injecteert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standaard `compact_threshold`: 70% van `contextWindow` (of `80000` wanneer niet beschikbaar)

    Dit is van toepassing op het ingebouwde Pi-harness-pad en op OpenAI-providerhooks die door embedded runs worden gebruikt. De native Codex-appserver-harness beheert zijn eigen context via Codex en wordt afzonderlijk geconfigureerd met `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` regelt alleen de injectie van `context_management`. Directe OpenAI Responses-modellen forceren nog steeds `store: true`, tenzij compatibiliteit `supportsStore: false` instelt.
    </Note>

  </Accordion>

  <Accordion title="Strikte agentische GPT-modus">
    Voor runs uit de GPT-5-familie op `openai/*` kan OpenClaw een strikter embedded uitvoeringscontract gebruiken:

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
    - Probeert de beurt opnieuw met act-now-sturing
    - Schakelt `update_plan` automatisch in voor substantieel werk
    - Toont een expliciete geblokkeerde status als het model blijft plannen zonder te handelen

    <Note>
    Alleen van toepassing op runs uit de OpenAI- en Codex GPT-5-familie. Andere providers en oudere modelfamilies behouden het standaardgedrag.
    </Note>

  </Accordion>

  <Accordion title="Native versus OpenAI-compatibele routes">
    OpenClaw behandelt directe OpenAI-, Codex- en Azure OpenAI-eindpunten anders dan generieke OpenAI-compatibele `/v1`-proxy's:

    **Native routes** (`openai/*`, Azure OpenAI):
    - Behoudt `reasoning: { effort: "none" }` alleen voor modellen die de OpenAI-inspanning `none` ondersteunen
    - Laat uitgeschakelde reasoning weg voor modellen of proxy's die `reasoning.effort: "none"` afwijzen
    - Zet toolschema's standaard in strikte modus
    - Voegt verborgen attributieheaders alleen toe op geverifieerde native hosts
    - Behoudt OpenAI-specifieke request shaping (`service_tier`, `store`, reasoning-compatibiliteit, prompt-cachehints)

    **Proxy-/compatibele routes:**
    - Gebruikt losser compatibiliteitsgedrag
    - Verwijdert Completions `store` uit niet-native `openai-completions`-payloads
    - Accepteert geavanceerde `params.extra_body`/`params.extraBody` pass-through-JSON voor OpenAI-compatibele Completions-proxy's
    - Accepteert `params.chat_template_kwargs` voor OpenAI-compatibele Completions-proxy's zoals vLLM
    - Forceert geen strikte toolschema's of alleen-native headers

    Azure OpenAI gebruikt native transport- en compatibiliteitsgedrag, maar ontvangt de verborgen attributieheaders niet.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor afbeeldingstools en providerselectie.
  </Card>
  <Card title="Video genereren" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="OAuth en auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
