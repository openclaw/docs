---
read_when:
    - Je wilt OpenAI-modellen gebruiken in OpenClaw
    - Je wilt Codex-authenticatie via een abonnement in plaats van API-sleutels
    - Je hebt strikter uitvoeringsgedrag voor GPT-5-agents nodig
summary: Gebruik OpenAI via API-sleutels of een Codex-abonnement in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI biedt ontwikkelaars-API's voor GPT-modellen, en Codex is ook beschikbaar als een
ChatGPT-abonnement-coding-agent via OpenAI's Codex-clients. OpenClaw houdt die
oppervlakken gescheiden, zodat configuratie voorspelbaar blijft.

OpenClaw gebruikt `openai/*` als de canonieke OpenAI-modelroute. Ingebedde agent-
beurten op OpenAI-modellen lopen standaard via de native Codex app-server-runtime;
directe OpenAI API-key-auth blijft beschikbaar voor niet-agent-OpenAI-
oppervlakken zoals afbeeldingen, embeddings, spraak en realtime.

- **Agentmodellen** - `openai/*`-modellen via de Codex-runtime; meld je aan met
  Codex-auth voor ChatGPT-/Codex-abonnementsgebruik, of configureer een Codex-compatibele
  OpenAI API-key-back-up wanneer je bewust API-key-auth wilt.
- **Niet-agent OpenAI-API's** - directe toegang tot OpenAI Platform met gebruiksgebaseerde
  facturering via `OPENAI_API_KEY` of OpenAI API-key-onboarding.
- **Legacy-configuratie** - `openai-codex/*`-modelrefs worden door
  `openclaw doctor --fix` gerepareerd naar `openai/*` plus de Codex-runtime.

OpenAI ondersteunt expliciet abonnement-OAuth-gebruik in externe tools en workflows zoals OpenClaw.

Provider, model, runtime en kanaal zijn afzonderlijke lagen. Als die labels
door elkaar raken, lees dan [Agentruntimes](/nl/concepts/agent-runtimes) voordat je
configuratie wijzigt.

## Snelle keuze

| Doel                                                 | Gebruik                                                  | Opmerkingen                                                            |
| ---------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| ChatGPT-/Codex-abonnement met native Codex-runtime   | `openai/gpt-5.5`                                         | Standaard OpenAI-agentconfiguratie. Meld je aan met Codex-auth.        |
| Directe API-key-facturering voor agentmodellen       | `openai/gpt-5.5` plus een Codex-compatibel API-key-profiel | Gebruik `auth.order.openai` om de back-up na abonnementsauth te plaatsen. |
| Directe API-key-facturering via expliciete PI        | `openai/gpt-5.5` plus provider/model-runtime `pi`        | Selecteer een normaal `openai` API-key-profiel.                        |
| Nieuwste ChatGPT Instant API-alias                   | `openai/chat-latest`                                     | Alleen directe API-key. Verplaatsende alias voor experimenten, niet de standaard. |
| ChatGPT-/Codex-abonnementsauth via expliciete PI     | `openai/gpt-5.5` plus provider/model-runtime `pi`        | Selecteer een `openai-codex`-authprofiel voor de compatibiliteitsroute. |
| Afbeeldingen genereren of bewerken                   | `openai/gpt-image-2`                                     | Werkt met `OPENAI_API_KEY` of OpenAI Codex OAuth.                      |
| Afbeeldingen met transparante achtergrond            | `openai/gpt-image-1.5`                                   | Gebruik `outputFormat=png` of `webp` en `openai.background=transparent`. |

## Naamgevingskaart

De namen lijken op elkaar, maar zijn niet onderling uitwisselbaar:

| Naam die je ziet                       | Laag                       | Betekenis                                                                                                            |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | Providerprefix             | Canonieke OpenAI-modelroute; agentbeurten gebruiken de Codex-runtime.                                                |
| `openai-codex`                          | Legacy auth-/profielprefix | Oudere OpenAI Codex OAuth-/abonnementsprofielnamespace. Bestaande profielen en `auth.order.openai-codex` blijven werken. |
| `codex` plugin                          | Plugin                     | Meegeleverde OpenClaw-plugin die native Codex app-server-runtime en `/codex`-chatbesturing biedt.                    |
| provider/model `agentRuntime.id: codex` | Agentruntime               | Dwing de native Codex app-server-harness af voor overeenkomende ingebedde beurten.                                   |
| `/codex ...`                            | Chatopdrachtenset          | Bind/beheer Codex app-server-threads vanuit een gesprek.                                                             |
| `runtime: "acp", agentId: "codex"`      | ACP-sessieroute            | Expliciet fallbackpad dat Codex via ACP/acpx uitvoert.                                                               |

