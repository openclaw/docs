---
read_when:
    - Je wilt OpenAI-modellen gebruiken in OpenClaw
    - Je wilt Codex-abonnementsauthenticatie in plaats van API-sleutels
    - Je hebt strikter uitvoeringsgedrag voor GPT-5-agenten nodig
summary: Gebruik OpenAI via API-sleutels of Codex-abonnement in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:13:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI biedt ontwikkelaars-API's voor GPT-modellen, en Codex is ook beschikbaar als
ChatGPT-abonnementscoderingsagent via OpenAI's Codex-clients. OpenClaw gebruikt één
provider-id, `openai`, voor beide auth-vormen.

OpenClaw gebruikt `openai/*` als de canonieke OpenAI-modelroute. Ingebedde agent-
beurten op OpenAI-modellen lopen standaard via de native Codex app-server-runtime;
directe OpenAI API-key-auth blijft beschikbaar voor niet-agent-OpenAI-
oppervlakken zoals afbeeldingen, embeddings, spraak en realtime.

- **Agentmodellen** - `openai/*`-modellen via de Codex-runtime; meld je aan met
  Codex-auth voor gebruik met een ChatGPT/Codex-abonnement, of configureer een
  Codex-compatibele OpenAI API-key-back-up wanneer je bewust API-key-auth wilt.
- **Niet-agent-OpenAI-API's** - directe OpenAI Platform-toegang met gebruiksgebaseerde
  facturering via `OPENAI_API_KEY` of OpenAI API-key-onboarding.
- **Legacy-configuratie** - legacy Codex-modelrefs worden door
  `openclaw doctor --fix` gerepareerd naar `openai/*` plus de Codex-runtime.

OpenAI ondersteunt expliciet gebruik van abonnement-OAuth in externe tools en workflows zoals OpenClaw.

Provider, model, runtime en kanaal zijn afzonderlijke lagen. Als die labels door
elkaar raken, lees dan [Agentruntimes](/nl/concepts/agent-runtimes) voordat je
configuratie wijzigt.

## Snelle keuze

| Doel                                                 | Gebruik                                                  | Opmerkingen                                                           |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime    | `openai/gpt-5.5`                                         | Standaard OpenAI-agentconfiguratie. Meld je aan met Codex-auth.       |
| Directe API-key-facturering voor agentmodellen       | `openai/gpt-5.5` plus een Codex-compatibel API-key-profiel | Gebruik `auth.order.openai` om de back-up na abonnement-auth te plaatsen. |
| Directe API-key-facturering via expliciete OpenClaw  | `openai/gpt-5.5` plus provider/model-runtime `openclaw`  | Selecteer een normaal `openai` API-key-profiel.                       |
| Nieuwste ChatGPT Instant API-alias                   | `openai/chat-latest`                                     | Alleen directe API-key. Bewegende alias voor experimenten, niet de standaard. |
| ChatGPT/Codex-abonnement-auth via OpenClaw           | `openai/gpt-5.5` plus provider/model-runtime `openclaw`  | Selecteer een `openai` OAuth-profiel voor de compatibiliteitsroute.   |
| Afbeeldingen genereren of bewerken                   | `openai/gpt-image-2`                                     | Werkt met zowel `OPENAI_API_KEY` als OpenAI Codex OAuth.              |
| Afbeeldingen met transparante achtergrond            | `openai/gpt-image-1.5`                                   | Gebruik `outputFormat=png` of `webp` en `openai.background=transparent`. |

## Naamoverzicht

De namen lijken op elkaar, maar zijn niet onderling uitwisselbaar:

| Naam die je ziet                        | Laag              | Betekenis                                                                                         |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Providerprefix    | Canonieke OpenAI-modelroute; agentbeurten gebruiken de Codex-runtime.                             |
| legacy OpenAI Codex-prefix              | Legacy-prefix     | Oudere model/profiel-namespace. `openclaw doctor --fix` migreert deze naar `openai`.              |
| `codex` Plugin                          | Plugin            | Gebundelde OpenClaw Plugin die de native Codex app-server-runtime en `/codex`-chatbediening biedt. |
| provider/model `agentRuntime.id: codex` | Agentruntime      | Forceer de native Codex app-server-harness voor overeenkomende ingebedde beurten.                 |
| `/codex ...`                            | Chatopdrachtenset | Bind/beheer Codex app-server-threads vanuit een gesprek.                                          |
| `runtime: "acp", agentId: "codex"`      | ACP-sessieroute   | Expliciet fallbackpad dat Codex via ACP/acpx uitvoert.                                            |

Dit betekent dat een configuratie bewust `openai/*`-modelrefs kan bevatten terwijl auth-
profielen verwijzen naar API-key- of ChatGPT/Codex OAuth-referenties. Gebruik
`auth.order.openai` voor configuratie; `openclaw doctor --fix` herschrijft legacy
legacy Codex-modelrefs, legacy Codex-auth-profiel-id's en
legacy Codex-auth-volgorde naar de canonieke OpenAI-route.

<Note>
GPT-5.5 is beschikbaar via zowel directe OpenAI Platform API-key-toegang als
abonnement/OAuth-routes. Gebruik voor ChatGPT/Codex-abonnement plus native Codex-
uitvoering `openai/gpt-5.5`; niet-ingestelde runtimeconfiguratie selecteert nu de Codex-
harness voor OpenAI-agentbeurten. Gebruik OpenAI API-key-profielen alleen wanneer je
directe API-key-auth voor een OpenAI-agentmodel wilt.
</Note>

