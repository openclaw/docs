---
read_when:
    - U wilt één beheerde sleutel voor meerdere modelproviders
    - Je hebt ClawRouter-modeldetectie of quotarapportage in OpenClaw nodig
summary: Leid modellen met referentiegegevensbereik via ClawRouter en toon beheerde quota
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T09:12:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter geeft OpenClaw één beleidsgebonden sleutel voor meerdere bovenliggende modelproviders. De meegeleverde Plugin `clawrouter` detecteert alleen de modellen die voor die sleutel zijn toegestaan, routeert elk model via het opgegeven protocol en rapporteert het budget en het totale gebruik van de sleutel op de gebruiksoverzichten van OpenClaw.

Bovenliggende aanmeldgegevens en providerspecifieke doorsturing blijven in ClawRouter, zodat u nooit elke bovenliggende provider-Plugin op de OpenClaw-host hoeft te installeren of authenticeren. De Plugin wordt meegeleverd met OpenClaw (`enabledByDefault: true`); u hebt alleen uitgegeven ClawRouter-aanmeldgegevens nodig.

| Eigenschap     | Waarde                                               |
| -------------- | ---------------------------------------------------- |
| Provider       | `clawrouter`                                         |
| Plugin         | meegeleverd (opgenomen in OpenClaw)                  |
| Authenticatie  | `CLAWROUTER_API_KEY`                                 |
| Standaard-URL  | `https://clawrouter.openclaw.ai`                     |
| Modelcatalogus | Gebonden aan aanmeldgegevens via `/v1/catalog`       |
| Quota          | Maandbudget en gebruik via `/v1/usage`               |

## Aan de slag

<Steps>
  <Step title="Verkrijg gebonden aanmeldgegevens">
    Vraag uw ClawRouter-beheerder om aanmeldgegevens waarvan het beleid de providers, modellen en het maandbudget omvat die u moet gebruiken. Aanmeldgegevens worden bij uitgifte één keer weergegeven.
  </Step>
  <Step title="Configureer OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` wordt meegeleverd en is standaard ingeschakeld. Als in uw configuratie `plugins.allow` is ingesteld, voegt u `clawrouter` aan die lijst toe voordat u de Plugin inschakelt. Stel voor een aangepaste implementatie `models.providers.clawrouter.baseUrl` in op de oorsprong van ClawRouter; de standaardwaarde is `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Toegestane modellen weergeven">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Gebruik de geretourneerde modelverwijzingen exact zoals weergegeven. Ze behouden de bovenliggende naamruimte, zoals `clawrouter/openai/gpt-5.5`, `clawrouter/anthropic/claude-sonnet-4-6` of `clawrouter/google/gemini-3.5-flash`. Als `agents.defaults.models` in uw configuratie een toelatingslijst is, voegt u elke geselecteerde ClawRouter-verwijzing daaraan toe.

  </Step>
  <Step title="Selecteer een model">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    U kunt ook voor één uitvoering een geretourneerd model selecteren met `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Beheerde niet-interactieve implementatie

Bewaar de proxysleutel in de geheimeninvoer van de werklast en sla in `openclaw.json` alleen een SecretRef op. De canonieke beheerde velden zijn:

| Doel            | Configuratie- of omgevingsveld                                           |
| --------------- | ------------------------------------------------------------------------ |
| Routeroorsprong | `models.providers.clawrouter.baseUrl`                                    |
| Aanmeldgegevens | `models.providers.clawrouter.apiKey` -> SecretRef uit omgeving           |
| Geheime waarde  | `CLAWROUTER_API_KEY` in de procesomgeving van de Gateway                 |
| Standaardmodel  | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| Werklastlabel   | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (optioneel) |

Een implementatiecontroller kan bijvoorbeeld eigenaar zijn van deze JSON5-patch:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Als de implementatie `plugins.allow` instelt, behoudt u de bestaande vermeldingen en voegt u `clawrouter` toe. Valideer en pas toe zonder interactieve wizard:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

De proefuitvoering verwerkt de SecretRef, maar drukt de waarde nooit af. Als u de aanmeldgegevens wilt roteren, werkt u het externe Secret bij dat `CLAWROUTER_API_KEY` levert en start u de Gateway-werklast opnieuw, zodat de nieuwe procesomgeving wordt geladen. Het configuratiebestand en de modelverwijzing veranderen niet.

Voor een zelfstandig uit broncode gebouwde Docker-Gateway is ClawRouter al opgenomen in de hoofdruntime. Selecteer alleen de kanaal-Plugin die afzonderlijk moet worden verpakt, zoals `OPENCLAW_EXTENSIONS=clickclack`, `slack` of `msteams`; zie [uit broncode gebouwde images met geselecteerde Plugins](/nl/install/docker#source-built-images-with-selected-plugins). Archief-/appliance-implementaties moeten dezelfde opgenomen broncode via hun eigen artifactpipeline verpakken in plaats van de OCI-image te gebruiken.

## Gereedheid en live bewijs

Deze controles bewijzen verschillende grenzen; vervang de ene niet door de andere:

```bash
# Alleen de processtatus van ClawRouter; er worden geen aanmeldgegevens of bovenliggend model gebruikt.
curl -fsS https://clawrouter.internal.example/v1/health

