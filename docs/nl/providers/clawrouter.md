---
read_when:
    - Je wilt één beheerde sleutel voor meerdere modelproviders
    - Je hebt ClawRouter-modeldetectie of quotarapportage in OpenClaw nodig
summary: Routeer modellen met referentiebereik via ClawRouter en toon beheerde quota's
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T16:14:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter geeft OpenClaw één beleidsspecifieke sleutel voor meerdere upstream-modelproviders. De gebundelde Plugin `clawrouter` detecteert alleen de modellen die voor die sleutel zijn toegestaan, routeert elk model via het opgegeven protocol en rapporteert het budget en het totale gebruik van de sleutel in de gebruiksoverzichten van OpenClaw.

Upstream-aanmeldgegevens en providerspecifieke doorsturing blijven in ClawRouter, zodat je nooit elke upstream-providerplugin op de OpenClaw-host hoeft te installeren of authenticeren. De Plugin wordt gebundeld met OpenClaw geleverd (`enabledByDefault: true`); je hebt alleen een uitgegeven ClawRouter-aanmeldgegeven nodig.

| Eigenschap    | Waarde                                   |
| ------------- | ---------------------------------------- |
| Provider      | `clawrouter`                       |
| Plugin        | gebundeld (opgenomen in OpenClaw)        |
| Authenticatie | `CLAWROUTER_API_KEY`                       |
| Standaard-URL | `https://clawrouter.openclaw.ai`                       |
| Modelcatalogus | Aanmeldgegevengebonden via `/v1/catalog` |
| Quota         | Maandelijks budget en gebruik via `/v1/usage` |

## Aan de slag

<Steps>
  <Step title="Een specifiek aanmeldgegeven verkrijgen">
    Vraag je ClawRouter-beheerder om een aanmeldgegeven waarvan het beleid de providers, modellen en het maandelijkse budget omvat die je moet gebruiken. Aanmeldgegevens worden bij uitgifte één keer weergegeven.
  </Step>
  <Step title="OpenClaw configureren">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` is gebundeld en standaard ingeschakeld. Als je configuratie `plugins.allow` instelt, voeg je `clawrouter` aan die lijst toe voordat je deze inschakelt. Stel voor een aangepaste implementatie `models.providers.clawrouter.baseUrl` in op de ClawRouter-oorsprong; de standaardwaarde is `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Toegekende modellen weergeven">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Gebruik de geretourneerde modelreferenties precies zoals weergegeven. Ze behouden de upstream-naamruimte, zoals `clawrouter/openai/gpt-5.5`, `clawrouter/anthropic/claude-sonnet-4-6` of `clawrouter/google/gemini-3.5-flash`. Als `agents.defaults.models` een toelatingslijst in je configuratie is, voeg je elke geselecteerde ClawRouter-referentie eraan toe.

  </Step>
  <Step title="Een model selecteren">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Je kunt ook een geretourneerd model voor één uitvoering selecteren met `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Beheerde niet-interactieve implementatie

Bewaar de proxysleutel in de geheiminjectie van de workload en sla alleen een SecretRef op in `openclaw.json`. De canonieke beheerde velden zijn:

| Doel          | Configuratie- of omgevingsveld                                           |
| ------------- | ------------------------------------------------------------------------ |
| Routeroorsprong | `models.providers.clawrouter.baseUrl`                                                     |
| Aanmeldgegeven | `models.providers.clawrouter.apiKey` -> SecretRef voor omgeving                           |
| Geheime waarde | `CLAWROUTER_API_KEY` in de procesomgeving van de Gateway                  |
| Standaardmodel | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`                                |
| Workloadlabel | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (optioneel)                                           |

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

Als de implementatie `plugins.allow` instelt, behoud je de bestaande vermeldingen en voeg je `clawrouter` toe. Valideer en pas toe zonder interactieve wizard:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

De proefuitvoering lost de SecretRef op, maar drukt de waarde nooit af. Om het aanmeldgegeven te roteren, werk je het externe Secret bij dat `CLAWROUTER_API_KEY` levert en start je de Gateway-workload opnieuw, zodat de nieuwe procesomgeving wordt geladen. Het configuratiebestand en de modelreferentie veranderen niet.

