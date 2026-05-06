---
read_when:
    - Je wilt OpenAI-modellen gebruiken in OpenClaw
    - Je wilt Codex-abonnementsauthenticatie in plaats van API-sleutels
    - Je hebt strikter uitvoeringsgedrag voor GPT-5-agenten nodig
summary: Gebruik OpenAI via API-sleutels of een Codex-abonnement in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T19:35:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fda2acdb0e249f0481ab1aa20bb5ff317709bc9536f60c45be9e2d63c44702e
    source_path: providers/openai.md
    workflow: 16
---

OpenAI biedt ontwikkelaars-API's voor GPT-modellen, en Codex is ook beschikbaar als
ChatGPT-abonnementscode-agent via OpenAI's Codex-clients. OpenClaw houdt die
oppervlakken gescheiden zodat configuratie voorspelbaar blijft.

OpenClaw ondersteunt drie routes binnen de OpenAI-familie. De meeste ChatGPT/Codex-abonnees
die Codex-gedrag willen, moeten de native Codex-appserverruntime gebruiken. Het
modelprefix selecteert de provider-/modelnaam; een aparte runtime-instelling selecteert
wie de ingesloten agentlus uitvoert:

- **API-sleutel** - directe OpenAI Platform-toegang met gebruiksgebaseerde facturering (`openai/*`-modellen)
- **Codex-abonnement met native Codex-runtime** - ChatGPT/Codex-aanmelding plus Codex-appserveruitvoering (`openai/*`-modellen plus `agents.defaults.agentRuntime.id: "codex"`)
- **Codex-abonnement via PI** - ChatGPT/Codex-aanmelding met de normale OpenClaw PI-runner (`openai-codex/*`-modellen)

OpenAI ondersteunt expliciet het gebruik van abonnements-OAuth in externe tools en workflows zoals OpenClaw.

Provider, model, runtime en kanaal zijn afzonderlijke lagen. Als die labels
door elkaar worden gehaald, lees dan [Agentruntimes](/nl/concepts/agent-runtimes) voordat je
de configuratie wijzigt.

## Snelle keuze

| Doel                                                 | Gebruik                                          | Opmerkingen                                                               |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime    | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Aanbevolen Codex-configuratie voor de meeste gebruikers. Meld je aan met `openai-codex`-auth. |
| Directe API-sleutelfacturering                       | `openai/gpt-5.5`                                 | Stel `OPENAI_API_KEY` in of voer OpenAI API-sleutel-onboarding uit.        |
| ChatGPT/Codex-abonnementsauth via PI                 | `openai-codex/gpt-5.5`                           | Alleen gebruiken wanneer je bewust de normale PI-runner wilt.             |
| Afbeeldingen genereren of bewerken                   | `openai/gpt-image-2`                             | Werkt met `OPENAI_API_KEY` of OpenAI Codex OAuth.                         |
| Afbeeldingen met transparante achtergrond            | `openai/gpt-image-1.5`                           | Gebruik `outputFormat=png` of `webp` en `openai.background=transparent`.  |

## Naamgevingskaart

De namen lijken op elkaar, maar zijn niet onderling uitwisselbaar:

| Naam die je ziet                    | Laag              | Betekenis                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Providerprefix    | Directe OpenAI Platform-API-route.                                                                |
| `openai-codex`                     | Providerprefix    | OpenAI Codex OAuth-/abonnementsroute via de normale OpenClaw PI-runner.                           |
| `codex` plugin                     | Plugin            | Gebundelde OpenClaw-plugin die native Codex-appserverruntime en `/codex`-chatbediening biedt.     |
| `agentRuntime.id: codex`           | Agentruntime      | Forceer de native Codex-appserverharnas voor ingesloten beurten.                                  |
| `/codex ...`                       | Chatopdrachtenset | Koppel/beheer Codex-appserverthreads vanuit een gesprek.                                          |
| `runtime: "acp", agentId: "codex"` | ACP-sessieroute   | Expliciet fallbackpad dat Codex via ACP/acpx uitvoert.                                            |

