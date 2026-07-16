---
read_when:
    - Je wilt OpenAI-modellen gebruiken in OpenClaw
    - Je wilt Codex-abonnementsauthenticatie in plaats van API-sleutels
    - Je hebt strikter uitvoeringsgedrag voor GPT-5-agenten nodig
summary: Gebruik OpenAI via API-sleutels of een Codex-abonnement in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T16:15:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw gebruikt één provider-id, `openai`, voor zowel directe authenticatie met een API-sleutel als
ChatGPT/Codex-abonnementsauthenticatie. `openai/*` is de canonieke modelroute.
Voor ingebedde agentbeurten waarbij het runtimebeleid niet is ingesteld of `auto` is, bepalen de
routegegevens van OpenAI of OpenClaw impliciet de gebundelde Codex-app-serverruntime
mag selecteren. Alleen het voorvoegsel `openai/*` selecteert geen runtime.

- **Agentmodellen** - `openai/*` via de runtime die is geselecteerd door expliciete
  `agentRuntime`-configuratie of het impliciete routebeleid van OpenAI. Meld je aan met Codex-
  authenticatie om een ChatGPT/Codex-abonnement te gebruiken, of configureer een authenticatieprofiel
  met een API-sleutel wanneer je facturering op basis van een sleutel wilt.
- **OpenAI-API's voor niet-agenten** - directe toegang tot het OpenAI Platform, gefactureerd per gebruik,
  via `OPENAI_API_KEY` of een `openai`-authenticatieprofiel met een API-sleutel.
- **Verouderde configuratie** - verwijzingen naar `codex/*` en `openai-codex/*` worden door
  `openclaw doctor --fix` hersteld naar `openai/*` plus modelgebonden
  `agentRuntime.id: "codex"`.

OpenAI ondersteunt expliciet het gebruik van abonnements-OAuth in externe tools en
workflows zoals OpenClaw.

## Gebruiks- en kostentracking

OpenClaw houdt het abonnementsquotum en de facturering van de Platform-API gescheiden:

- ChatGPT/Codex OAuth toont het abonnementsplan, de quotumperiodes en het tegoedsaldo.
- `OPENAI_ADMIN_KEY` toont in **Gebruik** van de Control UI 30 dagen aan door de provider gerapporteerde organisatiekosten en gebruik van voltooiingen, inclusief dagelijkse uitgaven, totale aantallen aanvragen/tokens, meestgebruikte modellen en kostencategorieën.
- `OPENAI_PROJECT_ID` beperkt de geschiedenis van de Admin API optioneel tot één project.
- OpenClaw verzendt `OPENAI_API_KEY` of een `openai`-inferentieprofiel nooit naar organisatie-API's; die referenties kunnen bij aangepaste, Azure- of agentlokale eindpunten horen.

Een expliciete Admin-sleutel heeft voorrang op OAuth. Door de provider gerapporteerde geschiedenis wordt niet samengevoegd met de uit sessies afgeleide geschatte kosten van OpenClaw; deze kan API-activiteit van andere clients en factureringscorrecties aan de providerzijde bevatten.