# Alleen de opstartgereedheid van de OpenClaw-Gateway; er wordt geen modelaanroep uitgevoerd.
curl -fsS http://127.0.0.1:18789/readyz

# Catalogusdetectie gebonden aan aanmeldgegevens.
openclaw models list --all --provider clawrouter --json

# Minimale echte inferentieprobe via de geconfigureerde ClawRouter-provider.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Werklastcanary met een exacte toegestane modelverwijzing.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

Gebruik een model dat door de gebonden catalogus wordt geretourneerd in plaats van het voorbeeldmodel klakkeloos te kopiëren. Een geslaagd antwoord van `/readyz` betekent dat de Gateway verzoeken kan verwerken; het betekent niet dat ClawRouter, de bijbehorende aanmeldgegevens of een bovenliggende provider gereed is. De modelprobe en agentcanary vormen het inferentiebewijs.

Voer voor live diagnose de canary uit en controleer de standaardlogboeken van de Gateway. De bestaande modeltransportdiagnostiek met alleen metagegevens genereert regels met deze vorm:

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

De Plugin verzendt begrensde headers `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` en `X-ClawRouter-Session-Id` wanneer die identificatoren beschikbaar zijn. De Plugin koppelt ook de diagnostische `callId` (`<run-id>:model:<n>`) van de modelaanroep aan `X-Request-ID`, zodat een modelaanroepgebeurtenis van OpenClaw kan worden gekoppeld aan het auditspoor met alleen metagegevens van ClawRouter. Waarden binnen het budget van 128 tekens voor de aanvraag-id zijn identiek. Langere waarden behouden het achtervoegsel `:model:<n>` en een deterministische hash, zodat afzonderlijke aanroepen begrensd en koppelbaar blijven. Statische implementatiemetagegevens, zoals `X-ClawRouter-Project-Id`, kunnen worden ingesteld in de `headers`-map van de provider. Headers voor toeschrijving aan agent en sessie behouden hun afzonderlijke limiet van 256 tekens. Automatische aanvraag-id's met tekens buiten de ASCII-identificatorenset van ClawRouter gebruiken dezelfde deterministische begrensde vorm.
Expliciet geconfigureerde headers, met inbegrip van elke schrijfwijzevariant van `X-Request-ID`, hebben voorrang op automatische waarden. De transportdiagnostiek registreert routerings- en antwoordmetagegevens; deze registreert geen aanmeldgegevens, aanvraag-id's, prompts of voltooiingen. De eigen auditgebeurtenis van ClawRouter bevat de geselecteerde bovenliggende provider en de status van inhoudsbewaring.

## Modeldetectie

`GET /v1/catalog` retourneert `{ providers: [...] }`, waarbij elke providervermelding de eigen `models[]` vermeldt (met bovenliggende id, mogelijkheden en prijzen) en de ondersteunde aanvraagroutes. OpenClaw levert geen tweede, vaste lijst met ClawRouter-modellen. Een catalogusmodel wordt als OpenClaw-model aangeboden wanneer:

- het beleid van de aanmeldgegevens de bijbehorende provider toestaat;
- het catalogusmodel een ondersteunde LLM-mogelijkheid aanbiedt (`llm.responses`, `llm.chat`, `llm.messages` of `llm.stream` met een overeenkomende streamingroute); en
- de provider een overeenkomende route voor een van de onderstaande transporten aanbiedt.

Voor het toevoegen van een model aan een ondersteunde ClawRouter-provider is geen OpenClaw-release nodig: bij de volgende catalogusvernieuwing (60 seconden gecachet per bereik van aanmeldgegevens) wordt het gedetecteerd. Een model waarvoor een nieuw overdrachtsprotocol nodig is, vereist eerst ondersteuning door de Plugin.

## Protocol- en provider-Plugins

ClawRouter beheert de bovenliggende aanmeldgegevens; de catalogus vertelt OpenClaw welk transport moet worden gebruikt, zodat u nooit de authenticatie-Plugin van elk bovenliggend bedrijf hoeft te installeren.