Dit betekent dat een configuratie bewust zowel `openai-codex/*` als de
`codex` plugin kan bevatten. Dat is geldig wanneer je Codex OAuth via PI wilt en ook
native `/codex`-chatbediening beschikbaar wilt hebben. `openclaw doctor` waarschuwt voor die
combinatie zodat je kunt bevestigen dat dit bewust is; het herschrijft de configuratie niet.

<Note>
GPT-5.5 is beschikbaar via zowel directe OpenAI Platform-API-sleuteltoegang als
abonnements-/OAuth-routes. Voor ChatGPT/Codex-abonnement plus native Codex-
uitvoering gebruik je `openai/gpt-5.5` met `agentRuntime.id: "codex"`. Gebruik
`openai-codex/gpt-5.5` alleen voor Codex OAuth via PI, of `openai/gpt-5.5`
zonder Codex-runtime-override voor direct `OPENAI_API_KEY`-verkeer.
</Note>

<Note>
Het inschakelen van de OpenAI-plugin, of het selecteren van een `openai-codex/*`-model, schakelt
de gebundelde Codex-appserverplugin niet in. OpenClaw schakelt die plugin alleen in
wanneer je expliciet het native Codex-harnas selecteert met
`agentRuntime.id: "codex"` of een legacy `codex/*`-modelverwijzing gebruikt.
Als de gebundelde `codex` plugin is ingeschakeld maar `openai-codex/*` nog steeds
via PI wordt opgelost, waarschuwt `openclaw doctor` en blijft de route ongewijzigd.
</Note>

## OpenClaw-functiedekking