<Note>
OpenAI-agentmodelbeurten vereisen de gebundelde Codex app-server-Plugin. Expliciete
OpenClaw-runtimeconfiguratie blijft beschikbaar als opt-in compatibiliteitsroute. Wanneer OpenClaw
expliciet is geselecteerd met een `openai` OAuth-profiel, behoudt OpenClaw de
publieke modelref als `openai/*` en routeert intern via het Codex-auth-
transport. Voer `openclaw doctor --fix` uit om verouderde
legacy Codex-modelrefs, `codex-cli/*` of oude runtime-sessiepins te repareren die niet afkomstig zijn van
expliciete runtimeconfiguratie.
</Note>

## OpenClaw-functiedekking

| OpenAI-mogelijkheid       | OpenClaw-oppervlak                                                                           | Status                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>`-modelprovider                                                               | Ja                                                                     |
| Codex-abonnementsmodellen | `openai/<model>` met OpenAI OAuth                                                            | Ja                                                                     |
| Legacy Codex-modelrefs    | legacy Codex-modelrefs of `codex-cli/<model>`                                                | Door doctor gerepareerd naar `openai/<model>`                          |
| Codex app-server-harness  | `openai/<model>` met weggelaten runtime of provider/model `agentRuntime.id: codex`           | Ja                                                                     |
| Server-side webzoeken     | Native OpenAI Responses-tool                                                                 | Ja, wanneer webzoeken is ingeschakeld en geen provider is vastgezet    |
| Afbeeldingen              | `image_generate`                                                                              | Ja                                                                     |
| Video's                   | `video_generate`                                                                              | Ja                                                                     |
| Tekst-naar-spraak         | `messages.tts.provider: "openai"` / `tts`                                                     | Ja                                                                     |
| Batch spraak-naar-tekst   | `tools.media.audio` / mediabegrip                                                            | Ja                                                                     |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "openai"`                                                   | Ja                                                                     |
| Realtime spraak           | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Ja (vereist OpenAI Platform-tegoed, geen Codex/ChatGPT-abonnement)     |
| Embeddings                | memory embedding-provider                                                                    | Ja                                                                     |

<Note>
  OpenAI Realtime-spraak (gebruikt door Voice Call's `realtime.provider: "openai"` en
  Control UI Talk met `talk.realtime.provider: "openai"`) loopt via de
  publieke **OpenAI Platform Realtime API**, die wordt gefactureerd op OpenAI
  Platform-tegoed in plaats van Codex/ChatGPT-abonnementquota. Een account
  met gezonde OpenAI OAuth dat Codex-backed chatmodellen zonder problemen uitvoert
  heeft nog steeds een OpenAI API-key-auth-profiel of een Platform-API-key met gefinancierde
  Platform-facturering nodig voor Realtime-spraak.

Oplossing: vul Platform-tegoed aan op
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
voor de organisatie achter je realtime-referenties. Realtime-spraak accepteert
het `openai` API-key-auth-profiel dat is aangemaakt door `openclaw onboard --auth-choice openai-api-key`,
een Platform `OPENAI_API_KEY` geconfigureerd via `talk.realtime.providers.openai.apiKey`
voor Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
voor Voice Call, of de omgevingsvariabele `OPENAI_API_KEY`. OpenAI OAuth-
profielen kunnen nog steeds Codex-backed `openai/*`-chatmodellen uitvoeren in dezelfde
OpenClaw-installatie, maar ze configureren Realtime-spraak niet.
</Note>

## Memory embeddings

OpenClaw kan OpenAI, of een OpenAI-compatibel embedding-endpoint, gebruiken voor
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