Voor een zelfstandig vanuit broncode gebouwde Docker-Gateway is ClawRouter al opgenomen in de hoofdruntime. Selecteer alleen de kanaalplugin die afzonderlijk moet worden verpakt, zoals `OPENCLAW_EXTENSIONS=clickclack`, `slack` of `msteams`; zie [vanuit broncode gebouwde images met geselecteerde plugins](/nl/install/docker#source-built-images-with-selected-plugins).
Archief-/appliance-implementaties moeten dezelfde opgenomen broncode via hun eigen artefactpijplijn verpakken in plaats van de OCI-image te gebruiken.

## Gereedheid en live-bewijs

Deze controles bewijzen verschillende grenzen; vervang de ene niet door de andere:

```bash
# Alleen de status van het ClawRouter-proces; er wordt geen aanmeldgegeven of upstream-model gebruikt.
curl -fsS https://clawrouter.internal.example/v1/health

# Alleen de opstartgereedheid van de OpenClaw-Gateway; er wordt geen modelaanroep uitgevoerd.
curl -fsS http://127.0.0.1:18789/readyz

# Catalogusdetectie binnen het bereik van het aanmeldgegeven.
openclaw models list --all --provider clawrouter --json

# Minimale echte inferentieproef via de geconfigureerde ClawRouter-provider.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Workload-canary met een exacte toegekende modelreferentie.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Antwoord exact: CLAWROUTER_CANARY_OK" \
  --json
```

Gebruik een model dat door de specifieke catalogus wordt geretourneerd in plaats van het voorbeeldmodel klakkeloos te kopiëren. Een geslaagd `/readyz`-antwoord betekent dat de Gateway verzoeken kan verwerken; het beweert niet dat ClawRouter, het aanmeldgegeven of een upstream-provider gereed is. De modelproef en agent-canary vormen het inferentiebewijs.

Voer voor live-diagnose de canary uit en inspecteer de standaardlogboeken van de Gateway. De bestaande modeltransportdiagnostiek met alleen metagegevens produceert regels met deze vorm:

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

De Plugin verzendt begrensde headers `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` en `X-ClawRouter-Session-Id` wanneer die identificatoren beschikbaar zijn. Deze wijst ook de diagnostische `callId` (`<run-id>:model:<n>`) van de modelaanroep toe aan `X-Request-ID`, zodat een OpenClaw-modelaanroepgebeurtenis kan worden gekoppeld aan ClawRouters audittrail met alleen metagegevens. Waarden binnen het budget van 128 tekens voor de aanvraag-ID zijn identiek. Langere waarden behouden het achtervoegsel `:model:<n>` en een deterministische hash, zodat afzonderlijke aanroepen begrensd en koppelbaar blijven. Statische implementatiemetagegevens zoals `X-ClawRouter-Project-Id` kunnen worden ingesteld in de providertoewijzing `headers`.
Headers voor agent- en sessietoewijzing behouden hun afzonderlijke limiet van 256 tekens. Automatische aanvraag-ID's met tekens buiten de ASCII-identificatorenset van ClawRouter gebruiken dezelfde deterministische begrensde vorm.
Expliciet geconfigureerde headers, inclusief elke variant in hoofdlettergebruik van `X-Request-ID`, hebben voorrang op automatische waarden. De transportdiagnostiek registreert routerings- en antwoordmetagegevens; deze logt geen aanmeldgegevens, aanvraag-ID's, prompts of voltooiingen. ClawRouters eigen auditgebeurtenis bevat de geselecteerde upstream-provider en de status van inhoudsbewaring.

## Modeldetectie

`GET /v1/catalog` retourneert `{ providers: [...] }`, waarbij elke providervermelding de eigen `models[]` (met upstream-ID, mogelijkheden en prijzen) en ondersteunde aanvraagroutes vermeldt. OpenClaw levert geen tweede, vaste lijst met ClawRouter-modellen. Een catalogusmodel wordt als OpenClaw-model aangeboden wanneer:

- het beleid van het aanmeldgegeven de provider toestaat;
- het catalogusmodel een ondersteunde LLM-mogelijkheid aanbiedt (`llm.responses`, `llm.chat`, `llm.messages` of `llm.stream` met een overeenkomende streamingroute); en
- de provider een overeenkomende route voor een van de onderstaande transporten aanbiedt.

Voor het toevoegen van een model aan een ondersteunde ClawRouter-provider is geen OpenClaw-release nodig: de volgende catalogusvernieuwing (60 seconden per aanmeldgegevensbereik in de cache) detecteert het. Een model dat een nieuw wire-protocol vereist, heeft eerst ondersteuning door de Plugin nodig.

## Protocol- en providerplugins

ClawRouter beheert upstream-aanmeldgegevens; de catalogus vertelt OpenClaw welk transport moet worden gebruikt, zodat je niet de authenticatieplugin van elk upstream-bedrijf hoeft te installeren.

| Catalogusmogelijkheid/-route                           | OpenClaw-transport     |
| ------------------------------------------------------ | ---------------------- |
| `llm.responses` (OpenAI-compatibele provider)       | `openai-responses`     |
| `llm.chat` (OpenAI-compatibele provider)       | `openai-completions`     |
| `llm.messages` + route `anthropic.messages`          | `anthropic-messages`     |
| `llm.stream` + streamingroute `google.generate_content` | `google-generative-ai`     |

De Plugin past ook het overeenkomende replay- en toolschemabeleid voor die families toe (toolschemacompatibiliteit voor OpenAI/DeepSeek/Gemini/Perplexity; native replaybeleid voor Anthropic en Google Gemini). Perplexity-modellen krijgen een strikte schemaherschrijving: `patternProperties` en `additionalProperties` worden verwijderd en elk objectschema declareert `properties`, omdat Perplexity toolschema's zonder deze elementen weigert. Een catalogusprovider die alleen een niet-ondersteunde aanvraagindeling aanbiedt, wordt bewust niet als OpenClaw-tekstmodel aangeboden. Normaliseer die providers in ClawRouter naar een van de ondersteunde contracten in plaats van een incompatibele payload te verzenden.

## Quota en gebruik

Het `/v1/usage`-antwoord van ClawRouter voedt de normale OpenClaw-overzichten voor providergebruik: totalen voor aanvragen, tokens en uitgaven, plus een maandelijks budgetvenster wanneer de sleutel een limiet heeft. Sleutels zonder meter tonen nog steeds het totale gebruik zonder percentagevenster.

Voor het opzoeken van quota wordt dezelfde specifieke sleutel gebruikt als voor modeldetectie. Een mislukte quotaopzoeking blokkeert de modeluitvoering niet.

Controleer de live-momentopname met:

```bash
openclaw status --usage
openclaw models status
```

Dezelfde providermomentopname is beschikbaar voor `/status` in de chat en in de gebruiksinterface van OpenClaw. Het budget geldt voor het hele beleid, dus aanvragen van een andere client die hetzelfde ClawRouter-beleid gebruikt, kunnen het resterende percentage wijzigen.

## Problemen oplossen

| Symptoom                                 | Controle                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Geen ClawRouter-modellen                 | Controleer of de Plugin is ingeschakeld en toegestaan door `plugins.allow` en controleer vervolgens of het aanmeldgegeven actief is en toegang geeft tot ten minste één gereedstaande provider. |
| Een geconfigureerd ClawRouter-model ontbreekt | Inspecteer de mogelijkheid `/v1/catalog` en de routeondersteuning. Niet-ondersteunde transportcontracten worden bewust gefilterd.       |
| `Unknown model: clawrouter/...`                       | Voeg de exacte catalogusreferentie toe aan `agents.defaults.models` wanneer die configuratietoewijzing als toelatingslijst wordt gebruikt.          |
| `401` of `403` uit catalogus of gebruik | Geef het ClawRouter-aanmeldgegeven opnieuw uit of wijzig het bereik ervan; OpenClaw valt niet terug op upstream-providersleutels. |
| Modelaanroep mislukt na detectie          | Controleer de providerverbinding en upstream-status in ClawRouter en probeer het opnieuw nadat de gereedheidsstatus is hersteld.              |
| Gebruik bevat totalen maar geen percentage | Het beleid heeft geen meter; voeg in ClawRouter een maandelijks budget toe om een percentagevenster beschikbaar te maken.                    |

## Beveiligingsgedrag

- Catalogusdetectie is beperkt tot de geconfigureerde proxysleutel en wordt per referentiebereik in de cache opgeslagen (agentmap, werkruimtemap, authenticatieprofiel-id en basis-URL).
- De proxysleutel wordt alleen bij het verzenden van de aanvraag toegevoegd; deze wordt niet opgeslagen in modelmetadata.
- Waarden voor automatische bronvermelding en aanvraagcorrelatie worden vóór verzending ingekort en geweigerd als ze besturingstekens bevatten. Waarden voor bronvermelding zijn beperkt tot 256 tekens; aanvraag-id's tot 128.
- Diagnostische gegevens over modeltransport bevatten alleen metadata en nooit de proxysleutel of modelinhoud.
- Systeemeigen model-id's van Anthropic en Gemini worden alleen bij verzending herschreven naar hun upstream-id's.
- Niet-ondersteunde catalogusrijen of catalogusrijen waarvoor geen toestemming is verleend, worden standaard geweigerd en kunnen niet worden geselecteerd.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providerconfiguratie en modelselectie.
  </Card>
  <Card title="Gebruiksregistratie" href="/nl/concepts/usage-tracking" icon="chart-line">
    Oppervlakken voor gebruik en status van OpenClaw.
  </Card>
</CardGroup>