Dit betekent dat een configuratie bewust `openai/*`-modelrefs kan bevatten terwijl auth-
profielen nog naar Codex-compatibele referenties verwijzen. Geef voor nieuwe configuratie
de voorkeur aan `auth.order.openai`; bestaande `openai-codex:*`-profielen en `auth.order.openai-codex`
blijven ondersteund. `openclaw doctor --fix` herschrijft legacy `openai-codex/*`-model-
refs naar de canonieke OpenAI-modelroute.

<Note>
GPT-5.5 is beschikbaar via zowel directe OpenAI Platform API-key-toegang als
abonnements-/OAuth-routes. Gebruik voor ChatGPT-/Codex-abonnement plus native Codex-
uitvoering `openai/gpt-5.5`; ontbrekende runtimeconfiguratie selecteert nu de Codex-
harness voor OpenAI-agentbeurten. Gebruik OpenAI API-key-profielen alleen wanneer je
directe API-key-auth voor een OpenAI-agentmodel wilt.
</Note>

<Note>
OpenAI-agentmodelbeurten vereisen de meegeleverde Codex app-server-plugin. Expliciete
PI-runtimeconfiguratie blijft beschikbaar als opt-in-compatibiliteitsroute. Wanneer PI
expliciet wordt geselecteerd met een `openai-codex`-authprofiel, houdt OpenClaw de
publieke modelref als `openai/*` en routeert PI intern via het legacy
Codex-auth-transport. Voer `openclaw doctor --fix` uit om verouderde
`openai-codex/*`-modelrefs of oude PI-sessiepinnen te repareren die niet uit
expliciete runtimeconfiguratie komen.
</Note>

## OpenClaw-functiedekking

| OpenAI-mogelijkheid      | OpenClaw-oppervlak                                                              | Status                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>`-modelprovider                                                   | Ja                                                     |
| Codex-abonnementsmodellen | `openai/<model>` met `openai-codex` OAuth                                        | Ja                                                     |
| Legacy Codex-modelrefs    | `openai-codex/<model>`                                                           | Gerepareerd door doctor naar `openai/<model>`          |
| Codex app-server-harness  | `openai/<model>` met weggelaten runtime of provider/model `agentRuntime.id: codex` | Ja                                                   |
| Server-side webzoekopdracht | Native OpenAI Responses-tool                                                   | Ja, wanneer webzoeken is ingeschakeld en er geen provider is vastgezet |
| Afbeeldingen              | `image_generate`                                                                 | Ja                                                     |
| Video's                   | `video_generate`                                                                 | Ja                                                     |
| Tekst-naar-spraak         | `messages.tts.provider: "openai"` / `tts`                                        | Ja                                                     |
| Batch-spraak-naar-tekst   | `tools.media.audio` / mediabegrip                                                | Ja                                                     |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "openai"`                                      | Ja                                                     |
| Realtime stem             | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Ja                                                     |
| Embeddings                | memory-embeddingprovider                                                         | Ja                                                     |