| OpenAI-mogelijkheid       | OpenClaw-oppervlak                                        | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>`-modelprovider                            | Ja                                                     |
| Codex-abonnementsmodellen | `openai-codex/<model>` met `openai-codex` OAuth           | Ja                                                     |
| Codex-appserverharnas     | `openai/<model>` met `agentRuntime.id: codex`             | Ja                                                     |
| Server-side web search    | Native OpenAI Responses-tool                               | Ja, wanneer webzoekfunctie is ingeschakeld en geen provider is vastgezet |
| Afbeeldingen              | `image_generate`                                           | Ja                                                     |
| Video's                   | `video_generate`                                           | Ja                                                     |
| Tekst-naar-spraak         | `messages.tts.provider: "openai"` / `tts`                  | Ja                                                     |
| Batch-spraak-naar-tekst   | `tools.media.audio` / mediabegrip                          | Ja                                                     |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "openai"`                | Ja                                                     |
| Realtime spraak           | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ja                                                     |
| Embeddings                | geheugenembeddingprovider                                  | Ja                                                     |

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
`queryInputType` en `documentInputType` in onder `memorySearch`. OpenClaw geeft
die door als providerspecifieke `input_type`-aanvraagvelden: query-embeddings gebruiken
`queryInputType`; geïndexeerde geheugenfragmenten en batchindexering gebruiken
`documentInputType`. Zie de [referentie voor geheugenconfiguratie](/nl/reference/memory-config#provider-specific-config) voor het volledige voorbeeld.

## Aan de slag

Kies je gewenste auth-methode en volg de installatiestappen.

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
    | `openai/gpt-5.5`       | weggelaten / `agentRuntime.id: "pi"`    | Directe OpenAI Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | weggelaten / `agentRuntime.id: "pi"`    | Directe OpenAI Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex-appserverharnas       | Codex-appserver  |

    <Note>
    `openai/*` is de directe OpenAI API-sleutelroute, tenzij je expliciet het
    Codex-appserverharnas forceert. Gebruik `openai-codex/*` voor Codex OAuth via
    de standaard PI-runner, of gebruik `openai/gpt-5.5` met
    `agentRuntime.id: "codex"` voor native Codex-appserveruitvoering.
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
    **Beste voor:** het gebruik van je ChatGPT/Codex-abonnement met native Codex-appserveruitvoering in plaats van een aparte API-sleutel. Codex cloud vereist ChatGPT-aanmelding.

    <Steps>
      <Step title="Voer Codex OAuth uit">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Of voer OAuth direct uit:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Voeg voor headless of callback-onvriendelijke configuraties `--device-code` toe om je aan te melden met een ChatGPT-device-codeflow in plaats van de localhost-browsercallback:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Gebruik de native Codex-runtime">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Controleer of Codex-auth beschikbaar is">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Nadat de gateway draait, stuur je `/codex status` of `/codex models`
        in de chat om de native appserverruntime te controleren.
      </Step>
    </Steps>

    ### Routesamenvatting

    | Modelverwijzing | Runtimeconfiguratie | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Native Codex-appserverharnas | Codex-aanmelding of geselecteerd `openai-codex`-profiel |
    | `openai-codex/gpt-5.5` | weggelaten / `runtime: "pi"` | ChatGPT/Codex OAuth via PI | Codex-aanmelding |
    | `openai-codex/gpt-5.4-mini` | weggelaten / `runtime: "pi"` | ChatGPT/Codex OAuth via PI | Codex-aanmelding |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Nog steeds PI, tenzij een plugin expliciet `openai-codex` claimt | Codex-aanmelding |

    <Warning>
    Configureer geen oudere `openai-codex/gpt-5.1*`-, `openai-codex/gpt-5.2*`- of
    `openai-codex/gpt-5.3*`-modelverwijzingen. ChatGPT/Codex OAuth-accounts weigeren
    die modellen nu. Gebruik `openai-codex/gpt-5.5` voor de PI OAuth-route, of
    `openai/gpt-5.5` met `agentRuntime.id: "codex"` voor native Codex-runtime-
    uitvoering.
    </Warning>

    <Note>
    Blijf de provider-id `openai-codex` gebruiken voor auth/profile-commando's. Het
    modelvoorvoegsel `openai-codex/*` is ook de expliciete PI-route voor Codex OAuth.
    Het selecteert of schakelt de meegeleverde Codex app-server-harness niet automatisch in. Voor
    de gebruikelijke installatie met abonnement plus native runtime, meld je aan met
    `openai-codex`, maar houd de modelverwijzing op `openai/gpt-5.5` en stel
    `agentRuntime.id: "codex"` in.
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

    Gebruik in plaats daarvan `openai-codex/gpt-5.5` en laat de Codex runtime-override weg
    om Codex OAuth op de normale PI-runner te houden.

    <Note>
    Onboarding importeert geen OAuth-materiaal meer uit `~/.codex`. Meld je aan met browser-OAuth (standaard) of de device-code-flow hierboven — OpenClaw beheert de resulterende referenties in zijn eigen agent-auth-store.
    </Note>

    ### Codex OAuth-routing controleren en herstellen

    Gebruik deze commando's om te zien welk model, welke runtime en welke auth-route je standaard
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

    Als een 2026.5.5 `doctor --fix`-run een GPT-5.5-abonnementsinstallatie heeft gewijzigd van
    `openai-codex/gpt-5.5` naar `openai/gpt-5.5`, zet de standaard agent dan terug
    naar de Codex OAuth PI-route:

    ```bash
    openclaw models set openai-codex/gpt-5.5
    openclaw config validate
    ```

    Als `models auth list --provider openai-codex` geen bruikbaar profiel toont, meld je dan
    opnieuw aan:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex/*` betekent ChatGPT/Codex OAuth via PI. `openai/*` met
    `agentRuntime.id: "codex"` betekent native Codex app-server-uitvoering.

    ### Statusindicator

    Chat `/status` toont welke modelruntime actief is voor de huidige sessie.
    De standaard PI-harness verschijnt als `Runtime: OpenClaw Pi Default`. Wanneer de
    meegeleverde Codex app-server-harness is geselecteerd, toont `/status`
    `Runtime: OpenAI Codex`. Bestaande sessies behouden hun geregistreerde harness-id, dus gebruik
    `/new` of `/reset` na het wijzigen van `agentRuntime` als je wilt dat `/status`
    een nieuwe PI/Codex-keuze weergeeft.

    ### Doctor-waarschuwing

    Als de meegeleverde `codex`-plugin is ingeschakeld terwijl een `openai-codex/*`-route is
    geselecteerd, waarschuwt `openclaw doctor` dat het model nog steeds via PI wordt opgelost.
    Houd de configuratie alleen ongewijzigd wanneer die PI-route voor abonnements-auth
    bedoeld is. Schakel over naar `openai/<model>` plus `agentRuntime.id: "codex"` wanneer
    je native Codex app-server-uitvoering wilt.

    ### Limiet contextvenster

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

    OpenClaw gebruikt upstream Codex-catalogusmetadata voor `gpt-5.5` wanneer die
    aanwezig is. Als live Codex-detectie de rij `openai-codex/gpt-5.5` weglaat terwijl
    het account is geauthenticeerd, synthetiseert OpenClaw die OAuth-modelrij zodat
    cron-, sub-agent- en geconfigureerde standaardmodelruns niet mislukken met
    `Unknown model`.

  </Tab>
</Tabs>

## Native Codex app-server-auth

De native Codex app-server-harness gebruikt `openai/*`-modelverwijzingen plus
`agentRuntime.id: "codex"`, maar de auth blijft accountgebaseerd. OpenClaw
selecteert auth in deze volgorde:

1. Een expliciet OpenClaw `openai-codex`-authprofiel dat aan de agent is gekoppeld.
2. Het bestaande account van de app-server, zoals een lokale Codex CLI ChatGPT-aanmelding.
3. Alleen voor lokale stdio app-server-starts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer de app-server geen account rapporteert en nog steeds
   OpenAI-auth vereist.

Dat betekent dat een lokale ChatGPT/Codex-abonnementsaanmelding niet wordt vervangen alleen
omdat het gateway-proces ook `OPENAI_API_KEY` heeft voor directe OpenAI-modellen
of embeddings. De fallback naar de env-API-sleutel is alleen het lokale stdio-pad zonder account; deze
wordt niet naar WebSocket app-server-verbindingen gestuurd. Wanneer een Codex-profiel in abonnementsstijl
is geselecteerd, houdt OpenClaw ook `CODEX_API_KEY` en `OPENAI_API_KEY`
buiten het gespawnde stdio app-server-childproces en stuurt het de geselecteerde referenties
via de app-server-login-RPC.

## Afbeeldingen genereren

De meegeleverde `openai`-plugin registreert afbeeldingsgeneratie via de tool `image_generate`.
Deze ondersteunt zowel afbeeldingsgeneratie met OpenAI API-sleutel als afbeeldingsgeneratie met Codex OAuth
via dezelfde modelverwijzing `openai/gpt-image-2`.

| Mogelijkheid             | OpenAI API-sleutel                 | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modelverwijzing           | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth-aanmelding        |
| Transport                 | OpenAI Images API                  | Codex Responses-backend              |
| Max. afbeeldingen per verzoek | 4                              | 4                                    |
| Bewerkmodus               | Ingeschakeld (tot 5 referentieafbeeldingen) | Ingeschakeld (tot 5 referentieafbeeldingen) |
| Grootte-overrides         | Ondersteund, inclusief 2K/4K-formaten | Ondersteund, inclusief 2K/4K-formaten |
| Beeldverhouding / resolutie | Niet doorgestuurd naar OpenAI Images API | Toegewezen aan een ondersteunde grootte wanneer dat veilig is |

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
Zie [Afbeeldingen genereren](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failover-gedrag.
</Note>

`gpt-image-2` is de standaard voor zowel OpenAI tekst-naar-afbeelding-generatie als het
bewerken van afbeeldingen. `gpt-image-1.5`, `gpt-image-1` en `gpt-image-1-mini` blijven bruikbaar als
expliciete model-overrides. Gebruik `openai/gpt-image-1.5` voor PNG/WebP-uitvoer met transparante achtergrond;
de huidige `gpt-image-2`-API wijst
`background: "transparent"` af.

Voor een verzoek met transparante achtergrond moeten agents `image_generate` aanroepen met
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` of `"webp"`, en
`background: "transparent"`; de oudere provideroptie `openai.background` wordt
nog steeds geaccepteerd. OpenClaw beschermt ook de openbare OpenAI- en
OpenAI Codex OAuth-routes door standaard transparante verzoeken voor `openai/gpt-image-2`
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

Houd voor Codex OAuth-installaties dezelfde verwijzing `openai/gpt-image-2`. Wanneer een
OAuth-profiel `openai-codex` is geconfigureerd, lost OpenClaw dat opgeslagen OAuth-
toegangstoken op en stuurt het afbeeldingsverzoeken via de Codex Responses-backend. Het
probeert niet eerst `OPENAI_API_KEY` en valt voor dat
verzoek niet stilzwijgend terug op een API-sleutel. Configureer `models.providers.openai` expliciet met een API-sleutel,
aangepaste basis-URL of Azure-endpoint wanneer je in plaats daarvan de directe OpenAI Images API-
route wilt.
Als dat aangepaste afbeeldingsendpoint zich op een vertrouwd LAN/privéadres bevindt, stel dan ook
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in; OpenClaw houdt
privé/interne OpenAI-compatibele afbeeldingsendpoints geblokkeerd tenzij deze opt-in
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

De meegeleverde `openai`-plugin registreert videogeneratie via de tool `video_generate`.

| Mogelijkheid       | Waarde                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Standaardmodel    | `openai/sora-2`                                                                   |
| Modi            | Tekst-naar-video, afbeelding-naar-video, bewerking van één video                  |
| Referentie-invoer | 1 afbeelding of 1 video                                                           |
| Grootte-overrides   | Ondersteund                                                                      |
| Overige overrides  | `aspectRatio`, `resolution`, `audio`, `watermark` worden genegeerd met een toolwaarschuwing |

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
Zie [Video genereren](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failover-gedrag.
</Note>

## GPT-5-promptbijdrage

OpenClaw voegt een gedeelde GPT-5-promptbijdrage toe voor GPT-5-family-runs over providers heen. Deze wordt toegepast op basis van model-id, dus `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` en andere compatibele GPT-5-verwijzingen krijgen dezelfde overlay. Oudere GPT-4.x-modellen niet.

De meegeleverde native Codex-harness gebruikt hetzelfde GPT-5-gedrag en dezelfde heartbeat-overlay via Codex app-server developer instructions, dus `openai/gpt-5.x`-sessies die via `agentRuntime.id: "codex"` worden afgedwongen, behouden dezelfde begeleiding voor opvolging en proactieve heartbeat, ook al beheert Codex de rest van de harness-prompt.

De GPT-5-bijdrage voegt een getagd gedragscontract toe voor persona-persistentie, uitvoeringsveiligheid, tooldiscipline, uitvoervorm, voltooiingscontroles en verificatie. Kanaalspecifiek antwoord- en silent-message-gedrag blijft in de gedeelde OpenClaw-systeemprompt en het beleid voor uitgaande levering. De GPT-5-begeleiding is altijd ingeschakeld voor overeenkomende modellen. De vriendelijke interactiestijllaag is afzonderlijk en configureerbaar.

| Waarde                  | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (standaard) | Schakel de vriendelijke interactiestijllaag in |
| `"on"`                 | Alias voor `"friendly"`                      |
| `"off"`                | Schakel alleen de vriendelijke stijllaag uit       |

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
Legacy `plugins.entries.openai.config.personality` wordt nog steeds gelezen als compatibiliteitsfallback wanneer de gedeelde instelling `agents.defaults.promptOverlays.gpt5.personality` niet is ingesteld.
</Note>

## Stem en spraak

<AccordionGroup>
  <Accordion title="Spraaksynthese (TTS)">
    De gebundelde `openai`-plugin registreert spraaksynthese voor het `messages.tts`-oppervlak.

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

    `extraBody` wordt samengevoegd in de JSON voor het `/audio/speech`-verzoek na de door OpenClaw gegenereerde velden, dus gebruik dit voor OpenAI-compatibele endpoints die extra sleutels zoals `lang` vereisen. Prototypesleutels worden genegeerd.

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
    Stel `OPENAI_TTS_BASE_URL` in om de TTS-basis-URL te overschrijven zonder het endpoint van de chat-API te beïnvloeden.
    </Note>

  </Accordion>

  <Accordion title="Spraak-naar-tekst">
    De gebundelde `openai`-plugin registreert batch-spraak-naar-tekst via
    OpenClaw's transcriptieoppervlak voor mediabegrip.

    - Standaardmodel: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Invoerpad: multipart-upload van audiobestand
    - Ondersteund door OpenClaw overal waar transcriptie van inkomende audio
      `tools.media.audio` gebruikt, inclusief Discord-spraakkanaalsegmenten en
      audiobijlagen van kanalen

    OpenAI afdwingen voor transcriptie van inkomende audio:

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

    Taal- en prompt-hints worden doorgestuurd naar OpenAI wanneer ze worden
    geleverd door de gedeelde audiomediaconfiguratie of per-call transcriptieverzoek.

  </Accordion>

  <Accordion title="Realtime transcriptie">
    De gebundelde `openai`-plugin registreert realtime transcriptie voor de Voice Call-plugin.

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

  <Accordion title="Realtime stem">
    De gebundelde `openai`-plugin registreert realtime stem voor de Voice Call-plugin.

    | Instelling | Configuratiepad | Standaard |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stem | `...openai.voice` | `alloy` |
    | Temperatuur | `...openai.temperature` | `0.8` |
    | VAD-drempel | `...openai.vadThreshold` | `0.5` |
    | Stilteduur | `...openai.silenceDurationMs` | `500` |
    | API-sleutel | `...openai.apiKey` | Valt terug op `OPENAI_API_KEY` |

    <Note>
    Ondersteunt Azure OpenAI via de configuratiesleutels `azureEndpoint` en `azureDeployment` voor realtime bridges aan de backend. Ondersteunt bidirectionele toolaanroepen. Gebruikt het G.711 u-law-audioformaat.
    </Note>

    <Note>
    Control UI Talk gebruikt realtime OpenAI-browsersessies met een door de Gateway
    gemaakte tijdelijke client secret en een directe WebRTC SDP-uitwisseling in de browser met de
    OpenAI Realtime API. Live verificatie voor maintainers is beschikbaar met
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    het OpenAI-deel maakt een client secret in Node, genereert een SDP-aanbod in de browser
    met nep-microfoonmedia, plaatst dit bij OpenAI en past het SDP-antwoord toe
    zonder secrets te loggen.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-endpoints

De gebundelde `openai`-provider kan een Azure OpenAI-resource gebruiken voor afbeeldingsgeneratie
door de basis-URL te overschrijven. Op het pad voor afbeeldingsgeneratie detecteert OpenClaw
Azure-hostnamen op `models.providers.openai.baseUrl` en schakelt automatisch over naar
de verzoekvorm van Azure.

<Note>
Realtime stem gebruikt een afzonderlijk configuratiepad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
en wordt niet beïnvloed door `models.providers.openai.baseUrl`. Zie de accordion **Realtime
stem** onder [Stem en spraak](#voice-and-speech) voor de Azure-instellingen.
</Note>

Gebruik Azure OpenAI wanneer:

- Je al een Azure OpenAI-abonnement, quota of enterprise-overeenkomst hebt
- Je regionale datalocatie of compliancecontroles nodig hebt die Azure biedt
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

Voor verzoeken voor afbeeldingsgeneratie op een herkende Azure-host doet OpenClaw het volgende:

- Verstuurt de header `api-key` in plaats van `Authorization: Bearer`
- Gebruikt implementatiegebonden paden (`/openai/deployments/{deployment}/...`)
- Voegt `?api-version=...` toe aan elk verzoek
- Gebruikt een standaard time-out van 600 s voor Azure-aanroepen voor afbeeldingsgeneratie.
  Per-call `timeoutMs`-waarden overschrijven deze standaard nog steeds.

Andere basis-URL's (publieke OpenAI, OpenAI-compatibele proxy's) behouden de standaard
OpenAI-verzoekvorm voor afbeeldingen.

<Note>
Azure-routing voor het pad voor afbeeldingsgeneratie van de `openai`-provider vereist
OpenClaw 2026.4.22 of later. Eerdere versies behandelen elke aangepaste
`openai.baseUrl` als het publieke OpenAI-endpoint en mislukken bij Azure-
afbeeldingsimplementaties.
</Note>

### API-versie

Stel `AZURE_OPENAI_API_VERSION` in om een specifieke Azure-preview- of GA-versie vast te zetten
voor het Azure-pad voor afbeeldingsgeneratie:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

De standaard is `2024-12-01-preview` wanneer de variabele niet is ingesteld.

### Modelnamen zijn implementatienamen

Azure OpenAI koppelt modellen aan implementaties. Voor Azure-verzoeken voor afbeeldingsgeneratie
die via de gebundelde `openai`-provider worden gerouteerd, moet het veld `model` in OpenClaw
de **Azure-implementatienaam** zijn die je in de Azure-portal hebt geconfigureerd, niet
de publieke OpenAI-model-id.

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
implementatie maakt, en bevestig dat het specifieke model in jouw regio wordt aangeboden.

### Parameterverschillen

Azure OpenAI en publieke OpenAI accepteren niet altijd dezelfde afbeeldingsparameters.
Azure kan opties weigeren die publieke OpenAI toestaat (bijvoorbeeld bepaalde
`background`-waarden op `gpt-image-2`) of ze alleen beschikbaar stellen op specifieke modelversies.
Deze verschillen komen van Azure en het onderliggende model, niet van OpenClaw.
Als een Azure-verzoek mislukt met een validatiefout, controleer dan de parameterset die door
jouw specifieke implementatie en API-versie in de Azure-portal wordt ondersteund.

<Note>
Azure OpenAI gebruikt native transport en compat-gedrag maar ontvangt niet
de verborgen attributieheaders van OpenClaw — zie de accordion **Native versus OpenAI-compatibele
routes** onder [Geavanceerde configuratie](#advanced-configuration).

Voor chat- of Responses-verkeer op Azure (naast afbeeldingsgeneratie) gebruik je de
onboardingflow of een speciale Azure-providerconfiguratie — `openai.baseUrl` alleen
neemt de Azure API-/auth-vorm niet over. Er bestaat een afzonderlijke
`azure-openai-responses/*`-provider; zie de accordion over server-side Compaction hieronder.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Transport (WebSocket versus SSE)">
    OpenClaw gebruikt WebSocket-first met SSE-fallback (`"auto"`) voor zowel `openai/*` als `openai-codex/*`.

    In de modus `"auto"` doet OpenClaw het volgende:
    - Probeert één vroege WebSocket-fout opnieuw voordat wordt teruggevallen op SSE
    - Markeert WebSocket na een fout ongeveer 60 seconden als degraded en gebruikt SSE tijdens de afkoelperiode
    - Voegt stabiele sessie- en turn-identiteitsheaders toe voor retries en reconnects
    - Normaliseert gebruikstellers (`input_tokens` / `prompt_tokens`) over transportvarianten heen

    | Waarde | Gedrag |
    |-------|----------|
    | `"auto"` (standaard) | WebSocket eerst, SSE-fallback |
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

  <Accordion title="WebSocket-warm-up">
    OpenClaw schakelt WebSocket-warm-up standaard in voor `openai/*` en `openai-codex/*` om de latentie van de eerste turn te verlagen.

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

    Wanneer ingeschakeld koppelt OpenClaw de snelle modus aan OpenAI-prioriteitsverwerking (`service_tier = "priority"`). Bestaande `service_tier`-waarden blijven behouden, en de snelle modus herschrijft `reasoning` of `text.verbosity` niet.

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
    Sessie-overschrijvingen gaan boven configuratie. Als je de sessie-overschrijving in de Sessions-UI wist, keert de sessie terug naar de geconfigureerde standaardwaarde.
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

    Dit geldt voor het ingebouwde Pi-harness-pad en voor OpenAI-providerhooks die door ingesloten runs worden gebruikt. De native Codex app-server harness beheert zijn eigen context via Codex en wordt apart geconfigureerd met `agents.defaults.agentRuntime.id`.

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
    Voor runs uit de GPT-5-familie op `openai/*` kan OpenClaw een strikter ingesloten uitvoeringscontract gebruiken:

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
    - Behandelt OpenClaw een beurt met alleen een plan niet langer als succesvolle voortgang wanneer een toolactie beschikbaar is
    - Probeert OpenClaw de beurt opnieuw met een aansporing om nu te handelen
    - Schakelt OpenClaw `update_plan` automatisch in voor substantieel werk
    - Toont OpenClaw een expliciete geblokkeerde status als het model blijft plannen zonder te handelen

    <Note>
    Alleen van toepassing op runs uit de OpenAI- en Codex GPT-5-familie. Andere providers en oudere modelfamilies behouden het standaardgedrag.
    </Note>

  </Accordion>

  <Accordion title="Native versus OpenAI-compatibele routes">
    OpenClaw behandelt directe OpenAI-, Codex- en Azure OpenAI-eindpunten anders dan generieke OpenAI-compatibele `/v1`-proxy's:

    **Native routes** (`openai/*`, Azure OpenAI):
    - Behouden `reasoning: { effort: "none" }` alleen voor modellen die de OpenAI-waarde `none` voor effort ondersteunen
    - Laten uitgeschakelde reasoning weg voor modellen of proxy's die `reasoning.effort: "none"` weigeren
    - Stellen toolschema's standaard in op strikte modus
    - Voegen verborgen attributieheaders alleen toe op geverifieerde native hosts
    - Behouden request-shaping die alleen voor OpenAI geldt (`service_tier`, `store`, reasoning-compatibiliteit, prompt-cache-hints)

    **Proxy-/compatibele routes:**
    - Gebruiken losser compatibiliteitsgedrag
    - Verwijderen Completions `store` uit niet-native `openai-completions`-payloads
    - Accepteren geavanceerde JSON-doorgifte via `params.extra_body`/`params.extraBody` voor OpenAI-compatibele Completions-proxy's
    - Accepteren `params.chat_template_kwargs` voor OpenAI-compatibele Completions-proxy's zoals vLLM
    - Forceren geen strikte toolschema's of headers die alleen voor native routes gelden

    Azure OpenAI gebruikt native transport en compatibiliteitsgedrag, maar ontvangt de verborgen attributieheaders niet.

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
  <Card title="OAuth en authenticatie" href="/nl/gateway/authentication" icon="key">
    Authenticatiedetails en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