Voor OpenAI-compatibele endpoints die asymmetrische embedding-labels vereisen, stel je
`queryInputType` en `documentInputType` in onder `memorySearch`. OpenClaw stuurt
die door als providerspecifieke `input_type`-aanvraagvelden: query-embeddings gebruiken
`queryInputType`; geïndexeerde geheugenfragmenten en batchindexering gebruiken
`documentInputType`. Zie de [Memory-configuratiereferentie](/nl/reference/memory-config#provider-specific-config) voor het volledige voorbeeld.

## Aan de slag

Kies je gewenste auth-methode en volg de installatiestappen.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Beste voor:** directe API-toegang en gebruiksgebaseerde facturering.

    <Steps>
      <Step title="Get your API key">
        Maak of kopieer een API-key vanuit het [OpenAI Platform-dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Of geef de key direct door:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Routesamenvatting

    | Modelref              | Runtimeconfiguratie       | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | weggelaten / provider/model `agentRuntime.id: "codex"` | Codex app-server-harness | Codex-compatibel OpenAI-profiel |
    | `openai/gpt-5.4-mini` | weggelaten / provider/model `agentRuntime.id: "codex"` | Codex app-server-harness | Codex-compatibel OpenAI-profiel |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | OpenClaw ingebedde runtime      | Geselecteerd `openai`-profiel |

    <Note>
    `openai/*`-agentmodellen gebruiken de Codex-app-server-harness. Als je API-key-
    auth voor een agentmodel wilt gebruiken, maak je een Codex-compatibel API-key-profiel aan en orden je
    dit met `auth.order.openai`; `OPENAI_API_KEY` blijft de directe fallback voor
    niet-agent OpenAI API-oppervlakken. Voer `openclaw doctor --fix` uit om oudere
    legacy Codex-auth-volgorde-items te migreren.
    </Note>

    ### Config-voorbeeld

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Als je het huidige Instant-model van ChatGPT via de OpenAI API wilt proberen, stel je het model
    in op `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` is een bewegende alias. OpenAI documenteert dit als het nieuwste Instant-
    model dat in ChatGPT wordt gebruikt en raadt `gpt-5.5` aan voor productiegebruik van de API, dus
    behoud `openai/gpt-5.5` als de stabiele standaard, tenzij je expliciet dat
    aliasgedrag wilt. De alias accepteert momenteel alleen `medium` tekstuitgebreidheid, dus
    OpenClaw normaliseert incompatibele OpenAI-overschrijvingen voor tekstuitgebreidheid voor dit
    model.

    <Warning>
    OpenClaw stelt `gpt-5.3-codex-spark` **niet** beschikbaar via de directe OpenAI API-key-route. Het is alleen beschikbaar via Codex-abonnementscatalogusitems wanneer je aangemelde account dit beschikbaar stelt.
    </Warning>

  </Tab>

  <Tab title="Codex-abonnement">
    **Beste voor:** het gebruiken van je ChatGPT/Codex-abonnement met native Codex-app-serveruitvoering in plaats van een afzonderlijke API-key. Codex-cloud vereist aanmelding bij ChatGPT.

    <Steps>
      <Step title="Voer Codex OAuth uit">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Of voer OAuth direct uit:

        ```bash
        openclaw models auth login --provider openai
        ```

        Voeg voor headless setups of setups die slecht met callbacks werken `--device-code` toe om je aan te melden met een ChatGPT-device-code-flow in plaats van de localhost-browsercallback:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Gebruik de canonieke OpenAI-modelroute">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Er is geen runtime-config vereist voor het standaardpad. OpenAI-agentbeurten
        selecteren automatisch de native Codex-app-serverruntime, en OpenClaw
        installeert of repareert de gebundelde Codex-Plugin wanneer deze route wordt gekozen.
      </Step>
      <Step title="Controleer of Codex-auth beschikbaar is">
        ```bash
        openclaw models list --provider openai
        ```

        Nadat de gateway actief is, stuur je `/codex status` of `/codex models`
        in de chat om de native app-serverruntime te controleren.
      </Step>
    </Steps>

    ### Routeoverzicht

    | Model-ref | Runtime-config | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | weggelaten / provider/model `agentRuntime.id: "codex"` | Native Codex-app-server-harness | Codex-aanmelding of geordend `openai`-auth-profiel |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | Ingebedde OpenClaw-runtime met intern Codex-auth-transport | Geselecteerd `openai` OAuth-profiel |
    | legacy Codex GPT-5.5-ref | gerepareerd door doctor | Legacy route herschreven naar `openai/gpt-5.5` | Gemigreerd OpenAI OAuth-profiel |
    | `codex-cli/gpt-5.5` | gerepareerd door doctor | Legacy CLI-route herschreven naar `openai/gpt-5.5` | Codex-app-server-auth |

    <Warning>
    Geef de voorkeur aan `openai/gpt-5.5` voor nieuwe agent-config met abonnementsbacking. Oudere
    legacy Codex GPT-refs zijn legacy OpenClaw-routes, niet het native Codex-runtimepad;
    voer `openclaw doctor --fix` uit wanneer je ze wilt migreren naar canonieke
    `openai/*`-refs. `gpt-5.3-codex-spark` blijft beperkt tot accounts waarvan de
    Codex-abonnementscatalogus dat model adverteert; directe OpenAI API-key- en
    Azure-refs ervoor blijven onderdrukt.
    </Warning>

    <Note>
    Het legacy Codex-modelprefix is legacy config die door doctor wordt gerepareerd. Voor
    de gebruikelijke setup met abonnement plus native runtime meld je je aan met Codex-auth,
    maar houd je de model-ref op `openai/gpt-5.5`. Nieuwe config moet de OpenAI-
    auth-volgorde voor agents onder `auth.order.openai` plaatsen; doctor migreert oudere
    legacy Codex-auth-volgorde-items.
    </Note>

    ### Config-voorbeeld

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

    Met een API-key-back-up houd je het model op `openai/gpt-5.5` en plaats je de
    auth-volgorde onder `openai`. OpenClaw probeert eerst het abonnement en daarna
    de API-key, terwijl het op de Codex-harness blijft:

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding importeert geen OAuth-materiaal meer uit `~/.codex`. Meld je aan met browser-OAuth (standaard) of de device-code-flow hierboven — OpenClaw beheert de resulterende referenties in zijn eigen auth-store voor agents.
    </Note>

    ### Codex OAuth-routering controleren en herstellen

    Gebruik deze opdrachten om te zien welk model, welke runtime en welke auth-route je standaard-
    agent gebruikt:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Voeg voor een specifieke agent `--agent <id>` toe:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Als een oudere config nog legacy Codex GPT-refs of een verouderde OpenAI-runtime-
    sessiepin zonder expliciete runtime-config heeft, repareer deze dan:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Als `models auth list --provider openai` geen bruikbaar profiel toont, meld je dan
    opnieuw aan:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Gebruik `--profile-id` wanneer je meerdere Codex OAuth-aanmeldingen in dezelfde
    agent wilt en deze later wilt beheren via auth-volgorde of `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` is de modelroute voor OpenAI-agentbeurten via Codex. Voer
    `openclaw doctor --fix` uit om oudere legacy OpenAI Codex-prefix-profiel-id's en
    volgorde-items te migreren voordat je vertrouwt op profielordening.

    ### Statusindicator

    Chat `/status` toont welke modelruntime actief is voor de huidige sessie.
    De gebundelde Codex-app-server-harness verschijnt als `Runtime: OpenAI Codex` voor
    OpenAI-agentmodelbeurten. Verouderde OpenAI-runtime-sessiepins worden naar Codex gerepareerd, tenzij
    config OpenClaw expliciet pint.

    ### Doctor-waarschuwing

    Als legacy Codex-modelrefs of verouderde OpenAI-runtimepins in config of
    sessiestatus blijven staan, herschrijft `openclaw doctor --fix` ze naar `openai/*` met de
    Codex-runtime, tenzij OpenClaw expliciet is geconfigureerd.

    ### Contextvensterlimiet

    OpenClaw behandelt modelmetadata en de runtimecontextlimiet als afzonderlijke waarden.

    Voor `openai/gpt-5.5` via de Codex OAuth-catalogus:

    - Native `contextWindow`: `1000000`
    - Standaard runtime-`contextTokens`-limiet: `272000`

    De kleinere standaardlimiet heeft in de praktijk betere latency- en kwaliteitskenmerken. Overschrijf deze met `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
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

    OpenClaw gebruikt upstream Codex-catalogusmetadata voor `gpt-5.5` wanneer deze
    aanwezig is. Als live Codex-discovery de `gpt-5.5`-rij weglaat terwijl
    het account is geauthenticeerd, synthetiseert OpenClaw die OAuth-modelrij zodat
    cron-, subagent- en geconfigureerde standaardmodelruns niet mislukken met
    `Unknown model`.

  </Tab>
</Tabs>

## Native Codex-app-server-auth

De native Codex-app-server-harness gebruikt `openai/*`-modelrefs plus weggelaten
runtime-config of provider/model `agentRuntime.id: "codex"`, maar de auth ervan is
nog steeds accountgebaseerd. OpenClaw selecteert auth in deze volgorde:

1. Geordende OpenAI-auth-profielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Voer `openclaw doctor --fix` uit om oudere
   legacy Codex-auth-profiel-id's en legacy Codex-auth-volgorde te migreren.
2. Het bestaande account van de app-server, zoals een lokale Codex CLI ChatGPT-aanmelding.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer de app-server geen account rapporteert en nog steeds
   OpenAI-auth vereist.

Dat betekent dat een lokale ChatGPT/Codex-abonnementsaanmelding niet wordt vervangen alleen
omdat het gatewayproces ook `OPENAI_API_KEY` heeft voor directe OpenAI-modellen
of embeddings. Env-API-key-fallback is alleen het lokale stdio-pad zonder account; deze
wordt niet naar WebSocket-app-serververbindingen gestuurd. Wanneer een abonnementachtig Codex-
profiel is geselecteerd, houdt OpenClaw ook `CODEX_API_KEY` en `OPENAI_API_KEY`
uit het gespawnde stdio-app-server-child en stuurt het de geselecteerde referenties
via de login-RPC van de app-server. Wanneer dat abonnementsprofiel wordt geblokkeerd door een
Codex-gebruikslimiet, kan OpenClaw roteren naar het volgende geordende `openai:*` API-key-
profiel zonder het geselecteerde model te wijzigen of uit de Codex-
harness te vallen. Zodra de reset-tijd van het abonnement is verstreken, komt het abonnementsprofiel
weer in aanmerking.

## Afbeeldingen genereren

De gebundelde `openai`-Plugin registreert afbeeldingsgeneratie via de tool `image_generate`.
Deze ondersteunt zowel afbeeldingsgeneratie met een OpenAI API-key als Codex OAuth-afbeeldings-
generatie via dezelfde model-ref `openai/gpt-image-2`.

| Mogelijkheid              | OpenAI API-key                    | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model-ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth-aanmelding        |
| Transport                 | OpenAI Images API                  | Codex Responses-backend              |
| Max. afbeeldingen per aanvraag | 4                              | 4                                    |
| Bewerkingsmodus           | Ingeschakeld (tot 5 referentieafbeeldingen) | Ingeschakeld (tot 5 referentieafbeeldingen) |
| Grootte-overschrijvingen  | Ondersteund, inclusief 2K/4K-formaten | Ondersteund, inclusief 2K/4K-formaten |
| Beeldverhouding / resolutie | Niet doorgestuurd naar OpenAI Images API | Gekoppeld aan een ondersteund formaat wanneer veilig |

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

`gpt-image-2` is de standaard voor zowel OpenAI-tekst-naar-afbeelding-generatie als het
bewerken van afbeeldingen. `gpt-image-1.5`, `gpt-image-1` en `gpt-image-1-mini` blijven bruikbaar als
expliciete modeloverschrijvingen. Gebruik `openai/gpt-image-1.5` voor PNG/WebP-uitvoer
met transparante achtergrond; de huidige `gpt-image-2`-API weigert
`background: "transparent"`.

Voor een verzoek met transparante achtergrond moeten agents `image_generate` aanroepen met
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` of `"webp"`, en
`background: "transparent"`; de oudere provideroptie `openai.background` wordt
nog steeds geaccepteerd. OpenClaw beschermt ook de publieke OpenAI- en
OpenAI Codex-OAuth-routes door standaard transparante verzoeken voor `openai/gpt-image-2`
te herschrijven naar `gpt-image-1.5`; Azure- en aangepaste OpenAI-compatibele eindpunten behouden
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
`openclaw infer image edit` wanneer je begint vanaf een invoerbestand.
`--openai-background` blijft beschikbaar als OpenAI-specifieke alias.
Gebruik `--quality low|medium|high|auto` wanneer je de kwaliteit en kosten van
OpenAI Images moet regelen. Gebruik `--openai-moderation low|auto` om OpenAI's
providerspecifieke moderatiehint door te geven vanuit `image generate` of `image edit`.

Voor ChatGPT/Codex-OAuth-installaties behoud je dezelfde `openai/gpt-image-2`-ref. Wanneer een
`openai`-OAuth-profiel is geconfigureerd, lost OpenClaw dat opgeslagen OAuth-
toegangstoken op en verstuurt het afbeeldingsverzoeken via de Codex Responses-backend. Het
probeert niet eerst `OPENAI_API_KEY` en valt voor dat verzoek niet stilzwijgend terug op een API-sleutel.
Configureer `models.providers.openai` expliciet met een API-sleutel,
aangepaste basis-URL of Azure-eindpunt wanneer je in plaats daarvan de directe OpenAI Images API-route wilt gebruiken.
Als dat aangepaste afbeeldingeindpunt zich op een vertrouwd LAN-/privéadres bevindt, stel dan ook
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in; OpenClaw houdt
privé/interne OpenAI-compatibele afbeeldingeindpunten geblokkeerd tenzij deze opt-in
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
| Modi              | Tekst-naar-video, afbeelding-naar-video, bewerking van één video                  |
| Referentie-invoer | 1 afbeelding of 1 video                                                           |
| Grootte-overschrijvingen | Ondersteund voor tekst-naar-video en afbeelding-naar-video                 |
| Andere overschrijvingen | `aspectRatio`, `resolution`, `audio`, `watermark` worden genegeerd met een toolwaarschuwing |

OpenAI-verzoeken voor afbeelding-naar-video gebruiken `POST /v1/videos` met een afbeelding
`input_reference`. Bewerkingen van één video gebruiken `POST /v1/videos/edits` met de
geüploade video in het veld `video`.

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

OpenClaw voegt een gedeelde GPT-5-promptbijdrage toe voor runs uit de GPT-5-familie op door OpenClaw samengestelde promptoppervlakken. Deze wordt toegepast op basis van model-id, dus OpenClaw-/providerroutes zoals verouderde refs van voor reparatie (verouderde Codex GPT-5.5-ref), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` en andere compatibele GPT-5-refs krijgen dezelfde overlay. Oudere GPT-4.x-modellen niet.

De gebundelde native Codex-harness ontvangt deze OpenClaw GPT-5-overlay niet via Codex app-server developer instructions. Native Codex behoudt door Codex beheerd basis-, model- en projectdocgedrag, terwijl OpenClaw de ingebouwde persoonlijkheid van Codex uitschakelt voor native threads, zodat persoonlijkheidsbestanden in de agentwerkruimte gezaghebbend blijven. OpenClaw draagt alleen runtimecontext bij, zoals kanaallevering, dynamische OpenClaw-tools, ACP-delegatie, werkruimtecontext en OpenClaw Skills.

De GPT-5-bijdrage voegt een gelabeld gedragscontract toe voor persoonlijkheidspersistentie, uitvoeringsveiligheid, tooldiscipline, uitvoervorm, voltooiingscontroles en verificatie op overeenkomende door OpenClaw samengestelde prompts. Kanaalspecifiek antwoord- en stilberichtgedrag blijft in de gedeelde OpenClaw-systeemprompt en het beleid voor uitgaande levering. De vriendelijke interactiestijllaag is afzonderlijk en configureerbaar.

| Waarde                 | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (standaard) | Schakel de vriendelijke interactiestijllaag in |
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
Waarden zijn runtime niet hoofdlettergevoelig, dus `"Off"` en `"off"` schakelen allebei de vriendelijke stijllaag uit.
</Tip>

<Note>
Verouderde `plugins.entries.openai.config.personality` wordt nog steeds gelezen als compatibiliteitsfallback wanneer de gedeelde instelling `agents.defaults.promptOverlays.gpt5.personality` niet is ingesteld.
</Note>

## Stem en spraak

<AccordionGroup>
  <Accordion title="Spraaksynthese (TTS)">
    De gebundelde `openai`-Plugin registreert spraaksynthese voor het oppervlak `messages.tts`.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stem | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Snelheid | `messages.tts.providers.openai.speed` | (niet ingesteld) |
    | Instructies | `messages.tts.providers.openai.instructions` | (niet ingesteld, alleen `gpt-4o-mini-tts`) |
    | Indeling | `messages.tts.providers.openai.responseFormat` | `opus` voor spraaknotities, `mp3` voor bestanden |
    | API-sleutel | `messages.tts.providers.openai.apiKey` | Valt terug op `OPENAI_API_KEY` |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Extra body | `messages.tts.providers.openai.extraBody` / `extra_body` | (niet ingesteld) |

    Beschikbare modellen: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Beschikbare stemmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wordt na de door OpenClaw gegenereerde velden samengevoegd in de aanvraag-JSON voor `/audio/speech`, dus gebruik dit voor OpenAI-compatibele eindpunten die aanvullende sleutels zoals `lang` vereisen. Prototypesleutels worden genegeerd.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Stel `OPENAI_TTS_BASE_URL` in om de TTS-basis-URL te overschrijven zonder het chat-API-eindpunt te beïnvloeden. OpenAI TTS en Realtime-stem worden allebei geconfigureerd via een OpenAI Platform API-sleutel; installaties met alleen OAuth kunnen nog steeds door Codex ondersteunde chatmodellen gebruiken, maar geen OpenAI live terugspraak.
    </Note>

  </Accordion>

  <Accordion title="Spraak-naar-tekst">
    De gebundelde `openai`-Plugin registreert batchgewijze spraak-naar-tekst via
    OpenClaw's transcriptieoppervlak voor mediabegrip.

    - Standaardmodel: `gpt-4o-transcribe`
    - Eindpunt: OpenAI REST `/v1/audio/transcriptions`
    - Invoerpad: multipart upload van audiobestand
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

    Taal- en prompthints worden doorgestuurd naar OpenAI wanneer ze worden geleverd door de
    gedeelde audiomediaconfiguratie of per-call transcriptieverzoek.

  </Accordion>

  <Accordion title="Realtime-transcriptie">
    De gebundelde `openai`-Plugin registreert realtime-transcriptie voor de Voice Call-Plugin.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Taal | `...openai.language` | (niet ingesteld) |
    | Prompt | `...openai.prompt` | (niet ingesteld) |
    | Stilte-duur | `...openai.silenceDurationMs` | `800` |
    | VAD-drempel | `...openai.vadThreshold` | `0.5` |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, of `openai` OAuth | API-sleutels verbinden rechtstreeks; OAuth maakt een Realtime-transcriptieclientgeheim aan |

    <Note>
    Gebruikt een WebSocket-verbinding naar `wss://api.openai.com/v1/realtime` met G.711 u-law (`g711_ulaw` / `audio/pcmu`)-audio. Wanneer alleen `openai` OAuth is geconfigureerd, maakt de Gateway een tijdelijk Realtime-transcriptieclientgeheim aan voordat de WebSocket wordt geopend. Deze streamingprovider is voor het realtime-transcriptiepad van Voice Call; Discord-spraak neemt momenteel korte segmenten op en gebruikt in plaats daarvan het batchtranscriptiepad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-stem">
    De gebundelde `openai`-Plugin registreert realtime-stem voor de Voice Call-Plugin.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Stem | `...openai.voice` | `alloy` |
    | Temperatuur (Azure-deploymentbrug) | `...openai.temperature` | `0.8` |
    | VAD-drempel | `...openai.vadThreshold` | `0.5` |
    | Stilte-duur | `...openai.silenceDurationMs` | `500` |
    | Prefix-padding | `...openai.prefixPaddingMs` | `300` |
    | Redeneerinspanning | `...openai.reasoningEffort` | (niet ingesteld) |
    | Auth | `openai` API-key auth profile, `...openai.apiKey`, of `OPENAI_API_KEY` | OpenAI Platform API-sleutel vereist; OpenAI OAuth configureert geen Realtime-stem |

    Beschikbare ingebouwde Realtime-stemmen voor `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI raadt `marin` en `cedar` aan voor de beste Realtime-kwaliteit. Dit
    is een afzonderlijke set van de tekst-naar-spraakstemmen hierboven; ga er niet van uit dat een TTS-
    stem zoals `fable`, `nova` of `onyx` geldig is voor Realtime-sessies.

    <Note>
    Backend OpenAI realtime bridges gebruiken de GA Realtime WebSocket-sessievorm, die `session.temperature` niet accepteert. Azure OpenAI-deployments blijven beschikbaar via `azureEndpoint` en `azureDeployment` en behouden de deployment-compatibele sessievorm. Ondersteunt bidirectionele toolaanroepen en G.711 u-law-audio.
    </Note>

    <Note>
    Realtime-stem wordt geselecteerd wanneer de sessie wordt aangemaakt. OpenAI staat toe dat de meeste
    sessievelden later veranderen, maar de stem kan niet worden gewijzigd nadat het
    model audio heeft uitgezonden in die sessie. OpenClaw stelt momenteel de
    ingebouwde Realtime-stem-id's beschikbaar als strings.
    </Note>

    <Note>
    Control UI Talk gebruikt realtime browsersessies van OpenAI met een door de Gateway
    aangemaakt tijdelijk clientgeheim en een directe browser-WebRTC SDP-uitwisseling met de
    OpenAI Realtime API. De Gateway maakt dat clientgeheim aan met het geselecteerde
    `openai` API-key-authprofiel of de geconfigureerde OpenAI Platform-API-key. Gateway
    relay en Voice Call-backend realtime WebSocket-bridges gebruiken hetzelfde
    authpad met alleen API-key voor native OpenAI-eindpunten. Live verificatie door maintainers
    is beschikbaar met
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    de OpenAI-trajecten verifiëren zowel de backend WebSocket-bridge als de browser-
    WebRTC SDP-uitwisseling zonder geheimen te loggen.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-eindpunten

De gebundelde `openai`-provider kan een Azure OpenAI-resource gebruiken voor het genereren van afbeeldingen
door de basis-URL te overschrijven. Op het pad voor het genereren van afbeeldingen detecteert OpenClaw
Azure-hostnamen op `models.providers.openai.baseUrl` en schakelt het automatisch over naar
de aanvraagvorm van Azure.

<Note>
Realtime spraak gebruikt een afzonderlijk configuratiepad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
en wordt niet beïnvloed door `models.providers.openai.baseUrl`. Zie het **Realtime
spraak**-accordion onder [Spraak en stem](#voice-and-speech) voor de Azure-
instellingen.
</Note>

Gebruik Azure OpenAI wanneer:

- Je al een Azure OpenAI-abonnement, quota of enterpriseovereenkomst hebt
- Je regionale gegevensresidentie of compliance-controls nodig hebt die Azure biedt
- Je verkeer binnen een bestaande Azure-tenant wilt houden

### Configuratie

Voor Azure-afbeeldingsgeneratie via de gebundelde `openai`-provider wijs je
`models.providers.openai.baseUrl` naar je Azure-resource en stel je `apiKey` in op
de Azure OpenAI-key (niet een OpenAI Platform-key):

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

OpenClaw herkent deze Azure-hostsuffixen voor de Azure-route voor het genereren van afbeeldingen:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Voor aanvragen voor het genereren van afbeeldingen op een herkende Azure-host doet OpenClaw het volgende:

- Verstuurt de `api-key`-header in plaats van `Authorization: Bearer`
- Gebruikt implementatiegerichte paden (`/openai/deployments/{deployment}/...`)
- Voegt `?api-version=...` toe aan elke aanvraag
- Gebruikt een standaard aanvraag-time-out van 600 seconden voor Azure-aanroepen voor het genereren van afbeeldingen.
  `timeoutMs`-waarden per aanroep overschrijven deze standaard nog steeds.

Andere basis-URL's (publieke OpenAI, OpenAI-compatibele proxy's) behouden de standaard
OpenAI-aanvraagvorm voor afbeeldingen.

<Note>
Azure-routering voor het afbeeldingsgeneratiepad van de `openai`-provider vereist
OpenClaw 2026.4.22 of hoger. Eerdere versies behandelen elke aangepaste
`openai.baseUrl` als het publieke OpenAI-eindpunt en falen tegen Azure-
afbeeldingsimplementaties.
</Note>

### API-versie

Stel `AZURE_OPENAI_API_VERSION` in om een specifieke Azure-preview- of GA-versie
vast te zetten voor het Azure-pad voor het genereren van afbeeldingen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

De standaardwaarde is `2024-12-01-preview` wanneer de variabele niet is ingesteld.

### Modelnamen zijn implementatienamen

Azure OpenAI koppelt modellen aan implementaties. Voor Azure-aanvragen voor het genereren van afbeeldingen
die via de gebundelde `openai`-provider worden gerouteerd, moet het veld `model` in OpenClaw
de **Azure-implementatienaam** zijn die je in de Azure-portal hebt geconfigureerd, niet
de publieke OpenAI-model-id.

Als je een implementatie maakt met de naam `gpt-image-2-prod` die `gpt-image-2` levert:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dezelfde regel voor implementatienamen geldt voor aanroepen voor het genereren van afbeeldingen die via
de gebundelde `openai`-provider worden gerouteerd.

### Regionale beschikbaarheid

Azure-afbeeldingsgeneratie is momenteel alleen beschikbaar in een subset van regio's
(bijvoorbeeld `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controleer de actuele regiolijst van Microsoft voordat je een
implementatie maakt, en bevestig dat het specifieke model in jouw regio wordt aangeboden.

### Parameterverschillen

Azure OpenAI en publieke OpenAI accepteren niet altijd dezelfde afbeeldingsparameters.
Azure kan opties weigeren die publieke OpenAI toestaat (bijvoorbeeld bepaalde
`background`-waarden op `gpt-image-2`) of ze alleen beschikbaar maken op specifieke modelversies.
Deze verschillen komen van Azure en het onderliggende model, niet van OpenClaw.
Als een Azure-aanvraag faalt met een validatiefout, controleer dan de
parameterset die wordt ondersteund door jouw specifieke implementatie en API-versie in de
Azure-portal.

<Note>
Azure OpenAI gebruikt native transport en compatgedrag, maar ontvangt niet
de verborgen attributieheaders van OpenClaw — zie het accordion **Native versus OpenAI-compatibele
routes** onder [Geavanceerde configuratie](#advanced-configuration).

Voor chat- of Responses-verkeer op Azure (naast het genereren van afbeeldingen) gebruik je de
onboardingflow of een speciale Azure-providerconfiguratie — `openai.baseUrl` alleen
neemt de Azure API-/authvorm niet over. Er bestaat een afzonderlijke
`azure-openai-responses/*`-provider; zie
het accordion Server-side Compaction hieronder.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Transport (WebSocket versus SSE)">
    OpenClaw gebruikt WebSocket-first met SSE-terugval (`"auto"`) voor `openai/*`.

    In de modus `"auto"` doet OpenClaw het volgende:
    - Probeert één vroege WebSocket-fout opnieuw voordat het terugvalt naar SSE
    - Markeert WebSocket na een fout ongeveer 60 seconden als gedegradeerd en gebruikt SSE tijdens de afkoelperiode
    - Voegt stabiele headers voor sessie- en beurtidentiteit toe voor nieuwe pogingen en herverbindingen
    - Normaliseert gebruikstellers (`input_tokens` / `prompt_tokens`) over transportvarianten

    | Waarde | Gedrag |
    |-------|----------|
    | `"auto"` (standaard) | Eerst WebSocket, SSE-terugval |
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
    - [Realtime API met WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API-antwoorden (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Snelle modus">
    OpenClaw biedt een gedeelde schakelaar voor snelle modus voor `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wanneer dit is ingeschakeld, koppelt OpenClaw snelle modus aan prioriteitsverwerking van OpenAI (`service_tier = "priority"`). Bestaande `service_tier`-waarden blijven behouden, en snelle modus herschrijft `reasoning` of `text.verbosity` niet. `fastMode: "auto"` start nieuwe modelaanroepen snel tot aan de automatische afkapwaarde, en start latere nieuwe pogingen, terugvallen, toolresultaat- of vervolgaanroepen daarna zonder snelle modus. De afkapwaarde is standaard 60 seconden; stel `params.fastAutoOnSeconds` in op het actieve model om dit te wijzigen.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Sessie-overschrijvingen gaan vóór configuratie. Door de sessie-overschrijving in de Sessions UI te wissen, keert de sessie terug naar de geconfigureerde standaard.
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
    Voor directe OpenAI Responses-modellen (`openai/*` op `api.openai.com`) schakelt de OpenClaw-streamwrapper van de OpenAI-Plugin automatisch server-side Compaction in:

    - Dwingt `store: true` af (tenzij modelcompat `supportsStore: false` instelt)
    - Injecteert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standaard `compact_threshold`: 70% van `contextWindow` (of `80000` wanneer niet beschikbaar)

    Dit geldt voor het ingebouwde OpenClaw-runtimepad en voor OpenAI-providerhooks die door ingebedde runs worden gebruikt. De native Codex app-server-harness beheert zijn eigen context via Codex en wordt geconfigureerd door de standaard agentroute van OpenAI of door provider-/modelruntimebeleid.

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
    `responsesServerCompaction` regelt alleen de injectie van `context_management`. Directe OpenAI Responses-modellen dwingen nog steeds `store: true` af, tenzij compat `supportsStore: false` instelt.
    </Note>

  </Accordion>

  <Accordion title="Strikte agentische GPT-modus">
    Voor runs uit de GPT-5-familie op `openai/*` kan OpenClaw een strikter ingebed uitvoeringscontract gebruiken:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Met `strict-agentic` doet OpenClaw het volgende:
    - Schakelt `update_plan` automatisch in voor omvangrijk werk
    - Probeert structureel lege of alleen-redenerende beurten opnieuw met een vervolg met zichtbaar antwoord
    - Gebruikt expliciete plan-events van de harness wanneer de geselecteerde harness die biedt

    OpenClaw classificeert proza van de assistent niet om te beslissen of een beurt een plan, voortgangsupdate of definitief antwoord is.

    <Note>
    Alleen van toepassing op OpenAI- en Codex-runs uit de GPT-5-familie. Andere providers en oudere modelfamilies behouden standaardgedrag.
    </Note>

  </Accordion>

  <Accordion title="Native versus OpenAI-compatibele routes">
    OpenClaw behandelt directe OpenAI-, Codex- en Azure OpenAI-eindpunten anders dan generieke OpenAI-compatibele `/v1`-proxy's:

    **Native routes** (`openai/*`, Azure OpenAI):
    - Behouden `reasoning: { effort: "none" }` alleen voor modellen die de OpenAI-inspanning `none` ondersteunen
    - Laten uitgeschakelde redenering weg voor modellen of proxy's die `reasoning.effort: "none"` weigeren
    - Stellen toolschema's standaard in op strikte modus
    - Voegen verborgen attributieheaders alleen toe op geverifieerde native hosts
    - Behouden OpenAI-specifieke aanvraagvorming (`service_tier`, `store`, redeneringscompat, prompt-cache-hints)

    **Proxy-/compatibele routes:**
    - Gebruik losser compatibiliteitsgedrag
    - Verwijder Completions `store` uit niet-native `openai-completions`-payloads
    - Accepteer geavanceerde `params.extra_body`/`params.extraBody` doorgeef-JSON voor OpenAI-compatibele Completions-proxy's
    - Accepteer `params.chat_template_kwargs` voor OpenAI-compatibele Completions-proxy's zoals vLLM
    - Dwing geen strikte toolschema's of alleen-native headers af

    Azure OpenAI gebruikt native transport en compatibiliteitsgedrag, maar ontvangt de verborgen attributieheaders niet.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Image generation" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor beeldtools en providerselectie.
  </Card>
  <Card title="Video generation" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="OAuth and auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