## Memory-embeddings

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
`queryInputType`; geïndexeerde memory-chunks en batchindexering gebruiken
`documentInputType`. Zie de [referentie voor memory-configuratie](/nl/reference/memory-config#provider-specific-config) voor het volledige voorbeeld.

## Aan de slag

Kies je gewenste auth-methode en volg de installatiestappen.

<Tabs>
  <Tab title="API-key (OpenAI Platform)">
    **Beste voor:** directe API-toegang en gebruiksgebaseerde facturering.

    <Steps>
      <Step title="Haal je API-key op">
        Maak of kopieer een API-key vanuit het [OpenAI Platform-dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Voer onboarding uit">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Of geef de key direct door:

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

    | Modelref               | Runtimeconfiguratie        | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | weggelaten / provider/model `agentRuntime.id: "codex"` | Codex app-server-harness | Codex-compatibel OpenAI-profiel |
    | `openai/gpt-5.4-mini` | weggelaten / provider/model `agentRuntime.id: "codex"` | Codex app-server-harness | Codex-compatibel OpenAI-profiel |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | PI ingebedde runtime    | `openai`-profiel of geselecteerd `openai-codex`-profiel |

    <Note>
    `openai/*`-agentmodellen gebruiken de Codex app-server-harness. Om API-key-
    auth voor een agentmodel te gebruiken, maak je een Codex-compatibel API-key-profiel
    en orden je het met `auth.order.openai`; `OPENAI_API_KEY` blijft de directe fallback voor
    niet-agent-OpenAI-API-oppervlakken. Oudere `auth.order.openai-codex`-vermeldingen blijven
    werken.
    </Note>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Om ChatGPT's huidige Instant-model vanuit de OpenAI-API te proberen, stel je het model
    in op `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` is een verplaatsende alias. OpenAI documenteert deze als het nieuwste Instant-
    model dat in ChatGPT wordt gebruikt en raadt `gpt-5.5` aan voor productie-API-gebruik, dus
    houd `openai/gpt-5.5` als de stabiele standaard tenzij je expliciet dat
    aliasgedrag wilt. De alias accepteert momenteel alleen `medium` tekstverbosity, dus
    OpenClaw normaliseert incompatibele OpenAI-tekstverbosity-overrides voor dit
    model.

    <Warning>
    OpenClaw stelt `openai/gpt-5.3-codex-spark` **niet** beschikbaar. Live OpenAI API-aanvragen wijzen dat model af, en de huidige Codex-catalogus stelt het ook niet beschikbaar.
    </Warning>

  </Tab>

  <Tab title="Codex-abonnement">
    **Best voor:** je ChatGPT/Codex-abonnement gebruiken met native Codex-app-serveruitvoering in plaats van een aparte API-sleutel. Codex-cloud vereist aanmelden bij ChatGPT.

    <Steps>
      <Step title="Voer Codex OAuth uit">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Of voer OAuth rechtstreeks uit:

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

        Er is geen runtimeconfiguratie vereist voor het standaardpad. OpenAI-agentbeurten
        selecteren automatisch de native Codex-app-serverruntime, en OpenClaw
        installeert of herstelt de meegeleverde Codex-Plugin wanneer deze route wordt gekozen.
      </Step>
      <Step title="Controleer of Codex-authenticatie beschikbaar is">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Nadat de Gateway draait, stuur je `/codex status` of `/codex models`
        in de chat om de native app-serverruntime te controleren.
      </Step>
    </Steps>

    ### Routesamenvatting

    | Modelreferentie | Runtimeconfiguratie | Route | Authenticatie |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | weggelaten / provider/model `agentRuntime.id: "codex"` | Native Codex-app-serverharnas | Codex-aanmelding of geordend `openai`-authenticatieprofiel |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | PI-ingebedde runtime met intern Codex-authenticatietransport | Geselecteerd `openai-codex`-profiel |
    | `openai-codex/gpt-5.5` | hersteld door doctor | Legacy-route herschreven naar `openai/gpt-5.5` | Bestaand `openai-codex`-profiel |

    <Warning>
    Configureer geen oudere `openai-codex/gpt-5.1*`-, `openai-codex/gpt-5.2*`- of
    `openai-codex/gpt-5.3*`-modelreferenties. ChatGPT/Codex OAuth-accounts weigeren
    die modellen nu. Gebruik `openai/gpt-5.5`; OpenAI-agentbeurten selecteren nu standaard
    de Codex-runtime.
    </Warning>

    <Note>
    De modelprefix `openai-codex/*` is legacy-configuratie die door doctor wordt hersteld. Voor
    de gebruikelijke setup met abonnement plus native runtime meld je je aan met Codex-authenticatie,
    maar houd je de modelreferentie op `openai/gpt-5.5`. Nieuwe configuratie moet de OpenAI
    agent-authenticatievolgorde onder `auth.order.openai` plaatsen; oudere `auth.order.openai-codex`-
    vermeldingen blijven geldig.
    </Note>

    ### Configuratievoorbeeld

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    Met een API-sleutelback-up houd je het model op `openai/gpt-5.5` en plaats je de
    authenticatievolgorde onder `openai`. OpenClaw probeert eerst het abonnement en daarna
    de API-sleutel, terwijl het op het Codex-harnas blijft:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding importeert geen OAuth-materiaal meer uit `~/.codex`. Meld je aan met browser-OAuth (standaard) of de device-code-flow hierboven — OpenClaw beheert de resulterende referenties in zijn eigen agent-authenticatieopslag.
    </Note>

    ### Codex OAuth-routing controleren en herstellen

    Gebruik deze opdrachten om te zien welke model-, runtime- en authenticatieroute je standaard
    agent gebruikt:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Voeg voor een specifieke agent `--agent <id>` toe:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Als een oudere configuratie nog `openai-codex/gpt-*` heeft of een verouderde OpenAI PI-
    sessiepin zonder expliciete runtimeconfiguratie, herstel die dan:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Als `models auth list --provider openai-codex` geen bruikbaar profiel toont, meld je
    je opnieuw aan:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` is de modelroute voor OpenAI-agentbeurten via Codex. De
    `openai-codex` auth-/profielprovider-id blijft geaccepteerd voor bestaande
    profielen en CLI-vermelding.

    ### Statusindicator

    Chat `/status` toont welke modelruntime actief is voor de huidige sessie.
    Het meegeleverde Codex-app-serverharnas verschijnt als `Runtime: OpenAI Codex` voor
    OpenAI-agentmodelbeurten. Verouderde PI-sessiepins worden hersteld naar Codex, tenzij
    de configuratie PI expliciet vastpint.

    ### Doctor-waarschuwing

    Als `openai-codex/*`-routes of verouderde OpenAI PI-pins in de configuratie of
    sessiestatus blijven staan, herschrijft `openclaw doctor --fix` ze naar `openai/*` met de
    Codex-runtime, tenzij PI expliciet is geconfigureerd.

    ### Limiet van contextvenster

    OpenClaw behandelt modelmetadata en de runtimecontextlimiet als afzonderlijke waarden.

    Voor `openai/gpt-5.5` via de Codex OAuth-catalogus:

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
    Gebruik `contextWindow` om native modelmetadata te declareren. Gebruik `contextTokens` om het runtimecontextbudget te beperken.
    </Note>

    ### Catalogusherstel

    OpenClaw gebruikt upstream Codex-catalogusmetadata voor `gpt-5.5` wanneer die
    aanwezig is. Als live Codex-detectie de `gpt-5.5`-rij weglaat terwijl
    het account is geauthenticeerd, synthetiseert OpenClaw die OAuth-modelrij zodat
    Cron-, sub-agent- en geconfigureerde standaardmodelruns niet mislukken met
    `Unknown model`.

  </Tab>
</Tabs>

## Native Codex-app-serverauthenticatie

Het native Codex-app-serverharnas gebruikt `openai/*`-modelreferenties plus weggelaten
runtimeconfiguratie of provider/model `agentRuntime.id: "codex"`, maar de authenticatie is
nog steeds accountgebaseerd. OpenClaw selecteert authenticatie in deze volgorde:

1. Geordende OpenAI-authenticatieprofielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Bestaande `openai-codex:*`-profielen en
   `auth.order.openai-codex` blijven geldig voor oudere installaties.
2. Het bestaande account van de app-server, zoals een lokale Codex CLI ChatGPT-aanmelding.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer de app-server geen account rapporteert en nog steeds
   OpenAI-authenticatie vereist.

Dat betekent dat een lokale ChatGPT/Codex-abonnementsaanmelding niet wordt vervangen alleen
omdat het Gateway-proces ook `OPENAI_API_KEY` heeft voor directe OpenAI-modellen
of embeddings. Env-API-sleutelfallback is alleen het lokale stdio-pad zonder account; deze
wordt niet naar WebSocket-app-serververbindingen gestuurd. Wanneer een abonnementsachtig Codex-
profiel wordt geselecteerd, houdt OpenClaw ook `CODEX_API_KEY` en `OPENAI_API_KEY`
buiten het gespawnde stdio-app-serverkindproces en stuurt het de geselecteerde referenties
via de app-server-login-RPC. Wanneer dat abonnementsprofiel wordt geblokkeerd door een
Codex-gebruikslimiet, kan OpenClaw roteren naar het volgende geordende `openai:*` API-sleutel-
profiel zonder het geselecteerde model te wijzigen of uit het Codex-
harnas te vallen. Zodra de resettijd van het abonnement is verstreken, komt het abonnementsprofiel
weer in aanmerking.

## Afbeeldingsgeneratie

De meegeleverde `openai`-Plugin registreert afbeeldingsgeneratie via de tool `image_generate`.
Deze ondersteunt zowel OpenAI API-sleutelafbeeldingsgeneratie als Codex OAuth-afbeeldingsgeneratie
via dezelfde `openai/gpt-image-2`-modelreferentie.

| Mogelijkheid              | OpenAI API-sleutel                | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modelreferentie           | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authenticatie             | `OPENAI_API_KEY`                   | OpenAI Codex OAuth-aanmelding        |
| Transport                 | OpenAI Images API                  | Codex Responses-backend              |
| Max. afbeeldingen per aanvraag | 4                              | 4                                    |
| Bewerkingsmodus           | Ingeschakeld (tot 5 referentieafbeeldingen) | Ingeschakeld (tot 5 referentieafbeeldingen) |
| Grootte-overschrijvingen  | Ondersteund, inclusief 2K-/4K-formaten | Ondersteund, inclusief 2K-/4K-formaten |
| Beeldverhouding / resolutie | Niet doorgestuurd naar OpenAI Images API | Toegewezen aan een ondersteund formaat wanneer veilig |

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

`gpt-image-2` is de standaard voor zowel OpenAI-tekst-naar-afbeeldinggeneratie als afbeeldings-
bewerking. `gpt-image-1.5`, `gpt-image-1` en `gpt-image-1-mini` blijven bruikbaar als
expliciete modeloverschrijvingen. Gebruik `openai/gpt-image-1.5` voor PNG-/WebP-uitvoer
met transparante achtergrond; de huidige `gpt-image-2`-API weigert
`background: "transparent"`.

Voor een aanvraag met transparante achtergrond moeten agents `image_generate` aanroepen met
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` of `"webp"` en
`background: "transparent"`; de oudere provideroptie `openai.background` wordt
nog steeds geaccepteerd. OpenClaw beschermt ook de openbare OpenAI- en
OpenAI Codex OAuth-routes door standaard `openai/gpt-image-2`-transparantie-
aanvragen te herschrijven naar `gpt-image-1.5`; Azure- en aangepaste OpenAI-compatibele eindpunten behouden
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
`openclaw infer image edit` wanneer je start vanuit een invoerbestand.
`--openai-background` blijft beschikbaar als OpenAI-specifieke alias.

Voor Codex OAuth-installaties behoud je dezelfde `openai/gpt-image-2`-referentie. Wanneer een
`openai-codex` OAuth-profiel is geconfigureerd, lost OpenClaw dat opgeslagen OAuth-
toegangstoken op en stuurt het afbeeldingsaanvragen via de Codex Responses-backend. Het
probeert niet eerst `OPENAI_API_KEY` en valt voor die aanvraag niet stilzwijgend terug op een API-sleutel.
Configureer `models.providers.openai` expliciet met een API-sleutel,
aangepaste basis-URL of Azure-eindpunt wanneer je in plaats daarvan de directe OpenAI Images API-
route wilt gebruiken.
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

De gebundelde `openai` Plugin registreert videogeneratie via het `video_generate`-hulpmiddel.

| Mogelijkheid     | Waarde                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Standaardmodel   | `openai/sora-2`                                                                   |
| Modi             | Tekst-naar-video, afbeelding-naar-video, bewerking van één video                  |
| Referentie-invoer | 1 afbeelding of 1 video                                                          |
| Grootte-overschrijvingen | Ondersteund                                                                |
| Overige overschrijvingen | `aspectRatio`, `resolution`, `audio`, `watermark` worden genegeerd met een hulpmiddelwaarschuwing |

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
Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde hulpmiddelparameters, providerselectie en failover-gedrag.
</Note>

## GPT-5-promptbijdrage

OpenClaw voegt een gedeelde GPT-5-promptbijdrage toe voor uitvoeringen uit de GPT-5-familie bij providers. Deze wordt toegepast op basis van model-id, dus `openai/gpt-5.5`, verouderde refs van vóór reparatie zoals `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` en andere compatibele GPT-5-refs krijgen dezelfde overlay. Oudere GPT-4.x-modellen niet.

De gebundelde native Codex-harness gebruikt hetzelfde GPT-5-gedrag en dezelfde Heartbeat-overlay via ontwikkelaarsinstructies van de Codex-appserver, zodat `openai/gpt-5.x`-sessies die via Codex worden gerouteerd dezelfde opvolging en proactieve Heartbeat-richtlijnen behouden, ook al beheert Codex de rest van de harness-prompt.

De GPT-5-bijdrage voegt een getagd gedragscontract toe voor persona-persistentie, uitvoeringsveiligheid, hulpmiddeldiscipline, uitvoervorm, voltooiingscontroles en verificatie. Kanaalspecifiek antwoord- en stil-berichtgedrag blijft in de gedeelde OpenClaw-systeemprompt en het beleid voor uitgaande levering. De GPT-5-richtlijnen zijn altijd ingeschakeld voor overeenkomende modellen. De vriendelijke interactiestijllaag is afzonderlijk en configureerbaar.

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
Waarden zijn tijdens runtime hoofdletterongevoelig, dus `"Off"` en `"off"` schakelen allebei de vriendelijke stijllaag uit.
</Tip>

<Note>
Verouderde `plugins.entries.openai.config.personality` wordt nog steeds gelezen als compatibiliteitsfallback wanneer de gedeelde instelling `agents.defaults.promptOverlays.gpt5.personality` niet is ingesteld.
</Note>

## Stem en spraak

<AccordionGroup>
  <Accordion title="Spraaksynthese (TTS)">
    De gebundelde `openai` Plugin registreert spraaksynthese voor het `messages.tts`-oppervlak.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stem | `messages.tts.providers.openai.voice` | `coral` |
    | Snelheid | `messages.tts.providers.openai.speed` | (niet ingesteld) |
    | Instructies | `messages.tts.providers.openai.instructions` | (niet ingesteld, alleen `gpt-4o-mini-tts`) |
    | Formaat | `messages.tts.providers.openai.responseFormat` | `opus` voor spraaknotities, `mp3` voor bestanden |
    | API-sleutel | `messages.tts.providers.openai.apiKey` | Valt terug op `OPENAI_API_KEY` |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Extra body | `messages.tts.providers.openai.extraBody` / `extra_body` | (niet ingesteld) |

    Beschikbare modellen: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Beschikbare stemmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wordt samengevoegd in de JSON van het `/audio/speech`-verzoek na de door OpenClaw gegenereerde velden, dus gebruik dit voor OpenAI-compatibele endpoints die extra sleutels zoals `lang` vereisen. Prototype-sleutels worden genegeerd.

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
    Stel `OPENAI_TTS_BASE_URL` in om de TTS-basis-URL te overschrijven zonder het chat-API-endpoint te beïnvloeden. OpenAI TTS wordt nog steeds geconfigureerd via een API-sleutel; gebruik voor OAuth-only live terugspreken het Realtime-spraakpad in plaats van agentmodus STT -> TTS-spraak.
    </Note>

  </Accordion>

  <Accordion title="Spraak-naar-tekst">
    De gebundelde `openai` Plugin registreert batch-spraak-naar-tekst via
    OpenClaw's transcriptie-oppervlak voor mediabegrip.

    - Standaardmodel: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Invoerpad: multipart-audiobestandsupload
    - Ondersteund door OpenClaw overal waar transcriptie van inkomende audio
      `tools.media.audio` gebruikt, inclusief Discord-spraakkanaalsegmenten en
      audio-bijlagen van kanalen

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

    Taal- en prompttips worden doorgestuurd naar OpenAI wanneer ze worden geleverd door de
    gedeelde configuratie voor audiomedia of door een transcriptieverzoek per aanroep.

  </Accordion>

  <Accordion title="Realtime-transcriptie">
    De meegeleverde `openai`-Plugin registreert realtime-transcriptie voor de Voice Call-Plugin.

    | Instelling | Configuratiepad | Standaardwaarde |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Taal | `...openai.language` | (niet ingesteld) |
    | Prompt | `...openai.prompt` | (niet ingesteld) |
    | Stilteduur | `...openai.silenceDurationMs` | `800` |
    | VAD-drempel | `...openai.vadThreshold` | `0.5` |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, of `openai-codex` OAuth | API-sleutels maken direct verbinding; OAuth maakt een Realtime-transcriptieclientgeheim aan |

    <Note>
    Gebruikt een WebSocket-verbinding met `wss://api.openai.com/v1/realtime` met G.711 u-law (`g711_ulaw` / `audio/pcmu`) audio. Wanneer alleen `openai-codex` OAuth is geconfigureerd, maakt de Gateway een tijdelijk Realtime-transcriptieclientgeheim aan voordat de WebSocket wordt geopend. Deze streamingprovider is bedoeld voor het realtime-transcriptiepad van Voice Call; Discord-spraak neemt momenteel korte segmenten op en gebruikt in plaats daarvan het batchtranscriptiepad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-spraak">
    De meegeleverde `openai`-Plugin registreert realtime-spraak voor de Voice Call-Plugin.

    | Instelling | Configuratiepad | Standaardwaarde |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Stem | `...openai.voice` | `alloy` |
    | Temperatuur (Azure-implementatiebridge) | `...openai.temperature` | `0.8` |
    | VAD-drempel | `...openai.vadThreshold` | `0.5` |
    | Stilteduur | `...openai.silenceDurationMs` | `500` |
    | Prefix-padding | `...openai.prefixPaddingMs` | `300` |
    | Redeneerinspanning | `...openai.reasoningEffort` | (niet ingesteld) |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, of `openai-codex` OAuth | Browser Talk en niet-Azure backendbridges kunnen Codex OAuth gebruiken |

    Beschikbare ingebouwde Realtime-stemmen voor `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI raadt `marin` en `cedar` aan voor de beste Realtime-kwaliteit. Dit
    is een andere set dan de Text-to-speech-stemmen hierboven; ga er niet van uit dat een TTS-
    stem zoals `fable`, `nova` of `onyx` geldig is voor Realtime-sessies.

    <Note>
    Backend OpenAI realtimebridges gebruiken de GA Realtime WebSocket-sessievorm, die `session.temperature` niet accepteert. Azure OpenAI-implementaties blijven beschikbaar via `azureEndpoint` en `azureDeployment` en behouden de implementatiecompatibele sessievorm. Ondersteunt bidirectionele toolaanroepen en G.711 u-law-audio.
    </Note>

    <Note>
    Realtime-spraak wordt geselecteerd wanneer de sessie wordt gemaakt. OpenAI staat toe dat de meeste
    sessievelden later worden gewijzigd, maar de stem kan niet meer worden gewijzigd nadat het
    model audio heeft uitgezonden in die sessie. OpenClaw stelt momenteel de
    ingebouwde Realtime-stem-id's beschikbaar als strings.
    </Note>

    <Note>
    Control UI Talk gebruikt OpenAI browser realtime-sessies met een door de Gateway aangemaakt
    tijdelijk clientgeheim en een directe WebRTC SDP-uitwisseling vanuit de browser met de
    OpenAI Realtime API. Wanneer er geen directe OpenAI API-sleutel is geconfigureerd, kan de
    Gateway dat clientgeheim aanmaken met het geselecteerde `openai-codex` OAuth-
    profiel. Gateway-relay en Voice Call backend realtime WebSocket-bridges gebruiken
    dezelfde OAuth-fallback voor native OpenAI-eindpunten. Live verificatie door maintainers
    is beschikbaar met
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    de OpenAI-trajecten verifiëren zowel de backend WebSocket-bridge als de browser
    WebRTC SDP-uitwisseling zonder geheimen te loggen.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-eindpunten

De meegeleverde `openai`-provider kan een Azure OpenAI-resource gebruiken voor image-
generatie door de basis-URL te overschrijven. Op het pad voor image-generatie detecteert OpenClaw
Azure-hostnamen op `models.providers.openai.baseUrl` en schakelt automatisch over naar
de aanvraagvorm van Azure.

<Note>
Realtime-spraak gebruikt een afzonderlijk configuratiepad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
en wordt niet beïnvloed door `models.providers.openai.baseUrl`. Zie de accordion **Realtime-
spraak** onder [Spraak en spraakuitvoer](#voice-and-speech) voor de Azure-
instellingen.
</Note>

Gebruik Azure OpenAI wanneer:

- Je al een Azure OpenAI-abonnement, quotum of enterprise-overeenkomst hebt
- Je regionale gegevensresidentie of compliancecontroles nodig hebt die Azure biedt
- Je verkeer binnen een bestaande Azure-tenant wilt houden

### Configuratie

Voor Azure image-generatie via de meegeleverde `openai`-provider wijs je
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

OpenClaw herkent deze Azure-hostsuffixen voor de Azure-route voor image-generatie:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Voor aanvragen voor image-generatie op een herkende Azure-host doet OpenClaw het volgende:

- Verstuurt de header `api-key` in plaats van `Authorization: Bearer`
- Gebruikt implementatiegebonden paden (`/openai/deployments/{deployment}/...`)
- Voegt `?api-version=...` toe aan elke aanvraag
- Gebruikt een standaard time-out van 600 s voor Azure-aanroepen voor image-generatie.
  Per-aanroepwaarden voor `timeoutMs` overschrijven deze standaardwaarde nog steeds.

Andere basis-URL's (openbare OpenAI, OpenAI-compatibele proxy's) behouden de standaard
OpenAI-aanvraagvorm voor images.

<Note>
Azure-routering voor het image-generatiepad van de `openai`-provider vereist
OpenClaw 2026.4.22 of later. Eerdere versies behandelen elke aangepaste
`openai.baseUrl` als het openbare OpenAI-eindpunt en falen bij Azure-
image-implementaties.
</Note>

### API-versie

Stel `AZURE_OPENAI_API_VERSION` in om een specifieke Azure-preview- of GA-versie
vast te pinnen voor het pad voor Azure-afbeeldingsgeneratie:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

De standaardwaarde is `2024-12-01-preview` wanneer de variabele niet is ingesteld.

### Modelnamen zijn implementatienamen

Azure OpenAI koppelt modellen aan implementaties. Voor Azure-aanvragen voor afbeeldingsgeneratie
die via de gebundelde `openai`-provider worden gerouteerd, moet het veld `model` in OpenClaw
de **Azure-implementatienaam** zijn die je in de Azure-portal hebt geconfigureerd, niet
de openbare OpenAI-model-id.

Als je een implementatie maakt met de naam `gpt-image-2-prod` die `gpt-image-2` aanbiedt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dezelfde regel voor implementatienamen geldt voor aanroepen voor afbeeldingsgeneratie die via
de gebundelde `openai`-provider worden gerouteerd.

### Regionale beschikbaarheid

Azure-afbeeldingsgeneratie is momenteel alleen beschikbaar in een subset van regio's
(bijvoorbeeld `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controleer de actuele regiolijst van Microsoft voordat je een
implementatie maakt, en bevestig dat het specifieke model in je regio wordt aangeboden.

### Parameterverschillen

Azure OpenAI en openbare OpenAI accepteren niet altijd dezelfde afbeeldingsparameters.
Azure kan opties weigeren die openbare OpenAI toestaat (bijvoorbeeld bepaalde
`background`-waarden op `gpt-image-2`) of ze alleen beschikbaar maken op specifieke modelversies.
Deze verschillen komen van Azure en het onderliggende model, niet van OpenClaw.
Als een Azure-aanvraag mislukt met een validatiefout, controleer dan in de Azure-portal
de parameterset die door jouw specifieke implementatie en API-versie wordt ondersteund.

<Note>
Azure OpenAI gebruikt native transport en compatibiliteitsgedrag, maar ontvangt niet
de verborgen attributieheaders van OpenClaw — zie de accordion **Native versus OpenAI-compatibele routes**
onder [Geavanceerde configuratie](#advanced-configuration).

Voor chat- of Responses-verkeer op Azure (naast afbeeldingsgeneratie) gebruik je de
onboarding-flow of een speciale Azure-providerconfiguratie — alleen `openai.baseUrl`
neemt de Azure API-/auth-vorm niet over. Er bestaat een aparte
`azure-openai-responses/*`-provider; zie
de accordion Server-side Compaction hieronder.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Transport (WebSocket versus SSE)">
    OpenClaw gebruikt eerst WebSocket met SSE-fallback (`"auto"`) voor `openai/*`.

    In de modus `"auto"`:
    - Probeert OpenClaw één vroege WebSocket-fout opnieuw voordat wordt teruggevallen op SSE
    - Markeert OpenClaw WebSocket na een fout gedurende ~60 seconden als gedegradeerd en gebruikt SSE tijdens de afkoelperiode
    - Voegt stabiele headers voor sessie- en beurtidentiteit toe voor nieuwe pogingen en herverbindingen
    - Normaliseert gebruikstellers (`input_tokens` / `prompt_tokens`) tussen transportvarianten

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
          },
        },
      },
    }
    ```

    Gerelateerde OpenAI-documentatie:
    - [Realtime-API met WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API-responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Snelle modus">
    OpenClaw biedt een gedeelde schakelaar voor snelle modus voor `openai/*`:

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
    Sessie-overschrijvingen hebben voorrang op configuratie. Door de sessie-overschrijving in de Sessions-UI te wissen, keert de sessie terug naar de geconfigureerde standaardwaarde.
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
    Voor directe OpenAI Responses-modellen (`openai/*` op `api.openai.com`) schakelt de Pi-harness-streamwrapper van de OpenAI-Plugin server-side Compaction automatisch in:

    - Dwingt `store: true` af (tenzij modelcompatibiliteit `supportsStore: false` instelt)
    - Injecteert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standaard `compact_threshold`: 70% van `contextWindow` (of `80000` wanneer niet beschikbaar)

    Dit geldt voor het ingebouwde Pi-harnesspad en voor OpenAI-providerhooks die door embedded uitvoeringen worden gebruikt. De native Codex-appserver-harness beheert zijn eigen context via Codex en wordt geconfigureerd door de standaard agentroute of provider-/modelruntimebeleid van OpenAI.

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
    `responsesServerCompaction` regelt alleen `context_management`-injectie. Directe OpenAI Responses-modellen dwingen nog steeds `store: true` af, tenzij compatibiliteit `supportsStore: false` instelt.
    </Note>

  </Accordion>

  <Accordion title="Strikte agentische GPT-modus">
    Voor uitvoeringen uit de GPT-5-familie op `openai/*` kan OpenClaw een strikter embedded uitvoeringscontract gebruiken:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Met `strict-agentic`:
    - Beschouwt OpenClaw een beurt met alleen een plan niet langer als succesvolle voortgang wanneer er een toolactie beschikbaar is
    - Probeert OpenClaw de beurt opnieuw met een stuurprompt om nu te handelen
    - Schakelt OpenClaw `update_plan` automatisch in voor substantieel werk
    - Toont OpenClaw een expliciete geblokkeerde status als het model blijft plannen zonder te handelen

    <Note>
    Alleen van toepassing op OpenAI- en Codex-uitvoeringen uit de GPT-5-familie. Andere providers en oudere modelfamilies behouden het standaardgedrag.
    </Note>

  </Accordion>

  <Accordion title="Native versus OpenAI-compatibele routes">
    OpenClaw behandelt directe OpenAI-, Codex- en Azure OpenAI-eindpunten anders dan generieke OpenAI-compatibele `/v1`-proxy's:

    **Native routes** (`openai/*`, Azure OpenAI):
    - Behouden `reasoning: { effort: "none" }` alleen voor modellen die de OpenAI-waarde `none` voor inspanning ondersteunen
    - Laten uitgeschakelde reasoning weg voor modellen of proxy's die `reasoning.effort: "none"` weigeren
    - Stellen toolschema's standaard in op strikte modus
    - Voegen verborgen attributieheaders alleen toe op geverifieerde native hosts
    - Behouden OpenAI-specifieke aanvraagvorming (`service_tier`, `store`, reasoning-compatibiliteit, promptcache-hints)

    **Proxy-/compatibele routes:**
    - Gebruiken losser compatibiliteitsgedrag
    - Verwijderen Completions `store` uit niet-native `openai-completions`-payloads
    - Accepteren geavanceerde `params.extra_body`/`params.extraBody`-doorvoer-JSON voor OpenAI-compatibele Completions-proxy's
    - Accepteren `params.chat_template_kwargs` voor OpenAI-compatibele Completions-proxy's zoals vLLM
    - Dwingen geen strikte toolschema's of native-only headers af

    Azure OpenAI gebruikt native transport en compatibiliteitsgedrag, maar ontvangt niet de verborgen attributieheaders.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Afbeeldingsgeneratie" href="/nl/tools/image-generation" icon="image">
    Gedeelde afbeeldings-toolparameters en providerselectie.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde video-toolparameters en providerselectie.
  </Card>
  <Card title="OAuth en auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