De documentatie van OpenAI over het [dashboard voor API-gebruik](https://help.openai.com/en/articles/10478918) beschrijft de vereisten voor organisatie-eigenaars en de expliciete toestemming voor het Usage Dashboard om gebruiksgegevens te bekijken.

Provider, model, runtime en kanaal zijn afzonderlijke lagen. Als deze labels
door elkaar raken, lees dan [Agentruntimes](/nl/concepts/agent-runtimes) voordat je
de configuratie wijzigt.

## Snelle keuze

| Doel                                              | Gebruik                                                                | Opmerkingen                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex-abonnement, systeemeigen Codex-runtime  | `openai/gpt-5.6-sol`                                               | Nieuwe abonnementsconfiguratie; meld je aan met Codex-authenticatie.                  |
| Directe facturering via API-sleutel voor agentbeurten            | `openai/gpt-5.6` plus een geordend authenticatieprofiel met API-sleutel              | Nieuwe configuratie met API-sleutel; de kale directe-API-id wordt omgezet naar Sol.        |
| Een exacte GPT-5.6-laag kiezen                      | `openai/gpt-5.6-sol`, `-terra` of `-luna`                         | Controleer `models list` voor de lagen die voor dit account beschikbaar zijn.        |
| Account zonder toegang tot GPT-5.6                    | `openai/gpt-5.5`                                                   | Expliciete herstelkeuze; OpenClaw schakelt niet stilzwijgend terug.     |
| Directe facturering via API-sleutel, expliciete OpenClaw-runtime | `openai/gpt-5.6` plus provider/model `agentRuntime.id: "openclaw"` | Selecteer een normaal `openai`-authenticatieprofiel met API-sleutel.                           |
| Nieuwste ChatGPT Instant-modelalias                | `openai/chat-latest`                                               | Alleen directe API-sleutel; veranderlijke alias, niet de stabiele standaard.          |
| Afbeeldingen genereren of bewerken                       | `openai/gpt-image-2`                                               | Werkt met `OPENAI_API_KEY` of Codex OAuth.                         |
| Afbeeldingen met transparante achtergrond                     | `openai/gpt-image-1.5`                                             | Stel `outputFormat` in op `png` of `webp` en `background=transparent`. |

## Namenoverzicht

| Naam die je ziet                            | Laag             | Betekenis                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Providervoorvoegsel   | Canonieke OpenAI-modelroute; routegegevens bepalen de impliciete runtime.                |
| `codex`-plugin                          | Plugin            | Gebundelde plugin die de systeemeigen Codex-app-serverruntime en `/codex`-chatbediening biedt. |
| provider/model `agentRuntime.id: codex` | Agentruntime     | Dwing de systeemeigen Codex-app-serverharnas af voor overeenkomende ingebedde beurten.                   |
| `/codex ...`                            | Chatopdrachtenset  | Koppel/beheer Codex-app-serverthreads vanuit een gesprek.                               |
| `runtime: "acp", agentId: "codex"`      | ACP-sessieroute | Expliciet terugvalpad dat Codex via ACP/acpx uitvoert.                                 |

## Impliciete agentruntime

Wanneer het provider/model-beleid `agentRuntime` niet is ingesteld of `auto` is, kiest het
providergebonden routebeleid van OpenAI de impliciete runtime op basis van het effectieve
eindpunt en de adapter:

| Effectieve routegegevens                                                                                                                                                  | Impliciete runtime      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Exact officieel Platform-HTTPS-eindpunt met `openai-responses`, of exact officieel ChatGPT-HTTPS-eindpunt met `openai-chatgpt-responses`; geen zelf opgegeven aanvraagoverschrijving | Codex kan worden geselecteerd |
| Zelf opgegeven `openai-completions`-adapter                                                                                                                                  | OpenClaw              |
| Aangepast eindpunt                                                                                                                                                        | OpenClaw              |
| Expliciet exact officieel eindpunt dat HTTP gebruikt                                                                                                                            | Geweigerd              |
| Route met een zelf opgegeven provider/model-aanvraagoverschrijving                                                                                                                 | OpenClaw              |

Een expliciete niet-standaard provider/model-instelling `agentRuntime.id` blijft bepalend.
`agentRuntime.id: "openclaw"` houdt bijvoorbeeld een route die anders voor Codex in aanmerking komt
op OpenClaw, terwijl `agentRuntime.id: "codex"` Codex vereist en
gesloten faalt wanneer de effectieve route niet als Codex-compatibel is verklaard.
Runtimeselectie verandert het referentietype of de facturering niet: authenticatie met een
Platform-API-sleutel en ChatGPT/Codex-abonnementsauthenticatie blijven gescheiden.

`openclaw doctor --fix` migreert verouderde modelverwijzingen naar `codex/*` en `openai-codex/*`,
verouderde Codex-authenticatieprofiel-id's en verouderde Codex-authenticatievolgorde-items naar de
canonieke route `openai`. Gemigreerde modelverwijzingen krijgen modelgebonden
`agentRuntime.id: "codex"`; gebruik `auth.order.openai` voor nieuwe authenticatievolgordeconfiguratie.

<Note>
Een nieuwe OpenAI-configuratie stelt alleen een primair GPT-5.6-model in wanneer er geen primair model is
geconfigureerd. Het toevoegen of vernieuwen van OpenAI-authenticatie behoudt een bestaande expliciete
selectie, inclusief `openai/gpt-5.5`, tenzij je expliciet
`models auth login --set-default` of `models set` gebruikt. Gebruik alleen een authenticatieprofiel
met een API-sleutel wanneer je API-sleutelauthenticatie voor een agentmodel wilt.
</Note>

## Beperkte preview van GPT-5.6

OpenClaw herkent de exacte model-id's `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` en `openai/gpt-5.6-luna`. Alle drie bieden in de huidige catalogus
`xhigh`- en `max`-redenering. OpenAI beschrijft Sol als
de topklasse, Terra als de uitgebalanceerde klasse en Luna als de snelle,
goedkopere klasse. Zie de
[aankondiging van de lancering van GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
en de [toegangsgids](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Bij directe authenticatie met een OpenAI-API-sleutel is de kale id `openai/gpt-5.6` een alias voor
Sol en de standaard voor een nieuwe configuratie. De systeemeigen Codex-catalogus past
die directe-API-alias niet aan de clientzijde toe; afhankelijk van de werkruimtetoegang kan deze
de exacte Sol-, Terra- en Luna-id's tonen. Een nieuwe ChatGPT/Codex OAuth-configuratie
gebruikt daarom `openai/gpt-5.6-sol`. Controleer het huidige account met:

```bash
openclaw models list --provider openai
```

Toegang tot de API-organisatie en de Codex-werkruimte kan verschillen. Als GPT-5.6 niet
beschikbaar is, selecteer dan expliciet GPT-5.5:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw toont de bovenliggende toegangsfout en vervangt een
GPT-5.6-selectie niet stilzwijgend door GPT-5.5.

<Note>
In aanmerking komende exacte officiële HTTPS-routes kunnen de gebundelde Codex-app-server-
plugin selecteren wanneer het runtimebeleid niet is ingesteld of `auto` is; zelf opgegeven Completions-routes,
aangepaste eindpunten en overschrijvingen van het aanvraagtransport blijven op OpenClaw. Officiële HTTP-eindpunten
met platte tekst worden geweigerd. Expliciete provider/model-runtimeconfiguratie blijft
bepalend. Voer `openclaw doctor --fix` uit om achtergebleven verouderde Codex-modelverwijzingen,
`codex-cli/*`-verwijzingen of oude runtimesessiepins te herstellen die niet door
expliciete runtimeconfiguratie zijn ingesteld.
</Note>

## OpenClaw-functiedekking

| OpenAI-mogelijkheid       | OpenClaw-oppervlak                                                                            | Status                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>`-modelprovider                                                              | Ja                                                              |
| Codex-abonnementsmodellen | `openai/<model>` met OpenAI OAuth                                                           | Ja                                                              |
| Verouderde Codex-modelrefs | oude Codex-modelrefs, `codex-cli/<model>`                                                      | Door doctor hersteld naar `openai/<model>`                    |
| Codex-app-serverharnas    | Codex-compatibele HTTPS-route met runtime niet ingesteld/`auto`, of expliciete `agentRuntime.id: codex` | Ja                                                              |
| Webzoekfunctie aan serverzijde | Native OpenAI Responses-tool                                                             | Ja, wanneer webzoeken is ingeschakeld en geen andere provider is vastgezet |
| Afbeeldingen              | `image_generate`                                                                            | Ja                                                              |
| Video's                   | `video_generate`                                                                            | Ja                                                              |
| Tekst-naar-spraak         | `messages.tts.provider: "openai"` / `tts`                                                       | Ja                                                              |
| Batchgewijze spraak-naar-tekst | `tools.media.audio` / mediabegrip                                                        | Ja                                                              |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "openai"`                                                               | Ja                                                              |
| Realtime spraak           | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"`                            | Ja (OpenAI Platform API-sleutel)                                |
| Embeddings                | provider voor geheugenembeddings                                                              | Ja                                                              |

<Note>
Realtime spraak van OpenAI verloopt via de openbare **OpenAI Platform Realtime
API** en vereist een Platform API-sleutel. Codex OAuth-tokens verifiëren in
plaats daarvan de ChatGPT Codex-backend; ze zijn niet uitwisselbaar met Platform
API-sleutels voor de openbare Realtime-eindpunten.

Als authenticatie met een API-sleutel meldt dat facturering ontbreekt, vul dan
Platform-tegoed aan via
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
voor de organisatie achter je realtime-inloggegevens wanneer je authenticatie
met een API-sleutel gebruikt. Realtime spraak accepteert het
`openai`-authenticatieprofiel voor API-sleutels dat is aangemaakt door
`openclaw onboard --auth-choice openai-api-key`, een Platform API-sleutel die via
`talk.realtime.providers.openai.apiKey` is ingesteld voor Control UI Talk, of
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` voor Voice
Call, of de omgevingsvariabele `OPENAI_API_KEY`.
</Note>

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

Stel voor OpenAI-compatibele eindpunten die asymmetrische embeddinglabels
vereisen, `queryInputType` en `documentInputType` in onder
`memorySearch`. OpenClaw stuurt deze door als providerspecifieke
`input_type`-aanvraagvelden: query-embeddings gebruiken
`queryInputType`; geïndexeerde geheugenfragmenten en batchindexering gebruiken
`documentInputType`. Zie de
[referentie voor geheugenconfiguratie](/nl/reference/memory-config#provider-specific-config)
voor het volledige voorbeeld.

## Aan de slag

<Tabs>
  <Tab title="API-sleutel (OpenAI Platform)">
    **Het meest geschikt voor:** directe API-toegang en facturering op basis van gebruik.

    <Steps>
      <Step title="Haal je API-sleutel op">
        Maak of kopieer een API-sleutel vanuit het [OpenAI Platform-dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Voer de onboarding uit">
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

    | Modelref         | Runtimebeleid of routegegevens                                  | Route                     | Authenticatie                     |
    | ---------------- | --------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | niet ingesteld/`auto`, exacte officiële native HTTPS-route, geen aanvraagoverschrijving | Codex kan worden geselecteerd | Geordend authenticatieprofiel voor API-sleutels |
    | `openai/gpt-5.6` | provider/model `agentRuntime.id: "openclaw"`                             | Ingebedde OpenClaw-runtime | Geselecteerd `openai`-profiel voor API-sleutels |
    | `openai/gpt-5.5` | expliciete provider/model `agentRuntime.id`                  | Geselecteerde agentruntime | Geselecteerd OpenAI-profiel voor API-sleutels |
    | `openai/*` | zelf opgestelde Completions, aangepaste route of aanvraagoverschrijving | Ingebedde OpenClaw-runtime | Type inloggegevens blijft ongewijzigd |
    | `openai/*` | officieel HTTP-eindpunt met platte tekst                      | Geweigerd                 | Inloggegevens worden niet verzonden |

    <Note>
    Als de runtime niet is ingesteld of `auto` is, kan alleen een
    geschikte, exacte officiële native HTTPS-route impliciet het
    Codex-app-serverharnas selecteren. Maak voor authenticatie met een API-sleutel
    bij een agentmodel een `openai`-authenticatieprofiel voor
    API-sleutels en orden dit met `auth.order.openai`; `OPENAI_API_KEY` blijft
    de directe terugvaloptie voor OpenAI API-oppervlakken die niet voor agents
    zijn. Voer `openclaw doctor --fix` uit om oudere verouderde
    Codex-vermeldingen voor de authenticatievolgorde te migreren.
    </Note>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    De kale directe-API-id `gpt-5.6` wordt omgezet naar de Sol-laag.
    Als deze API-organisatie GPT-5.6 niet aanbiedt, stel de primaire waarde dan
    expliciet in op `openai/gpt-5.5`.

    Stel het model in op `openai/chat-latest` om het huidige Instant-model van
    ChatGPT via de OpenAI API te proberen:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` is een dynamische alias. Een nieuwe configuratie met een
    OpenAI API-sleutel gebruikt in plaats daarvan `openai/gpt-5.6`, waarvan de
    kale directe-API-id wordt omgezet naar Sol. Bestaande expliciete primaire
    waarden, waaronder `openai/gpt-5.5`, blijven ongewijzigd. De alias
    `chat-latest` accepteert alleen de tekstuitvoerigheid
    `medium`; OpenClaw dwingt elke andere aangevraagde uitvoerigheid
    voor dit model af op `medium`.

    <Warning>
    OpenClaw biedt `gpt-5.3-codex-spark` **niet** aan via de directe route met een
    OpenAI API-sleutel. Het is alleen beschikbaar via vermeldingen in de
    Codex-abonnementscatalogus wanneer je aangemelde account dit aanbiedt.
    </Warning>

  </Tab>

  <Tab title="Codex-abonnement">
    **Het meest geschikt voor:** het gebruik van je ChatGPT/Codex-abonnement
    met native uitvoering via de Codex-app-server in plaats van een afzonderlijke
    API-sleutel. Codex-cloud vereist aanmelding bij ChatGPT.

    <Steps>
      <Step title="Voer Codex OAuth uit">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Of voer OAuth rechtstreeks uit:

        ```bash
        openclaw models auth login --provider openai
        ```

        Voeg voor headless configuraties of configuraties die callbacks niet
        ondersteunen `--device-code` toe om je aan te melden via een
        ChatGPT-apparaatcodestroom in plaats van via de browsercallback op
        localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Gebruik de canonieke OpenAI-modelroute">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        Voor deze exacte officiële native HTTPS-route is geen
        runtimeconfiguratie vereist. Deze kan automatisch de
        Codex-app-serverruntime selecteren en OpenClaw installeert of herstelt de
        gebundelde Codex-Plugin wanneer die runtime wordt gekozen.
      </Step>
      <Step title="Controleer of Codex-authenticatie beschikbaar is">
        ```bash
        openclaw models list --provider openai
        ```

        Stuur nadat de Gateway actief is `/codex status` of
        `/codex models` in de chat om de native app-serverruntime te
        verifiëren.
      </Step>
    </Steps>

    ### Routesamenvatting

    | Modelref                 | Runtimebeleid of routegegevens                                  | Route                                                    | Authenticatie                                      |
    | ------------------------ | --------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`       | niet ingesteld/`auto`, exacte officiële native HTTPS-route, geen aanvraagoverschrijving | Codex kan worden geselecteerd                            | Codex-aanmelding of een geordend `openai`-authenticatieprofiel |
    | `openai/gpt-5.6-terra`       | niet ingesteld/`auto`, exacte officiële native HTTPS-route, geen aanvraagoverschrijving | Codex kan worden geselecteerd                            | Codex-aanmelding wanneer de catalogus Terra aanbiedt |
    | `openai/gpt-5.6-luna`       | niet ingesteld/`auto`, exacte officiële native HTTPS-route, geen aanvraagoverschrijving | Codex kan worden geselecteerd                            | Codex-aanmelding wanneer de catalogus Luna aanbiedt |
    | `openai/gpt-5.6-sol`       | provider/model `agentRuntime.id: "openclaw"`                              | Ingebedde OpenClaw-runtime, intern Codex-authenticatietransport | Geselecteerd `openai` OAuth-profiel |
    | `openai/gpt-5.5`       | expliciete provider/model `agentRuntime.id`                   | Geselecteerde agentruntime                               | Geselecteerd OpenAI-authenticatieprofiel            |
    | `openai/*`       | zelf opgestelde Completions, aangepaste route of aanvraagoverschrijving | Ingebedde OpenClaw-runtime                               | Vereiste voor inloggegevens blijft routespecifiek   |
    | `openai/*`       | officieel HTTP-eindpunt met platte tekst                       | Geweigerd                                                | Inloggegevens worden niet verzonden                 |
    | Verouderde Codex GPT-5.5-ref | door doctor hersteld                                        | Herschreven naar `openai/gpt-5.5`                      | Gemigreerd OpenAI OAuth-profiel                     |
    | `codex-cli/gpt-5.5`       | door doctor hersteld                                           | Herschreven naar `openai/gpt-5.5`                      | Codex-app-serverauthenticatie                       |

    <Warning>
    Nieuwe configuratie met een abonnement gebruikt exact `openai/gpt-5.6-sol`; de
    native Codex-catalogus kan ook exacte Terra- of Luna-verwijzingen aanbieden. Als het
    account GPT-5.6 niet aanbiedt, selecteer dan expliciet `openai/gpt-5.5`. Oudere
    Codex GPT-verwijzingen zijn verouderde OpenClaw-routes, niet het native
    Codex-runtimepad; voer `openclaw doctor --fix` uit om ze te migreren zonder een
    bestaande expliciete GPT-5.5-selectie te upgraden. `gpt-5.3-codex-spark` blijft beperkt
    tot accounts waarvan de Codex-abonnementscatalogus dit model vermeldt; directe
    OpenAI-API-sleutel- en Azure-verwijzingen ervoor blijven onderdrukt.
    </Warning>

    <Note>
    Nieuwe configuratie moet de OpenAI-authenticatievolgorde voor agents onder `auth.order.openai` plaatsen;
    doctor migreert oudere verouderde Codex-vermeldingen voor de authenticatievolgorde.
    </Note>

    ### Configuratievoorbeeld

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    Met een API-sleutel als reserve houd je het geselecteerde model onder `openai/*` en plaats je
    de authenticatievolgorde onder `openai`. OpenClaw probeert eerst het abonnement en daarna
    de API-sleutel, terwijl het de Codex-harness blijft gebruiken:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    Onboarding importeert geen OAuth-materiaal meer uit `~/.codex`. Meld je aan via
    browser-OAuth (standaard) of de apparaatcodestroom hierboven; OpenClaw beheert de
    resulterende aanmeldgegevens in zijn eigen authenticatieopslag voor agents.
    </Note>

    ### Codex OAuth-routering controleren en herstellen

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

    Herstel de configuratie als een oudere configuratie nog verouderde Codex GPT-verwijzingen
    bevat, of een verouderde OpenAI-runtime-sessiepin zonder expliciete runtimeconfiguratie:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Meld je opnieuw aan als `models auth list --provider openai` geen bruikbaar profiel
    toont:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Gebruik `--profile-id` voor meerdere Codex OAuth-aanmeldingen in dezelfde agent en
    beheer ze vervolgens via de authenticatievolgorde of `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Voer `openclaw doctor --fix` uit om oudere verouderde OpenAI Codex-profiel-id's met voorvoegsel
    en volgordevermeldingen te migreren voordat je op de profielvolgorde vertrouwt.

    ### Statusindicator

    Chat `/status` toont welke modelruntime actief is voor de huidige
    sessie. De meegeleverde Codex-app-serverharness wordt weergegeven als
    `Runtime: OpenAI Codex` wanneer deze wordt geselecteerd door een geschikte impliciete route of een expliciet
    provider-/modelruntimebeleid.

    ### Doctor-waarschuwing

    Als verouderde Codex-modelverwijzingen of verouderde OpenAI-runtimepins in de configuratie
    of sessiestatus achterblijven, herschrijft `openclaw doctor --fix` ze naar `openai/*` met
    de Codex-runtime, tenzij OpenClaw expliciet is geconfigureerd.

    ### Limiet voor het contextvenster

    OpenClaw behandelt modelmetadata en de runtimecontextlimiet als afzonderlijke
    waarden. Voor `openai/gpt-5.5` via de Codex OAuth-catalogus:

    - Native `contextWindow`: `400000`
    - Standaardlimiet voor runtime-`contextTokens`: `272000`

    De kleinere standaardlimiet biedt in de praktijk betere eigenschappen voor
    latentie en kwaliteit. Overschrijf deze met `contextTokens`:

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
    Gebruik `contextWindow` om native modelmetadata te declareren. Gebruik `contextTokens`
    om het runtimecontextbudget te beperken. De directe OpenAI-route met API-sleutel
    rapporteert een grotere native `contextWindow` (`1000000`) voor `gpt-5.5`; de twee
    routes worden afzonderlijk bijgehouden omdat de upstreamcatalogi verschillen.
    </Note>

    ### Catalogusherstel

    OpenClaw gebruikt upstream Codex-catalogusmetadata voor `gpt-5.5` wanneer deze
    aanwezig is. Als live Codex-detectie de rij `gpt-5.5` weglaat terwijl het account
    is geauthenticeerd, genereert OpenClaw die OAuth-modelrij zodat uitvoeringen via Cron,
    subagents en het geconfigureerde standaardmodel niet mislukken met
    `Unknown model`.

  </Tab>
</Tabs>

## Authenticatie voor de native Codex-app-server

De native Codex-app-serverharness gebruikt `openai/*`-modelverwijzingen wanneer een geschikte
exacte officiële HTTPS-route deze impliciet selecteert, of wanneer provider-/model-
`agentRuntime.id: "codex"` deze expliciet selecteert. De authenticatie blijft
accountgebaseerd. OpenClaw selecteert authenticatie in deze volgorde:

1. Geordende OpenAI-authenticatieprofielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Voer `openclaw doctor --fix` uit om oudere verouderde
   Codex-authenticatieprofiel-id's en de authenticatievolgorde te migreren.
2. Het bestaande account van de app-server, zoals een lokale ChatGPT-aanmelding
   via de Codex CLI. Voor de standaard geïsoleerde thuismap van de agent koppelt OpenClaw dat native
   CLI-account via de aanmeld-RPC aan de app-server; het deelt niet de
   configuratie, plugins of threadopslag van de CLI.
3. Alleen voor lokale app-serverstarts via stdio, en alleen wanneer de app-server
   geen account rapporteert: `CODEX_API_KEY`, daarna `OPENAI_API_KEY`.

Een lokale aanmelding met een ChatGPT-/Codex-abonnement wordt niet vervangen alleen omdat het
Gateway-proces ook `OPENAI_API_KEY` bevat voor directe OpenAI-modellen of
embeddings. De terugval op een API-sleutel uit de omgeving geldt alleen voor het lokale stdio-pad
zonder account; deze wordt nooit via WebSocket-verbindingen met de app-server verzonden. Wanneer een
Codex-profiel van het abonnementstype is geselecteerd, houdt OpenClaw ook
`CODEX_API_KEY` en `OPENAI_API_KEY` buiten het gestarte onderliggende stdio-app-serverproces
en verzendt het in plaats daarvan de geselecteerde aanmeldgegevens via de aanmeld-RPC van de app-server.

Wanneer dat abonnementsprofiel wordt geblokkeerd door een Codex-gebruikslimiet, markeert OpenClaw
het profiel als geblokkeerd tot de door Codex opgegeven hersteltijd en laat het de authenticatievolgorde
doorschakelen naar het volgende `openai:*`-profiel, zonder het geselecteerde
model te wijzigen of de Codex-harness te verlaten. Zodra de hersteltijd is verstreken, komt het
abonnementsprofiel weer in aanmerking.

## Afbeeldingen genereren

De meegeleverde Plugin `openai` registreert het genereren van afbeeldingen via de
tool `image_generate`. Deze ondersteunt zowel het genereren van afbeeldingen met een OpenAI-API-sleutel
als via Codex OAuth met dezelfde modelverwijzing `openai/gpt-image-2`.

| Mogelijkheid              | OpenAI-API-sleutel                 | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modelverwijzing           | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authenticatie             | `OPENAI_API_KEY`                   | OpenAI Codex OAuth-aanmelding         |
| Transport                 | OpenAI Images API                  | Codex Responses-backend              |
| Maximaal aantal afbeeldingen per aanvraag | 4                                  | 4                                    |
| Bewerkingsmodus           | Ingeschakeld (maximaal 5 referentieafbeeldingen) | Ingeschakeld (maximaal 5 referentieafbeeldingen) |
| Overschrijvingen voor grootte | Ondersteund, inclusief 2K-/4K-formaten | Ondersteund, inclusief 2K-/4K-formaten |
| Beeldverhouding/resolutie | Niet doorgestuurd naar OpenAI Images API | Indien veilig toegewezen aan een ondersteund formaat |

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
Zie [Afbeeldingen genereren](/nl/tools/image-generation) voor gedeelde toolparameters,
providerselectie en terugvalgedrag.
</Note>

`gpt-image-2` is de standaard voor OpenAI-tekst-naar-afbeelding en het bewerken van
afbeeldingen. `gpt-image-1.5`, `gpt-image-1` en `gpt-image-1-mini` blijven bruikbaar
als expliciete modeloverschrijvingen. Gebruik `openai/gpt-image-1.5` voor
PNG-/WebP-uitvoer met transparante achtergrond; de huidige `gpt-image-2`-API weigert
`background: "transparent"`.

Roep voor een aanvraag met transparante achtergrond `image_generate` aan met
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` of `"webp"`, en
`background: "transparent"`; de oudere provideroptie `openai.background` wordt
nog steeds geaccepteerd. OpenClaw beschermt ook de openbare OpenAI- en OpenAI Codex OAuth-
routes door standaard transparante aanvragen voor `openai/gpt-image-2` te herschrijven naar
`gpt-image-1.5`; Azure en aangepaste OpenAI-compatibele eindpunten behouden hun
geconfigureerde implementatie-/modelnamen.

Dezelfde instelling is beschikbaar voor headless CLI-uitvoeringen:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Een eenvoudige sticker met een rode cirkel op een transparante achtergrond" \
  --json
```

Gebruik dezelfde vlaggen `--output-format` en `--background` met
`openclaw infer image edit` wanneer je begint met een invoerbestand.
`--openai-background` blijft beschikbaar als een OpenAI-specifieke alias. Gebruik
`--quality low|medium|high|auto` om de kwaliteit en kosten van OpenAI Images te beheren.
Gebruik `--openai-moderation low|auto` om OpenAI's moderatiehint door te geven vanuit
`image generate` of `image edit`.

Behoud voor ChatGPT-/Codex OAuth-installaties dezelfde verwijzing `openai/gpt-image-2`. Wanneer
een OAuth-profiel `openai` is geconfigureerd, haalt OpenClaw het opgeslagen OAuth-
toegangstoken voor dat profiel op en verzendt het afbeeldingsaanvragen via de Codex Responses-backend; het
probeert niet eerst `OPENAI_API_KEY` en valt niet stilzwijgend terug op een API-sleutel.
Configureer `models.providers.openai` expliciet met een API-sleutel, aangepaste basis-
URL of Azure-eindpunt wanneer je in plaats daarvan de directe route via de OpenAI Images API
wilt. Als dat aangepaste afbeeldingseindpunt zich op een vertrouwd LAN-/privéadres bevindt,
stel dan ook `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in; OpenClaw
blokkeert privé-/interne OpenAI-compatibele afbeeldingseindpunten tenzij deze
expliciete toestemming aanwezig is.

Genereren:

```
/tool image_generate model=openai/gpt-image-2 prompt="Een verzorgde lanceringsposter voor OpenClaw op macOS" size=3840x2160 count=1
```

Een transparante PNG genereren:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Een eenvoudige sticker met een rode cirkel op een transparante achtergrond" outputFormat=png background=transparent
```

Bewerken:

```
/tool image_generate model=openai/gpt-image-2 prompt="Behoud de vorm van het object en verander het materiaal in doorschijnend glas" image=/path/to/reference.png size=1024x1536
```

## Video's genereren

De meegeleverde Plugin `openai` registreert het genereren van video's via de
tool `video_generate`.

| Mogelijkheid      | Waarde                                                                             |
| ----------------- | ---------------------------------------------------------------------------------- |
| Standaardmodel    | `openai/sora-2`                                                                    |
| Modi              | Tekst-naar-video, afbeelding-naar-video, bewerking van één video                   |
| Referentie-invoer | 1 afbeelding of 1 video                                                           |
| Overschrijvingen voor grootte | Ondersteund voor tekst-naar-video en afbeelding-naar-video                        |
| Beeldverhouding   | Omgezet naar het dichtstbijzijnde ondersteunde formaat, niet ongewijzigd doorgestuurd |
| Andere overschrijvingen | `resolution`, `audio`, `watermark` worden niet ondersteund en verwijderd met een toolwaarschuwing |

OpenAI-aanvragen voor afbeelding-naar-video gebruiken `POST /v1/videos` met een afbeelding
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
Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters,
providerselectie en failovergedrag.

De OpenAI-provider declareert `supportsSize`, maar niet `supportsAspectRatio` of
`supportsResolution`. De gedeelde normalisatielaag van OpenClaw zet een aangevraagde
`aspectRatio` om in de best overeenkomende OpenAI-`size` voordat het
verzoek de provider bereikt, zodat aanvragen voor beeldverhoudingen doorgaans blijven werken.
`resolution` heeft geen terugvaloptie voor grootte en wordt weggelaten, wat aan de aanroeper
wordt gemeld als `Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## GPT-5-promptbijdrage

OpenClaw voegt een gedeelde GPT-5-promptbijdrage toe voor modellen uit de
GPT-5-familie bij de provider `openai` (inclusief verouderde Codex-verwijzingen van vóór
herstel die worden genormaliseerd naar `openai/*`). Andere providers die ook
model-id's uit de GPT-5-familie aanbieden, zoals OpenRouter- of opencode-routes,
ontvangen deze overlay niet; deze is gekoppeld aan provider-id `openai`,
niet alleen aan de model-id. Oudere GPT-4.x-modellen ontvangen deze nooit.

De systeemeigen Codex-appserverharnas ontvangt het gedragscontract voor persona/
tooldiscipline of de vriendelijke interactiestijloverlay niet via
ontwikkelaarsinstructies; systeemeigen Codex behoudt het door Codex beheerde gedrag
voor basis, model en projectdocumentatie, en OpenClaw schakelt de ingebouwde
persoonlijkheid van Codex uit voor systeemeigen threads, zodat persoonlijkheidsbestanden
in de agentwerkruimte leidend blijven. OpenClaw draagt alleen runtimecontext bij aan
systeemeigen Codex-threads: kanaalbezorging, dynamische OpenClaw-tools, ACP-delegatie,
werkruimtecontext en OpenClaw-Skills. De Heartbeat-richtlijntekst uit dezelfde
bijdrage is de enige uitzondering: systeemeigen Codex-Heartbeat-beurten krijgen deze
wel, geïnjecteerd als afzonderlijke samenwerkingsinstructies in plaats van via de
gedeelde hook voor promptbijdragen.

De GPT-5-bijdrage voegt een getagd gedragscontract toe voor het behouden van de
persona, uitvoeringsveiligheid, tooldiscipline, uitvoervorm, voltooiingscontroles
en verificatie bij overeenkomende door OpenClaw samengestelde prompts. Kanaalspecifiek
antwoord- en stilberichtgedrag blijft in de gedeelde OpenClaw-systeemprompt en het
beleid voor uitgaande bezorging. De laag voor een vriendelijke interactiestijl is
afzonderlijk en configureerbaar.

| Waarde                  | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (standaard) | De laag voor een vriendelijke interactiestijl inschakelen |
| `"on"`                 | Alias voor `"friendly"`                      |
| `"off"`                | Alleen de laag voor de vriendelijke stijl uitschakelen       |

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
Waarden zijn tijdens runtime niet hoofdlettergevoelig, dus zowel `"Off"` als
`"off"` schakelen de laag voor de vriendelijke stijl uit.
</Tip>

<Note>
Verouderde `plugins.entries.openai.config.personality` wordt nog steeds gelezen als
compatibiliteitsterugval wanneer de gedeelde instelling
`agents.defaults.promptOverlays.gpt5.personality` niet is ingesteld.
</Note>

## Stem en spraak

<AccordionGroup>
  <Accordion title="Spraaksynthese (TTS)">
    De meegeleverde Plugin `openai` registreert spraaksynthese voor het
    oppervlak `messages.tts`.

    | Instelling      | Configuratiepad                                            | Standaard                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Model        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Stem        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Snelheid        | `messages.tts.providers.openai.speed`                  | (niet ingesteld)                          |
    | Instructies | `messages.tts.providers.openai.instructions`           | (niet ingesteld, alleen `gpt-4o-mini-tts`)  |
    | Indeling       | `messages.tts.providers.openai.responseFormat`         | `opus` voor spraakberichten, `mp3` voor bestanden |
    | API-sleutel      | `messages.tts.providers.openai.apiKey`                 | Valt terug op `OPENAI_API_KEY`   |
    | Basis-URL     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Extra body   | `messages.tts.providers.openai.extraBody` / `extra_body` | (niet ingesteld)                        |

    Beschikbare modellen: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Beschikbare stemmen:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wordt na de door OpenClaw gegenereerde velden samengevoegd met
    de JSON van het `/audio/speech`-verzoek. Gebruik dit daarom voor OpenAI-compatibele
    eindpunten die aanvullende sleutels vereisen, zoals `lang`.
    Prototypesleutels worden genegeerd.

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
    Stel `OPENAI_TTS_BASE_URL` in om de TTS-basis-URL te overschrijven zonder
    het eindpunt van de chat-API te beïnvloeden. OpenAI TTS en Realtime-stem
    worden beide geconfigureerd met een API-sleutel van het OpenAI Platform;
    installaties met alleen OAuth kunnen nog steeds door Codex ondersteunde
    chatmodellen gebruiken, maar geen live terugspraak van OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Spraak-naar-tekst">
    De meegeleverde Plugin `openai` registreert batchgewijze spraak-naar-tekst via
    het transcriptieoppervlak voor mediabegrip van OpenClaw.

    - Standaardmodel: `gpt-4o-transcribe`
    - Eindpunt: OpenAI REST `/v1/audio/transcriptions`
    - Invoerpad: upload van audiobestand via multipart
    - Wordt overal gebruikt waar transcriptie van binnenkomende audio `tools.media.audio` leest,
      waaronder segmenten van Discord-spraakkanalen en audiobijlagen van kanalen

    OpenAI afdwingen voor transcriptie van binnenkomende audio:

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

    Taal- en promptaanwijzingen worden doorgestuurd naar OpenAI wanneer ze worden
    opgegeven via de gedeelde configuratie voor audiomedia of een transcriptieverzoek per aanroep.

  </Accordion>

  <Accordion title="Realtime-transcriptie">
    De meegeleverde Plugin `openai` registreert realtime-transcriptie voor de
    Plugin Voice Call.

    | Instelling          | Configuratiepad                                                          | Standaard |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Model            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Taal         | `...openai.language`                                                 | (niet ingesteld) |
    | Prompt           | `...openai.prompt`                                                   | (niet ingesteld) |
    | Stilteduur | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD-drempel    | `...openai.vadThreshold`                                             | `0.5`   |
    | Authenticatie             | `...openai.apiKey`, `OPENAI_API_KEY` of API-sleutelprofiel `openai`    | API-sleutel van het Platform vereist |

    <Note>
    Gebruikt een WebSocket-verbinding met `wss://api.openai.com/v1/realtime` met
    G.711 u-law-audio (`g711_ulaw` / `audio/pcmu`). Voor een
    API-sleutelprofiel van `openai` maakt de Gateway een tijdelijk
    Realtime-transcriptieclientgeheim aan voordat de WebSocket wordt geopend.
    Deze streamingprovider is bedoeld voor het realtime-transcriptiepad van
    Voice Call; Discord-spraak neemt momenteel korte segmenten op en gebruikt
    in plaats daarvan het batchtranscriptiepad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-stem">
    De meegeleverde Plugin `openai` registreert realtime-stem voor de Plugin
    Voice Call.

    | Instelling                               | Configuratiepad                                                              | Standaard             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Model                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Stem                                  | `...openai.voice`                                                       | `alloy`             |
    | Temperatuur (Azure-implementatiebridge)  | `...openai.temperature`                                                 | `0.8`               |
    | VAD-drempel                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Stilteduur                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Voorvoegselopvulling                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Redeneerinspanning                       | `...openai.reasoningEffort`                                             | (niet ingesteld)              |
    | Authenticatie                                   | API-sleutelprofiel `openai`, `...openai.apiKey` of `OPENAI_API_KEY` | API-sleutel van het OpenAI Platform vereist |

    Beschikbare ingebouwde Realtime-stemmen voor `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI beveelt `marin` en `cedar` aan voor de beste Realtime-kwaliteit.
    Dit is een afzonderlijke set naast de tekst-naar-spraakstemmen hierboven; een stem die
    alleen voor TTS is bedoeld, zoals `fable`, `nova` of
    `onyx`, is niet geldig voor Realtime-sessies. Stel het model expliciet
    in op `gpt-realtime-2.1-mini` als je de kleinere, goedkopere Realtime 2.1-variant verkiest.

    <Note>
    **GPT-Live (binnenkort beschikbaar).** De full-duplexmodellen `gpt-live-1` en
    `gpt-live-1-mini` van OpenAI vervingen de spraakmodus van ChatGPT in juli 2026;
    de ontwikkelaars-API wordt uitgerold naar organisaties met vroege toegang.
    OpenClaw herkent de modelfamilie, maar voert deze nog niet uit: GPT-Live-sessies
    werken alleen met WebRTC, beheren hun eigen beurtwisseling (geen VAD) en delegeren
    agentwerk via een overdrachtsgebeurtenisprotocol dat de realtime-transporten van
    OpenClaw nog niet implementeren. Het configureren van een `gpt-live-*`-model
    mislukt gesloten met richtlijnen voor zowel de WebSocket-bridge als Talk-browsersessies,
    in plaats van stilzwijgend audio te verbinden zonder agenttoegang. API-toegang wordt
    tijdens de vroege toegang ook per OpenAI-organisatie beperkt. Blijf `gpt-realtime-2.1`
    (de standaard) gebruiken totdat ondersteuning voor GPT-Live beschikbaar is.
    </Note>

    <Note>
    OpenAI-realtimebridges in de backend gebruiken de GA Realtime-WebSocket-sessievorm,
    die `session.temperature` niet accepteert. Azure OpenAI-implementaties blijven
    beschikbaar via `azureEndpoint` en `azureDeployment` en behouden de
    implementatiecompatibele sessievorm (inclusief `temperature`).
    Ondersteunt bidirectionele toolaanroepen en G.711 u-law-audio.
    </Note>

    <Note>
    Realtime-spraak wordt geselecteerd wanneer de sessie wordt aangemaakt. OpenAI staat toe dat de meeste
    sessievelden later worden gewijzigd, maar de stem kan niet meer worden gewijzigd nadat het
    model in die sessie audio heeft gegenereerd. OpenClaw biedt momenteel de
    ingebouwde Realtime-stem-id's aan als tekenreeksen.
    </Note>

    <Note>
    Control UI Talk gebruikt OpenAI-realtimesessies in de browser met een door de Gateway
    aangemaakt tijdelijk clientgeheim en een rechtstreekse WebRTC SDP-uitwisseling vanuit de browser
    met de OpenAI Realtime API. De Gateway maakt dat clientgeheim aan met
    de geselecteerde `openai`-referentie. Geconfigureerde sleutels, API-sleutelprofielen en
    `OPENAI_API_KEY` hebben voorrang; een `openai`-OAuth-profiel of externe
    Codex-aanmelding dient als terugvaloptie. Gateway-relay en realtime
    WebSocket-bridges van de Voice Call-backend gebruiken dezelfde referentievolgorde voor systeemeigen OpenAI-eindpunten.
    Liveverificatie voor beheerders is beschikbaar met
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    de OpenAI-onderdelen verifiëren zowel de WebSocket-bridge van de backend als de WebRTC
    SDP-uitwisseling van de browser zonder geheimen te loggen.
    Geef `--openai-only` door om die twee onderdelen zonder Google-referenties uit te voeren.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-eindpunten

De gebundelde `openai`-provider kan een Azure OpenAI-resource gebruiken voor het genereren
van afbeeldingen door de basis-URL te overschrijven. In het pad voor het genereren van afbeeldingen detecteert OpenClaw
Azure-hostnamen in `models.providers.openai.baseUrl` en schakelt het automatisch over naar
de aanvraagstructuur van Azure.

<Note>
Realtime-spraak gebruikt een afzonderlijk configuratiepad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
en wordt niet beïnvloed door `models.providers.openai.baseUrl`. Zie het uitklapvenster **Realtime-
spraak** onder [Stem en spraak](#voice-and-speech) voor de Azure-instellingen.
</Note>

Gebruik Azure OpenAI wanneer:

- Je al een Azure OpenAI-abonnement, quotum of zakelijke
  overeenkomst hebt
- Je regionale gegevensopslag of nalevingscontroles nodig hebt die Azure biedt
- Je verkeer binnen een bestaande Azure-tenant wilt houden

### Configuratie

Voor het genereren van Azure-afbeeldingen via de gebundelde `openai`-provider laat je
`models.providers.openai.baseUrl` naar je Azure-resource verwijzen en stel je `apiKey` in op
de Azure OpenAI-sleutel (niet op een OpenAI Platform-sleutel):

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

OpenClaw herkent deze Azure-hostachtervoegsels voor de Azure-route voor het genereren
van afbeeldingen:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Voor aanvragen voor het genereren van afbeeldingen op een herkende Azure-host doet OpenClaw het volgende:

- Verstuurt de header `api-key` in plaats van `Authorization: Bearer`
- Gebruikt implementatiespecifieke paden (`/openai/deployments/{deployment}/...`)
- Voegt `?api-version=...` aan elke aanvraag toe
- Gebruikt een standaardtime-out van 600s voor Azure-aanroepen voor het genereren van afbeeldingen.
  Waarden voor `timeoutMs` per aanroep overschrijven deze standaard nog steeds.

Andere basis-URL's (openbare OpenAI, OpenAI-compatibele proxy's) behouden de standaard
OpenAI-aanvraagstructuur voor afbeeldingen.

<Note>
Azure-routering voor het pad voor het genereren van afbeeldingen van de `openai`-provider vereist
OpenClaw 2026.4.22 of hoger. Eerdere versies behandelen elke aangepaste
`openai.baseUrl` als het openbare OpenAI-eindpunt en werken niet met Azure-implementaties
voor afbeeldingen.
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
de openbare OpenAI-model-id.

Als je een implementatie met de naam `gpt-image-2-prod` aanmaakt die `gpt-image-2` aanbiedt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Een strakke poster" size=1024x1024 count=1
```

Dezelfde regel voor implementatienamen geldt voor elke aanroep voor het genereren van afbeeldingen die
via de gebundelde `openai`-provider wordt gerouteerd.

### Regionale beschikbaarheid

Het genereren van afbeeldingen met Azure is momenteel slechts in een beperkt aantal regio's beschikbaar
(bijvoorbeeld `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controleer de actuele regiolijst van Microsoft voordat je een
implementatie aanmaakt en bevestig dat het specifieke model in je regio wordt aangeboden.

### Parameterverschillen

Azure OpenAI en het openbare OpenAI accepteren niet altijd dezelfde afbeeldingsparameters.
Azure kan opties weigeren die het openbare OpenAI toestaat (bijvoorbeeld bepaalde
`background`-waarden voor `gpt-image-2`) of deze alleen beschikbaar stellen in specifieke modelversies.
Deze verschillen zijn afkomstig van Azure en het onderliggende model, niet van
OpenClaw. Als een Azure-aanvraag mislukt met een validatiefout, controleer dan in de
Azure-portal de parameterset die door je specifieke implementatie en API-versie wordt ondersteund.

<Note>
Azure OpenAI gebruikt systeemeigen transport en compatibiliteitsgedrag, maar ontvangt
de verborgen attributieheaders van OpenClaw niet. Zie het uitklapvenster **Systeemeigen versus OpenAI-compatibele
routes** onder [Geavanceerde configuratie](#advanced-configuration).

Gebruik voor chat- of Responses-verkeer op Azure (naast het genereren van afbeeldingen) de
onboardingprocedure of een speciale Azure-providerconfiguratie; alleen `openai.baseUrl`
neemt de API-/authenticatiestructuur van Azure niet over. Er bestaat een afzonderlijke
`azure-openai-responses/*`-provider; zie het uitklapvenster voor server-side Compaction
hieronder.
</Note>

## Geavanceerde configuratie

De onderstaande voorbeelden voor `params` per model geven vorm aan de ingesloten provideraanvraag
van OpenClaw. Het configureren ervan geldt als expliciet ingesteld aanvraaggedrag, waardoor een anders geschikte
`auto`-route bij OpenClaw blijft in plaats van impliciet Codex te selecteren. Het systeemeigen
Codex-app-serverharnas beheert zijn eigen transport- en aanvraaginstellingen; expliciete
`agentRuntime.id: "codex"` werkt niet wanneer de effectieve route niet als
Codex-compatibel is gedeclareerd.

<AccordionGroup>
  <Accordion title="Transport (WebSocket versus SSE)">
    OpenClaw gebruikt eerst WebSocket met SSE als terugvaloptie (`"auto"`) voor `openai/*`.

    In de modus `"auto"` doet OpenClaw het volgende:
    - Probeert één vroege WebSocket-fout opnieuw voordat wordt teruggevallen op SSE
    - Markeert WebSocket na een fout gedurende 60 seconden als verminderd beschikbaar en gebruikt SSE
      tijdens de afkoelperiode
    - Voegt stabiele identiteitsheaders voor sessies en beurten toe voor nieuwe pogingen en
      herverbindingen
    - Normaliseert gebruikstellers (`input_tokens` / `prompt_tokens`) tussen
      transportvarianten

    | Waarde                | Gedrag                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (standaard)   | Eerst WebSocket, SSE als terugvaloptie     |
    | `"sse"`              | Alleen SSE afdwingen                    |
    | `"websocket"`        | Alleen WebSocket afdwingen              |

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
    - [API-responses streamen (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Snelle modus">
    OpenClaw biedt een gedeelde schakelaar voor de snelle modus voor `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Configuratie:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wanneer deze is ingeschakeld, koppelt OpenClaw de snelle modus aan prioriteitsverwerking door OpenAI
    (`service_tier = "priority"`). Bestaande waarden voor `service_tier` blijven
    behouden en de snelle modus herschrijft `reasoning` of
    `text.verbosity` niet. `fastMode: "auto"` start nieuwe modelaanroepen snel totdat de
    automatische grenswaarde wordt bereikt en start latere nieuwe pogingen, terugval-, toolresultaat- of
    vervolgaanroepen vervolgens zonder snelle modus. De grenswaarde is standaard 60 seconden;
    stel `params.fastAutoOnSeconds` voor het actieve model in om deze te wijzigen.

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
    Sessieoverschrijvingen hebben voorrang op de configuratie. Als je de sessieoverschrijving in de
    Sessions UI wist, keert de sessie terug naar de geconfigureerde standaardwaarde.
    </Note>

  </Accordion>

  <Accordion title="Prioriteitsverwerking (service_tier)">
    De API van OpenAI biedt prioriteitsverwerking via `service_tier`. Stel dit per
    model in OpenClaw in:

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
    `serviceTier` wordt alleen doorgestuurd naar systeemeigen OpenAI-eindpunten
    (`api.openai.com`) en systeemeigen Codex-eindpunten (`chatgpt.com/backend-api`).
    Als je een van beide providers via een proxy routeert, laat OpenClaw
    `service_tier` ongewijzigd.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Voor rechtstreekse OpenAI Responses-modellen (`openai/*` op `api.openai.com`) schakelt
    de OpenClaw-streamwrapper van de OpenAI-Plugin automatisch server-side
    Compaction in:

    - Dwingt `store: true` af (tenzij modelcompatibiliteit `supportsStore: false` instelt)
    - Voegt `context_management: [{ type: "compaction", compact_threshold: ... }]` in
    - Standaardwaarde voor `compact_threshold`: 70% van `contextWindow` (of `80000` wanneer
      niet beschikbaar)

    Dit geldt voor het ingebouwde OpenClaw-runtimepad en voor OpenAI-providerhooks
    die door ingesloten uitvoeringen worden gebruikt. Het systeemeigen Codex-app-serverharnas beheert
    zijn eigen context via Codex en wordt niet door deze instelling beïnvloed.

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
      <Tab title="Aangepaste drempelwaarde">
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
    `responsesServerCompaction` beheert alleen het invoegen van `context_management`.
    Rechtstreekse OpenAI Responses-modellen dwingen `store: true` nog steeds af, tenzij compatibiliteit
    `supportsStore: false` instelt.
    </Note>

  </Accordion>

  <Accordion title="Strikte agentische GPT-modus">
    Voor GPT-5-familiemodellen van de `openai`-provider die via de ingesloten
    runtime van OpenClaw worden uitgevoerd, gebruikt OpenClaw al standaard een strikter uitvoeringscontract met de naam
    `strict-agentic`. Het wordt automatisch geactiveerd wanneer de opgeloste provider
    `openai` is en de model-id overeenkomt met de GPT-5-familie, tenzij de configuratie
    dit expliciet uitschakelt:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Het expliciet instellen van `"strict-agentic"` heeft geen effect op een ondersteunde route (het
    is al de standaardinstelling) en is inactief voor niet-ondersteunde provider-/modelcombinaties.

    Als `strict-agentic` actief is, doet OpenClaw het volgende:
    - Schakelt `update_plan` automatisch in voor omvangrijke taken
    - Probeert structureel lege beurten of beurten met alleen redenering opnieuw met een voortzetting
      die een zichtbaar antwoord geeft
    - Gebruikt expliciete plangebeurtenissen van het harnas wanneer het geselecteerde harnas
      die aanbiedt

    OpenClaw classificeert assistentproza niet om te bepalen of een beurt een
    plan, voortgangsupdate of definitief antwoord is.

    <Note>
    Dit contract bevindt zich volledig in de ingebedde agent-runner van OpenClaw. Het is
    niet van toepassing op het systeemeigen Codex-app-serverharnas, dat zijn eigen
    beurt- en plangedrag beheert; voor systeemeigen Codex-uitvoeringen is de harnasselectie belangrijker dan de
    instelling van het uitvoeringscontract.
    </Note>

  </Accordion>

  <Accordion title="Systeemeigen versus OpenAI-compatibele routes">
    OpenClaw behandelt rechtstreekse OpenAI-, Codex- en Azure OpenAI-eindpunten
    anders dan generieke OpenAI-compatibele `/v1`-proxy's:

    **Systeemeigen routes** (`openai/*`, Azure OpenAI):
    - Behoud `reasoning: { effort: "none" }` alleen voor modellen die de
      OpenAI `none`-inspanning ondersteunen
    - Laat uitgeschakelde redenering weg voor modellen of proxy's die
      `reasoning.effort: "none"` weigeren
    - Stel toolschema's standaard in op strikte modus
    - Voeg verborgen attributieheaders alleen toe op geverifieerde systeemeigen hosts (Azure
      OpenAI krijgt deze headers niet, ook al is het een systeemeigen route)
    - Behoud uitsluitend voor OpenAI bedoelde verzoekaanpassingen (`service_tier`, `store`,
      compatibiliteit voor redenering, hints voor de promptcache)

    **Proxy-/compatibele routes:**
    - Gebruik soepeler compatibiliteitsgedrag
    - Verwijder Completions `store` uit niet-systeemeigen `openai-completions`-payloads
    - Accepteer geavanceerde `params.extra_body`/`params.extraBody`-doorgeef-JSON
      voor OpenAI-compatibele Completions-proxy's
    - Accepteer `params.chat_template_kwargs` voor OpenAI-compatibele Completions-
      proxy's zoals vLLM
    - Dwing geen strikte toolschema's of uitsluitend systeemeigen headers af

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
  <Card title="Video's genereren" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="OAuth en authenticatie" href="/nl/gateway/authentication" icon="key">
    Authenticatiedetails en regels voor het hergebruik van referenties.
  </Card>
</CardGroup>