| Catalogusmogelijkheid/-route                            | OpenClaw-transport     |
| ------------------------------------------------------- | ---------------------- |
| `llm.responses` (OpenAI-compatibele provider)           | `openai-responses`     |
| `llm.chat` (OpenAI-compatibele provider)                | `openai-completions`   |
| `llm.messages` + route `anthropic.messages`             | `anthropic-messages`   |
| `llm.stream` + streamingroute `google.generate_content` | `google-generative-ai` |

De Plugin past ook het bijbehorende beleid voor herhaling en toolschema's toe op die families (compatibiliteit van toolschema's voor OpenAI/DeepSeek/Gemini; systeemeigen herhalingsbeleid van Anthropic en Google Gemini). Een catalogusprovider die alleen een niet-ondersteunde aanvraagindeling aanbiedt, wordt bewust niet als OpenClaw-tekstmodel aangeboden. Normaliseer zulke providers in ClawRouter naar een van de ondersteunde contracten in plaats van een incompatibele payload te verzenden.

## Quota en gebruik

Het antwoord van `/v1/usage` van ClawRouter levert gegevens aan de gebruikelijke overzichten voor providergebruik van OpenClaw: totalen voor aanvragen, tokens en uitgaven, plus een maandbudgetvenster wanneer de sleutel een limiet heeft. Sleutels zonder meting tonen nog steeds het totale gebruik, maar zonder percentagevenster.

Voor het opzoeken van quota wordt dezelfde gebonden sleutel gebruikt als voor modeldetectie. Een mislukte quotaopvraag blokkeert de modeluitvoering niet.

Controleer de live momentopname met:

```bash
openclaw status --usage
openclaw models status
```

Dezelfde providermomentopname is beschikbaar voor `/status` in de chat en de gebruiksinterface van OpenClaw. Het budget geldt voor het volledige beleid, zodat aanvragen van een andere client die hetzelfde ClawRouter-beleid gebruikt het resterende percentage kunnen wijzigen.

## Probleemoplossing

| Symptoom                                   | Controle                                                                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geen ClawRouter-modellen                   | Controleer of de Plugin is ingeschakeld en door `plugins.allow` wordt toegestaan. Controleer vervolgens of de aanmeldgegevens actief zijn en ten minste één gereedstaande provider toestaan. |
| Een geconfigureerd ClawRouter-model ontbreekt | Controleer de mogelijkheden en routeondersteuning in `/v1/catalog`. Niet-ondersteunde transportcontracten worden bewust uitgefilterd.                                                       |
| `Unknown model: clawrouter/...`            | Voeg de exacte catalogusverwijzing toe aan `agents.defaults.models` wanneer die configuratiemap als toelatingslijst wordt gebruikt.                                                           |
| `401` of `403` van catalogus of gebruik    | Geef de ClawRouter-aanmeldgegevens opnieuw uit of pas het bereik ervan aan; OpenClaw valt niet terug op sleutels van bovenliggende providers.                                                 |
| Modelaanroep mislukt na detectie            | Controleer in ClawRouter de providerverbinding en de status van de bovenliggende service en probeer het opnieuw nadat de gereedheidsstatus is hersteld.                                      |
| Gebruik bevat totalen maar geen percentage | Het beleid heeft geen meting; voeg in ClawRouter een maandbudget toe om een percentagevenster beschikbaar te maken.                                                                          |

## Beveiligingsgedrag

- Catalogusdetectie is beperkt tot de geconfigureerde proxysleutel en wordt per referentiebereik gecachet (agentmap, werkruimtemap, authenticatieprofiel-id en basis-URL).
- De proxysleutel wordt alleen bij het verzenden van de aanvraag toegevoegd; deze wordt niet opgeslagen in modelmetadata.
- Waarden voor automatische toeschrijving en aanvraagcorrelatie worden vóór verzending ontdaan van witruimte aan de randen en geweigerd als ze besturingstekens bevatten. Toeschrijvingswaarden zijn beperkt tot 256 tekens; aanvraag-id's tot 128.
- Diagnostiek voor modeltransport bevat alleen metadata en bevat nooit de proxysleutel of modelinhoud.
- Systeemeigen Anthropic- en Gemini-model-id's worden alleen bij verzending herschreven naar hun upstream-id's.
- Niet-ondersteunde catalogusrijen of catalogusrijen waarvoor geen toestemming is verleend, worden standaard geweigerd en kunnen niet worden geselecteerd.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providerconfiguratie en modelselectie.
  </Card>
  <Card title="Gebruiksregistratie" href="/nl/concepts/usage-tracking" icon="chart-line">
    OpenClaw-oppervlakken voor gebruik en status.
  </Card>
</CardGroup>
